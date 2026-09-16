# Transfer QA: Production Connections, connected (desktop 1440), Stage 5 pass 1

Production: `d-business_settings_connections.png` · Approved Lab: `d-design_lab_business_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:38:00.642Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Instagram and Google connected with the stored read time; Facebook and TikTok not available yet.

**Verdict.** Frame Shift was faithfully transferred and real connection functionality remains exposed, but the Disconnect sizing and inspection-link wrapping need a small finishing pass before release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The capture exposes the expected records, states, actions and navigation. Hold visual sign-off for the two small control fixes below; actual disconnect, inspection and navigation behavior still requires an interaction smoke test.

The supplied Lab image is Business Home, not a Connections mockup, so this is a system-transfer assessment. Production carries over the mineral and graphite surfaces, typography hierarchy, rail proportions, restrained borders and ink secondary actions. The narrow service list is appropriate for management rather than missing a discovery composition. Account media remains modest and identifiable; Connected is expressed with literal text, and read times provide provenance without fabricated metrics. No financial categories are introduced or merged. The visible shortcomings are confined to control sizing and the fragmented inspection link.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 9 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 0 |

## Keep

- The 200px graphite navigation rail, restrained TapMart mark and 32px desktop content gutter.
- Mineral canvas, white controls, thin neutral dividers and a flat service list without shadows or generic cards.
- Strong Archivo page heading and IBM Plex Sans operational text.
- Separate Instagram and Google identities, literal connection status, stored read times and independent Disconnect controls.
- The Settings return path, Instagram provenance inspection and Open Google Business navigation.
- The compact utility composition. Connections needs neither discovery imagery, money nor a decorative source-to-commitment offset.

## Expected differences (real data)

- Demo Coffee Co. and its saved photograph replace the Lab’s fictional Loopday Coffee identity and initials.
- Instagram @democoffee and Google Business Profile show Connected with the stored read time, Sep 16, 4:19 AM. These are record-specific states, not invented connection health.
- Facebook and TikTok correctly say Not available yet without offering unavailable connection actions.
- The production notification count of 3 is a legitimate record-dependent difference.

## Drift and usability

2. [usability] **Increase both Disconnect controls from approximately 40px to at least 44px high. Apply IBM Plex Sans 600 at 16px/20px, padding: 11px 16px, box-sizing: border-box, a 1px #788595 border and the existing 8px radius. Keep their right edges aligned with the list at x=808.** (Instagram and Google Disconnect buttons, around x=702 at y=196 and y=325.). The visible controls fall below the approved 44px target, and their labels are smaller than the adjacent operational actions.
3. [usability] **Keep the provenance sentence at 14px/20px. Put See what was read on its own line as a single ink, underlined link with display: flex, width: fit-content, min-height: 44px, align-items: center, white-space: nowrap and margin-top: 4px. Preserve its existing destination.** (Instagram provenance text immediately above the first divider.). The link currently wraps after “was”, leaving “read” alone at the far-left edge of the next line. This fragments the inspection action and weakens scanning.
