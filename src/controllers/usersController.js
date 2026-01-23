import { sql } from "../config/db.js";

export async function getUsers(req, res) {
  try {
    const users = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    res.status(200).json(users);
  } catch (error) {
    console.log("Error getting users", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const user = await sql`SELECT * FROM users WHERE id = ${id}`;
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user[0]);
  } catch (error) {
    console.log("Error getting user", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createUser(req, res) {
  try {
    const { name, email, password_hash, phone, avatar_url, role } = req.body;

    if (!name || !email || !password_hash) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const user = await sql`
      INSERT INTO users(name, email, password_hash, phone, avatar_url, role)
      VALUES (${name}, ${email}, ${password_hash}, ${phone}, ${avatar_url}, ${role})
      RETURNING *
    `;

    res.status(201).json(user[0]);
  } catch (error) {
    console.log("Error creating user", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, phone, avatar_url, role, is_verified } = req.body;

    const updated = await sql`
      UPDATE users
      SET name = COALESCE(${name}, name),
          email = COALESCE(${email}, email),
          phone = COALESCE(${phone}, phone),
          avatar_url = COALESCE(${avatar_url}, avatar_url),
          role = COALESCE(${role}, role),
          is_verified = COALESCE(${is_verified}, is_verified),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (updated.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updated[0]);
  } catch (error) {
    console.log("Error updating user", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const result = await sql`DELETE FROM users WHERE id = ${id} RETURNING *`;

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error deleting user", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
