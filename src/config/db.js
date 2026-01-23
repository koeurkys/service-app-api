import { neon } from "@neondatabase/serverless";
import "dotenv/config";

// Creates a SQL connection using our DB URL
export const sql = neon(process.env.DATABASE_URL);

export async function initDB() {
  try {
    // USERS
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
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

    // CATEGORIES
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name)`;

    // PROFILES
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        xp_total INTEGER DEFAULT 0,
        rating_avg DECIMAL(3, 2) DEFAULT 0.00,
        reliability_score DECIMAL(3, 2) DEFAULT 100.00,
        certified BOOLEAN DEFAULT FALSE,
        level INTEGER GENERATED ALWAYS AS (xp_total / 100 + 1) STORED,
        total_services_completed INTEGER DEFAULT 0,
        total_services_published INTEGER DEFAULT 0,
        bio TEXT,
        certifications TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT uq_profiles_user UNIQUE (user_id),
        CONSTRAINT chk_rating_avg CHECK (rating_avg >= 0 AND rating_avg <= 5),
        CONSTRAINT chk_reliability_score CHECK (reliability_score >= 0 AND reliability_score <= 100)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_xp_total ON profiles(xp_total)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_rating_avg ON profiles(rating_avg)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_profiles_certified ON profiles(certified)`;

    // SERVICES
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        address VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        average_rating DECIMAL(3, 2) DEFAULT 0.00,
        total_bookings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_services_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        CONSTRAINT fk_services_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_services_price CHECK (price > 0),
        CONSTRAINT chk_services_status CHECK (status IN ('active', 'inactive', 'archived'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_user_id ON services(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_status ON services(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_location ON services(latitude, longitude)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_city ON services(city)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_created_at ON services(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_price ON services(price)`;

    // BOOKINGS
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        client_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIME,
        duration_hours DECIMAL(5, 2),
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        notes TEXT,
        cancelled_reason TEXT,
        cancelled_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bookings_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_bookings_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_bookings_status CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC)`;

    // REVIEWS
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        booking_id INTEGER,
        reviewer_id INTEGER NOT NULL,
        provider_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        reply TEXT,
        reply_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reviews_service FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_provider FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_reviews_rating CHECK (rating >= 1 AND rating <= 5)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_service_id ON reviews(service_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON reviews(reviewer_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON reviews(provider_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`;

    // BADGES
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
    await sql`CREATE INDEX IF NOT EXISTS idx_badges_xp_required ON badges(xp_required)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_badges_category ON badges(category)`;

    // USER_BADGES
    await sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
        CONSTRAINT uq_user_badges UNIQUE (user_id, badge_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC)`;

    // CATEGORY_XP
    await sql`
      CREATE TABLE IF NOT EXISTS category_xp (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        xp INTEGER DEFAULT 0,
        level INTEGER GENERATED ALWAYS AS (xp / 50 + 1) STORED,
        CONSTRAINT fk_category_xp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_category_xp_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
        CONSTRAINT uq_category_xp UNIQUE (user_id, category_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_category_xp_user_id ON category_xp(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_category_xp_category_id ON category_xp(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_category_xp_xp ON category_xp(xp DESC)`;

    // CHALLENGES
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        xp_reward INTEGER NOT NULL,
        category_id INTEGER,
        difficulty VARCHAR(50) NOT NULL DEFAULT 'moyen',
        duration_days INTEGER DEFAULT 7,
        requirement_type VARCHAR(100),
        requirement_value INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_challenges_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        CONSTRAINT chk_challenges_xp_reward CHECK (xp_reward > 0),
        CONSTRAINT chk_challenges_difficulty CHECK (difficulty IN ('facile', 'moyen', 'difficile'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_category_id ON challenges(category_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON challenges(difficulty)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges(created_at DESC)`;

    // USER_CHALLENGES
    await sql`
      CREATE TABLE IF NOT EXISTS user_challenges (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        challenge_id INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        progress INTEGER DEFAULT 0,
        CONSTRAINT fk_user_challenges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_user_challenges_challenge FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
        CONSTRAINT uq_user_challenges UNIQUE (user_id, challenge_id),
        CONSTRAINT chk_user_challenges_status CHECK (status IN ('pending', 'in_progress', 'completed'))
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_challenges_user_id ON user_challenges(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge_id ON user_challenges(challenge_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_challenges_status ON user_challenges(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_challenges_completed_at ON user_challenges(completed_at DESC)`;

    console.log("Database initialized successfully");
  } catch (error) {
    console.log("Error initializing DB", error);
    process.exit(1);
  }
}

