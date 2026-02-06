import express from "express";
import {
  getUsers,
  getUserById,
  getUserByMe,
} from "../controllers/usersController.js";
import { requireAuth } from "../middleware/auth.js";
import { syncUser } from "../middleware/syncUser.js";

const router = express.Router();

// ME = utilisateur connecté
router.get("/me", requireAuth, syncUser, getUserByMe);

// Admin only (optionnel)
router.get("/", getUsers);
router.get("/:id", getUserById);

export default router;
