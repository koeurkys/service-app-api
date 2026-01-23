import { sql } from "../config/db.js";

export async function getChallenges(req, res) {
  try {
    const challenges = await sql`SELECT * FROM challenges ORDER BY created_at DESC`;
    res.status(200).json(challenges);
  } catch (error) {
    console.log("Error getting challenges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getChallengeById(req, res) {
  try {
    const { id } = req.params;
    const challenge = await sql`SELECT * FROM challenges WHERE id = ${id}`;

    if (challenge.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json(challenge[0]);
  } catch (error) {
    console.log("Error getting challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createChallenge(req, res) {
  try {
    const { title, description, xp_reward, category_id, difficulty, duration_days, requirement_type, requirement_value } = req.body;

    if (!title || !description || !xp_reward) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const challenge = await sql`
      INSERT INTO challenges(title, description, xp_reward, category_id, difficulty, duration_days, requirement_type, requirement_value)
      VALUES (${title}, ${description}, ${xp_reward}, ${category_id}, ${difficulty}, ${duration_days}, ${requirement_type}, ${requirement_value})
      RETURNING *
    `;

    res.status(201).json(challenge[0]);
  } catch (error) {
    console.log("Error creating challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateChallenge(req, res) {
  try {
    const { id } = req.params;
    const { title, description, xp_reward, category_id, difficulty, duration_days, requirement_type, requirement_value, is_active } = req.body;

    const updated = await sql`
      UPDATE challenges
      SET title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          xp_reward = COALESCE(${xp_reward}, xp_reward),
          category_id = COALESCE(${category_id}, category_id),
          difficulty = COALESCE(${difficulty}, difficulty),
          duration_days = COALESCE(${duration_days}, duration_days),
          requirement_type = COALESCE(${requirement_type}, requirement_type),
          requirement_value = COALESCE(${requirement_value}, requirement_value),
          is_active = COALESCE(${is_active}, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteChallenge(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM challenges WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.log("Error deleting challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
