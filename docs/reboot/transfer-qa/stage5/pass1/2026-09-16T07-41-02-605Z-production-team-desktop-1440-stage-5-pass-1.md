# Transfer QA: Production Team (desktop 1440), Stage 5 pass 1

Production: `d-business_team.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:41:02.605Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The recorded members and roles, what each role can do, and the plain statement that invitations do not exist yet.

**Verdict.** Yes—Frame Shift was faithfully transferred as a product system, and the visible Team functionality remains intact, with minor role-color and navigation-selection polish.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Sign off at 1440px with the two non-blocking consistency fixes below. The capture preserves the visible membership, permission information and navigation; it cannot verify link execution or permission enforcement. The supplied Lab image is a discovery screen, so this is a system-level assessment rather than a Team layout comparison.

The production screen carries the approved surfaces, typography, spacing and flat operational hierarchy without importing the Lab's discovery composition. Small circular member images remain subordinate to names and roles. There is no unnecessary graphite content panel, fabricated invitation action, decorative joint or financial display. The two-member count agrees with the visible records, role capabilities are explained, and the invitation limitation is explicit. The only visible inconsistencies are green role text and the missing selected navigation branch.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The mineral #F4F3EF canvas, #101820 navigation rail, restrained dividers and square, shadow-free white information region.
- The matching 200px rail and 32px desktop content gutter. The narrow reading column suits team management; do not fill the remaining viewport with cards or media.
- The strong Team heading, clear section heading, readable operational copy and subordinate handles and dates.
- The count of two people matching the two visible records, with the current user identified by You and each recorded role plainly named.
- The explicit permission descriptions, including the distinction between plan access and campaign credit, and the honest explanation of how added people appear.
- Both Settings return controls and the existing application navigation. No decorative source-to-commitment offset is needed because this screen has no source-to-decision assembly.

## Expected differences (real data)

- Demo Roastery, the two recorded members, their handles, membership dates and Owner/Manager roles are production data rather than Lab discovery fixtures.
- The D initial and Priya's recorded thumbnail are valid identity fallbacks; replacement portraits are not needed.
- The notification count of 3 is a real application state, not a mismatch with the Lab.
- The explicit statement that invitations are unavailable correctly replaces any hypothetical invitation controls or invited states.

## Drift and usability

3. [drift] **Set Owner and Manager to --tm-ink: #151B23, retaining IBM Plex Sans 500 at 14/20px. Reserve --tm-confirmed: #176B4B for literal confirmed states; do not introduce role badges.** (Right-aligned Owner and Manager labels in the member list). The green role labels introduce confirmation semantics into static permission categories. Their wording is correct; only their color treatment needs correction.
3. [usability] **Keep Business selected while viewing its Team/settings descendants. Reuse the Lab rail treatment: a 3px-wide, 20px-high #2450E8 left edge centered on the row, with #F6F8FB selected text and icon and IBM Plex Sans 600 text.** (Business item in the desktop navigation rail). Every rail item currently appears unselected. The Settings backlink provides local context, but the navigation no longer identifies the current application branch as the approved shell does.
