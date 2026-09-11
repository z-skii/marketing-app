@AGENTS.md

# OpenAI is the creative brain; Claude Code is the engineer

GPT-6 Astra is TapMart's creative director, product designer and art
director. It designs screens, directs creatives, reviews real screenshots
and generated images, and gives final creative approval. Image models
(Sunburst for finals, Flare for concepts) render what it directs. Claude
Code owns the repository and implements every screen in real code. A person
approves every asset. Models and efforts are set only in
src/lib/openai/models.ts; docs/OPENAI_CREATIVE_SYSTEM.md is the reference.
Everything runs through one CLI: `npm run creative`.

For a MAJOR screen (a new screen, a rebuilt screen, a new card type, a new
navigation shell), the current frontend has no visual authority:

1. Screenshot the current screen with Playwright (phone 390x844 at 2x;
   desktop 1360). It is a functionality inventory only.
2. Ask the director to design the screen from scratch:
   `npm run creative -- design-screen "<Screen name>" --purpose "..." --data "..."
   --actions "..." --phone <png> --desktop <png>`. It receives the screenshot,
   docs/TAPMART_PRODUCT_BRAIN.md, the primary reference
   (docs/design-references/tapmart-primary-reference.png), the three campaign
   images (public/uploads/seed/tapmart-{recreate,story,car}.jpg) and the
   UI system it defined (docs/design-specs/system.json, ported to the --tm-*
   tokens in src/app/globals.css). The design lands in
   docs/design-specs/<slug>.{json,md}: architecture, component order,
   hierarchy, media placement, typography, spacing, surfaces, CTA placement,
   motion, phone and desktop layouts, what to remove, what must remain.
3. Implement the design. Skip an item only for a stated reason (a rule in
   the product brain, a product constraint, honesty about data).
4. Screenshot again and run
   `npm run creative -- review-screen <png> "<Screen name> (phone), pass 1"`.
   The director compares the build against its own design and the reference,
   scores twelve drift dimensions and answers the only question that decides:
   would a professional product designer immediately believe this screen and
   the reference belong to the same application?
5. Fix the differences, screenshot, run pass 2 with `--final`, refine, then
   stop. Two director passes per screen per change; a third only when pass 2
   still answers no.

Small changes (copy, spacing, a token, a bug fix, one new row) do not go to
the director. If a check is wanted at all, add `--minor`: the cheap QA
reviewer at low effort, for mechanical checks only. Never send production
customer data in a screenshot. Keep docs/TAPMART_PRODUCT_BRAIN.md current
when the product or the design rules change.

Creatives (Story ads, Recreate covers, car ad previews, photo creatives,
brand assets) run the same way through `npm run creative -- story-concepts`,
`story-final`, `photo-creative`, `car-preview`, `recreate-cover` and
`brand-asset`: the director writes the brief, an image model renders it,
the director reviews the actual image and edits or regenerates, and the
result is saved as a draft in creative_assets. Generation is never
approval; nothing is published by being created.
