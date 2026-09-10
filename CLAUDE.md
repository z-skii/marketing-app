@AGENTS.md

# Design review loop (OpenAI as design director)

Claude Code builds; OpenAI reviews. For a MAJOR UI change (a new screen, a
rebuilt screen, a new card type, a new navigation shell):

1. Build the first pass.
2. Screenshot it with Playwright (phone 390x844 at 2x; desktop 1360 when the
   screen has a rail layout).
3. Run `npm run design-review -- <screenshot> "<Screen name>"` and read the
   checklist (see docs/OPENAI_DESIGN_REVIEW.md).
4. Apply the checklist top to bottom. Skip an item only for a stated reason
   (a rule in docs/TAPMART_PRODUCT_BRAIN.md, a product constraint, honesty
   about data).
5. Screenshot again.
6. Run a second review.
7. Refine from the second checklist, then stop.

Do not call the reviewer after small changes (copy, spacing, a token, a bug
fix, one new row). Two reviews per screen per change is the budget; a third
only when the second still scores TapMart match below 7. Never send
production customer data in a screenshot. The reviewer judges against
docs/TAPMART_PRODUCT_BRAIN.md; keep that file current when the product or
the design rules change.
