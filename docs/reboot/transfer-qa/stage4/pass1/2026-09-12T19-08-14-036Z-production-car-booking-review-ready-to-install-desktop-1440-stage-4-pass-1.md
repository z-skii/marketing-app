# Transfer QA: Production Car booking review, ready to install (desktop 1440), stage 4 pass 1

Production: `d-business_campaigns_e4000000_0000_4000_8000_000000000020_cars_e4000000_0000_4000_8000_000000000023.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:08:14.036Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. One booked car: the driver's photo as uploaded, the booked placement on a diagram, the artwork as artwork; the driver, the facts (months paid from the real ledger), the one action the stage allows, here Confirm installation and pay the first month with the amount, and the driver's installation photo below. No approve-proof action exists, so none is drawn.

**Verdict.** The Frame Shift shell and core booking functionality survived, but placement accuracy, evidence inspection and the source-to-payment hierarchy need correction before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold release at this viewport for the corrections below. The capture exposes the booking records, navigation and correct payment action, but cannot verify their execution. Test that confirmation debits the displayed $250.00 once, records the first paid month and advances the actual booking state without a proof-approval step. Artwork continues below the capture; it is not proven missing.

This is a recognizable Frame Shift transfer rather than a generic replacement: surfaces, navigation, typography, restrained cobalt and honest booking facts are largely preserved. The visible payment semantics are also correct. However, the placement diagram contradicts the booked surface, installation evidence lacks an explicit inspection path, money is visually subordinate, and the desktop joint uses twice the approved separation. These prevent full fidelity and release sign-off without implying that the backend payment workflow is broken.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 7 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 6 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, restrained reversed TapMart mark, mineral canvas and 32px desktop content gutter closely match the approved language.
- The strong vehicle title, operational typography, muted metadata and literal amber Ready to install status.
- The approximately 448×299px vehicle photograph, presented without an invented advertising overlay or oversized media underlay.
- Square, shadow-free financial surfaces and the cobalt primary button with 8px corners and a visible payment amount.
- The explicit months-paid ledger facts and explanation that confirmation pays the first month from current credit.
- Driver photos remain evidence to inspect, not a separate approval workflow.

## Expected differences (real data)

- Demo Coffee Co., its D initial, Marcus Bell, @demo_marcus and the BMW imagery correctly replace the Lab’s fictional business and creative records.
- Ready to install, the booking and installation-photo dates, 0 months paid · $0.00, and $17,887.00 credit are production values, not content that should match the Lab.
- The car workflow correctly uses “Confirm installation and pay $250.00” instead of the Lab’s content-approval actions. No approve-proof action should be added.
- The uploaded vehicle photo, placement diagram, separate artwork and driver installation photo are appropriate source types for this screen. Artwork must not be composited onto the real car.
- Campaigns selection and the message and notification counts appropriately reflect the current production route and account.

## Drift and usability

1. [data_honesty] **Map the booked “Rear window” placement to the rear windscreen, not the rear passenger-side window. Use the corresponding rear-elevation diagram and highlight only the windscreen with #E7EDFF fill and a 2px #2450E8 outline. Keep the actual vehicle photograph untouched.** (Booked-placement diagram beneath the vehicle photograph.). The booking subtitle says Rear window, but the blue rectangle occupies the rear passenger-side glass in the side-view diagram. The installation guidance currently depicts a different surface from the named booking.
1. [usability] **Expose an ink-labelled “View installation photo” control beneath the thumbnail, using IBM Plex Sans 14/20px and a minimum 44px target. Make the thumbnail open the same original asset through the existing viewer or original-file route. Provide equally explicit inspection access for the vehicle photo and artwork; do not introduce an approval action.** (Photos from the driver and the other supplied-media inspection affordances.). The installation evidence is only about 151×113px, with no visible enlarge or original-file affordance. It cannot be meaningfully inspected at that size before a payment decision. The capture does not establish whether an undisclosed click interaction exists.
2. [drift] **Promote the booking amount within the existing confirmation plane to Archivo 700, 44px/48px, tracking -0.025em, with tabular lining numerals and #151B23 text. Show the current value as $250.00 with a 14px/20px “First month” label. Retain the monthly basis near the title and the amount-bearing confirmation button; use the real booking amount, not a hardcoded value.** (Monthly-pay subtitle and white confirmation region.). The payable amount appears only in small muted metadata, body copy and the button. Frame Shift’s financial anchor is missing: the vehicle title dominates while the imminent payment has no distinct monetary hierarchy.
2. [drift] **Set the source-to-facts grid column gap to var(--tm-shift-desktop), 24px, instead of the visible 48px. With the current 448px source starting at x232, the facts and commitment column should begin at x704 rather than x728. Preserve square planes and avoid adding decorative notches or shadows.** (Desktop boundary between the vehicle-source stack and driver/facts/payment column.). The source ends around x680 and the decision column begins at x728. That 48px separation weakens the approved desktop source-to-commitment relationship; the Lab uses a 24px source/working-plane separation.
