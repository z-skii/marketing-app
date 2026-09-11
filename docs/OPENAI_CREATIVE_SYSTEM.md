# TapMart OpenAI creative system

GPT-6 Astra is TapMart's creative brain: creative director, product
designer and art director. OpenAI image models render what it directs.
Claude Code owns the repository and implements every screen in real code.
A person approves every asset before it is used.

The code lives in `src/lib/openai/`. One CLI, `npm run creative`, runs all
of it from the terminal. There are no per-feature scripts.

## Model routing

Set in `src/lib/openai/models.ts`, overridable by environment variable.
Nothing else in the codebase names a model.

| role | model | env override |
| --- | --- | --- |
| DESIGN DIRECTOR | `gpt-6-astra` | `OPENAI_DESIGN_DIRECTOR_MODEL` |
| IMAGE FINAL | `gpt-image-2.5-sunburst` | `OPENAI_IMAGE_FINAL_MODEL` |
| IMAGE FAST | `gpt-image-2.5-flare` | `OPENAI_IMAGE_FAST_MODEL` |
| QA REVIEWER | `gpt-5.5` | `OPENAI_QA_MODEL` |

| job | who | reasoning | used for |
| --- | --- | --- | --- |
| ui_system | director | xhigh | defining the whole UI system |
| screen_design | director | high | designing a major screen from scratch |
| screen_review | director | medium | comparing a real screenshot with the director's own design |
| screen_review_final | director | high | the last pass before a screen ships |
| creative_direction | director | high | ad, Story, car, photo and brand concepts and briefs |
| creative_review | director | medium | judging a generated or edited image |
| creative_final_review | director | high | judging the final asset |
| copy | director | medium | headlines and CTA lines |
| minor_qa | qa | low | mechanical screenshot checks after tiny changes |

Image tiers: `fast` (Flare) for concepts, previews and variations; `final`
(Sunburst) for the asset a business will use. The director picks the tier
in its brief; the job decides which tier it is running.

The QA reviewer never makes a creative or design decision. Tiny CSS
changes, one text edit, routine validation and formatting do not go to the
director at all, or go as `minor_qa`.

## Files

| file | what it does |
| --- | --- |
| `src/lib/openai/models.ts` | the router: roles, jobs, efforts, image sizes |
| `src/lib/openai/client.ts` | Responses API (background mode, polled) and Images API (generate, edit); usage per call; never logs the key |
| `src/lib/openai/prompts.ts` | who the director is; loads the product brain, the primary reference and the three campaign images |
| `src/lib/openai/schemas.ts` | the strict JSON shapes the director returns |
| `src/lib/openai/director.ts` | `designSystem`, `designScreen`, `reviewScreen`, `designCreative`, `reviewCreative`, `writeCopy` |
| `src/lib/openai/images.ts` | `generateImage`, `editImage` |
| `src/lib/openai/creative.ts` | the brief, render, review, edit loop; `storyAdConcepts`, `finalizeStoryAd`, `recreateCover`, `carAdPreview`, `photoCreative`, `brandAsset` |
| `src/lib/openai/assets.ts` | the creative asset library (`creative_assets`) |
| `supabase/migrations/0027_creative_assets.sql` | the table |
| `scripts/creative.ts` | the CLI |
| `tests/openai-creative.test.ts` | routing, schemas, usage, report (no network) |

Authentication: `OPENAI_API_KEY` in the environment. In a Claude Code cloud
session the agent proxy attaches the credential and no key is needed.

## Flow 1: a major UI redesign

```
CURRENT SCREEN screenshot (functionality inventory only)
+ docs/TAPMART_PRODUCT_BRAIN.md
+ docs/design-references/tapmart-primary-reference.png
+ the three campaign images (Recreate, Story, Car)
+ purpose, data, actions, requirements, real media on the screen
        |
        v
npm run creative -- design-screen "Business Content" --purpose ... --data ... --actions ... --phone m.png --desktop d.png
        |  Astra (high) designs from scratch
        v
docs/design-specs/business-content.{json,md}
  screen architecture, exact component order, hierarchy, media placement,
  typography, spacing, surfaces (cards versus rows), CTA placement, motion,
  phone layout, desktop layout, what to remove, what must remain
        |
        v
Claude Code implements it in real HTML, React and CSS
        |
        v
Playwright captures REAL screenshots (phone 390x844 at 2x, desktop 1360)
        |
        v
npm run creative -- review-screen m.png "Business Content (phone), pass 1"
        |  Astra (medium) compares the build against ITS OWN saved design
        |  and the reference; twelve drift scores; the same-application question
        v
Claude fixes the gaps; screenshot; pass 2 with --final (Astra high); stop.
```

