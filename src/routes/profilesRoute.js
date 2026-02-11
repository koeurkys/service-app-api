import express from "express";
import { getProfileByMe, getProfileByUserId, getCategoryXpByMe, getCategoryXpByUserId } from "../controllers/profilesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, getProfileByMe);
router.get("/category-xp", requireAuth, getCategoryXpByMe);
router.get("/:userId/category-xp", getCategoryXpByUserId);
// Ajoute cette route APRÈS les routes /me et /category-xp
router.get("/:userId", getProfileByUserId);

export default router;
