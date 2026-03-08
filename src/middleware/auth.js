import { verifyToken } from "@clerk/clerk-sdk-node";
import { sql } from "../config/db.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      console.warn("⚠️ No Bearer token in Authorization header");
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    if (!token || token.trim() === "") {
      console.warn("⚠️ Token is empty");
      return res.status(401).json({ message: "Token is empty" });
    }

    console.log("🔐 Token format check:", {
      length: token.length,
      dotCount: (token.match(/\./g) || []).length,
      isValid: (token.match(/\./g) || []).length === 2
    });

    // ✅ vérification officielle Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    console.log("✅ Auth OK:", payload.sub);

    req.clerkUserId = payload.sub; // user id Clerk

    // ✅ Récupérer l'ID de la base de données
    try {
      const [user] = await sql`
        SELECT id FROM users WHERE clerk_id = ${payload.sub}
      `;
      if (user) {
        req.userId = user.id; // ID de la base de données
      }
    } catch (dbErr) {
      console.warn("⚠️ Could not fetch database user ID:", dbErr.message);
      // Continue même si on ne peut pas récupérer l'ID (backward compatibility)
    }

    next();
  } catch (err) {
    console.error("❌ Auth error:", {
      name: err.name,
      message: err.message,
      reason: err.reason
    });
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};
