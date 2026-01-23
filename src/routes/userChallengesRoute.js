import express from "express";
import {
  getUserChallenges,
  getUserChallengesByUserId,
  createUserChallenge,
  updateUserChallenge,
  deleteUserChallenge,
} from "../controllers/userChallengesController.js";

const router = express.Router();

router.get("/", getUserChallenges);
router.get("/:userId", getUserChallengesByUserId);
router.post("/", createUserChallenge);
router.put("/:id", updateUserChallenge);
router.delete("/:id", deleteUserChallenge);

export default router;
