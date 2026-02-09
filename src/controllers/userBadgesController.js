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
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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

    console.log(`🎯 Syncing badges for user ${userId}`);
    console.log(`📊 Profile Data - XP: ${p.xp_total}, Rating: ${p.rating_avg}, Services Completed: ${p.total_services_completed}, Services Published: ${p.total_services_published}`);

    // Get all badges from DB
    const allBadges = await sql`
      SELECT id, name, description, xp_required, condition_type FROM badges
      ORDER BY id ASC
    `;

    console.log(`📚 Found ${allBadges.length} badges in database`);

    // Check each badge condition
    for (const badge of allBadges) {
      try {
        // Skip if user already has this badge
        const existing = await sql`
          SELECT id FROM user_badges
          WHERE user_id = ${userId} AND badge_id = ${badge.id}
        `;

        if (existing.length > 0) {
          continue;
        }

        let shouldAward = false;
        const conditionType = badge.condition_type || '';
        const xpReq = badge.xp_required || 0;

        // ===== XP-based badges =====
        if (conditionType.startsWith('xp_')) {
          // Extract threshold from condition_type (e.g., 'xp_100' → 100)
          const xpThreshold = parseInt(conditionType.split('_')[1]);
          if (p.xp_total >= xpThreshold) {
            console.log(`✅ XP Badge ${badge.id} (${badge.name}) - EARNED! (${p.xp_total} >= ${xpThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ XP Badge ${badge.id} (${badge.name}) - ${p.xp_total}/${xpThreshold} XP`);
          }
        }
        // ===== Service completion badges =====
        else if (conditionType.startsWith('completed_')) {
          const completedThreshold = parseInt(conditionType.split('_')[1]);
          if (p.total_services_completed >= completedThreshold) {
            console.log(`✅ Completed Badge ${badge.id} (${badge.name}) - EARNED! (${p.total_services_completed} >= ${completedThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Completed Badge ${badge.id} (${badge.name}) - ${p.total_services_completed}/${completedThreshold} services`);
          }
        }
        // ===== Services published badges =====
        else if (conditionType.startsWith('services_')) {
          const servicesThreshold = parseInt(conditionType.split('_')[1]);
          if (p.total_services_published >= servicesThreshold) {
            console.log(`✅ Services Badge ${badge.id} (${badge.name}) - EARNED! (${p.total_services_published} >= ${servicesThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Services Badge ${badge.id} (${badge.name}) - ${p.total_services_published}/${servicesThreshold} services`);
          }
        }
        // ===== Rating-based badges =====
        else if (conditionType.startsWith('rating_')) {
          // Extract threshold from condition_type (e.g., 'rating_40' → 4.0, 'rating_45' → 4.5)
          const ratingStr = conditionType.split('_')[1];
          const ratingThreshold = parseInt(ratingStr) / 10;
          if (p.rating_avg >= ratingThreshold) {
            console.log(`✅ Rating Badge ${badge.id} (${badge.name}) - EARNED! (${p.rating_avg} >= ${ratingThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Rating Badge ${badge.id} (${badge.name}) - ${p.rating_avg}/${ratingThreshold} rating`);
          }
        }
        // ===== Achievement badges (no condition) =====
        else if (conditionType.includes('first_') || conditionType.includes('profile_')) {
          // These are typically milestone achievements that are checked separately
          // For now, marking as not auto-awarded
          console.log(`ℹ️ Achievement Badge ${badge.id} (${badge.name}) - requires special check`);
        }
        // ===== Other condition types =====
        else {
          console.log(`ℹ️ Badge ${badge.id} (${badge.name}) - unknown condition type: ${conditionType}`);
        }

        // Award the badge if conditions met
        if (shouldAward) {
          const awarded = await sql`
            INSERT INTO user_badges(user_id, badge_id, earned_at)
            VALUES (${userId}, ${badge.id}, NOW())
            RETURNING *
          `;
          awardedBadges.push(awarded[0]);
          console.log(`🎉 Badge awarded: ${badge.id} (${badge.name})`);
        }
      } catch (badgeErr) {
        console.log(`⚠️ Error processing badge ${badge.id}:`, badgeErr.message);
      }
    }

    console.log(`📊 Sync complete - ${awardedBadges.length} new badges awarded`);
    return { newBadges: awardedBadges, success: true };
  } catch (error) {
    console.log("❌ Error syncing badges for user:", error);
    return { newBadges: [], success: false };
  }
}

// Sync badges - automatically check and award badges based on user progress
export async function syncBadges(req, res) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

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
