import express from "express";
import {
  getAvailableBoosts,
  getUserBoostInventory,
  getUserActiveBoosts,
  purchaseBoost,
  activateBoost,
  deactivateBoost,
  getUserBoostStats,
  checkActiveBoostMultiplier,
} from "../controllers/boostsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Routes publiques
router.get("/available", getAvailableBoosts);

// Routes utilisateur (authentifiées)
router.get("/inventory/me", requireAuth, getUserBoostInventory);
router.get("/active/me", requireAuth, getUserActiveBoosts);
router.get("/stats/me", requireAuth, getUserBoostStats);
router.get("/multiplier/check", requireAuth, checkActiveBoostMultiplier);

// Routes POST
router.post("/purchase", requireAuth, purchaseBoost);
router.post("/activate", requireAuth, activateBoost);
router.post("/deactivate", requireAuth, deactivateBoost);

export default router;
