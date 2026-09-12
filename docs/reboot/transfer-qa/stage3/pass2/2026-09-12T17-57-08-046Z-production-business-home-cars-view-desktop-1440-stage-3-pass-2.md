# Transfer QA: Production Business Home, Cars view (desktop 1440), stage 3 pass 2

Production: `d-business_tab_cars.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T17:57:08.046Z
Instructions: Stage 3 transfers the approved Frame Shift Design Lab to production for the business core. The Lab captures are the approved design: judge whether the real production screen keeps the approved language and composition (mineral canvas, graphite rail and media regions, cobalt only for decisions, the source-to-commitment joint, real media at source ratio, short operational copy, literal status words, restrained borders, strong typography, honest provenance, no generic dashboard cards) and whether real functionality survived. Real data replaces the Lab's fictional people, cars, files and business; treat those as expected differences, not drift. Do not propose a new design system. Pass 2 decisions from the product owner that are not drift: the discovery caption keeps one compact row of recorded reputation (followers only when Instagram is connected, completed work, a rating only once reviews exist) because the product brief requires it on discovery; the action is labelled Request with a menu of Request Story and Request Reel because the product rule forbids Request plus a person name; the plain coral square is the real still the person uploaded, not a placeholder; the caption is labelled Read only because production has no caption editing path and no mutation may be invented. The Cars view: the open inventory gallery of listed cars with named placements and asking prices, no people.

**Verdict.** Frame Shift was faithfully transferred to this Cars view with no visible loss of real functionality, subject to routine interaction verification and a minor caption cleanup.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Visual sign-off at desktop 1440×900, with one nonblocking caption cleanup. The capture preserves the visible data and navigation, but cannot verify vehicle-detail links, placement selection, Send offer, or backend permission checks; those still require interaction smoke tests.

Production retains the approved shell, typography hierarchy, warm neutral surfaces, restrained cobalt, and open photographic inventory rather than reverting to dashboard cards. The photographs lead directly into stepped captions containing actual vehicle identities, placement names, and clearly qualified monthly amounts. Cars is visibly selected, and the business selector, location control, discovery destinations, attention link, and rail navigation remain exposed. The reduced inventory and absence of people are appropriate to this real Cars state, not missing design content. No visible functional regression is evident, although a screenshot cannot establish that the downstream actions execute correctly.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The 200px graphite rail, 32px main gutter, mineral canvas, restrained dividers, and matching TapMart lockup.
- The strong application heading, compact attention link, outlined location control, and cobalt selection edges.
- The open two-column inventory treatment: approximately 336px-wide photographs, 24px gaps, small media corners, and no enclosing cards or shadows.
- The attached factual captions with a 12px rightward step from their photographs, preserving the approved vehicle source-to-commitment joint.
- Vehicle identity, named placements, literal monthly asking language, and ink-colored prices remain visible together.
- No substituted model, installed artwork, 3D control, or invented availability claim appears.

## Expected differences (real data)

- Production has Cars selected; the Lab capture has For you selected. Showing only the open vehicle gallery, without people or people-ribbon controls, is correct.
- Demo Coffee Co., its D initial, and Raleigh, NC replace the fixture business and location. The business name does not require a Lab-style Demo provenance label.
- The attention area shows 2 files to approve rather than the fixture campaign-decision and file counts. These should remain independent query results.
- Two BMW records replace the fixture inventory. Unoccupied canvas is appropriate; production should not add vehicles to fill the viewport.
- Recorded placement counts and monthly starting asks of $80.00 and $250.00 replace single-placement fixture prices. Asking from preserves the distinction from an agreed offer.
- The wider production photographs need not match the Lab’s 3:2 fixtures. Both cars remain identifiable; preserve the actual uploaded source ratio.
- The second vehicle omits city text rather than borrowing a fixture location.

## Drift and usability

3. [drift] **Render the separate count lines as “3 placements” and “2 placements”, without the leading middot. Use IBM Plex Sans 400 at 14px/20px in #526171. Keep the asking-price line at 16px/24px in #151B23 with tabular numerals.** (Both vehicle captions, directly below the monthly asking prices.). The middot begins a new line instead of separating inline facts, making the captions look accidentally wrapped. The count also has the same visual weight as the monthly asking line rather than the approved metadata hierarchy.
