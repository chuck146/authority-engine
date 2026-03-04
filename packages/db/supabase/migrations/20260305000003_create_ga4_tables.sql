-- GA4 Page Metrics: one row per org + page_path + date
create table ga4_page_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  page_path text not null,
  page_title text not null default '',
  date date not null,
  sessions int not null default 0,
  users int not null default 0,
  pageviews int not null default 0,
  bounce_rate double precision not null default 0,
  avg_session_duration double precision not null default 0,
  engagement_rate double precision not null default 0,
  created_at timestamptz not null default now()
);

-- Unique constraint for upserts
create unique index ga4_page_metrics_unique
  on ga4_page_metrics (organization_id, page_path, date);

-- Index for org + date range queries
create index ga4_page_metrics_org_date
  on ga4_page_metrics (organization_id, date);

-- RLS
alter table ga4_page_metrics enable row level security;

create policy "Users can view own org GA4 metrics"
  on ga4_page_metrics for select
  using (
    organization_id in (
      select uo.organization_id from user_organizations uo
      where uo.user_id = auth.uid()
    )
  );

create policy "Service role can manage GA4 metrics"
  on ga4_page_metrics for all
  using (true)
  with check (true);

-- GA4 Snapshots: traffic sources, device breakdown, daily totals (JSONB)
create table ga4_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  snapshot_type text not null check (snapshot_type in ('traffic_sources', 'device_breakdown', 'daily_totals')),
  snapshot_date date not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- Unique constraint for upserts
create unique index ga4_snapshots_unique
  on ga4_snapshots (organization_id, snapshot_type, snapshot_date);

-- RLS
alter table ga4_snapshots enable row level security;

create policy "Users can view own org GA4 snapshots"
  on ga4_snapshots for select
  using (
    organization_id in (
      select uo.organization_id from user_organizations uo
      where uo.user_id = auth.uid()
    )
  );

create policy "Service role can manage GA4 snapshots"
  on ga4_snapshots for all
  using (true)
  with check (true);
