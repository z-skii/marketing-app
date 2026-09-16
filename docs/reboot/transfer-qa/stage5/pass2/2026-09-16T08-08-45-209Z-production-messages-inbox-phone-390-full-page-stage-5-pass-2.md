# Transfer QA: Production Messages inbox (phone 390, full page), Stage 5 pass 2

Production: `m-messages-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:08:45.209Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Pass 2 after fixes: the Business tab and rail item stay selected on every management route; the phone profile shows three record values at the profile record size and the review count lives in the Campaigns row; brand kit photo references keep their source ratio, the suggest control is full size, In use now is labelled Your saved brand kit and What research found heads the findings; connection and Google controls are full size; Google fixes show only observed values under On Google now and the handoff sentence states the action without an API claim; the subscription caption follows the real billing state; notifications put things to do before things that happened, name the linked campaign or request under a bare title, and the count is muted; the thread placeholder and timestamps use the supporting text treatment; team roles are ink; the public creator profile has no vehicle inventory row and 4px identity corners. Two requests were declined on product grounds and are reported as such: View work on the shared Home objects stays cobalt because those objects are the approved Stage 1 composition and are not restyled per screen; a Contact support link is drawn only when a support mailbox is configured, and none is yet. One row per conversation: the person, the real thing the thread is about, the last line, when.

**Verdict.** Frame Shift’s utility language and visible conversation functionality transferred well, but the missing Business navigation selection prevents pass-2 release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold sign-off for the missing Business navigation selection. The capture shows the real conversation structure and navigation controls preserved; opening threads, switching accounts and destination behavior still require interaction testing.

The supplied Lab image is a creator Profile, not an inbox, so its composition is not a screen-level template here. Against the approved system, the production inbox is appropriately quiet: mineral background, strong heading, legible operational typography, circular initials, thin separators and no theatrical media or decorative joints. Each visible row retains its work context, last message and timestamp; long text truncates without horizontal overflow at 390px. The supporting timestamp treatment is corrected. The remaining visible failure is navigation state: unlike the Lab’s clearly selected Profile destination, production gives Business no selected treatment.

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

- Mineral canvas, flat conversation rows, restrained dividers and 16px phone gutters; no floating cards or unnecessary graphite.
- Strong Messages heading and creator names, with work context, message excerpts and timestamps in supporting text treatment.
- One row per conversation: person, named Story or Recreate work, last line and time.
- Literal message excerpts, including payment-sent wording, remain conversation content rather than being promoted into an independent financial status.
- Compact account identity, visible header controls and the existing five-item business navigation shell.

## Expected differences (real data)

- Demo Coffee Co., demo-creator and the stored campaign titles are real local records; retain them rather than substituting Lab identities or removing record-authored [demo] text.
- The circular D initials are appropriate portrait fallbacks, not missing decorative media.
- Three conversations with the same creator remain separate because they concern different work. Their message excerpts and timestamps correctly reflect those records.
- Business navigation appropriately differs from the Lab’s personal-account navigation.
- This utility inbox correctly omits the Profile’s graphite identity assembly, vehicle media, portfolio and balances. No source-to-commitment offset is needed here.

## Drift and usability

1. [drift] **Include the business Messages inbox in the Business navigation active-route group. Render the Business icon and label in #151B23, use IBM Plex Sans 600 at 14/18px for the selected label, and restore the centered 24px-wide × 3px-high #2450E8 top selection edge shown by the approved navigation. Preserve the separate cobalt Create action.** (Bottom navigation, rightmost Business item.). Business is still muted like the inactive destinations, with no selected edge. The prominent Create action is not a location indicator. This contradicts the stated pass-2 requirement that Business remain selected on management routes.
