import express from "express";
import { getProfileByMe, getProfileByUserId } from "../controllers/profilesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/me", requireAuth, getProfileByMe);
// Ajoute cette route AVANT /:id
router.get("/:userId", getProfileByUserId);

export default router;
