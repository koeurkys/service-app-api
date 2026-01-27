import { sql } from "../config/db.js";

export async function syncUser(req, res, next) {
  console.log("🔵 syncUser called", req.path);

  const clerkId = req.auth?.userId;
  if (!clerkId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

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

    // -------------------------
    // 1) USERS
    // -------------------------
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;

    let userId;

    if (existingUser.length === 0) {
      const inserted = await sql`
        INSERT INTO users (
          clerk_id,
          email,
          name,
          avatar_url,
          role,
          is_verified,
          created_at,
          updated_at
        )
        VALUES (
          ${clerkId},
          ${email},
          ${name},
          ${avatarUrl},
          'client',
          true,
          NOW(),
          NOW()
        )
        RETURNING id
      `;
      userId = inserted[0].id;
    } else {
      userId = existingUser[0].id;
      await sql`
        UPDATE users SET
          email = COALESCE(email, ${email}),
          name = COALESCE(name, ${name}),
          avatar_url = COALESCE(avatar_url, ${avatarUrl}),
          updated_at = NOW()
        WHERE clerk_id = ${clerkId}
      `;
    }

    // -------------------------
    // 2) PROFILE
    // -------------------------
    const existingProfile = await sql`
      SELECT * FROM profiles WHERE user_id = ${userId}
    `;

    if (existingProfile.length === 0) {
      await sql`
        INSERT INTO profiles (user_id)
        VALUES (${userId})
      `;
    }

    // -------------------------
    // 3) CATEGORY_XP (pour chaque catégorie)
    // -------------------------
    const categories = await sql`
      SELECT id FROM categories
    `;

    for (const cat of categories) {
      const existingCatXp = await sql`
        SELECT * FROM category_xp
        WHERE user_id = ${userId} AND category_id = ${cat.id}
      `;

      if (existingCatXp.length === 0) {
        await sql`
          INSERT INTO category_xp (user_id, category_id, xp)
          VALUES (${userId}, ${cat.id}, 0)
        `;
      }
    }

    // -------------------------
    // 4) USER_BADGES (aucun badge au départ)
    // -------------------------
    // On ne crée pas automatiquement de badge ici
    // (sinon ça ajoute des badges non mérités)

    // -------------------------
    // 5) USER_CHALLENGES (optionnel)
    // -------------------------
    // Ici on peut créer les challenges actifs
    // (si tu veux lancer des challenges dès le signup)
    const activeChallenges = await sql`
      SELECT id FROM challenges WHERE is_active = TRUE
    `;

    for (const ch of activeChallenges) {
      const existingUserChallenge = await sql`
        SELECT * FROM user_challenges
        WHERE user_id = ${userId} AND challenge_id = ${ch.id}
      `;

      if (existingUserChallenge.length === 0) {
        await sql`
          INSERT INTO user_challenges (user_id, challenge_id, status, progress)
          VALUES (${userId}, ${ch.id}, 'pending', 0)
        `;
      }
    }

    next();
  } catch (error) {
    console.error("❌ syncUser error:", error);
    res.status(500).json({ message: "User sync failed" });
  }
}
