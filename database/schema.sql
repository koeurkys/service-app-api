-- ===================================
-- MARKETPLACE DATABASE SCHEMA
-- PostgreSQL Complete Setup
-- ===================================

-- Drop existing objects (if they exist)
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS category_xp CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ===================================
-- 1. USERS TABLE
-- ===================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  role VARCHAR(50) CHECK (role IN ('client', 'prestataire', 'admin')) NOT NULL DEFAULT 'client',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ===================================
-- 2. CATEGORIES TABLE
-- ===================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_name ON categories(name);

-- Insert default categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Informatique', 'Services informatiques et technologiques', 'laptop', '#3498db'),
  ('Design', 'Services de design et créatif', 'palette', '#e74c3c'),
  ('Santé', 'Services de santé et bien-être', 'heart', '#2ecc71'),
  ('Éducation', 'Services d''éducation et formation', 'book', '#f39c12'),
  ('Jardinage', 'Services d''entretien et jardinage', 'leaf', '#27ae60'),
  ('Babysitting', 'Services de garde d''enfants', 'people', '#9b59b6'),
  ('Ménage', 'Services de nettoyage et ménage', 'home', '#95a5a6'),
  ('Réparation', 'Services de réparation et maintenance', 'wrench', '#34495e'),
  ('Transport', 'Services de transport et livraison', 'car', '#16a085'),
  ('Photographie', 'Services de photographie et vidéo', 'camera', '#d35400');

-- ===================================
-- 3. PROFILES TABLE (Gamification)
-- ===================================
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  xp_total INTEGER DEFAULT 0,
  rating_avg DECIMAL(3, 2) DEFAULT 0.00 CHECK (rating_avg >= 0 AND rating_avg <= 5),
  reliability_score DECIMAL(3, 2) DEFAULT 100.00 CHECK (reliability_score >= 0 AND reliability_score <= 100),
  certified BOOLEAN DEFAULT FALSE,
  level INTEGER GENERATED ALWAYS AS (xp_total / 100 + 1) STORED,
  total_services_completed INTEGER DEFAULT 0,
  total_services_published INTEGER DEFAULT 0,
  bio TEXT,
  certifications TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_xp_total ON profiles(xp_total);
CREATE INDEX idx_profiles_rating_avg ON profiles(rating_avg);
CREATE INDEX idx_profiles_certified ON profiles(certified);

-- ===================================
-- 4. SERVICES TABLE
-- ===================================
CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address VARCHAR(255),
  city VARCHAR(100),
  postal_code VARCHAR(20),
  status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_bookings INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_location ON services(latitude, longitude);
CREATE INDEX idx_services_city ON services(city);
CREATE INDEX idx_services_created_at ON services(created_at DESC);
CREATE INDEX idx_services_price ON services(price);

-- ===================================
-- 5. BOOKINGS TABLE
-- ===================================
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  booking_time TIME,
  duration_hours DECIMAL(5, 2),
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed')) DEFAULT 'pending',
  notes TEXT,
  cancelled_reason TEXT,
  cancelled_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);

-- ===================================
-- 6. REVIEWS TABLE
-- ===================================
CREATE TABLE reviews (
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
);

CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_provider_id ON reviews(provider_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ===================================
-- 7. BADGES TABLE
-- ===================================
CREATE TABLE badges (
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
);

CREATE INDEX idx_badges_xp_required ON badges(xp_required);
CREATE INDEX idx_badges_category ON badges(category);

-- Insert default badges
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
  ('Première Réservation', 'Effectuer votre première réservation', '🎯', 'milestone', 0, 'first_booking', 1),
  ('Amateur', 'Atteindre 100 XP', '⭐', 'level', 100, 'xp', 100),
  ('Professionnel', 'Atteindre 500 XP', '💼', 'level', 500, 'xp', 500),
  ('Expert', 'Atteindre 1000 XP', '🏆', 'level', 1000, 'xp', 1000),
  ('Fiable', 'Obtenir une note moyenne de 4.5+', '✓', 'rating', 450, 'avg_rating', 450),
  ('Service Rapide', 'Compléter 10 services', '⚡', 'services', 10, 'completed_services', 10),
  ('Superviseur', 'Accumuler 50 avis positifs', '👑', 'reviews', 50, 'positive_reviews', 50);

-- ===================================
-- 8. USER_BADGES TABLE
-- ===================================
CREATE TABLE user_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- ===================================
-- 9. CATEGORY_XP TABLE
-- ===================================
CREATE TABLE category_xp (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  xp INTEGER DEFAULT 0,
  level INTEGER GENERATED ALWAYS AS (xp / 50 + 1) STORED,
  UNIQUE(user_id, category_id)
);

CREATE INDEX idx_category_xp_user_id ON category_xp(user_id);
CREATE INDEX idx_category_xp_category_id ON category_xp(category_id);
CREATE INDEX idx_category_xp_xp ON category_xp(xp DESC);

-- ===================================
-- 10. CHALLENGES TABLE
-- ===================================
CREATE TABLE challenges (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  xp_reward INTEGER NOT NULL CHECK (xp_reward > 0),
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  difficulty VARCHAR(50) CHECK (difficulty IN ('facile', 'moyen', 'difficile')) DEFAULT 'moyen',
  duration_days INTEGER DEFAULT 7,
  requirement_type VARCHAR(100),
  requirement_value INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_challenges_category_id ON challenges(category_id);
CREATE INDEX idx_challenges_difficulty ON challenges(difficulty);
CREATE INDEX idx_challenges_is_active ON challenges(is_active);
CREATE INDEX idx_challenges_created_at ON challenges(created_at DESC);

-- Insert default challenges
INSERT INTO challenges (title, description, xp_reward, category_id, difficulty, duration_days, requirement_type) VALUES
  ('Épargne Hebdomadaire', 'Complétez 5 services cette semaine', 50, NULL, 'facile', 7, 'services_completed'),
  ('Zéro Dépense', 'Complétez une journée sans dépense', 30, NULL, 'facile', 1, 'no_spending_day'),
  ('Investisseur', 'Investissez dans un service premium', 100, NULL, 'difficile', 30, 'premium_booking'),
  ('Budget Maîtrisé', 'Restez dans le budget 4 fois de suite', 75, NULL, 'moyen', 30, 'budget_maintained');

-- ===================================
-- 11. USER_CHALLENGES TABLE
-- ===================================
CREATE TABLE user_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  status VARCHAR(50) CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge_id ON user_challenges(challenge_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
CREATE INDEX idx_user_challenges_completed_at ON user_challenges(completed_at DESC);

-- ===================================
-- STORED PROCEDURES / FUNCTIONS
-- ===================================

-- Function to update user XP and level
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id INTEGER, p_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_xp INTEGER;
BEGIN
  UPDATE profiles
  SET xp_total = xp_total + p_xp, updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id
  RETURNING xp_total INTO v_new_xp;
  
  RETURN v_new_xp;
END;
$$ LANGUAGE plpgsql;

-- Function to update service average rating
CREATE OR REPLACE FUNCTION update_service_rating(p_service_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  v_avg_rating DECIMAL(3, 2);
BEGIN
  SELECT ROUND(AVG(rating)::NUMERIC, 2)
  INTO v_avg_rating
  FROM reviews
  WHERE service_id = p_service_id AND is_verified = TRUE;
  
  UPDATE services
  SET average_rating = COALESCE(v_avg_rating, 0), updated_at = CURRENT_TIMESTAMP
  WHERE id = p_service_id;
  
  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update provider rating
CREATE OR REPLACE FUNCTION update_provider_rating(p_provider_id INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  v_avg_rating DECIMAL(3, 2);
BEGIN
  SELECT ROUND(AVG(reviews.rating)::NUMERIC, 2)
  INTO v_avg_rating
  FROM reviews
  INNER JOIN services ON reviews.service_id = services.id
  WHERE services.user_id = p_provider_id AND reviews.is_verified = TRUE;
  
  UPDATE profiles
  SET rating_avg = COALESCE(v_avg_rating, 0), updated_at = CURRENT_TIMESTAMP
  WHERE user_id = p_provider_id;
  
  RETURN COALESCE(v_avg_rating, 0);
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile when user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_create_user_profile
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- Trigger to update service rating when review is created/updated
CREATE OR REPLACE FUNCTION tr_update_service_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_service_rating(NEW.service_id);
  PERFORM update_provider_rating(NEW.provider_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_rating_on_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION tr_update_service_rating();

-- ===================================
-- VIEWS
-- ===================================

-- View: Top Rated Services
CREATE OR REPLACE VIEW v_top_rated_services AS
SELECT 
  s.id,
  s.title,
  s.price,
  s.average_rating,
  s.total_bookings,
  u.name AS provider_name,
  c.name AS category_name,
  s.city,
  p.level
FROM services s
INNER JOIN users u ON s.user_id = u.id
INNER JOIN profiles p ON u.id = p.user_id
INNER JOIN categories c ON s.category_id = c.id
WHERE s.status = 'active'
ORDER BY s.average_rating DESC, s.total_bookings DESC;

-- View: Top Providers
CREATE OR REPLACE VIEW v_top_providers AS
SELECT 
  u.id,
  u.name,
  u.email,
  p.level,
  p.rating_avg,
  p.reliability_score,
  p.certified,
  COUNT(DISTINCT s.id) AS total_services,
  COUNT(DISTINCT b.id) AS total_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_bookings
FROM users u
INNER JOIN profiles p ON u.id = p.user_id
LEFT JOIN services s ON u.id = s.user_id
LEFT JOIN bookings b ON s.id = b.service_id
WHERE u.role = 'prestataire'
GROUP BY u.id, u.name, u.email, p.level, p.rating_avg, p.reliability_score, p.certified
ORDER BY p.rating_avg DESC, p.level DESC;

-- View: User Statistics
CREATE OR REPLACE VIEW v_user_stats AS
SELECT 
  u.id,
  u.name,
  u.email,
  p.level,
  p.xp_total,
  p.rating_avg,
  p.reliability_score,
  p.certified,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'completed') AS completed_bookings,
  COUNT(DISTINCT ub.badge_id) AS total_badges,
  COUNT(DISTINCT uc.challenge_id) FILTER (WHERE uc.status = 'completed') AS completed_challenges
FROM users u
INNER JOIN profiles p ON u.id = p.user_id
LEFT JOIN bookings b ON u.id = b.client_id OR u.id = b.provider_id
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN user_challenges uc ON u.id = uc.user_id
GROUP BY u.id, u.name, u.email, p.level, p.xp_total, p.rating_avg, p.reliability_score, p.certified;

-- ===================================
-- SUMMARY
-- ===================================
-- Total Tables: 11
-- Total Functions: 4
-- Total Triggers: 2
-- Total Views: 3
-- Total Indexes: 50+
-- ===================================
