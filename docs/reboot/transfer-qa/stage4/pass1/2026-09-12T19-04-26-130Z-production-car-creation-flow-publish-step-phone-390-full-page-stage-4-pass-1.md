# Transfer QA: Production Car creation flow, publish step (phone 390, full page), stage 4 pass 1

Production: `m-create_car_9_publish.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:04:26.130Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The last step: name, what drivers are told (written from the choices, editable), the facts, and Publish or Save as draft. The artwork uploaded earlier is shown as artwork under the diagram. The tab bar is pinned to the document end for this full-page capture only.

**Verdict.** Frame Shift's surface treatment and visible workflow survived, but its source-to-monthly-commitment composition and final-step usability have not transferred faithfully enough to ship.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The visible workflow and its actions survive, but this capture is not ready for release. Correct the navigation overlap, repeated review content, missing monthly commitment joint and ambiguous funding label, then recapture at 390px. A screenshot cannot verify draft persistence, publication, credit checks or payment mutations.

The supplied Lab is a desktop Content screen, not a drawing of this phone creation step, so fidelity must be judged against the approved language and this workflow's purpose. Production successfully carries over the mineral/white surfaces, operational typography, restrained controls and honest separation of diagram from artwork. However, the composition remains a long, flush stack: eight facts precede the form and are repeated afterward, the monthly money lacks its attached commitment hierarchy, and navigation visibly covers final facts and financial copy. The real editable fields, campaign values, draft/publish actions and navigation remain present; no missing backend capability can be established from the pixels.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 5 |
| media quality | 7 |
| uniqueness | 5 |
| clarity | 6 |
| premium feel | 6 |
| fidelity | 6 |
| usability | 5 |
| brand recognition | 6 |
| ai slop risk | 2 |

## Keep

- Mineral canvas, white working fields, ink and muted text, restrained cobalt, and the absence of floating app-card shadows.
- The landscape placement diagram with selected regions clearly marked; no advertising is fabricated onto a real vehicle.
- Artwork displayed beneath the diagram, at its own ratio and without a mock installation.
- Visible labels, editable generated instructions, bordered inputs and distinct Publish campaign, Save as draft and Back controls.
- Business switching, search, messages, notifications and the five labelled navigation destinations, with Create selected.
- The conditional wording on the $750.00 monthly total rather than presenting it as a charge due at publication.

## Expected differences (real data)

- Demo Coffee Co., its D initial, and the message and notification counts are production account data, not replacements that need to match Loopday Coffee.
- Raleigh, NC; Rear window and Driver door; 30 days; Any car; and 3 cars are legitimate campaign choices.
- $250.00 per car per month and $750.00 if all three cars are on the road are internally consistent real amounts.
- The uploaded Demo Roastery artwork is correctly presented as supplied artwork, separate from the placement diagram. Its embedded wording should not be rewritten to resemble the Lab fixture.
- This workflow correctly exposes campaign naming, editable driver instructions, draft saving and publishing rather than the Lab's content-approval actions.

## Drift and usability

1. [responsive] **For the full-page capture, place the tab bar after the complete main/form content in document flow: position: static; inset: auto; margin-top: 24px. Remove any capture-only positioning against an intermediate container. For the normal fixed phone bar, reserve bottom padding equal to its rendered height plus env(safe-area-inset-bottom) plus 16px. No fact, funding sentence or action may sit behind the bar.** (Bottom navigation crossing the final campaign facts and funding explanation). The bar crosses the final facts around City and obscures the beginning of the financial explanation, while Save as draft and Publish campaign appear below it. This is content occlusion, not merely the permitted document-end capture treatment.
2. [usability] **On step 9, remove the earlier eight-row persistent summary. Put 'Step 9 of 9 · Review' and 'Ready to publish' directly below the page title with a 16px gap, followed by the campaign name and editable driver instructions. Keep one source-and-facts assembly below those fields, then the funding explanation and actions. Use 24px between these groups and retain 16px phone gutters.** (Content order from Car advertising through Ready to publish and the repeated facts). The user must pass the diagram, artwork and eight summary rows before discovering the current step or reaching the name field. Nearly the same facts appear again below the fields. This makes the last step unnecessarily long and buries its actual task.
2. [drift] **In the consolidated review assembly, retain the diagram followed by the artwork, then attach a white monthly commitment caption at the source-to-fact boundary using margin-left: 12px; width: calc(100% - 12px); margin-top: 0; border-radius: 0; box-shadow: none. Set $250.00 in Archivo 700 at 30/34px with tabular lining numerals and -0.02em tracking. Set 'per car, per month' in IBM Plex Sans at 14/20px. Keep the conditional $750.00 total secondary at 16/24px and explicitly labelled for all three cars.** (Placement/artwork source assembly and monthly payment presentation). The source, repeated facts and form currently share one flush vertical alignment, with no meaningful 12px joint. The $250.00 rate has approximately the same emphasis as duration and location, while $750.00 is ordinary table text. The approved Car silhouette needs an attached monthly caption and a clear monetary anchor, not another generic summary row.
2. [data_honesty] **Replace 'Funding — Covered for one month' with 'Publishing credit — Enough for one payment' only when the actual available credit is at least $250.00. Otherwise show the actual shortfall. Add visible copy: 'Publishing needs credit for one $250.00 payment. Nothing is held when you publish. Confirming an installation pays the first month.' Keep this explanation above the action group and outside navigation overlap.** (Funding summary and pre-publication financial explanation). 'Covered for one month' does not distinguish one $250.00 payment from a $750.00 month covering all three cars, or available credit from committed funding. The capture does not demonstrate an incorrect charge, but the status wording is insufficiently literal for this publish rule.
3. [usability] **Keep the artwork preview at its supplied ratio with object-fit: contain and 4px corners. Add an ink 'View artwork' control with a minimum 44×44px target that opens the same uploaded asset in the existing viewer or original-file route. Do not crop it, redraw it or project it onto the vehicle.** (Uploaded artwork beneath the placement diagram). The roughly 160×80px phone preview identifies the creative, but its smaller text cannot be reviewed and no inspection control is visible. The Lab exposes Open original, and the approved system requires the actual source to remain inspectable.
