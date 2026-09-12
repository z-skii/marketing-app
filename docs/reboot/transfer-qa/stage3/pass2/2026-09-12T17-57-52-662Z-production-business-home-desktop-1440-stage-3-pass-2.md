# Transfer QA: Production Business Home (desktop 1440), stage 3 pass 2

Production: `d-business.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T17:57:52.662Z
Instructions: Stage 3 transfers the approved Frame Shift Design Lab to production for the business core. The Lab captures are the approved design: judge whether the real production screen keeps the approved language and composition (mineral canvas, graphite rail and media regions, cobalt only for decisions, the source-to-commitment joint, real media at source ratio, short operational copy, literal status words, restrained borders, strong typography, honest provenance, no generic dashboard cards) and whether real functionality survived. Real data replaces the Lab's fictional people, cars, files and business; treat those as expected differences, not drift. Do not propose a new design system. Pass 2 decisions from the product owner that are not drift: the discovery caption keeps one compact row of recorded reputation (followers only when Instagram is connected, completed work, a rating only once reviews exist) because the product brief requires it on discovery; the action is labelled Request with a menu of Request Story and Request Reel because the product rule forbids Request plus a person name; the plain coral square is the real still the person uploaded, not a placeholder; the caption is labelled Read only because production has no caption editing path and no mutation may be invented. For you on desktop: the real people ribbon (portrait beside the person's approved work at its real ratio, source title, literal provenance, View person, a Request menu with Request Story and Request Reel) and the car shelf with recorded asking prices. Real demo people from the local database; one person has no avatar (initial) and one work sample is a plain colour upload from the seed; both are the real records.

**Verdict.** Frame Shift is largely preserved and visible functionality appears intact, but release sign-off should wait until the car placements and recorded monthly asking prices return to the first desktop viewport.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The visible navigation, records, statuses and action entry points appear preserved. Hold this viewport for the car-shelf correction. A static capture does not verify Request menu contents, permissions, destination behavior or asking-price data below the fold.

The transfer substantially matches Frame Shift: surfaces, typography, rail geometry, restrained borders, open source framing and the offset car captions all remain recognizable. Real records and the product-owner-approved caption changes are handled without replacement media or generic cards. The remaining material failure is vertical composition: Available cars sits roughly 44px lower than the Lab, pushing the placement and monthly-price information outside the captured viewport. Visible functionality appears preserved, but the approved first-viewport decision hierarchy is not yet complete.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 9 |
| ai slop risk | 0 |

## Keep

- The 200px graphite rail, 32px main gutter, mineral canvas, restrained lockup and coherent business selector.
- The strong application title, right-aligned location control and unboxed attention link.
- The selected cobalt navigation edge, ink inspection links and cobalt Request actions.
- Open portrait/work spreads, source-ratio media, honest initials and the absence of enclosing dashboard cards.
- Visible View person and Request controls, See all destinations and separate ribbon navigation buttons.
- The 336×224px car photographs, 24px shelf gaps and 12px rightward caption step.

## Expected differences (real data)

- Demo Coffee Co., Raleigh, the two-file approval attention link, and notification badges replace the Lab’s fixture business, location and counts.
- Production avatars and work uploads replace the fixture portraits and samples. The D initial and plain coral upload are honest records, not missing design assets.
- Landscape and square sources produce different spread widths and ribbon continuation. Preserve their actual ratios rather than forcing fixture dimensions.
- The compact recorded reputation row is an approved production requirement. Connected-account followers, completed work and existing reviews are not drift.
- Request with a dropdown indicator correctly replaces the Lab’s named Request labels. The intended choices remain Request Story and Request Reel.
- Two recorded BMW listings replace four fixture vehicles. Disabled car-shelf arrows are appropriate when both available items fit.

## Drift and usability

1. [drift] **Restore the car header to approximately y=544 with a 44px control row and photographs at y=600. Keep the current 232px people-media reservation. At its current y=192 position, use an 8px caption gap followed by 24px name/city, 20px source/provenance, 20px recorded reputation and 44px actions; this ends at y=540. Allow only the displayed source-title link to ellipsize using min-width:0, overflow:hidden, text-overflow:ellipsis and white-space:nowrap; retain its full accessible name and existing inspection destination, and keep literal provenance visible. Use a 4px gap before the car header and 12px before its photographs. Preserve 336×224px photos, then place captions 8px below and 12px to the right: vehicle name at 18/24px, city and named zone at 14/20px, and recorded asking price at 16/24px with tabular numerals, beginning around y=876. Do not remove the approved reputation row, reduce 44px action targets or use negative positioning.** (People caption/action stack and the Available cars shelf immediately below it.). Production’s car photographs begin at y=640 versus approximately y=598 in the Lab. At the 900px fold, production exposes only the vehicle-name line; named placements and monthly asking prices cannot be read. The additional wrapped discovery metadata and section spacing have displaced the screen’s financial decision anchor.
