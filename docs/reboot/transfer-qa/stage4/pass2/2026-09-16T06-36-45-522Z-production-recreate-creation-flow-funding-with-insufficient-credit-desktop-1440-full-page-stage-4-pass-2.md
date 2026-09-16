# Transfer QA: Production Recreate creation flow, funding with insufficient credit (desktop 1440, full page), stage 4 pass 2

Production: `d-create_recreate_6_funding.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:36:45.522Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. The same funding plane when campaign credit does not cover one payment: the amount to add is stated, Add credit opens the top-up, and the flow can continue without publishing (save as draft). Nothing is hidden.

**Verdict.** Frame Shift was faithfully transferred, and the capture preserves the real insufficient-credit workflow and financial semantics, with only minor desktop rail alignment drift.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Ready for visual sign-off at this desktop viewport, with minor rail alignment polish. The capture exposes the required actions but cannot verify top-up behavior, draft persistence or backend debit timing.

The transfer preserves the approved material hierarchy and a measurable 24px joint without turning the funding step into rounded dashboard cards. The reference remains identifiable and inspectable, while payment leads the decision plane. Financial meaning is accurate: $50.00 is required for one payment, $10.00 is available, and the separate shortfall line asks for $40.00. The $490.00 remaining to cover every spot is distinguished from the publishing requirement. Copy explicitly says credit leaves only on approval, nothing is held at publication, and the plan is billed separately. All funding controls and the campaign summary remain visible without clipping.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 9 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite navigation, white working plane, restrained cobalt, flat surfaces and matching typography.
- The 24px source-to-decision joint between the source column ending at x=680 and the funding column beginning at x=704.
- Intact portrait media with a visible, ink-colored Open reference control and conditional payment caption.
- Strong $50.00 payment anchors and the distinction between one approved video and the $500.00 total if all 10 spots are approved.
- Explicit creator-side fee calculation: $42.50 received after 15%, with no fee added to the business’s $50.00 payment.
- Visible top-up, non-publishing continuation and back navigation without unnecessary disclosure layers.

## Expected differences (real data)

- This is a creation-flow funding step, not the Lab’s Content overview; its step indicator, financial ledger and continuation controls appropriately replace review tabs and delivered-file actions.
- Demo Coffee Co., its D initial and notification counts reflect the production account rather than the Lab fixture.
- The uploaded portrait reference, campaign brief, deadline and Raleigh location are record-specific. Keeping the reference at its approximately 9:16 ratio is correct.
- The $10.00 campaign credit and insufficient-credit state legitimately introduce a $40.00 publishing shortfall, Add credit and Continue without publishing.

## Drift and usability

3. [drift] **Remove the desktop rail’s 20px top inset. Anchor it at top: 0 with margin-top: 0 and height: 100dvh; retain its 200px width and the main content’s 32px gutter. Preserve the flow’s internal vertical spacing.** (Desktop navigation rail: production y=20–920 versus Lab y=0–900.). Production leaves a mineral strip above the graphite rail and shifts its entire contents down 20px. The approved rail starts flush against the viewport top.
