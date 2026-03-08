import { sql } from "../config/db.js";
import { syncBadgesForUser } from "./userBadgesController.js";

/* =======================
   GET ALL SERVICES
======================= */
export async function getServices(req, res) {
  try {
    const services = await sql`
      SELECT 
        s.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS username
      FROM services s
      JOIN categories c ON c.id = s.category_id
      JOIN users u ON u.id = s.user_id
      WHERE s.status = 'active'
      ORDER BY s.created_at DESC
      LIMIT 100
    `;

    res.status(200).json(services);
  } catch (error) {
    console.error("Error getting services:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   GET SERVICE BY ID
======================= */
export async function getServiceById(req, res) {
  try {
    const { id } = req.params;

    const service = await sql`
      SELECT 
        s.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS username,
        u.email,
        u.avatar_url
      FROM services s
      JOIN categories c ON c.id = s.category_id
      JOIN users u ON u.id = s.user_id
      WHERE s.id = ${id}
    `;

    if (service.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    // ✅ Récupérer le nombre de notes (reviews) pour ce service
    const reviewCount = await sql`
      SELECT COUNT(id) as total_reviews
      FROM reviews
      WHERE service_id = ${id}
    `;

    // ✅ Gère le fallback côté JavaScript au lieu de SQL
    const result = service[0];
    if (!result.username) {
      result.username = result.email?.split('@')[0] || 'Anonyme';
    }

    // ✅ Ajouter le nombre de reviews
    result.total_reviews = reviewCount[0]?.total_reviews || 0;

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting service:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   POSITION DU SERVICE
======================= */

export async function getPosService(req, res) {
  try {
    const services = await sql`
      SELECT 
        s.*,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS username
      FROM services s
      JOIN categories c ON c.id = s.category_id
      JOIN users u ON u.id = s.user_id
      WHERE 
        s.status = 'active'
        AND s.latitude IS NOT NULL 
        AND s.longitude IS NOT NULL
      ORDER BY s.created_at DESC
    `;

    res.json(services);
  } catch (error) {
    console.error("Error getting nearby services:", error);
    res.status(500).json({ message: "Internal server error" });
  }

}

/* =======================
   CREATE SERVICE / DEMANDE
======================= */
export async function createService(req, res) {
  try {
    const {
      title,
      description,
      price,
      category, // ✅ SLUG envoyé par le front
      image_url,
      type = "service",
      is_hourly = false,
      unit_type,
      latitude,
      longitude,
      address,
      city,
      postal_code,
    } = req.body;

    console.log("📝 Creating service with category slug:", category);

    // 🔹 Vérifier les champs minimaux
    if (!title || !description || !price || !category) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        received: req.body 
      });
    }

    // ✅ Récupérer category_id depuis le slug
    const categoryResult = await sql`
      SELECT id FROM categories WHERE slug = ${category}
    `;
    
    if (categoryResult.length === 0) {
      console.error("❌ Category not found for slug:", category);
      return res.status(400).json({ 
        message: "Invalid category slug", 
        received_slug: category 
      });
    }
    
    const category_id = categoryResult[0].id;
    console.log("✅ Category found:", category_id);

    // 🔹 Récupérer l'utilisateur depuis le JWT
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;
    
    if (userResult.length === 0) {
      return res.status(400).json({ 
        message: "User not found", 
        clerkId: req.clerkUserId 
      });
    }
    
    const user_id = userResult[0].id;

    // 🔹 Insérer le service
    const service = await sql`
      INSERT INTO services (
        title,
        description,
        price,
        category_id,
        image_url,
        user_id,
        type,
        is_hourly,
        unit_type,
        latitude,
        longitude,
        address,
        city,
        postal_code
      )
      VALUES (
        ${title},
        ${description},
        ${price},
        ${category_id},
        ${image_url},
        ${user_id},
        ${type},
        ${is_hourly},
        ${unit_type || null},
        ${latitude},
        ${longitude},
        ${address},
        ${city},
        ${postal_code}
      )
      RETURNING *
    `;

    const serviceId = service[0].id;
    console.log("✅ Service created:", serviceId);

    // 🔹 Si c'est une demande (type = "demande"), envoyer des notifications aux vendeurs qui ont débloqué la catégorie
    if (type === "demande") {
      try {
        // Récupérer le nom de la catégorie
        const categoryData = await sql`
          SELECT name FROM categories WHERE id = ${category_id}
        `;
        const categoryName = categoryData[0]?.name;
        
        if (categoryName) {
          // Créer les notifications pour TOUS les vendeurs avec la catégorie débloquée
          await sql`
            INSERT INTO notifications (
              user_id,
              sender_id,
              service_id,
              type,
              title,
              content,
              action_url
            )
            SELECT 
              cx.user_id,
              ${user_id},
              ${serviceId},
              'service_demand',
              'Nouvelle demande dans votre catégorie!',
              ${`Un utilisateur recherche: ${title}`},
              ${`/service/${serviceId}`}
            FROM category_xp cx
            WHERE cx.category_id = ${category_id} 
              AND cx.completed_jobs > 0
          `;

          console.log(`✅ Notifications sent to vendors with ${categoryName} category unlocked`);
        }
      } catch (notificationError) {
        console.error("⚠️ Error sending notifications:", notificationError);
        // Ne pas échouer la création du service si les notifications échouent
      }
    }

    // 🎯 Sync badges for the user after service is published
    await syncBadgesForUser(user_id);

    res.status(201).json(service[0]);
  } catch (error) {
    console.error("❌ Error creating service:", error);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
}


/* =======================
   UPDATE SERVICE
======================= */
export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      category, // ✅ SLUG envoyé par le front
      status,
      is_hourly,
      type,
      image_url,
      unit_type,
      latitude,
      longitude,
      address,
      city,
      postal_code,
    } = req.body;

    // ✅ Récupère le category_id depuis le slug
    let category_id = null;
    if (category) {
      const categoryResult = await sql`
        SELECT id FROM categories WHERE slug = ${category}
      `;
      if (categoryResult.length > 0) {
        category_id = categoryResult[0].id;
      }
    }

    const updated = await sql`
      UPDATE services
      SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        price = COALESCE(${price}, price),
        category_id = COALESCE(${category_id}, category_id),
        status = COALESCE(${status}, status),
        is_hourly = COALESCE(${is_hourly}, is_hourly),
        type = COALESCE(${type}, type),
        unit_type = COALESCE(${unit_type}, unit_type),
        latitude = COALESCE(${latitude}, latitude),
        longitude = COALESCE(${longitude}, longitude),
        address = COALESCE(${address}, address),
        city = COALESCE(${city}, city),
        postal_code = COALESCE(${postal_code}, postal_code),
        image_url = COALESCE(${image_url}, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   DELETE SERVICE
======================= */
export async function deleteService(req, res) {
  try {
    const { id } = req.params;

    const deleted = await sql`
      DELETE FROM services
      WHERE id = ${id}
      RETURNING *
    `;

    if (deleted.length === 0) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

/* =======================
   GET SERVICE STATISTICS
======================= */
export async function getServiceStats(req, res) {
  try {
    const { id } = req.params;

    // Vérifier que le service existe
    const serviceCheck = await sql`
      SELECT id FROM services WHERE id = ${id}
    `;

    if (serviceCheck.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    // Récupérer les statistiques
    const stats = await sql`
      SELECT
        COALESCE(COUNT(DISTINCT r.id), 0) as total_reviews,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COALESCE(COUNT(DISTINCT b.id), 0) as total_bookings,
        COALESCE(SUM(b.quantity), 0) as total_quantity
      FROM services s
      LEFT JOIN reviews r ON r.service_id = s.id
      LEFT JOIN bookings b ON b.service_id = s.id
      WHERE s.id = ${id}
    `;

    // Données fictives pour les statistiques avancées (à implémenter vraiment dans la BD)
    const data = stats[0] || {};

    res.status(200).json({
      total_clicks: Math.floor(Math.random() * 500),
      avg_time_spent: Math.floor(Math.random() * 120),
      total_reviews: parseInt(data.total_reviews) || 0,
      avg_rating: parseFloat(data.avg_rating) || 0,
      total_bookings: parseInt(data.total_bookings) || 0,
      geographic_data: [
        { location: "Polynésie française", clicks: Math.floor(Math.random() * 100) },
        { location: "Île de Tahiti", clicks: Math.floor(Math.random() * 80) },
        { location: "Bora Bora", clicks: Math.floor(Math.random() * 50) },
      ],
    });
  } catch (error) {
    console.error("Error getting service stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
