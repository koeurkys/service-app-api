import { sql } from "../config/db.js";

/* ===================================================== */
/* GET ALL USERS FOR ADMIN */
/* ===================================================== */
export async function getAllUsersForAdmin(req, res) {
  try {
    const users = await sql`
      SELECT id, name, email, role, avatar_url, is_verified, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    res.status(200).json(users);
  } catch (error) {
    console.log("❌ Error fetching users", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* ===================================================== */
/* UPDATE USER ROLE (make admin/remove admin)*/
/* ===================================================== */
export async function updateUserRole(req, res) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ message: "userId and role are required" });
    }

    if (!["client", "prestataire", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updated = await sql`
      UPDATE users
      SET role = ${role}
      WHERE id = ${userId}
      RETURNING id, name, email, role
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(`✅ Admin role updated: ${updated[0].name} -> ${role}`);
    res.status(200).json({
      message: `User role updated to ${role}`,
      user: updated[0],
    });
  } catch (error) {
    console.log("❌ Error updating user role", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* ===================================================== */
/* ADMIN - GET ALL CHALLENGES */
/* ===================================================== */
export async function getAdminChallenges(req, res) {
  try {
    const challenges = await sql`
      SELECT *, 
        (created_at + (duration_days || ' days')::interval) as expires_at
      FROM challenges
      ORDER BY created_at DESC
    `;
    res.status(200).json(challenges);
  } catch (error) {
    console.log("❌ Error fetching challenges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* ===================================================== */
/* ADMIN - CREATE CHALLENGE */
/* ===================================================== */
export async function createChallengeAdmin(req, res) {
  try {
    const { 
      title, 
      description, 
      xp_reward, 
      category_id, 
      difficulty, 
      duration_days, 
      requirement_type, 
      requirement_value,
      requirement_service_type,
      requirement_categories
    } = req.body;

    if (!title || !description || xp_reward === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convertir en nombres
    const xpValue = parseInt(xp_reward);
    const daysValue = duration_days ? parseInt(duration_days) : 7;
    const catId = category_id ? parseInt(category_id) : null;
    const reqValue = requirement_value ? parseInt(requirement_value) : null;

    if (isNaN(xpValue)) {
      return res.status(400).json({ message: "xp_reward must be a number" });
    }

    // Valider requirement_value si présent
    if (reqValue !== null && isNaN(reqValue)) {
      return res.status(400).json({ message: "requirement_value must be a valid number" });
    }

    // Valider la difficulté
    const validDifficulties = ["facile", "moyen", "difficile"];
    if (difficulty && !validDifficulties.includes(difficulty)) {
      return res.status(400).json({ 
        message: `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}` 
      });
    }

    // Valider requirement_type
    const validRequirementTypes = [
      "none",
      "sell_services",
      "buy_services",
      "book_services",
      "publish_services",
      "note_services",
      "exchange_objects",
      "share_app",
      "collect_badges",
      "reliability_score",
      "taxi_trip",
      "global_rating",
      "total_friends_count",
      "followers_count",
      "total_transactions",
      "total_revenue_earned",
      "messages_sent_count",
      "daily_action_streak",
      "unique_taxi_routes",
      "profile_completion_percentage",
      "account_age_days",
      "verified_email_and_phone",
      "perfect_rating_with_min_reviews",
      "categories_engaged_count"
    ];
    if (requirement_type && !validRequirementTypes.includes(requirement_type)) {
      return res.status(400).json({ 
        message: `Invalid requirement_type. Must be one of: ${validRequirementTypes.join(", ")}` 
      });
    }

    // Valider requirement_service_type
    const validServiceTypes = ["service", "booking", "both"];
    const serviceType = requirement_service_type && validServiceTypes.includes(requirement_service_type) 
      ? requirement_service_type 
      : "both";

    // Convertir les catégories en JSON
    const categoriesJson = requirement_categories && Array.isArray(requirement_categories) && requirement_categories.length > 0
      ? JSON.stringify(requirement_categories)
      : null;

    const challenge = await sql`
      INSERT INTO challenges(
        title, 
        description, 
        xp_reward, 
        category_id, 
        difficulty, 
        duration_days, 
        requirement_type, 
        requirement_value,
        requirement_service_type,
        requirement_categories
      )
      VALUES (
        ${title}, 
        ${description}, 
        ${xpValue}, 
        ${catId}, 
        ${difficulty || "moyen"}, 
        ${daysValue}, 
        ${requirement_type || null}, 
        ${reqValue || null},
        ${serviceType},
        ${categoriesJson}
      )
      RETURNING *
    `;

    console.log(`✅ Challenge created: ${title}`);
    res.status(201).json(challenge[0]);
  } catch (error) {
    console.log("❌ Error creating challenge:", error.message);
    console.log("Full error:", error);
    res.status(500).json({ message: "Failed to create challenge: " + error.message });
  }
}

/* ===================================================== */
/* ADMIN - UPDATE CHALLENGE */
/* ===================================================== */
export async function updateChallengeAdmin(req, res) {
  try {
    const { id } = req.params;
    const { 
      title, 
      description, 
      xp_reward, 
      category_id, 
      difficulty, 
      duration_days, 
      requirement_type, 
      requirement_value,
      requirement_service_type,
      requirement_categories
    } = req.body;

    // Convertir les nombres si fournis
    const xpValue = xp_reward !== undefined ? parseInt(xp_reward) : undefined;
    const daysValue = duration_days ? parseInt(duration_days) : undefined;
    const catId = category_id ? parseInt(category_id) : undefined;
    const reqValue = requirement_value !== undefined && requirement_value !== null ? parseInt(requirement_value) : requirement_value;

    // Valider les conversions numériques
    if (xpValue !== undefined && isNaN(xpValue)) {
      return res.status(400).json({ message: "xp_reward must be a valid number" });
    }
    if (daysValue !== undefined && isNaN(daysValue)) {
      return res.status(400).json({ message: "duration_days must be a valid number" });
    }
    if (reqValue !== undefined && reqValue !== null && isNaN(reqValue)) {
      return res.status(400).json({ message: "requirement_value must be a valid number" });
    }

    // Valider la difficulté
    if (difficulty) {
      const validDifficulties = ["facile", "moyen", "difficile"];
      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({ 
          message: `Invalid difficulty. Must be one of: ${validDifficulties.join(", ")}` 
        });
      }
    }

    // Valider requirement_type
    if (requirement_type) {
      const validRequirementTypes = [
        "none",
        "sell_services",
        "buy_services",
        "book_services",
        "publish_services",
        "note_services",
        "exchange_objects",
        "share_app",
        "collect_badges",
        "reliability_score",
        "taxi_trip",
        "global_rating",
        "total_friends_count",
        "followers_count",
        "total_transactions",
        "total_revenue_earned",
        "messages_sent_count",
        "daily_action_streak",
        "unique_taxi_routes",
        "profile_completion_percentage",
        "account_age_days",
        "verified_email_and_phone",
        "perfect_rating_with_min_reviews",
        "categories_engaged_count"
      ];
      if (!validRequirementTypes.includes(requirement_type)) {
        return res.status(400).json({ 
          message: `Invalid requirement_type. Must be one of: ${validRequirementTypes.join(", ")}` 
        });
      }
    }

    // Valider requirement_service_type
    const validServiceTypes = ["service", "booking", "both"];
    const serviceType = requirement_service_type && validServiceTypes.includes(requirement_service_type)
      ? requirement_service_type
      : undefined;

    // Convertir les catégories en JSON
    let categoriesJson = undefined;
    if (requirement_categories !== undefined) {
      categoriesJson = requirement_categories && Array.isArray(requirement_categories) && requirement_categories.length > 0
        ? JSON.stringify(requirement_categories)
        : null;
    }

    const updated = await sql`
      UPDATE challenges
      SET 
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        xp_reward = COALESCE(${xpValue}, xp_reward),
        category_id = COALESCE(${catId}, category_id),
        difficulty = COALESCE(${difficulty}, difficulty),
        duration_days = COALESCE(${daysValue}, duration_days),
        requirement_type = COALESCE(${requirement_type}, requirement_type),
        requirement_value = COALESCE(${reqValue}, requirement_value),
        requirement_service_type = COALESCE(${serviceType}, requirement_service_type),
        requirement_categories = COALESCE(${categoriesJson}, requirement_categories)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    console.log(`✅ Challenge updated: ${updated[0].title}`);
    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("❌ Error updating challenge:", error.message);
    console.log("Full error:", error);
    res.status(500).json({ message: "Failed to update challenge: " + error.message });
  }
}

/* ===================================================== */
/* ADMIN - DELETE CHALLENGE */
/* ===================================================== */
export async function deleteChallengeAdmin(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM challenges 
      WHERE id = ${id} 
      RETURNING title
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    console.log(`✅ Challenge deleted: ${result[0].title}`);
    res.status(200).json({ 
      message: "Challenge deleted successfully",
      deletedChallenge: result[0]
    });
  } catch (error) {
    console.log("❌ Error deleting challenge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* ===================================================== */
/* CHECK IF USER IS ADMIN (middleware) */
/* ===================================================== */
export async function isAdminMiddleware(req, res, next) {
  try {
    const userId = req.userId; // Vient de requireAuth middleware
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await sql`
      SELECT role FROM users WHERE id = ${userId}
    `;

    if (user.length === 0 || user[0].role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.log("❌ Error checking admin status", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
