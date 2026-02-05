import express from "express";
import { getProfileByMe, getProfileByUserId } from "../controllers/profilesController.js";

const router = express.Router();

router.get("/me", getProfileByMe);
// Ajoute cette route AVANT /:id
router.get("/:userId", getProfileByUserId);

export default router;
