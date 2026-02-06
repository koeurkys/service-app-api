import { sql } from "../config/db.js";

// ✅ Fonction utilitaire pour générer un slug
function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '_')      // Remplace les espaces par des underscores
    .replace(/_+/g, '_');      // Élimine les underscores multiples
}

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

    const slug = generateSlug(name);

    const result = await sql`
      INSERT INTO categories (name, slug)
      VALUES (${name}, ${slug})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating category", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
