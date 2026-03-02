-- Multi-tenant root table. Every other table references organizations.id via organization_id FK.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  domain text,
  logo_url text,
  branding jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_organizations_slug on public.organizations(slug);

-- Reusable updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_organizations_updated
  before update on public.organizations
  for each row execute function public.handle_updated_at();

alter table public.organizations enable row level security;
