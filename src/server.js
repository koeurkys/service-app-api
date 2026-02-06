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
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY);
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY);
console.log("UPSTASH_REDIS_REST_URL", process.env.UPSTASH_REDIS_REST_URL);
console.log(
  "UPSTASH_REDIS_REST_TOKEN",
  process.env.UPSTASH_REDIS_REST_TOKEN?.slice(0, 4) + "..."
);

// -------------------- Public Routes --------------------
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
app.get("/api/test", (req, res) => res.json({ message: "API OK" }));

// -------------------- Protected Middlewares --------------------
const protectedMiddlewares = [rateLimiter, clerkMiddleware(), syncUser];

// -------------------- Protected Routes --------------------
app.get("/api", protectedMiddlewares, (req, res) => {
  console.log("➡️ /api called", req.auth);
  res.json({ userId: req.auth.userId });
});

app.use("/api/sync-user", syncRoute);


app.use("/api/ranking", rankingRoute);
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

// -------------------- Cloudinary Upload Endpoint --------------------

// Config Cloudinary depuis CLOUDINARY_URL
cloudinary.v2.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

const upload = multer({ dest: "uploads/" });

app.use("/api/upload", protectedMiddlewares, uploadRoute); // ✅


// -------------------- Error Handler --------------------
app.use((err, req, res, next) => {
  console.error("❌ SERVER ERROR:", err);

  if (err?.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: "Internal Server Error" });
});

// -------------------- Start Server --------------------
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
