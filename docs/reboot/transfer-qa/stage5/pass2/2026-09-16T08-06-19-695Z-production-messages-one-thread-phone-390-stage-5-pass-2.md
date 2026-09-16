# Transfer QA: Production Messages, one thread (phone 390), Stage 5 pass 2

Production: `m-messages_a6bb0426_895a_4c50_b516_07bb3c5d8e91.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:06:19.695Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Pass 2 after fixes: the Business tab and rail item stay selected on every management route; the phone profile shows three record values at the profile record size and the review count lives in the Campaigns row; brand kit photo references keep their source ratio, the suggest control is full size, In use now is labelled Your saved brand kit and What research found heads the findings; connection and Google controls are full size; Google fixes show only observed values under On Google now and the handoff sentence states the action without an API claim; the subscription caption follows the real billing state; notifications put things to do before things that happened, name the linked campaign or request under a bare title, and the count is muted; the thread placeholder and timestamps use the supporting text treatment; team roles are ink; the public creator profile has no vehicle inventory row and 4px identity corners. Two requests were declined on product grounds and are reported as such: View work on the shared Home objects stays cobalt because those objects are the approved Stage 1 composition and are not restyled per screen; a Contact support link is drawn only when a support mailbox is configured, and none is yet. The person, what the thread is about as one quiet line, bubbles (mine graphite, theirs white), composer above the tab bar.

**Verdict.** Frame Shift is mostly transferred and visible messaging functionality survives, but the missing Business selected state prevents full sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Not yet ready at 390px: restore the Business tab’s selected state and recapture. Visible messaging functionality remains exposed; sending, persistence, keyboard behavior and outgoing-bubble styling cannot be verified from this capture.

The supplied Lab image is Profile, not a Messages specification, so fidelity is assessed against its system treatment and the stated thread requirements. Production carries the mineral and white surfaces, ink hierarchy, supporting text, restrained borders and operational spacing convincingly. The incoming bubble is white, thread events remain literal, and the composer is unobstructed above navigation. There is no reason to import Profile’s graphite masthead, money or media joint. The concrete remaining mismatch is navigation: the Lab demonstrates a clear active destination, while production’s Business tab remains visually inactive.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 7 |
| ai slop risk | 1 |

## Keep

- Mineral canvas #F4F3EF, white incoming bubble and composer, restrained divider and no floating-card shadows.
- Compact person identity with one quiet, single-line thread subject.
- Readable message copy and the corrected supporting treatment for timestamps and the Message placeholder.
- Composer above the tab bar, with a full-size input and Send control; the subdued Send appearance is appropriate for an empty draft.
- Actual business thumbnail, honest initial fallback and sparse history without replacement media or filler content.
- Visible back navigation, account switcher, search, messages, notifications and business navigation destinations.

## Expected differences (real data)

- Demo Coffee Co., demo-creator and the stored campaign title replace the Lab’s fictional personal-profile content. Existing demo strings in records should not be rewritten or supplemented with presentation labels.
- The creator’s initial is an appropriate fallback for an absent portrait.
- The dates, incoming message, proof submission and revision request reflect the actual thread history; they should remain literal rather than become decorative status badges.
- This utility screen correctly omits the Lab Profile’s large identity region, vehicle assembly, work samples and financial records. No artificial source-to-commitment offset is needed.

## Drift and usability

2. [drift] **Include business-context Messages index and thread routes in the Business tab’s active-route mapping. Render its icon and label in #151B23, use IBM Plex Sans 600 at 14/18px for the label, and add the approved centered 24×3px #2450E8 top selection edge. Preserve the existing tab geometry and minimum 44px target. Keep Create’s cobalt treatment as an action, not a current-location indicator.** (Bottom navigation, Business tab). Business is muted like the inactive destinations and has no selection edge. The claimed pass-2 navigation fix is therefore not visible, leaving this management thread without a clear current section.
