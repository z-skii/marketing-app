# Transfer QA: Production Settings (phone 390, full page), Stage 5 pass 1

Production: `m-business_settings-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:36:17.372Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Same screen on a phone.

**Verdict.** Frame Shift is substantially faithful and real Settings functionality remains exposed, but the Business tab needs its active navigation treatment before release.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** One localized navigation-state fix remains before visual sign-off at 390px. The capture preserves the functional entry points and readable states; it cannot verify their execution. The supplied Lab image is Profile, so this is a system-transfer assessment rather than Settings pixel parity.

The production screen transfers the approved language without importing the Profile composition: mineral surfaces, strong typography, flat divided rows, restrained identity imagery and short operational summaries all suit Settings. Descriptions, status words, chevrons and the external-link control remain legible without clipping at 390px. Subscription semantics remain separate, and no fixture earnings, media or vehicle content has been fabricated. The meaningful visible miss is the absent selected Business navigation treatment.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 7 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 0 |

## Keep

- Mineral canvas #F4F3EF, restrained #CFD3D1 dividers and white bottom navigation. Flat settings rows avoid shadows and generic card grids.
- The approximately 30/36px Archivo Settings title, IBM Plex Sans operational text, 16px phone gutters and clear label-to-description hierarchy.
- Literal status words with restrained confirmed-green treatment, plus problem-colored Log out and its explicit device-session explanation.
- Plan and billing explicitly separates subscription from campaign credit; no creator payout or invented balance is introduced.
- Small identity media, circular personal initials and rounded business initials. Settings correctly has no large media stage, graphite hero or decorative source-to-commitment joint.
- Visible account, security, notification, business-management, public-page, switching, add-business and logout entry points.

## Expected differences (real data)

- Demo Coffee Co., its category, Raleigh location, owner email and public URL replace fictional Lab identity data.
- The business photograph, personal initial and business initials are appropriate record-backed identity fallbacks; replacement portraits are unnecessary.
- Business-mode destinations and the recorded personal/business switching list correctly differ from the Lab’s creator navigation.
- Connected, Approved, Active, Current and Only you are legitimate production-state differences, not reasons to reproduce Lab fixtures.
- The message and notification counts are appropriate real-state additions.

## Drift and usability

2. [usability] **Include Settings in the Business tab’s active-section matcher. Render a centered 24px-wide × 3px-high #2450E8 top edge above Business, use #151B23 for its icon and label, and set the label to IBM Plex Sans 600 at 14/18px. Expose the active destination accessibly and preserve the separate cobalt Create action and minimum 44px targets.** (Bottom navigation, Business tab while viewing Settings). The approved navigation identifies the current destination with a cobalt top edge and stronger ink label. Production shows Business in the same muted treatment as inactive destinations, while Create is the only emphasized item. The current section is therefore not identifiable from the persistent navigation.
