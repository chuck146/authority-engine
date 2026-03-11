-- =============================================================================
-- Seed: Cleanest Painting LLC — Full MVP Dev Data
-- =============================================================================
-- Run via: npm run db:reset (supabase db reset applies migrations + this file)
-- Org ID constant used throughout:
--   00000000-0000-0000-0000-000000000001

-- ---------------------------------------------------------------------------
-- 1. Organization
-- ---------------------------------------------------------------------------

insert into public.organizations (id, name, slug, domain, logo_url, branding, settings, plan)
values (
  '00000000-0000-0000-0000-000000000001',
  'Cleanest Painting LLC',
  'cleanest-painting',
  'cleanestpainting.com',
  'https://placehold.co/400x400/1a472a/fbbf24?text=CP',
  '{
    "primary": "#1B2B5B",
    "secondary": "#fbbf24",
    "accent": "#1e3a5f",
    "tagline": "Where Artistry Meets Craftsmanship",
    "fonts": { "heading": "DM Sans", "body": "DM Sans" }
  }'::jsonb,
  '{
    "hubspot_portal_id": "21546007",
    "clickup_list_id": "901320531655",
    "service_area_states": ["NJ"],
    "service_area_counties": ["Union", "Essex", "Morris", "Somerset"],
    "contact_info": {
      "phone": "(908) 361-4693",
      "email": "info@cleanestpainting.com",
      "address": {
        "streetAddress": "123 Main St",
        "city": "Summit",
        "state": "NJ",
        "postalCode": "07901"
      }
    },
    "estimate_url": "https://cleanestpaintingnj.com/estimate"
  }'::jsonb,
  'pro'
);

-- After signing up via Supabase Auth, link your user to this org:
-- insert into public.user_organizations (user_id, organization_id, role, is_default)
-- values ('<your-auth-user-id>', '00000000-0000-0000-0000-000000000001', 'owner', true);


-- ---------------------------------------------------------------------------
-- 2. Service Pages (8 total: 6 published, 2 in review)
-- ---------------------------------------------------------------------------

-- 2a. Interior Painting (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Interior Painting Services',
  'interior-painting',
  'published', 92,
  '{"interior painting", "house painting", "room painting", "NJ painters"}',
  'Interior Painting Services | Cleanest Painting NJ',
  'Professional interior painting in NJ. Expert color matching, clean lines, and flawless finishes. Free estimates from Cleanest Painting LLC.',
  now() - interval '14 days',
  '{
    "headline": "Transform Your Home with Expert Interior Painting",
    "intro": "<p>Your home deserves a fresh, flawless finish. At Cleanest Painting LLC, we bring over a decade of experience to every interior painting project across Union, Essex, Morris, and Somerset counties. From single accent walls to complete home repaints, our team delivers clean lines, smooth finishes, and lasting results.</p>",
    "sections": [
      {
        "title": "Our Interior Painting Process",
        "body": "<p>Every project begins with a detailed walkthrough and color consultation. We protect your furniture, floors, and fixtures with premium drop cloths and painter''s tape. Our process includes thorough surface preparation — filling holes, sanding rough spots, and priming where needed — before applying two coats of premium paint for a uniform, durable finish.</p>"
      },
      {
        "title": "Rooms We Paint",
        "body": "<ul><li><strong>Living rooms & family rooms</strong> — High-traffic areas that need durable, washable finishes</li><li><strong>Bedrooms</strong> — Restful color palettes with low-VOC paints</li><li><strong>Kitchens & bathrooms</strong> — Moisture-resistant paints that stand up to humidity</li><li><strong>Hallways & stairwells</strong> — Tricky spaces that require precision and scaffolding expertise</li><li><strong>Home offices</strong> — Professional environments with focused, productive color schemes</li></ul>"
      },
      {
        "title": "Premium Paint Brands We Use",
        "body": "<p>We partner with top-tier paint manufacturers to ensure lasting beauty. Our go-to brands include <strong>Benjamin Moore</strong>, <strong>Sherwin-Williams</strong>, and <strong>Farrow & Ball</strong>. Each brand offers unique advantages — from Benjamin Moore''s Aura line for exceptional coverage to Sherwin-Williams Duration for high-traffic durability.</p>"
      },
      {
        "title": "Why Choose Cleanest Painting",
        "body": "<p>We''re not just painters — we''re craftsmen. Our attention to detail means you''ll never find drips, missed spots, or sloppy edges. We show up on time, communicate throughout the project, and leave your home cleaner than we found it. That''s the Cleanest Painting promise.</p>"
      }
    ],
    "cta": "Ready to refresh your interior? Get your free estimate today.",
    "meta_title": "Interior Painting Services | Cleanest Painting NJ",
    "meta_description": "Professional interior painting in NJ. Expert color matching, clean lines, and flawless finishes. Free estimates from Cleanest Painting LLC."
  }'::jsonb
);

-- 2b. Exterior Painting (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Exterior Painting Services',
  'exterior-painting',
  'published', 89,
  '{"exterior painting", "house painting", "outdoor painting", "NJ exterior painters"}',
  'Exterior Painting Services | Cleanest Painting NJ',
  'Protect and beautify your home with professional exterior painting. Weather-resistant finishes for NJ homes. Free estimates.',
  now() - interval '12 days',
  '{
    "headline": "Protect Your Home with Professional Exterior Painting",
    "intro": "<p>New Jersey weather is tough on homes. From humid summers to freezing winters, your home''s exterior takes a beating year-round. Cleanest Painting LLC delivers exterior painting that not only looks stunning but provides lasting protection against the elements.</p>",
    "sections": [
      {
        "title": "Complete Exterior Painting Process",
        "body": "<p>We start with a thorough inspection of your home''s exterior — checking for peeling paint, wood rot, caulk failures, and moisture damage. Our prep work includes power washing, scraping, sanding, priming bare wood, and caulking gaps before we apply two coats of premium exterior paint rated for New Jersey''s climate.</p>"
      },
      {
        "title": "Surfaces We Paint",
        "body": "<ul><li><strong>Wood siding & clapboard</strong> — Proper prep prevents peeling and extends paint life</li><li><strong>Vinyl & aluminum siding</strong> — Specialized paints that flex with temperature changes</li><li><strong>Stucco & masonry</strong> — Breathable coatings that prevent moisture trapping</li><li><strong>Trim, soffits & fascia</strong> — Detailed brush work for a polished look</li><li><strong>Doors & shutters</strong> — High-gloss finishes that pop with curb appeal</li></ul>"
      },
      {
        "title": "Weather-Ready Finishes",
        "body": "<p>We use <strong>Sherwin-Williams Duration Exterior</strong> and <strong>Benjamin Moore Aura Exterior</strong> — both engineered for Northeast weather. These paints resist fading, cracking, and peeling for 10+ years. We schedule exterior work during optimal weather windows (spring through fall) to ensure proper adhesion and curing.</p>"
      }
    ],
    "cta": "Boost your curb appeal — schedule a free exterior painting estimate.",
    "meta_title": "Exterior Painting Services | Cleanest Painting NJ",
    "meta_description": "Protect and beautify your home with professional exterior painting. Weather-resistant finishes for NJ homes. Free estimates."
  }'::jsonb
);

