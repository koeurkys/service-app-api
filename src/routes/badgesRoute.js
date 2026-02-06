import express from "express";
import {
  getBadges,
  getBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
} from "../controllers/badgesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getBadges);
router.get("/:id", getBadgeById);
router.post("/", requireAuth, createBadge);
router.put("/:id", requireAuth, updateBadge);
router.delete("/:id", requireAuth, deleteBadge);

export default router;
