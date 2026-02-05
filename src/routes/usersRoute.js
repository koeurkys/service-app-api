import express from "express";
import { clerkMiddleware } from "@clerk/express";
import {
  getUsers,
  getUserById,
  getUserByMe,
} from "../controllers/usersController.js";
import { syncUser } from "../middleware/syncUser.js";

const router = express.Router();

// ME = utilisateur connecté
router.get("/me", clerkMiddleware(), syncUser, getUserByMe);

// Admin only (optionnel)
router.get("/", getUsers);
router.get("/:id", getUserById);

export default router;
