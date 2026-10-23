# Homepage — Content Draft

URL: https://cleanestpaintingnj.com/ (fetched October 2026)

## (a) Current state

- **Hero:** The H1 is "Where Artistry Meets Craftsmanship." The support line reads "Premium residential painting across Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties." It does not name any service, does not say the company is based in Rahway, and leaves out commercial work even though commercial is in the nav.
- **Service area contradicts itself in four places.** The hero says four counties. The block below the town list says "We service all of New Jersey." The footer says "Service Area: All of New Jersey." The JSON-LD `areaServed` lists the four counties. The town list also includes Woodbridge, which is in Middlesex County, not one of the four.
- **Brand conflict:** The "Premium Materials" card says "Benjamin Moore & Sherwin-Williams exclusively." The interior page lists Farrow & Ball, and the color consultation and Westfield pages name Farrow & Ball colors.
- **Trust bar shows an HIC registration number.** Corrected to 13VH11564300 (owner, 2026-10-22).
- **Nothing explains how estimates work.** The only process detail is "We'll get back to you within 24 hours." The "View all projects" link goes to `/#services`, so there is no projects page behind it.
- **Technical issues seen in passing (not copy):** Every page title ends in "| Authority Engine," which is the platform name, not the business. The footer and JSON-LD address reads "Rahway, Rahway, NJ 07065" because the street-address field holds the city name. The owner confirmed the three named testimonials are real customers (2026-10-19). Keep written permission on file. Linking to the original Google reviews would add credibility.

## (b) Proposed hero support line (replaces the line under the H1)

Keep the H1. Pick one support line:

- **Option A (services + location):** "Interior, exterior, and cabinet painting for homes in Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties. Based in Rahway. Free estimates — we reply within 24 hours."
- **Option B (homes + businesses):** "Residential and commercial painting from our base in Rahway, NJ. Licensed, insured, and rated 5.0 on Google."
- **Option C (shortest):** "Rahway-based painters for homes across eight New Jersey counties. Free estimates."

Recommendation: Option A. It answers "what" and "where" in one sentence, and the trust bar below already covers licensing and ratings.

## (c) Proposed new sections

### How estimates work

Short block, placed directly above the estimate form. Four numbered steps:

1. **Request.** Call (732) 496-4607 or fill out the form below. We get back to you within 24 hours.
2. **Walkthrough.** We visit in person to look at the rooms or surfaces you want painted, check their condition, and talk through colors and timing.
3. **Written estimate.** You get a free written estimate for the work, prep, and paint. Ask if you would like it itemized.
4. **Scheduling.** Once you approve, we set a start date and confirm it before we arrive.

### Service-area wording options

Whatever is chosen must match in four places: the hero, the line below the town list, the footer "Service Area," and the JSON-LD `areaServed`.

- **Option 1 — counties only (strict):** "Serving Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties from our base in Rahway, NJ." Then either remove Woodbridge from the town list or add Middlesex County.
- **Option 2 — core counties + by request:** "Based in Rahway, NJ. We serve Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties, and take projects elsewhere in New Jersey by request." This replaces "We service all of New Jersey."
  Chosen: Option 2 (owner, 2026-10-22). It avoids an "all of New Jersey" claim that AI tools and Google may treat as vague.

## (d) FAQ (homepage)

```json
[
  {
    "question": "Do you offer free painting estimates?",
    "answer": "Yes. Estimates are free. Call (732) 496-4607 or fill out the form on this page, and we get back to you within 24 hours. We then visit in person to see the rooms or surfaces, check their condition, and talk about colors. After that you receive a written estimate for the work and materials."
  },
  {
    "question": "What areas does Cleanest Painting LLC serve?",
    "answer": "We are based in Rahway, NJ, and work mainly in Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth, and Bergen counties. Towns we serve include Rahway, Westfield, Summit, Chatham, Cranford, Millburn, Short Hills, Montclair, West Orange, Madison, and Morristown. We also take projects elsewhere in New Jersey. If your town is not listed, call (732) 496-4607."
  },
  {
    "question": "Is Cleanest Painting LLC licensed and insured?",
    "answer": "Yes. Cleanest Painting LLC is licensed, insured, and bonded, and it is registered as a New Jersey Home Improvement Contractor. We have over a decade of painting experience, a 5.0 Google rating, and an Angi 2024 Super Service award. We are also an EPA Lead-Safe Certified Firm."
  },
  {
    "question": "What painting services do you offer?",
    "answer": "We offer interior painting, exterior painting, cabinet refinishing, deck and fence staining, drywall and trim repair, wallpaper installation and removal, pressure washing, color consultation, and commercial painting. Most projects are homes, but we also paint offices, retail spaces, and other commercial buildings. Each service has its own page with details on prep, process, and what to expect."
  }
]
```

## (e) Facts to confirm

- [x] Service area: Union, Essex, Morris, Somerset, Middlesex, Hudson, Monmouth & Bergen counties (owner, 2026-10-22). Woodbridge stays.
- [x] Projects outside the eight counties are accepted (owner, 2026-10-22). Option 2 wording.
- [x] Paint brands: Benjamin Moore & Sherwin-Williams (owner, 2026-10-22). Farrow & Ball and Fine Paints of Europe mentions removed from live pages (2026-10-23).
- [x] HIC registration number: 13VH11564300 (owner, 2026-10-22).
- [x] Estimates: free, in-person walkthrough, written; itemized on request (owner, 2026-10-23).
- [x] Rahway, Montclair and West Orange are served (owner, 2026-10-23).
- [x] EPA Lead-Safe Certified Firm (owner, 2026-10-23).
- [ ] Estimate validity period, deposit, and lead time to start.
- [ ] Certificate of insurance is available on request.
- [ ] "Licensed, insured, and bonded", "over a decade", "5.0 Google rating" and "Angi 2024 Super Service" are on the live site but weren't re-confirmed on 2026-10-23.
- [x] The three homepage testimonials are real customers (owner confirmed 2026-10-19). Keep written permission on file.
- [ ] Whether a projects/portfolio page will exist. If not, change "View all projects" to "View our services."
