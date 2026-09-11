# OpenAI design review

Superseded by docs/OPENAI_CREATIVE_SYSTEM.md, which describes the whole
creative system: GPT-6 Astra as design director, the image models it
directs, the asset library, and the flows for a UI redesign, a Story ad and
a photo edit.

Screen reviews now run through the same CLI as everything else:

```
npm run creative -- review-screen ./screenshots/m-content.png "Business Content (phone), pass 1"
npm run creative -- review-screen ./screenshots/m-content.png "Business Content (phone), pass 2" --final
npm run creative -- review-screen ./screenshots/m-content.png "Content" --minor      # cheap mechanical QA
npm run creative -- review-screen ./screenshots/m-content.png "Content" --dry-run
```

The director compares the real screenshot with its own saved design for
that screen (docs/design-specs/<slug>.json, derived from the screen name or
given with `--spec`) and with the primary reference, scores twelve drift
dimensions, and answers the only question that decides: would a
professional product designer immediately believe this screen and the
reference belong to the same application? Reviews are saved under
`design-reviews/` (ignored by git).
