# Transfer QA: Public homepage, Recreate chapter (desktop 1440), Stage 6 pass 2

Production: `d-recreate-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T09:19:48.332Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Pass 2 after the pass 1 fixes: every frame now carries a native provenance caption (Demo product, the account and the literal state) and an Inspect action that opens the same capture at readable size in a dialog with Close, Escape and focus return; the Recreate reference, the Story creative and the car placement carry a native commitment plane beside the source (amount, basis, conditions from the same demo record, offset 24px desktop and 12px phone, square, no shadow, cobalt for Recreate); the filming and car images are captioned as generated illustrations and the shoot images as generated samples; the supplied Story is an intact sheet with no radius and only the source shadow; the 12px mats are gone; the hero heading is 104/96 at 1440, the chapter headings 88/84, the business and Get paid headings 64/64; the wordmark is 30/32; the business section sits on the canvas; the plan lines and the spending note carry no decorative border; the plan regions are square; the hero phone is 280px wide on a phone; the phone strips have Previous and Next controls with a Step n of N line; the business review frame is a real Story proof review with loaded media; the Drive booking frame shows the literal installation-next state; browser housings carry no ambient shadow. Graphite chapter: reference, your own version, review with a revision note, earnings.

**Verdict.** Frame Shift and the visible Recreate functionality have transferred successfully, but stabilize the product-frame position and restore native state-caption sizing before desktop sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The foundation and visible production semantics pass; desktop release sign-off needs the two presentation fixes below. This composite establishes only the Recreate chapter, not the other earning chapters or business journey. Routing, inspection-dialog behavior and backend mutations still require interaction testing.

This reads as a real work platform, not a generic SaaS or agency page: a specific reference, conditional pay, production navigation and an actual revision note explain the transaction. The graphite, mineral and cobalt treatments align with the approved language; the payment region is square and shadowless, and the rounded devices are legitimate product housings rather than floating app cards. The $75.00/$11.25/$63.75 relationship is honest and readable outside the miniature UI. The remaining weaknesses are localized: the device changes horizontal position between steps, and the native state captions are undersized. The composite’s repeated header and partial neighboring steps are capture boundaries, not evidence of duplicated navigation or missing chapter content.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 2 |

## Keep

- The mineral header, graphite making chapter, restrained reversed accents and square cobalt payment plane convincingly carry Frame Shift.
- The large Archivo instruction, operational supporting copy and conditional monetary hierarchy make Recreate understandable quickly.
- The real product captures carry the explanation instead of decorative dashboard mockups. Preserve the native provenance captions and same-capture Inspect actions.
- Keep the visible distinction between gross opportunity pay, the fee and conditional creator earnings.
- Keep the literal revision request and business note. The page does not falsely advance this record to approval or payment.
- Keep the public navigation, clear Find Recreate work entry and visible production navigation inside the captures.

## Expected differences (real data)

- The production opportunity is “Employee POV: opening the shop” from Demo Coffee Co., rather than the Lab’s coffee-pour fixture. Its reference and task copy should remain production-derived.
- $75.00 gross, an $11.25 fee and $63.75 net replace the Lab’s $65.00 example. The arithmetic is consistent, and both approval conditions and the payment basis remain explicit.
- Eight spots and the September 20, 2026 deadline correctly differ from the Lab fixture.
- Tyler’s portrait and Devon’s initial represent their respective production demo accounts; neither should be replaced with the Lab identity.
- The open opportunity and revision-requested screen are separate records. Their account/state captions and the explicit warning that this is not one live progression correctly preserve that distinction.
- The supplied reference remains a still. No fabricated playback is needed.

## Drift and usability

2. [usability] **At this desktop breakpoint, give the sticky assembly fixed tracks: grid-template-columns: 288px 260px; column-gap: 24px; width: 572px. Keep every product frame in column 1 at width: 288px and the native commitment in column 2. Preserve the second track when its content is absent rather than centering the remaining phone. Anchor each frame’s provenance and Inspect control beneath the same frame slot.** (Desktop sticky product stage, comparing the upper open-opportunity capture with the lower revision-requested capture.). The open-opportunity phone starts around x=704, while the revision phone starts around x=846. Removing the adjacent commitment recenters the device by roughly 142px. That makes the supposedly stable product stage change position during a record handoff and weakens visual continuity.
2. [drift] **Set the native provenance/state captions beneath both devices to IBM Plex Sans 400, 14px/20px, color #B3C0CE. Keep an 8px gap before the Inspect control and retain its minimum 44px target height. Do not enlarge or alter the captured application pixels to fix these external captions.** (“Demo product · Tyler · Open opportunity” and “Demo product · Devon · Revision requested” beneath the product frames.). These lines are visibly smaller than the surrounding operational copy, although they carry essential account and literal-state information. Inspect appropriately solves detailed screen reading, but visitors should not need it to distinguish an open opportunity from a revision request.
