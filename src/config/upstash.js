import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import "dotenv/config";

let ratelimit;

try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, "60 s"),
  });
  console.log("✅ Ratelimit initialized");
} catch (err) {
  console.error("❌ Ratelimit initialization failed:", err.message);
}

// Middleware avec fallback si Upstash échoue
export default async function rateLimiter(req, res, next) {
  if (!ratelimit) {
    console.warn("⚠️ Ratelimit not available, skipping...");
    return next();
  }

  try {
    const identifier = req.auth?.userId || req.ip || "anonymous";
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (!success) {
      return res.status(429).json({
        message: "Too many requests",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      });
    }

    next();
  } catch (err) {
    console.error("❌ Ratelimit error:", err.message);
    // Continue sans rate limiting en cas d'erreur Upstash
    next();
  }
}