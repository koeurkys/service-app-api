import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Récupérer toutes les notifications pour l'utilisateur actuel
router.get("/", requireAuth, getNotifications);

// Récupérer le nombre de notifications non lues
router.get("/unread/count", requireAuth, getUnreadCount);

// Marquer une notification comme lue
router.put("/:id/read", requireAuth, markAsRead);

// Marquer toutes les notifications comme lues
router.put("/read/all", requireAuth, markAllAsRead);

// Supprimer une notification
router.delete("/:id", requireAuth, deleteNotification);

// Supprimer toutes les notifications
router.delete("/", requireAuth, deleteAllNotifications);

export default router;