-- 2c. Cabinet Refinishing (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Cabinet Refinishing & Painting',
  'cabinet-refinishing',
  'published', 87,
  '{"cabinet refinishing", "cabinet painting", "kitchen cabinets", "NJ cabinet painters"}',
  'Cabinet Refinishing & Painting | Cleanest Painting NJ',
  'Transform your kitchen with professional cabinet refinishing. Fraction of replacement cost. Serving Union, Essex, Morris & Somerset counties.',
  now() - interval '10 days',
  '{
    "headline": "Give Your Kitchen a Fresh Look with Cabinet Refinishing",
    "intro": "<p>A full kitchen renovation can cost $30,000 or more. Cabinet refinishing delivers a stunning transformation at a fraction of the price. Cleanest Painting LLC specializes in turning dated, worn cabinets into showpieces — using professional-grade finishes that look and feel like new.</p>",
    "sections": [
      {
        "title": "Our Cabinet Refinishing Process",
        "body": "<p>We remove all doors, drawers, and hardware for off-site finishing in our controlled spray environment. Each piece is cleaned, deglossed, sanded, primed, and finished with two coats of premium cabinet-grade paint or stain. Soft-close hinges and new hardware are available as upgrades. Typical turnaround is 5–7 business days.</p>"
      },
      {
        "title": "Cabinet Finish Options",
        "body": "<ul><li><strong>Painted finish</strong> — Classic whites, modern grays, bold navy or forest green</li><li><strong>Stained finish</strong> — Natural wood tones from light oak to dark walnut</li><li><strong>Two-tone</strong> — Different colors for uppers and lowers, a popular modern look</li><li><strong>Glazed finish</strong> — Antique or distressed look with hand-applied glaze</li></ul>"
      },
      {
        "title": "Why Refinish Instead of Replace",
        "body": "<p>Cabinet refinishing costs 60–75% less than full replacement. Your existing cabinet boxes are solid — they just need a facelift. Refinishing takes days, not weeks. There''s no demolition, no plumbing disruption, and no weeks without a functional kitchen. It''s the smartest upgrade for your money.</p>"
      }
    ],
    "cta": "Ready to transform your kitchen? Get a free cabinet refinishing quote.",
    "meta_title": "Cabinet Refinishing & Painting | Cleanest Painting NJ",
    "meta_description": "Transform your kitchen with professional cabinet refinishing. Fraction of replacement cost. Serving Union, Essex, Morris & Somerset counties."
  }'::jsonb
);

-- 2d. Deck Staining (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Deck Staining & Sealing',
  'deck-staining',
  'published', 85,
  '{"deck staining", "deck sealing", "deck restoration", "NJ deck services"}',
  'Deck Staining & Sealing | Cleanest Painting NJ',
  'Professional deck staining and sealing in NJ. Protect your investment with UV-resistant, waterproof finishes. Free estimates.',
  now() - interval '8 days',
  '{
    "headline": "Protect and Restore Your Deck with Professional Staining",
    "intro": "<p>Your deck is an extension of your living space — and it takes the worst of New Jersey''s weather. Sun, rain, snow, and humidity break down unprotected wood fast. Cleanest Painting LLC offers professional deck staining and sealing that keeps your deck looking great and structurally sound for years.</p>",
    "sections": [
      {
        "title": "Deck Preparation & Staining Process",
        "body": "<p>We start with a thorough power wash to remove dirt, mildew, and old finish. Damaged boards are repaired or replaced. We sand rough spots and apply a brightening solution to restore the wood''s natural color. Then we apply premium penetrating stain — either transparent, semi-transparent, or solid — depending on your preference and the wood condition.</p>"
      },
      {
        "title": "Stain Options",
        "body": "<ul><li><strong>Transparent stain</strong> — Shows full wood grain, ideal for new or premium wood</li><li><strong>Semi-transparent stain</strong> — Light color with visible grain, best balance of beauty and protection</li><li><strong>Solid stain</strong> — Full color coverage, best for older decks with imperfections</li><li><strong>Clear sealer</strong> — UV and water protection without color change</li></ul>"
      },
      {
        "title": "When to Stain Your Deck",
        "body": "<p>The best time for deck staining in New Jersey is late spring through early fall, when temperatures are consistently above 50°F and rain-free stretches allow proper drying. We recommend restaining every 2–3 years for optimal protection. We''ll assess your deck''s condition and recommend the right schedule.</p>"
      }
    ],
    "cta": "Keep your deck beautiful — schedule a free staining estimate today.",
    "meta_title": "Deck Staining & Sealing | Cleanest Painting NJ",
    "meta_description": "Professional deck staining and sealing in NJ. Protect your investment with UV-resistant, waterproof finishes. Free estimates."
  }'::jsonb
);

-- 2e. Pressure Washing (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Pressure Washing Services',
  'pressure-washing',
  'published', 84,
  '{"pressure washing", "power washing", "house washing", "NJ pressure washing"}',
  'Pressure Washing Services | Cleanest Painting NJ',
  'Professional pressure washing for homes and driveways in NJ. Remove dirt, mildew, and grime. Instant curb appeal boost.',
  now() - interval '6 days',
  '{
    "headline": "Restore Your Home''s Shine with Professional Pressure Washing",
    "intro": "<p>Over time, dirt, mold, mildew, and algae build up on your home''s exterior surfaces. Professional pressure washing instantly removes years of buildup, revealing the clean, bright surfaces underneath. Cleanest Painting LLC uses commercial-grade equipment with adjustable pressure to safely clean any surface.</p>",
    "sections": [
      {
        "title": "What We Pressure Wash",
        "body": "<ul><li><strong>House siding</strong> — Vinyl, wood, stucco, and brick</li><li><strong>Driveways & walkways</strong> — Concrete, pavers, and asphalt</li><li><strong>Decks & patios</strong> — Wood, composite, and stone</li><li><strong>Fences & retaining walls</strong> — All materials</li><li><strong>Roofs</strong> — Soft wash method for safe, thorough cleaning</li></ul>"
      },
      {
        "title": "Our Approach",
        "body": "<p>Not all surfaces can handle the same pressure. We use a combination of high-pressure washing for hard surfaces (concrete, stone) and soft washing (low-pressure + cleaning solution) for delicate surfaces (siding, roofs, painted wood). This ensures thorough cleaning without surface damage.</p>"
      },
      {
        "title": "Pressure Washing Before Painting",
        "body": "<p>Pressure washing is an essential first step before any exterior painting project. It removes loose paint, dirt, and contaminants that prevent new paint from adhering properly. When you book both pressure washing and painting together, we include the wash as part of your painting prep at no extra charge.</p>"
      }
    ],
    "cta": "See the difference — get a free pressure washing estimate.",
    "meta_title": "Pressure Washing Services | Cleanest Painting NJ",
    "meta_description": "Professional pressure washing for homes and driveways in NJ. Remove dirt, mildew, and grime. Instant curb appeal boost."
  }'::jsonb
);

