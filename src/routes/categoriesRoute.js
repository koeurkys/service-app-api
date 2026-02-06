import express from "express";
import {
  getAllCategories,
  createCategory,
} from "../controllers/categoriesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", requireAuth, createCategory);

export default router;
