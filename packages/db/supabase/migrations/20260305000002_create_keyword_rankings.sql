-- Daily keyword ranking snapshots from Google Search Console
create table public.keyword_rankings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  query text not null,
  page text not null,
  country text not null default 'ALL',
  device text not null default 'ALL',
  date date not null,
  clicks integer not null default 0,
  impressions integer not null default 0,
  ctr double precision not null default 0,
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

-- Upsert key: one row per org + query + page + date + device
create unique index idx_keyword_rankings_upsert
  on public.keyword_rankings(organization_id, query, page, date, device);

-- Fast lookups for dashboard queries
create index idx_keyword_rankings_org_date
  on public.keyword_rankings(organization_id, date desc);

create index idx_keyword_rankings_org_query
  on public.keyword_rankings(organization_id, query);

-- GSC snapshot storage (sitemaps, indexing, crawl data)
create table public.gsc_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_type text not null check (snapshot_type in ('sitemaps', 'indexing', 'crawl_errors')),
  snapshot_date date not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create unique index idx_gsc_snapshots_upsert
  on public.gsc_snapshots(organization_id, snapshot_type, snapshot_date);

-- RLS for keyword_rankings
alter table public.keyword_rankings enable row level security;

create policy "Users can view their org keyword rankings"
  on public.keyword_rankings for select
  using (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid()
    )
  );

create policy "Service role full access on keyword_rankings"
  on public.keyword_rankings for all
  using (auth.role() = 'service_role');

-- RLS for gsc_snapshots
alter table public.gsc_snapshots enable row level security;

create policy "Users can view their org gsc snapshots"
  on public.gsc_snapshots for select
  using (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid()
    )
  );

create policy "Service role full access on gsc_snapshots"
  on public.gsc_snapshots for all
  using (auth.role() = 'service_role');
