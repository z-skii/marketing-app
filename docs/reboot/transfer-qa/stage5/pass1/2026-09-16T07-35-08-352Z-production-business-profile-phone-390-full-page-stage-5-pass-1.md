# Transfer QA: Production Business Profile (phone 390, full page), Stage 5 pass 1

Production: `m-business_profile-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:35:08.352Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Same screen on a phone. The tab bar is placed after the content for this full-page capture only.

**Verdict.** Frame Shift was faithfully transferred and visible business functionality survives, but the orphaned fourth metric should be fixed before signing off this phone viewport.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Hold visual sign-off at 390px for the metric reflow below. No functional regression is visible, but this capture cannot establish whether links, mutations or connection records behave correctly at runtime.

The approved language survives at the system level: mineral surfaces, strong Archivo-style headings, operational supporting copy, restrained cobalt, intact source media and flat divided navigation. The business-specific content remains identifiable and the visible management actions are preserved. There is no justification for transplanting the Lab's creator-only media, money or vehicle assembly. The concrete weakness is the metric strip's unbalanced phone wrapping, not a failure of the overall art direction.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, ink typography, restrained white controls, thin dividers and shadow-free management rows.
- The 16px phone gutters, strong business name and clear section-to-row type hierarchy.
- The source-ratio café cover with restrained corners and the contained business thumbnail without forced cropping.
- Literal text alongside status colors: Verified business, Approved, Active, Needs you, Nothing scheduled and Connected.
- Ink secondary actions, cobalt Create and selected navigation edge; do not recolor every management link cobalt.
- Visible access to account switching, search, messages, notifications, brand kit, plan, shoot, campaigns, scheduled content, connections, public page and settings.
- Flat utility rows without decorative Frame Shift notches. These rows do not need an invented source-to-payment joint.

## Expected differences (real data)

- This is Business Profile, not the Lab's creator Profile. Business identity, campaign records, brand kit and management links correctly replace creator earnings, reviews, vehicles and recent work.
- Demo Coffee Co.'s café cover, business thumbnail, Raleigh location, website and description are record content. The existing development disclosure does not need additional demo labeling.
- The mineral business header is an appropriate quieter adaptation; it does not need the creator's graphite masthead or portrait crossing.
- The campaign counts, next-shoot date, Essential plan renewal, empty scheduled-content state and connection summaries correctly reflect production records rather than Maya's fixtures.
- The brand-kit swatches #0B0D0E, #C8FF3D and #F7F7F5 are business data, not replacement TapMart interface colors. Keep them.
- Business navigation correctly exposes Home, Content, Create, Campaigns and Business, with actual message and notification badges. Its placement after content is the stated capture convention.
- No creator payout or campaign-credit balance is required here. The subscription summary remains separate rather than merging financial concepts.

## Drift and usability

2. [responsive] **At phone widths up to 599px, make the four metrics a grid with grid-template-columns: repeat(2, minmax(0, 1fr)), column-gap: 16px and row-gap: 16px. Remove content-width wrapping and retain the existing record order, values, labels and typography.** (Business metrics between the description and Brand kit.). At 390px, Active campaigns, Scheduled and Delivered occupy the first row while Need review sits alone beneath them. The three-plus-one wrap looks accidental and separates the action-relevant review count from the other records. A balanced two-by-two layout also accommodates 320px without compressing labels.
