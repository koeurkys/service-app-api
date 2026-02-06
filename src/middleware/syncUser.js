import { sql } from "../config/db.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function syncUser(req, res, next) {
  try {
    if (!req.auth?.userId) {
      console.log("⚠️ syncUser: No auth found, skipping user sync");
      return next(); // Skip sync if no auth, don't block request
    }

    const clerkId = req.auth.userId;

    // =========================
    // 🔥 Récupérer les infos depuis Clerk
    // =========================
    const clerkUser = await clerkClient.users.getUser(clerkId);

    const firstName = clerkUser.firstName || "";
    const lastName = clerkUser.lastName || "";
    const name = `${firstName} ${lastName}`.trim();

    const email = clerkUser.primaryEmailAddress?.emailAddress || null;
    const avatarUrl = clerkUser.imageUrl || null;
    const phone = clerkUser.unsafeMetadata?.phone || null;

    // =========================
    // 🔥 UPSERT USER
    // =========================
    const [user] = await sql`
      INSERT INTO users (
        clerk_id,
        name,
        email,
        phone,
        avatar_url,
        role,
        is_verified
      )
      VALUES (
        ${clerkId},
        ${name},
        ${email},
        ${phone},
        ${avatarUrl},
        'client',
        true
      )
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING id
    `;

    const userId = user.id;

    // =========================
    // 🔹 Créer profile si inexistant
    // =========================
    await sql`
      INSERT INTO profiles (user_id)
      VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;

    // =========================
    // 🔹 Créer category_xp par défaut
    // =========================
    await sql`
      INSERT INTO category_xp (user_id, category_id, xp)
      SELECT ${userId}, c.id, 0
      FROM categories c
      ON CONFLICT (user_id, category_id) DO NOTHING
    `;

    // =========================
    // 🔹 Créer user_challenges actifs
    // =========================
    await sql`
      INSERT INTO user_challenges (user_id, challenge_id, status, progress)
      SELECT ${userId}, ch.id, 'pending', 0
      FROM challenges ch
      WHERE ch.is_active = TRUE
      ON CONFLICT (user_id, challenge_id) DO NOTHING
    `;

    return next();
  } catch (error) {
    console.error("syncUser error:", error);
    return res.status(500).json({ message: "User sync failed" });
  }
}
