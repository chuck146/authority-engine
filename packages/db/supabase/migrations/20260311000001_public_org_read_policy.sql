-- Allow anonymous (public) read access to organizations.
-- Public SEO pages need org data (name, branding, settings) for JSON-LD schema markup.
-- Org data is non-sensitive — name, branding colors, and contact info are displayed publicly.

create policy "Organizations are publicly readable"
  on public.organizations for select
  using (true);
