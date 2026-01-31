import { verifyToken } from "@clerk/clerk-sdk-node";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ vérification officielle Clerk
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    console.log("✅ Auth OK:", payload.sub);

    req.clerkUserId = payload.sub; // user id Clerk

    next();
  } catch (err) {
    console.error("❌ Auth error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
