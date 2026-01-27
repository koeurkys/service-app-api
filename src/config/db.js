import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Connexion Neon
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // USERS
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id VARCHAR(255) NOT NULL UNIQUE,

        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        avatar_url VARCHAR(500),

        role VARCHAR(50) NOT NULL DEFAULT 'client',
        is_verified BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT chk_users_role CHECK (role IN ('client', 'prestataire', 'admin'))
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`;

    // 👉 le reste de ton SQL EST PARFAIT
    // 👉 tu peux le garder tel quel (categories, profiles, services, etc.)

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing DB", error);
    process.exit(1);
  }
}
