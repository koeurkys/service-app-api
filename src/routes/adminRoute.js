import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getAllUsersForAdmin,
  updateUserRole,
  getAdminChallenges,
  createChallengeAdmin,
  updateChallengeAdmin,
  deleteChallengeAdmin,
  isAdminMiddleware,
} from "../controllers/adminController.js";

const router = express.Router();

/* ===================================================== */
/* ADMIN MIDDLEWARE - protect all routes */
/* ===================================================== */
router.use(requireAuth, isAdminMiddleware);

/* ===================================================== */
/* USER MANAGEMENT */
/* ===================================================== */
router.get("/users", getAllUsersForAdmin);
router.put("/users/:userId/role", updateUserRole);

/* ===================================================== */
/* CHALLENGE MANAGEMENT */
/* ===================================================== */
router.get("/challenges", getAdminChallenges);
router.post("/challenges", createChallengeAdmin);
router.put("/challenges/:id", updateChallengeAdmin);
router.delete("/challenges/:id", deleteChallengeAdmin);

export default router;
