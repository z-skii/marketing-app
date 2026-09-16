# Transfer QA: Production Notifications (phone 390, full page), Stage 5 pass 2

Production: `m-alerts-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:06:34.013Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Pass 2 after fixes: the Business tab and rail item stay selected on every management route; the phone profile shows three record values at the profile record size and the review count lives in the Campaigns row; brand kit photo references keep their source ratio, the suggest control is full size, In use now is labelled Your saved brand kit and What research found heads the findings; connection and Google controls are full size; Google fixes show only observed values under On Google now and the handoff sentence states the action without an API claim; the subscription caption follows the real billing state; notifications put things to do before things that happened, name the linked campaign or request under a bare title, and the count is muted; the thread placeholder and timestamps use the supporting text treatment; team roles are ink; the public creator profile has no vehicle inventory row and 4px identity corners. Two requests were declined on product grounds and are reported as such: View work on the shared Home objects stays cobalt because those objects are the approved Stage 1 composition and are not restyled per screen; a Contact support link is drawn only when a support mailbox is configured, and none is yet. Unread is weight and a cobalt dot; actionable kinds first; each row deep links.

**Verdict.** Frame Shift is largely transferred and the real notification workflow remains exposed, but this pass needs the Business selection and submission-row hierarchy fixes before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold sign-off at 390px for the two localized fixes below. The capture preserves the real notification content and navigation affordances; deep-link activation and read-state persistence still require interaction testing.

The supplied Lab is a Profile reference, not a Notifications design, so its portrait, graphite masthead, vehicle joint and earnings sections should not be copied here. Production successfully transfers the shared language through mineral surfaces, strong type, flat separators, restrained cobalt and short operational rows. All seven notifications fit without horizontal clipping or bottom-navigation overlap. Money remains literal and conditional, status words remain visible, and the real business shell retains search, messages, notifications and its five destinations. The remaining failures are localized: missing Business selection and inconsistent campaign-context hierarchy in one submission row.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 7 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, flat rows, restrained dividers and 16px phone gutters; no unnecessary cards, shadows or graphite stage.
- Strong application heading, operational typography, muted count and supporting timestamps.
- Needs review items precede accepted-request updates and general TapMart messages.
- Unread dots, stronger unread titles and literal New labels; all three agree with the heading count and bell badge.
- Conditional payment instructions and named request context remain readable without introducing oversized financial displays.
- The compact business image and absence of decorative source-to-commitment offsets are appropriate for this utility screen.

## Expected differences (real data)

- Demo Coffee Co. and its business thumbnail correctly replace the Lab's personal fixture identity; business navigation replaces creator navigation.
- The seven stored notifications, three New states, timestamps, campaign names and creator handles are legitimate production-data differences.
- The $75 and $25 amounts describe payment conditional on reviewing and approving specific work. They should not resemble an available balance or subscription charge.
- The recorded [demo] titles and seed-message text are local record content, not design drift. No additional demo labels are needed.

## Drift and usability

1. [drift] **Include Notifications in the management-route active mapping. Render Business with the approved centered 24×3px #2450E8 top selection edge, #151B23 icon and label, and IBM Plex Sans 600 at 14/18px. Expose its current-section state accessibly. Keep Create's cobalt action treatment independent of navigation selection.** (Bottom navigation, Business tab). Business is visibly muted like the other destinations and has no selection edge. The specified pass-2 management-route selection fix is not present here; Create is the only emphasized bottom control.
2. [drift] **For the linked submission notification, display the bare title "New submission" and place the actual linked campaign name beneath it as context: For "[demo] Recreate our latte pour video". Preserve the creator attribution and existing deep-link destination. Use 16/24px IBM Plex Sans for the title and 14/20px #526171 for campaign context, without truncating the record name.** (Third Needs review row, dated Sep 9). This row still embeds the campaign inside a two-line title while the body only supplies generic submission text. It misses the pass-2 bare-title/linked-context hierarchy already established by the surrounding rows.
