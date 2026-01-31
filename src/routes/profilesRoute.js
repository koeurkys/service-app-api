import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

router.get("/me", async (req, res) => {
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
        COUNT(b.id)                   AS total_bookings
      FROM profiles p
      LEFT JOIN bookings b
        ON b.provider_id = p.user_id
        AND b.status = 'completed'
      WHERE p.user_id = ${user.id}
      GROUP BY p.id
    `;

    // 3️⃣ services
    const services = await sql`
      SELECT
        s.id,
        s.title,
        c.name AS category,
        s.price AS price_per_hour,
        s.average_rating AS rating,
        s.total_bookings AS reviews_count,
        s.status,
        s.created_at,
        NULL AS image_url
      FROM services s
      JOIN categories c ON c.id = s.category_id
      WHERE s.user_id = ${user.id}
      ORDER BY s.created_at DESC
    `;

    res.json({
      ...stats,
      services
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
