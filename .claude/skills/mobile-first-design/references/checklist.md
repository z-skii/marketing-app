# Mobile-first checklist

Each check has an ID, a rule, a threshold where one exists, and the source it is drawn from.
Sources are listed in full in `sources.md`. Quotes are verbatim from the source; thresholds
without a quote are this checklist's own, marked as such.

## V. Viewport and zoom

**V1. Declare the viewport.** `<meta name="viewport" content="width=device-width, initial-scale=1">`
must be in the head of every document. MDN: "you should always include the viewport meta
tag in the head of your documents." Without it, mobile browsers lay the page out at about
980 px and scale it down, so breakpoints never fire. (MDN Responsive design; web.dev Learn
Responsive Design, Introduction)

**V2. Never disable zoom.** No `user-scalable=no`, no `maximum-scale=1`. Front-End Checklist
(High): "The viewport meta tag must not set user-scalable=no or maximum-scale=1 as these
prevent users from zooming in to read content."

**V3. Text must stay zoomable.** MDN: "you should never set text using viewport units alone"
because "the user loses the ability to zoom any text set using the vw unit." Use `rem`, or
`calc(1rem + 2vw)`, or `clamp()`.

## L. Layout

**L1. No horizontal scrolling at any phone width.** Front-End Checklist (Medium): "Web pages
must not require horizontal scrolling at standard viewport widths." Test 320, 360, 375, 390
and 430. Threshold: `scrollWidth - clientWidth` must be 0.

**L2. Write the single column first, add columns with `min-width`.** MDN: "A common approach
when using media queries is to create a simple single-column layout for narrow-screen
devices (for example, mobile phones), then check for wider screens and implement a
multiple-column layout when you know that you have enough screen width to handle it."

**L3. Choose breakpoints from the content, in relative units.** MDN recommends "defining
media query breakpoints with relative units rather than absolute sizes of an individual
device." A breakpoint belongs where the layout stops working, not at a device's width.

**L4. Use fluid layout primitives.** Flexbox and grid with `fr`, `flex: 1`, `minmax()`, and
`auto-fill`. MDN: "Modern CSS layout methods are inherently responsive." Avoid fixed pixel
widths on containers.

**L5. Use relative units.** Front-End Checklist (High): "Use rem, em, %, vw, vh, and clamp()
instead of fixed px values to build layouts that scale with user font size preferences."

**L6. Respect safe areas.** Fixed bars at the bottom pad with `env(safe-area-inset-bottom)`;
full-height layouts use `dvh`, not `vh`, so the browser's own bars do not cover content.
(This checklist's own item, drawn from common iOS Safari behavior.)

## T. Touch targets

**T1. Minimum target 24 by 24 CSS px.** WCAG 2.2 SC 2.5.8 Target Size (Minimum): the
target must contain "a solid 24 by 24 CSS pixel square, aligned to the horizontal and
vertical axis." Exceptions: spacing (an imaginary 24 px diameter circle centered on the
target must not intersect another target), inline targets in sentences, user-agent defaults,
essential, and equivalent controls elsewhere.

**T2. Preferred target 44 by 44 CSS px.** WCAG 2.5.5 Target Size (Enhanced) sets 44 by 44
for important controls; the same number is Apple's rule for buttons and Google's guidance
for tap targets. Use 44 as the design size and 24 as the never-below.

