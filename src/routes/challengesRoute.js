import express from "express";
import {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  deleteChallenge,
} from "../controllers/challengesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getChallenges);
router.get("/:id", getChallengeById);
router.post("/", requireAuth, createChallenge);
router.put("/:id", requireAuth, updateChallenge);
router.delete("/:id", requireAuth, deleteChallenge);

export default router;
