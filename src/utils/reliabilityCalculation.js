import { sql } from "../config/db.js";

/**
 * Calcule le score de fiabilité (reliability_score) adapté à la plateforme Services App
 * 
 * Facteurs inclus:
 * 1. Moyenne des notes (reçues): 25%
 * 2. Taux de missions terminées: 17%
 * 3. Rapidité d'acceptation: 8%
 * 4. Nombre de services actifs: 7%
 * 5. Complétude du profil: 7%
 * 6. Badges obtenus: 7%
 * 7. Paiements complétés: 6%
 * 8. Temps de réponse chat: 5%
 * 9. Avis laissés (participation): 6%
 * 10. Taux d'annulation: -10%
 */
export async function calculateReliabilityScore(userId) {
  try {
    // 1️⃣ NOTES ET AVIS REÇUES (25%)
    const [ratingData] = await sql`
      SELECT 
        COALESCE(AVG(r.rating), 0)::float AS avg_rating,
        COUNT(r.id)::int AS total_ratings,
        COALESCE(AVG(CASE WHEN r.created_at > NOW() - INTERVAL '3 months' THEN r.rating END), 0)::float AS recent_avg_rating
      FROM reviews r
      JOIN bookings b ON b.id = r.booking_id
      WHERE b.provider_id = ${userId}
    `;
    
    // Favorer les avis récents (75% avis récents + 25% moyenne globale)
    const ratingScore = ((ratingData.recent_avg_rating * 0.75 + ratingData.avg_rating * 0.25) / 5) * 100;
    const ratingWeight = 0.25; // 25%

    // 2️⃣ TAUX DE MISSIONS TERMINÉES (17%)
    const [completionData] = await sql`
      SELECT 
        COUNT(*)::int FILTER (WHERE status = 'completed') AS completed,
        COUNT(*)::int AS total
      FROM bookings
      WHERE provider_id = ${userId}
    `;

    const completionRate = completionData.total > 0
      ? (completionData.completed / completionData.total) * 100
      : 0;
    const completionWeight = 0.17; // 17%

    // 3️⃣ RAPIDITÉ D'ACCEPTATION BOOKING (8%)
    const [acceptanceSpeedData] = await sql`
      SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM (accepted_at - created_at)) / 60)::float, 0) AS avg_acceptance_minutes
      FROM bookings
      WHERE provider_id = ${userId} AND status IN ('accepted', 'completed')
    `;
    
    // Plus rapide = meilleur. Si < 5min = 100%, 60min = 50%, >120min = 0%
    const avgAcceptanceMin = acceptanceSpeedData.avg_acceptance_minutes || 60;
    let acceptanceScore = 100;
    if (avgAcceptanceMin > 5) {
      acceptanceScore = Math.max(0, 100 - (avgAcceptanceMin / 120) * 100);
    }
    const acceptanceWeight = 0.08; // 8%

    // 4️⃣ NOMBRE DE SERVICES ACTIFS (7%)
    const [servicesData] = await sql`
      SELECT 
        COUNT(*)::int AS active_services,
        COALESCE(AVG(average_rating)::float, 0) AS services_avg_rating
      FROM services
      WHERE user_id = ${userId} AND status = 'active'
    `;
    
    // Bonus pour avoir 3+ services (max 100%), après ça plafonne
    const servicesScore = Math.min(100, (servicesData.active_services / 3) * 100);
    const servicesWeight = 0.07; // 7%

    // 5️⃣ COMPLÉTUDE DU PROFIL (7%)
    const [profileData] = await sql`
      SELECT 
        CASE WHEN avatar_url IS NOT NULL THEN 1 ELSE 0 END AS has_avatar,
        CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END AS has_bio,
        CASE WHEN certified = true THEN 1 ELSE 0 END AS is_certified
      FROM profiles
      WHERE user_id = ${userId}
    `;
    
    const profileCompleteness = profileData 
      ? ((profileData.has_avatar + profileData.has_bio + profileData.is_certified) / 3) * 100
      : 50; // 50 si pas de profil
    const profileWeight = 0.07; // 7%

    // 6️⃣ BADGES OBTENUS (7%)
    const [badgesData] = await sql`
      SELECT 
        COUNT(*)::int AS total_badges
      FROM user_badges
      WHERE user_id = ${userId}
    `;
    
    // Bonus pour badges : 0 badge = 0%, 5+ badges = 100%
    const badgesScore = Math.min(100, (badgesData.total_badges / 5) * 100);
    const badgesWeight = 0.07; // 7%

    // 7️⃣ PAIEMENTS COMPLÉTÉS (6%)
    const [paymentsData] = await sql`
      SELECT 
        COUNT(*)::int FILTER (WHERE status = 'completed') AS completed_payments,
        COUNT(*)::int AS total_payments
      FROM bookings
      WHERE provider_id = ${userId} AND status = 'completed'
    `;
    
    const paymentCompletionRate = paymentsData.total_payments > 0
      ? (paymentsData.completed_payments / paymentsData.total_payments) * 100
      : 50;
    const paymentsWeight = 0.06; // 6%

    // 8️⃣ TEMPS DE RÉPONSE CHAT (5%)
    const [responseTimeData] = await sql`
      SELECT 
        COALESCE(AVG(EXTRACT(EPOCH FROM (m.created_at - b.created_at)) / 3600)::float, 0) AS avg_response_hours
      FROM bookings b
      LEFT JOIN messages m ON m.booking_id = b.id AND m.sender_id != b.provider_id
      WHERE b.provider_id = ${userId}
      AND m.id IS NOT NULL
      AND m.created_at > b.created_at
      LIMIT 100 -- Limiter pour performance
    `;

    const avgResponseHours = responseTimeData.avg_response_hours || 24;
    let responseScore = 100;
    if (avgResponseHours > 1) {
      responseScore = Math.max(0, 100 - (avgResponseHours / 48) * 100);
    }
    const responseWeight = 0.05; // 5%

    // 9️⃣ AVIS LAISSÉS - PARTICIPATION (6%)
    const [reviewsLeftData] = await sql`
      SELECT 
        COUNT(*)::int AS total_reviews_left,
        COALESCE(AVG(rating)::float, 0) AS avg_rating_given
      FROM reviews
      WHERE reviewer_id = ${userId}
    `;
    
    // Bonus pour avis laissés : récompense chaque avis + qualité des avis
    // 0 avis = 0%, 5+ avis = 100%
    const reviewsLeftScore = Math.min(100, (reviewsLeftData.total_reviews_left / 5) * 100);
    const reviewsLeftWeight = 0.06; // 6%

    // 🔟 TAUX D'ANNULATION (Pénalité -10%)
    const cancellationRate = completionData.total > 0
      ? ((completionData.total - completionData.completed) / completionData.total) * 100
      : 0;
    const cancellationWeight = 0.10; // -10%

    // 🔟 CALCUL FINAL
    const reliabilityScore = Math.min(
      100,
      Math.max(
        0,
        ratingScore * ratingWeight +
          completionRate * completionWeight +
          acceptanceScore * acceptanceWeight +
          servicesScore * servicesWeight +
          profileCompleteness * profileWeight +
          badgesScore * badgesWeight +
          paymentCompletionRate * paymentsWeight +
          responseScore * responseWeight +
          reviewsLeftScore * reviewsLeftWeight -
          cancellationRate * cancellationWeight
      )
    );

    return reliabilityScore;
  } catch (error) {
    console.error("Error calculating reliability score:", error);
    return 75; // Valeur par défaut en cas d'erreur
  }
}

/**
 * Met à jour le score de fiabilité dans la base de données
 */
export async function updateReliabilityScore(userId) {
  try {
    const reliabilityScore = await calculateReliabilityScore(userId);

    await sql`
      UPDATE profiles
      SET reliability_score = ${reliabilityScore}
      WHERE user_id = ${userId}
    `;

    return reliabilityScore;
  } catch (error) {
    console.error("Error updating reliability score:", error);
    throw error;
  }
}
