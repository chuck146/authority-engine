-- Custom access token hook: injects organization_id into JWT app_metadata.
-- Runs every time Supabase issues a new JWT token.
-- After applying this migration, enable the hook in Supabase Dashboard:
--   Authentication > Hooks > Custom Access Token > public.custom_access_token_hook

create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb as $$
declare
  claims jsonb;
  org_id uuid;
begin
  claims := event->'claims';

  -- Find the user's default organization
  select organization_id into org_id
  from public.user_organizations
  where user_id = (event->>'user_id')::uuid
    and is_default = true
  limit 1;

  -- Fallback: use the first org if no default set
  if org_id is null then
    select organization_id into org_id
    from public.user_organizations
    where user_id = (event->>'user_id')::uuid
    order by created_at asc
    limit 1;
  end if;

  -- Inject organization_id into app_metadata claim
  if org_id is not null then
    claims := jsonb_set(
      claims,
      '{app_metadata, organization_id}',
      to_jsonb(org_id::text)
    );
  end if;

  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$ language plpgsql stable security definer;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant select on table public.user_organizations to supabase_auth_admin;
