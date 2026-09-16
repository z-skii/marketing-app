# Transfer QA: Production Campaign detail, car campaign (desktop 1440), stage 4 pass 1

Production: `d-business_campaigns_e4000000_0000_4000_8000_000000000020.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:06:31.885Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. One car campaign: the placement diagram and the artwork (as artwork) anchor the left with the pay, real progress and credit; the right answers Needs you (drivers to review, a car ready to install), drivers who applied with Accept and Decline (accepting books the car, pays nothing), cars on the campaign with their literal stage, and Campaign settings kept deeper.

**Verdict.** The visible business workflow survives, but Frame Shift is not yet faithfully complete enough for desktop release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes the expected campaign workflow, but desktop visual sign-off should wait for the fixes below. Credit is below the captured area, and navigation, settings expansion and mutations cannot be verified from pixels. Verify that Accept only books, installation confirmation pays the first month, and driver photos remain inspection-only.

This is a substantial language transfer, not a generic reskin: the shell, mineral and graphite surfaces, flat records, typography, literal states and business actions largely survive. The Lab did not draw campaign detail, so its Content layout is not a required template. The material shortfall is the campaign-specific source-to-money relationship: a repeated vehicle image interrupts it, the monthly anchor sits too low, and the supplied artwork lacks visible inspection access. Those are transfer and usability corrections, not reasons to redesign the workflow.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 6 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The 200px graphite navigation rail, restrained reversed mark, mineral canvas, 32px app gutter and white working surface closely carry over the approved shell.
- The strong page title, clear section headings and quieter operational metadata preserve the approved typographic hierarchy outside the main payment anchor.
- Keep placement identification on the diagram and supplied artwork separate from vehicle photography. Do not introduce an installed-ad mockup or substitute model.
- Keep Needs you ahead of applications and booked cars, with Campaign settings progressively disclosed below.
- Keep Accept and Decline, including the explicit explanation that accepting books the car and pays nothing until installation is confirmed.
- Keep campaign Open and vehicle Ready to install as separate literal states, along with months paid and driver-photo count. No car proof-approval action is shown.
- Keep flat records, square structural surfaces, restrained borders and generously sized Accept/Decline controls.

## Expected differences (real data)

- This is campaign detail, not the Lab’s Content overview. Campaigns selection, back navigation, driver applications, installation review and deeper campaign settings are appropriate replacements for the Lab’s tabs and content-review controls.
- Demo Coffee Co., its D initial, and the message and notification counts reflect production records; they should not be replaced with Lab identities or fixture labels.
- The placement diagram, supplied Demo Roastery artwork and actual vehicle photographs correctly replace the Lab’s delivered-content photography. Artwork remains artwork rather than being fabricated onto a car.
- The 2019 BMW application, unverified-car text, and 2017 BMW booking with Ready to install, zero months paid and one driver photo are legitimate operational states.
- The $250.00 monthly rate, zero of three cars on the road, $0.00 paid and 60-day duration are campaign data, not discrepancies against the Lab.

## Drift and usability

1. [drift] **Remove the repeated 104×71px vehicle thumbnail and its caption from the campaign-level left summary; retain that vehicle in Cars on this campaign. Join the diagram/artwork assembly to a monthly financial caption with the desktop 24px horizontal offset: margin-inline-start:24px; width:calc(100% - 24px); background:#FFFFFF; padding:16px; border-radius:0; box-shadow:none. Set the main monthly amount to Archivo 700, 44px/48px, tracking:-0.025em with tabular lining numerals. Keep the monthly basis at 14px/20px and existing progress and credit immediately below, with 8px row gaps and unchanged backend values.** (Left source assembly and campaign financial summary, x232–680.). The left side currently becomes a long stack of diagram, artwork, repeated vehicle photo and then money. The amount begins around y772, with progress at the bottom edge and credit outside the capture. There is no identifiable 24px source-to-financial joint, and the detail payment reads closer to opportunity-sized type than the approved desktop detail anchor.
2. [usability] **Add a visible ink View artwork action beside or beneath the artwork provenance, using IBM Plex Sans 600 at 16px/20px and a minimum 44px hit target. Open the actual supplied asset through the existing inspection viewer or original-file route. Preserve its intrinsic aspect ratio with object-fit:contain and 4px media corners; do not crop, recreate or enlarge its embedded typography independently.** (Demo Roastery artwork and Your artwork, shown as artwork caption.). The artwork is displayed at approximately 200×100px, making most of its supplied copy unreadable. There is no visible inspection affordance. The image may already be clickable, but the capture does not communicate that, unlike the Lab’s explicit Open original action.
2. [drift] **Set the Review 1 driver navigation link to #151B23 and remove the Needs you panel’s 3px cobalt border-left. Use ink for the installation link too if it navigates to booking review, retaining its arrow and 44px target. Reserve #2450E8 for the actual primary commitment controls, including Accept and the payment-confirmation control at its decision point.** (Needs you panel, x728–1368, y192–336.). The panel combines a decorative cobalt rule with repeated cobalt navigation links. Reviewing a driver is inspection, not commitment, and the rule is neither a selected edge nor a source-to-payment joint. This spreads the accent beyond the approved hierarchy.
