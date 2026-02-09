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

        // ===== XP-based badges (xp_100, xp_500, etc.) =====
        if (conditionType.startsWith('xp_')) {
          const xpThreshold = parseInt(conditionType.split('_')[1]);
          if (p.xp_total >= xpThreshold) {
            console.log(`✅ XP Badge ${badge.id} (${badge.name}) - EARNED! (${p.xp_total} >= ${xpThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ XP Badge ${badge.id} (${badge.name}) - ${p.xp_total}/${xpThreshold} XP`);
          }
        }
        // ===== Service completion badges (completed_10, completed_25, etc.) =====
        else if (conditionType.startsWith('completed_')) {
          const completedThreshold = parseInt(conditionType.split('_')[1]);
          if (p.total_services_completed >= completedThreshold) {
            console.log(`✅ Completed Badge ${badge.id} (${badge.name}) - EARNED! (${p.total_services_completed} >= ${completedThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Completed Badge ${badge.id} (${badge.name}) - ${p.total_services_completed}/${completedThreshold} services`);
          }
        }
        // ===== Services published badges (services_5, services_10, etc.) =====
        else if (conditionType.startsWith('services_')) {
          const servicesThreshold = parseInt(conditionType.split('_')[1]);
          if (p.total_services_published >= servicesThreshold) {
            console.log(`✅ Services Badge ${badge.id} (${badge.name}) - EARNED! (${p.total_services_published} >= ${servicesThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Services Badge ${badge.id} (${badge.name}) - ${p.total_services_published}/${servicesThreshold} services`);
          }
        }
        // ===== Rating-based badges (rating_40 → 4.0, rating_45 → 4.5, etc.) =====
        else if (conditionType.startsWith('rating_')) {
          const ratingStr = conditionType.split('_')[1];
          const ratingThreshold = parseInt(ratingStr) / 10;
          if (p.rating_avg >= ratingThreshold) {
            console.log(`✅ Rating Badge ${badge.id} (${badge.name}) - EARNED! (${p.rating_avg} >= ${ratingThreshold})`);
            shouldAward = true;
          } else {
            console.log(`⏳ Rating Badge ${badge.id} (${badge.name}) - ${p.rating_avg}/${ratingThreshold} rating`);
          }
        }
        // ===== Category XP badges (category_xp_informatique, category_xp_design, etc.) =====
        else if (conditionType.startsWith('category_xp_')) {
          const categorySlug = conditionType.split('category_xp_')[1];
          const xpThreshold = badge.xp_required || 100;
          
          try {
            const categoryXp = await sql`
              SELECT xp FROM category_xp
              JOIN categories ON category_xp.category_id = categories.id
              WHERE category_xp.user_id = ${userId} AND categories.slug = ${categorySlug}
              LIMIT 1
            `;
            
            const userCategoryXp = categoryXp.length > 0 ? categoryXp[0].xp : 0;
            if (userCategoryXp >= xpThreshold) {
              console.log(`✅ Category XP Badge ${badge.id} (${badge.name}) - EARNED! (${userCategoryXp} >= ${xpThreshold} in ${categorySlug})`);
              shouldAward = true;
            } else {
              console.log(`⏳ Category XP Badge ${badge.id} (${badge.name}) - ${userCategoryXp}/${xpThreshold} XP in ${categorySlug}`);
            }
          } catch (err) {
            console.log(`ℹ️ Category XP Badge ${badge.id} (${badge.name}) - category data not available`);
          }
        }
        // ===== Positive reviews badges (positive_reviews_10, positive_reviews_25, etc.) =====
        else if (conditionType.startsWith('positive_reviews_')) {
          const reviewsThreshold = parseInt(conditionType.split('_')[2]);
          
          try {
            const positiveReviews = await sql`
              SELECT COUNT(*) as count FROM reviews
              WHERE provider_id = ${userId} AND rating >= 4
            `;
            
            const reviewCount = positiveReviews[0].count || 0;
            if (reviewCount >= reviewsThreshold) {
              console.log(`✅ Positive Reviews Badge ${badge.id} (${badge.name}) - EARNED! (${reviewCount} >= ${reviewsThreshold} positive reviews)`);
              shouldAward = true;
            } else {
              console.log(`⏳ Positive Reviews Badge ${badge.id} (${badge.name}) - ${reviewCount}/${reviewsThreshold} positive reviews`);
            }
          } catch (err) {
            console.log(`ℹ️ Positive Reviews Badge ${badge.id} (${badge.name}) - review data not available`);
          }
        }
        // ===== First achievement badges =====
        else if (conditionType === 'first_booking' || conditionType === 'first_service' || conditionType === 'first_profile' || conditionType === 'first_request') {
          // Check if user has completed their first action
          let hasCompleted = false;
          
          if (conditionType === 'first_booking') {
            hasCompleted = p.total_services_completed >= 1;
          } else if (conditionType === 'first_service') {
            hasCompleted = p.total_services_published >= 1;
          } else if (conditionType === 'first_profile') {
            hasCompleted = !!p.bio;
          } else if (conditionType === 'first_request') {
            // Similar to first_booking
            hasCompleted = p.total_services_completed >= 1;
          }
          
          if (hasCompleted) {
            console.log(`✅ Achievement Badge ${badge.id} (${badge.name}) - EARNED! (first action completed)`);
            shouldAward = true;
          } else {
            console.log(`⏳ Achievement Badge ${badge.id} (${badge.name}) - waiting for first action`);
          }
        }
        // ===== Additional engagement badges (not yet tracked) =====
        else if (conditionType.startsWith('contact_requests_')) {
          console.log(`ℹ️ Contact Requests Badge ${badge.id} (${badge.name}) - tracking not yet implemented`);
        }
        else if (conditionType.startsWith('messages_')) {
          console.log(`ℹ️ Messages Badge ${badge.id} (${badge.name}) - tracking not yet implemented`);
        }
        else if (conditionType.startsWith('followers_')) {
          console.log(`ℹ️ Followers Badge ${badge.id} (${badge.name}) - tracking not yet implemented`);
        }
        else if (conditionType === 'quick_completion' || conditionType === 'night_completion') {
          console.log(`ℹ️ Special Badge ${badge.id} (${badge.name}) - requires detailed tracking not yet implemented`);
        }
        // ===== Unknown condition types =====
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
