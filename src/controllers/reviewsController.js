import { sql } from "../config/db.js";
import { syncBadgesForUser } from "./userBadgesController.js";

// 🎯 Fonction pour synchroniser le total_xp du profil avec la somme des category_xp
async function syncUserTotalXP(userId) {
  try {
    console.log("🔄 Synchronisation du total_xp pour l'utilisateur", userId);
    
    // Calculer la somme de tous les XP des catégories
    const totalXpResult = await sql`
      SELECT COALESCE(SUM(xp), 0) as total_xp
      FROM category_xp
      WHERE user_id = ${userId}
    `;
    
    console.log("📊 Résultat SUM query:", totalXpResult);
    const newTotalXp = totalXpResult[0]?.total_xp || 0;
    console.log("📊 Total XP calculé:", newTotalXp, "Type:", typeof newTotalXp);
    
    // Mettre à jour le profil avec le nouveau total
    console.log("🔄 UPDATE profiles SET xp_total = ${newTotalXp} WHERE user_id = ${userId}");
    const updateResult = await sql`
      UPDATE profiles
      SET xp_total = ${newTotalXp}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `;
    
    console.log("📊 Résultat UPDATE:", updateResult);
    console.log("✅ Profile total_xp mis à jour à:", newTotalXp);
  } catch (error) {
    console.error("❌ Erreur lors de la synchronisation du total_xp:", error);
    console.error("Stack:", error.stack);
  }
}

