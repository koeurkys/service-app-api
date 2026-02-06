import express from "express";
import {
  getUserChallenges,
  getUserChallengesByUserId,
  createUserChallenge,
  updateUserChallenge,
  deleteUserChallenge,
} from "../controllers/userChallengesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getUserChallenges);
router.get("/:userId", requireAuth, getUserChallengesByUserId);
router.post("/", requireAuth, createUserChallenge);
router.put("/:id", requireAuth, updateUserChallenge);
router.delete("/:id", requireAuth, deleteUserChallenge);

export default router;
