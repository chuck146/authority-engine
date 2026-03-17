-- Update content_calendar CHECK constraint to include social_post and video
-- The original migration (20260310000001) only allowed service_page, location_page, blog_post
-- but the TypeScript types and API code support 5 content types.

ALTER TABLE public.content_calendar
  DROP CONSTRAINT IF EXISTS content_calendar_content_type_check;

ALTER TABLE public.content_calendar
  ADD CONSTRAINT content_calendar_content_type_check
  CHECK (content_type IN ('service_page', 'location_page', 'blog_post', 'social_post', 'video'));
