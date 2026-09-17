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
| Command | `scratchpad/v3x/lh.sh`, JSON kept beside it |

The mobile figures are the throttled preset, not a real device. They are
reported as Lighthouse produced them.

## Results, production build

| Surface | Perf | A11y | Best practices | LCP | FCP | Speed index | CLS | TBT | Long tasks | Images | Scripts | Total transfer |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage, desktop | 99 | 98 | 100 | 0.9s | 0.3s | 0.3s | 0 | 0ms | 0 | 176KB / 3 | 200KB | 601KB |
| Public homepage, mobile | 82 | 98 | 100 | 4.7s | 1.4s | 1.4s | 0 | 94ms | 5 | 237KB / 3 | 200KB | 661KB |
| User Home, desktop | 99 | 98 | 100 | 0.9s | 0.3s | 0.3s | 0 | 3ms | 1 | 152KB / 3 | 210KB | 589KB |
| User Home, mobile | 83 | 98 | 100 | 4.6s | 1.4s | 1.4s | 0 | 73ms | 4 | 212KB / 3 | 180KB | 617KB |
| User Profile, desktop | 99 | 98 | 100 | 0.9s | 0.3s | 0.3s | 0 | 0ms | 0 | 205KB / 5 | 223KB | 655KB |
| User Profile, mobile | 91 | 98 | 100 | 3.4s | 1.4s | 1.4s | 0 | 83ms | 4 | 205KB / 5 | 193KB | 623KB |
| Business Home, desktop | 97 | 98 | 100 | 1.2s | 0.3s | 0.3s | 0 | 4ms | 1 | 466KB / 9 | 232KB | 931KB |
| Business Home, mobile | 88 | 98 | 100 | 3.9s | 1.4s | 1.4s | 0 | 80ms | 4 | 400KB / 7 | 192KB | 818KB |
| Business Loyalty, desktop | 99 | 98 | 100 | 0.8s | 0.3s | 0.3s | 0 | 0ms | 0 | 171KB / 1 | 234KB | 651KB |
| Business Loyalty, mobile | 87 | 98 | 100 | 4.0s | 1.4s | 1.4s | 0 | 85ms | 4 | 171KB / 1 | 202KB | 608KB |

## Against the targets

| Target | Result |
| --- | --- |
| Initial mobile route media at or below 350KB | Met on four surfaces: 237KB public homepage, 212KB User Home, 205KB User Profile, 171KB Loyalty. Business Home is 400KB over seven images, because the first viewport shows Maya's portrait, two of her work stills and Eli's vehicle at 2x. |
| LCP at or below 2.5 seconds | Met on every desktop run, 0.8s to 1.2s. Not met on the throttled mobile preset, 3.4s to 4.7s. |
| CLS at or below 0.1 | Met everywhere. CLS is 0 on all ten runs, because every image reserves its intrinsic dimensions before loading. |
| Interaction to next paint at or below 200ms | Total blocking time is 0 to 4ms on desktop and 73 to 94ms on the throttled mobile preset, so the main thread is free for input well inside the budget. Field INP is not measurable in a lab run and is not claimed. |
| No continuous idle animation | Met. Nothing loops; every sequence runs once and rests. Long tasks are 0 to 1 on desktop and 4 to 5 on the throttled mobile preset, all during initial hydration. |
| At most one active video decoder | Met. The V3 surfaces carry no video; every fixture is a still. |

## Where mobile LCP goes

The mobile preset simulates slow 4G with 4x CPU throttling. First
contentful paint is 1.4s on every surface; the gap to LCP is the largest
image arriving over the throttled connection. Business Home is the
heaviest first viewport and the slowest in the earlier run; after the
accessibility pass it measured 3.9s while the public homepage measured
4.7s, so the ordering moves between runs and the differences inside that
range are run to run variance, not a stable ranking.

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
