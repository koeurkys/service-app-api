import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { clerkMiddleware } from "@clerk/express";
import { syncUser } from "./middleware/syncUser.js";

import usersRoute from "./routes/usersRoute.js";
import categoriesRoute from "./routes/categoriesRoute.js";
import profilesRoute from "./routes/profilesRoute.js";
import servicesRoute from "./routes/servicesRoute.js";
import bookingsRoute from "./routes/bookingsRoute.js";
import reviewsRoute from "./routes/reviewsRoute.js";
import badgesRoute from "./routes/badgesRoute.js";
import userBadgesRoute from "./routes/userBadgesRoute.js";
import categoryXpRoute from "./routes/categoryXpRoute.js";
import challengesRoute from "./routes/challengesRoute.js";
import userChallengesRoute from "./routes/userChallengesRoute.js";

import job from "./config/cron.js";

const app = express();
const PORT = process.env.PORT || 5001;

/**
 * =======================
 *  Middlewares globaux
 * =======================
 */
app.use(cors());
app.use(helmet());          // sécurité headers
app.use(compression());     // gzip
app.use(express.json());    // body parser JSON

// Log clé Clerk (utile pour debug)
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY);
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY);

/**
 * =======================
 *  Cron job (prod only)
 * =======================
 */
if (process.env.NODE_ENV === "production") {
  job.start();
}

/**
 * =======================
 *  Routes publiques
 * =======================
 */
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/test", (req, res) => res.json({ message: "API OK" }));

/**
 * =======================
 *  Middlewares protégés (utilisés par toutes les routes privées)
 * =======================
 */
const protectedMiddlewares = [
  rateLimiter,
  clerkMiddleware(),
  syncUser
];

/**
 * =======================
 *  Routes protégées
 * =======================
 */
app.get("/api", protectedMiddlewares, (req, res) => {
  console.log("➡️ /api called", req.auth);
  res.json({ userId: req.auth.userId });
});

app.use("/api/users", protectedMiddlewares, usersRoute);
app.use("/api/categories", protectedMiddlewares, categoriesRoute);
app.use("/api/profiles", protectedMiddlewares, profilesRoute);
app.use("/api/services", protectedMiddlewares, servicesRoute);
app.use("/api/bookings", protectedMiddlewares, bookingsRoute);
app.use("/api/reviews", protectedMiddlewares, reviewsRoute);
app.use("/api/badges", protectedMiddlewares, badgesRoute);
app.use("/api/user-badges", protectedMiddlewares, userBadgesRoute);
app.use("/api/category-xp", protectedMiddlewares, categoryXpRoute);
app.use("/api/challenges", protectedMiddlewares, challengesRoute);
app.use("/api/user-challenges", protectedMiddlewares, userChallengesRoute);

/**
 * =======================
 *  Error handler
 * =======================
 */
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  // plus précis si c'est un problème de Clerk ou autre
  if (err?.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

/**
 * =======================
 *  Start server
 * =======================
 */
async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
