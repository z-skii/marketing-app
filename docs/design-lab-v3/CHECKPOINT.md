# V3 checkpoint, 2026-09-17: complete, waiting for the founder

Everything the V3 stage was asked for is built, measured, verified by the
design director and packaged. Nothing migrates until the founder approves.

## State of the work

- **The five surfaces** (public homepage, User Home, User Profile,
  Business Home, Business Loyalty) are built in real code under
  `/design-lab-v3` from the director's specs. `FILE_MAP.md` lists every
  route and file.
- **Director loop, closed.** Each surface went through pass 1, fixes,
  recapture, pass 2, fixes, recapture, then the final verification on the
  final captures. All five read READY (`reviews/x-<surface>-final.md`).
  Business Loyalty needed two extra verification rounds: the rebuilt
  counter QR sheet had dropped the required Download demo QR action and
  its desktop pane had collapsed; both were fixed, recaptured and
  verified. No surface is in a fix state.
- **Evidence at stable paths.** `captures/` (13 surfaces at 390 and 1440,
  first viewport and full page), `captures/viewports/` (five surfaces at
  320, 768, 1023 and 1920), `captures/states/` (40 interaction states),
  `recordings/` (30 recordings with a frame strip each: the eleven
  required interactions at phone and desktop, the profile interaction,
  five reduced motion takes, the pause, keyboard and Back take).
  `captures/INDEX.json`: 196 files, every one opened and decoded after
  saving.
- **Measured records.** `TEXT_COUNTS.md` (first viewport and whole page
  counts, per chapter subtotals, media lettering counted per visible
  occurrence), `PERFORMANCE.md` (Lighthouse on the final production
  build: desktop 99 to 100, LCP 0.7s to 0.9s; mobile 83 to 91 on the
  throttled preset, LCP 3.5s to 4.7s, which misses the 2.5s target and is
  reported as missed), `MATERIAL_SYSTEM.md`, `MEDIA_MANIFEST.json`.
- **Gates.** `tsc --noEmit` clean; `eslint src/app/design-lab-v3` no
  errors; `vitest` 140 tests in 11 files passing; `next build` with
  `DESIGN_LAB=1` compiles every route.
- **The package.** `scripts/v3x-report.mjs` writes `V3_PACKAGE.html`
  from `report-items.json`: all 36 items filled, images embedded from
  their stable paths, no temporary path anywhere.

## What the founder decides

Approve or return the V3 lab. Nothing under `/design-lab-v3` touches
production routes, the live database, migrations, Wallet APIs or
notification delivery; `/design-lab` and `/design-lab-v2` are untouched.
Report item 36 lists what a migration would change.

## Useful commands

```
npm run creative -- v3x-review <key> --verify --shot <png> ...   # the verification job
node scripts/v3x-report.mjs                                       # rebuild the package
```

The capture tools (`shots.mjs`, `states.mjs`, `motion.mjs`, `words.mjs`,
`chapters.mjs`, `lh.sh`, `verify-media.mjs`) live in the session
scratchpad; every artefact they produced is in the repository.

## Addendum, 2026-09-18: the visual recomposition, first build, waiting for the founder

After the V3 package the founder approved the product architecture and the
UX simplification and did not approve the visual experience
(`RECOMPOSE_BRIEF.md`). The first build of the recomposition is done for
the four experiences the brief allows, and it stops there.

- **Built.** The public hero, Recreate, Drive and Business to Loyalty are
  rebuilt on the same page as scroll linked film scenes with one shared
  engine (`src/app/design-lab-v3/x/Film.tsx`, `film.css`) and one scene
  each (`x/site/EarnFilm.tsx`, `DriveFilm.tsx`, `LoopFilm.tsx`). Desktop
  pins the stage and scrolls the film; phone steps through the same beats
  with Next, Previous and Play; reduced motion renders the beats as
  stationary blocks. Flows, copy rules, amounts, states and media bindings
  are unchanged.
- **Not built.** User Home, User Profile, Business Home, Business Loyalty
  and everything else. Nothing migrates; `/design-lab` and
  `/design-lab-v2` are untouched.
- **Director loop.** Astra wrote the direction from the founder's brief
  (`recompose/RECOMPOSE_DIRECTION.md`), reviewed each experience twice
  (`recompose/reviews/`), and the fixes from both passes are applied. The
  closing judgement is the comparison against the current V3
  (`recompose/reviews/compare.md`), per the brief's stop point, not a
  third pass.
- **Media.** One generated photograph, the Drive vehicle
  (`public/design-lab/drive-oxblood-wagon-placement.jpg`), approved by the
  director; every round and verdict is in `recompose/assets/`.
- **Evidence.** `recompose/captures/` (desktop beat stills, phone step
  stills, reduced motion), `recompose/recordings/` (eight WebM takes with
  strips and desktop frame timing), `recompose/report.json` and the
  package `recompose/RECOMPOSE_PACKAGE.html` from
  `scripts/v3x-recompose-report.mjs`.
- **Performance.** Production build, Lighthouse twice: desktop 99, LCP 0.8
  to 0.9 s, CLS 0; mobile preset 83 to 85, LCP 4.3 to 4.6 s, CLS 0.
  Mobile first load media is 425KB over seven images, above the 350KB
  target; the addendum in `PERFORMANCE.md` has the table.
- **Gates.** `tsc --noEmit` clean; `eslint src/app/design-lab-v3` no
  errors; `vitest` passing; `next build` with `DESIGN_LAB=1` compiles.

The founder decides whether this is the visual direction. The director's
commands for this stage: `npm run creative -- v3x-recompose`,
`recompose-assets`, `v3x-recompose-review <key> --shot ...` and
`v3x-compare --before ... --after ...`.
