import { sql } from "../config/db.js";

export async function syncUser(req, res, next) {
  console.log("🔵 syncUser called", req.path);

  const clerkId = req.auth?.userId;
  console.log("userId:", clerkId);

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

    const existing = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId}
    `;

    if (existing.length === 0) {
      // 🔹 Création
      await sql`
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
      `;
    } else {
      // 🔹 Mise à jour si NULL
      await sql`
        UPDATE users SET
          email = COALESCE(email, ${email}),
          name = COALESCE(name, ${name}),
          avatar_url = COALESCE(avatar_url, ${avatarUrl})
        WHERE clerk_id = ${clerkId}
      `;
    }

    next();
  } catch (error) {
    console.error("❌ syncUser error:", error);
    res.status(500).json({ message: "User sync failed" });
  }
}
