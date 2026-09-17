# TapMart V3 measured performance

These are measurements, not targets. Every number below came from
Lighthouse runs against the V3 routes; the targets are stated beside them
so the gap is visible where one exists.

## Test setup

| | |
| --- | --- |
| Build | `next build` with `DESIGN_LAB=1`, served by `next start` on port 3200 (Next.js 16.3.2, React 19.2.8) |
| Browser | HeadlessChrome 141.0.0.0 on Linux x86_64 |
| Host | The session's Linux container. Lighthouse benchmarkIndex 1689.5, which is a mid range machine by Lighthouse's own scale |
| Mobile run | Lighthouse `mobile` preset: simulated slow 4G and 4x CPU throttling |
| Desktop run | Lighthouse `--preset=desktop`: no CPU throttle, broadband |
| Date | 2026-09-17 |
| Command | the session's `lh.sh`, run against the final build after the director's READY verdicts; JSON kept beside it |

The mobile figures are the throttled preset, not a real device. They are
reported as Lighthouse produced them.

## Results, production build

| Surface | Perf | A11y | Best practices | LCP | FCP | Speed index | CLS | TBT | Long tasks | Images | Scripts | Total transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage, desktop | 100 | 98 | 100 | 0.7 s | 0.3 s | 0.3 s | 0 | 0 ms | 0 | 176KB / 3 | 200KB | 603KB |
| Public homepage, mobile | 83 | 98 | 100 | 4.7 s | 1.4 s | 1.4 s | 0 | 40 ms | 2 | 237KB / 3 | 200KB | 663KB |
| User Home, desktop | 99 | 98 | 100 | 0.8 s | 0.3 s | 0.3 s | 0 | 0 ms | 0 | 152KB / 3 | 210KB | 591KB |
| User Home, mobile | 86 | 98 | 100 | 4.2 s | 1.2 s | 1.2 s | 0 | 40 ms | 2 | 212KB / 3 | 181KB | 617KB |
| User Profile, desktop | 99 | 98 | 100 | 0.9 s | 0.3 s | 0.3 s | 0 | 0 ms | 0 | 205KB / 5 | 223KB | 656KB |
| User Profile, mobile | 91 | 98 | 100 | 3.5 s | 1.4 s | 1.4 s | 0 | 50 ms | 3 | 205KB / 5 | 193KB | 624KB |
| Business Home, desktop | 99 | 98 | 100 | 0.9 s | 0.3 s | 0.3 s | 0 | 0 ms | 0 | 466KB / 9 | 232KB | 933KB |
| Business Home, mobile | 88 | 98 | 100 | 3.9 s | 1.4 s | 1.4 s | 0 | 40 ms | 3 | 400KB / 7 | 193KB | 819KB |
| Business Loyalty, desktop | 100 | 98 | 100 | 0.8 s | 0.3 s | 0.3 s | 0 | 0 ms | 0 | 171KB / 1 | 234KB | 651KB |
| Business Loyalty, mobile | 87 | 98 | 100 | 4.0 s | 1.4 s | 1.4 s | 0 | 40 ms | 3 | 171KB / 1 | 202KB | 608KB |

## Against the targets

| Target | Result |
| --- | --- |
| Initial mobile route media at or below 350KB | Met on four surfaces: 237KB public homepage, 212KB User Home, 205KB User Profile, 171KB Loyalty. Business Home is 400KB over seven images, because the first viewport shows Maya's portrait, two of her work stills and Eli's vehicle at 2x. |
| LCP at or below 2.5 seconds | Met on every desktop run, 0.7s to 0.9s. Not met on the throttled mobile preset, 3.5s to 4.7s. |
| CLS at or below 0.1 | Met everywhere. CLS is 0 on all ten runs, because every image reserves its intrinsic dimensions before loading. |
| Interaction to next paint at or below 200ms | Total blocking time is 0ms on desktop and 40 to 50ms on the throttled mobile preset, so the main thread is free for input well inside the budget. Field INP is not measurable in a lab run and is not claimed. |
| No continuous idle animation | Met. Nothing loops; every sequence runs once and rests. Long tasks are 0 on desktop and 2 to 3 on the throttled mobile preset, all during initial hydration. |
| At most one active video decoder | Met. The V3 surfaces carry no video; every fixture is a still. |

## Where mobile LCP goes

The mobile preset simulates slow 4G with 4x CPU throttling. First
contentful paint is 1.2s to 1.4s on every surface; the gap to LCP is the
largest image arriving over the throttled connection (the hero reference,
Maya's portrait, the program artwork). The mobile LCP target of 2.5s is
not met on any of the five surfaces in this run and the package does not
claim it. The ordering between surfaces moves between runs (the public
homepage measured 4.5s and 4.7s in two consecutive runs of the same
build), so differences inside the 3.5s to 4.7s range are run to run
variance, not a stable ranking. What would close the gap is recorded in
report item 36: smaller first viewport derivatives and a priority hint on
the LCP image.

## Earlier development server run, for contrast

The same pages measured on `next dev` scored 51 to 67 on mobile with 8.3s
to 9.6s LCP and 1.2 to 1.5MB total transfer. That is the unminified dev
bundle with on demand compilation; it is recorded here only so the two
sets of numbers are not confused. The production table above is the one
that counts.

## Accessibility

98 on every surface. The two missing points are one audit,
`skip-link`, which fails because the application's root layout at
`src/app/layout.tsx` renders a skip link that is not focusable. That file
is production code and outside this lab's scope, so it was left alone and
is recorded here instead.

Three accessibility failures inside the V3 lab were found and fixed
during this pass: the phone utility icons had no accessible name, and one
media button's accessible name did not contain its visible caption. After
the fix all V3 owned accessibility audits pass.

## Gates

| Gate | Result |
| --- | --- |
| `tsc --noEmit` | passes |
| `eslint src/app/design-lab-v3` | no errors. The remaining warnings are `@next/next/no-img-element` on fixture imagery, which the Lab renders as plain `img` on purpose, exactly as the V2 Lab does |
| `vitest run` | 140 tests in 11 files, all passing |
| `next build` with `DESIGN_LAB=1` | compiles; every `/design-lab-v3` route builds |
