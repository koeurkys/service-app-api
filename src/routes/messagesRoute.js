import express from "express";
import { getConversation, sendMessage, markAsRead, getUserConversations } from "../controllers/messagesController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Récupérer toutes les conversations de l'utilisateur
router.get("/", requireAuth, getUserConversations);

// Récupérer la conversation avec un utilisateur spécifique
router.get("/:userId", requireAuth, getConversation);

// Envoyer un message
router.post("/", requireAuth, sendMessage);

// Marquer les messages comme lus
router.put("/:senderId/read", requireAuth, markAsRead);

export default router;
