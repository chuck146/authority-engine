-- Join table linking auth.users to organizations with role-based access.
-- Roles: owner > admin > editor > viewer

create table public.user_organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'viewer' check (role in ('owner', 'admin', 'editor', 'viewer')),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

create index idx_user_orgs_user on public.user_organizations(user_id);
create index idx_user_orgs_org on public.user_organizations(organization_id);

create trigger on_user_organizations_updated
  before update on public.user_organizations
  for each row execute function public.handle_updated_at();

alter table public.user_organizations enable row level security;
