# Transfer QA: Production Recreate creation flow, funding with insufficient credit (desktop 1440, full page), stage 4 pass 1

Production: `d-create_recreate_6_funding.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:04:26.154Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The same funding plane when campaign credit does not cover one payment: the amount to add is stated, Add credit opens the top-up, and the flow can continue without publishing (save as draft). Nothing is hidden.

**Verdict.** The real funding workflow appears intact, but Frame Shift is only partially transferred; strengthen the money hierarchy, restore the 24px source joint and expose reference inspection before signing off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes the required records, funding calculation, top-up entry point and non-publishing continuation. No functional regression is visible, but a screenshot cannot verify that Add credit opens the top-up or that continuation preserves the campaign as a draft. Correct the hierarchy and source joint, then test those actions before release sign-off.

The transfer preserves the approved shell, surface temperature, typography families, source honesty and financial semantics. All required funding facts and escape controls remain visible within the captured desktop viewport. However, the payment lacks the approved money hierarchy, the insufficient-credit instruction is compressed into metadata, and the oversized separation weakens the defining source-to-commitment joint. These are language-transfer issues, not differences caused by real records or by this being a creation flow rather than the Lab’s Content screen.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 6 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite navigation rail, restrained mark, flat white financial surface and shadow-free records.
- Archivo heading treatment, IBM Plex operational copy, 32px main left gutter and familiar labelled navigation.
- The intact portrait reference at its source ratio, without a landscape crop or invented video treatment.
- The complete financial breakdown and explicit explanation that publishing holds nothing and credit leaves only when work is approved.
- Visible Add credit, Continue without publishing and Back controls; insufficient credit does not conceal the non-publishing path.
- The square funding plane, cobalt commitment edge and restrained row dividers.

## Expected differences (real data)

- Demo Coffee Co., its initial avatar and notification counts replace the Lab’s fictional business records.
- The uploaded portrait-format reference, campaign brief, Raleigh location and deadline are real campaign inputs; they should not resemble the Lab’s delivered-content fixtures.
- Create is correctly selected, and Step 6 of 7 exposes funding controls rather than the Lab’s Content tabs and approval actions. The Lab did not specify this workflow’s exact layout.
- The insufficient-credit state correctly shows $10.00 available, a $50.00 publishing threshold and a $40.00 shortfall.
- Ten $50.00 payments total $500.00; $490.00 would cover all remaining exposure. The creator’s $42.50 receipt correctly deducts the 15% fee from the payout rather than adding it to business pay.

## Drift and usability

1. [usability] **Render the $50.00 pay anchor in Archivo 700 at 44/48px with tabular lining numerals and -0.025em tracking; keep its payment basis at 14/20px. Move the shortfall out of the crowded publishing-threshold value into a separate line reading “Insufficient credit · Add $40.00 to publish,” using IBM Plex Sans 600 at 18/24px and #845600 for the attention status. Keep $500.00 and $490.00 secondary at 16/24px, with their existing conditional labels. Preserve every calculation and the no-hold explanation.** (Funding plane: Pay, Needed to publish and shortfall rows.). The principal payment is currently approximately 18px, scarcely stronger than ordinary row values. The actionable $40.00 shortfall is small red text appended to “$50.00 one payment,” while the optional $500.00 total receives comparable emphasis. This makes the immediate funding decision unnecessarily hard to scan.
2. [drift] **Set the desktop source-to-funding column gap to 24px rather than the current 48px. Retain the existing 448px source/summary column, but end-align the 240×427px reference within it so its right edge meets the source-column edge; the funding plane should then begin 24px later. Keep the portrait’s source ratio, 4px corners, and the financial plane’s 0px radius and absence of shadow.** (Desktop relationship between the reference column and funding plane.). The summary ends around x680 and funding starts at x728, while the photograph ends at x472. The resulting 256px image-to-commitment separation reads as two unrelated columns rather than Frame Shift’s source-to-decision relationship. The Lab demonstrates a close 24px source/work-plane relationship, not this detached composition.
2. [usability] **Expose an ink-labelled “Open reference” control in the existing reference-caption area, using IBM Plex Sans 600 at 16/20px and a minimum 44px target. Open the saved uploaded source at inspectable size. If the image already has that handler, retain it and add the visible labelled affordance rather than introducing a second behavior.** (Reference image and caption.). The reference is identifiable, but the capture shows only “Your reference” beneath it and no visible inspection affordance. Users should be able to check the exact supplied source before committing funding without relying on an undisclosed image click.
