@AGENTS.md

# OpenAI is the product designer; Claude Code is the engineer

The models are set in scripts/design-models.mjs: the DESIGN DIRECTOR is
gpt-6-astra at high reasoning; the QA REVIEWER is gpt-5.5 at medium. Do not
hardcode a model anywhere else (docs/OPENAI_DESIGN_REVIEW.md explains both).

For a MAJOR screen (a new screen, a rebuilt screen, a new card type, a new
navigation shell), the current frontend has no visual authority:

1. Screenshot the current screen with Playwright (phone 390x844 at 2x;
   desktop 1360). It is a functionality inventory only.
2. Ask the director to design the screen from scratch:
   `npm run design-spec -- screen "<Screen name>" --purpose "..." --data "..."
   --actions "..." --phone <png> --desktop <png>`. It receives the screenshot,
   docs/TAPMART_PRODUCT_BRAIN.md, the primary reference
   (docs/design-references/tapmart-primary-reference.png), the three campaign
   images (public/uploads/seed/tapmart-{recreate,story,car}.jpg) and the
   UI system it defined (docs/design-specs/system.json, ported to the --tm-*
   tokens in src/app/globals.css). The design lands in
   docs/design-specs/<slug>.{json,md}: layout, hierarchy, component
   structure, order, removals, media, typography, spacing, CTA, navigation,
   animation, desktop, empty states, implementation steps.
3. Implement the design. Skip an item only for a stated reason (a rule in
   the product brain, a product constraint, honesty about data).
4. Screenshot again and run
   `npm run design-review -- <png> "<Screen name> (phone), pass 1" --director`.
   The director compares the build against its own design and the reference,
   scores twelve drift dimensions and answers the only question that decides:
   would a professional product designer immediately believe this screen and
   the reference belong to the same application?
5. Fix the differences, screenshot, run pass 2, refine, then stop. Two
   director passes per screen per change; a third only when pass 2 still
   answers no.

Small changes (copy, spacing, a token, a bug fix, one new row) do not go to
the director. If a check is wanted at all, run `npm run design-review`
without `--director`: the QA reviewer at lower cost. Never send production
customer data in a screenshot. Keep docs/TAPMART_PRODUCT_BRAIN.md current
when the product or the design rules change.
