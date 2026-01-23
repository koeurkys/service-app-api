import express from "express";
import {
  getUserBadges,
  getUserBadgesByUserId,
  createUserBadge,
  deleteUserBadge,
} from "../controllers/userBadgesController.js";

const router = express.Router();

router.get("/", getUserBadges);
router.get("/:userId", getUserBadgesByUserId);
router.post("/", createUserBadge);
router.delete("/:id", deleteUserBadge);

export default router;
