# Transfer QA: Production Car creation flow, placement step (desktop 1440, full page), stage 4 pass 1

Production: `d-create_car_1_placement_two.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:04:06.313Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Placement first, chosen on a diagram; two placements chosen here. The diagram never shows an ad on a real car. The left side shows the chosen placements on the diagram.

**Verdict.** Frame Shift largely transferred and the visible workflow survived, but hidden row-selection state and the oversized source-to-decision gap prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The visible workflow and navigation remain exposed, but release should wait for legible selection state and the corrected desktop joint. Then verify mouse and keyboard toggling, synchronization with the large diagram, and preservation of both selected placement IDs through Continue and back navigation. A capture cannot establish those runtime behaviors.

The shell, surfaces, typography and control styling substantially match Frame Shift: graphite rail, mineral canvas, strong headings, muted step text and a restrained cobalt primary action. The 448×300px diagram is intact and honestly schematic, and the placement-first workflow appropriately introduces no money or invented backend status. Navigation and the principal action remain visible. The transfer falls short at the meaningful joint and at selection feedback: the columns are separated by 48px rather than 24px, and none of the six option rows visibly identifies the two selected placements.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 6 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 6 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The mineral canvas, graphite navigation rail, white diagram surface, restrained TapMart mark and shadowless structural regions.
- The 200px desktop rail, 32px left content gutter, strong application heading and readable operational typography.
- The intact landscape diagram and explicit diagram caption, without invented vehicle media, models or installed advertising.
- The Create back link, literal Step 1 of 9 indicator, six named placement options and prominent cobalt Continue button.

## Expected differences (real data)

- Demo Coffee Co., its D initial, and the message and notification counts are production account data, not the Lab’s Loopday Coffee fixtures.
- Create is correctly selected. The placement step, six placement options and Continue action replace the Lab’s Content workflow; this creation screen had no literal Lab counterpart.
- The large diagram correctly shows two chosen placement regions. A schematic—not artwork projected onto a real vehicle—is appropriate here.
- Placement comes before financial terms, so the absence of a monthly amount or payment action is appropriate at this step.

## Drift and usability

1. [usability] **Bind an explicit checkbox in every placement row to its actual stored selection state; exactly two must be checked in this capture. Use a 20px checkbox within a minimum 44×44px target, #788595 unchecked boundary, and #2450E8 checked fill with a white tick. Associate the full row label with the checkbox. Add “2 placements selected” beneath the instruction in IBM Plex Sans 14/20px, updating from state. Reserve cobalt diagram highlighting for selected options; use #E7E7E2 fill and #526171 outlines for unselected option-preview highlights. Preserve visible keyboard focus at 3px cobalt with a 3px offset.** (Placement list on the right, from Rear window through Full vehicle wrap.). Two placements are chosen, but all six rows have identical backgrounds, dividers and label treatment, with no visible checked state. Every thumbnail also contains blue highlighting. The large diagram cannot reliably communicate which named rows are selected, particularly because the Driver door and Passenger door thumbnails look alike.
2. [drift] **Set the source-to-placement desktop grid gap to var(--tm-shift-desktop), 24px, instead of 48px. At this viewport, retain the 448px diagram column starting at x232 and start the decision column at x704 rather than x728. Use grid-template-columns: 448px minmax(0, 1fr); column-gap: 24px. Retain square structural edges and no shadow.** (Horizontal joint between the large placement diagram and the placement-selection column.). The diagram ends at approximately x680 and the placement column begins at x728. That 48px separation reads as two independent columns rather than the approved 24px source-to-decision relationship.
