# Transfer QA: Production Business Home, Cars view (desktop 1440), stage 3 pass 1

Production: `d-business_tab_cars.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T17:48:38.202Z
Instructions: Stage 3 transfers the approved Frame Shift Design Lab to production for the business core. The Lab captures are the approved design: judge whether the real production screen keeps the approved language and composition (mineral canvas, graphite rail and media regions, cobalt only for decisions, the source-to-commitment joint, real media at source ratio, short operational copy, literal status words, restrained borders, strong typography, honest provenance, no generic dashboard cards) and whether real functionality survived. Real data replaces the Lab's fictional people, cars, files and business; treat those as expected differences, not drift. Do not propose a new design system. The Cars view: the open inventory gallery of listed cars with named placements and asking prices, no people.

**Verdict.** Frame Shift was substantially faithfully transferred with no visible functional loss, but the header and location-control sizing need correction before desktop release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Hold desktop sign-off for the header/location-control correction; caption wrapping is minor polish. The capture shows no missing core navigation or listing information, but cannot verify vehicle-detail links, placement inspection, Send offer, filters or business switching.

The transfer retains the recognizable system rather than merely copying colors: the rail and main gutter match, typography has the same hierarchy, inventory remains unboxed, and each photograph joins an inset factual caption. Names, placement metadata and monthly asking prices are exposed without promotional claims. The shorter gallery and missing people section follow the real inventory and selected Cars state, not implementation drift. The visible discrepancies are localized to header alignment, location-control sizing and awkward count wrapping.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, exact restrained lockup, coherent business selector, navigation destinations and bottom utility positions.
- Mineral canvas, ink typography, muted metadata and cobalt selection edges; no enclosing dashboard cards or app shadows.
- The open two-column inventory presentation with identifiable photography, restrained media corners and no visible distortion or oversized letterboxing.
- The source-to-fact joint: captions begin 12px inside the photograph’s left edge and approximately 12px below it.
- Strong vehicle names, named placements and readable monthly asking prices on the canvas rather than over photography.
- Cars remains inventory discovery: no people leaderboard, invented installed artwork or unsupported 3D control.

## Expected differences (real data)

- Production has Cars selected, while the supplied Lab capture shows For you. Omitting people, person requests and people-ribbon controls is correct for this view.
- Demo Coffee Co., its D initial and Raleigh, NC replace the fixture business and location. Do not add the Lab’s Demo provenance to production.
- Two real BMW listings replace the four fixture vehicles. The smaller inventory does not require filler records or shelf navigation when everything is already visible.
- The real attention result is 2 files to approve; the Lab’s campaign-decision count and file count should not be copied.
- Real vehicle years, colors, cities, placement names and monthly asking amounts correctly replace fixture content. Omitting the second vehicle’s unavailable city is preferable to inventing one.
- Asking from and placement counts accommodate listings with multiple placements while keeping asking prices distinct from agreed offers or earnings.
- Unread message and notification badges are legitimate production states absent from the Lab capture.

## Drift and usability

2. [usability] **Restore the desktop purpose row to x=232, y=32, width=1176px and height=48px, using vertically centered alignment. Retain the existing 36/40px Archivo heading. Set the location button’s rendered and interactive height to 48px, matching the Lab and exceeding the 44px minimum; retain the 32px right gutter.** (Top purpose row: Find people and cars and Raleigh, NC). The production heading appears approximately 12px below the Lab heading. The location control begins at y=48 rather than y=32 and is visibly about 40px high rather than 48px, falling short of the specified visible target size.
3. [usability] **Wrap each complete placement-count phrase, such as “3 placements” or “2 placements”, in an inline-block with white-space: nowrap. Keep the separator with that phrase so the complete group moves together when wrapping. Preserve the asking amount and monthly basis at 16/24px with tabular numerals.** (Monthly asking-price captions beneath both BMW photographs). Both captions currently leave the count at the end of one line and orphan “placements” on the next. Keeping the count and noun together improves scanning without removing real information or changing the approved composition.
