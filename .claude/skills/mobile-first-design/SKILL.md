---
name: mobile-first-design
description: Audit or build a site mobile-first. Measures a running page on phone viewports (overflow, tap targets, text size, images, fixed chrome, thumb reach, orientation, weight) with a bundled Playwright script, then grades findings against a sourced checklist (MDN, WCAG 2.5.8, web.dev Learn Responsive Design, Front-End Checklist). Use when asked to "audit mobile", "check responsive", "mobile-first review", "does this work on phones", or before shipping any screen that people will open on a phone.
---

# Mobile-first design

Mobile-first means the phone layout is the default and wider screens are the enhancement:
styles start with no media query, `min-width` queries add columns as room appears, content
is ordered for a single column, and every control is sized for a finger before a pointer.

This skill has two parts. `references/checklist.md` is the rulebook: 34 numbered checks
with the source each one comes from. `scripts/audit.mjs` measures a running site so the
checks are answered with numbers rather than impressions.

## Auditing a site

1. Make sure the site is running (a dev server is fine). If screens need a session, have a
   sign-in email and password ready; the script uses the site's own sign-in form.
2. Run the measurement script from the repo root:

   ```bash
   node .claude/skills/mobile-first-design/scripts/audit.mjs \
     --base http://localhost:3000 \
     --out ./audit-out \
     --email user@example.com --password secret \
     /home /activity /me
   ```

   Options: `--widths 320,360,390,430` (default), `--landscape` adds an 844 by 390 pass,
   `--chrome /path/to/chrome` if Playwright cannot find a browser, `--no-login` for public
   pages. It writes one JSON per route and viewport plus `summary.md` in `--out`.
3. Read `references/checklist.md` in full, then walk the summary against it. The script
   maps each measurement to a checklist ID (for example `T2` for tap targets under 24 px).
4. Report findings grouped by checklist section, most severe first. For each: the checklist
   ID, what was measured (with the number), where it comes from (file or selector), the
   rule quoted from the checklist, and the fix. Close with what already passes, so nobody
   "fixes" it.

Severity rubric:

- **High**: content unreachable or unreadable on a phone. Horizontal overflow, zoom
  disabled, tap targets under 24 px, body text under 14 px, forms that zoom on focus, fixed
  chrome eating more than a third of the viewport, landscape that breaks.
- **Medium**: measurable friction. Targets between 24 and 44 px, text between 14 and 16 px,
  images shipped at more than twice their rendered size, no `width`/`height` on images,
  no lazy loading below the fold, primary action out of thumb reach, over 200 KB of
  JavaScript on a content page, no `font-display`.
- **Low**: polish. Line length over 75 characters, hover-only affordances, missing
  `pointer: coarse` adjustments, media queries written `max-width` first.

## Building mobile-first

When writing new UI, apply the checklist in this order: viewport meta and zoom (V), layout
with no query first and `min-width` additions (L), tap targets and spacing (T), type in
`rem` with a 16 px floor (Y), images with intrinsic size and `srcset` (I), then chrome and
thumb reach (C). Test at 320, 375, 390 and 430 wide, and once in landscape.

## What the script measures

| Measurement | Checklist |
|---|---|
| `meta[name=viewport]` content, `user-scalable`, `maximum-scale` | V1, V2 |
| `scrollWidth` minus `clientWidth` at each width | L1 |
| Every visible link, button, input, and `role=button`: bounding box; counts under 24 and under 44 px; spacing check for undersized ones | T1, T2, T3 |
| Every visible text element: computed font size; counts under 12, 14 and 16 px; smallest samples | Y1, Y2 |
| Text inputs with computed font size under 16 px | Y3 |
| Paragraph line length in characters (width divided by 0.5 em) | Y4 |
| Images: `naturalWidth` against rendered width times DPR, `loading`, `width`/`height` attributes, `srcset`, `sizes`, `alt` | I1 to I5 |
| `position: fixed` or `sticky` elements: share of viewport height they cover | C1 |
| First visible primary action (submit button, `.btn-signal`, `[data-primary]`): vertical position as a share of viewport height | C2 |
| Largest Contentful Paint element and time, Cumulative Layout Shift | P1, P2 |
| Transferred bytes, JavaScript bytes, request count | P3 |
| `@font-face` rules without `font-display` | P4 |
| Landscape pass (844 by 390): overflow, fixed chrome share | O1 |

The script cannot judge content order, hover-only affordances, or whether a layout is
written `min-width` first; check those by reading the CSS (grep for `max-width` media
queries and `:hover` rules without a `:focus-visible` or touch equivalent).
