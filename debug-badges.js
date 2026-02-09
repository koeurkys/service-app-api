import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function debugBadges() {
  try {
    console.log("🔍 Fetching all badges...\n");
    
    const badges = await sql`
      SELECT id, name, xp_required, condition_type, color, category
      FROM badges
      ORDER BY id ASC
    `;

    console.log(`📚 Found ${badges.length} badges:\n`);
    console.log("ID | Name | xp_required | condition_type | category");
    console.log("---|------|-------------|----------------|----------");
    
    badges.forEach(b => {
      console.log(`${b.id.toString().padEnd(2)} | ${b.name.padEnd(30)} | ${(b.xp_required || 'NULL').toString().padEnd(11)} | ${(b.condition_type || 'NULL').padEnd(14)} | ${b.category || 'NULL'}`);
    });

    console.log("\n\n🔍 Fetching user profile and badges...\n");
    
    const profile = await sql`
      SELECT id, user_id, xp_total, rating_avg, total_services_completed, total_services_published
      FROM profiles
      WHERE user_id = 3
    `;

    if (profile.length === 0) {
      console.log("❌ No profile found for user_id 3");
      return;
    }

    const p = profile[0];
    console.log(`👤 User 3 Profile:`);
    console.log(`  - xp_total: ${p.xp_total}`);
    console.log(`  - rating_avg: ${p.rating_avg}`);
    console.log(`  - total_services_completed: ${p.total_services_completed}`);
    console.log(`  - total_services_published: ${p.total_services_published}\n`);

    const userBadges = await sql`
      SELECT ub.badge_id, b.name
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = 3
    `;

    console.log(`🏆 User earned badges: ${userBadges.length}`);
    userBadges.forEach(ub => {
      console.log(`  - Badge ${ub.badge_id}: ${ub.name}`);
    });

    console.log("\n\n📊 Testing badge conditions:\n");
    
    // Test XP badges
    const xpBadges = badges.filter(b => 
      b.condition_type === 'xp' || b.condition_type === 'level'
    );
    
    console.log(`XP Badges (condition_type = 'xp' or 'level'):`);
    xpBadges.forEach(b => {
      const shouldEarn = p.xp_total >= (b.xp_required || 0);
      const isEarned = userBadges.some(ub => ub.badge_id === b.id);
      console.log(`  Badge ${b.id} (${b.name}): xp_required=${b.xp_required} | Should Earn=${shouldEarn} | Is Earned=${isEarned}`);
    });

    // Test rating badges
    const ratingBadges = badges.filter(b => 
      b.condition_type === 'rating' || b.condition_type === 'avg_rating'
    );
    
    console.log(`\nRating Badges (condition_type = 'rating' or 'avg_rating'):`);
    ratingBadges.forEach(b => {
      const threshold = (b.xp_required || 0) / 100;
      const shouldEarn = p.rating_avg >= threshold;
      const isEarned = userBadges.some(ub => ub.badge_id === b.id);
      console.log(`  Badge ${b.id} (${b.name}): xp_required=${b.xp_required} (threshold=${threshold}) | Rating=${p.rating_avg} | Should Earn=${shouldEarn} | Is Earned=${isEarned}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugBadges();
