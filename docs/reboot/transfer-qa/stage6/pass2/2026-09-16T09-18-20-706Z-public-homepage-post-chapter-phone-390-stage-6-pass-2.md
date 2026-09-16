# Transfer QA: Public homepage, Post chapter (phone 390), Stage 6 pass 2

Production: `m-post.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T09:18:20.706Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Pass 2 after the pass 1 fixes: every frame now carries a native provenance caption (Demo product, the account and the literal state) and an Inspect action that opens the same capture at readable size in a dialog with Close, Escape and focus return; the Recreate reference, the Story creative and the car placement carry a native commitment plane beside the source (amount, basis, conditions from the same demo record, offset 24px desktop and 12px phone, square, no shadow, cobalt for Recreate); the filming and car images are captioned as generated illustrations and the shoot images as generated samples; the supplied Story is an intact sheet with no radius and only the source shadow; the 12px mats are gone; the hero heading is 104/96 at 1440, the chapter headings 88/84, the business and Get paid headings 64/64; the wordmark is 30/32; the business section sits on the canvas; the plan lines and the spending note carry no decorative border; the plan regions are square; the hero phone is 280px wide on a phone; the phone strips have Previous and Next controls with a Step n of N line; the business review frame is a real Story proof review with loaded media; the Drive booking frame shows the literal installation-next state; browser housings carry no ambient shadow. Canvas chapter on a phone: the creative first, then the campaign and proof frames.

**Verdict.** The visible Post chapter faithfully carries Frame Shift and preserves TapMart's product semantics, with one non-blocking strip-navigation discoverability issue.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Visual sign-off for the captured Post viewport, with a non-blocking navigation improvement. Menu and Find Story work remain exposed, and the visible product fields preserve real semantics. This crop does not establish interaction behavior or show the complete native commitment plane, provenance captions, Inspect dialog, strip controls or submitted-proof frame.

At the normalized 390px viewport, the surfaces, typography, spacing, outlined controls and intact Story treatment convincingly carry Frame Shift. The real Story-detail frame exposes $25.00 with its approval and live-time conditions, rather than presenting an unconditional earning promise. Specific creative and working product UI keep this from reading as a generic SaaS process section. The source-to-commitment joint is not sufficiently visible in this crop to verify its 12px offset; its absence from the crop is not evidence that it is missing from the page.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 9 |
| ai slop risk | 2 |

## Keep

- Mineral canvas, graphite text, muted supporting copy and restrained cobalt accents.
- The exact restrained TapMart lockup, 16px phone gutter and comfortably sized Menu and Find Story work controls.
- The strong, two-line Share the supplied Story heading and concise explanation of Instagram conditions.
- The supplied Story's square edges, source-only shadow and unaltered artwork.
- Real product captures carrying actual task, payment and requirement fields rather than fabricated marketing UI.
- The intentional next-item peek in the phone strip; that clipping is not itself transfer drift.

## Expected differences (real data)

- The supplied iced-latte Story replaces the Lab's green coffee creative. Preserve this actual artwork rather than reproducing the fixture.
- The production example shows $25.00 rather than $35.00, while retaining the conditional basis: after 24h live and approval.
- Tyler Okafor, Demo Coffee Co. and the iced-latte task replace the Lab identities and task.
- The visible requirements are 500+ followers, 20 spots and a September 26, 2026 application deadline, rather than the Lab values.
- The chapter presents separate demo records and explicitly says they are not one live progression. It correctly avoids inventing an eligibility result or automatic state transition.

## Drift and usability

3. [usability] **Move the existing Previous, Step n of N and Next row immediately above the horizontal strip: 16px after Find Story work and 16px before the step headings. Keep both controls at least 44×44px and retain the intentional next-item peek.** (Phone Post chapter, between Find Story work and the numbered source/product strip.). The strip begins around y=434 CSS px, but no strip controls or position indicator are visible before the capture ends at y=844. A visitor currently encounters a clipped second heading before an explicit browsing affordance.
