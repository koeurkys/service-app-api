import { sql } from "../config/db.js";
import { syncBadgesForUser } from "./userBadgesController.js";

// 🎯 Fonction pour calculer le niveau en fonction de l'XP (identique au frontend)
function calculateLevelFromXP(totalXp) {
  if (typeof totalXp !== "number" || totalXp < 0) {
    return 0;
  }

  let currentLevel = 0;

  // Chercher le dernier niveau atteint
  // Limiter à 100 niveaux pour éviter les boucles infinies
  for (let level = 1; level <= 100; level++) {
    const xpRequiredForThisLevel = getXpRequiredForLevel(level);
    if (totalXp >= xpRequiredForThisLevel) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

// 🎯 Fonction pour obtenir l'XP cumulatif requis pour un niveau
function getXpRequiredForLevel(level) {
  if (level <= 0) return 0;
  
  let totalXp = 0;
  // Additionner tous les XP requis pour chaque transition jusqu'au niveau cible
  for (let i = 0; i < level; i++) {
    totalXp += getXpRequiredForNextLevelStep(i);
  }
  return totalXp;
}

// 🎯 Fonction pour obtenir l'XP requis pour passer du niveau N au niveau N+1
function getXpRequiredForNextLevelStep(level) {
  return 100 + level * 50 + Math.pow(level, 2) * 10;
}

// 🎯 Fonction pour mettre à jour le level dans category_xp après un changement d'XP
async function updateCategoryXpLevel(userId, categoryId) {
  try {
    // Récupérer le XP pour cette catégorie
    const categoryXpData = await sql`
      SELECT xp FROM category_xp 
      WHERE user_id = ${userId} AND category_id = ${categoryId}
    `;
    
    if (categoryXpData.length === 0) {
      console.log("⚠️ category_xp non trouvée");
      return;
    }
    
    const xp = categoryXpData[0].xp;
    const newLevel = calculateLevelFromXP(xp);
    
    // Mettre à jour le level dans category_xp
    await sql`
      UPDATE category_xp
      SET level = ${newLevel}
      WHERE user_id = ${userId} AND category_id = ${categoryId}
    `;
    
    console.log(`✅ Niveau catégorie mis à jour: ${newLevel} pour ${xp} XP`);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du niveau catégorie:", error);
  }
}

// 🎯 Fonction pour synchroniser le total_xp du profil avec la somme des category_xp
async function syncUserTotalXP(userId) {
  try {
    console.log("🔄 Synchronisation du total_xp pour l'utilisateur", userId);
    
    // Vérifier si le profil existe
    console.log("🔍 Vérification de l'existence du profil pour user_id", userId);
    const profileCheck = await sql`
      SELECT id, user_id, xp_total FROM profiles WHERE user_id = ${userId}
    `;
    console.log("📊 Profil trouvé?", profileCheck.length > 0, "Données:", profileCheck[0]);
    
    if (profileCheck.length === 0) {
      console.warn("⚠️ ATTENTION - Profil n'existe pas pour user_id", userId);
      return;
    }
    
    // Calculer la somme de tous les XP des catégories
    const totalXpResult = await sql`
      SELECT COALESCE(SUM(xp), 0) as total_xp
      FROM category_xp
      WHERE user_id = ${userId}
    `;
    
    console.log("📊 Résultat SUM query:", totalXpResult);
    let newTotalXp = totalXpResult[0]?.total_xp || 0;
    console.log("📊 Total XP AVANT conversion:", newTotalXp, "Type:", typeof newTotalXp);
    
    // ⚠️ IMPORTANT: Convertir en nombre car PostgreSQL retourne une string
    newTotalXp = parseInt(newTotalXp, 10) || 0;
    console.log("📊 Total XP APRÈS conversion:", newTotalXp, "Type:", typeof newTotalXp);
    
    // Calculer le nouveau niveau
    const newLevel = calculateLevelFromXP(newTotalXp);
    console.log("📊 Nouveau niveau calculé:", newLevel, "pour", newTotalXp, "XP");
    
    // Mettre à jour le profil avec le nouveau total et le nouveau niveau
    console.log("🔄 UPDATE profiles SET xp_total = ${newTotalXp}, level = ${newLevel} WHERE user_id = ${userId}");
    const updateResult = await sql`
      UPDATE profiles
      SET xp_total = ${newTotalXp}, level = ${newLevel}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING id, user_id, xp_total, level
    `;
    
    console.log("📊 Résultat UPDATE:", updateResult);
    console.log("📊 Nombre de lignes mises à jour:", updateResult.length);
    
    if (updateResult.length > 0) {
      console.log("✅ Profile mis à jour avec succès - Nouvelle valeur xp_total:", updateResult[0].xp_total, "- Niveau:", updateResult[0].level);
    } else {
      console.warn("⚠️ ATTENTION - UPDATE n'a modifié aucune ligne");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation du total_xp:", error);
    console.error("Stack:", error.stack);
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

    console.log("💾 createCategoryXp called - User:", user_id, "Category:", category_id, "XP:", xp);

    if (!user_id || !category_id) {
      return res.status(400).json({ message: "user_id and category_id are required" });
    }

    const xpRow = await sql`
      INSERT INTO category_xp(user_id, category_id, xp)
      VALUES (${user_id}, ${category_id}, ${xp})
      RETURNING *
    `;

    console.log("✅ Category XP créée:", xpRow[0]);

    // 🎯 Sync XP total for the user
    console.log("🔄 Synchronisation du total XP pour user", user_id);
    await syncUserTotalXP(user_id);

    // 🎯 Sync badges for the user after XP is added
    console.log("🏅 Synchronisation des badges pour user", user_id);
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

    console.log("📝 updateCategoryXp called - ID:", id, "New XP:", xp);

    const updated = await sql`
      UPDATE category_xp
      SET xp = COALESCE(${xp}, xp)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Category xp not found" });
    }

    console.log("✅ Category XP mise à jour:", updated[0]);

    // 🎯 Sync XP total for the user after XP is updated
    console.log("🔄 Synchronisation du total XP pour user", updated[0].user_id);
    await syncUserTotalXP(updated[0].user_id);

    // 🎯 Sync badges for the user after XP is updated
    console.log("🏅 Synchronisation des badges pour user", updated[0].user_id);
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

    console.log("🗑️ deleteCategoryXp called - ID:", id);

    // D'abord récupérer les infos avant de supprimer
    const toDelete = await sql`
      SELECT id, user_id FROM category_xp WHERE id = ${id}
    `;

    if (toDelete.length === 0) {
      return res.status(404).json({ message: "Category xp not found" });
    }

    const userId = toDelete[0].user_id;
    console.log("👤 User ID:", userId);

    // Supprimer la ligne
    const result = await sql`
      DELETE FROM category_xp WHERE id = ${id}
      RETURNING *
    `;

    console.log("✅ Category XP supprimée:", result[0]);

    // 🎯 Sync XP total for the user after XP is deleted
    console.log("🔄 Synchronisation du total XP pour user", userId);
    await syncUserTotalXP(userId);

    // 🎯 Sync badges for the user after XP is deleted
    console.log("🏅 Synchronisation des badges pour user", userId);
    await syncBadgesForUser(userId);

    res.status(200).json({ message: "Category xp deleted successfully", deleted: result[0] });
  } catch (error) {
    console.log("Error deleting category xp", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Exporter les fonctions utilitaires
export { updateCategoryXpLevel, syncUserTotalXP, calculateLevelFromXP };
