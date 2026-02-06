import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import cloudinary from "cloudinary";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { clerkMiddleware } from "@clerk/express";
import { syncUser } from "./middleware/syncUser.js";
import syncRoute from "./routes/syncRoute.js";

import rankingRoute from "./routes/rankingRoute.js";
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
import uploadRoute from "./routes/uploadRoute.js";

import job from "./config/cron.js";
import { Redis } from "@upstash/redis";

// -------------------- Check Upstash --------------------
async function checkUpstash() {
  try {
    const redis = Redis.fromEnv();
    await redis.ping();
    console.log("✅ Upstash OK");
  } catch (err) {
    console.error("❌ Upstash error:", err.message);
  }
}

await checkUpstash();

// -------------------- App Express --------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;

// -------------------- Global Middlewares --------------------
app.set("trust proxy", 1);
app.use(cors());
app.use(helmet());
app.use(compression());

// -------------------- Cron Job --------------------
if (process.env.NODE_ENV === "production") {
  console.log("🕐 Starting cron job...");
  job.start();
  console.log("✅ Cron job started - ping every 14 minutes");
} else {
  console.log("⏭️ Cron job skipped (dev mode)");
}

// -------------------- Logs --------------------
console.log("\n=== Environment Check ===");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING");
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY ? "✅ SET" : "❌ MISSING");
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY ? "✅ SET" : "❌ MISSING");
console.log("CLOUDINARY_URL:", !!process.env.CLOUDINARY_URL ? "✅ SET" : "❌ MISSING");
console.log("UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL ? "✅ SET" : "⚠️  OPTIONAL");
console.log("PORT:", PORT);
console.log("=== End Check ===\n");

// -------------------- Logs --------------------
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY);
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY);
console.log("UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL);
console.log(
  "UPSTASH_REDIS_REST_TOKEN",
  process.env.UPSTASH_REDIS_REST_TOKEN?.slice(0, 4) + "...",
);

// -------------------- Public Routes --------------------
// -------------------- Warm-up endpoint --------------------
app.get("/api/wake", (req, res) => {
  res.status(200).json({
    status: "awake",
    timestamp: new Date().toISOString(),
  });
});
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/test", (req, res) => res.json({ message: "API OK" }));

// -------------------- Protected Middlewares --------------------
const protectedMiddlewares = [rateLimiter, clerkMiddleware(), syncUser];

// -------------------- Protected Routes --------------------
app.get("/api", protectedMiddlewares, (req, res) => {
  console.log("➡️ /api called", req.auth);
  res.json({ userId: req.auth.userId });
});

// -------------------- Routes Endpoints --------------------
app.use("/api/sync-user", syncRoute);

// ✅ Routes publiques (GET seulement)
app.use("/api/ranking", rankingRoute);
app.use("/api/categories", categoriesRoute);

// ✅ Routes protégées (les middlewares sont appliqués à chaque route individuellement)
app.use("/api/users", usersRoute);
app.use("/api/profiles", profilesRoute);
app.use("/api/services", servicesRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/badges", badgesRoute);
app.use("/api/user-badges", userBadgesRoute);
app.use("/api/category-xp", categoryXpRoute);
app.use("/api/challenges", challengesRoute);
app.use("/api/user-challenges", userChallengesRoute);
app.use("/api/upload", uploadRoute);

// -------------------- Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  if (err?.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

// -------------------- Start Server --------------------
// -------------------- Start Server --------------------
async function startServer() {
  try {
    console.log("🔧 Starting server initialization...");
    console.log(`📅 Time: ${new Date().toISOString()}`);
    
    // Timeout de 30 secondes SEULEMENT pour l'initialisation de la BD
    const dbInitTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database initialization timeout (30s)")), 30000)
    );
    
    console.log("⏳ Waiting for database initialization...");
    await Promise.race([initDB(), dbInitTimeout]);
    console.log("✅ Database ready!");
    
    // ✅ IMPORTANT : Bind sur 0.0.0.0 pour Render
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      console.log(`📅 Server started at: ${new Date().toISOString()}`);
    });
    
    // Gestion des erreurs du serveur
    server.on("error", (err) => {
      console.error("❌ Server error:", err.message);
      process.exit(1);
    });
    
    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("📢 SIGTERM signal received: closing HTTP server");
      server.close(() => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });
    });
    
  } catch (err) {
    console.error("❌ Failed to start server:", err.message || err);
    console.error("Stack trace:", err.stack);
    process.exit(1);
  }
}

startServer();
