# Transfer QA: Production Connections, reconnect and error (phone 390, full page), Stage 5 pass 1

Production: `m-business_settings_connections-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:37:58.226Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. Instagram needs reconnecting; Google returned an error, shown as the provider's own message. Buttons are disabled because this environment has no provider credentials, and the row says so.

**Verdict.** Frame Shift was faithfully transferred to Connections, with real states and visible functionality preserved and only minor navigation-selection polish remaining.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Visually approved at 390px, with one non-blocking navigation-state polish item. The capture exposes the real states, error and configuration limitations without pretending reconnection is available. OAuth execution, control behavior and other viewport sizes remain unverified.

The supplied Lab image is Profile, so this is a system-transfer assessment rather than a same-layout comparison. Production carries over the mineral surface, strong title hierarchy, restrained borders and compact operational typography appropriately. The service rows remain easy to scan, explanatory text wraps within the phone gutters, and the final unavailable service clears the bottom navigation. Instagram's reconnect requirement, Google's attention state and its returned error remain distinct from the environment's missing credentials. There is no invented connection health, substitute media, dashboard decoration or unnecessary financial content. The only visible polish gap is the missing current-section navigation treatment.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 9 |
| media quality | 9 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, ink typography, muted operational copy and flat rows separated by restrained dividers.
- 16px phone gutters, the strong application title and readable 14–16px operational text.
- Literal status words alongside color, with the Google error presented as text rather than invented health or progress.
- Restrained cobalt reconnect controls with 8px corners and clear disabled treatment.
- Settings back navigation, account switching, search, messages, notifications and the business navigation shell.
- The absence of decorative graphite panels, media placeholders, money or an artificial 12px joint: this utility screen has no source-to-commitment boundary.

## Expected differences (real data)

- Demo Roastery uses its business initial rather than the Lab creator portrait; the business identity and notification count are production data.
- Instagram correctly shows Reconnect required rather than an assumed connected or healthy state.
- Google correctly shows Needs attention and retains the returned 403 Forbidden message separately from the provider-configuration explanation.
- Both Reconnect buttons are intentionally disabled because provider credentials are unavailable in this environment. Each service explains that limitation.
- Facebook and TikTok honestly show Not available yet, without fabricated connection records or actions.
- Business navigation replaces the Lab's creator navigation; creator earnings, vehicles and portfolio records do not belong on this screen.

## Drift and usability

3. [usability] **Keep Business selected for its Settings → Connections descendant route: use #151B23 for its icon and label, IBM Plex Sans 600 for the label, and a centered 24×3px #2450E8 top selection edge matching the Lab navigation. Preserve Create as a separate action.** (Bottom navigation, Business item). Every destination is currently muted while Create is the only emphasized item. The approved navigation distinguishes the current section with an ink label/icon and cobalt edge; retaining that treatment would clarify location without changing navigation.
