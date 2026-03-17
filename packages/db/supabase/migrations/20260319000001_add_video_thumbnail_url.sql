-- Add thumbnail_url column to media_assets for video thumbnails
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN public.media_assets.thumbnail_url IS 'Public URL of the video thumbnail image. Only populated for type=video rows.';
