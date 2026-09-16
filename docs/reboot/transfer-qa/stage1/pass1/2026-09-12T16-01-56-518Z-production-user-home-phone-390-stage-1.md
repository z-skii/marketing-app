# Transfer QA: Production User Home (phone 390), stage 1

Production: `m-home-full.png` · Approved Lab: `m-design_lab_user_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:01:56.518Z
Instructions: Real signed-in production capture at 390 wide, full page; the tab bar is position: fixed in the app and pinned to the document end only for this capture. Real open campaigns from the local database: reference stills are real uploads, titles and businesses are real records, the vehicle fit line reads the person's real listed car.

**Verdict.** Frame Shift was faithfully transferred in composition and visible functionality, with two-decimal money formatting still required before release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** One currency-formatting patch remains before visual sign-off at 390px. The capture exposes the real records, conditions and controls, but cannot verify filter results, reference inspection, Save persistence or failure handling, application states, or navigation destinations.

The defining source-to-commitment relationships survived the migration rather than becoming generic cards. Recreate has the correct open corner and lower cobalt endpoint; Story keeps its independent supplied sheet and narrow ink commitment; Car ends in an inset monthly caption. Gutters, type hierarchy, opaque inspection controls, action placement and navigation treatment closely match the Lab. Longer real copy remains readable, approval conditions remain adjacent to money, and the campaign image is distinguished from the person's vehicle-fit statement. No visible control or record is obscured. The concrete visual drift is the omission of decimal places from every payment amount; interactive correctness remains outside what this static capture can establish.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 8 |
| uniqueness | 9 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 9 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The mineral canvas, white financial caption, graphite commitment and cobalt payment ledge match the approved surface hierarchy, without enclosing card shadows.
- The Recreate geometry is preserved: 160×284px source reservation, 198×284px commitment starting 12px lower, and a 198×112px cobalt ledge.
- Application title, operational text and money retain the approved hierarchy. The longer production titles wrap without hiding the business, instruction or payment basis.
- Story retains its 144×256px square-edged supplied sheet, restrained shadow, 12px-lower commitment and short 3×64px payment edge.
- Car retains the broad 358×239px source and attached white caption inset 12px on the left, with 'per month' outside the photograph.
- Keep the unboxed deadlines and action rows, separate View work and Save targets, discovery controls, unread badges and labeled Home–Activity–Earnings–Profile navigation.

## Expected differences (real data)

- The signed-in demo-creator identity and D initial correctly replace Maya and her portrait. Production does not need the Lab-only 'Personal · Demo' label.
- The fixture revision prompt is absent. Without a real resumable revision, collapsing its 44px row and 12px spacing is correct; this explains why Recreate and Story begin approximately 56px earlier.
- Real titles, businesses, amounts, availability and deadlines replace fixture content. Existing '[demo]' strings within database titles are not a reason to add demo interface labels.
- The uploaded reference differs from the Lab still and has visible letterboxing. It remains explicitly labeled 'Reference · still' with an opaque inspection control and no invented video chrome.
- The supplied Story artwork and vehicle campaign visual differ from the fixtures. Their original content should remain intact rather than being replaced to match the Lab.
- The real vehicle-fit statement, rear-window placement, 30-day duration and absent car deadline replace the fixture's generic vehicle requirement and campaign terms.
- A fourth opportunity is present. Preserve the production result ordering rather than limiting the screen to the Lab's three fixtures.
- The navigation appears at the document end because of the stated capture setup; this is not evidence that the app lost fixed navigation.

## Drift and usability

2. [drift] **Restore two-decimal currency formatting in the shared opportunity-payment renderer: use the record's currency with minimumFractionDigits: 2 and maximumFractionDigits: 2. These records should display $75.00 on both Recreate ledges, $25.00 for Story and $300.00 for Car. Preserve the actual stored amounts, current payment-basis text, Archivo 700 at 30/34px and tabular lining numerals.** (Both Recreate cobalt payment ledges, the Story amount group and the Car monthly caption.). Production renders $75, $25 and $300, while the approved money treatment consistently retains cents. The amounts remain prominent and conditional, but their formatting has drifted from the approved financial presentation.
