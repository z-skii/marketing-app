# Transfer QA: Production Recreate creation flow, funding step (phone 390, full page), stage 4 pass 1

Production: `m-create_recreate_6_funding.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:02:39.202Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The funding plane: pay per approved video, spots, the total if every spot is approved, what the creator receives after the fee taken from the payout, credit now, the one payment needed to publish, what is still needed to cover every spot, and Add credit. The tab bar is pinned to the document end for this full-page capture only.

**Verdict.** Frame Shift is partially transferred and the real workflow remains recognizable, but financial readability and composition failures prevent release sign-off at 390px.

**Faithful transfer: NO. Functionality intact: NO. Ready to ship: NO.** Not ready at 390px. The workflow controls survive visually, but essential funding disclosures are overlapping or obscured, so functionality cannot be signed off as fully exposed in this capture. Repair and recapture, then verify Add credit, Back, Continue and publication gating. Publication must require only one $50 payment of available credit and reserve nothing; this screenshot cannot establish backend behavior.

The supplied Lab image is desktop Content review, not this previously undrawn phone funding flow, so its language—not its fixture layout—is the comparison baseline. Production carries across the mineral surfaces, restrained controls, source-ratio media and honest conditional-payment copy. However, the defining 12px joint is absent, money lacks the intended prominence, the creator-net row overlaps, and the tab bar hides a required funding disclosure. These are observable transfer and usability failures, not evidence that backend payment logic has changed.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 4 |
| media quality | 8 |
| uniqueness | 5 |
| clarity | 5 |
| premium feel | 5 |
| fidelity | 6 |
| usability | 4 |
| brand recognition | 6 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, white financial surface, graphite ink, restrained dividers and shadow-free app regions.
- The intact portrait reference, approximately 176×313 CSS px, with restrained 4px corners and no invented media treatment.
- The phone title and section-heading hierarchy, outlined Add credit action, and cobalt Continue action.
- Literal conditional language: payment is per approved video, the total depends on every spot being approved, and nothing is held at publication.
- The completed-step summary, Step 6 of 7 indicator, Back and Continue controls, business switching, and five labelled navigation destinations.

## Expected differences (real data)

- Demo Coffee Co., its D initial, and the notification counts are production records; they should not be replaced with the Lab business identity or fixture labels.
- The supplied reference is an uploaded portrait-format image, not the Lab’s landscape delivered photograph. Keeping its source ratio and omitting video controls is correct.
- The brief, Raleigh location, September 26, 2026 deadline, $50 payment and 10 spots belong to this campaign.
- The funding arithmetic is consistent with the stated rules: $500 if all 10 spots are approved, and $42.50 received by the creator after the 15% fee is deducted from each $50 payout.
- The $17,887 campaign credit and Covered state are legitimate production values; the screen should not manufacture a funding shortfall.

## Drift and usability

1. [responsive] **At phone widths, render this row as a grid with grid-template-columns: minmax(0, 1fr) auto; column-gap: 12px; row-gap: 4px. Put Creator receives in the first cell and $42.50 in the second with white-space: nowrap. Put the fee explanation on its own full-width row using grid-column: 1 / -1 and IBM Plex Sans 14/20px. Remove positioning or shrinking that permits the amount to overlap the label.** (Funding plane, Creator receives row). The $42.50 amount visibly collides with Creator receives. This makes a required payout disclosure difficult to read even at the supplied 390px viewport.
1. [usability] **For full-page capture mode only, place the tab bar after main content in normal document flow: position: static; inset: auto; width: 100%; margin-top: 24px. It must follow Continue and Back, not cross the financial plane. Preserve the intended live navigation behavior separately. Recapture with the one-payment publication requirement fully visible: $50.00 required, with $0.00 additional credit needed for this balance.** (Bottom navigation over the middle of the funding panel). Despite the stated document-end capture treatment, the tab bar crosses the funding panel between Campaign credit now and Still needed to cover every spot. It obscures the publication-threshold area while the panel and actions continue below it.
2. [drift] **Treat the existing reference and completed-step facts as the source assembly, then give its attached funding plane the approved 12px phone offset. With the existing 16px page gutters, retain source x=16px and set commitment x=28px, right gutter=16px and width=346px. Use margin-inline-start: 12px and width: calc(100% - 12%). Keep the financial plane square, white and shadow-free, with its existing 3px cobalt edge; do not add a decorative notch.** (Relationship between the reference/completed-step assembly and Funding). The reference and funding panel currently begin on the same x=16px line. A cobalt border alone does not transfer Frame Shift’s source-to-commitment relationship.
2. [drift] **Set the principal $50.00 pay value to Archivo 700, 30/34px, tracking -0.02em, with tabular lining numerals. Keep its per approved video basis at IBM Plex Sans 14/20px, on a separate line when necessary. Keep supporting financial values at 18/24px Archivo 700 rather than enlarging every amount.** (Funding plane, Pay row). The principal payment is approximately 18px, close to the surrounding operational text and other values. The heading, rather than the payment decision, currently anchors the financial region.
2. [usability] **Expose an ink Open reference action beside or beneath Your reference, using IBM Plex Sans 600 at 16/20px and a minimum 44px target. Connect it to the actual uploaded source or existing inspector. Preserve the image ratio and do not add a Play control to an image.** (Reference image and Your reference caption). The reference is identifiable, but the capture shows no visible inspection affordance. A tappable image without an affordance would still leave that capability undiscoverable before commitment.
