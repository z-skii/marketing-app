# Transfer QA: Production Activity (desktop 1440), stage 2 pass 2

Production: `d-activity.png` · Approved Lab: `m-design_lab_user_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:45:09.107Z
Instructions: Stage 2 translates the approved Frame Shift language to a screen the Lab never drew; the Lab capture is the approved system reference, not a layout to match. Judge whether the language (mineral canvas, graphite media and identity regions, cobalt only for decisions and commitments, the 12px phone and 24px desktop source-to-commitment joint, real media, short operational copy, literal status words, restrained borders, strong money hierarchy, honest states, no generic card dashboard) was transferred faithfully for this screen's purpose, and whether real functionality is intact. Same records at 1440x900 with the 200px graphite rail; the list is capped at 760px.

**Verdict.** Visible real functionality is preserved and most of Frame Shift transfers well, but the desktop joint and installation-title font need correction before sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold desktop sign-off for the two implementation corrections below. The capture exposes the expected records, states, payment conditions and navigation, with no visible functional regression. It cannot verify tab results, detail routing, mutations or persistence; those still need interaction smoke tests.

This is a sound Activity-specific translation, not a screen that should copy the Lab’s Home composition. The mineral canvas, graphite identity/navigation rail, selected cobalt edges, restrained dividers, real sources and conditional money all carry the approved language. Four visible records agree with To do 4, and their next actions remain distinguishable. The outstanding problems are localized implementation drift: a phone-sized source handoff at desktop and inconsistent typography on the installation task.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 7 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, restrained reversed TapMart mark, 32px content gutter and bounded list rather than a stretched desktop dashboard.
- Mineral canvas, thin dividers and flat records without shadows or rounded card enclosures.
- Activity tabs and the cobalt selected edge; preserve Home, Activity, Earnings, Profile and all three utility destinations.
- Task-first operational copy and explicit amber waiting and green accepted status text.
- Right-aligned ink amounts with their payment bases directly beneath. Activity does not need Home’s large cobalt opportunity ledges.
- Real contained thumbnails, including landscape sources, without invented video controls or replacement imagery.
- Long record titles wrap instead of truncating the work identity.

## Expected differences (real data)

- The D initial and demo-creator identity correctly replace the Lab’s Maya portrait and name.
- The four Activity records use their own campaign imagery, businesses and titles. Existing Demo and [demo] strings are record content, not a reason to substitute Lab fixtures or add demo labeling.
- $30.00 after approval, $75.00 per approved version, $25.00 after approval and $300.00 per month correctly retain distinct record-specific payment semantics.
- Request for you, Changes requested, Accepted and Installation next reflect different working states rather than the Lab’s open opportunities.
- To do 4, In review 1, History 1 and the message and notification counts are appropriate production-state information.

## Drift and usability

1. [drift] **In the existing desktop breakpoint, replace the approximately 12px source-to-decision block offset with --tm-shift-desktop: 24px. Keep the source reservation at the row origin and begin the adjacent task/payment region 24px lower using normal-flow spacing. Retain 12px on phone, automatic row heights, the 200px rail and max-width: 760px list. Do not add an enclosing card or decorative notch.** (Activity record source-to-task/payment joints). The first and second thumbnail reservations begin near y=160 and y=332, while their adjacent title/payment line boxes appear to begin only about 12px lower. This carries the phone-sized joint into the desktop source-to-action boundary instead of the approved 24px handoff.
2. [drift] **Apply font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; line-height: 24px; font-weight: 500 to every Activity task title, including the Installation next link. Remove the route-specific serif/default-font inheritance; keep monetary values in Archivo 700.** (Fourth record: Installation next). Installation next visibly switches to a serif-looking title treatment while the three preceding task titles use the approved operational sans. This makes one workflow look like an unstyled legacy element.
