# Transfer QA: Production Campaign detail, car campaign (desktop 1440), stage 4 pass 2

Production: `d-business_campaigns_e4000000_0000_4000_8000_000000000020.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:38:35.175Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. One car campaign: the placement diagram and the artwork (as artwork) anchor the left with the pay, real progress and credit; the right answers Needs you (drivers to review, a car ready to install), drivers who applied with Accept and Decline (accepting books the car, pays nothing), cars on the campaign with their literal stage, and Campaign settings kept deeper.

**Verdict.** Frame Shift largely survived and the real car workflow remains exposed, but the desktop source-to-decision gap still needs correction before sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Fix the desktop split spacing before visual sign-off. The capture exposes the expected workflow without a visible functional regression, but it does not show the campaign credit summary, installation confirmation screen or transaction results; those require scrolling and interaction checks.

The transfer is substantially successful: the shell, typography, restrained surfaces, inspectable artwork and strong monthly amount read as Frame Shift rather than a generic dashboard. Financial copy distinguishes booking from payment, and Confirm installation is presented as navigation rather than a falsely labelled proof approval. No visible copy suggests escrow, reserved funds or an added business-side platform fee. The remaining measurable drift is the 48px main-column separation. Credit sufficiency and the final first-month payment action cannot be verified from this capture.

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
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite navigation, restrained white working planes and the matching TapMart mark and typography.
- The placement diagram identifies the driver door and rear windscreen without drawing advertising onto a real vehicle.
- Artwork remains a separate, intact source with an ink View artwork control.
- The payment caption has the correct 24px left inset from the source and makes $250.00 per car, per month the financial anchor.
- Accept and Decline remain explicit. The adjacent explanation correctly says acceptance books the car and pays nothing until installation is confirmed.
- Needs you exposes both pending tasks, while the booked-car row preserves its literal stage, payment history and driver-photo count.
- Campaign settings remain progressively disclosed rather than competing with operational decisions.

## Expected differences (real data)

- Demo Coffee Co., the Raleigh campaign and the BMW records replace the Lab’s fictional business and content records.
- The placement diagram and supplied artwork are appropriate car-campaign sources; the Lab’s café photography should not be copied here.
- The $250.00 monthly rate, one applicant, Ready to install stage, zero months paid and driver-photo count represent this campaign’s real data.
- Campaigns is correctly selected in navigation. Needs you, applicant decisions, installation review and campaign settings appropriately replace the Lab’s Content workflow.

## Drift and usability

2. [drift] **Set the desktop campaign-detail column gap to 24px instead of 48px. With the source ending at x=680, start the right workflow plane at x=704 rather than x=728. Preserve the existing 24px payment-caption inset; do not add another decorative offset.** (Desktop split between the left source/payment assembly and the right Needs you and driver workflow). The principal source-to-decision split currently has a 48px gutter, double the specified desktop joint. The approved Lab uses a 24px source/decision separation, and the transfer instructions retain that relationship for campaign detail.
