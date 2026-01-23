import { sql } from "../config/db.js";

export async function getBadges(req, res) {
  try {
    const badges = await sql`SELECT * FROM badges ORDER BY created_at DESC`;
    res.status(200).json(badges);
  } catch (error) {
    console.log("Error getting badges", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBadgeById(req, res) {
  try {
    const { id } = req.params;
    const badge = await sql`SELECT * FROM badges WHERE id = ${id}`;

    if (badge.length === 0) {
      return res.status(404).json({ message: "Badge not found" });
    }

    res.status(200).json(badge[0]);
  } catch (error) {
    console.log("Error getting badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createBadge(req, res) {
  try {
    const { name, description, icon, category, xp_required, condition_type, condition_value, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const badge = await sql`
      INSERT INTO badges(name, description, icon, category, xp_required, condition_type, condition_value, color)
      VALUES (${name}, ${description}, ${icon}, ${category}, ${xp_required}, ${condition_type}, ${condition_value}, ${color})
      RETURNING *
    `;

    res.status(201).json(badge[0]);
  } catch (error) {
    console.log("Error creating badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBadge(req, res) {
  try {
    const { id } = req.params;
    const { name, description, icon, category, xp_required, condition_type, condition_value, color } = req.body;

    const updated = await sql`
      UPDATE badges
      SET name = COALESCE(${name}, name),
          description = COALESCE(${description}, description),
          icon = COALESCE(${icon}, icon),
          category = COALESCE(${category}, category),
          xp_required = COALESCE(${xp_required}, xp_required),
          condition_type = COALESCE(${condition_type}, condition_type),
          condition_value = COALESCE(${condition_value}, condition_value),
          color = COALESCE(${color}, color)
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "Badge not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteBadge(req, res) {
  try {
    const { id } = req.params;
    const result = await sql`DELETE FROM badges WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "Badge not found" });
    }

    res.status(200).json({ message: "Badge deleted successfully" });
  } catch (error) {
    console.log("Error deleting badge", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
