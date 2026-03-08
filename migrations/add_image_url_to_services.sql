-- Migration: Add image_url column to services table
-- This migration adds support for service images

-- Add image_url column if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_services_image_url ON services(image_url);

-- Add comment to document the column
COMMENT ON COLUMN services.image_url IS 'URL of the service image, typically from Cloudinary';
