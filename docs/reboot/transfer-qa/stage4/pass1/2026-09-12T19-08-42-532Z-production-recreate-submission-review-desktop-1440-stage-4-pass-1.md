# Transfer QA: Production Recreate submission review (desktop 1440), stage 4 pass 1

Production: `d-business_campaigns_f28f4d7d_117e_45b6_bf83_fc067318e101_submissions_e4000000_0000_4000_8000_000000000012.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:08:42.532Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The submitted video on a graphite stage, the reference and the brief checklist beside it, the creator with recorded provenance, their note, and the decision plane: Approve and pay with the amount and what the creator receives, Request changes (keeps the original, records a note), Reject. The submitted demo video renders white frames; that is the real file.

**Verdict.** TapMart’s real review surface appears intact, but Frame Shift is only partially transferred until the source-to-decision composition, money hierarchy and reference inspection are corrected.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The required review actions and navigation remain visibly exposed, but this viewport is not ready for design sign-off. Fix the review assembly, payment hierarchy and reference-inspection affordance. Before release, verify that approval immediately debits $75.00 and records $63.75 for the creator, Request changes records a note while preserving the original, and Reject and navigation work; a capture cannot establish those mutation behaviors.

The shell, surfaces, typography families, status language and controls substantially carry Frame Shift into production, and the visible payment arithmetic is correct. This is a different workflow from the supplied Lab screen, so its records and controls should differ. The remaining problems are compositional and operational: the source assembly is fragmented, the commitment is unusually broad, the payment lacks the approved monetary hierarchy, and reference inspection is not visibly discoverable. The supplied video’s white frames are not a transfer failure.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The mineral canvas, 200px graphite rail, 32px desktop gutter and restrained reversed TapMart branding.
- Archivo page-heading treatment, readable operational copy, literal Submitted status and flat, shadow-free working surfaces.
- The contained submitted file on graphite, native playback and fullscreen controls, and source-ratio reference thumbnail.
- Creator identity, recorded provenance, View person and the explicitly attributed note.
- The white decision surface, cobalt primary action and commitment edge, amount-bearing approval button, Request changes and distinct Reject action.

## Expected differences (real data)

- Demo Coffee Co., Jasmine Reed, the submission date, recorded creator provenance and notification counts correctly replace the Lab’s fictional records.
- Campaigns selection, Campaign back navigation and Submitted status are appropriate for submission review; Content tabs, scheduling fields and shoot records do not belong on this screen.
- The portrait submitted video legitimately replaces the Lab’s landscape photography. Its white frames are the actual supplied file, not a missing-media defect.
- The reference, brief checklist and attributed creator note are appropriate workflow-specific content. The note’s claimed 22 seconds and the player’s 0:17 should remain distinct rather than being silently reconciled.
- Approve and pay $75.00 correctly expresses immediate payment. The displayed $63.75 creator receipt correctly deducts the 15% fee from $75.00 rather than adding it to the business’s charge.

## Drift and usability

1. [drift] **Give the real $75.00 its own stationary monetary line: Archivo 700, 44px/48px, tracking -0.025em, tabular lining numerals, #151B23. Use a 14px/20px label such as “Paid now on approval”; put “Jasmine Reed receives $63.75 after the 15% fee” and the current campaign credit on separate supporting lines. Keep “Approve and pay $75.00” and source every amount from the existing payment calculation.** (Your decision panel, beginning at approximately x728, y337). The payment is currently only a bold body-sized value inside a two-line paragraph. The $17,887.00 credit balance receives almost the same treatment, so the actual commitment does not anchor the decision.
2. [drift] **At 1440px, retain the 200px rail and 32px main gutters, and use grid-template-columns: minmax(0, 1fr) 336px with gap: 24px. This yields an 816px source assembly and the Lab’s narrow 336px operational column. Place the reference and brief checklist beside the submitted player within the source assembly with a 24px gap. Keep creator provenance, note and decision together in the right column, aligned to the source assembly’s top. Preserve intrinsic media ratios with object-fit: contain; do not stretch the portrait file into a landscape hero.** (Main review assembly below Submitted video). The 315×420px player ends near x547, while the decision starts at x728 and spans 640px. Reference and checklist are pushed beneath the player. The result reads as an isolated player beside a broad paragraph strip, rather than a complete source assembly joined across a deliberate 24px boundary to a narrow decision plane.
2. [usability] **Add an explicit ink-colored “Open reference” control with a minimum 44px target beside or beneath the thumbnail. Open the same reference record at an inspectable size, preserve its full ratio, and expose native playback controls if its actual media type is video. Do not introduce cobalt for this secondary inspection action.** (Reference thumbnail, currently around x232, y636). The reference is only about 96×171px and has no visible open or playback affordance. Reviewers cannot confidently inspect framing, branding or shot order from that thumbnail; an undisclosed image click is insufficient.
