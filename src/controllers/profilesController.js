import { sql } from "../config/db.js";
import { calculateLevelFromXP } from "../utils/levelCalculation.js";
import { calculateReliabilityScore } from "../utils/reliabilityCalculation.js";
export async function getProfileByUserId(req, res) {
  try {
    const { userId } = req.params;

    // Calculer et mettre à jour la fiabilité
    const reliabilityScore = await calculateReliabilityScore(userId);
    await sql`
      UPDATE profiles
      SET reliability_score = ${reliabilityScore}
      WHERE user_id = ${userId}
    `;

    // Récupérer l'utilisateur avec les données du profil
    const [user] = await sql`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.avatar_url, 
        u.created_at, 
        u.role,
        u.clerk_id,
        p.xp_total,
        p.rating_avg,
        p.level,
        p.certified,
        p.bio,
        p.reliability_score
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${userId}
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
        s.price AS price,
        s.image_url,
        s.created_at,
        s.average_rating::float AS rating,
        s.total_bookings AS reviews_count,
        s.status,
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
    const clerkId = req.clerkUserId;

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

    // 1.5️⃣ Calculer et mettre à jour la fiabilité
    const reliabilityScore = await calculateReliabilityScore(user.id);
    await sql`
      UPDATE profiles
      SET reliability_score = ${reliabilityScore}
      WHERE user_id = ${user.id}
    `;

    // 2️⃣ stats globales
    const [stats] = await sql`
      SELECT
        p.total_services_completed     AS completed_jobs,
        p.rating_avg                  AS avg_rating,
        p.reliability_score,
        COALESCE(SUM(b.total_price), 0) AS total_earnings,
        COUNT(b.id)                   AS total_bookings,
        u.avatar_url AS avatar_url,
        p.xp_total
      FROM profiles p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN bookings b
        ON b.provider_id = p.user_id
        AND b.status = 'completed'
      WHERE p.user_id = ${user.id}
      GROUP BY p.id, u.avatar_url, p.xp_total, p.reliability_score
    `;

    // 3️⃣ services
    const services = await sql`
      SELECT
        s.id,
        s.title,
        c.name AS category,
        c.slug AS category_slug,
        s.price,
        s.unit_type,
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

    // 4️⃣ Calculer le niveau correct basé sur l'XP
    const level = calculateLevelFromXP(stats.xp_total);

    res.json({
      id: user.id, // Ajouter l'ID utilisateur
      ...stats,
      level, // Remplacer par le niveau calculé correctement
      services,
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

export async function getCategoryXpByMe(req, res) {
  try {
    const clerkId = req.clerkUserId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 1️⃣ Récupérer l'utilisateur
    const [user] = await sql`
      SELECT id
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // 2️⃣ Récupérer l'XP par catégorie
    const categoryXpData = await sql`
      SELECT
        c.id,
        c.name AS category,
        c.slug AS category_slug,
        COALESCE(cxp.xp, 0)::INTEGER AS xp,
        COALESCE(cxp.level, 1)::INTEGER AS level,
        (COALESCE(cxp.level, 1)::INTEGER * 50)::INTEGER AS next_level_xp,
        COUNT(DISTINCT s.id) AS total_services,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::INTEGER AS completed_jobs
      FROM categories c
      LEFT JOIN category_xp cxp ON cxp.category_id = c.id AND cxp.user_id = ${user.id}
      LEFT JOIN services s ON s.category_id = c.id AND s.user_id = ${user.id}
      LEFT JOIN bookings b ON b.service_id = s.id
      GROUP BY c.id, c.name, c.slug, cxp.xp, cxp.level
      ORDER BY COALESCE(cxp.xp, 0) DESC
    `;

    res.json(categoryXpData || []);
  } catch (error) {
    console.error("Category XP error:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}

export async function updateProfileByMe(req, res) {
  try {
    const clerkId = req.clerkUserId;
    const { custom_blocks } = req.body;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Récupérer l'utilisateur
    const [user] = await sql`
      SELECT id
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }

    // Mettre à jour custom_blocks dans le profil
    if (custom_blocks !== undefined) {
      console.log("[updateProfileByMe] Saving custom_blocks:", {
        count: custom_blocks.length,
        blocks: custom_blocks,
      });
      
      await sql`
        UPDATE profiles
        SET custom_blocks = ${JSON.stringify(custom_blocks)}::jsonb, updated_at = NOW()
        WHERE user_id = ${user.id}
      `;
      
      console.log("[updateProfileByMe] custom_blocks saved successfully");
    }

    // Récupérer le profil mis à jour
    const [updatedProfile] = await sql`
      SELECT
        u.id,
        u.name,
        u.email,
        u.avatar_url,
        u.role,
        u.clerk_id,
        p.xp_total,
        p.rating_avg,
        p.level,
        p.certified,
        p.bio,
        p.reliability_score,
        p.custom_blocks,
        p.total_services_completed,
        p.created_at
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.id = ${user.id}
    `;

    // Récupérer les services
    const services = await sql`
      SELECT
        s.id,
        s.title,
        c.name AS category,
        s.price,
        s.unit_type,
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
      ...updatedProfile,
      services,
      custom_blocks: updatedProfile.custom_blocks || custom_blocks || [],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}

export async function getCategoryXpByUserId(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Check if user exists
    const [user] = await sql`
      SELECT id
      FROM users
      WHERE id = ${userId}
    `;

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Récupérer l'XP par catégorie
    const categoryXpData = await sql`
      SELECT
        c.id,
        c.name AS category,
        c.slug AS category_slug,
        COALESCE(cxp.xp, 0)::INTEGER AS xp,
        COALESCE(cxp.level, 1)::INTEGER AS level,
        (COALESCE(cxp.level, 1)::INTEGER * 50)::INTEGER AS next_level_xp,
        COUNT(DISTINCT s.id) AS total_services,
        COUNT(DISTINCT CASE WHEN b.status = 'completed' THEN b.id END)::INTEGER AS completed_jobs
      FROM categories c
      LEFT JOIN category_xp cxp ON cxp.category_id = c.id AND cxp.user_id = ${user.id}
      LEFT JOIN services s ON s.category_id = c.id AND s.user_id = ${user.id}
      LEFT JOIN bookings b ON b.service_id = s.id
      GROUP BY c.id, c.name, c.slug, cxp.xp, cxp.level
      ORDER BY COALESCE(cxp.xp, 0) DESC
    `;

    res.json(categoryXpData || []);
  } catch (error) {
    console.error("Category XP error:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}

