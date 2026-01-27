import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
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

if (process.env.NODE_ENV === "production") job.start();

app.use(cors());
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

// --- LOG KEYS ---
console.log("CLERK_SECRET_KEY:", !!process.env.CLERK_SECRET_KEY);
console.log("CLERK_PUBLISHABLE_KEY:", !!process.env.CLERK_PUBLISHABLE_KEY);

// =======================
// ROUTES PUBLIQUES
// =======================

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Route de test (SANS Clerk)
app.get("/api/test", (req, res) => {
  res.json({ message: "API OK" });
});

// =======================
// ROUTES PROTÉGÉES
// =======================

// Route / (avec Clerk)
app.get("/api", clerkMiddleware(), syncUser, (req, res) => {
  res.json({ userId: req.auth.userId });
});

// Routes protégées (avec Clerk + syncUser)
app.use("/api/users", clerkMiddleware(), syncUser, usersRoute);
app.use("/api/categories", clerkMiddleware(), syncUser, categoriesRoute);
app.use("/api/profiles", clerkMiddleware(), syncUser, profilesRoute);
app.use("/api/services", clerkMiddleware(), syncUser, servicesRoute);
app.use("/api/bookings", clerkMiddleware(), syncUser, bookingsRoute);
app.use("/api/reviews", clerkMiddleware(), syncUser, reviewsRoute);
app.use("/api/badges", clerkMiddleware(), syncUser, badgesRoute);
app.use("/api/user-badges", clerkMiddleware(), syncUser, userBadgesRoute);
app.use("/api/category-xp", clerkMiddleware(), syncUser, categoryXpRoute);
app.use("/api/challenges", clerkMiddleware(), syncUser, challengesRoute);
app.use("/api/user-challenges", clerkMiddleware(), syncUser, userChallengesRoute);

// =======================
// START SERVER
// =======================

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
});
