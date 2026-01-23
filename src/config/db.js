import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // Path to schema.sql
    const schemaPath = join(process.cwd(), "backend", "database", "schema.sql");

    // Read the SQL file content
    const schema = readFileSync(schemaPath, "utf8");

    // Execute the full SQL schema
    await sql`${schema}`;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1); // status code 1 means failure, 0 success
  }
}
