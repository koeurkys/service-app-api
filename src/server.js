import express from "express";
import dotenv from "dotenv";
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

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") job.start();

app.use(cors());
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Routes publiques
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Route de test
app.get("/api/test", clerkMiddleware(), (req, res) => {
  res.json({
    auth: req.auth,
    headers: req.headers,
  });
});

// Route "me" : déclenche syncUser
app.get("/api/me", clerkMiddleware(), syncUser, (req, res) => {
  res.json({ userId: req.auth.userId });
});

// Routes protégées (Clerk + syncUser)
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

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
});
