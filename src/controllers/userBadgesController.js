import { sql } from "../config/db.js";

export async function getUserBadges(req, res) {
  try {
    const userBadges = await sql`SELECT * FROM user_badges ORDER BY earned_at DESC`;
    res.status(200).json(userBadges);
  } catch (error) {
    console.log("Error getting user badges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserBadgesByUserId(req, res) {
  try {
    const { userId } = req.params;
    const badges = await sql`SELECT * FROM user_badges WHERE user_id = ${userId} ORDER BY earned_at DESC`;
    res.status(200).json(badges);
  } catch (error) {
    console.log("Error getting user badges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUserBadge(req, res) {
  try {
    const { user_id, badge_id } = req.body;

    if (!user_id || !badge_id) {
      return res.status(400).json({ message: "user_id and badge_id are required" });
    }

    const userBadge = await sql`
      INSERT INTO user_badges(user_id, badge_id)
      VALUES (${user_id}, ${badge_id})
      RETURNING *
    `;

    res.status(201).json(userBadge[0]);
  } catch (error) {
    console.log("Error creating user badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUserBadge(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM user_badges WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "User badge not found" });
    }

    res.status(200).json({ message: "User badge deleted successfully" });
  } catch (error) {
    console.log("Error deleting user badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
