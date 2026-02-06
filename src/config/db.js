import { neon } from "@neondatabase/serverless";
import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // =========================
    // USERS
    // =========================
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
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`;

    // =========================
    // CATEGORIES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) UNIQUE,
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug)`;

    // =========================
    // PROFILES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        xp_total INTEGER DEFAULT 0,
        rating_avg DECIMAL(3,2) DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
        reliability_score DECIMAL(3,2) DEFAULT 100.00 CHECK (reliability_score >= 0 AND reliability_score <= 100),
        certified BOOLEAN DEFAULT FALSE,
        level INTEGER GENERATED ALWAYS AS (xp_total / 100 + 1) STORED,
        total_services_completed INTEGER DEFAULT 0,
        total_services_published INTEGER DEFAULT 0,
        bio TEXT,
        certifications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`;

    // =========================
    // SERVICES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        address VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
        average_rating DECIMAL(3,2) DEFAULT 0.00,
        total_bookings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(20) CHECK (type IN ('service', 'demande')) NOT NULL DEFAULT 'service',
        is_hourly BOOLEAN DEFAULT false,
        image_url TEXT
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)`;

    // =========================
    // BOOKINGS
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        booking_date DATE NOT NULL,
        booking_time TIME,
        duration_hours DECIMAL(5,2),
        total_price DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) CHECK (status IN ('pending','accepted','in_progress','completed','cancelled','disputed')) DEFAULT 'pending',
        notes TEXT,
        cancelled_reason TEXT,
        cancelled_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id)`;

    // =========================
    // REVIEWS
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        reply TEXT,
        reply_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // =========================
    // BADGES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS badges (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(500),
        category VARCHAR(50),
        xp_required INTEGER,
        condition_type VARCHAR(100),
        condition_value INTEGER,
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // =========================
    // USER_BADGES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, badge_id)
      )
    `;

    // =========================
    // CATEGORY_XP
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS category_xp (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        xp INTEGER DEFAULT 0,
        level INTEGER GENERATED ALWAYS AS (xp / 50 + 1) STORED,
        UNIQUE(user_id, category_id)
      )
    `;

    // =========================
    // CHALLENGES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        difficulty VARCHAR(50) CHECK (difficulty IN ('facile','moyen','difficile')) DEFAULT 'moyen',
        duration_days INTEGER DEFAULT 7,
        requirement_type VARCHAR(100),
        requirement_value INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // =========================
    // USER_CHALLENGES
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
        status VARCHAR(50) CHECK (status IN ('pending','in_progress','completed')) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        progress INTEGER DEFAULT 0,
        UNIQUE(user_id, challenge_id)
      )
    `;

    // =========================
    // TRANSACTIONS
    // =========================
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        created_at DATE NOT NULL DEFAULT CURRENT_DATE
      )
    `;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1);
  }
}