-- 2f. Wallpaper Installation (published)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Wallpaper Installation Services',
  'wallpaper-installation',
  'published', 83,
  '{"wallpaper installation", "wallpaper hanging", "accent wall", "NJ wallpaper"}',
  'Wallpaper Installation | Cleanest Painting NJ',
  'Professional wallpaper installation in NJ. Accent walls, full rooms, and removals. Precision pattern matching guaranteed.',
  now() - interval '4 days',
  '{
    "headline": "Elevate Your Space with Professional Wallpaper Installation",
    "intro": "<p>Wallpaper is back — and better than ever. From bold geometric patterns to subtle textured grasscloth, today''s wallpaper options are stunning. But installation makes or breaks the result. Cleanest Painting LLC delivers flawless wallpaper installation with precise pattern matching, smooth seams, and zero bubbles.</p>",
    "sections": [
      {
        "title": "Wallpaper Services We Offer",
        "body": "<ul><li><strong>Full room installation</strong> — Bedrooms, dining rooms, living rooms, and offices</li><li><strong>Accent walls</strong> — Single statement walls that transform a space</li><li><strong>Wallpaper removal</strong> — Steam stripping, scraping, and wall repair</li><li><strong>Commercial wallpaper</strong> — Lobbies, restaurants, and office spaces</li></ul>"
      },
      {
        "title": "Types of Wallpaper We Install",
        "body": "<p>We work with all wallpaper types: <strong>pre-pasted</strong>, <strong>unpasted</strong>, <strong>peel-and-stick</strong>, <strong>vinyl</strong>, <strong>grasscloth</strong>, <strong>fabric-backed</strong>, and <strong>mural wallpaper</strong>. Each type has unique installation requirements — proper adhesive selection, wall preparation, and booking technique are critical. We''ve installed thousands of rolls and know the nuances of every material.</p>"
      },
      {
        "title": "Wall Preparation is Everything",
        "body": "<p>A flawless wallpaper installation starts with perfect walls. We fill every hole, sand every imperfection, and apply a dedicated wallpaper primer that ensures proper adhesion and future removability. Skipping prep leads to bubbles, peeling, and torn drywall on removal — we never cut corners.</p>"
      }
    ],
    "cta": "Ready for wallpaper? Get a free installation estimate.",
    "meta_title": "Wallpaper Installation | Cleanest Painting NJ",
    "meta_description": "Professional wallpaper installation in NJ. Accent walls, full rooms, and removals. Precision pattern matching guaranteed."
  }'::jsonb
);

-- 2g. Color Consultation (in review)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Color Consultation Services',
  'color-consultation',
  'review', 78,
  '{"color consultation", "paint colors", "color matching", "NJ color consultant"}',
  'Color Consultation | Cleanest Painting NJ',
  'Expert color consultation for your home. We help you choose the perfect palette for interior and exterior painting projects.',
  '{
    "headline": "Find Your Perfect Colors with Expert Consultation",
    "intro": "<p>Choosing paint colors can be overwhelming — thousands of options, shifting undertones, and the fear of committing to the wrong shade. Our color consultation service takes the guesswork out. We bring professional color expertise, large-format samples, and real-world testing to ensure you love the result.</p>",
    "sections": [
      {
        "title": "How Our Color Consultation Works",
        "body": "<p>We start with an in-home visit to assess your space — natural light, existing furnishings, flooring, and architectural details all influence color selection. We discuss your style preferences and present curated palettes. Then we paint large test patches on your walls so you can see colors in your actual lighting before committing.</p>"
      },
      {
        "title": "What''s Included",
        "body": "<ul><li><strong>In-home consultation</strong> — 60–90 minute visit with our color specialist</li><li><strong>Curated palette</strong> — 3–5 coordinated color options tailored to your space</li><li><strong>Test patches</strong> — Large swatches painted on your walls in real lighting</li><li><strong>Digital color board</strong> — Take-home reference with paint names, codes, and finish recommendations</li></ul>"
      },
      {
        "title": "Popular Color Trends in New Jersey",
        "body": "<p>New Jersey homeowners are gravitating toward warm neutrals — think <strong>Benjamin Moore Revere Pewter</strong>, <strong>Sherwin-Williams Agreeable Gray</strong>, and <strong>Farrow & Ball Skimming Stone</strong>. For bold accents, deep greens (like BM Salamander) and rich navies (like SW Naval) continue to dominate. We stay current on trends while guiding you toward timeless choices.</p>"
      }
    ],
    "cta": "Book a color consultation and fall in love with your palette.",
    "meta_title": "Color Consultation | Cleanest Painting NJ",
    "meta_description": "Expert color consultation for your home. We help you choose the perfect palette for interior and exterior painting projects."
  }'::jsonb
);

-- 2h. Commercial Painting (in review)
insert into public.service_pages (organization_id, title, slug, status, seo_score, keywords, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Commercial Painting Services',
  'commercial-painting',
  'review', 80,
  '{"commercial painting", "office painting", "business painting", "NJ commercial painters"}',
  'Commercial Painting | Cleanest Painting NJ',
  'Professional commercial painting for offices, retail, and facilities in NJ. Minimal disruption, on-time delivery.',
  '{
    "headline": "Professional Commercial Painting That Minimizes Downtime",
    "intro": "<p>Your business space reflects your brand. Faded walls, scuffed trim, and dated colors send the wrong message. Cleanest Painting LLC delivers commercial painting on schedule and within budget — with flexible hours (nights and weekends available) to minimize disruption to your operations.</p>",
    "sections": [
      {
        "title": "Commercial Spaces We Paint",
        "body": "<ul><li><strong>Office buildings</strong> — Lobbies, suites, conference rooms, and common areas</li><li><strong>Retail stores</strong> — Storefronts, showrooms, and fitting rooms</li><li><strong>Restaurants & hospitality</strong> — Dining rooms, kitchens, and hotel rooms</li><li><strong>Medical facilities</strong> — Waiting rooms, exam rooms, and labs (low-VOC required)</li><li><strong>Industrial & warehouse</strong> — Epoxy floors, safety markings, and equipment coatings</li></ul>"
      },
      {
        "title": "Why Businesses Choose Us",
        "body": "<p>We understand that time is money. Our commercial division works around your schedule — early mornings, evenings, weekends, or phased rollouts that keep your business running. We carry full liability insurance and workers'' comp coverage. Every project includes a dedicated project manager and daily progress updates.</p>"
      },
      {
        "title": "Commercial Coatings & Finishes",
        "body": "<p>Commercial environments demand durable coatings. We use <strong>Sherwin-Williams ProMar 200</strong> for standard commercial applications, <strong>epoxy coatings</strong> for garage and warehouse floors, and <strong>anti-microbial paints</strong> for medical and food service environments. We match any brand color standard and can work with your architect''s color specifications.</p>"
      }
    ],
    "cta": "Get a commercial painting quote for your business.",
    "meta_title": "Commercial Painting | Cleanest Painting NJ",
    "meta_description": "Professional commercial painting for offices, retail, and facilities in NJ. Minimal disruption, on-time delivery."
  }'::jsonb
);


-- ---------------------------------------------------------------------------
-- 3. Location Pages (12 total: 10 published, 2 in review)
-- ---------------------------------------------------------------------------

-- 3a. Summit, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Summit, NJ',
  'summit-nj-painting',
  'Summit', 'NJ', '{"07901", "07902"}',
  'published', 90,
  '{"Summit NJ painting", "painters Summit NJ", "house painting Summit"}',
  'Painting Services in Summit, NJ | Cleanest Painting',
  'Top-rated painting services in Summit, NJ. Interior, exterior, and cabinet painting for Summit homeowners. Free estimates.',
  now() - interval '13 days',
  '{
    "headline": "Summit, NJ''s Trusted Painting Professionals",
    "intro": "<p>Summit is known for its beautiful Victorian and Colonial homes, tree-lined streets, and vibrant downtown. Keeping these homes looking their best requires painters who understand the character of the neighborhood. Cleanest Painting LLC has been serving Summit homeowners with premium painting services that respect the architectural heritage of this beloved Union County community.</p>",
    "sections": [
      {
        "title": "Our Summit Services",
        "body": "<ul><li><strong>Interior painting</strong> — Living rooms, bedrooms, kitchens, and historic plaster restoration</li><li><strong>Exterior painting</strong> — Siding, trim, porches, and Victorian detail work</li><li><strong>Cabinet refinishing</strong> — Kitchen and bathroom cabinet transformations</li><li><strong>Deck staining</strong> — Protect your backyard deck from New Jersey weather</li><li><strong>Color consultation</strong> — In-home color selection with professional guidance</li></ul>"
      },
      {
        "title": "Why Summit Homeowners Choose Us",
        "body": "<p>We understand Summit''s unique housing stock — from the grand Victorians on Springfield Avenue to the Colonials near Memorial Field. Many of these homes have original architectural details like crown molding, wainscoting, and built-in cabinetry that require skilled painters with steady hands and attention to detail. We''ve painted dozens of homes in Summit and know the local HOA requirements and historical guidelines.</p>"
      },
      {
        "title": "Serving the Summit Community",
        "body": "<p>We''re proud to be part of the Summit community. We support local events, use eco-friendly low-VOC paints, and always follow Summit''s noise ordinances and parking regulations during projects. Our team respects your property, your neighbors, and your time. Most interior projects in Summit are completed within 3–5 days.</p>"
      }
    ],
    "cta": "Get a free painting estimate for your Summit home.",
    "meta_title": "Painting Services in Summit, NJ | Cleanest Painting",
    "meta_description": "Top-rated painting services in Summit, NJ. Interior, exterior, and cabinet painting for Summit homeowners. Free estimates."
  }'::jsonb
);

