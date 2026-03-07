-- ===================================
-- SERVICE COMMENTS MIGRATION
-- Add support for nested comments and comment ratings
-- ===================================

-- ✅ Create service_comments table
CREATE TABLE IF NOT EXISTS service_comments (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id INTEGER REFERENCES service_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ✅ Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_comments_service_id ON service_comments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_author_id ON service_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_parent_id ON service_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_service_comments_created_at ON service_comments(created_at DESC);

-- ✅ Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES service_comments(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- ✅ Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_created_at ON comment_likes(created_at DESC);

-- ===================================
-- Migration completed successfully!
-- ===================================
