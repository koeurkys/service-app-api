import express from "express";
import {
  getReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getUserReviewForService,
} from "../controllers/reviewsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getReviews);
router.get("/user/:serviceId", requireAuth, getUserReviewForService); // ✅ Nouveau endpoint
router.get("/:id", getReviewById);
router.post("/", requireAuth, createReview);
router.put("/:id", requireAuth, updateReview);
router.delete("/:id", requireAuth, deleteReview);

export default router;
