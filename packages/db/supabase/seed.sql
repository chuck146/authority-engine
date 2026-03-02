-- Seed: Cleanest Painting LLC (default dev organization)

insert into public.organizations (id, name, slug, domain, branding, settings, plan)
values (
  '00000000-0000-0000-0000-000000000001',
  'Cleanest Painting LLC',
  'cleanest-painting',
  'cleanestpainting.com',
  '{
    "primary": "#1a472a",
    "secondary": "#fbbf24",
    "accent": "#1e3a5f",
    "tagline": "Where Artistry Meets Craftsmanship",
    "fonts": { "heading": "Montserrat", "body": "Open Sans" }
  }'::jsonb,
  '{
    "hubspot_portal_id": "21546007",
    "clickup_list_id": "901320531655",
    "service_area_states": ["NJ"],
    "service_area_counties": ["Union", "Essex", "Morris", "Somerset"]
  }'::jsonb,
  'pro'
);

-- After signing up via Supabase Auth, link your user to this org:
-- insert into public.user_organizations (user_id, organization_id, role, is_default)
-- values ('<your-auth-user-id>', '00000000-0000-0000-0000-000000000001', 'owner', true);
