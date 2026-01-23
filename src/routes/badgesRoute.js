import express from "express";
import {
  getBadges,
  getBadgeById,
  createBadge,
  updateBadge,
  deleteBadge,
} from "../controllers/badgesController.js";

const router = express.Router();

router.get("/", getBadges);
router.get("/:id", getBadgeById);
router.post("/", createBadge);
router.put("/:id", updateBadge);
router.delete("/:id", deleteBadge);

export default router;
