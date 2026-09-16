# Transfer QA: Production Messages, one thread (phone 390), Stage 5 pass 1

Production: `m-messages_a6bb0426_895a_4c50_b516_07bb3c5d8e91.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:41:08.674Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The person, what the thread is about as one quiet line, bubbles (mine graphite, theirs white), composer above the tab bar.

**Verdict.** Frame Shift was substantially faithfully transferred and visible messaging functionality survives, but fix the composer contrast and timestamp size before release sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Small typography and contrast patch before release, not a redesign. The capture preserves the visible messaging and navigation surface; actual sending, outgoing graphite bubbles, keyboard behavior and error handling remain unverified.

The supplied Lab capture is Profile, not Messages, so fidelity here concerns the approved system rather than matching that layout. Production correctly carries across the mineral surface, ink hierarchy, operational typography, white working regions and restrained borders. Less graphite and media are appropriate for this utility screen. The person, thread context, dated history, message, composer and business navigation remain visible, with no horizontal overflow or invented status. No source-to-commitment joint or money comparison applies here. The remaining deviations are localized text-treatment issues, not a failure of the transfer.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, white incoming bubble, restrained divider and shadow-free layout.
- Recipient identity followed by one quiet, single-line thread context.
- Literal proof-submission and revision-request events, visually distinguished from authored messages.
- Readable 16px message copy, 16px phone gutters and restrained cobalt.
- Composer above the persistent business tab bar without overlap.
- No decorative offset, media assembly or financial region where this conversation does not require one.

## Expected differences (real data)

- Demo Coffee Co., demo-creator, the D initial, Story context, dates and conversation events correctly replace fictional Lab records.
- Business navigation and recorded notification counts appropriately differ from the Lab’s personal-account shell.
- The visible incoming message is white. No outgoing message is present, so a graphite bubble should not be fabricated.
- An empty composer appropriately presents a muted Send state; active cobalt should follow an actionable draft.

## Drift and usability

2. [usability] **Set the composer’s ::placeholder color to #526171 with opacity: 1. Retain IBM Plex Sans 400 at 16px/24px, the white field and #788595 border.** (Bottom composer placeholder). “Message” is visibly pale against white compared with the approved supporting text. The empty composer’s instruction needs normal-text contrast rather than disabled-looking treatment.
3. [drift] **Set message timestamps to IBM Plex Sans 400 at 14px/20px with color #526171. Preserve the existing bottom-right alignment and bubble padding.** (Incoming message timestamp). “6:44 AM” appears approximately 12px, smaller than the approved 14px/20px metadata treatment used elsewhere on this screen.
