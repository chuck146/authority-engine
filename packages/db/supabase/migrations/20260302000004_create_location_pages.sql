-- SEO-optimized location/city pages (e.g., "Painting in Summit, NJ")

create table public.location_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  slug text not null,
  city text not null,
  state text not null,
  zip_codes text[] default '{}',
  meta_title text,
  meta_description text,
  content jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  seo_score integer,
  keywords text[] default '{}',
  latitude numeric(10,7),
  longitude numeric(10,7),
  created_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_location_pages_org on public.location_pages(organization_id);
create index idx_location_pages_status on public.location_pages(organization_id, status);
create index idx_location_pages_geo on public.location_pages(state, city);

create trigger on_location_pages_updated
  before update on public.location_pages
  for each row execute function public.handle_updated_at();

alter table public.location_pages enable row level security;
