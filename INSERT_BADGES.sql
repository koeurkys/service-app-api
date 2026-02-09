-- ============================================
-- BADGES SYSTEM - INSERT SCRIPT FOR NEON DB
-- ============================================
-- Execute this script on your Neon database to insert all badges
-- Run in Tools > Query Editor on console.neon.tech

-- Clear existing badges (optional - use with caution)
-- DELETE FROM user_badges;
-- DELETE FROM badges;

-- Achievement Badges
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('Premiers Pas', 'Complétez votre profil avec photo et bio', '👣', 'achievement', 0, 'profile_complete', '#3498db'),
('Première Demande', 'Postez votre première demande de service', '🎯', 'achievement', 0, 'first_service_request', '#3498db'),
('Première Prestation', 'Complétez votre première prestation', '✅', 'achievement', 0, 'first_service_completed', '#2ecc71'),
('Communicateur', 'Envoyez votre premier message privé', '💬', 'achievement', 0, 'first_message', '#9b59b6');

-- Milestone Badges (XP-based)
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('Amateur', 'Gagnez 100 XP au total', '⭐', 'milestone', 100, 'xp_100', '#f39c12'),
('Confirmé', 'Gagnez 500 XP au total', '✨', 'milestone', 500, 'xp_500', '#f39c12'),
('Professionnel', 'Gagnez 1000 XP au total', '💼', 'milestone', 1000, 'xp_1000', '#e74c3c'),
('Légendaire', 'Gagnez 2000 XP au total', '👑', 'milestone', 2000, 'xp_2000', '#e74c3c');

-- Expertise Badges (Category specialization)
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('Expert Informatique', 'Gagnez 300 XP en Informatique', '💻', 'expertise', 300, 'category_xp_informatique', '#3498db'),
('Expert Design', 'Gagnez 300 XP en Design', '🎨', 'expertise', 300, 'category_xp_design', '#e74c3c'),
('Expert Santé', 'Gagnez 300 XP en Santé', '💚', 'expertise', 300, 'category_xp_sante', '#2ecc71'),
('Expert Éducation', 'Gagnez 300 XP en Éducation', '📚', 'expertise', 300, 'category_xp_education', '#f39c12'),
('Expert Jardinage', 'Gagnez 300 XP en Jardinage', '🌿', 'expertise', 300, 'category_xp_jardinage', '#27ae60');

-- Engagement Badges (Activity)
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('Lanceur', 'Postez 5 services/demandes', '🚀', 'engagement', 0, 'services_5', '#e74c3c'),
('Productif', 'Complétez 10 prestations', '⚡', 'engagement', 0, 'completed_10', '#f39c12'),
('Hyperactif', 'Complétez 25 prestations', '🔥', 'engagement', 0, 'completed_25', '#e74c3c'),
('Obsédé', 'Complétez 50 prestations', '💪', 'engagement', 0, 'completed_50', '#c0392b');

-- Reliability Badges (Quality & ratings)
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('De Confiance', 'Obtenez une note moyenne de 4.0+', '✓', 'reliability', 0, 'rating_40', '#2ecc71'),
('Excellent', 'Obtenez une note moyenne de 4.5+', '⭐⭐⭐⭐⭐', 'reliability', 0, 'rating_45', '#f39c12'),
('Parfait', 'Obtenez une note moyenne de 4.8+', '🏆', 'reliability', 0, 'rating_48', '#e74c3c'),
('Apprécié', 'Recevez 10 avis positifs', '❤️', 'reliability', 0, 'positive_reviews_10', '#e74c3c'),
('Adoré', 'Recevez 25 avis positifs', '💕', 'reliability', 0, 'positive_reviews_25', '#e74c3c');

-- Social & Special Badges
INSERT INTO badges (name, description, icon, category, xp_required, condition_type, color) VALUES
('Influenceur', 'Recevez 5 demandes de contact', '📱', 'engagement', 0, 'contact_requests_5', '#9b59b6'),
('Connecté', 'Envoyez 20 messages privés', '🔗', 'engagement', 0, 'messages_20', '#3498db'),
('Réseau Star', 'Obtenir 10 followers', '⭐🌐', 'engagement', 0, 'followers_10', '#f39c12'),
('Généreux', 'Envoyez votre premier pourboire', '🎁', 'achievement', 0, 'first_tip', '#e74c3c'),
('Rapide', 'Complétez une prestation en moins de 2 jours', '⚡✓', 'reliability', 0, 'quick_completion', '#f39c12'),
('Fiable 24/7', 'Complétez une prestation entre minuit et 6h', '🌙', 'reliability', 0, 'night_completion', '#34495e');

-- Verification query - see all badges
SELECT id, name, icon, category, xp_required, condition_type, color FROM badges ORDER BY category, xp_required ASC;
