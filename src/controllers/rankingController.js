import { sql } from "../config/db.js";

/* ===================================================== */
/* GET /api/ranking */
/* Leaderboard global (top XP) */
/* ===================================================== */

export async function getRanking(req, res) {
  try {
    const { limit = 100 } = req.query;

    const ranking = await sql`
      SELECT
        users.id,
        users.name,
        users.avatar_url,
        users.role,
        profiles.xp_total,
        profiles.level,
        profiles.rating_avg,
        profiles.total_services_completed
      FROM profiles
      JOIN users ON users.id = profiles.user_id
      ORDER BY profiles.xp_total DESC
      LIMIT ${Number(limit)}
    `;

    res.status(200).json(ranking);
  } catch (error) {
    console.log("Error getting ranking", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* ===================================================== */
/* GET /api/ranking/me */
/* Retourne le rang du user connecté */
/* ===================================================== */

export async function getMyRank(req, res) {
  try {
    const clerkId = req.clerkUserId;
    if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

    const [user] = await sql`
      SELECT id FROM users WHERE clerk_id = ${clerkId}
    `;

    if (!user) return res.status(404).json({ message: "User not found" });

    // récupérer le rank via window function
    const [rank] = await sql`
      SELECT *
      FROM (
        SELECT
          user_id,
          xp_total,
          RANK() OVER (ORDER BY xp_total DESC) as rank
        FROM profiles
      ) r
      WHERE user_id = ${user.id}
    `;

    res.status(200).json(rank);
  } catch (error) {
    console.log("Error getting my rank", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
