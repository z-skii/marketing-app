# OpenAI design review

Claude Code builds TapMart. OpenAI acts as the visual and product design
director: it looks at a screenshot, compares it with the product brain, and
returns a prioritized list of exact changes. It never writes code and never
redesigns from scratch.

## Same UI kit

The reference image is the UI kit, not inspiration. Every review scores ten kit dimensions from 0 to 10 (typography, surfaces and material, spacing, navigation, buttons, cards and rows, accent colour, media treatment, visual density, family resemblance) and states whether the screen is built from the same kit. The measured kit values are in docs/TAPMART_UI_SPEC.md. A screen is not done while the reviewer still answers no.

## How it works

`scripts/design-review.mjs` sends one request to OpenAI's Responses API
(background mode, polled) with:

1. the CURRENT screen screenshot (base64, `detail: high`),
2. `docs/TAPMART_PRODUCT_BRAIN.md` as the system prompt (product structure and
   the design rules),
3. the PRIMARY reference image, `docs/design-references/tapmart-primary-reference.png`,
   labelled as the visual north star (quality, design language and polish
   target, never a template to copy),
4. the screen name and any extra instructions.

The reviewer is a design director, not a linter: it may recommend deleting
sections, moving information, doubling media, replacing cards with rows,
media rails, full-bleed visuals and recomposition. Claude stays the
engineer; OpenAI never touches files.

It asks for a strict JSON answer with a verdict, a three-second read,
TapMart-match, reference-match, premium-feel and generic-AI-look scores,
twelve rule scores (clutter, text amount, media size, hierarchy, spacing,
card overuse, money visibility, CTA visibility, lime restraint, quiet
secondary text, typography, navigation and glass), things to keep,
animation suggestions, and a numbered checklist where every item is one
concrete change. The tool prints
the review as Markdown and saves `.md` and `.json` copies under
`design-reviews/` (ignored by git).

## Two roles, two models (scripts/design-models.mjs)

- DESIGN DIRECTOR: `gpt-6-astra`, reasoning `high`. Override with
  `OPENAI_DESIGN_MODEL` / `OPENAI_DESIGN_EFFORT` or `--model` / `--effort`.
  It designs each major screen from scratch (`npm run design-spec`) from the
  current screenshot (functionality inventory only), the product brain, the
  primary reference image, the three campaign images and the screen's
  purpose, data and actions; it returns layout, hierarchy, component
  structure, typography, spacing, media, CTA, navigation, animation,
  responsive behaviour, removals and implementation steps, saved to
  `docs/design-specs/<slug>.{json,md}`. Claude Code implements. After the
  build, `npm run design-review -- <png> "<Screen>" --director` sends the
  same director its own saved design for that screen plus the reference and
  asks it to compare the implementation against both. The director has
  authority over the visual design; Claude owns the code.
- QA REVIEWER: `gpt-5.5`, reasoning `medium` (override with
  `OPENAI_REVIEW_MODEL` / `OPENAI_REVIEW_EFFORT`). `npm run design-review`
  without `--director` is the cheap screenshot check for small changes.
  Use `--effort low` or `--model gpt-5.4-mini` to batch it cheaper still.

Never use the director only to score screenshots; that is what the QA
reviewer is for.

## Run it by hand

```
npm run design-review -- ./screenshots/business-home.png "Business Home"
npm run design-review -- ./screenshots/business-home.png "Business Home" "focus on the people cards, ignore the cars rail"
npm run design-review -- ./screenshots/content.png "Business Content (phone), pass 1" --director
npm run design-review -- ./screenshots/content.png "Content" --director --spec business-content
npm run design-spec -- screen "Business Content" --purpose "..." --data "..." --actions "..." --phone ./screenshots/m-content.png --desktop ./screenshots/d-content.png
npm run design-review -- ./screenshots/content.png "Content" --dry-run
npm run design-review -- ./screenshots/content.png "Content" --reference docs/design-references/other.png
npm run design-review -- ./screenshots/content.png "Content" --no-reference
```

Screenshots: PNG, JPG or WebP, under 18 MB. Phone captures at 390 wide (2x
scale) and desktop captures at 1360 wide both work. A full-page phone capture
paints the fixed bottom bar mid-page; the prompt tells the reviewer that is a
capture artifact.

### Where the key comes from

- **Claude Code cloud sessions**: nothing to configure. The OpenAI key is an
  API credential on the cloud environment; the agent proxy attaches it to
  requests to `api.openai.com`. The key never appears in the session, in the
  repository, or in this tool's output. The npm script sets
  `NODE_USE_ENV_PROXY=1` so Node's fetch goes through that proxy.
- **Your Mac**: put `OPENAI_API_KEY=...` in `.env.local` (ignored by git) and
  run `set -a; source .env.local; set +a` once in the Terminal before
  `npm run design-review`, or export the variable in your shell profile.
  The script sends the key only as the Authorization header to
  api.openai.com.

## How Claude uses it

The rule lives in `CLAUDE.md`. For a major UI change:

1. Build the first pass.
2. Screenshot it (phone 390 and, when it matters, desktop 1360).
3. Run the review with the screen name.
4. Read the checklist and apply it top to bottom; skip an item only with a
   stated reason (a rule in the brain, a product constraint, honesty).
5. Screenshot again and run a second review.
6. Refine from the second checklist, then stop. Two reviews per screen per
   change is the normal budget; a third only when the second still reports a
   TapMart match under 7.

Not every change is major. A copy fix, a spacing tweak, a color token change,
a bug fix or a new row on an existing screen does not go to the reviewer.
Major means a new screen, a rebuilt screen, a new card type, or a new
navigation shell.

## What gets sent to OpenAI

- The screenshot you pass in. Screenshots of a signed-in app can contain
  names, handles, business names and money figures from the development
  database; do not send production customer data.
- The full text of `docs/TAPMART_PRODUCT_BRAIN.md`.
- The reference image in `docs/design-references/`.
- The screen name and instructions.

Nothing else: no source code, no repository files, no environment variables.
Responses come back as JSON and are saved locally only.

## Cost and usage control

- One request per run, one image, roughly 2,000 text tokens of prompt plus
  the image. Output is a few hundred to a couple of thousand tokens.
- The tool prints prompt and completion token counts after every run; the
  `.json` copy stores them.
- Use `--effort low` for a quick pass, `--effort high` only for a flagship
  screen. Use `--model gpt-5.4-mini` (or another smaller vision model) to
  batch cheap passes.
- `--dry-run` builds the request and sends nothing.
- Cap spend in the OpenAI dashboard (Settings, Limits) so a runaway loop
  cannot cost more than you set. The reviewer is never called automatically
  by a hook or a cron; only a person or Claude runs it, on purpose, at most
  twice per screen per change.

## Files

- `scripts/design-review.mjs`: the tool.
- `docs/TAPMART_PRODUCT_BRAIN.md`: what the reviewer judges against. Update
  it when the product structure or the design rules change.
- `design-reviews/`: saved reviews (local, ignored by git).
- `screenshots/`: what you send (local, ignored by git).
