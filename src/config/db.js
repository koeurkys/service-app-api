import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // Récupérer le chemin réel du fichier db.js
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Remonter jusqu'à /backend puis aller vers /database/schema.sql
    const schemaPath = path.join(__dirname, "..", "..", "database", "schema.sql");

    const schema = fs.readFileSync(schemaPath, "utf8");

    await sql.unsafe(schema);

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1);
  }
}
