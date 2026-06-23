-- Add image_urls column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_urls TEXT;

-- Update existing campaigns to copy cover_image_url into image_urls for backward compatibility
UPDATE campaigns
SET image_urls = cover_image_url
WHERE cover_image_url IS NOT NULL AND (image_urls IS NULL OR image_urls = '');
