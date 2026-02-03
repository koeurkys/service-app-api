import express from "express";
import {
  getRanking,
  getMyRank,
} from "../controllers/rankingController.js";

const router = express.Router();

/*
  GET /api/ranking?limit=50
  leaderboard global
*/
router.get("/", getRanking);

/*
  GET /api/ranking/me
  rang perso
*/
router.get("/me", getMyRank);

export default router;
