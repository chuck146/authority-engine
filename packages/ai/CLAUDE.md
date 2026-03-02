# AI Services — Authority Engine

## Overview
Wraps all AI providers behind a unified service layer. Three engines:
1. **Text (Claude API)** — Content generation, SEO analysis, sentiment analysis
2. **Images (Nano Banana 2)** — Static graphics, thumbnails, hero images
3. **Video (Remotion + Veo 3.1)** — See @docs/video-guidelines.md for full decision logic

## Claude API (Text Generation)
- Model: `claude-sonnet-4-5-20250929` for content generation (cost-effective)
- Model: `claude-opus-4-6` only for complex analysis requiring deeper reasoning
- All prompts use structured templates stored in `prompts/` directory
- Brand voice configuration injected per-organization
- Temperature: 0.7 creative, 0.3 SEO/analysis, 0.1 data extraction

## Nano Banana 2 (Image Generation)
- Model: `gemini-3.1-flash-image` via Gemini API
- Default: 1024x1024 social, 1920x1080 blog headers
- Always include brand colors in prompt
- Store to Supabase Storage under `org_id/images/`

## Remotion (Programmatic Video)
- Compositions in `services/video/compositions/`
- Always use `<Img />` — never raw `<img>` tags
- See @docs/video-guidelines.md for rules

## Veo 3.1 (Cinematic Video)
- Default to Fast: `veo-3.1-fast-generate-preview`
- Standard only for hero/ad content
- Prompt format: Visual description + Audio description

## Prompt Templates
```
packages/ai/prompts/
├── content/
│   ├── blog-post.ts
│   ├── service-page.ts
│   ├── location-page.ts
│   ├── social-post.ts
│   └── gbp-post.ts
├── seo/
│   ├── page-analysis.ts
│   └── keyword-suggestions.ts
├── reviews/
│   ├── response-generator.ts
│   └── sentiment-analyzer.ts
└── images/
    ├── social-graphic.ts
    ├── blog-thumbnail.ts
    ├── location-hero.ts
    └── ad-creative.ts
```

## Key Rule
All AI content enters "review" status. Nothing auto-publishes. User must approve.
