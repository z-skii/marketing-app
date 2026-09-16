# Transfer QA: Production Car detail, booking awaiting installation (phone 390), stage 2 pass 1

Production: `m-o_29760b07_7d2a_4819_bca9_cd618c87d72d-full.png` · Approved Lab: `m-design_lab_user_home-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:40:20.867Z
Instructions: Stage 2 translates the approved Frame Shift language to a screen the Lab never drew; the Lab capture is the approved system reference, not a layout to match. Judge whether the language (mineral canvas, graphite media and identity regions, cobalt only for decisions and commitments, the 12px phone and 24px desktop source-to-commitment joint, real media, short operational copy, literal status words, restrained borders, strong money hierarchy, honest states, no generic card dashboard) was transferred faithfully for this screen's purpose, and whether real functionality is intact. Opportunity detail for a car ad where the person's car was accepted: campaign visual with the inset monthly caption, supplied artwork, placement and duration as facts, then the booking as it stands (installation next, nothing paid yet, paid so far shown honestly), then the business's requirements.

**Verdict.** Frame Shift and the visible booking functionality were faithfully transferred, with one navigation-state regression to fix before release.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The visible data, booking state and relevant actions are intact. Fix the missing active navigation state before signing off this 390px screen. A capture cannot verify Save responses, link destinations or subsequent booking transitions.

This is a successful translation of the language, not an attempted copy of the Home layout. The landscape source ends in the correct 12px-inset monthly caption, money stays in ink rather than borrowing Recreate’s cobalt ledge, and the booking uses a flat working surface rather than a generic card dashboard. Campaign imagery and supplied artwork are identified separately from the named vehicle. Installation next and Nothing yet communicate the actual booking without implying installation or payment has occurred. Copy, amounts and requirements remain readable at 390px. The concrete visible regression is the missing Home selection treatment.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral #F4F3EF canvas, white financial and booking surfaces, ink typography and restrained dividers; no shadows or rounded dashboard-card collection.
- The approximately 358×239px campaign image and attached white caption: its left edge steps inward by 12px while its right edge remains flush with the image.
- Strong, stationary $300.00 hierarchy with per month directly beneath; gross and after-fee amounts remain explicitly distinguished.
- Source-faithful, contained artwork previews with an ink Inspect artwork action rather than decorative cobalt or an invented installation preview.
- The plain booking region with amber Installation next, named vehicle, concise payment condition and honest unpaid state.
- Operational type hierarchy: prominent section headings, readable body copy and quieter factual labels; longer values wrap without truncation.
- The sequence of campaign source, monthly commitment, artwork and facts, booking state, then business requirements.
- Visible Home/back, Save, business link, Inspect artwork, View vehicle and all four permanent navigation destinations.

## Expected differences (real data)

- The D initial, demo-creator identity and unread counts replace the Lab portrait and fixture identity without changing the shell hierarchy.
- The bound campaign image and separate Demo Roastery artwork correctly replace the Lab assets. Campaign visual, supplied artwork and the booked vehicle remain distinct.
- $300.00 per month, $255.00 after the stated 15% fee, rear-window placement, 30 days and Raleigh are record-specific terms—not deviations from the Lab’s $240 campaign.
- The accepted 2019 BMW 330i booking correctly exposes Installation next, the installation-dependent first payment and Paid so far: Nothing yet instead of application controls.
- The business requirements and existing demo-related strings belong to the loaded records; they should not be replaced with Lab copy or supplemented with artificial demo labels.

## Drift and usability

2. [usability] **Make the car-opportunity detail route inherit Home’s active navigation state rather than using an exact-root match. Restore the 24×3px #2450E8 selected edge at the top of the Home item, its #151B23 icon and IBM Plex Sans 600 label at 14/18px. Keep the other destinations #526171 and preserve the existing 64px navigation height plus safe area.** (Bottom navigation — Home item). Production renders all four destinations muted and omits the selected edge visible in the approved shell. The Home return control establishes this detail’s parent context, but the permanent navigation no longer communicates it.
