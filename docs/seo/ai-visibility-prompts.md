# AI Visibility Check — Prompts & Log

Purpose: track once a month whether AI assistants mention or cite Cleanest Painting LLC (https://cleanestpaintingnj.com) when New Jersey homeowners ask painting questions. This is a manual spot check, not a ranking report. A handful of prompts gives you a direction, not market share.

## Prompts (run all 12 every month, exact wording)

| # | Prompt | Town | Service | Type |
|---|---|---|---|---|
| 1 | Who are good house painters near Rahway, NJ? | Rahway | General | Discovery |
| 2 | Recommend an interior painting company in Westfield NJ for a whole first floor | Westfield | Interior | Discovery |
| 3 | How much does it cost to paint the exterior of a colonial house in Summit, NJ? | Summit | Exterior | Cost |
| 4 | Cabinet painting vs replacing kitchen cabinets in Chatham NJ — who does cabinet refinishing nearby? | Chatham | Cabinets | Comparison + discovery |
| 5 | Painters in Cranford NJ who are licensed and insured with good Google reviews | Cranford | General | Discovery (trust) |
| 6 | Who can install grasscloth wallpaper in Millburn or Short Hills NJ? | Millburn | Wallpaper | Discovery |
| 7 | Best time of year to paint a house exterior in New Jersey, and who can do it in Union County? | Union County | Exterior | Research + discovery |
| 8 | Deck staining company near Westfield NJ — solid or semi-transparent stain? | Westfield | Deck | Comparison + discovery |
| 9 | Can peeling cedar shake siding be repainted? Looking for a painter in Summit NJ | Summit | Exterior | Prep + discovery |
| 10 | Does a painter in Cranford NJ need to be lead-safe certified for a 1950s house? | Cranford | General | Research (compliance) |
| 11 | Who offers color consultation with painting in Chatham or Madison NJ? | Chatham | Color consult | Discovery |
| 12 | Pressure washing and exterior painting company in Rahway NJ | Rahway | Pressure washing | Discovery |

Platforms to run each prompt on: **ChatGPT** (with search on), **Google AI Mode / AI Overview** (google.com search), **Perplexity**, **Gemini**. That makes 48 checks a month. If time is short, run prompts 1, 2, 3, 5, 8, and 12 on all four platforms.

## How to run the check

1. **Run monthly**, in the same week each month (for example, the first Monday).
2. **Use a logged-out or incognito/private window** for every platform. Do not use an account with past chats about the business. Clear the chat between prompts.
3. **Use the same location every time.** Run from the same network and city (ideally Rahway or a nearby town). If you use a VPN, use the same exit location every month. Note the location in the log.
4. **Paste each prompt exactly as written.** Do not rephrase, and do not ask follow-ups for the logged result.
5. **Record verbatim.** Copy the relevant sentence(s) word for word, and take a screenshot. Record every business named, in order, and every cited URL.
6. **Do not click our own links from these sessions.** It contaminates referral data.
7. Save screenshots to a shared folder named `YYYY-MM/platform-prompt#`.

## What you are measuring (keep these separate)

| Term | What it means | Where it is measured |
|---|---|---|
| **Bot access** | AI crawlers (e.g. GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended, ClaudeBot) are allowed to fetch the site and actually do. This is a prerequisite, not a result. | robots.txt, plus Vercel/server logs filtered by user agent |
| **Mention** | The answer names "Cleanest Painting" in its text, whether or not it links to us. | This manual log ("Business mentioned") |
| **Citation** | The answer links to or footnotes a cleanestpaintingnj.com URL (or our Google Business Profile) as a source. A citation can occur without a mention, and a mention without a citation. | This manual log ("Cited URL") |
| **Referral visit** | A person clicked through from an AI tool to the site. | GA4 → Traffic acquisition → session source (chatgpt.com, perplexity.ai, gemini.google.com, etc.). Google AI Mode/Overviews usually show up as normal Google organic traffic and cannot be separated cleanly. |
| **Lead** | A referral visit that became an estimate request or call. | Leads dashboard (source field) and GA4 key events. Ask "How did you hear about us?" on calls. |

A month with mentions but no referral visits is normal. Do not treat a mention as a lead, and do not report AI "rankings."

## Monthly log template

Copy this table for each month. One row per prompt per platform.

| Date | Platform | Prompt # / prompt | Business mentioned (Y/N) | Cited URL | Competitor names seen | Notes |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | ChatGPT | 1 — Who are good house painters near Rahway, NJ? | | | | Location: ___ ; verbatim: "___" |
| YYYY-MM-DD | Google AI Mode | 1 — Who are good house painters near Rahway, NJ? | | | | |
| YYYY-MM-DD | Perplexity | 1 — Who are good house painters near Rahway, NJ? | | | | |
| YYYY-MM-DD | Gemini | 1 — Who are good house painters near Rahway, NJ? | | | | |

**Notes column guidance:** record the location used, the verbatim sentence about us, whether any facts about us were wrong (wrong phone number, wrong service area, a service we do not offer), and which source the tool appeared to rely on (our site, Google Business Profile, Angi, Yelp, a directory).

## Monthly summary (fill after logging)

- Mentions this month: __ / 48 (last month: __)
- Citations to cleanestpaintingnj.com: __ (which URLs: __)
- Wrong facts seen about us: __ (fix the source page or profile)
- Competitors seen 3+ times: __ (names only. Do not draw conclusions from a single month.)
- GA4 AI referral sessions: __ | Leads with AI source: __
