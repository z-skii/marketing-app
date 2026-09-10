# TapMart screen rules

Read this before writing any screen. The product may be complex underneath; the
screen must not feel complex.

## The three-second test

Without reading a paragraph, a person must know: what is this, how much money,
what do I do, what do I tap. If a screen needs a paragraph, move the paragraph
deeper or delete it.

## Text limits

- Card: title max 2 lines, meta max 2 short rows, badges max 3, no description.
- Section heading: `<h2 className="eyebrow">Label</h2>` (mono, uppercase, quiet).
- Explanatory copy: one sentence, `text-sm text-ink-soft`, only when the next
  decision needs it. Honest-state notes (no provider, manual) are one sentence.
- No "we" in product copy. No em dashes or en dashes anywhere (use commas, "to").

## Layout rhythm, not card stacks

Mix full-width media, rows separated by `divide-y divide-rule`, text directly on
the page, a selective `.card` only when something must read as one object
(a state, a form). Never card, card, card, card. Numbers stand on the page:

```tsx
<p className="tnum font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em]">$1.2K</p>
<p className="mt-1.5 text-sm text-ink-soft">Spent this month</p>
```

## Media first

Real marketplace media is the design: reel thumbnails, story creatives, car
photos, shoot deliverables, post thumbnails. Use `MediaPreview` (src/components/
v2/MediaPreview.tsx) for videos and images in feeds, `VehicleStage`
(src/components/v2/vehicle/VehicleStage.tsx) for cars. Overlay money and the
one-line title on the media with `.media-scrim`. Tags on media use `.glass-tag`
(solid scrim). When there is no media, use `NoPhoto` from EarnCards.

## Color

Lime (`text-signal`, `bg-signal`, `.btn-signal`) is for money, the one primary
action per screen, the active filter or tab, and a successful state. One
`.btn-signal` per screen. Errors use `.alert-text`; rejected states use the
`alert` chip tone. Links are `.link-row` (ink, 44px tall), never lime text.

## Controls

- Buttons: `.btn` (44px), `.btn-signal`, `.btn-lg` (52px), `.btn-sm` (40px, 44 on
  touch), `.btn-ghost`. Labels are verbs in sentence case: "Recreate this",
  "Fix Google", "Approve all".
- Filters: `FilterBar` (src/components/v2/FilterBar.tsx) or `.pill` with
  `aria-current`.
- Rows: `<Link className="flex min-h-14 items-center justify-between gap-3 py-3">`
  inside `<ul className="divide-y divide-rule">`, with `CaretRight` from
  `@phosphor-icons/react/dist/ssr` (server) or `@phosphor-icons/react` (client).
- Icons: Phosphor only. Never hand-drawn SVG, never text arrows (no "→", "←",
  "✓" as text; use CaretRight, CaretLeft, CheckCircle).
- Inputs: `.field` (16px, 48px tall). Labels above.

## Motion

`.reveal` on list items with a staggered `animationDelay` (index * 60ms, max 6).
`.settle` on values that change. `.pop` for a one-off tap response. Nothing
loops except `.live-dot`. All animations already stop under reduced motion.

## Honesty

Never show a number that was not measured. When a provider is missing, say so in
one plain sentence and show what is real (photos, manual entries). Label AI or
template output with its `source` when the person is deciding on it.

## Responsive

Phone first. Two-column layouts only at `lg:` (`lg:grid lg:grid-cols-[...]`).
The desktop rail appears at the `rail:` variant (768px wide and 600px tall), so
use `rail:hidden` / `rail:block` for chrome that swaps with the bottom bar.
Sticky phone actions sit at `bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)]`
with `rail:static`.

## Files

- Design tokens and primitives: src/app/globals.css
- Shared kit: src/components/v2/ui.tsx (Money, Chip, StatusChip, Avatar,
  EmptyState, SkeletonRows, ScreenHeader, Stat)
- Example screens done right: src/app/(v2)/home/page.tsx, src/app/(v2)/me/page.tsx,
  src/app/(v2)/o/[id]/RecreateView.tsx