-- 3b. Cranford, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Cranford, NJ',
  'cranford-nj-painting',
  'Cranford', 'NJ', '{"07016"}',
  'published', 88,
  '{"Cranford NJ painting", "painters Cranford NJ", "house painting Cranford"}',
  'Painting Services in Cranford, NJ | Cleanest Painting',
  'Professional painting services in Cranford, NJ. Interior and exterior painting for homes near Nomahegan Park and downtown.',
  now() - interval '11 days',
  '{
    "headline": "Cranford''s Go-To Painting Contractor",
    "intro": "<p>Cranford — the Venice of New Jersey — is filled with charming homes along the Rahway River. From the bungalows near Nomahegan Park to the Colonials in Sunny Acres, Cranford homeowners take pride in their properties. Cleanest Painting LLC delivers the quality craftsmanship this community deserves.</p>",
    "sections": [
      {
        "title": "Services for Cranford Homes",
        "body": "<ul><li><strong>Interior painting</strong> — Modern updates for classic Cranford floor plans</li><li><strong>Exterior painting</strong> — Weather protection for riverside and flood-zone homes</li><li><strong>Cabinet refinishing</strong> — Updated kitchens without full renovation cost</li><li><strong>Pressure washing</strong> — Driveways, patios, and siding refresh</li></ul>"
      },
      {
        "title": "Local Knowledge Matters",
        "body": "<p>Cranford''s proximity to the Rahway River means many homes face higher humidity and moisture challenges. We select exterior paints with superior moisture resistance and ensure proper ventilation during interior projects. Our team knows which paint products perform best in Cranford''s micro-climate and can recommend solutions that last.</p>"
      },
      {
        "title": "Community Commitment",
        "body": "<p>We love Cranford — the Thursday night concerts, the restaurants on North Avenue, and the tight-knit neighborhoods. When you hire Cleanest Painting, you''re supporting a local business that reinvests in this community. We''re fully licensed, insured, and committed to being the painters Cranford trusts most.</p>"
      }
    ],
    "cta": "Request a free estimate for your Cranford home.",
    "meta_title": "Painting Services in Cranford, NJ | Cleanest Painting",
    "meta_description": "Professional painting services in Cranford, NJ. Interior and exterior painting for homes near Nomahegan Park and downtown."
  }'::jsonb
);

-- 3c. Westfield, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Westfield, NJ',
  'westfield-nj-painting',
  'Westfield', 'NJ', '{"07090", "07091"}',
  'published', 91,
  '{"Westfield NJ painting", "painters Westfield NJ", "house painting Westfield"}',
  'Painting Services in Westfield, NJ | Cleanest Painting',
  'Premium painting services in Westfield, NJ. Trusted by homeowners in the Gardens, Wychwood, and Indian Forest neighborhoods.',
  now() - interval '10 days',
  '{
    "headline": "Premium Painting for Westfield''s Finest Homes",
    "intro": "<p>Westfield is one of New Jersey''s most desirable towns — and its homes reflect that standard. From the stately Colonials in the Gardens to the Tudors in Wychwood, Westfield homeowners expect the best. Cleanest Painting LLC brings the precision, premium materials, and professionalism that Westfield demands.</p>",
    "sections": [
      {
        "title": "Painting Services for Westfield",
        "body": "<ul><li><strong>Interior painting</strong> — Formal living rooms, open-concept renovations, and kids'' rooms</li><li><strong>Exterior painting</strong> — Cedar shake, brick, stucco, and wood siding</li><li><strong>Cabinet refinishing</strong> — High-end kitchen transformations</li><li><strong>Wallpaper installation</strong> — Designer wallpaper for accent walls and full rooms</li></ul>"
      },
      {
        "title": "Understanding Westfield Architecture",
        "body": "<p>Westfield''s diverse housing stock — Victorians, Colonials, Tudors, and modern renovations — requires painters who can adapt to different styles. We''ve painted homes on Kimball Avenue, Lawrence Avenue, and throughout Indian Forest. Whether it''s delicate trim work on a 1920s Colonial or a clean, modern finish on a new build, we deliver results that match the home''s character.</p>"
      },
      {
        "title": "Westfield''s Most Popular Colors",
        "body": "<p>Westfield homeowners gravitate toward timeless exteriors: <strong>Benjamin Moore Hale Navy</strong> for front doors, <strong>Revere Pewter</strong> for interiors, and classic white trim in <strong>White Dove</strong> or <strong>Simply White</strong>. For bolder interiors, we''re seeing <strong>Farrow & Ball Hague Blue</strong> in libraries and <strong>Salamander</strong> green in powder rooms. Our color consultation service helps you pick the perfect palette for your Westfield home.</p>"
      }
    ],
    "cta": "Elevate your Westfield home — get a free estimate today.",
    "meta_title": "Painting Services in Westfield, NJ | Cleanest Painting",
    "meta_description": "Premium painting services in Westfield, NJ. Trusted by homeowners in the Gardens, Wychwood, and Indian Forest neighborhoods."
  }'::jsonb
);

-- 3d. Scotch Plains, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Scotch Plains, NJ',
  'scotch-plains-nj-painting',
  'Scotch Plains', 'NJ', '{"07076"}',
  'published', 85,
  '{"Scotch Plains NJ painting", "painters Scotch Plains NJ", "house painting Scotch Plains"}',
  'Painting Services in Scotch Plains, NJ | Cleanest',
  'Reliable painting services in Scotch Plains, NJ. Interior, exterior, and deck staining for Scotch Plains families.',
  now() - interval '9 days',
  '{
    "headline": "Scotch Plains'' Reliable Painting Professionals",
    "intro": "<p>Scotch Plains offers a perfect blend of suburban living and natural beauty, with the Watchung Reservation right in the backyard. Homes here range from mid-century ranches to spacious Colonials on tree-lined streets. Cleanest Painting LLC provides dependable, high-quality painting services that Scotch Plains families count on.</p>",
    "sections": [
      {
        "title": "Our Scotch Plains Services",
        "body": "<ul><li><strong>Interior painting</strong> — Whole-home repaints and room refreshes</li><li><strong>Exterior painting</strong> — Complete exterior transformations</li><li><strong>Deck staining</strong> — Protection for backyard living spaces</li><li><strong>Pressure washing</strong> — Driveways, patios, and siding</li></ul>"
      },
      {
        "title": "Painting for Scotch Plains Homes",
        "body": "<p>Many Scotch Plains homes were built in the 1950s–1970s and feature unique characteristics — textured ceilings, wood paneling, and original built-ins. Our team has experience updating these homes with modern colors and finishes while preserving the details that make them special. We also handle lead paint testing and abatement for pre-1978 homes.</p>"
      },
      {
        "title": "Your Neighbors Trust Us",
        "body": "<p>We''ve painted homes throughout Scotch Plains — from Coles Avenue to Terrill Road. Our reputation is built on word-of-mouth referrals from satisfied customers. Check our reviews on Google and see why Scotch Plains homeowners keep calling us back for their next project.</p>"
      }
    ],
    "cta": "Join your Scotch Plains neighbors — get a free painting estimate.",
    "meta_title": "Painting Services in Scotch Plains, NJ | Cleanest",
    "meta_description": "Reliable painting services in Scotch Plains, NJ. Interior, exterior, and deck staining for Scotch Plains families."
  }'::jsonb
);

