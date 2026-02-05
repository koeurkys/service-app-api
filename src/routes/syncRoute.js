import { clerkClient } from "@clerk/express";
import sql from "../config/db.js"; // adapte ton import

export const syncUser = async (req, res, next) => {
  try {
    const { userId } = req.auth;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 🔥 récupère VRAIES données depuis Clerk
    const user = await clerkClient.users.getUser(userId);

    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    const email =
      user.primaryEmailAddress?.emailAddress || "";

    const avatar = user.imageUrl || "";
    const phone = user.unsafeMetadata?.phone || "";

    // =========================
    // UPSERT DB
    // =========================
    await sql.query(
      `
      INSERT INTO users (clerk_id, first_name, last_name, email, avatar_url, phone)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (clerk_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        email = EXCLUDED.email,
        avatar_url = EXCLUDED.avatar_url,
        phone = EXCLUDED.phone
      `,
      [userId, firstName, lastName, email, avatar, phone]
    );

    next();
  } catch (err) {
    console.error("syncUser error:", err);
    res.status(500).json({ error: "Sync failed" });
  }
};
