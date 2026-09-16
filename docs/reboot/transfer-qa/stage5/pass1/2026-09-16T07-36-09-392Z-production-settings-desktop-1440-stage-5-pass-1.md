# Transfer QA: Production Settings (desktop 1440), Stage 5 pass 1

Production: `d-business_settings.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:36:09.392Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Grouped utility rows with the real current condition of each thing; identity switching and log out at the side.

**Verdict.** Frame Shift was faithfully transferred and visible functionality remains intact, but the missing Business navigation state should be fixed before release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The visible production destinations, conditions and identity actions are preserved. Restore the current Business navigation state before desktop sign-off. Routing, switching, scrolling and logout execution still require interaction testing; a capture cannot verify them.

The supplied Lab image is discovery rather than a Settings specification, so fidelity is judged through the shared system. Production carries over the mineral surface, graphite navigation, typography hierarchy, restrained borders and compact controls. The two-column utility layout is purposeful and comfortably spaced; real conditions remain attached to their destinations without invented health or financial summaries. Identity media stays small and appropriate. There is no source-to-commitment boundary requiring a 24px joint here, so its absence is correct rather than missing branding. All visible management destinations and identity actions survive. The clear implementation omission is the rail’s selected-section treatment.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 0 |

## Keep

- Mineral canvas, flat graphite rail, restrained TapMart mark and 32px desktop content gutter.
- Strong Settings heading, readable operational typography, approximately 64px utility rows and thin separators rather than floating cards.
- Account and Business grouping, with current conditions directly beneath each destination.
- Identity switching, the Current identity label, Add a business and device-specific logout explanation in the separate side column.
- Literal Connected, Approved and Active labels, and the external-link affordance for the public page.

## Expected differences (real data)

- Demo Coffee Co., Raleigh, the account email and additional business identities replace the Lab’s fictional Loopday Coffee records; no extra demo labels are needed.
- The available business photograph, circular personal initial and rounded business initials are appropriate real-record identity treatments.
- Notification preferences, connection states, brand approval, subscription state and team membership are production conditions, not values to copy from the Lab.
- Settings correctly uses grouped utility rows instead of the supplied discovery capture’s people, work and vehicle assemblies. Reduced media and graphite are appropriate here.
- Plan and billing explicitly identifies the subscription and keeps campaign credit separate; discovery asking prices do not belong on this screen.

## Drift and usability

2. [usability] **Map Settings and its business-management descendants to the Business rail section. Restore the Lab’s selected treatment: a 3px-wide by 20px-high #2450E8 indicator at the rail’s left edge, vertically centered on the Business row; #F6F8FB label and icon; IBM Plex Sans 600 label. Preserve the existing 20px icon, 1.75px stroke and at least 44px target. Expose the current section programmatically with aria-current="true".** (Left navigation rail, Business row). The approved rail clearly marks Home as current. Production leaves every primary destination muted and unmarked even though the Business breadcrumb establishes the active section. Persistent navigation loses its location cue.
