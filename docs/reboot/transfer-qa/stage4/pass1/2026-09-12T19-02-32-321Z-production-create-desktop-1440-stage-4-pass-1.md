# Transfer QA: Production Create (desktop 1440), stage 4 pass 1

Production: `d-business_create.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:02:32.321Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The chooser: three campaign kinds, each drawn from what drives it (a 9:16 reference and the creator's version for Recreate, the supplied creative on a phone for Story, the car and a placement diagram for Car). The whole composition is the link; setup happens one decision at a time inside the chosen flow.

**Verdict.** The shell transferred well and functionality remains visibly exposed, but the incomplete Recreate assembly, wrapped-car imagery and missing source-to-choice joint prevent Frame Shift sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes all three campaign kinds and the production navigation shell; it shows no clear functional removal. It cannot verify whole-composition activation, keyboard access, routing or downstream payment behavior. Fix the visible blockers, then smoke-test those interactions and the three existing creation flows before release.

The supplied Lab image is Business Home, not an approved Create layout, so its discovery tabs, people records and inventory shelves are not requirements here. Against the shared system, production transfers the mineral and graphite surfaces, desktop gutters, strong title, operational typography, restrained navigation and flat regions well. Payment semantics remain legible: approved video, Story posted and car per month are differentiated without invented amounts or statuses. Story is visually distinct, and Car retains a separate placement diagram. The substantive failures are the missing second Recreate source, its decorative cobalt bracket, the installed-wrap depiction on the car, and the absent 24px source-to-choice joint. Those are composition and honesty issues, not acceptable substitutions of real records for fixtures.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 4 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 6 |
| fidelity | 5 |
| usability | 7 |
| brand recognition | 7 |
| ai slop risk | 6 |

## Keep

- The mineral canvas, 200px graphite rail, restrained reversed mark and 32px desktop content gutter.
- The strong page-title hierarchy, readable operational copy and quiet payment-basis captions.
- Three open compositions without elevated cards, repeated borders or premature setup controls.
- Story's distinct phone-based silhouette and the separate placement diagram for Car.
- The business switcher, selected Create navigation state and persistent utility navigation.
- Keep each complete composition as the link into its existing flow; do not add competing setup buttons.

## Expected differences (real data)

- Demo Coffee Co. and its D initial correctly replace the Lab's fictional Loopday Coffee identity.
- The Messages and Notifications counts of 2 and 7 are legitimate production-state differences.
- This unconfigured chooser appropriately shows payment bases rather than invented campaign amounts, balances or approval states.
- The Lab's fictional-marketplace footer does not belong in production.

## Drift and usability

1. [data_honesty] **Replace the wrapped-car image with an unmodified, permissioned vehicle photo. Render it at its intrinsic aspect ratio, max-width: 376px, object-fit: contain and border-radius: 4px. Retain the separate approximately 132×88px placement diagram; use #E7EDFF for the selected placement fill and #2450E8 for its selected edge. Do not composite campaign artwork onto the photographic car. If no suitable photo exists, show a compact literal missing-photo state.** (Car chooser, photographic source at approximately x1032–1408, y140–391.). The large night scene depicts TapMart advertising already installed across a car. That contradicts the explicit separation between actual vehicle imagery and proposed placement, and reads as installed-ad proof rather than neutral inventory.
1. [drift] **Remove the empty cobalt bracket and supply the missing creator-version source beside the reference. Within the 376px column, use two 160px-wide media elements with aspect-ratio: 9 / 16, a 24px gap, object-fit: contain and 4px corners. Add truthful Reference and Creator version captions at 14/20px with an 8px media-to-caption gap. Use a permitted corresponding source, not a duplicate or fabricated result. If it is unavailable, replace the empty bracket with a compact literal 'Creator version not available' state.** (Recreate chooser, reference at x232–392 and empty arrow/bracket area around x408–464.). Only one 9:16 image is visible. The arrow points toward an empty cobalt outline, so the required reference-to-creator-version relationship is missing. The bracket is decoration in place of the object that should explain Recreate.
2. [drift] **Apply --tm-shift-desktop: 24px once at each source-to-choice boundary. Keep source assembly left edges at x232, x632 and x1032; move the corresponding campaign label, linked heading, description and payment-basis groups to x256, x656 and x1056. Reduce their available widths by 24px, preserve the shared text baseline and 32px right page gutter, and keep these regions unshadowed. Do not introduce a payment panel or fictional amount on this chooser.** (All three source assemblies and the decision/caption groups beginning around y469.). Every text group currently starts flush with its source's left edge. The Car diagram overlap is source-to-placement, not the source-to-decision joint. Consequently, the composition largely reads as three generic image-and-description columns rather than the approved spatial relationship.
