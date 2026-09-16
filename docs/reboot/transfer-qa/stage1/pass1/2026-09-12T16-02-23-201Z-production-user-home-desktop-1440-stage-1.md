# Transfer QA: Production User Home (desktop 1440), stage 1

Production: `d-home.png` · Approved Lab: `m-design_lab_user_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:02:23.201Z
Instructions: Real production capture at 1440x900 with the 200px graphite rail. The approved Lab defined the phone composition only; desktop lays the same three objects in a 358px column grid with the 36/40 title. Judge whether that translation keeps the approved compositions and is usable, not whether it matches the phone capture pixel for pixel.

**Verdict.** The desktop translation preserves Frame Shift's core compositions and visible functionality, but the join tokens, currency formatting and Story source/request mismatch prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Visible functional coverage is intact, but release sign-off is withheld for the issues below. This capture does not establish that inspection, filtering, navigation, Save responses or application states work; those still require interaction checks.

This is substantially Frame Shift, not a generic-card rebuild: the source objects remain distinct, money stays attached to the appropriate commitment, Story conditions remain outside the artwork, and Car pay remains below the photograph. The desktop rail and grid are appropriate adaptations rather than phone-layout failures. Controls, status text and payment bases remain exposed without clipping at this viewport. Full fidelity is held back by phone-sized desktop joins and changed money formatting; the Story's visibly contradictory source and request also needs resolution.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 6 |
| uniqueness | 8 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 3 |

## Keep

- The 200px graphite rail, 32px content gutter, 36/40px page title and three 358px columns with 24px gaps are a usable desktop translation.
- The mineral canvas, graphite Recreate commitment, cobalt payment ledge, white Car caption and restrained dividers closely preserve the approved surface hierarchy.
- Keep the three distinct silhouettes: joined Recreate split, free Story sheet beside terms, and landscape Car image with an attached financial caption. Do not introduce enclosing cards or shadows.
- Keep the 160×284px reference reservation, opaque reference label and inspection control, square 144×256px Story sheet, and short 3×64px Story payment edge.
- Keep visible conditional payment labels, readable wrapping of longer real titles, separate View work and Save actions, discovery filters and all rail destinations.

## Expected differences (real data)

- The D initial and demo-creator identity appropriately replace Maya's fixture portrait and name. Existing record names containing '[demo]' should not be rewritten by the visual migration.
- The real payments are $75 for Recreate, $25 for Story and $300 per month for Car. Preserve those values and their conditional payment bases rather than restoring fixture amounts.
- Actual businesses, request titles, September deadlines, spot counts and the additional Recreate record correctly differ from the Lab's three-record fixture.
- Rear window · 30 days and Your 2021 Toyota Camry qualifies appropriately replace the fixture's placement, duration and generic vehicle requirement. Campaign visual · Artwork supplied distinguishes the campaign image from the user's vehicle.
- Do not manufacture the fixture's Reel revision ready attention row; show it only when production has a corresponding resumable item.
- Different supplied media are expected. Retain the real still-reference branch and campaign assets, subject to resolving the Story's internal source/request mismatch.

## Drift and usability

1. [data_honesty] **Verify and repair the campaign-to-creative association for '[demo] Post our iced latte story'. Resolve the title, business and supplied creative from the same campaign ID, and use that campaign owner's verified asset. If the mismatch exists in the stored record, correct that association rather than inventing artwork or substituting the Lab poster. Preserve the 144×256px sheet, 0px corners and external conditions.** (Middle-column Story request and supplied creative). The production request asks for an iced-latte Story, but its visible creative advertises 'Naturally Radiant Skin' and shows skincare bottles. This is an inconsistency within production, not an objection to using different media from the Lab.
2. [drift] **In the desktop rail layout, use --tm-shift-desktop:24px at the meaningful joins instead of the 12px phone value. Keep the 358px columns and current source dimensions. Move the Recreate commitment from y=164 to y=176 relative to the source at y=152, making the assembly minimum height 308px. Start Story terms 24px below the sheet. Inset the Car caption 24px from its photo's left edge, giving it a 334px width; retain 12px inner padding, a 128px amount track and 12px internal gap, leaving 170px for the title track. Keep phone joins at 12px.** (Desktop Recreate, Story and Car source-to-commitment boundaries). The silhouettes survive, but all three joins still use the phone offset: Recreate steps down 12px, Story terms start 12px lower, and the Car caption begins at x=1008 beneath a photo starting at x=996. The approved system specifies 24px for desktop source-to-decision joints.
3. [drift] **Restore the approved two-decimal currency presentation using the existing record currency and monetary values. For these USD records, render $75.00, $25.00 and $300.00 with minimumFractionDigits:2 and maximumFractionDigits:2. Retain Archivo 700, desktop opportunity money at 34/38px, tabular lining numerals and the existing basis labels. Do not change amounts or infer fees.** (Recreate cobalt ledge, Story payment group and Car monthly caption). Production drops the cents in all three payment anchors, while the approved treatment consistently displays two decimal places. Different amounts are expected; changing their presentation is separate implementation drift.