**T3. Space adjacent targets.** Undersized targets pass only when the 24 px circles do not
overlap (2.5.8). In practice keep at least 8 px between adjacent tappable rows and icons.
(8 px is this checklist's own figure.)

**T4. Larger targets help everyone.** web.dev Learn Responsive Design, Interaction: "A
smaller target requires more concentration even with a fine pointer. A larger target area
benefits everyone regardless of pointing device." Do not shrink controls for mouse users.

**T5. Adapt to the pointer.** Use `@media (pointer: coarse)` to enlarge controls and
`@media (hover: hover)` to gate hover-only affordances. web.dev: `coarse` means the
"primary input mechanism isn't very accurate. A finger on a touchscreen is a coarse
pointer."

## Y. Typography

**Y1. Body text at least 16 px on phones.** Front-End Checklist (Medium): "Text must be
large enough to read without zooming on mobile devices." 16 px is the size mobile browsers
treat as readable without zoom; 14 px is the floor for secondary text; 12 px only for
labels and chips. (The 16 / 14 / 12 tiers are this checklist's own.)

**Y2. Nothing under 11 px.** Below this even labels fail; this matches Apple's minimum.

**Y3. Inputs at 16 px or larger.** iOS Safari zooms the page when a focused input has a
font size under 16 px, and does not zoom back out. Set `font-size: 1rem` on all fields.
(Well-documented Safari behavior; this checklist's own item.)

**Y4. Line length 45 to 75 characters.** web.dev Typography: "Anything from 45 to 75
characters is widely regarded as a satisfactory line length ... The 66-character line
(counting both letters and spaces) is widely regarded as ideal." Set `max-width` in `ch`
or `rem`: "Don't set your line-lengths with a fixed unit like px."

**Y5. Scale type with the screen, in a clamp.** web.dev: `clamp()` "clamps the scaling to a
specific range" with minimum, preferred and maximum, "preventing text from becoming too
small or large." Pair with MDN's rule that the preferred value keeps a `rem` component.

**Y6. Line height follows measure.** web.dev: "Shorter lines of text can have larger
line-height values. But if you use large line-height values for long lines of text, it's
hard for the reader's eye to move from the end of one line to the start of the next line."

## I. Images and media

**I1. Media never overflows.** MDN: `img, picture, video { max-width: 100%; }`.

**I2. Reserve space.** Every `<img>` and `<video>` carries `width` and `height` attributes
(or `aspect-ratio`) so the layout does not shift when it loads. Measured as CLS in P2.

**I3. Serve the right size.** Front-End Checklist (High): "Images are not significantly
larger than their display dimensions." Threshold: natural width over rendered width times
DPR should be under 2.

**I4. Offer resolutions with `srcset` and `sizes`.** Front-End Checklist (High): "Images wider
than 100px use srcset to offer multiple resolution variants." and "Images use srcset and
sizes attributes for responsive delivery across devices."

**I5. Lazy-load below the fold, eager above it.** Front-End Checklist (High): "Images below
the visible viewport use loading='lazy' to defer download until scrolling." The first
viewport's hero image should be eager with `fetchpriority="high"`.

**I6. `<picture>` always has an `<img>` fallback.** Front-End Checklist (High).

## C. Chrome and reach

**C1. Fixed chrome stays under a third of the viewport.** Top bar plus bottom bar plus any
sticky action should cover no more than about 33% of a 390 by 844 screen, and less in
landscape. (This checklist's own figure.)

**C2. The primary action sits in thumb reach.** On a phone the bottom half of the screen is
reachable one-handed; put the screen's one primary action there, or make it sticky at the
bottom. Apple: "it tends to be easier and more comfortable for people to reach a control
when it's located in the middle or bottom area of the display."

**C3. Do not hide content behind chrome.** Scroll containers pad for fixed bars so the last
row is never covered.

## P. Performance

**P1. Largest Contentful Paint under 2.5 s on a simulated phone.** Google's Core Web Vitals
threshold.

**P2. Cumulative Layout Shift under 0.1.** Core Web Vitals threshold.

**P3. Budget the page.** Front-End Checklist (Medium): "Define measurable performance
thresholds (bundle size, Lighthouse scores, Core Web Vitals) and fail CI builds automatically
when exceeded." Suggested budgets: 200 KB of JavaScript and 1 MB total on a content screen.
(Budget numbers are this checklist's own.)

**P4. Fonts with a display strategy.** Front-End Checklist (High): "Use efficient font
formats and loading strategies to prevent layout shifts and invisible text." Every
`@font-face` sets `font-display: swap` (or `optional`), formats are WOFF2.

## O. Orientation and devices

**O1. Both orientations work.** Front-End Checklist (High): "Content and functionality work
in both portrait and landscape unless a specific orientation is essential." Test 844 by
390: no overflow, fixed chrome under a third, primary action visible.

**O2. Test on real devices and emulation.** Front-End Checklist (High): "Verify your
application on real mobile devices and browser DevTools device emulation."

**O3. Test the narrowest width you support.** 320 px still exists (iPhone SE in zoomed
display mode, small Androids). Nothing should overflow or truncate meaning there.

## F. Forms on phones

**F1. Correct keyboards.** `inputmode`, `type`, and `autocomplete` on every field so the
phone shows the numeric, email, URL or password keyboard and can autofill.

**F2. Fields and buttons full width.** On a phone, a full-width field and a full-width
primary button are easier to hit and align with the single column.

**F3. Labels above fields, not beside.** A side-by-side label steals width from the field
at 320 px.

**F4. Keep the submit reachable with the keyboard open.** A sticky bottom action must not
sit under the virtual keyboard; either scroll it into view or let the page scroll.
