# Transfer QA: Production Campaigns (desktop 1440), stage 4 pass 2

Production: `d-business_campaigns.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T06:39:02.531Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. Pass 2 after fixes: Create is three source-to-commitment joints with an unmodified car photo and the placement on a diagram; every flow keeps the 24px desktop joint (12px on phones) between the source column and the decision column, attaches the pay to the source as a commitment caption, exposes Open reference, Open creative and View artwork controls, and states publishing credit literally; placement rows have visible checkboxes and a count; the funding plane leads with the amount and states any shortfall on its own line; Campaigns rows share one geometry with ink inspection links and labels from the real car step; campaign detail uses the approved joined-split source with the commitment plane; review screens use a wide source assembly and a narrow decision plane with the amount as the anchor and open controls for every file; the rear window is drawn as the rear windscreen. The demo Recreate submission is a real white-frame webm; that is the file. Check especially: financial meaning is accurate; approval wording matches the real financial consequence; no UI implies funds are escrowed or reserved; the creator-side platform fee is represented correctly; car installation and payment language is literal; the campaign credit state is understandable; progressive disclosure stays simple; Frame Shift fidelity is preserved; the composition works at the captured viewport; no generic form or dashboard drift. Three views: Active, Review, Completed with real counts. Rows led by the campaign's own media (reference or creative at 9:16, the vehicle photo, or the placement diagram), the kind and audience, the literal status, real progress, the one thing waiting on the business in cobalt, and the pay with its unit. Rows that need a decision come first with a cobalt edge. No summary tiles.

**Verdict.** Frame Shift is substantially transferred and visible functionality is preserved, but the shared desktop row geometry needs one correction before sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold desktop design sign-off for the localized shared-row geometry correction. The capture exposes real records, states and actions, but does not establish that tabs, navigation or payment mutations execute correctly.

The supplied Lab capture is Business Home, not a Campaigns template, so its discovery shelves should not be copied here. Production successfully transfers the shell, typography hierarchy, restrained surfaces, source-led records and anchored financial reading. The visible amounts have clear payment bases; nothing suggests escrow, reserved funds, an added business-side platform fee or approval of car photos. The remaining transfer issue is the desktop source-to-decision spacing and inconsistent alignment within the highlighted row, not the real content or workflow language.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The graphite navigation rail, restrained mark, mineral canvas, 32px desktop content gutter and strong application heading.
- Flat, divider-separated campaign rows without summary tiles, elevated cards or decorative framing.
- Portrait Story and Recreate previews and landscape vehicle photographs retain distinct source proportions; no advertisement is fabricated onto a car.
- Prominent money with explicit units: per approved Story, per approved video, and per car, per month.
- Literal status and progress alongside a specific next inspection action; repeated inspection links correctly remain ink.
- Visible Active, Review and Completed counts, selected navigation edges, and existing business navigation.

## Expected differences (real data)

- Demo Coffee Co., its initial, and the message and notification counts correctly replace the Lab workspace fixtures.
- Active 7, Review 5 and Completed 2 expose production campaign states rather than the Lab’s discovery categories.
- Campaign names, supplied creatives, reference previews, vehicle photographs, amounts and progress reflect real records. Preserve these, including any existing '[demo]' title prefix.
- Review driver, Check proof, Send artwork and Review video appropriately differ by the actual campaign workflow.

## Drift and usability

2. [drift] **Use one shared row grid: 84px source track, 24px desktop column gap, flexible facts column and an end-aligned money column. Reserve a 3px leading border on every row, transparent when inactive, with 12px inner leading padding. At this viewport, retain media at x247 and the money right edge at x1048; move the facts/action column from x343 to x355. Remove the highlighted car row’s separate horizontal insets so its media, facts and money use those same anchors. Preserve intrinsic media ratios and keep the 12px source-to-fact gap for phones only.** (Campaign list source-to-fact boundary and the highlighted 'Car ad on 2017 BMW 328i' row.). The landscape source ends around x331 and its facts begin at x343: a 12px joint at desktop rather than 24px. The highlighted BMW row also shifts its source and text roughly 4px left and its money edge roughly 8px left compared with adjacent rows, despite the required shared geometry.