-- 3e. New Providence, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in New Providence, NJ',
  'new-providence-nj-painting',
  'New Providence', 'NJ', '{"07974"}',
  'published', 84,
  '{"New Providence NJ painting", "painters New Providence NJ", "house painting New Providence"}',
  'Painting in New Providence, NJ | Cleanest Painting',
  'Quality painting services in New Providence, NJ. Trusted by homeowners near Murray Hill and Salt Brook.',
  now() - interval '8 days',
  '{
    "headline": "Quality Painting for New Providence Homes",
    "intro": "<p>Nestled between Summit and Berkeley Heights, New Providence is a quiet, family-friendly community with well-maintained homes and a strong sense of neighborhood pride. Cleanest Painting LLC serves New Providence with the same quality and care we bring to every community — because your home deserves nothing less.</p>",
    "sections": [
      {
        "title": "Services We Provide",
        "body": "<ul><li><strong>Interior painting</strong> — Every room from basement to attic</li><li><strong>Exterior painting</strong> — Full home exteriors including trim and accents</li><li><strong>Cabinet refinishing</strong> — Kitchen cabinet makeovers</li><li><strong>Color consultation</strong> — Professional color selection guidance</li></ul>"
      },
      {
        "title": "New Providence Expertise",
        "body": "<p>New Providence''s housing stock is primarily Colonials, split-levels, and Cape Cods from the 1950s–1980s. These homes often benefit from updated color schemes that modernize their appearance while complementing the neighborhood aesthetic. We help homeowners choose colors that boost curb appeal and resale value.</p>"
      },
      {
        "title": "Convenient and Professional",
        "body": "<p>We know New Providence homeowners value efficiency and respect for their time. Our team arrives on schedule, works cleanly, and communicates throughout the project. Most interior projects are completed within a week. We handle all furniture moving and protection — you just choose the colors.</p>"
      }
    ],
    "cta": "Get your free painting estimate in New Providence.",
    "meta_title": "Painting in New Providence, NJ | Cleanest Painting",
    "meta_description": "Quality painting services in New Providence, NJ. Trusted by homeowners near Murray Hill and Salt Brook."
  }'::jsonb
);

-- 3f. Chatham, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Chatham, NJ',
  'chatham-nj-painting',
  'Chatham', 'NJ', '{"07928"}',
  'published', 87,
  '{"Chatham NJ painting", "painters Chatham NJ", "house painting Chatham"}',
  'Painting Services in Chatham, NJ | Cleanest Painting',
  'Expert painting services in Chatham, NJ. Interior and exterior painting for homes in Chatham Borough and Chatham Township.',
  now() - interval '7 days',
  '{
    "headline": "Chatham''s Expert Painting Professionals",
    "intro": "<p>Chatham — both the Borough and the Township — is home to some of Morris County''s most beautiful properties. From the historic homes along Main Street to the newer developments off Southern Boulevard, Chatham homeowners appreciate quality work. Cleanest Painting LLC delivers the premium results Chatham residents expect.</p>",
    "sections": [
      {
        "title": "Chatham Painting Services",
        "body": "<ul><li><strong>Interior painting</strong> — Open floor plan updates, accent walls, and trim refinishing</li><li><strong>Exterior painting</strong> — Cedar, vinyl, and hardboard siding</li><li><strong>Wallpaper installation</strong> — Designer wallpaper for dining rooms and bedrooms</li><li><strong>Deck staining</strong> — Backyard deck protection and restoration</li></ul>"
      },
      {
        "title": "Painting for Chatham''s Housing Styles",
        "body": "<p>Chatham features a wonderful mix of Colonials, farmhouse-style homes, and contemporary builds. Each style has unique painting requirements. We''re experienced with the detailed trim work on older Chatham homes and the clean, modern finishes popular in newer construction. Our color recommendations respect both the home''s architecture and the surrounding streetscape.</p>"
      },
      {
        "title": "Serving Chatham with Pride",
        "body": "<p>Chatham is one of our favorite communities to work in. The walkable downtown, great schools, and friendly neighbors make every project enjoyable. We''re fully insured, references available, and ready to start your next painting project. Many of our Chatham clients are repeat customers — we take that as the highest compliment.</p>"
      }
    ],
    "cta": "Transform your Chatham home — request a free estimate.",
    "meta_title": "Painting Services in Chatham, NJ | Cleanest Painting",
    "meta_description": "Expert painting services in Chatham, NJ. Interior and exterior painting for homes in Chatham Borough and Chatham Township."
  }'::jsonb
);

-- 3g. Madison, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Madison, NJ',
  'madison-nj-painting',
  'Madison', 'NJ', '{"07940"}',
  'published', 86,
  '{"Madison NJ painting", "painters Madison NJ", "house painting Madison"}',
  'Painting Services in Madison, NJ | Cleanest Painting',
  'Professional painting services in Madison, NJ. Serving homeowners near Drew University, downtown, and Giralda Farms.',
  now() - interval '6 days',
  '{
    "headline": "Madison''s Trusted Painting Professionals",
    "intro": "<p>Madison — the Rose City — combines small-town charm with sophisticated living. Home to Drew University and a thriving downtown, Madison''s residential streets feature beautifully maintained homes that reflect the community''s pride. Cleanest Painting LLC brings expert painting services to Madison homeowners who want the best for their properties.</p>",
    "sections": [
      {
        "title": "What We Offer in Madison",
        "body": "<ul><li><strong>Interior painting</strong> — Whole-home updates, room refreshes, and trim work</li><li><strong>Exterior painting</strong> — Curb appeal upgrades for all home styles</li><li><strong>Cabinet refinishing</strong> — Modernize your kitchen without replacing cabinets</li><li><strong>Pressure washing</strong> — Driveway, walkway, and siding cleaning</li></ul>"
      },
      {
        "title": "Madison Home Expertise",
        "body": "<p>Madison''s homes range from grand estates near Giralda Farms to cozy Cape Cods near the train station. We''ve worked on homes throughout Madison — from Ridgedale Avenue to Woodland Road. Our team understands the local aesthetic and can recommend colors and finishes that complement Madison''s character while reflecting your personal style.</p>"
      },
      {
        "title": "Convenient for Madison Commuters",
        "body": "<p>We know many Madison residents commute to NYC. That''s why we offer flexible scheduling — we can work while you''re at the office and have everything clean and dry by the time you''re home. Our project management keeps you informed via text updates throughout the day so there are no surprises.</p>"
      }
    ],
    "cta": "Get a free painting estimate for your Madison home.",
    "meta_title": "Painting Services in Madison, NJ | Cleanest Painting",
    "meta_description": "Professional painting services in Madison, NJ. Serving homeowners near Drew University, downtown, and Giralda Farms."
  }'::jsonb
);

