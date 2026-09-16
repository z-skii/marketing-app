# Transfer QA: Public homepage, Drive chapter (phone 390), Stage 6 pass 1

Production: `m-drive.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:47.385Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Underlay chapter on a phone: the real car photo, then the placement and booking frames.

**Verdict.** Frame Shift has transferred convincingly to the Stage 6 Drive chapter, with real functionality visibly preserved, but source inspection and readable campaign conditions need a final phone usability pass.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The Frame Shift foundation is convincing, but improve inspection and source labeling before signing off this phone chapter. The capture exposes real campaign information and navigation; swipe behavior, menu operation, booking actions and later frames still require interaction testing.

The captured chapter reads as a vehicle-advertising task within a working platform, not a generic SaaS section: it connects adding an actual vehicle with a real campaign screen, uses the correct underlay material, and keeps conditional monthly pay explicit. The photograph is not falsely wrapped, and the campaign’s financial region remains attached below its source rather than overlaid on it. The principal weaknesses are source inspection and operational legibility, not the intentional horizontal composition. The menu and in-product navigation are visible, but a still capture cannot establish that their interactions or booking mutations work.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 8 |
| usability | 6 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- Mineral header, underlay Drive chapter, graphite typography and restrained cobalt accents.
- The direct headline and explicit condition: monthly pay follows approved proofs.
- The unwrapped vehicle photograph remains separate from the campaign artwork and placement terms.
- Real production screens carry the explanation rather than invented product illustrations.
- The visible Menu control and clear numbered progression.

## Expected differences (real data)

- The campaign capture correctly uses production-demo records: Tyler Okafor, $300.00 per month, rear-window placement, 30 days and Raleigh, rather than the Lab’s $240.00 rear-door campaign.
- The wrapped vehicle inside the product frame is supplied campaign artwork; it is distinct from the unwrapped vehicle photograph outside the frame.
- The phone chapter uses the approved Stage 6 horizontal sequence of real product captures. The next item being cut at the right edge is intentional, not responsive overflow to eliminate.
- Real product navigation, campaign fields and fee information replace the Lab’s simplified work excerpt.

## Drift and usability

1. [usability] **Keep the horizontal strip and real device captures. Add an ink inspection button below each frame, minimum 44px high with IBM Plex Sans 16/20px, labeled specifically—for example, “Inspect campaign.” Open the same capture in a full-width, zoomable viewer with a visible 44px Close control. Provide the essential placement, duration and payment basis outside the image at 14/20px; format any repeated amount from the same record at Archivo 30/34px.** (Drive strip, step 02 campaign frame and subsequent product frames). The campaign’s amount is recognizable, but its placement, fee and eligibility fields are reduced to very small screenshot text. Swiping the frame fully into view resolves clipping, not text size. Visitors should not have to decipher a miniature inspector to understand the conditions.
2. [drift] **Place a source caption 8px below the vehicle photograph in IBM Plex Sans 14/20px, using its actual provenance and explicitly stating “No installed ad.” Add an ink “Inspect vehicle photo” action with a minimum 44px target that opens this exact source. Keep these elements directly beneath the photograph rather than aligning them below the taller neighboring device.** (Drive strip, step 01 vehicle photograph). The Lab makes the vehicle source identifiable and inspectable. Production shows the photograph without either treatment, followed by a substantial empty area. That weakens the distinction between the introductory vehicle image and the supplied campaign illustration in the adjacent frame.
