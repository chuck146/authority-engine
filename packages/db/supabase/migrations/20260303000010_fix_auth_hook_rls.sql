-- Fix: allow auth hook to read user_organizations through RLS.
--
-- The custom_access_token_hook runs as supabase_auth_admin and needs to
-- SELECT from user_organizations to inject organization_id into the JWT.
-- But the existing RLS policy requires organization_id to already be in
-- the JWT (circular dependency). This policy breaks the cycle.

create policy "Auth hook can read user_organizations"
  on public.user_organizations for select
  to supabase_auth_admin
  using (true);

-- Also let authenticated users read their own memberships (by user_id).
-- The existing policy only matches by organization_id, which fails when
-- the user hasn't loaded org context yet.
create policy "Users can view own memberships"
  on public.user_organizations for select
  to authenticated
  using (user_id = public.get_user_id());
