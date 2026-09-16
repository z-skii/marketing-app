# Transfer QA: Production Google Business before connection (phone 390), Stage 5 pass 1

Production: `m-business_google.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:39:55.084Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Only a connect state. Nothing is judged before a real connection.

**Verdict.** Frame Shift is faithfully transferred into an honest connection-only screen, with two navigation and recovery fixes needed before release.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The capture shows no evidence of functionality lost during migration; connection is explicitly blocked by configuration rather than presented as working. Hold viewport sign-off for the navigation-selection and support-path fixes below. Routing and OAuth behavior still require interaction testing.

At the captured 390px CSS width, the screen carries the approved mineral/white palette, ink and muted text hierarchy, 16px outer gutters, rectangular working region and 8px control treatment without clipping or ornamental depth. The heading, status, explanation and connection action scan in the right order. The absence of graphite media, money and an offset joint is appropriate because there is no connected source to inspect or financial commitment to present. The faded button is explained by a real configuration limitation, not accompanied by invented Google results. The remaining visible weaknesses are the unmarked Business navigation destination and a recovery instruction without a direct action.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 10 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, white working surface, square structural corners and no card shadows.
- The 16px phone gutters, strong 30/36px page title and clear operational type hierarchy.
- Literal Not connected status and the explicit explanation of why connection is unavailable.
- The restrained single-purpose layout. Do not add media, a source-to-commitment offset, financial figures or a dashboard to this state.
- Visible Settings return, account switcher, search, messages, notifications and business navigation.

## Expected differences (real data)

- The supplied Lab image is a creator Profile, not a Google Business design. This utility screen correctly omits its graphite identity masthead, portfolio, vehicle assembly and earnings.
- Mo's Demo Shop, the M initial, notification count and business navigation replace the Lab's fictional personal account and portrait.
- Not connected and the configuration warning are legitimate production states. The disabled Connect Google Business button should remain disabled while the integration is unconfigured.
- No listing information, reviews, performance claims or inferred health appear before a real Google connection. That absence is correct.

## Drift and usability

2. [usability] **Keep Business selected throughout its settings routes. Apply #151B23 to its icon and label, IBM Plex Sans 600 at 14/18px to the label, and the Lab's centered 24×3px #2450E8 top selection edge. Preserve the separate Create action and existing navigation targets.** (Bottom navigation, Business tab). Every destination currently has the same muted treatment. The cobalt Create control is an action, not an indication of the current section; the Lab distinguishes its active Profile destination.
2. [usability] **Keep the configuration explanation at 14/20px, but replace the plain instruction to ask support with a visible Contact support action wired to TapMart's actual support destination. Use an ink #151B23 text control, IBM Plex Sans 600 at 16/20px, with a minimum 44px hit target. Do not enable Connect until configuration permits it.** (Configuration warning beneath Connect Google Business). The only primary action is disabled, and the stated recovery step is plain text. No explicit support destination is exposed in this state; the generic messages icon does not identify that path.
