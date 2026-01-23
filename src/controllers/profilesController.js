import { sql } from "../config/db.js";

export async function getProfiles(req, res) {
  try {
    const profiles = await sql`SELECT * FROM profiles ORDER BY xp_total DESC`;
    res.status(200).json(profiles);
  } catch (error) {
    console.log("Error getting profiles", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProfileByUserId(req, res) {
  try {
    const { userId } = req.params;
    const profile = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;

    if (profile.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile[0]);
  } catch (error) {
    console.log("Error getting profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createProfile(req, res) {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: "user_id is required" });
    }

    const profile = await sql`
      INSERT INTO profiles(user_id)
      VALUES (${user_id})
      RETURNING *
    `;

    res.status(201).json(profile[0]);
  } catch (error) {
    console.log("Error creating profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { userId } = req.params;
    const { xp_total, rating_avg, reliability_score, certified, bio, certifications } = req.body;

    const updated = await sql`
      UPDATE profiles
      SET xp_total = COALESCE(${xp_total}, xp_total),
          rating_avg = COALESCE(${rating_avg}, rating_avg),
          reliability_score = COALESCE(${reliability_score}, reliability_score),
          certified = COALESCE(${certified}, certified),
          bio = COALESCE(${bio}, bio),
          certifications = COALESCE(${certifications}, certifications),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteProfile(req, res) {
  try {
    const { userId } = req.params;
    const result = await sql`DELETE FROM profiles WHERE user_id = ${userId} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.log("Error deleting profile", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
