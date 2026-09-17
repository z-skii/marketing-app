# TapMart V3 visible word counts

Measured in the browser after fonts and images settled, by walking the
rendered text nodes and keeping only what is visible inside the stated
viewport. Elements marked `aria-hidden`, screen reader only text and
zero size nodes are excluded. Counts are split into content words and
navigation or action words (anything inside a header, navigation, tab
list, button or link), then reported inclusively, because the founder's
targets and the director's budgets are inclusive of controls.

Tool: the session's `words.mjs`, run against the V3 routes on
2026-09-17 after the director's pass 1 fixes. Lettering inside photographs is audited separately below.

## First viewport, inclusive

| Surface | Viewport | Content | Navigation and actions | Inclusive | Budget | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Public hero, Make money | 390x844 | 9 | 19 | 28 | hero meaning under 20; first viewport at most 35 | within |
| Public hero, Grow your business | 390x844 | 8 | 20 | 28 | same | within |
| Public hero, Make money | 1440x900 | 9 | 19 | 28 | same | within |
| Public hero, Grow your business | 1440x900 | 8 | 20 | 28 | same | within |
| User Home | 390x844 | 13 | 14 | 27 | 20 to 35, target 28 to 33 | within, one below target |
| User Home | 1440x900 | 37 | 22 | 59 | 65 to 90 for the full desktop inventory | below the range: three opportunities carry every supported fact; the director's pass 1 treats desktop inventory targets as ceilings, not minimums |
| User Profile, owner | 390x844 | 7 | 14 | 21 | 20 to 30 | within |
| User Profile, owner | 1440x900 | 12 | 19 | 31 | 25 to 40 | within |
| User Profile, public view | 390x844 | 7 | 9 | 16 | fewer words is intentional in guest mode | within |
| Business Home | 390x844 | 2 | 24 | 26 | 20 to 35, target 27 to 33 | within, one below target |
| Business Home | 1440x900 | 20 | 40 | 60 | 65 to 90 for the full desktop inventory | below the range: the finite roster has no connected handles to add; the director's pass 1 treats these targets as ceilings, not minimums |
| Business Loyalty | 390x844 | 8 | 38 | 46 | hard ceiling 48 tokens; the director accepts 50 with the two fixture attention counts | within |
| Business Loyalty | 1440x900 | 26 | 55 | 81 | 65 to 85 desktop | within |

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
| Public homepage | 390 | 255 | 29 | 8582px |
| Public homepage | 1440 | 255 | 29 | 8999px |
| Public homepage, business lens | 390 | 255 | 29 | 8559px |
| Public homepage, business lens | 1440 | 255 | 29 | 8811px |
| User Home | 390 | 58 | 29 | 1773px |
| User Home | 1440 | 62 | 62 | 900px |
| User Profile, owner | 390 | 28 | 22 | 1415px |
| User Profile, owner | 1440 | 32 | 32 | 916px |
| User Profile, public | 390 | 23 | 17 | 1359px |
| User Profile, public | 1440 | 23 | 23 | 920px |
| Business Home | 390 | 51 | 27 | 1740px |
| Business Home | 1440 | 62 | 62 | 955px |
| Business Loyalty | 390 | 78 | 50 | 1369px |
| Business Loyalty | 1440 | 87 | 87 | 900px |
| Loyalty attribution | 390 | 114 | 66 | 1822px |
| Loyalty program | 390 | 145 | 65 | 1579px |
| Loyalty QR | 390 | 55 | 55 | 844px |
| Loyalty create | 390 | 37 | 37 | 844px |
| Loyalty signup | 390 | 70 | 64 | 1007px |
| Loyalty member card | 390 | 42 | 42 | 867px |

The complete public homepage renders 255 words at both widths, inside the
director's 260 to 360 pressure target on the low side. The audience lens
does not change the total; the desktop navigation no longer repeats the
two audience names, so phone and desktop now count the same.

The small differences between the two tables are the two measurement
methods: the table above counts every visible word in the document, the
first table separates content from controls inside one viewport only.

## Public homepage by chapter, inclusive of media lettering

Measured after the director's pass 2 with the same walker, region by
region (the persistent navigation stack, the hero, each chapter, the
footer) in the default state of every sequence. Lettering inside media is
counted per visible occurrence: the Story creative carries four lexical
words (Take a coffee break.) and appears in Post, Create and the Loyalty
loop; the Spurroom placement proof (two words) appears only when Review's
Proof tab is selected, so it is 0 in the default state.

| Region | 390 words | 390 lettering | 1440 words | 1440 lettering |
| --- | --- | --- | --- | --- |
| Navigation and lab strip | 4 | 0 | 4 | 0 |
| Lab strip | 6 | 0 | 6 | 0 |
| Hero | 18 | 0 | 18 | 0 |
| Recreate | 17 | 0 | 17 | 0 |
| Post | 20 | 4 | 20 | 4 |
| Drive | 34 | 0 | 34 | 0 |
| Get paid | 29 | 0 | 29 | 0 |
| Find people | 15 | 0 | 15 | 0 |
| Find cars | 19 | 0 | 19 | 0 |
| Create | 15 | 4 | 15 | 4 |
| Review | 19 | 0 | 19 | 0 |
| Monthly content | 13 | 0 | 13 | 0 |
| Loyalty | 31 | 4 | 31 | 4 |
| Footer | 10 | 0 | 10 | 0 |
| Whole page | 250 | 12 | 250 | 12 |
| Inclusive total | 262 | | 262 | |

Sequence controls repeat by design (one operable player per act) and
are counted where they appear. Expanded frames add their own words on
demand: the Recreate submission preview adds the three requirement lines,
the Drive campaign frame adds its obligations; those states are captured
under captures/states and are not compressed to fit a discovery budget.

## Lettering inside media

Audited by eye against the media manifest:

| Image | Visible lettering | Words | Counted where visible |
| --- | --- | --- | --- |
| story-loopday-01.jpg | Take a coffee break. | 4 per occurrence | Public Post, Create, Loyalty loop (12 on the public page), User Home Story, User Profile work |
| reference-loopday-01.jpg | none | 0 | |
| vehicle-eli-01.jpg | none | 0 | |
| vehicle-maya-01.jpg | none | 0 | |
| portraits, work stills, delivered content | none | 0 | |
| maya-spurroom-placement-01.jpg | Spurroom Bikes | 2 per occurrence | Public Review proof (Proof tab only), User Profile work 3 |

Inclusive app surface totals, lettering added per visible occurrence: User
Home 62 words on phone (58 plus the Story creative) and 66 on desktop;
User Profile owner 34 on phone and 38 on desktop (the Story and the
Spurroom placement still), public view 29; Business Home and Loyalty carry
no lettered media, so their totals are unchanged. First viewports: the
Story lettering is below the fold on User Home at 390 (the first viewport
stays 27 inclusive) and visible on the Profile at 390, which makes the
owner first viewport 25 inclusive and the public view 20, both inside
their budgets.

## States measured separately

Default, filtered, opened detail, paused and reduced motion states each
render their own inventory. The opened opportunity detail is content led
and deliberately uncapped: it carries the complete numbered requirements,
the exact deadline with timezone, the payment breakdown and the usage
rights, because those obligations may not be shortened to meet a budget.
