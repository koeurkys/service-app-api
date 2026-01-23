import express from "express";
import dotenv from "dotenv";
import { initDB } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";

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

// middleware
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// ROUTES
app.use("/api/users", usersRoute);
app.use("/api/categories", categoriesRoute);
app.use("/api/profiles", profilesRoute);
app.use("/api/services", servicesRoute);
app.use("/api/bookings", bookingsRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/badges", badgesRoute);
app.use("/api/user-badges", userBadgesRoute);
app.use("/api/category-xp", categoryXpRoute);
app.use("/api/challenges", challengesRoute);
app.use("/api/user-challenges", userChallengesRoute);

initDB().then(() => {
  app.listen(PORT, () => {
    console.log("🚀 Server running on PORT:", PORT);
  });
});
