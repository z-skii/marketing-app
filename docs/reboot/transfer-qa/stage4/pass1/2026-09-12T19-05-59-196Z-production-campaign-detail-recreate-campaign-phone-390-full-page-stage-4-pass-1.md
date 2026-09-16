# Transfer QA: Production Campaign detail, Recreate campaign (phone 390, full page), stage 4 pass 1

Production: `m-business_campaigns_f28f4d7d_117e_45b6_bf83_fc067318e101-full.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:05:59.196Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. One Recreate campaign on a phone: the reference, the pay, the facts, Needs you (a video to review), the submissions with their literal states, settings deeper. The tab bar is pinned to the document end for this full-page capture only.

**Verdict.** Frame Shift was partially transferred and the core workflow remains visible, but the missing Recreate joint and two clear usability defects prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The core campaign workflow remains visibly exposed, but this 390px screen needs the Recreate joint, reference-inspection affordance and status-spacing fixes before sign-off. A capture cannot verify navigation, playback, settings expansion or payment execution.

This is a credible partial transfer: the mineral surfaces, typography families, restrained record styling, source ratio, money semantics and navigation largely survive. The production-specific hierarchy—reference, pay, facts, Needs you, submissions, then settings—is appropriate and should not be replaced with the Lab's Content layout. However, the defining Recreate composition is missing: media and commitment remain disconnected canvas content. The absent visible reference-inspection affordance and concatenated submission metadata are concrete usability defects, not differences caused by real data.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 7 |
| uniqueness | 5 |
| clarity | 7 |
| premium feel | 6 |
| fidelity | 6 |
| usability | 7 |
| brand recognition | 6 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, white working surfaces, restrained dividers and shadow-free records closely follow the approved language.
- Keep the 16px phone gutters, strong page title and section headings, muted operational copy and 4px reference-media corners.
- Preserve the intact portrait source; do not crop or enlarge it merely to fill the empty space beside it.
- Keep the payment basis directly under the amount and maintain the distinction between campaign pay, paid so far and available credit.
- Keep the prominent Needs you action, literal submission states and campaign settings behind Show.
- Keep Campaigns visibly selected, all five navigation destinations and the separate Create action. The document-end tab bar is intentional for this capture.

## Expected differences (real data)

- The Lab shows desktop Content, not this campaign-detail workflow. The business header and five-item phone navigation correctly replace its desktop rail; caption editing, shoots and scheduled posts do not belong here.
- Demo Coffee Co., its D initial, the campaign title, Raleigh location and Open state are production records, not mismatches with Loopday Coffee.
- The portrait reference correctly retains its own ratio rather than adopting the Lab's landscape photograph.
- The $75.00 rate, 0 of 8 approvals, $0.00 paid, September 20 deadline and $17,887.00 credit are legitimate campaign-specific facts.
- Jasmine Reed's Submitted record and demo-creator's Changes requested record correctly replace the Lab's delivered-file states. Video submissions need not resemble its still-image gallery.
- Review 1 video is the appropriate overview action. Immediate approval and its payment amount belong in submission review, not on this campaign overview.

## Drift and usability

1. [drift] **Apply the approved Recreate joined-split treatment to the existing reference and payment assembly. Use #101820 for the source housing, #F6F8FB/#B3C0CE for its captions, and attach a square-edged payment/facts plane with the single 12px phone source-to-commitment offset. Use #2450E8 at the commitment edge, retain 16px page gutters and 4px image corners, and add no shadow. Keep the actual reference ratio and all existing financial values. Do not treat the separate Needs you border as a substitute for this joint.** (Reference image through the $75.00 payment and campaign facts). The reference, caption, payment and facts currently form an ordinary left-aligned stack on the same mineral canvas. There is neither a graphite source plane nor the defining 12px source-to-commitment relationship. The cobalt edge appears only much later on Needs you.
1. [usability] **Expose inspection of the same stored reference through a visibly labelled Open reference control with a minimum 44×44px target. Use ink on a light surface or #F6F8FB on graphite. If the stored reference is video, expose an opaque 24px Play icon within a minimum 44×44px labelled target and open that actual video; do not infer video from the poster or introduce replacement media.** (Campaign reference image and caption). The narrow reference is visible, but the capture provides no identifiable inspection or playback control. Its caption explains its purpose without showing how to examine the source.
2. [usability] **Separate each status, date and review link into distinct elements. Use display:flex, flex-wrap:wrap, column-gap:8px and row-gap:4px; retain IBM Plex Sans 14/20px metadata, #845600 for the waiting states and #526171 for dates. Allow metadata to wrap below the creator identity rather than concatenating text.** (Metadata beneath Jasmine Reed and demo-creator). Both rows visibly join independent fields: SubmittedSep 12, 2026 and Changes requestedSep 10, 2026. This damages scanning precisely where the business must distinguish records requiring review from records awaiting changes.
2. [drift] **Set the campaign detail payment to Archivo 700 at 36/40px, tracking -0.025em, with tabular lining numerals. Keep per approved video at IBM Plex Sans 14/20px and preserve $75.00 exactly. Do not animate the amount or imply that the campaign total is held.** ($75.00 and its payment-basis caption). The amount reads at approximately the 30px opportunity-pay scale, comparable to the page title, rather than the specified 36px phone detail-payment scale. It is prominent, but the money anchor is still undersized.
