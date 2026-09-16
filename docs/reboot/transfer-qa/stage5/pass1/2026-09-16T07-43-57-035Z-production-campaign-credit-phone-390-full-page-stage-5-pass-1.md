# Transfer QA: Production Campaign credit (phone 390, full page), Stage 5 pass 1

Production: `m-business_billing-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:43:57.035Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The credit that pays people, its real balance, add credit honest about Stripe, this month's spend, the subscription named separately.

**Verdict.** Frame Shift was faithfully transferred at the system level and visible functionality is preserved, but restore the Business navigation selection before sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Hold visual sign-off for the missing current-section navigation state. The capture otherwise preserves the required financial information and honest unavailable-payment state. Route execution, ledger accuracy and payment behavior require runtime verification.

The supplied Lab is Profile rather than Campaign credit, so this is a system-level comparison, not a demand to copy its composition. Production transfers the mineral surfaces, typography hierarchy, restrained borders and financial emphasis convincingly. The white balance region is flat and spacious; the amount fits without clipping, explanatory copy remains legible, and the payment amount is separately aligned beside its named record. Subscription billing is explicitly isolated below. There is no fake payment capability, invented status or unnecessary media treatment. The concrete visual regression is the missing selected state in permanent navigation.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 9 |
| uniqueness | 7 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, flat white balance surface, square financial-region corners and no decorative shadows.
- 16px phone gutters, strong page and section headings, and the large, stable balance as the primary anchor.
- Credit-use conditions immediately beneath the balance, with readable supporting text.
- Literal Stripe availability, a dated payment record and explicit separation of subscription billing from campaign credit.
- Visible Plan and billing back navigation, Manage the plan action and business navigation shell.
- No artificial source-to-commitment offset where there is no source object.

## Expected differences (real data)

- Demo Coffee Co., its business thumbnail and notification counts replace the Lab’s personal fixture identity.
- The real campaign-credit balance is $17,887.00. September spend is $40.00 across one payment, with the recorded campaign title and Sep 9, 2026 date.
- Stripe is unconfigured, so Add credit correctly explains its unavailable state instead of presenting a misleading payment button.
- Essential plan is named separately from campaign credit. The Lab’s creator earnings and payout amounts do not belong on this screen.
- The utility screen appropriately omits the Profile portrait, vehicle assembly and work gallery; less media and graphite are intentional here.

## Drift and usability

2. [drift] **Map Campaign credit and its Plan and billing parent routes to the Business navigation section. Give Business the approved centered 24×3px #2450E8 top-edge indicator, #151B23 icon and label, and IBM Plex Sans 600 at 14/18px. Keep inactive destinations #526171, retain minimum 44px targets, and leave Create as a separate primary action.** (Bottom navigation, Business destination). The Lab clearly identifies its current destination with a cobalt edge and dark selected label/icon. Production renders every destination as inactive; the blue Create button communicates an action, not the current location.