-- 3h. Morristown, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Morristown, NJ',
  'morristown-nj-painting',
  'Morristown', 'NJ', '{"07960", "07961", "07962", "07963"}',
  'published', 88,
  '{"Morristown NJ painting", "painters Morristown NJ", "house painting Morristown"}',
  'Painting Services in Morristown, NJ | Cleanest',
  'Top-rated painting services in Morristown, NJ. Residential and commercial painting in the heart of Morris County.',
  now() - interval '5 days',
  '{
    "headline": "Morristown''s Top-Rated Painting Contractor",
    "intro": "<p>Morristown — the historic center of Morris County — blends Revolutionary War history with modern living. From the grand homes surrounding Morristown Green to condos and townhouses near the train station, Morristown''s diverse housing options all benefit from professional painting. Cleanest Painting LLC serves both residential and commercial clients throughout Morristown.</p>",
    "sections": [
      {
        "title": "Morristown Painting Services",
        "body": "<ul><li><strong>Residential painting</strong> — Single-family homes, condos, and townhouses</li><li><strong>Commercial painting</strong> — Offices, restaurants, and retail on South Street and the Green</li><li><strong>Historic restoration</strong> — Period-appropriate colors for Morristown''s historic properties</li><li><strong>Exterior painting</strong> — All siding types and architectural styles</li></ul>"
      },
      {
        "title": "Residential & Commercial Expertise",
        "body": "<p>Morristown is unique — it''s both a charming residential town and a bustling business center. We paint homes on Washington Valley Road with the same care we bring to storefronts on South Street. Our commercial division offers flexible scheduling (nights and weekends) so your business stays open during the project. For residential clients, we manage every detail from color selection to final walkthrough.</p>"
      },
      {
        "title": "Morristown''s Historic Character",
        "body": "<p>Many Morristown homes are on or near the National Historic Register. Painting historic properties requires knowledge of period-appropriate color palettes and architectural details. We work with the Morristown Historic Preservation Commission guidelines and can recommend colors that honor your home''s heritage while giving it a fresh, maintained appearance.</p>"
      }
    ],
    "cta": "Schedule your free Morristown painting estimate.",
    "meta_title": "Painting Services in Morristown, NJ | Cleanest",
    "meta_description": "Top-rated painting services in Morristown, NJ. Residential and commercial painting in the heart of Morris County."
  }'::jsonb
);

-- 3i. Short Hills, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Short Hills, NJ',
  'short-hills-nj-painting',
  'Short Hills', 'NJ', '{"07078"}',
  'published', 93,
  '{"Short Hills NJ painting", "painters Short Hills NJ", "house painting Short Hills"}',
  'Painting in Short Hills, NJ | Cleanest Painting',
  'Premium painting services in Short Hills, NJ. High-end interior and exterior painting for Short Hills'' luxury homes.',
  now() - interval '4 days',
  '{
    "headline": "Premium Painting for Short Hills'' Luxury Homes",
    "intro": "<p>Short Hills is synonymous with luxury living in New Jersey. The grand estates, manicured landscapes, and impeccable homes here demand painting services that match the standard. Cleanest Painting LLC provides the premium craftsmanship, high-end materials, and white-glove service that Short Hills homeowners expect.</p>",
    "sections": [
      {
        "title": "Luxury Painting Services",
        "body": "<ul><li><strong>Interior painting</strong> — Formal rooms, great rooms, and custom millwork finishing</li><li><strong>Exterior painting</strong> — Estate-quality finishes for large properties</li><li><strong>Cabinet refinishing</strong> — High-end kitchen and bathroom cabinetry</li><li><strong>Specialty finishes</strong> — Venetian plaster, limewash, and decorative glazing</li><li><strong>Wallpaper installation</strong> — Designer and imported wallcoverings</li></ul>"
      },
      {
        "title": "Why Short Hills Chooses Cleanest Painting",
        "body": "<p>Short Hills homeowners know the difference between good and exceptional. We use only premium materials — <strong>Farrow & Ball</strong>, <strong>Benjamin Moore Aura</strong>, and <strong>Fine Paints of Europe</strong> — applied with techniques that bring out their full beauty. Our attention to detail extends to protecting your fine furnishings, hardwood floors, and landscaping throughout the project.</p>"
      },
      {
        "title": "Estate-Scale Projects",
        "body": "<p>Many Short Hills homes are 4,000–10,000+ square feet. We''re equipped for large-scale projects with dedicated teams, detailed scheduling, and seamless coordination across multiple rooms and exterior surfaces. Our project managers ensure consistent quality from the first brushstroke to the final walkthrough — no matter the size of your home.</p>"
      }
    ],
    "cta": "Experience premium painting — get your Short Hills estimate.",
    "meta_title": "Painting in Short Hills, NJ | Cleanest Painting",
    "meta_description": "Premium painting services in Short Hills, NJ. High-end interior and exterior painting for Short Hills'' luxury homes."
  }'::jsonb
);

-- 3j. Maplewood, NJ (published)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Maplewood, NJ',
  'maplewood-nj-painting',
  'Maplewood', 'NJ', '{"07040"}',
  'published', 86,
  '{"Maplewood NJ painting", "painters Maplewood NJ", "house painting Maplewood"}',
  'Painting Services in Maplewood, NJ | Cleanest',
  'Professional painting services in Maplewood, NJ. Colorful homes for a colorful community. Interior and exterior painting.',
  now() - interval '3 days',
  '{
    "headline": "Painting Services for Maplewood''s Creative Community",
    "intro": "<p>Maplewood is one of New Jersey''s most vibrant communities — diverse, creative, and architecturally rich. From the Tudors and Colonials near the Village to the Arts & Crafts homes in Hilton, Maplewood homeowners aren''t afraid of bold color choices. Cleanest Painting LLC loves working in Maplewood because the community embraces creativity.</p>",
    "sections": [
      {
        "title": "Maplewood Painting Services",
        "body": "<ul><li><strong>Interior painting</strong> — Bold accent walls, nurseries, and whole-home updates</li><li><strong>Exterior painting</strong> — Statement front doors, colorful trim, and full exterior repaints</li><li><strong>Cabinet refinishing</strong> — Two-tone and colored cabinet finishes</li><li><strong>Deck staining</strong> — Backyard entertainment spaces</li></ul>"
      },
      {
        "title": "Maplewood''s Bold Color Personality",
        "body": "<p>While many NJ towns lean conservative with color, Maplewood stands out. We''ve painted bright yellow front doors, deep teal accent walls, and vibrant coral kitchens here. If you have a color vision — no matter how bold — we can bring it to life with the right paint, finish, and technique. We also help more traditional homeowners find the perfect updated neutral palette.</p>"
      },
      {
        "title": "Eco-Friendly Painting for Maplewood",
        "body": "<p>Maplewood residents care about sustainability. We use <strong>zero-VOC and low-VOC paints</strong> from Benjamin Moore Natura and Sherwin-Williams Harmony lines. These paints are safe for families, pets, and the environment — with no compromise on durability or color quality. We also recycle all paint cans and minimize waste on every project.</p>"
      }
    ],
    "cta": "Bring color to your Maplewood home — get a free estimate.",
    "meta_title": "Painting Services in Maplewood, NJ | Cleanest",
    "meta_description": "Professional painting services in Maplewood, NJ. Colorful homes for a colorful community. Interior and exterior painting."
  }'::jsonb
);

