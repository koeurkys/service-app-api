import { sql } from "../config/db.js";

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

    // 3) XP per category
    const categoryXp = await sql`
      SELECT cx.category_id, c.name AS category_name, cx.xp
      FROM category_xp cx
      JOIN categories c ON c.id = cx.category_id
      WHERE cx.user_id = ${userId}
      ORDER BY cx.xp DESC
    `;

    // 4) Badges
    const badges = await sql`
      SELECT b.id, b.name, b.icon, b.description
      FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.earned_at DESC
    `;

    return res.status(200).json({
      user: user[0],
      profile: profile[0] || null,
      category_xp: categoryXp,
      badges: badges,
    });
  } catch (error) {
    console.log("Error getting profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
