import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
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
