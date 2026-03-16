-- Commercial service pages (e.g., "Office Painting", "Warehouse Coatings")
-- Mirrors service_pages schema for commercial-specific content

create table public.commercial_service_pages (
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
  hero_image_url text,
  created_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_commercial_service_pages_org on public.commercial_service_pages(organization_id);
create index idx_commercial_service_pages_status on public.commercial_service_pages(organization_id, status);
create index idx_commercial_service_pages_slug on public.commercial_service_pages(organization_id, slug);

create trigger on_commercial_service_pages_updated
  before update on public.commercial_service_pages
  for each row execute function public.handle_updated_at();

alter table public.commercial_service_pages enable row level security;

-- RLS policies (mirrors service_pages pattern)
create policy "Org members can view commercial service pages"
  on public.commercial_service_pages for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert commercial service pages"
  on public.commercial_service_pages for insert
  with check (organization_id = public.get_org_id());

create policy "Org editors can update commercial service pages"
  on public.commercial_service_pages for update
  using (organization_id = public.get_org_id());

create policy "Org admins can delete commercial service pages"
  on public.commercial_service_pages for delete
  using (organization_id = public.get_org_id());

create policy "Published commercial service pages are public"
  on public.commercial_service_pages for select
  using (status = 'published');
