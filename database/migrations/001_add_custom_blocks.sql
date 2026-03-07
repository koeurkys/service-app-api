-- Migration: Add custom_blocks JSONB column to profiles table
-- Description: Adds support for custom profile blocks (personalized profile content)

-- Add the custom_blocks column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS custom_blocks JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_custom_blocks ON profiles USING GIN (custom_blocks);

-- Log migration completion
SELECT 'Migration 001_add_custom_blocks completed successfully' AS status;
