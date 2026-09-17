# V3 checkpoint, 2026-09-17

Written when the session switched to a lower cost model with instructions
to continue only mechanical work: finish captures, preserve media into
stable repository folders, run the gates, fix paths, prepare report
infrastructure, and apply already approved explicit fixes. No new visual
direction was decided, no primary surface was redesigned, and no design
approval was given.

## State of the work

### Done and verified

**The five surfaces are built** in real code under `/design-lab-v3` from
the director's specs (`screens/x-*.md`), with the approved Loyalty
foundation intact. `FILE_MAP.md` lists every route and file.

**Media is preserved at stable repository paths.** The founder's request
to stop referencing temporary paths is satisfied:

| Folder | Contents |
| --- | --- |
| `docs/design-lab-v3/captures` | The five primary surfaces plus the public business lens and eight Loyalty routes, at 390 and 1440, first viewport and full page |
| `docs/design-lab-v3/captures/viewports` | All five surfaces at 320x568, 768x1024, 1023x900 and 1920x1080 |
| `docs/design-lab-v3/captures/states` | 38 interaction states: every sequence frame, every opened task, both composers, the filter, share and settings sheets |
| `docs/design-lab-v3/recordings` | 28 recordings as `.webm` with a frame strip beside each: the eleven required interactions at phone and desktop, five reduced motion takes and one pause, keyboard and browser Back take |
| `docs/design-lab-v3/captures/INDEX.json` | Every file above, opened and fully decoded after saving. 189 files, 0 unreadable, 149MB |

Nothing in the package references a scratchpad or temporary path.

**Measured evidence is written down**, each as a record of what was
measured rather than a target:

- `TEXT_COUNTS.md`: visible word counts per surface and viewport against
  every budget, whole page counts, and lettering inside media.
- `PERFORMANCE.md`: Lighthouse against the production build on a named
  setup. Desktop 97 to 99 performance, LCP 0.8s to 1.2s. Mobile 82 to 91
  on the throttled preset, LCP 3.4s to 4.7s, which misses the 2.5s
  target and is reported as missed. CLS is 0 everywhere. Accessibility is
  98 on all ten runs.
- `MATERIAL_SYSTEM.md`: the implemented layers, lens recipes, fallbacks,
  tokens, typography, motion curves and pause behaviour, transcribed from
  `x/x.css`.
- `MEDIA_MANIFEST.json`: every image with its owner, its bound record,
  its crop and where it is used, plus what was deliberately not used.

**Gates pass.** `tsc --noEmit` clean; `eslint src/app/design-lab-v3` has
no errors; `vitest` 140 tests in 11 files passing; `next build` with
`DESIGN_LAB=1` compiles and every `/design-lab-v3` route builds.

**Report infrastructure is ready.** `scripts/v3x-report.mjs` reads
`docs/design-lab-v3/report-items.json` and writes
`docs/design-lab-v3/V3_PACKAGE.html`: a single self contained page, all 36
items, images embedded from their stable paths, 6.2MB, inside the artifact
ceiling. It was rendered in a browser to confirm all 122 embedded images
decode. Re-run it after filling in the pending items.

### Mechanical fixes applied in this pass

These were code correctness and accessibility, not design:

1. Six React compiler lint errors: refs accessed during render in
   `x/Open.tsx` and `x/motion.tsx`, a component created during render in
   `x/business/Discovery.tsx`, and two effects setting state
   synchronously in `x/profile/Profile.tsx` and `x/site/Earn.tsx`.
2. The phone utility icons had no accessible name. A V3 `Utilities`
   component in `x/Nav.tsx` adds screen reader only names for Search,
   Messages and Notifications, with no visual change and without
   modifying any V2 file.
3. One media button's accessible name did not contain its visible
   caption, which Lighthouse flagged. The name now carries the caption.

After these, V3 owned accessibility audits all pass. The only remaining
accessibility point is `skip-link` in `src/app/layout.tsx`, which is
production code and was deliberately left alone.

Surfaces were recaptured after every code change, so the stable captures
match the current build.

## What is left, and it needs the design director

**Nothing below was started, because all of it requires creative
judgement.** The six report items still marked pending correspond to it.

1. **Astra review pass 1** on each of the five surfaces:
   `npm run creative -- v3x-review <key> --shot <png> [--shot <png>] --pass 1`
   with keys `public-home`, `user-home`, `user-profile`, `business-home`,
   `business-loyalty`. Each `--shot` needs its own flag; passing several
   files after one flag silently uses only the first.
2. **Fix what pass 1 raises**, then **pass 2** with `--pass 2`.
3. **Fix what pass 2 raises, recapture, then the final verification**
   with `--verify` on the final state, until all five read READY. The
   founder's rule stands: the final review happens after the final fixes,
   and the package never ends with "fixes were applied after review".
4. **Write the six director items** into `report-items.json`: the V3
   thesis (2), where Loyalty lives and why (27), the settings
   architecture (28), the three wow moments (31), the final verdicts
   (34), and what would change on a production migration (36).
5. **Rebuild the package** with `node scripts/v3x-report.mjs`, publish it,
   and stop for the founder's approval. Do not migrate anything.

## Useful commands

```
# dev server (port 3100) and production server (port 3200) are running
npm run creative -- v3x-review public-home --shot docs/design-lab-v3/captures/public-home-m-full.png --shot docs/design-lab-v3/captures/public-home-d-full.png --pass 1

# captures, from the repository root, writing straight into the stable folder
node <scratchpad>/v3x/shots.mjs docs/design-lab-v3/captures http://localhost:3100 m,d "public-home|/design-lab-v3"

# recordings
<scratchpad>/v3x/rec/run.sh

# verify every saved file is readable and refresh the index
node <scratchpad>/v3x/verify-media.mjs

# rebuild the package
node scripts/v3x-report.mjs
```

The capture and recording tools live in the session scratchpad at
`v3x/`: `shots.mjs`, `motion.mjs`, `states.mjs`, `words.mjs`, `lh.sh`,
`verify-media.mjs`, `derive.mjs` and the recording scripts under `rec/`.
If the scratchpad is gone, they can be rewritten; every artefact they
produced is already in the repository.

## Standing constraints, unchanged

Branch `claude/install-design-dev-skills-u6bo6j` only. No production
route, file, migration, Wallet API or notification delivery. `/design-lab`
and `/design-lab-v2` untouched. No fake data or metrics; fixtures stay
explicitly fictional. No em or en dashes in visible strings, code or docs.
No model identifiers in anything committed. Nothing migrates without the
founder's approval.
