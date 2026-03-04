-- Add approval workflow columns to all content tables

-- service_pages
ALTER TABLE public.service_pages
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN rejection_note text;

-- location_pages
ALTER TABLE public.location_pages
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN rejection_note text;

-- blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN approved_at timestamptz,
  ADD COLUMN rejection_note text;