Concept mockups from an image model are allowed as inspiration or to
communicate a screen idea. They are never the implementation source of
truth: the production UI is code, and only real browser screenshots are
reviewed.

## Flow 2: an Instagram Story ad

```
business name, category, city, description
+ brand kit (logo, colours, type, tone, photo style)
+ existing imagery (logo, product photos, store photos)
+ objective, offer, product, audience
        |
        v
npm run creative -- story-concepts --business <slug> --objective "..." --offer "..." [--source url]
        |  Astra (high) studies the brand, writes 3 distinct concepts:
        |  concept, subject, environment, composition, camera, lighting,
        |  colour, minimal headline and CTA, 9:16, what to preserve, what to
        |  avoid, generate or edit, the exact prompt
        v
for each concept: Flare renders it (edit when real sources exist)
        |
        v
Astra (medium) reviews the ACTUAL image: purpose, brand, professional,
not AI looking, text clean, product correct, premium; approve, edit or regenerate
        |
        v
one fix round for drafts (edit instructions or a revised prompt), then save
each as a DRAFT in creative_assets with brief, review, models, usage
        |
        v
the business sees Draft / Preview and picks one
        |
        v
npm run creative -- story-final --business <slug> --brief <concept.json>
        |  Sunburst renders the chosen concept at high quality;
        |  Astra (high) reviews; up to two fix rounds
        v
DRAFT (stage final) in creative_assets. A person approves or rejects.
Only an approved final asset can enter a campaign or publishing flow.
```

## Flow 3: editing a real photo

```
real product or store photo (+ logo)
+ the objective and placement
        |
        v
npm run creative -- photo-creative --business <slug> --photo <url> --objective "..." --type STORY_AD --aspect 9:16
        |  Astra writes an EDIT brief: preserve the bottle, the label, the
        |  people, the storefront; replace the background; improve lighting;
        |  add a subtle branded environment; leave product geometry untouched
        v
the image edit endpoint changes only what the instructions name
(input fidelity high, the real photo is the base, the logo a reference)
        |
        v
Astra reviews the result against the source photo; edit instructions
region by region if anything drifted; render again
        |
        v
DRAFT in creative_assets, with source_urls pointing at the real photo
```

The same loop backs `recreate-cover` (a cover that says "this is a video
you can get paid to recreate", built from real reference frames),
`car-preview` (the real car photo edited only on the chosen placement
zones; the car's identity, colour and plates untouched) and `brand-asset`
(refine the existing identity after research; never invent a new brand).

## The quality loop

After every render the director looks at the actual pixels and answers:
does it accomplish the purpose, match the brand, look professional, look
obviously AI generated, is the copy clean, is the product correct, does it
meet TapMart's premium bar. The first image is never accepted by habit.
`edit` comes with region by region instructions; `regenerate` comes with a
complete revised prompt. Drafts get one fix round, finals two.

## The asset library

`creative_assets` records, per asset: business, campaign, type (STORY_AD,
RECREATE_COVER, CAR_AD_PREVIEW, SOCIAL_POST, CAMPAIGN_COVER, BRAND_ASSET),
status (draft, approved, rejected), stage (draft, final), url, aspect and
rendered size, director model, image model, prompt, version and round,
parent version, source urls, the brief, the review, usage per call, who
made it and who approved it. Files go through the same media storage as
every upload (`storeMedia("creative", ...)`).

Generation is never approval. Nothing is published by being created.

## Cost control

- Judgment goes to the director; mechanical checks go to `minor_qa`.
- Concepts and previews render on Flare; only the selected final renders
  on Sunburst.
- Fix rounds are budgeted (1 for drafts, 2 for finals) and every call's
  usage is stored on the asset and printed by the CLI.
- `--dry-run` on any command builds the request and sends nothing.
- `--effort` lowers or raises reasoning for one call.
- Cap spend in the OpenAI dashboard. Nothing calls OpenAI automatically;
  a person or Claude runs a command, on purpose.
- Never send production customer data in a screenshot.
