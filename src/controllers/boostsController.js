import { sql } from "../config/db.js";

// Obtenir tous les boosts disponibles
export async function getAvailableBoosts(req, res) {
  try {
    const boosts = await sql`
      SELECT * FROM boosts
      WHERE is_active = TRUE
      ORDER BY type, price_points ASC
    `;
    res.status(200).json(boosts);
  } catch (error) {
    console.error("Error getting available boosts", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Obtenir les boosts dans l'inventaire de l'utilisateur
export async function getUserBoostInventory(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const inventory = await sql`
      SELECT 
        ubi.id,
        ubi.user_id,
        ubi.boost_id,
        ubi.quantity,
        ubi.created_at,
        ubi.updated_at,
        b.name,
        b.description,
        b.icon,
        b.type,
        b.value_multiplier,
        b.duration_hours,
        b.applies_to
      FROM user_boost_inventory ubi
      JOIN boosts b ON ubi.boost_id = b.id
      WHERE ubi.user_id = ${userId} AND ubi.quantity > 0
      ORDER BY b.type, b.name ASC
    `;

    res.status(200).json(inventory);
  } catch (error) {
    console.error("Error getting user boost inventory", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Obtenir les boosts actuellement actifs de l'utilisateur
export async function getUserActiveBoosts(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const activeBoosts = await sql`
      SELECT 
        ab.id,
        ab.user_id,
        ab.boost_id,
        ab.activated_at,
        ab.expires_at,
        ab.is_active,
        b.name,
        b.description,
        b.icon,
        b.type,
        b.value_multiplier,
        b.duration_hours,
        b.applies_to,
        EXTRACT(EPOCH FROM (ab.expires_at - CURRENT_TIMESTAMP)) / 3600 as hours_remaining
      FROM active_boosts ab
      JOIN boosts b ON ab.boost_id = b.id
      WHERE ab.user_id = ${userId} AND ab.is_active = TRUE AND ab.expires_at > CURRENT_TIMESTAMP
      ORDER BY ab.expires_at DESC
    `;

    res.status(200).json(activeBoosts);
  } catch (error) {
    console.error("Error getting user active boosts", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Acheter un boost
export async function purchaseBoost(req, res) {
  try {
    const userId = req.userId;
    const { boostId, quantity = 1, paymentMethod } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!boostId || quantity < 1) {
      return res.status(400).json({ message: "Invalid boost ID or quantity" });
    }

    // Vérifier que le boost existe
    const boost = await sql`SELECT * FROM boosts WHERE id = ${boostId} AND is_active = TRUE`;
    if (boost.length === 0) {
      return res.status(404).json({ message: "Boost not found or not available" });
    }

    const totalPrice = boost[0].price_points * quantity;

    // Récupérer le profil de l'utilisateur pour vérifier ses points
    const profile = await sql`SELECT * FROM profiles WHERE user_id = ${userId}`;
    if (profile.length === 0) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Simule une vérification de points (à adapter selon votre système)
    // NOTE: Vous devez avoir une colonne points ou wallet dans la table profiles
    // Pour maintenant, on suppose que c'est dans une table wallet séparée

    // Ajouter l'achat à l'historique
    await sql`
      INSERT INTO boost_purchases (user_id, boost_id, quantity, total_price_points, purchase_type)
      VALUES (${userId}, ${boostId}, ${quantity}, ${totalPrice}, 'shop')
    `;

    // Ajouter (ou mettre à jour) dans l'inventaire
    const existing = await sql`
      SELECT * FROM user_boost_inventory 
      WHERE user_id = ${userId} AND boost_id = ${boostId}
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE user_boost_inventory 
        SET quantity = quantity + ${quantity}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId} AND boost_id = ${boostId}
      `;
    } else {
      await sql`
        INSERT INTO user_boost_inventory (user_id, boost_id, quantity)
        VALUES (${userId}, ${boostId}, ${quantity})
      `;
    }

    res.status(200).json({
      message: "Boost purchased successfully",
      totalPrice,
      quantityPurchased: quantity,
      boostName: boost[0].name,
    });
  } catch (error) {
    console.error("Error purchasing boost", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Activer un boost
export async function activateBoost(req, res) {
  try {
    const userId = req.userId;
    const { boostId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!boostId) {
      return res.status(400).json({ message: "Boost ID is required" });
    }

    // Utiliser la fonction SQL
    const result = await sql`SELECT * FROM activate_boost(${userId}, ${boostId})`;

    if (!result[0].success) {
      return res.status(400).json({ message: result[0].message });
    }

    // Récupérer le boost activé
    const activatedBoost = await sql`
      SELECT 
        ab.id,
        ab.user_id,
        ab.boost_id,
        ab.activated_at,
        ab.expires_at,
        ab.is_active,
        b.name,
        b.description,
        b.icon,
        b.type,
        b.value_multiplier,
        b.duration_hours,
        EXTRACT(EPOCH FROM (ab.expires_at - CURRENT_TIMESTAMP)) / 3600 as hours_remaining
      FROM active_boosts ab
      JOIN boosts b ON ab.boost_id = b.id
      WHERE ab.user_id = ${userId} AND ab.boost_id = ${boostId}
      ORDER BY ab.activated_at DESC
      LIMIT 1
    `;

    res.status(200).json({
      message: "Boost activated successfully",
      boost: activatedBoost[0],
    });
  } catch (error) {
    console.error("Error activating boost", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Désactiver un boost
export async function deactivateBoost(req, res) {
  try {
    const userId = req.userId;
    const { boostId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!boostId) {
      return res.status(400).json({ message: "Boost ID is required" });
    }

    // Utiliser la fonction SQL
    const result = await sql`SELECT * FROM deactivate_boost(${userId}, ${boostId})`;

    if (!result[0].success) {
      return res.status(400).json({ message: result[0].message });
    }

    res.status(200).json({ message: "Boost deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating boost", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Obtenir les statistiques des boosts d'un utilisateur
export async function getUserBoostStats(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const stats = await sql`
      SELECT 
        (SELECT COUNT(*) FROM user_boost_inventory WHERE user_id = ${userId} AND quantity > 0)::INTEGER as total_boosts_owned,
        (SELECT COUNT(*) FROM active_boosts WHERE user_id = ${userId} AND is_active = TRUE)::INTEGER as active_boosts,
        (SELECT SUM(total_price_points) FROM boost_purchases WHERE user_id = ${userId} AND purchase_type = 'shop')::INTEGER as total_points_spent,
        (SELECT COUNT(*) FROM boost_purchases WHERE user_id = ${userId} AND purchase_type = 'challenge_reward')::INTEGER as boosts_earned_from_challenges
    `;

    res.status(200).json(stats[0]);
  } catch (error) {
    console.error("Error getting boost stats", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Vérifier les boosts actifs qui s'appliquent à un contexte spécifique
export async function checkActiveBoostMultiplier(req, res) {
  try {
    const userId = req.userId;
    const { context = "all" } = req.query; // 'all', 'services', 'bookings', 'challenges'

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const activeBoosts = await sql`
      SELECT 
        b.type,
        SUM(b.value_multiplier) as combined_multiplier,
        COUNT(ab.id) as active_count,
        MIN(ab.expires_at) as earliest_expiry
      FROM active_boosts ab
      JOIN boosts b ON ab.boost_id = b.id
      WHERE ab.user_id = ${userId} 
        AND ab.is_active = TRUE 
        AND ab.expires_at > CURRENT_TIMESTAMP
        AND (b.applies_to = 'all' OR b.applies_to = ${context})
        AND b.type = 'xp_multiplier'
      GROUP BY b.type
    `;

    const multiplier = activeBoosts.length > 0 ? activeBoosts[0].combined_multiplier : 1.0;

    res.status(200).json({
      context,
      xpMultiplier: multiplier,
      activeBoostsApplying: activeBoosts.length > 0 ? activeBoosts[0].active_count : 0,
      boostDetails: activeBoosts,
    });
  } catch (error) {
    console.error("Error checking active boost multiplier", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