export async function getReviews(req, res) {
  try {
    const reviews = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
    res.status(200).json(reviews);
  } catch (error) {
    console.log("Error getting reviews", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getReviewById(req, res) {
  try {
    const { id } = req.params;
    const review = await sql`SELECT * FROM reviews WHERE id = ${id}`;

    if (review.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(review[0]);
  } catch (error) {
    console.log("Error getting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createReview(req, res) {
  try {
    const { service_id, booking_id, reviewer_id, provider_id, rating, comment, is_verified } = req.body;

    console.log("📚 createReview called with:", { service_id, reviewer_id, provider_id, rating });

    if (!service_id || !reviewer_id || !provider_id || !rating) {
      console.warn("⚠️ Missing required fields:", { service_id, reviewer_id, provider_id, rating });
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Vérifier si l'utilisateur a déjà noté ce service
    const existingReview = await sql`
      SELECT id, rating FROM reviews
      WHERE service_id = ${service_id} AND reviewer_id = ${reviewer_id}
    `;

    console.log("🔍 Existing reviews found:", existingReview.length, existingReview);

    let review;
    if (existingReview.length > 0) {
      // ✅ Mettre à jour la note existante
      console.log("🔄 Updating existing review:", existingReview[0].id, "from rating", existingReview[0].rating, "to", rating);
      const updated = await sql`
        UPDATE reviews
        SET rating = ${rating}, comment = ${comment}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingReview[0].id}
        RETURNING *
      `;
      console.log("✅ Updated review:", updated[0]);
      review = updated[0];
      
      // 🎯 Ajouter du XP aussi pour les mises à jour (bonus pour correction de note)
      console.log("📍 Mise à jour détectée - Ajout de 2 XP bonus");
    } else {
      // ✅ Créer une nouvelle note
      console.log("✨ Creating new review for service", service_id, "by reviewer", reviewer_id);
      const created = await sql`
        INSERT INTO reviews(service_id, booking_id, reviewer_id, provider_id, rating, comment, is_verified)
        VALUES (${service_id}, ${booking_id}, ${reviewer_id}, ${provider_id}, ${rating}, ${comment}, ${is_verified})
        RETURNING *
      `;
      console.log("✅ Created review:", created[0]);
      review = created[0];
    }

    // 🔄 Mettre à jour la note moyenne du service (arrondir à la dixième)
    console.log("📊 Mise à jour de la note moyenne du service:", service_id);
    const avgRating = await sql`
      SELECT ROUND(AVG(rating)::numeric, 1) as average_rating
      FROM reviews
      WHERE service_id = ${service_id}
    `;

    console.log("📊 Average rating for service:", avgRating[0]);

    if (avgRating.length > 0 && avgRating[0].average_rating) {
      await sql`
        UPDATE services
        SET average_rating = ${avgRating[0].average_rating}
        WHERE id = ${service_id}
      `;
      console.log("✅ Service note mise à jour:", avgRating[0].average_rating);
    }

    // 🔄 Mettre à jour la note globale du profil du provider (arrondir à la dixième)
    console.log("📊 Mise à jour de la note globale du profil:", provider_id);
    const providerAvgRating = await sql`
      SELECT ROUND(AVG(rating)::numeric, 1) as rating_avg
      FROM reviews
      WHERE provider_id = ${provider_id}
    `;

    console.log("📊 Average rating for provider:", providerAvgRating[0]);

    if (providerAvgRating.length > 0 && providerAvgRating[0].rating_avg) {
      await sql`
        UPDATE profiles
        SET rating_avg = ${providerAvgRating[0].rating_avg}
        WHERE user_id = ${provider_id}
      `;
      console.log("✅ Profil note mise à jour:", providerAvgRating[0].rating_avg);
    }

    // 🎯 SECTION AJOUT DE XP - Ajouter 2 XP au prestataire dans la catégorie du service
    console.log("═══════════════════════════════════════════");
    console.log("🎯 DÉBUT - AJOUT DE XP");
    console.log("═══════════════════════════════════════════");
    console.log("📍 Provider ID:", provider_id, "| Service ID:", service_id);
    
    try {
      // Récupérer la catégorie du service
      console.log("🔍 Recherche du service...");
      const serviceData = await sql`
        SELECT id, category_id FROM services WHERE id = ${service_id}
      `;
      
      console.log("✅ Service trouvé? ", serviceData.length > 0);
      if (serviceData.length > 0) {
        console.log("📌 Service details:", serviceData[0]);
      }
      
      if (serviceData.length > 0 && serviceData[0].category_id) {
        const category_id = serviceData[0].category_id;
        console.log("🎓 Category ID:", category_id);
        console.log("🧑 Provider ID:", provider_id);
        console.log("🔍 Recherche du XP existant pour user", provider_id, "category", category_id);
        
        // Vérifier si l'utilisateur a déjà du XP dans cette catégorie
        const existingCategoryXp = await sql`
          SELECT id, xp FROM category_xp
          WHERE user_id = ${provider_id} AND category_id = ${category_id}
        `;
        
        console.log("🔍 Recherche complétée. Résultat:", existingCategoryXp);
        console.log("🔍 XP existant trouvé?", existingCategoryXp.length > 0);
        
        if (existingCategoryXp.length > 0) {
          // Mettre à jour le XP existant
          console.log("📈 Avant UPDATE - XP actuel:", existingCategoryXp[0].xp);
          console.log("📝 Exécution: UPDATE category_xp SET xp = xp + 2 WHERE user_id = ${provider_id} AND category_id = ${category_id}");
          
          const updated = await sql`
            UPDATE category_xp
            SET xp = xp + 2
            WHERE user_id = ${provider_id} AND category_id = ${category_id}
            RETURNING *
          `;
          
          console.log("📊 Résultat UPDATE:", updated);
          console.log("📊 Nombre de lignes mises à jour:", updated.length);
          
          if (updated.length > 0) {
            console.log("✅ SUCCÈS - XP mis à jour: +2");
            console.log("📊 Nouvelle valeur XP:", updated[0].xp);
          } else {
            console.warn("⚠️ ATTENTION - UPDATE n'a retourné aucune ligne!");
          }
        } else {
          // Créer une nouvelle ligne avec 2 XP
          console.log("✨ Création du XP - Pas d'XP existant");
          console.log("📝 Exécution: INSERT INTO category_xp(user_id, category_id, xp) VALUES (${provider_id}, ${category_id}, 2)");
          
          const created = await sql`
            INSERT INTO category_xp(user_id, category_id, xp)
            VALUES (${provider_id}, ${category_id}, 2)
            RETURNING *
          `;
          
          console.log("📊 Résultat INSERT:", created);
          console.log("✅ SUCCÈS - XP créé avec 2 points");
          console.log("📊 Nouvelle entrée:", created[0]);
        }
        
        // 🔄 Synchroniser le total_xp du profil avec la somme des category_xp
        console.log("🔄 Synchronisation du total_xp...");
        await syncUserTotalXP(provider_id);
        console.log("✅ Synchronisation complétée");
      } else {
        console.warn("❌ ERREUR - Service non trouvé ou pas de category_id");
      }
    } catch (xpError) {
      console.error("❌ ERREUR - Lors de l'ajout du XP:", xpError);
      console.error("Stack trace:", xpError.stack);
    }
    
    console.log("═══════════════════════════════════════════");
    console.log("🎯 FIN - AJOUT DE XP");
    console.log("═══════════════════════════════════════════");

    // 🎯 Sync badges for the provider after rating is updated
    console.log("🏅 Synchronisation des badges...");
    await syncBadgesForUser(provider_id);
    console.log("✅ Badges synchronisés");

    console.log("📤 Retour de la réponse:", review);
    res.status(201).json(review);
  } catch (error) {
    console.log("❌ Error creating review", error);
    console.error("Full error:", error.stack);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment, reply, is_verified } = req.body;

    const updated = await sql`
      UPDATE reviews
      SET rating = COALESCE(${rating}, rating),
          comment = COALESCE(${comment}, comment),
          reply = COALESCE(${reply}, reply),
          is_verified = COALESCE(${is_verified}, is_verified),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM reviews WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.log("Error deleting review", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// ✅ Récupérer la note existante de l'utilisateur pour un service
export async function getUserReviewForService(req, res) {
  try {
    const { serviceId } = req.params;
    const reviewerId = req.userId; // Récupère l'ID utilisateur du middleware auth

    if (!serviceId || !reviewerId) {
      return res.status(400).json({ message: "Missing serviceId or userId" });
    }

    const review = await sql`
      SELECT id, rating, comment
      FROM reviews
      WHERE service_id = ${serviceId} AND reviewer_id = ${reviewerId}
      LIMIT 1
    `;

    if (review.length === 0) {
      return res.status(200).json(null); // Pas de note existante
    }

    res.status(200).json(review[0]);
  } catch (error) {
    console.log("Error getting user review:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