-- 3k. Bernardsville, NJ (in review)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in Bernardsville, NJ',
  'bernardsville-nj-painting',
  'Bernardsville', 'NJ', '{"07924"}',
  'review', 82,
  '{"Bernardsville NJ painting", "painters Bernardsville NJ", "house painting Bernardsville"}',
  'Painting in Bernardsville, NJ | Cleanest Painting',
  'Professional painting for Bernardsville, NJ estates and homes. Premium materials and expert craftsmanship in Somerset County.',
  '{
    "headline": "Expert Painting for Bernardsville''s Estate Homes",
    "intro": "<p>Bernardsville sits in the heart of the Somerset Hills, surrounded by rolling countryside and some of New Jersey''s most impressive estates. The homes here — from historic properties on Mine Brook Road to newer builds in Somerset Hills — require painters with the skill and experience to match their quality. Cleanest Painting LLC delivers premium painting services for Bernardsville''s discerning homeowners.</p>",
    "sections": [
      {
        "title": "Bernardsville Services",
        "body": "<ul><li><strong>Interior painting</strong> — Grand foyers, libraries, and formal dining rooms</li><li><strong>Exterior painting</strong> — Large-scale estate painting and maintenance</li><li><strong>Specialty finishes</strong> — Limewash, color washing, and glazing</li><li><strong>Barn & outbuilding painting</strong> — Garages, pool houses, and horse barns</li></ul>"
      },
      {
        "title": "Estate-Scale Expertise",
        "body": "<p>Bernardsville properties often include extensive square footage plus outbuildings. Our team is equipped to handle large-scale projects with multiple crews, detailed scheduling, and consistent quality across every structure. We''ve painted Bernardsville homes from 3,000 to 15,000+ square feet and manage each project with the same care and attention.</p>"
      },
      {
        "title": "Somerset Hills Quality",
        "body": "<p>We understand the Somerset Hills standard. Premium materials, skilled craftsmen, and meticulous attention to detail are non-negotiable. We use the finest paints available — including Fine Paints of Europe and Farrow & Ball — and apply them with techniques that create a flawless, lasting finish worthy of your Bernardsville home.</p>"
      }
    ],
    "cta": "Request your free Bernardsville painting consultation.",
    "meta_title": "Painting in Bernardsville, NJ | Cleanest Painting",
    "meta_description": "Professional painting for Bernardsville, NJ estates and homes. Premium materials and expert craftsmanship in Somerset County."
  }'::jsonb
);

-- 3l. South Orange, NJ (in review)
insert into public.location_pages (organization_id, title, slug, city, state, zip_codes, status, seo_score, keywords, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Painting Services in South Orange, NJ',
  'south-orange-nj-painting',
  'South Orange', 'NJ', '{"07079"}',
  'review', 83,
  '{"South Orange NJ painting", "painters South Orange NJ", "house painting South Orange"}',
  'Painting in South Orange, NJ | Cleanest Painting',
  'Quality painting services in South Orange, NJ. Interior and exterior painting for homes near Seton Hall and the Village.',
  '{
    "headline": "South Orange''s Trusted Painting Contractor",
    "intro": "<p>South Orange is a community that celebrates both history and progress. Home to Seton Hall University and a walkable Village center, South Orange''s residential neighborhoods feature stunning Victorians, Colonials, and mid-century homes. Cleanest Painting LLC is proud to serve this diverse, engaged community with top-quality painting services.</p>",
    "sections": [
      {
        "title": "South Orange Services",
        "body": "<ul><li><strong>Interior painting</strong> — Historic homes, modern updates, and everything in between</li><li><strong>Exterior painting</strong> — Victorian detail work, cedar siding, and more</li><li><strong>Wallpaper installation</strong> — Accent walls and full room installations</li><li><strong>Pressure washing</strong> — Brick, stone, and siding cleaning</li></ul>"
      },
      {
        "title": "Preserving South Orange''s Character",
        "body": "<p>South Orange''s Montrose Park Historic District and surrounding neighborhoods feature architecturally significant homes. Painting these properties requires sensitivity to their historical character — appropriate color palettes, careful prep of original woodwork, and finishes that protect while beautifying. Our team has experience with South Orange''s full range of architectural styles.</p>"
      },
      {
        "title": "A Community We Love",
        "body": "<p>South Orange''s energy is infectious — the SOPAC arts center, the Farmers Market, the diverse dining scene. We love being part of this community and show it through our work. Every South Orange project gets our full attention, premium materials, and the Cleanest Painting guarantee of satisfaction.</p>"
      }
    ],
    "cta": "Get a free estimate for your South Orange home.",
    "meta_title": "Painting in South Orange, NJ | Cleanest Painting",
    "meta_description": "Quality painting services in South Orange, NJ. Interior and exterior painting for homes near Seton Hall and the Village."
  }'::jsonb
);


-- ---------------------------------------------------------------------------
-- 4. Blog Posts (3 total: 1 published, 1 in review, 1 draft)
-- ---------------------------------------------------------------------------

-- 4a. How to Choose the Right Paint Color (published)
insert into public.blog_posts (organization_id, title, slug, excerpt, category, tags, status, seo_score, keywords, reading_time_minutes, meta_title, meta_description, published_at, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'How to Choose the Right Paint Color for Your Home',
  'choose-right-paint-color',
  'Choosing paint colors doesn''t have to be stressful. Learn our professional process for finding the perfect palette for any room.',
  'Tips & Guides',
  '{"paint colors", "color selection", "home improvement", "interior design"}',
  'published', 88,
  '{"paint color", "choose paint color", "paint color guide", "home painting tips"}',
  6,
  'How to Choose the Right Paint Color | Cleanest',
  'Expert tips for choosing the perfect paint color. Undertones, lighting, samples, and professional advice from NJ painters.',
  now() - interval '7 days',
  '{
    "headline": "How to Choose the Right Paint Color for Your Home",
    "intro": "<p>Standing in front of a wall of paint chips can feel overwhelming. With thousands of colors to choose from, how do you find the one that''s perfect for your space? After painting hundreds of New Jersey homes, we''ve developed a foolproof process for choosing paint colors that you''ll love for years to come.</p>",
    "sections": [
      {
        "title": "Step 1: Understand Undertones",
        "body": "<p>Every paint color has an undertone — a subtle secondary color that shows through. Whites can lean warm (yellow/cream) or cool (blue/gray). Grays can pull purple, green, or blue. Understanding undertones is the single most important skill in color selection.</p><p>Here''s the trick: hold a pure white sheet of paper next to your paint chip. The undertone will become obvious by comparison. <strong>Benjamin Moore Revere Pewter</strong>, for example, has a warm greige undertone — it reads as a cozy neutral rather than a cold gray.</p>"
      },
      {
        "title": "Step 2: Test in Your Actual Lighting",
        "body": "<p>Never commit to a color based on how it looks in the store or on a screen. Buy sample pots and paint large swatches (at least 12x12 inches) on your actual walls. Observe them at different times of day — morning light, afternoon sun, and evening lamplight can dramatically change how a color reads.</p><p>North-facing rooms get cooler, bluer light. South-facing rooms get warm, golden light. East-facing rooms are bright in the morning and shadowy in the afternoon. This matters hugely for color selection.</p>"
      },
      {
        "title": "Step 3: Build a Cohesive Palette",
        "body": "<p>Your home should flow. Choose a base neutral for main living areas, then select complementary accent colors for bedrooms, bathrooms, and feature walls. A good rule: stick to 3–5 colors throughout your home, varying shades within the same color family.</p><p>For example: <strong>Revere Pewter</strong> in the living room, <strong>Edgecomb Gray</strong> in the hallway (a lighter shade in the same family), and <strong>Hale Navy</strong> for an accent wall in the office. Trim throughout in <strong>White Dove</strong>. Cohesive, sophisticated, timeless.</p>"
      },
      {
        "title": "Step 4: Don''t Forget the Finish",
        "body": "<p>Sheen matters as much as color. <strong>Flat/matte</strong> hides imperfections but is harder to clean — best for ceilings and low-traffic rooms. <strong>Eggshell</strong> is the most popular wall finish — slight sheen, wipeable, forgiving. <strong>Satin</strong> is great for kitchens, bathrooms, and kids'' rooms. <strong>Semi-gloss</strong> is the standard for trim, doors, and cabinets — durable and easy to clean.</p>"
      },
      {
        "title": "When in Doubt, Hire a Color Consultant",
        "body": "<p>If you''re stuck, a professional color consultation is worth every penny. Our color consultants bring large-format samples, understand how undertones interact with your existing furnishings, and can save you from expensive mistakes. A 90-minute consultation costs far less than repainting a room you don''t love.</p>"
      }
    ],
    "cta": "Need help choosing colors? Book a free color consultation with Cleanest Painting.",
    "meta_title": "How to Choose the Right Paint Color | Cleanest",
    "meta_description": "Expert tips for choosing the perfect paint color. Undertones, lighting, samples, and professional advice from NJ painters."
  }'::jsonb
);

