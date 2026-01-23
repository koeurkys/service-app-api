import { sql } from "../config/db.js";

export async function getServices(req, res) {
  try {
    const services = await sql`SELECT * FROM services ORDER BY created_at DESC`;
    res.status(200).json(services);
  } catch (error) {
    console.log("Error getting services", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getServiceById(req, res) {
  try {
    const { id } = req.params;
    const service = await sql`SELECT * FROM services WHERE id = ${id}`;

    if (service.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service[0]);
  } catch (error) {
    console.log("Error getting service", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createService(req, res) {
  try {
    const {
      title,
      description,
      price,
      category_id,
      user_id,
      latitude,
      longitude,
      address,
      city,
      postal_code,
      status,
    } = req.body;

    if (!title || !description || !price || !category_id || !user_id) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const service = await sql`
      INSERT INTO services(title, description, price, category_id, user_id, latitude, longitude, address, city, postal_code, status)
      VALUES (${title}, ${description}, ${price}, ${category_id}, ${user_id}, ${latitude}, ${longitude}, ${address}, ${city}, ${postal_code}, ${status})
      RETURNING *
    `;

    res.status(201).json(service[0]);
  } catch (error) {
    console.log("Error creating service", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateService(req, res) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      category_id,
      latitude,
      longitude,
      address,
      city,
      postal_code,
      status,
    } = req.body;

    const updated = await sql`
      UPDATE services
      SET title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          price = COALESCE(${price}, price),
          category_id = COALESCE(${category_id}, category_id),
          latitude = COALESCE(${latitude}, latitude),
          longitude = COALESCE(${longitude}, longitude),
          address = COALESCE(${address}, address),
          city = COALESCE(${city}, city),
          postal_code = COALESCE(${postal_code}, postal_code),
          status = COALESCE(${status}, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating service", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteService(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM services WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    console.log("Error deleting service", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
