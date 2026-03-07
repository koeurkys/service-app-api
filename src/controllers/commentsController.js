import { sql } from "../config/db.js";

// ✅ Obtenir tous les commentaires d'un service (avec réponses imbriquées)
export async function getServiceComments(req, res) {
  try {
    const { serviceId } = req.params;

    // Récupérer les commentaires principaux avec les infos utilisateur
    const mainComments = await sql`
      SELECT 
        sc.id,
        sc.service_id,
        sc.author_id,
        sc.parent_comment_id,
        sc.content,
        sc.created_at,
        u.name AS author_name,
        u.avatar_url AS author_avatar,
        p.level AS author_level,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = sc.id) AS likes_count,
        (SELECT COUNT(*) FROM service_comments WHERE parent_comment_id = sc.id) AS replies_count
      FROM service_comments sc
      INNER JOIN users u ON sc.author_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE sc.service_id = ${serviceId} AND sc.parent_comment_id IS NULL
      ORDER BY sc.created_at DESC
    `;

    // Pour chaque commentaire principal, récupérer les réponses
    const commentsWithReplies = await Promise.all(
      mainComments.map(async (comment) => {
        const replies = await sql`
          SELECT 
            sc.id,
            sc.service_id,
            sc.author_id,
            sc.parent_comment_id,
            sc.content,
            sc.created_at,
            u.name AS author_name,
            u.avatar_url AS author_avatar,
            p.level AS author_level,
            (SELECT COUNT(*) FROM comment_likes WHERE comment_id = sc.id) AS likes_count
          FROM service_comments sc
          INNER JOIN users u ON sc.author_id = u.id
          LEFT JOIN profiles p ON u.id = p.user_id
          WHERE sc.parent_comment_id = ${comment.id}
          ORDER BY sc.created_at ASC
        `;

        return {
          ...comment,
          replies: replies || [],
        };
      })
    );

    res.status(200).json(commentsWithReplies);
  } catch (error) {
    console.error("❌ Erreur récupération commentaires:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Créer un commentaire
export async function createComment(req, res) {
  try {
    const { serviceId } = req.params;
    const { authorId, content, parentCommentId } = req.body;

    if (!serviceId || !authorId || !content) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: "Le commentaire ne peut pas être vide" });
    }

    // Vérifier que le service existe
    const service = await sql`SELECT id FROM services WHERE id = ${serviceId}`;
    if (service.length === 0) {
      return res.status(404).json({ message: "Service non trouvé" });
    }

    // Vérifier que l'utilisateur existe
    const user = await sql`SELECT id FROM users WHERE id = ${authorId}`;
    if (user.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Si c'est une réponse, vérifier que le commentaire parent existe
    if (parentCommentId) {
      const parentComment = await sql`SELECT id FROM service_comments WHERE id = ${parentCommentId}`;
      if (parentComment.length === 0) {
        return res.status(404).json({ message: "Commentaire parent non trouvé" });
      }
    }

    // Créer le commentaire
    const comment = await sql`
      INSERT INTO service_comments (service_id, author_id, content, parent_comment_id)
      VALUES (${serviceId}, ${authorId}, ${content}, ${parentCommentId || null})
      RETURNING *
    `;

    // Récupérer les infos complètes du commentaire
    const fullComment = await sql`
      SELECT 
        sc.id,
        sc.service_id,
        sc.author_id,
        sc.parent_comment_id,
        sc.content,
        sc.created_at,
        u.name AS author_name,
        u.avatar_url AS author_avatar,
        p.level AS author_level,
        (SELECT COUNT(*) FROM comment_likes WHERE comment_id = sc.id) AS likes_count
      FROM service_comments sc
      INNER JOIN users u ON sc.author_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE sc.id = ${comment[0].id}
    `;

    console.log("✅ Commentaire créé:", fullComment[0]);
    res.status(201).json(fullComment[0]);
  } catch (error) {
    console.error("❌ Erreur création commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Supprimer un commentaire
export async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Vérifier que le commentaire existe et que l'utilisateur en est l'auteur
    const comment = await sql`SELECT author_id FROM service_comments WHERE id = ${commentId}`;
    if (comment.length === 0) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    if (comment[0].author_id !== userId) {
      return res.status(403).json({ message: "Non autorisé à supprimer ce commentaire" });
    }

    // Supprimer les likes associés
    await sql`DELETE FROM comment_likes WHERE comment_id = ${commentId}`;

    // Supprimer les réponses (commentaires enfants)
    const replies = await sql`SELECT id FROM service_comments WHERE parent_comment_id = ${commentId}`;
    for (const reply of replies) {
      await sql`DELETE FROM comment_likes WHERE comment_id = ${reply.id}`;
      await sql`DELETE FROM service_comments WHERE id = ${reply.id}`;
    }

    // Supprimer le commentaire
    const deleted = await sql`DELETE FROM service_comments WHERE id = ${commentId} RETURNING id`;

    console.log("✅ Commentaire supprimé:", deleted[0].id);
    res.status(200).json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    console.error("❌ Erreur suppression commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Liker/unliker un commentaire
export async function toggleCommentLike(req, res) {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    // Vérifier que le commentaire existe
    const comment = await sql`SELECT id FROM service_comments WHERE id = ${commentId}`;
    if (comment.length === 0) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    // Vérifier que l'utilisateur existe
    const user = await sql`SELECT id FROM users WHERE id = ${userId}`;
    if (user.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifier si l'utilisateur a déjà liké ce commentaire
    const existingLike = await sql`
      SELECT id FROM comment_likes 
      WHERE comment_id = ${commentId} AND user_id = ${userId}
    `;

    let liked = false;
    if (existingLike.length > 0) {
      // Supprimer le like
      await sql`DELETE FROM comment_likes WHERE comment_id = ${commentId} AND user_id = ${userId}`;
      liked = false;
    } else {
      // Ajouter le like
      await sql`INSERT INTO comment_likes (comment_id, user_id) VALUES (${commentId}, ${userId})`;
      liked = true;
    }

    // Récupérer le nombre de likes mis à jour
    const likesCount = await sql`SELECT COUNT(*) as count FROM comment_likes WHERE comment_id = ${commentId}`;

    console.log(`✅ Like ${liked ? "ajouté" : "supprimé"} au commentaire ${commentId}`);
    res.status(200).json({
      liked,
      likesCount: likesCount[0].count,
      message: `Like ${liked ? "ajouté" : "supprimé"}`,
    });
  } catch (error) {
    console.error("❌ Erreur toggle like:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Vérifier si l'utilisateur a liké un commentaire
export async function checkCommentLike(req, res) {
  try {
    const { commentId, userId } = req.query;

    if (!commentId || !userId) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const like = await sql`
      SELECT id FROM comment_likes 
      WHERE comment_id = ${commentId} AND user_id = ${userId}
    `;

    res.status(200).json({
      liked: like.length > 0,
    });
  } catch (error) {
    console.error("❌ Erreur vérification like:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Éditer un commentaire
export async function updateComment(req, res) {
  try {
    const { commentId } = req.params;
    const { userId, content } = req.body;

    if (!commentId || !userId || !content) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({ message: "Le commentaire ne peut pas être vide" });
    }

    // Vérifier que le commentaire existe et que l'utilisateur en est l'auteur
    const comment = await sql`SELECT author_id FROM service_comments WHERE id = ${commentId}`;
    if (comment.length === 0) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    if (comment[0].author_id !== userId) {
      return res.status(403).json({ message: "Non autorisé à modifier ce commentaire" });
    }

    // Mettre à jour le commentaire
    const updated = await sql`
      UPDATE service_comments 
      SET content = ${content}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${commentId}
      RETURNING *
    `;

    console.log("✅ Commentaire modifié:", updated[0].id);
    res.status(200).json(updated[0]);
  } catch (error) {
    console.error("❌ Erreur modification commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Obtenir les stats des commentaires d'un service
export async function getServiceCommentsStats(req, res) {
  try {
    const { serviceId } = req.params;

    const stats = await sql`
      SELECT 
        COUNT(*) as total_comments,
        COUNT(DISTINCT author_id) as unique_authors,
        MAX(created_at) as last_comment_at
      FROM service_comments
      WHERE service_id = ${serviceId}
    `;

    res.status(200).json(stats[0]);
  } catch (error) {
    console.error("❌ Erreur stats commentaires:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Obtenir les nouveaux commentaires non lus pour les services de l'utilisateur
export async function getUnreadCommentsNotifications(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId requis" });
    }

    // Récupérer tous les serviceIds de l'utilisateur
    const userServices = await sql`SELECT id FROM services WHERE user_id = ${userId}`;
    
    if (userServices.length === 0) {
      return res.status(200).json({ notifications: [], total_unread: 0 });
    }

    const serviceIds = userServices.map(s => s.id);

    // Récupérer les commentaires non lus groupés par service
    const unreadComments = await sql`
      SELECT 
        s.id as service_id,
        s.title as service_title,
        COUNT(*) as unread_count,
        ARRAY_AGG(
          JSON_BUILD_OBJECT(
            'id', sc.id,
            'content', sc.content,
            'author_name', u.name,
            'created_at', sc.created_at
          )
          ORDER BY sc.created_at DESC
        ) as comments
      FROM service_comments sc
      INNER JOIN services s ON sc.service_id = s.id
      INNER JOIN users u ON sc.author_id = u.id
      WHERE sc.service_id = ANY(${serviceIds}::INTEGER[])
      AND sc.is_read = FALSE
      AND sc.parent_comment_id IS NULL
      GROUP BY s.id, s.title
      ORDER BY s.id DESC
    `;

    // Formater les résultats avec aperçu des commentaires
    const notifications = unreadComments.map(item => {
      const previewsText = item.comments
        .slice(0, 2) // Afficher max 2 commentaires en aperçu
        .map(comment => {
          const text = comment.content;
          // Tronquer à 100 caractères si trop long
          return text.length > 100 ? text.substring(0, 100) + "..." : text;
        });

      return {
        service_id: item.service_id,
        service_title: item.service_title,
        unread_count: parseInt(item.unread_count),
        comment_previews: previewsText,
        all_comments: item.comments,
      };
    });

    const totalUnread = notifications.reduce((sum, n) => sum + n.unread_count, 0);

    console.log(`✅ ${totalUnread} commentaires non lus pour l'utilisateur ${userId}`);
    res.status(200).json({
      notifications,
      total_unread: totalUnread,
    });
  } catch (error) {
    console.error("❌ Erreur récupération notifications:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Marquer les commentaires d'un service comme lus
export async function markCommentsAsRead(req, res) {
  try {
    const { serviceId } = req.params;
    const { userId } = req.body;

    if (!serviceId || !userId) {
      return res.status(400).json({ message: "serviceId et userId requis" });
    }

    // Vérifier que l'utilisateur est le propriétaire du service
    const service = await sql`SELECT user_id FROM services WHERE id = ${serviceId}`;
    if (service.length === 0 || service[0].user_id !== userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Marquer tous les commentaires du service comme lus
    const updated = await sql`
      UPDATE service_comments
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE service_id = ${serviceId} AND is_read = FALSE
      RETURNING id
    `;

    console.log(`✅ ${updated.length} commentaires marqués comme lus`);
    res.status(200).json({
      message: "Commentaires marqués comme lus",
      updated_count: updated.length,
    });
  } catch (error) {
    console.error("❌ Erreur marquage commentaires:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}

// ✅ Marquer un commentaire spécifique comme lu
export async function markCommentAsRead(req, res) {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!commentId || !userId) {
      return res.status(400).json({ message: "commentId et userId requis" });
    }

    // Récupérer le commentaire et vérifier que l'utilisateur est le propriétaire du service
    const comment = await sql`
      SELECT sc.id, s.user_id
      FROM service_comments sc
      INNER JOIN services s ON sc.service_id = s.id
      WHERE sc.id = ${commentId}
    `;

    if (comment.length === 0) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    if (comment[0].user_id !== userId) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    // Marquer le commentaire comme lu
    const updated = await sql`
      UPDATE service_comments
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${commentId}
      RETURNING id
    `;

    console.log(`✅ Commentaire ${commentId} marqué comme lu`);
    res.status(200).json({ message: "Commentaire marqué comme lu" });
  } catch (error) {
    console.error("❌ Erreur marquage commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}
