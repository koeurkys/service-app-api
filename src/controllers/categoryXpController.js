import { sql } from "../config/db.js";
import { syncBadgesForUser } from "./userBadgesController.js";

// 🎯 Fonction pour synchroniser le total_xp du profil avec la somme des category_xp
async function syncUserTotalXP(userId) {
  try {
    console.log("🔄 Synchronisation du total_xp pour l'utilisateur", userId);
    
    // Calculer la somme de tous les XP des catégories
    const totalXpResult = await sql`
      SELECT COALESCE(SUM(xp), 0) as total_xp
      FROM category_xp
      WHERE user_id = ${userId}
    `;
    
    const newTotalXp = totalXpResult[0]?.total_xp || 0;
    console.log("📊 Total XP calculé:", newTotalXp);
    
    // Mettre à jour le profil avec le nouveau total
    await sql`
      UPDATE profiles
      SET xp_total = ${newTotalXp}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;
    
    console.log("✅ Profile total_xp mis à jour à:", newTotalXp);
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation du total_xp:", error);
  }
}

export async function getCategoryXp(req, res) {
  try {
    const xp = await sql`SELECT * FROM category_xp ORDER BY xp DESC`;
    res.status(200).json(xp);
  } catch (error) {
    console.log("Error getting category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getCategoryXpByUserId(req, res) {
  try {
    const { userId } = req.params;
    const xp = await sql`SELECT * FROM category_xp WHERE user_id = ${userId} ORDER BY xp DESC`;
    res.status(200).json(xp);
  } catch (error) {
    console.log("Error getting category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategoryXp(req, res) {
  try {
    const { user_id, category_id, xp } = req.body;

    if (!user_id || !category_id) {
      return res.status(400).json({ message: "user_id and category_id are required" });
    }

    const xpRow = await sql`
      INSERT INTO category_xp(user_id, category_id, xp)
      VALUES (${user_id}, ${category_id}, ${xp})
      RETURNING *
    `;

    // 🎯 Sync XP total for the user
    await syncUserTotalXP(user_id);

    // 🎯 Sync badges for the user after XP is added
    await syncBadgesForUser(user_id);

    res.status(201).json(xpRow[0]);
  } catch (error) {
    console.log("Error creating category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCategoryXp(req, res) {
  try {
    const { id } = req.params;
    const { xp } = req.body;

    const updated = await sql`
      UPDATE category_xp
      SET xp = COALESCE(${xp}, xp)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Category xp not found" });
    }

    // 🎯 Sync XP total for the user after XP is updated
    await syncUserTotalXP(updated[0].user_id);

    // 🎯 Sync badges for the user after XP is updated
    await syncBadgesForUser(updated[0].user_id);

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteCategoryXp(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM category_xp WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Category xp not found" });
    }

    res.status(200).json({ message: "Category xp deleted successfully" });
  } catch (error) {
    console.log("Error deleting category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
