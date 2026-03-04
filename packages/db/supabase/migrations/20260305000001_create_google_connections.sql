-- Google OAuth connections (multi-tenant, per-provider)
create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('search_console', 'analytics', 'business_profile')),
  site_url text not null default '',
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}',
  connected_by uuid not null references auth.users(id),
  status text not null default 'active' check (status in ('active', 'error', 'disconnected')),
  last_synced_at timestamptz,
  sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One connection per provider per org
create unique index idx_google_connections_org_provider
  on public.google_connections(organization_id, provider);

-- RLS
alter table public.google_connections enable row level security;

create policy "Users can view their org connections"
  on public.google_connections for select
  using (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid()
    )
  );

create policy "Admins can insert connections"
  on public.google_connections for insert
  with check (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can update connections"
  on public.google_connections for update
  using (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

create policy "Admins can delete connections"
  on public.google_connections for delete
  using (
    organization_id in (
      select organization_id from public.user_organizations
      where user_id = auth.uid() and role in ('admin', 'owner')
    )
  );

-- Service role bypass for background workers
create policy "Service role full access"
  on public.google_connections for all
  using (auth.role() = 'service_role');
