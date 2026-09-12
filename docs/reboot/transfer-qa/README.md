# Transfer QA

Design QA reviews of real production captures against the approved Design
Lab, produced by `npm run creative -- review-screen <png> "<name>" --transfer <lab png> --final`.
Each stage of the Frame Shift migration keeps its reviews here: `pass1` is
the first build, `pass2` the recapture after the pass 1 items were fixed.
Captures themselves are not committed (screenshots/ is ignored); they are
regenerated from the local dev server with a seeded demo account.
