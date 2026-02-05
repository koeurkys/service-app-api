export async function syncUser(req, res, next) {
  if (!req.auth?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const clerkId = req.auth.userId;
  const claims = req.auth.sessionClaims ?? {};

  const email =
    claims.email ??
    claims.email_address ??
    null;

  const name =
    claims.name ??
    `${claims.given_name ?? ""} ${claims.family_name ?? ""}`.trim() ??
    claims.username ??
    null;

  const avatarUrl =
    claims.image_url ??
    claims.picture ??
    null;

  try {
    // 🔥 UPSERT USER
    const [user] = await sql`
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
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING id
    `;

    const userId = user.id;

    // profile
    await sql`
      INSERT INTO profiles (user_id)
      VALUES (${userId})
      ON CONFLICT (user_id) DO NOTHING
    `;

    // xp
    await sql`
      INSERT INTO category_xp (user_id, category_id, xp)
      SELECT ${userId}, c.id, 0
      FROM categories c
      ON CONFLICT (user_id, category_id) DO NOTHING
    `;

    // challenges
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
