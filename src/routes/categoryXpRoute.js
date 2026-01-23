import express from "express";
import {
  getCategoryXp,
  getCategoryXpByUserId,
  createCategoryXp,
  updateCategoryXp,
  deleteCategoryXp,
} from "../controllers/categoryXpController.js";

const router = express.Router();

router.get("/", getCategoryXp);
router.get("/:userId", getCategoryXpByUserId);
router.post("/", createCategoryXp);
router.put("/:id", updateCategoryXp);
router.delete("/:id", deleteCategoryXp);

export default router;
