-- RLS policies for multi-tenant isolation.
-- Every table scoped to organization_id via JWT app_metadata.

-- Helper: extract organization_id from JWT
create or replace function public.get_org_id()
returns uuid as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'organization_id')::uuid,
    null
  );
$$ language sql stable security definer;

-- Helper: extract user_id from JWT
create or replace function public.get_user_id()
returns uuid as $$
  select coalesce(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid,
    null
  );
$$ language sql stable security definer;

-- Organizations: users can read their own org(s)
create policy "Users can view their organizations"
  on public.organizations for select
  using (
    id in (
      select organization_id from public.user_organizations
      where user_id = public.get_user_id()
    )
  );

-- User Organizations: users can view memberships in their org
create policy "Users can view org memberships"
  on public.user_organizations for select
  using (organization_id = public.get_org_id());

-- Service Pages
create policy "Org members can view service pages"
  on public.service_pages for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert service pages"
  on public.service_pages for insert
  with check (organization_id = public.get_org_id());

create policy "Org editors can update service pages"
  on public.service_pages for update
  using (organization_id = public.get_org_id());

create policy "Org admins can delete service pages"
  on public.service_pages for delete
  using (organization_id = public.get_org_id());

create policy "Published service pages are public"
  on public.service_pages for select
  using (status = 'published');

-- Location Pages
create policy "Org members can view location pages"
  on public.location_pages for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert location pages"
  on public.location_pages for insert
  with check (organization_id = public.get_org_id());

create policy "Org editors can update location pages"
  on public.location_pages for update
  using (organization_id = public.get_org_id());

create policy "Org admins can delete location pages"
  on public.location_pages for delete
  using (organization_id = public.get_org_id());

create policy "Published location pages are public"
  on public.location_pages for select
  using (status = 'published');

-- Blog Posts
create policy "Org members can view blog posts"
  on public.blog_posts for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert blog posts"
  on public.blog_posts for insert
  with check (organization_id = public.get_org_id());

create policy "Org editors can update blog posts"
  on public.blog_posts for update
  using (organization_id = public.get_org_id());

create policy "Org admins can delete blog posts"
  on public.blog_posts for delete
  using (organization_id = public.get_org_id());

create policy "Published blog posts are public"
  on public.blog_posts for select
  using (status = 'published');

-- Media Assets
create policy "Org members can view media"
  on public.media_assets for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert media"
  on public.media_assets for insert
  with check (organization_id = public.get_org_id());

-- Job Executions
create policy "Org members can view jobs"
  on public.job_executions for select
  using (organization_id = public.get_org_id());

create policy "Org members can insert jobs"
  on public.job_executions for insert
  with check (organization_id = public.get_org_id());
