import express from "express";
import {
  getCategoryXp,
  getCategoryXpByUserId,
  createCategoryXp,
  updateCategoryXp,
  deleteCategoryXp,
} from "../controllers/categoryXpController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getCategoryXp);
router.get("/:userId", requireAuth, getCategoryXpByUserId);
router.post("/", requireAuth, createCategoryXp);
router.put("/:id", requireAuth, updateCategoryXp);
router.delete("/:id", requireAuth, deleteCategoryXp);

export default router;
