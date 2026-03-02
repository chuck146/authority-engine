-- Metadata for all generated images, videos, and documents.
-- Actual files live in Supabase Storage or Cloudflare R2.

create type public.media_type as enum ('image', 'video', 'document');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type public.media_type not null,
  filename text not null,
  storage_path text not null,
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'r2')),
  mime_type text not null,
  size_bytes bigint,
  width integer,
  height integer,
  duration_seconds numeric(10,2),
  alt_text text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_media_assets_org on public.media_assets(organization_id);
create index idx_media_assets_type on public.media_assets(organization_id, type);

alter table public.media_assets enable row level security;
