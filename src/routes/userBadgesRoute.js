import express from "express";
import {
  getUserBadges,
  getUserBadgesByUserId,
  createUserBadge,
  deleteUserBadge,
  getMyBadges,
  getAllBadges,
  awardBadge,
  syncBadges,
} from "../controllers/userBadgesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Public routes
router.get("/all", getAllBadges);

// Protected routes
router.get("/my-badges", requireAuth, getMyBadges);
router.get("/", requireAuth, getUserBadges);
router.get("/:userId", requireAuth, getUserBadgesByUserId);
router.post("/", requireAuth, createUserBadge);
router.post("/award", requireAuth, awardBadge);
router.post("/sync", requireAuth, syncBadges);
router.delete("/:id", requireAuth, deleteUserBadge);

export default router;
