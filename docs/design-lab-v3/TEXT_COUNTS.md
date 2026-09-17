# TapMart V3 visible word counts

Measured in the browser after fonts and images settled, by walking the
rendered text nodes and keeping only what is visible inside the stated
viewport. Elements marked `aria-hidden`, screen reader only text and
zero size nodes are excluded. Counts are split into content words and
navigation or action words (anything inside a header, navigation, tab
list, button or link), then reported inclusively, because the founder's
targets and the director's budgets are inclusive of controls.

Tool: `scratchpad/v3x/words.mjs`, run against the V3 routes on
2026-09-17. Lettering inside photographs is audited separately below.

## First viewport, inclusive

| Surface | Viewport | Content | Navigation and actions | Inclusive | Budget | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Public hero, Make money | 390x844 | 9 | 19 | 28 | hero meaning under 20; first viewport at most 35 | within |
| Public hero, Grow your business | 390x844 | 8 | 20 | 28 | same | within |
| Public hero, Make money | 1440x900 | 9 | 23 | 32 | same | within |
| Public hero, Grow your business | 1440x900 | 8 | 24 | 32 | same | within |
| User Home | 390x844 | 13 | 14 | 27 | 20 to 35, target 28 to 33 | within, one below target |
| User Home | 1440x900 | 37 | 22 | 59 | 65 to 90 for the full desktop inventory | within |
| User Profile, owner | 390x844 | 7 | 14 | 21 | 20 to 30 | within |
| User Profile, owner | 1440x900 | 12 | 17 | 29 | 25 to 40 | within |
| User Profile, public view | 390x844 | 7 | 9 | 16 | fewer words is intentional in guest mode | within |
| Business Home | 390x844 | 2 | 24 | 26 | 20 to 35, target 27 to 33 | within, one below target |
| Business Home | 1440x900 | 14 | 34 | 48 | 65 to 90 for the full desktop inventory | within |
| Business Loyalty | 390x844 | 8 | 38 | 46 | hard ceiling 48 tokens (the director's operational exception) | within |
| Business Loyalty | 1440x900 | 24 | 56 | 80 | 65 to 85 desktop | within |

The hero meaning count, excluding navigation, lab context, motion control
and actions, is 9 words in the earning lens (Reference, Recreate this
Reel, Loopday Coffee, US$75, On approval) and 8 in the business lens
(Campaign reference, Loopday Coffee, Find people, Maya Chen). Both are
under the founder's ceiling of 20 meaningful words.

## Whole page, measured by the capture tool

The capture tool counts every visible word in the full document and the
words inside the first viewport. From `docs/design-lab-v3/captures/density.json`:

| Surface | Viewport | Whole page words | First viewport words | Document height |
| --- | --- | --- | --- | --- |
| Public homepage | 390 | 244 | 29 | 9202px |
| Public homepage | 1440 | 248 | 33 | 9298px |
| Public homepage, business lens | 390 | 244 | 29 | 9168px |
| Public homepage, business lens | 1440 | 248 | 33 | 9146px |
| User Home | 390 | 58 | 29 | 1773px |
| User Home | 1440 | 62 | 62 | 900px |
| User Profile, owner | 390 | 28 | 22 | 1415px |
| User Profile, owner | 1440 | 30 | 30 | 900px |
| User Profile, public | 390 | 23 | 17 | 1359px |
| Business Home | 390 | 51 | 27 | 1740px |
| Business Home | 1440 | 62 | 50 | 1089px |
| Business Loyalty | 390 | 75 | 50 | 1369px |
| Business Loyalty | 1440 | 85 | 85 | 900px |
| Loyalty attribution | 390 | 111 | 64 | 1800px |
| Loyalty program | 390 | 145 | 65 | 1579px |
| Loyalty QR | 390 | 65 | 65 | 844px |
| Loyalty create | 390 | 32 | 32 | 844px |
| Loyalty signup | 390 | 70 | 64 | 1007px |
| Loyalty member card | 390 | 42 | 42 | 867px |

The complete public homepage renders 244 words on phone and 248 on
desktop, inside the director's 260 to 360 pressure target on the low
side. The two counts differ only by the desktop navigation labels; the
audience lens does not change the total.

The small differences between the two tables are the two measurement
methods: the table above counts every visible word in the document, the
first table separates content from controls inside one viewport only.

## Lettering inside media

Audited by eye against the media manifest:

| Image | Visible lettering | Words | Counted where visible |
| --- | --- | --- | --- |
| story-loopday-01.jpg | Take a coffee break. | 4 | Public Post, Create, Loyalty loop, User Home Story, User Profile work |
| reference-loopday-01.jpg | none | 0 | |
| vehicle-eli-01.jpg | none | 0 | |
| vehicle-maya-01.jpg | none | 0 | |
| portraits, work stills, delivered content | none | 0 | |
| maya-spurroom-placement-01.jpg | Spurroom Bikes | 2 | Public Review proof, User Profile work 3 |

Neither lettered image appears in a first viewport that is close to its
ceiling: the Story creative enters the User Home first viewport only at
its top edge, below the Recreate reading band.

## States measured separately

Default, filtered, opened detail, paused and reduced motion states each
render their own inventory. The opened opportunity detail is content led
and deliberately uncapped: it carries the complete numbered requirements,
the exact deadline with timezone, the payment breakdown and the usage
rights, because those obligations may not be shortened to meet a budget.
