# Transfer QA: Public homepage, Post chapter (desktop 1440), Stage 6 pass 2

Production: `d-post-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T09:18:18.837Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Pass 2 after the pass 1 fixes: every frame now carries a native provenance caption (Demo product, the account and the literal state) and an Inspect action that opens the same capture at readable size in a dialog with Close, Escape and focus return; the Recreate reference, the Story creative and the car placement carry a native commitment plane beside the source (amount, basis, conditions from the same demo record, offset 24px desktop and 12px phone, square, no shadow, cobalt for Recreate); the filming and car images are captioned as generated illustrations and the shoot images as generated samples; the supplied Story is an intact sheet with no radius and only the source shadow; the 12px mats are gone; the hero heading is 104/96 at 1440, the chapter headings 88/84, the business and Get paid headings 64/64; the wordmark is 30/32; the business section sits on the canvas; the plan lines and the spending note carry no decorative border; the plan regions are square; the hero phone is 280px wide on a phone; the phone strips have Previous and Next controls with a Step n of N line; the business review frame is a real Story proof review with loaded media; the Drive booking frame shows the literal installation-next state; browser housings carry no ambient shadow. Canvas chapter: the 9:16 creative as the major object, eligibility, proof, Activity.

**Verdict.** Frame Shift was faithfully transferred and the real Story workflow remains visible, but the source-to-commitment advertiser attribution needs resolution before final sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The desktop visual migration is substantially successful. Hold final sign-off for the source/advertiser attribution issue below. The capture demonstrates exposed functionality, but cannot verify dialog keyboard behavior, navigation destinations or sticky-stage switching.

The page reads as a specific paid-work product rather than a generic SaaS section: supplied creative leads into eligibility and conditional money, then a real proof-review screen demonstrates what happens after posting. Surfaces, typography, source treatment, financial hierarchy and controls closely follow Frame Shift. The later capture preserves a pending review state instead of manufacturing progress. Small device text is supported by a native state caption and Inspect action. The remaining concern is factual attribution at the signature joint, not the production layout or legitimate differences between demo records.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite typography, restrained cobalt and the large, tightly set chapter heading preserve the approved Frame Shift language.
- The intact 9:16 Story is the dominant source object, with square corners and source-only depth.
- The square, shadow-free white commitment plane sits 24px beside the source and exposes $25.00, its payment basis and live-time conditions at native reading size.
- Native provenance captions and separate Inspect actions make the creative and real product capture independently inspectable.
- The production frame retains campaign identity, conditions, submitted proof, In review status, inspection controls and Home, Activity, Earnings and Profile navigation.
- Keep the production chapter’s step-driven product stage; it does not need to reproduce the Lab’s three-column composition.

## Expected differences (real data)

- The production latte creative and $25.00 conditional payment legitimately replace the Lab’s coffee-break creative and $35.00 fixture.
- Devon’s submitted proof and literal In review state replace the Lab’s open opportunity and eligible Maya fixture. Review is not presented as approval or payment.
- The explicitly separate demo records may have different follower thresholds, including 500+ and 1,000+. Those differences alone are not implementation drift.
- Submitted proof can look different from the supplied creative: it is a separate evidence object awaiting review, not a replacement for the original Story.

## Drift and usability

2. [data_honesty] **Resolve the Story image and its native commitment fields through the same campaign ID; remove any fallback advertiser string. The displayed creative says “Demo Roastery,” while the commitment names “Demo Coffee Co.” If the linked advertiser is Demo Roastery, render that exact name. If Demo Coffee Co. genuinely commissions the Roastery-branded creative, make the relationship explicit with “Advertiser: Demo Coffee Co.” at 14/20px rather than an unexplained trailing business name. Preserve the record-backed $25.00, live-time condition and follower threshold; do not copy the separate proof frame’s 1,000+ requirement merely to make the examples match.** (Chapter-start Story creative and adjacent white $25.00 commitment plane.). The branding discrepancy occurs inside the directly paired source-to-commitment assembly. The notice that product frames show separate records explains differences between frames, but does not explain this source/advertiser relationship.
