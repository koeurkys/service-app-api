import ratelimit from "../config/upstash.js";

const rateLimiter = async (req, res, next) => {
  try {
    const { success } = await ratelimit.limit("my-rate-limit");

    if (!success) {
      return res.status(429).json({
        message: "Too many requests, please try again later.",
      });
    }

    next();
  } catch (error) {
    // Si Upstash renvoie du HTML (ex: 404 page), on ne doit pas crash le serveur
    console.log("Rate limit error", error);

    // On n’envoie pas d’erreur pour éviter les problèmes de body-parser
    // mais on peut tout de même répondre un message propre
    return res.status(503).json({
      message: "Rate limiter unavailable. Try again later.",
    });
  }
};

export default rateLimiter;
