# Transfer QA: Production Plan and billing (desktop 1440, full page), Stage 5 pass 1

Production: `d-business_plan-full.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:39:12.402Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The subscription named in words, the two plans, cancel is quiet, campaign credit shown as a separate amount with its own page.

**Verdict.** Frame Shift is faithfully transferred and the visible functionality is preserved, but contradictory billing copy prevents release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Hold release at this viewport until the contradictory billing caption is corrected. The capture still exposes Settings navigation, subscription details, plan comparison, upgrade, cancellation and the separate campaign-credit destination. Click behavior and backend mutations are not verifiable from this capture.

The production screen carries the Lab’s mineral/white/graphite surface hierarchy, Archivo heading and money treatment, operational typography, restrained borders and navigation shell. The plan columns have a disciplined 24px gap, and the cobalt primary button retains the approved rounded-control treatment. Subscription status and cancellation consequences are written explicitly, while campaign credit remains visually and semantically separate. No supplied source is being transformed into a decision here, so omitting the signature offset and large media is correct. The substantive defect is the conflicting charge language, not the visual transfer.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 9 |
| ai slop risk | 1 |

## Keep

- The mineral canvas, 200px graphite navigation rail, restrained reversed mark and 32px desktop content gutter.
- Strong page and section headings, prominent subscription money, square white working surfaces and shadow-free financial regions.
- The focused two-plan comparison with a clear current-plan outline, restrained dividers and one cobalt Move to Growth action.
- The quiet Cancel the plan action and plain explanation of what cancellation affects.
- Campaign credit as a separate amount, with its own explanation and Campaign credit and spend navigation; do not merge it with subscription charges or creator payouts.
- The compact utility composition without decorative media or a forced source-to-commitment offset.

## Expected differences (real data)

- The supplied Lab capture is Content, not Plan and billing; this screen should inherit its visual system, not its media-heavy composition or content-review controls.
- Demo Coffee Co. and its actual business thumbnail correctly replace Loopday Coffee and the fixture initial.
- The active Essential subscription, October 9 renewal, plan prices and $17,887.00 campaign credit should reflect production records rather than the Lab’s Growth fixture.
- The development-billing state, absent payment card and no-charge plan changes are legitimate environment differences and should remain explicit.
- The notification count of 3 is a legitimate production-state difference.

## Drift and usability

1. [data_honesty] **Make the caption beneath $99.00 conditional on the actual billing state. For this disconnected development-billing state, replace “a month, billed to your card” with “a month · No charge in this environment”. Retain “Development billing, no card on file” and the no-charge explanation beneath the plans. Render “billed to your card” only when card-backed recurring billing and a payment method are actually configured.** (Current-subscription white panel, directly beneath the $99.00 amount.). The most prominent financial block says the subscription is billed to a card, while its Billing row says no card is on file and the lower explanation says card billing is disconnected. Those statements give conflicting answers about whether money is being charged.
