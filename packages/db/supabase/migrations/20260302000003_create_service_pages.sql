-- SEO-optimized service pages (e.g., "Interior Painting", "Cabinet Refinishing")

create type public.content_status as enum ('draft', 'review', 'approved', 'published', 'archived');

create table public.service_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  slug text not null,
  meta_title text,
  meta_description text,
  content jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  seo_score integer,
  keywords text[] default '{}',
  created_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_service_pages_org on public.service_pages(organization_id);
create index idx_service_pages_status on public.service_pages(organization_id, status);
create index idx_service_pages_slug on public.service_pages(organization_id, slug);

create trigger on_service_pages_updated
  before update on public.service_pages
  for each row execute function public.handle_updated_at();

alter table public.service_pages enable row level security;
