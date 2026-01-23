import { sql } from "../config/db.js";

export async function getUserChallenges(req, res) {
  try {
    const userChallenges = await sql`SELECT * FROM user_challenges ORDER BY created_at DESC`;
    res.status(200).json(userChallenges);
  } catch (error) {
    console.log("Error getting user challenges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserChallengesByUserId(req, res) {
  try {
    const { userId } = req.params;
    const challenges = await sql`SELECT * FROM user_challenges WHERE user_id = ${userId} ORDER BY started_at DESC`;
    res.status(200).json(challenges);
  } catch (error) {
    console.log("Error getting user challenges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUserChallenge(req, res) {
  try {
    const { user_id, challenge_id } = req.body;

    if (!user_id || !challenge_id) {
      return res.status(400).json({ message: "user_id and challenge_id are required" });
    }

    const userChallenge = await sql`
      INSERT INTO user_challenges(user_id, challenge_id)
      VALUES (${user_id}, ${challenge_id})
      RETURNING *
    `;

    res.status(201).json(userChallenge[0]);
  } catch (error) {
    console.log("Error creating user challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUserChallenge(req, res) {
  try {
    const { id } = req.params;
    const { status, progress, started_at, completed_at } = req.body;

    const updated = await sql`
      UPDATE user_challenges
      SET status = COALESCE(${status}, status),
          progress = COALESCE(${progress}, progress),
          started_at = COALESCE(${started_at}, started_at),
          completed_at = COALESCE(${completed_at}, completed_at)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "User challenge not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating user challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUserChallenge(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM user_challenges WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "User challenge not found" });
    }

    res.status(200).json({ message: "User challenge deleted successfully" });
  } catch (error) {
    console.log("Error deleting user challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
