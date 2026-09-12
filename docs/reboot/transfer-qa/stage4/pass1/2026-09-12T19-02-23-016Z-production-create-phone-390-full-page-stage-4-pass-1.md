# Transfer QA: Production Create (phone 390, full page), stage 4 pass 1

Production: `m-business_create-full.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T19:02:23.016Z
Instructions: Stage 4 transfers the approved Frame Shift Design Lab to production for the business workflows: Create, the three campaign creation flows, Campaigns, campaign detail, submission and proof review, car booking review, and direct requests. The Lab never drew these screens; judge the transfer of the approved language and composition to each screen's purpose (mineral canvas, graphite for media regions, cobalt only for commitment, the source-to-commitment joint, real media at source ratio, strong money hierarchy, short operational copy, literal status words, few borders, progressive disclosure, honest states) and whether real functionality survived. Real demo data replaces the Lab's fictional records; treat those as expected differences. Product rules that are not drift: approving a submission pays immediately and the button says the amount; confirming a car installation pays the first month; the platform fee comes out of the creator's payout, never on top of the pay; nothing is held when a campaign is published, publishing only needs credit for one payment; there is no approve-proof action for cars, driver photos are looked at, not approved; requests are labelled Request Story and Request Reel, never with a person's name; an ad is never drawn onto a real car, placements are shown on a diagram and artwork is shown as artwork. Do not propose a new design system. The same three compositions stacked for a phone. The tab bar is pinned to the document end for this full-page capture only.

**Verdict.** Frame Shift is partially transferred and the visible functional surface survives, but the source treatments and unclear campaign-start controls prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture still exposes the expected choices and navigation, with no visible evidence of removed functionality. It does not establish that campaign entry points or subsequent workflows work. Fix the issues below, then smoke-test each existing creation route. The document-end tab bar is accepted for this capture.

The Lab is a desktop Business Home reference, not an approved Create layout, so its records and exact arrangement are not the comparison target. Production transfers the mineral palette, typography, restrained section structure and phone navigation reasonably well. It falls short in the defining source-to-commitment relationship: Recreate uses a decorative bracket, Story gains a second device frame, and Car separates its monthly caption while depicting installed advertising. The visible payment language remains appropriate, but campaign-start affordances need to be explicit.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 5 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 6 |
| fidelity | 5 |
| usability | 6 |
| brand recognition | 6 |
| ai slop risk | 5 |

## Keep

- Mineral canvas, ink headings, muted operational copy and flat, shadow-free sections.
- The 16px phone gutter and legible hierarchy: approximately 30/36px page title, 22/28px option headings, 16/24px descriptions and 14/20px payment basis.
- Three distinct campaign choices stacked vertically, with portrait Recreate imagery and landscape Car imagery.
- Literal payment descriptions: per approved video, per Story posted and per car per month.
- Business switching, search, messages, notifications and all five navigation destinations remain visible.
- The separate placement diagram; it is the correct medium for explaining advertising position.

## Expected differences (real data)

- Demo Coffee Co. and its D initial correctly replace the Lab’s fictional Loopday Coffee identity; no portrait or additional demo label is needed.
- The message and notification counts are production state, not values that should match the Lab’s fixture summaries.
- Create presents three campaign setup choices rather than marketplace records. Payment-basis text without invented amounts, balances or approval statuses is appropriate before campaign terms exist.

## Drift and usability

1. [data_honesty] **Replace the wrapped-car promotional image with an authentic, unmodified vehicle photograph. Do not composite advertising onto it. Keep placements in the existing diagram and show any artwork separately as artwork. Preserve the landscape source at its native ratio with 4px corners. Attach 'Pay per car, per month' beneath the source on a 0px-radius caption plane inset 12px from the source’s left edge; do not invent an amount.** (Car advertising composition). The current image depicts a completed TapMart-branded installation on a glossy vehicle. That communicates installed advertising rather than the unmodified vehicle and separate placement/artwork treatment required here. The monthly basis is also detached in the prose column instead of attached to the landscape source.
1. [usability] **Expose a visible action for each existing route: 'Create Reel campaign', 'Create Story campaign' and 'Create car campaign'. Use IBM Plex Sans 600 at 16/20px and targets at least 44px high. Keep ordinary descriptive text ink; reserve #2450E8 for the primary setup actions. Preserve existing whole-row activation if implemented, without nesting interactive elements.** (All three campaign entry points). All three choices currently read as promotional image-and-copy sections. There is no visible button or action label establishing how to begin; the lone Recreate arrow does not provide consistent affordance across the choices.
2. [drift] **Remove the freestanding cobalt arrow and bracket. Make the source and existing setup commitment actual adjoining planes with one 12px phone shift, 0px structural corners and no shadow. Use #101820 for the media housing and #2450E8 for the setup commitment, with #F6F8FB text on cobalt. Preserve the portrait source ratio and literal approval-based payment wording.** (Recreate composition, between the reference image and text). The bracket occupies the gap between photograph and prose but does not form a source-to-decision joint. Frame Shift’s signature has become a drawn decoration rather than the relationship between source and commitment.
2. [drift] **Remove the added graphite device shell, approximately 18px outer corner radius and 8px inset. Display this photographic setup illustration at its natural ratio with 4px media corners. Do not crop out or reconstruct the phone’s screen to fabricate supplied artwork. Actual uploaded Story creative should subsequently use an intact 0px-radius sheet, with only the permitted 0 6px 16px #10182018 source shadow.** (Instagram Story ads image). A photograph already containing a phone is enclosed in another rounded phone-like housing. This duplicates the device silhouette and introduces an app-media shape outside the approved system.
