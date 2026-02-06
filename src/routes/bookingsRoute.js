import express from "express";
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, getBookings);
router.get("/:id", requireAuth, getBookingById);
router.post("/", requireAuth, createBooking);
router.put("/:id", requireAuth, updateBooking);
router.delete("/:id", requireAuth, deleteBooking);

export default router;
