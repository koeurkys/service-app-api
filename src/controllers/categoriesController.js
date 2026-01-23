import { sql } from "../config/db.js";

export async function getAllCategories(req, res) {
  try {
    const categories = await sql`
      SELECT * FROM categories ORDER BY name ASC
    `;
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error fetching categories", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createCategory(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const result = await sql`
      INSERT INTO categories (name)
      VALUES (${name})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating category", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
