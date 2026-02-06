import express from "express";
import {
  getMyBookings,
  getReceivedBookings,
  createBooking,
  getBookingById,
  acceptBooking,
  completeBooking,
  cancelBooking,
} from "../controllers/bookingsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Récupérer mes réservations (en tant que client)
router.get("/my-bookings", requireAuth, getMyBookings);

// Récupérer les réservations reçues (en tant que prestataire)
router.get("/received", requireAuth, getReceivedBookings);

// Créer une réservation
router.post("/", requireAuth, createBooking);

// Récupérer une réservation spécifique
router.get("/:id", requireAuth, getBookingById);

// Accepter une réservation
router.put("/:id/accept", requireAuth, acceptBooking);

// Marquer comme complétée
router.put("/:id/complete", requireAuth, completeBooking);

// Annuler une réservation
router.put("/:id/cancel", requireAuth, cancelBooking);

export default router;
