import express from "express";
import {
  getServiceComments,
  createComment,
  deleteComment,
  toggleCommentLike,
  checkCommentLike,
  updateComment,
  getServiceCommentsStats,
  getUnreadCommentsNotifications,
  markCommentsAsRead,
  markCommentAsRead,
  getUnreadLikesNotifications,
  markLikesAsRead,
  markAllLikesAsReadForService,
} from "../controllers/commentsController.js";

const router = express.Router();

// ✅ Obtenir tous les commentaires d'un service
router.get("/service/:serviceId", getServiceComments);

// ✅ Obtenir les stats des commentaires d'un service
router.get("/service/:serviceId/stats", getServiceCommentsStats);

// ✅ Créer un commentaire
router.post("/service/:serviceId", createComment);

// ✅ Mettre à jour un commentaire
router.put("/:commentId", updateComment);

// ✅ Supprimer un commentaire
router.delete("/:commentId", deleteComment);

// ✅ Liker/unliker un commentaire
router.post("/:commentId/like", toggleCommentLike);

// ✅ Vérifier si l'utilisateur a liké un commentaire
router.get("/:commentId/like/check", checkCommentLike);

// ✅ Obtenir les notifications de commentaires non lus pour l'utilisateur
router.get("/notifications/unread/:userId", getUnreadCommentsNotifications);

// ✅ Obtenir les notifications de likes non lus pour l'utilisateur
router.get("/likes/notifications/unread/:userId", getUnreadLikesNotifications);

// ✅ Marquer tous les commentaires d'un service comme lus
router.post("/service/:serviceId/mark-read", markCommentsAsRead);

// ✅ Marquer un commentaire spécifique comme lu
router.post("/:commentId/mark-read", markCommentAsRead);

// ✅ Marquer les likes comme lus pour un commentaire
router.post("/:commentId/likes/mark-read", markLikesAsRead);

// ✅ Marquer tous les likes comme lus pour un service
router.post("/service/:serviceId/likes/mark-read", markAllLikesAsReadForService);

export default router;
