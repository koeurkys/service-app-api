import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByMe,
  getPosService,
} from "../controllers/usersController.js";

const router = express.Router();

// ✅ /me DOIT être AVANT /:id et en GET pas DELETE
router.get("/me", getUserByMe);
router.get("/nearby", getPosService);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Ajoute cette route dans usersRoute.js

export default router;