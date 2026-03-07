import express from "express";
import {
  getServiceComments,
  createComment,
  deleteComment,
  toggleCommentLike,
  checkCommentLike,
  updateComment,
  getServiceCommentsStats,
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

export default router;