-- 4b. 5 Signs Your Home Exterior Needs Repainting (in review)
insert into public.blog_posts (organization_id, title, slug, excerpt, category, tags, status, seo_score, keywords, reading_time_minutes, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  '5 Signs Your Home Exterior Needs Repainting',
  'signs-exterior-needs-repainting',
  'Don''t wait until paint is peeling off in sheets. Here are 5 early warning signs that your home''s exterior is due for a repaint.',
  'Maintenance',
  '{"exterior painting", "home maintenance", "curb appeal", "paint peeling"}',
  'review', 82,
  '{"exterior painting signs", "when to repaint house", "paint peeling", "home exterior"}',
  4,
  '5 Signs Your Home Needs Exterior Painting',
  'Learn the 5 warning signs that your home exterior needs repainting. Catch problems early and save money on repairs.',
  '{
    "headline": "5 Signs Your Home Exterior Needs Repainting",
    "intro": "<p>Your home''s exterior paint does more than look good — it''s the first line of defense against moisture, UV damage, and rot. Most exterior paint jobs in New Jersey last 7–10 years, but weather and sun exposure can accelerate wear. Here are 5 signs it''s time to call a professional.</p>",
    "sections": [
      {
        "title": "1. Peeling or Flaking Paint",
        "body": "<p>The most obvious sign. If paint is peeling, flaking, or bubbling, moisture is getting behind the paint film. This exposes bare wood to rain and humidity, which leads to rot. Don''t wait — peeling paint gets worse quickly and makes prep work (and cost) increase the longer you delay.</p>"
      },
      {
        "title": "2. Fading and Discoloration",
        "body": "<p>UV rays break down paint pigments over time, especially on south- and west-facing walls. If your home''s color looks washed out or different on different sides, the paint''s UV protection is failing. Fading is more than cosmetic — it means the paint''s protective resins are also degrading.</p>"
      },
      {
        "title": "3. Chalking",
        "body": "<p>Run your hand across the siding. If it comes away with a white, powdery residue, that''s chalking — the paint binder is breaking down. Some chalking is normal as paint ages, but heavy chalking means the paint has reached the end of its protective life. New paint should go on before the surface is compromised.</p>"
      },
      {
        "title": "4. Cracking or Alligatoring",
        "body": "<p>When paint develops a pattern of interconnected cracks resembling alligator skin, the film has lost its flexibility. This happens when paint can''t expand and contract with temperature changes — common in New Jersey''s freeze-thaw cycles. Alligatoring requires complete removal and repainting, not just a touch-up.</p>"
      },
      {
        "title": "5. Visible Wood Damage",
        "body": "<p>If you can see bare wood, dark spots, or soft areas on your trim or siding, moisture has already gotten in. This is urgent — wood rot spreads and can become a structural issue. A professional painter will assess the damage, replace rotted sections, and apply a protective paint system to prevent recurrence.</p>"
      }
    ],
    "cta": "Spotted any of these signs? Get a free exterior painting assessment.",
    "meta_title": "5 Signs Your Home Needs Exterior Painting",
    "meta_description": "Learn the 5 warning signs that your home exterior needs repainting. Catch problems early and save money on repairs."
  }'::jsonb
);

-- 4c. Interior Painting Trends for 2026 (draft)
insert into public.blog_posts (organization_id, title, slug, excerpt, category, tags, status, seo_score, keywords, reading_time_minutes, meta_title, meta_description, content)
values (
  '00000000-0000-0000-0000-000000000001',
  'Interior Painting Trends for 2026',
  'interior-painting-trends-2026',
  'From earthy warm tones to bold statement ceilings, here are the interior paint trends shaping New Jersey homes in 2026.',
  'Trends',
  '{"paint trends", "interior design", "2026 trends", "color trends"}',
  'draft', null,
  '{"interior painting trends", "paint trends 2026", "popular paint colors", "home trends"}',
  5,
  'Interior Painting Trends for 2026 | Cleanest',
  'Discover the top interior painting trends for 2026. Warm earth tones, statement ceilings, and nature-inspired palettes.',
  '{
    "headline": "Interior Painting Trends Shaping NJ Homes in 2026",
    "intro": "<p>Every year brings new color trends, and 2026 is no exception. But this year feels different — homeowners are moving away from the all-gray everything of the 2010s and embracing warmth, color, and personality. Here are the trends we''re seeing in homes across New Jersey.</p>",
    "sections": [
      {
        "title": "Warm Earth Tones Are In",
        "body": "<p>The era of cool grays is officially over. 2026 is all about warm, earthy palettes — terracotta, ochre, warm taupe, and clay. <strong>Benjamin Moore''s Color of the Year, Cinnamon Slate</strong>, perfectly captures this shift. These colors create spaces that feel grounded, cozy, and connected to nature. They pair beautifully with natural materials like wood, stone, and linen.</p>"
      },
      {
        "title": "Statement Ceilings (The Fifth Wall)",
        "body": "<p>Why leave the ceiling white? The ''fifth wall'' trend is going strong in 2026. Homeowners are painting ceilings in rich, moody colors — deep blues, forest greens, and even black. This creates intimacy in bedrooms and drama in dining rooms. A painted ceiling with white walls is a sophisticated, designer-level move that''s easier than you think.</p>"
      },
      {
        "title": "Nature-Inspired Greens",
        "body": "<p>Green continues its reign as the most popular accent color. But 2026 greens are softer and more organic — sage, olive, fern, and moss — rather than the jewel-toned emeralds of previous years. <strong>Sherwin-Williams Evergreen Fog</strong> and <strong>Benjamin Moore Herb Bouquet</strong> are flying off our shelves. Green works everywhere: kitchens, bedrooms, bathrooms, and home offices.</p>"
      },
      {
        "title": "Monochromatic Rooms",
        "body": "<p>Instead of white trim on colored walls, many homeowners are painting walls, trim, doors, and even ceilings in the same color (or slight variations of it). This creates a cocooning, intentional feel — especially in small rooms and powder rooms. It''s a European-inspired look that''s gaining serious traction in New Jersey''s design-forward communities.</p>"
      },
      {
        "title": "Limewash and Textured Finishes",
        "body": "<p>Flat paint isn''t the only game in town. Limewash — a mineral-based finish that creates a soft, chalky, subtly varied surface — is one of the hottest trends in luxury homes. It adds depth and character that flat paint can''t match. We''re also seeing demand for Roman Clay, suede finishes, and color-washed techniques that create one-of-a-kind walls.</p>"
      }
    ],
    "cta": "Ready to try a 2026 trend? Schedule your free color consultation.",
    "meta_title": "Interior Painting Trends for 2026 | Cleanest",
    "meta_description": "Discover the top interior painting trends for 2026. Warm earth tones, statement ceilings, and nature-inspired palettes."
  }'::jsonb
);
