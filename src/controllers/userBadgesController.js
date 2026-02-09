import { sql } from "../config/db.js";

// Get all available badges
export async function getAllBadges(req, res) {
  try {
    const badges = await sql`
      SELECT * FROM badges
      ORDER BY xp_required ASC, created_at ASC
    `;
    res.status(200).json(badges);
  } catch (error) {
    console.log("Error getting badges:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// Get user's earned badges with details
export async function getMyBadges(req, res) {
  try {
    const userId = req.user.id;
    
    const userBadges = await sql`
      SELECT ub.*, b.*, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ${userId}
      ORDER BY ub.earned_at DESC
    `;

    const profile = await sql`
      SELECT * FROM profiles
      WHERE user_id = ${userId}
    `;

    const earnedBadgeIds = userBadges.map(b => b.badge_id);
    
    // Calculate progress for locked badges
    const progress = {};
    if (profile.length > 0) {
      const p = profile[0];
      
      // XP badges progress
      progress[5] = Math.min(100, (p.xp_total / 100) * 100); // Amateur (100 XP)
      progress[6] = Math.min(100, (p.xp_total / 500) * 100); // Confirmed (500 XP)
      progress[7] = Math.min(100, (p.xp_total / 1000) * 100); // Professional (1000 XP)
      progress[8] = Math.min(100, (p.xp_total / 2000) * 100); // Legendary (2000 XP)
      
      // Rating badges
      const rating = p.rating_avg || 0;
      progress[18] = Math.min(100, (rating / 4) * 100); // De Confiance (4.0)
      progress[19] = Math.min(100, (rating / 4.5) * 100); // Excellent (4.5)
      progress[20] = Math.min(100, (rating / 4.8) * 100); // Perfect (4.8)
      
      // Completion badges
      progress[15] = Math.min(100, (p.total_services_completed / 10) * 100); // Productive (10)
      progress[16] = Math.min(100, (p.total_services_completed / 25) * 100); // Hyperactive (25)
      progress[17] = Math.min(100, (p.total_services_completed / 50) * 100); // Obsessed (50)
    }

    res.status(200).json({ 
      badges: userBadges,
      progress: progress
    });
  } catch (error) {
    console.log("Error getting user badges with progress:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

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

// Award badge to user
export async function awardBadge(req, res) {
  try {
    const userId = req.user.id;
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ message: "badgeId is required" });
    }

    // Check if user already has this badge
    const existing = await sql`
      SELECT * FROM user_badges
      WHERE user_id = ${userId} AND badge_id = ${badgeId}
    `;

    if (existing.length > 0) {
      return res.status(200).json({ 
        message: "User already has this badge",
        alreadyHad: true
      });
    }

    // Award the badge
    const awarded = await sql`
      INSERT INTO user_badges(user_id, badge_id, earned_at)
      VALUES (${userId}, ${badgeId}, NOW())
      RETURNING *
    `;

    res.status(201).json({ 
      message: "Badge awarded successfully",
      badge: awarded[0],
      newBadge: true
    });
  } catch (error) {
    console.log("Error awarding badge:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// 🎯 Internal function to sync badges for a user (can be called from other controllers)
export async function syncBadgesForUser(userId) {
  try {
    // Get user profile data
    const profile = await sql`
      SELECT * FROM profiles WHERE user_id = ${userId}
    `;

    if (profile.length === 0) {
      console.log(`⚠️ Profile not found for user ${userId}`);
      return { newBadges: [], success: false };
    }

    const p = profile[0];
    const awardedBadges = [];
    const badgesToCheck = [];

    // Get all badges from DB to find correct IDs
    const allBadges = await sql`
      SELECT id, name, description, xp_required, condition_type FROM badges
      ORDER BY xp_required ASC
    `;

    // Create a map of badges by xp_required for easier lookup
    const badgesByCondition = {};
    allBadges.forEach(b => {
      if (b.condition_type === 'xp') {
        badgesByCondition[`xp_${b.xp_required}`] = b.id;
      } else if (b.condition_type === 'avg_rating') {
        badgesByCondition[`rating_${b.xp_required}`] = b.id;
      } else if (b.condition_type === 'completed_services') {
        badgesByCondition[`services_${b.xp_required}`] = b.id;
      }
    });

    console.log(`🎯 Syncing badges for user ${userId}`);
    console.log(`📊 XP: ${p.xp_total}, Rating: ${p.rating_avg}, Services: ${p.total_services_completed}, Published: ${p.total_services_published}`);

    // ===== XP-based badges =====
    // Look for badge by xp_required value
    if (p.xp_total >= 100) {
      const badgeId = badgesByCondition['xp_100'];
      if (badgeId) badgesToCheck.push(badgeId);
    }
    if (p.xp_total >= 500) {
      const badgeId = badgesByCondition['xp_500'];
      if (badgeId) badgesToCheck.push(badgeId);
    }
    if (p.xp_total >= 1000) {
      const badgeId = badgesByCondition['xp_1000'];
      if (badgeId) badgesToCheck.push(badgeId);
    }

    // ===== Rating-based badges =====
    const rating = (p.rating_avg || 0) * 100; // Convert to integer (4.5 = 450)
    if (rating >= 450) {
      const badgeId = badgesByCondition['rating_450'];
      if (badgeId) badgesToCheck.push(badgeId);
    }

    // ===== Completion-based badges =====
    if (p.total_services_completed >= 10) {
      const badgeId = badgesByCondition['services_10'];
      if (badgeId) badgesToCheck.push(badgeId);
    }

    // Award badges
    for (const badgeId of badgesToCheck) {
      try {
        const existing = await sql`
          SELECT * FROM user_badges
          WHERE user_id = ${userId} AND badge_id = ${badgeId}
        `;

        if (existing.length === 0) {
          const awarded = await sql`
            INSERT INTO user_badges(user_id, badge_id, earned_at)
            VALUES (${userId}, ${badgeId}, NOW())
            RETURNING *
          `;
          awardedBadges.push(awarded[0]);
          console.log(`✅ Badge awarded to user ${userId}: Badge ID ${badgeId}`);
        }
      } catch (err) {
        console.log(`⚠️ Error awarding badge ${badgeId}:`, err.message);
      }
    }

    return { newBadges: awardedBadges, success: true };
  } catch (error) {
    console.log("Error syncing badges for user:", error);
    return { newBadges: [], success: false };
  }
}

// Sync badges - automatically check and award badges based on user progress
export async function syncBadges(req, res) {
  try {
    const userId = req.user.id;
    const result = await syncBadgesForUser(userId);

    res.status(200).json({ 
      message: "Badges synced successfully",
      newBadges: result.newBadges,
      count: result.newBadges.length
    });
  } catch (error) {
    console.log("Error syncing badges:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
