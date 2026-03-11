-- Add hero_image_url to service_pages and location_pages
-- blog_posts already has featured_image_url

ALTER TABLE service_pages ADD COLUMN hero_image_url TEXT;
ALTER TABLE location_pages ADD COLUMN hero_image_url TEXT;

COMMENT ON COLUMN service_pages.hero_image_url IS 'Public URL for the hero image displayed at the top of the service page';
COMMENT ON COLUMN location_pages.hero_image_url IS 'Public URL for the hero image displayed at the top of the location page';
