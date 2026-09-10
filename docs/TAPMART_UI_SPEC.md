# TapMart UI specification

The visual source of truth is the coded blueprint
`docs/design-references/tapmart_exact_ui_blueprint.html`. Its `:root`
variables and component rules are ported verbatim into `--tm-*` custom
properties in `src/app/globals.css`; the Tailwind theme only maps utility
names onto them, and the shared primitives in `src/components/v2/ui.tsx`
(`Money`, `Avatar`, `SurfaceRow`, `ScreenHeader`, `Chip`) plus the classes
`.card`, `.row`, `.vehicle-card`, `.car-stage`, `.rotate-hint`, `.btn`,
`.btn-signal`, `.pill`, `.glass-tag`, `.eyebrow`, `.tm-bottomnav`,
`.iconbtn`, `.status-text`, `.status-dot`, `.media-scrim`, `.hero-media`
carry the composition. The saved PNG is the second reference and
`docs/TAPMART_PRODUCT_BRAIN.md` the third. Content changes by screen; the
system does not.

## Colour (blueprint :root)

| Token | Value | Blueprint name |
| --- | --- | --- |
| `--tm-bg` | `#090c0e` (body: radial lime glow at the top over `#0a0d0f` to `#080b0d`) | `--bg` |
| `--tm-bg2` | `#0d1113` | `--bg2` |
| `--tm-surface` | `#121719` | `--surface` |
| `--tm-surface2` | `#171d20` | `--surface2` |
| `--tm-surface3` | `#1b2225` | `--surface3` |
| `--tm-line` | `rgba(255,255,255,.08)` | `--line` |
| `--tm-line2` | `rgba(255,255,255,.12)` | `--line2` |
| `--tm-text` | `#f5f7f2` | `--text` |
| `--tm-muted` | `#9ca4a7` | `--muted` |
| `--tm-muted2` | `#6f787c` | `--muted2` |
| `--tm-meta` | `#c3c9c6` | `.meta` |
| `--tm-lime` | `#c9ff38` | `--lime` |
| `--tm-success` | `#9ded62` | `--success` |
| `--tm-nav-inactive` | `#8f989c` | `.bottomnav button` |

## Radius

| Element | Radius |
| --- | --- |
| Hero cards (`.card`) | 20px |
| Vehicle card | 18px |
| Rows (`.row`) | 16px |
| Primary button | 16px |
| Icon buttons, inputs | 12px |
| Row thumbnails | 13px |
| Floating bottom nav | 22px |
| Chips, pills, status | full |

## Dimensions and spacing

| Measure | Value |
| --- | --- |
| Top bar (`.phone-top`) | 58px, padding 0 18px, 1px bottom hairline at 4% |
| Bottom nav (`.bottomnav`) | floating, 10px inset, 68px tall, 22px radius, blur 22px, `rgba(20,26,28,.82)`, 9% hairline |
| Content padding | 18px 16px 96px |
| Section title | 12px, uppercase, 0.16em, muted, margin 24px 2px 10px |
| Hero card media | 260px (small variant 215px), filter saturate .92 contrast 1.02 brightness .9 |
| Hero copy inset | 16px sides, 15px bottom |
| Row | padding 12px 13px, gap 12px, 9px between rows, 54px thumb |
| Primary button | 52px, lime gradient `#d6ff59` to `#bfff2c`, weight 800, glow `0 10px 28px rgba(201,255,56,.16)` |
| Icon button | 38px, 12px radius, hairline, 3.5% white fill |
| Profile head | 92px avatar with a 2px lime ring at 45%, grid 92px 1fr, gap 16px |
| Vehicle stage | 160px |
| Chip | padding 8px 12px, 12px text; active solid lime with `#0b0f10` text, weight 750 |

## Typography (Inter, variable weights)

| Role | Size / weight |
| --- | --- |
| Brand (desktop rail) | 24px / 800, -1px |
| Phone title | 16px / 750, -0.4px |
| Profile name, screen title | 23px / 800, -0.8px |
| Hero card title | 20px / 760, -0.6px |
| Hero money | 27px / 850, -1.2px, lime |
| Earnings balance | 46px / 850, -2px |
| Stat value | 18px / 780; label 10px muted |
| Row title | 14px / 700; row sub 12px muted; row money 17px / 800 lime |
| Meta on media | 13px `#c3c9c6` |
| Status | 10px success with a 6px glowing dot |
| Nav label | 10px |
| Type pill | 10px uppercase 0.11em |

## Lime

The primary button, the active chip, the active tab, money, the verified
mark, the brand dot. Status uses `--tm-success`, not lime.
