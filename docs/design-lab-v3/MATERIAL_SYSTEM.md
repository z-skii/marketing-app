# TapMart V3 material system, as implemented

A record of what the code does, transcribed from
`src/app/design-lab-v3/x/x.css` (169 lines), with the surface layouts in
`x/site.css` and `x/app.css`. The direction these values come from is
`EXPERIENCE_DIRECTION.md`, Material system.

## The principle in the build

Glass is a thin control material between a person and something they are
inspecting. It appears only where real content passes beneath a control.
Content itself is opaque or uncovered. Every value below is scoped under
`.v3`, so nothing reaches production or the V2 Lab.

## Layers

| Layer | z | Implementation |
| --- | --- | --- |
| Canvas | 0 | `#F6F7F5`, no blur, no border, no shadow, radius 0. It is the page background on every V3 surface |
| Media | 10 | Original colours at opacity 1, no blur, no shadow. Radius 4px on a reference or portrait, 0 on an intact Story creative and on a car field |
| Working paper | 20 | `#FFFFFF`, opaque, inset top highlight `0 1px 0 rgba(255,255,255,0.9)`, `1px #DCE2DE` dividers only where a reading group needs one. On the public stages and the app feeds a reading edge is flush paper with radius 0 (or the opaque canvas itself), attached to its media, never a rounded container. Float shadow `0 16px 48px rgba(43,67,54,0.10)` only when it floats over another task |
| Light lens | 40 | `rgba(255,255,255,0.58)`, `backdrop-filter: blur(16px) saturate(1.16)`, a masked 1px 135deg edge from `rgba(255,255,255,0.88)` through `rgba(255,255,255,0.16)` to `rgba(223,234,225,0.64)`, inset highlight `0 1px 0 rgba(255,255,255,0.74)`, shadow `0 8px 28px rgba(46,74,60,0.09)`. Radius 18px for navigation, 14px for an inspection rail |
| Dark lens | 40 | `rgba(22,34,27,0.64)`, `blur(16px) saturate(1.12)`, a white top highlight into `rgba(235,246,237,0.26)`, shadow `0 8px 28px rgba(10,28,17,0.22)`. Only for controls over the dark public media stage |
| Grip | 50 | `#17221E` with white text, radius 12px, inset top highlight `rgba(255,255,255,0.16)`, no shadow unless it genuinely floats. This is the primary action, not another glass layer |
| Modal scrim | 60 | `rgba(20,32,25,0.30)`, no blur. A scrim dims; it is never a full screen frosted panel |
| Modal task | 70 | Opaque working paper. Phone sheets have 24px top corners; desktop drawers expose 18px corners |

## Where the lens is used, and where it is not

Used: the public floating navigation, the phone app navigation bar, the
hero audience control, the Recreate approval rail, the Review rail, and
the comparison grip. That is at most one active region on a resting app
surface and two on the public page. The approval rail is one narrow band
across the work; its text sits on an opaque paper chip inside the lens so
the recorded identity and date read at full contrast, and the registered
source copy exists only in the 7px rim.

Not used, by rule: opportunity media, people, work galleries, car
photographs, money, Loyalty counts, customer rows, attribution ledges,
forms, legal text, settings lists, Wallet pass artwork, QR codes and
their quiet zones, the Loyalty discovery strip, and the desktop sidebar.

## Fallbacks

Three paths lead to an opaque substitute, all in `x.css`:
`@supports not (backdrop-filter)` and `@media (prefers-reduced-transparency: reduce)`
both replace the light lens with `#FFFFFF` and the dark lens with
`#17221E`; a `data-lens="opaque"` attribute on the root does the same for
testing. The phone navigation bar carries its own copy of each fallback.

## Tokens

```
--v3-canvas #F6F7F5   --v3-paper #FFFFFF   --v3-ink #17221E
--v3-muted #59655D    --v3-line #DCE2DE    --v3-stage-dark #142019
--v3-create #D5E85A   --v3-focus #315E49
--v3-success #236444  --v3-warning #835400 --v3-danger #B3261E
--loopday-paper #F7F4EB --loopday-ink #18231D --loopday-terminal #B73E28 --loopday-label #C4CDBF
```

The V2 tokens are re-pointed at these, so the approved Loyalty surfaces
render in the V3 language without their component code changing. Loopday
keeps its own brand colours inside its brand objects, and the brick
terminal stays part of the Loopday mark rather than becoming a TapMart
divider: `.v3 .edge::after` and `.v3 .descent-ledge::after` are switched
off, so V2's brick earning edge does not appear in V3.

## Typography

DM Sans carries every size; the Bricolage display face is retired from
V3 (`layout.tsx` no longer loads it, and `--v2-font-display` points at the
UI face). Public display 52px/1.04 on phone, 44px at 320, 64px at 768,
76px/1.02 at 1440, 88px at 1600, weight 500, tracking -0.045em. Chapter
verbs 32px phone and 44px desktop. Money 36px/40px phone and 44px/48px
desktop, weight 600, tabular lining numerals. Body and obligations
16px/24px, actions 14px/20px weight 600, facts 13px/18px, navigation and
lab labels 12px/16px minimum.

## Motion

```
open   440ms cubic-bezier(0.16, 1, 0.3, 1)
settle 220ms cubic-bezier(0.2, 0.8, 0.2, 1)
reveal 160ms cubic-bezier(0.2, 0, 0, 1)
return 280ms cubic-bezier(0.22, 1, 0.36, 1)
press  100ms down, 160ms back, scale 0.98 on the control only
```

Object continuity is a measured transform: `x/Open.tsx` measures the
source and destination once, then animates transform and opacity only. No
layout property is animated, and no layout is read during a transition.

Sequences have no reserved minimum heights: each frame lays out at its
natural size. A deliberate Previous, Next or Steps choice re anchors the
stage beneath the navigation only when the new object would otherwise sit
above the viewport (`useSequence` in `x/Stage.tsx`); a stage already in
view is never moved under the finger, and autoplay never scrolls.
Playback stops when the stage leaves the viewport.

## Pause and reduced motion

`x/motion.tsx` provides the state. A visible Pause motion control sits
beside the compact lab context on every surface; pressing it sets
`data-motion="paused"` on the V3 root, which pauses every CSS animation in
place (`animation-play-state: paused`) without resetting position, and
holds the remaining time of any presentation timer so resuming continues
rather than restarting. Product state changes still render immediately.

System `prefers-reduced-motion: reduce` is authoritative and cannot be
overridden by the control: every sequence renders its frames as ordered,
labelled, stationary sections in document flow, autoplay never starts, and
the comparison stays operable through its two buttons.

## Optical rim

One approximation exists, used only on the Recreate approval rail: an
`aria-hidden` copy of the same static source image, clipped to a 7px inner
rim of the rail, scaled 1.015, displaced 1.5px, blurred 0.5px, at opacity
0.34 (`.x-rim`). It never duplicates a video decoder, samples unrelated
imagery, or distorts text, a QR code or pass artwork.
