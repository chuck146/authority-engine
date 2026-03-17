-- Allow public (anonymous) read access to organizations table.
-- Marketing pages need org branding, settings, and contact info to render
-- headers, footers, JsonLd structured data, and CTAs for Googlebot.
-- Without this, unauthenticated visitors (including crawlers) see a
-- stripped-down page with no navigation or structured data.
create policy "Organizations are publicly readable"
  on public.organizations for select
  using (true);
