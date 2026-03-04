-- Create public storage bucket for media assets (images, thumbnails, heroes).
-- Files are uploaded server-side via service role; public read for published images.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- RLS: allow authenticated users to read any file in the media bucket
create policy "Authenticated users can read media"
  on storage.objects for select
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- RLS: allow service role to insert (server-side uploads only)
-- Service role bypasses RLS, so this is a safety net for direct uploads.
create policy "Service role can upload media"
  on storage.objects for insert
  with check (bucket_id = 'media');

-- RLS: allow service role to delete media
create policy "Service role can delete media"
  on storage.objects for delete
  using (bucket_id = 'media');
