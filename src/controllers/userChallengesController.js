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

/**
 * Réclamer la récompense XP d'un défi complété
 * POST /api/user-challenges/:challengeId/claim
 */
export async function claimChallengeReward(req, res) {
  try {
    const clerkId = req.clerkUserId;
    const { challengeId } = req.params;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!challengeId) {
      return res.status(400).json({ message: "challengeId is required" });
    }

    // 1️⃣ Récupérer l'user_id à partir du clerk_id
    const [user] = await sql`
      SELECT id FROM users WHERE clerk_id = ${clerkId}
    `;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Récupérer le défi
    const [challenge] = await sql`
      SELECT id, xp_reward FROM challenges WHERE id = ${challengeId}
    `;

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // 3️⃣ Vérifier si l'utilisateur a déjà complété ce défi
    const [existingUserChallenge] = await sql`
      SELECT id, status FROM user_challenges 
      WHERE user_id = ${user.id} AND challenge_id = ${challengeId}
    `;

    // Si déjà complété, retourner une erreur
    if (existingUserChallenge && existingUserChallenge.status === "completed") {
      return res.status(400).json({ 
        message: "Challenge already completed and reward already claimed",
        xpGained: 0
      });
    }

    // 4️⃣ Mettre à jour user_challenges avec status='completed'
    if (existingUserChallenge) {
      // Mettre à jour l'enregistrement existant
      await sql`
        UPDATE user_challenges
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ${existingUserChallenge.id}
      `;
    } else {
      // Créer un nouvel enregistrement
      await sql`
        INSERT INTO user_challenges(user_id, challenge_id, status, completed_at)
        VALUES (${user.id}, ${challengeId}, 'completed', CURRENT_TIMESTAMP)
      `;
    }

    // 5️⃣ Ajouter les XP au profil
    const xpReward = challenge.xp_reward || 0;
    
    const [updatedProfile] = await sql`
      UPDATE profiles
      SET xp_total = xp_total + ${xpReward},
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${user.id}
      RETURNING xp_total, level
    `;

    return res.status(200).json({
      message: "Challenge reward claimed successfully",
      xpGained: xpReward,
      newTotalXP: updatedProfile?.xp_total || xpReward,
      newLevel: updatedProfile?.level || 1
    });

  } catch (error) {
    console.error("Error claiming challenge reward:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
