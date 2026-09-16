# Transfer QA: Production Notifications (phone 390, full page), Stage 5 pass 1

Production: `m-alerts-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:41:22.614Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Unread is weight and a cobalt dot; actionable kinds first; each row deep links.

**Verdict.** Frame Shift is largely present and real functionality remains exposed, but Notifications needs action-first ordering and clearer request identification before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold this 390px screen for action-first ordering, request provenance and the unread-count color correction. The capture exposes the real records and navigation, but cannot establish that every row deep-links correctly. Before release, tap-test every row against its associated record and verify existing read-state and badge behavior.

The visual foundation is close: the warm mineral surface, ink heading, neutral row rules, compact identity and white navigation translate the approved language appropriately to a utility screen. Text wraps within the captured width, and the final record clears the bottom navigation. Money remains attached to its specific approval condition rather than presented as earned funds. Account switching, Search, Messages, Notifications and business navigation remain exposed. The outstanding problems are operational hierarchy and clarity—not a need for more graphite or media: review work is interleaved with informational notices, two requests are indistinguishable, and amber incorrectly labels unread quantity.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 7 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, graphite text, restrained dividers and white bottom navigation, without floating cards or decorative branding.
- Strong application heading, readable operational typography and consistent 16px outer content gutters.
- Cobalt unread dots and heavier unread titles; the three visible dots agree with both notification counts.
- Literal notification kinds, timestamps and approval-to-pay wording.
- Compact business imagery and the restrained cobalt Create control; no unnecessary media composition or structural notch.

## Expected differences (real data)

- The supplied Lab capture is Profile, not Notifications. This is a system-level comparison; a quiet notification list correctly omits the Profile masthead, vehicle, media assemblies and source-to-commitment offset.
- Demo Coffee Co.’s business image, account switcher and five business navigation destinations correctly replace Maya’s personal identity and navigation.
- The local records, handles, dates, seed-authored copy and three unread notifications are legitimate production-data differences. Existing '[demo]' text is record content, not a reason to add further demo labels.
- The $75 and $25 amounts belong to separate review notifications and remain explicitly conditional on approval; they should not resemble an available balance or subscription charge.

## Drift and usability

1. [usability] **Sort actionable notification kinds before informational kinds: assign review-required kinds actionPriority=0 and informational request/system events actionPriority=1, then order by actionPriority ASC, created_at DESC with a stable record-ID tie-break. Preserve each record’s actual unread state. The visible Needs review entries must precede the informational acceptance and welcome entries.** (Notification list ordering). Two acceptance notices lead the list, and a TapMart welcome notice appears before another Needs review item. The visible ordering follows recency rather than the explicitly required actionable-kinds-first hierarchy.
2. [usability] **Keep each stored acceptance title, but add the associated request or campaign title beneath it using IBM Plex Sans 14px/20px, weight 400, color #526171 and a 4px top gap. Include the creator identity when supplied by the associated record. Allow wrapping rather than truncating the distinguishing source. Keep the entire row linked to that exact request; do not invent labels or merge separate records.** (First two Request · New rows). The first two rows both say 'Your request was accepted', have the same kind and timestamp, and provide no distinguishing request or person. Users cannot tell which work either row opens.
3. [drift] **Change the heading’s '3 new' color from waiting amber to #526171, retaining IBM Plex Sans 14px/20px at weight 500. Reserve #845600 for literal waiting or attention states; continue expressing unread through title weight and the existing #2450E8 dots.** (Unread summary beside Notifications). Unread quantity is not a waiting state. The amber count introduces a second status meaning that the notification records do not establish.
