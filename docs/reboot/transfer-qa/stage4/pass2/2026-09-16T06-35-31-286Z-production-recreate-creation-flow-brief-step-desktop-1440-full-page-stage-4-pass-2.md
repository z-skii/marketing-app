# Transfer QA: Production Recreate creation flow, brief step (desktop 1440, full page), stage 4 pass 2

Production: `d-create_recreate_2_brief.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:35:31.286Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. A guided flow: the uploaded reference stays in view on the left with a ledger of decisions made; the right side asks one thing at a time. This step is the campaign brief the creators follow: name, what to do, must-include requirements, duration. A draft can be written for the business from the reference; it is presented as the campaign brief, never as an analysis result.

**Verdict.** The real brief flow appears intact and the shell is faithful, but the detached Recreate payment treatment prevents Frame Shift sign-off at this viewport.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold visual sign-off for the source/payment assembly and duration-control clarification. The capture exposes the expected brief functionality, but cannot verify reference opening, draft generation, persistence, validation or navigation. Publishing credit and creator-fee handling are not shown at this step.

The production shell, typography, controls and source-ratio media are close to the approved language, and the visible financial wording is accurate. The main failure is compositional: the portrait occupies the right edge of the source column while its payment floats independently at the far left, without Recreate’s graphite/cobalt commitment caption. All brief controls remain visible within the full-page capture, with no horizontal clipping or apparent loss of navigation.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 9 |
| uniqueness | 6 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, restrained TapMart mark, 32px application gutter and mineral canvas closely reproduce the approved shell.
- The source ends at x680 and the brief begins at x704, preserving the 24px desktop source-to-decision gap.
- The portrait reference retains its approximately 9:16 ratio, restrained corners and visible ink Open reference action.
- The $50.00 amount has strong hierarchy. '$50.00 per approved video' and '$500.00 if all 10 spots are approved' communicate conditional payment accurately without implying a deposit or reserved funds.
- Your campaign brief and Draft it for me frame the generated text as editable campaign instructions, not an analysis result.
- Visible field labels, substantial input heights, focus indication, removable requirements, custom requirement entry, duration inputs, Continue and Back preserve the working brief flow.

## Expected differences (real data)

- Demo Coffee Co., its D initial, and the message and notification counts replace the Lab’s fixture account and states.
- The uploaded portrait image is a valid Recreate reference. It should remain intact rather than imitate the Lab’s landscape delivered photograph or gain invented video controls.
- The campaign name, instructions, requirements, 15–25-second duration, $50 payment and ten spots belong to the production draft.
- Create selection, Step 2 of 7, and brief-editing controls correctly replace the Content navigation and review actions illustrated in the Lab. The Lab did not specify this creation screen.

## Drift and usability

1. [drift] **Keep the brief at x704 and the 24px column gap. Consolidate the reference and payment into one right-aligned, 240px-wide source assembly ending at x680. Preserve the current uncropped 240×427px image. Attach the payment caption directly beneath the image with margin-top: 0, width: 100%, box-sizing: border-box, padding: 24px, border-radius: 0 and box-shadow: none. Use #101820 for the source housing and #2450E8 with #F6F8FB text for the Recreate commitment caption. Retain the amount at Archivo 700, 44/48px and payment conditions at IBM Plex Sans 14/20px. Place provenance and the ink Open reference control below that assembly with 16px spacing, followed by the existing ledger.** (Left reference and payment assembly: image at x440–680, y160–587; payment beginning near x256, y694.). The image starts at x440, but the amount starts at x256, roughly 100px below the image’s bottom and separated by provenance and inspection controls. Without an attached graphite/cobalt commitment treatment, the source and money read as unrelated objects on the canvas. The correct 24px column gap alone does not complete Recreate’s signature.
2. [usability] **Make the Shortest and Longest inputs the sole editable duration constraint. Render the existing '15 to 25 seconds' summary as non-removable text derived from those inputs, using IBM Plex Sans 14/20px, and remove its × control. Keep removal controls for independent must-include requirements. Preserve the current 15 and 25 values.** (Must include duration chip and the Shortest/Longest fields below it.). Duration appears both as a removable Must include chip and as an editable numeric range. The two presentations currently agree, but the removal affordance makes it unclear whether deleting the chip removes the duration condition while the numeric limits remain.
