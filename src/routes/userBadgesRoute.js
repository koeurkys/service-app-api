import express from "express";
import {
  getUserBadges,
  getUserBadgesByUserId,
  createUserBadge,
  deleteUserBadge,
} from "../controllers/userBadgesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getUserBadges);
router.get("/:userId", requireAuth, getUserBadgesByUserId);
router.post("/", requireAuth, createUserBadge);
router.delete("/:id", requireAuth, deleteUserBadge);

export default router;
