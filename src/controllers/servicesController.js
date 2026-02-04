import { sql } from "../config/db.js";

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

    // ✅ Gère le fallback côté JavaScript au lieu de SQL
    const result = service[0];
    if (!result.username) {
      result.username = result.email?.split('@')[0] || 'Anonyme';
    }

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
      category, // nom envoyé par le front
      image_url,
      type = "service",
      is_hourly = false,
      latitude,
      longitude,
      address,
      city,
      postal_code,
    } = req.body;
    // 🔹 Vérifier les champs minimaux
    if (!title || !description || !price || !category) {
      return res.status(400).json({ message: "Missing required fields", received: req.body });
    }

    // 🔹 Récupérer category_id depuis le nom
    const categoryResult = await sql`
      SELECT id FROM categories WHERE name = ${category}
    `;
    if (categoryResult.length === 0) {
      return res.status(400).json({ message: "Invalid category", received: req.body });
    }
    const category_id = categoryResult[0].id;

    // 🔹 Récupérer l'utilisateur depuis le JWT (req.clerkUserId)
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_id = ${req.clerkUserId}
    `;
    if (userResult.length === 0) {
      return res.status(400).json({ message: "User not found", clerkId: req.clerkUserId });
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
        ${latitude},
        ${longitude},
        ${address},
        ${city},
        ${postal_code}
      )
      RETURNING *
    `;

    res.status(201).json(service[0]);
  } catch (error) {
    console.error("Error creating service:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
      category, // ✅ Reçoit le NOM de la catégorie
      status,
      is_hourly,
      type,
      image_url,
      latitude,
      longitude,
      address,
      city,
      postal_code,
    } = req.body;

    // ✅ Récupère le category_id depuis le nom
    let category_id = null;
    if (category) {
      const categoryResult = await sql`
        SELECT id FROM categories WHERE name = ${category}
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
