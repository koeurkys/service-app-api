import { sql } from "../config/db.js";

export async function syncUser(req, res, next) {
  // 🔐 Sécurité : auth Clerk obligatoire
  if (!req.auth || !req.auth.userId) {
    console.warn("🔴 syncUser called without auth");
    return res.status(401).json({ message: "Unauthorized" });
  }

  const clerkId = req.auth.userId;
  console.log("🔵 syncUser called with userId:", clerkId);

  try {
    const claims = req.auth.sessionClaims ?? {};

    const email =
      claims.email ??
      claims.email_address ??
      null;

    const name =
      claims.name ??
      claims.username ??
      null;

    const avatarUrl =
      claims.image_url ??
      claims.picture ??
      null;

    // =========================
    // 1️⃣ USERS
    // =========================
    const userRows = await sql`
      SELECT id
      FROM users
      WHERE clerk_id = ${clerkId}
    `;

    let userId;

    if (userRows.length === 0) {
      const inserted = await sql`
        INSERT INTO users (
          clerk_id,
          email,
          name,
          avatar_url,
          role,
          is_verified
        )
        VALUES (
          ${clerkId},
          ${email},
          ${name},
          ${avatarUrl},
          'client',
          true
        )
        RETURNING id
      `;

      userId = inserted[0].id;
      console.log("✅ User created:", userId);
    } else {
      userId = userRows[0].id;

      await sql`
        UPDATE users SET
          email = COALESCE(email, ${email}),
          name = COALESCE(name, ${name}),
          avatar_url = COALESCE(avatar_url, ${avatarUrl}),
          updated_at = NOW()
        WHERE id = ${userId}
      `;
    }

    // =========================
    // 2️⃣ PROFILE
    // =========================
    await sql`
      INSERT INTO profiles (user_id)
      VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;

    // =========================
    // 3️⃣ CATEGORY_XP
    // =========================
    await sql`
      INSERT INTO category_xp (user_id, category_id, xp)
      SELECT ${userId}, c.id, 0
      FROM categories c
      ON CONFLICT (user_id, category_id) DO NOTHING
    `;

    // =========================
    // 4️⃣ USER_CHALLENGES
    // =========================
    await sql`
      INSERT INTO user_challenges (user_id, challenge_id, status, progress)
      SELECT ${userId}, ch.id, 'pending', 0
      FROM challenges ch
      WHERE ch.is_active = TRUE
      ON CONFLICT (user_id, challenge_id) DO NOTHING
    `;

    // ✅ Tout est OK → route suivante
    return next();
  } catch (error) {
    console.error("❌ syncUser error:", error);
    return res.status(500).json({ message: "User sync failed" });
  }
}
