import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    // ✅ Utilise un identifiant unique par utilisateur (Clerk ID ou IP)
    const identifier = req.auth?.userId || req.ip || "anonymous";
    
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    // ✅ Ajoute des headers informatifs
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
        retryAfter: Math.ceil((reset - Date.now()) / 1000), // en secondes
      });
    }

    return next();
  } catch (error) {
    // 🔥 IMPORTANT: ne pas crash l'API
    console.log("Rate limit error (fallback ON):", error?.message ?? error);

    // Fallback: on autorise la requête
    return next();
  }
};

export default rateLimiter;