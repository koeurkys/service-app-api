// backend/src/middleware/auth.js
import Clerk from "@clerk/clerk-sdk-node";

export const requireAuth = (req, res, next) => {
    console.log("test");

  try {
    // Récupérer l'utilisateur depuis le header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

    const token = authHeader.replace("Bearer ", "");
    const { userId } = Clerk.sessions.verifyToken(token); // ⚡ nouvelle syntaxe
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    req.clerkUserId = userId;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
