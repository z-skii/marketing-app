# Transfer QA: Production Story creation flow, creative step (desktop 1440, full page), stage 4 pass 1

Production: `d-create_story_1_creative.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:04:03.613Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The supplied 9:16 creative is the first decision and stays in view. It can be replaced; drafts from the creative library are never offered, only approved creatives.

**Verdict.** The visible workflow is preserved and the shared styling is largely correct, but the detached source-to-decision composition and Story inspection treatment need correction before Frame Shift sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes the selected creative, replacement, continuation, back navigation and business context; no functional break is visible. It does not establish that these actions work, that replacement offers approved creatives only, or that the selected creative remains visible through subsequent steps. Fix the visible composition and inspection issues, then verify those behaviors before release.

The supplied Lab image is a Content overview, not an approved drawing of this wizard, so its tabs, review fields and file actions are not parity requirements. The production screen successfully transfers the shared shell, neutral surfaces, typography hierarchy, restrained controls and intact source ratio. The principal failure is spatial: a narrow creative is separated from its decision by approximately 256px rather than forming the desktop Frame Shift joint. The rounded sheet and missing visible inspection affordance further weaken the Story-specific treatment. No payout, fee or backend-status misrepresentation is visible.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 6 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 6 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite navigation rail, restrained reversed TapMart mark and 32px desktop content gutter.
- The clear application-title and section-heading hierarchy, muted progress text and short operational explanation.
- The complete approximately 240×427px, 9:16 creative, without cropping, editing or a landscape media container.
- Replace the creative as an outlined secondary action and Continue as the cobalt primary decision, both with approximately 48px-high targets.
- Back to Create, the selected Create navigation item, business switching and the persistent application navigation.
- Progressive disclosure: no premature payment, funding or publication claims on the creative-selection step.

## Expected differences (real data)

- Demo Coffee Co. and its D initial correctly replace the Lab business identity; no fixture branding or additional demo label is needed.
- The selected coffee promotion is the actual supplied creative. Its typography, green price and embedded copy must remain unchanged; the $4 offer is artwork content, not creator payout.
- Messages and Notifications expose real unread counts of 2 and 7, unlike the Lab capture.
- Step 1 of 8 describes the creation workflow. The Lab’s delivered-file, approval and publishing statuses do not belong on this step.

## Drift and usability

2. [drift] **Replace the oversized source track with a desktop grid using a 240px source column, a 360px commitment column and a 24px column gap. Keep the source at x=232px and start the decision region at x=496px, rather than x=728px. Apply the 24px desktop source-to-decision offset to that region: with the creative starting at y=160px, its progress label should start at y=184px. Preserve the existing 32px page gutter and avoid adding a surrounding card or decorative notch.** (Desktop creative-and-decision assembly). The creative ends at x≈472px, but the decision begins at x≈728px, leaving about 256px of unused separation. The progress label also begins above the source. This reads as two unrelated columns rather than the approved free Story sheet beside a narrow, attached decision region.
2. [drift] **Set the supplied Story sheet and its clipping wrapper to border-radius: 0px. Apply the approved source-only shadow, 0 6px 16px #10182018, while retaining the 9:16 intrinsic ratio, full uncropped image and unmodified artwork. Do not apply this shadow to the surrounding form or navigation.** (Selected Story creative at x≈232px, y≈160px). The supplied creative currently has visibly rounded media corners and lacks the approved sheet treatment. Story is the explicit square-corner exception to ordinary 4px source media.
2. [usability] **Expose an ink-labelled Open original control below the creative, with a minimum 44×44px target, opening the same selected asset in the existing source viewer or at its original URL. Retain the current preview and replacement action; do not introduce cropping or editing.** (Creative preview and caption). At 240px wide, the creative’s small print is difficult to inspect, and no visible original-size inspection action is available. The source must be inspectable before the business commits to posting it unchanged.
