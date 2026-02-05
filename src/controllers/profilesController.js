import { sql } from "../config/db.js";
export async function getProfileByUserId(req, res) {
  try {
    const { userId } = req.params;

    // Récupérer l'utilisateur
    const [user] = await sql`
      SELECT id, name, email, avatar_url, created_at, role
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Stats
    const [stats] = await sql`
      SELECT
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_jobs,
        COUNT(DISTINCT s.id) AS total_services,
        COALESCE(AVG(r.rating), 0)::float AS avg_rating
      FROM users u
      LEFT JOIN services s ON s.user_id = u.id AND s.status = 'active'
      LEFT JOIN bookings b ON b.service_id = s.id
      LEFT JOIN reviews r ON r.service_id = s.id
      WHERE u.id = ${user.id}
    `;

    // Services actifs
    const services = await sql`
      SELECT
        s.id,
        s.title,
        s.price AS price_per_hour,
        s.image_url,
        s.created_at,
        s.average_rating::float AS rating,
        s.total_bookings AS reviews_count,
        c.name AS category
      FROM services s
      JOIN categories c ON c.id = s.category_id
      WHERE s.user_id = ${user.id} AND s.status = 'active'
      ORDER BY s.created_at DESC
    `;

    res.json({
      ...user,
      completed_jobs: parseInt(stats.completed_jobs) || 0,
      avg_rating: parseFloat(stats.avg_rating) || 0,
      services,
    });
  } catch (error) {
    console.error("Error getting public profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export async function getProfileByMe(req, res) {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1️⃣ récupérer l'utilisateur
    const [user] = await sql`
      SELECT id
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // 2️⃣ stats globales
    const [stats] = await sql`
      SELECT
        p.total_services_completed     AS completed_jobs,
        p.rating_avg                  AS avg_rating,
        COALESCE(SUM(b.total_price), 0) AS total_earnings,
        COUNT(b.id)                   AS total_bookings,
        u.avatar_url AS avatar_url
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN bookings b
        ON b.provider_id = p.user_id
        AND b.status = 'completed'
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, u.avatar_url
    `;

    // 3️⃣ services
    const services = await sql`
      SELECT
        s.id,
        s.title,
        c.name AS category,
        s.price AS price_per_hour,
        s.average_rating::float AS rating,
        s.total_bookings AS reviews_count,
        s.status,
        s.created_at,
        s.image_url
      FROM services s
      JOIN categories c ON c.id = s.category_id
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at DESC
    `;

    res.json({
      ...stats,
      services,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
export async function getProfileByUserId(req, res) {
  try {
    const { userId } = req.params;

    // 1) User info
    const user = await sql`
      SELECT id, name, email, phone, avatar_url, role, is_verified, created_at
      FROM users
      WHERE id = ${userId}
    `;
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2) Profile info
    const profile = await sql`
      SELECT xp_total, rating_avg, reliability_score, level, total_services_completed, total_services_published
      FROM profiles
      WHERE user_id = ${userId}
    `;

    // 3) Services publiés par l'utilisateur
    const services = await sql`
      SELECT s.id, s.title, s.description, s.price, s.is_hourly, s.type, s.category AS category_name, s.status, s.created_at
      FROM services s
      WHERE s.user_id = ${userId}
      ORDER BY s.created_at DESC
    `;

    // 4) XP per category
    const categoryXp = await sql`
      SELECT cx.category_id, c.name AS category_name, cx.xp
      FROM category_xp cx
      JOIN categories c ON c.id = cx.category_id
      WHERE cx.user_id = ${userId}
      ORDER BY cx.xp DESC
    `;

    // 5) Badges
    const badges = await sql`
      SELECT b.id, b.name, b.icon, b.description
      FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.earned_at DESC
    `;

    // ✅ Retour JSON complet
    return res.status(200).json({
      user: user[0],
      profile: profile[0] || null,
      services, // <- ici on renvoie les services
      category_xp: categoryXp,
      badges,
    });
  } catch (error) {
    console.log("Error getting profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
