import dotenv from "dotenv";
dotenv.config();

console.log("1️⃣ [INIT] dotenv loaded");

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import cloudinary from "cloudinary";
import { Server } from "socket.io";
import http from "http";

console.log("2️⃣ [INIT] Basic imports completed");

import { initDB } from "./config/db.js";
console.log("3️⃣ [INIT] initDB imported");

import rateLimiter from "./middleware/rateLimiter.js";
console.log("4️⃣ [INIT] rateLimiter imported");

import { clerkMiddleware } from "@clerk/express";
console.log("5️⃣ [INIT] clerkMiddleware imported");

import { syncUser } from "./middleware/syncUser.js";
console.log("6️⃣ [INIT] syncUser imported");

import syncRoute from "./routes/syncRoute.js";
console.log("7️⃣ [INIT] syncRoute imported");

import rankingRoute from "./routes/rankingRoute.js";
console.log("8️⃣ [INIT] rankingRoute imported");

import usersRoute from "./routes/usersRoute.js";
import categoriesRoute from "./routes/categoriesRoute.js";
import profilesRoute from "./routes/profilesRoute.js";
import servicesRoute from "./routes/servicesRoute.js";
import bookingsRoute from "./routes/bookingsRoute.js";
import reviewsRoute from "./routes/reviewsRoute.js";
import messagesRoute from "./routes/messagesRoute.js";
import badgesRoute from "./routes/badgesRoute.js";
import userBadgesRoute from "./routes/userBadgesRoute.js";
import categoryXpRoute from "./routes/categoryXpRoute.js";
import challengesRoute from "./routes/challengesRoute.js";
import userChallengesRoute from "./routes/userChallengesRoute.js";
import uploadRoute from "./routes/uploadRoute.js";

console.log("9️⃣ [INIT] All routes imported");

// ⚠️ N'importer le cron job QUE PLUS TARD (non-bloquant)
let job = null;

console.log("🔟 [INIT] Cron job deferment set");

import { Redis } from "@upstash/redis";
console.log("1️⃣1️⃣ [INIT] Redis imported");

// -------------------- Check Upstash --------------------
async function checkUpstash() {
  try {
    // Timeout de 5 secondes pour Upstash
    const upstashCheck = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error("Upstash timeout")), 5000);
    });
    
    const redis = Redis.fromEnv();
    const pingPromise = redis.ping();
    
    await Promise.race([pingPromise, upstashCheck]);
    console.log("✅ Upstash OK");
  } catch (err) {
    console.warn("⚠️  Upstash not available:", err.message);
    console.warn("⚠️  Rate limiting will be disabled");
  }
}

// ✅ Vérifier Upstash EN ARRIÈRE-PLAN (ne pas bloquer le démarrage)
checkUpstash().catch(err => {
  console.warn("⚠️  Background Upstash check failed:", err.message);
});

// -------------------- App Express --------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;

// ✅ Créer un HTTP server pour Socket.IO
const server = http.createServer(app);

// ✅ Initialiser Socket.IO
export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// Connection Socket.IO
io.on("connection", (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

console.log("📦 Express app initialized");
console.log(`🔧 Configuring middleware...`);

// -------------------- Global Middlewares --------------------
app.set("trust proxy", 1);
app.use(cors());
app.use(helmet());
app.use(compression());

console.log("✅ Global middlewares configured");

// ⚠️ IMPORTER LE CRON JOB PLUS TARD (après l'initialisation des autres choses)
async function initializeCronJob() {
  try {
    console.log("📥 Loading cron job...");
    const cronModule = await import("./config/cron.js");
    job = cronModule.default;
    console.log("✅ Cron job loaded");
  } catch (err) {
    console.error("❌ Failed to load cron job:", err.message);
  }
}

// NOTE: Cron job sera démarré dans startServer() une fois chargé

// -------------------- Environment Check --------------------
console.log("\n=== 🔍 Environment Variables ===");
console.log("NODE_ENV:", process.env.NODE_ENV || "development");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ SET" : "❌ MISSING");
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY ? "✅ SET" : "❌ MISSING");
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY ? "✅ SET" : "❌ MISSING");
console.log("CLOUDINARY_URL:", !!process.env.CLOUDINARY_URL ? "✅ SET" : "❌ MISSING");
console.log("UPSTASH_REDIS_REST_URL:", process.env.UPSTASH_REDIS_REST_URL ? "✅ SET" : "⚠️  OPTIONAL");
console.log("PORT:", PORT);
console.log("=== End Check ===\n");

// -------------------- Public Routes --------------------
console.log("📍 Setting up public routes...");

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
  res.json({ userId: req.auth?.userId });
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
app.use("/api/messages", messagesRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/badges", badgesRoute);
app.use("/api/user-badges", userBadgesRoute);
app.use("/api/category-xp", categoryXpRoute);
app.use("/api/challenges", challengesRoute);
app.use("/api/user-challenges", userChallengesRoute);
app.use("/api/upload", uploadRoute);

console.log("✅ All routes configured successfully");

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
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on 0.0.0.0:${PORT}`);
      console.log(`🌐 WebSocket enabled`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      console.log(`📅 Server started at: ${new Date().toISOString()}`);
      
      // ⏳ Charger et démarrer le cron job APRÈS le démarrage du serveur
      initializeCronJob().then(() => {
        if (job) {
          if (process.env.NODE_ENV === "production") {
            console.log("🕐 Starting cron job...");
            job.start();
            console.log("✅ Cron job started - ping every 14 minutes");
          } else {
            console.log("⏭️ Cron job skipped (dev mode)");
          }
        }
      }).catch(err => {
        console.warn("⚠️ Failed to setup cron job:", err.message);
      });
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

console.log("🎯 Calling startServer()...");
startServer();
