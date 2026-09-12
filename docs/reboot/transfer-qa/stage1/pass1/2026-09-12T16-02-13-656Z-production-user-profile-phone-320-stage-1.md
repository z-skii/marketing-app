# Transfer QA: Production User Profile (phone 320), stage 1

Production: `s-me-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:02:13.656Z
Instructions: Real production capture at 320 wide, full page; the tab bar is fixed in the app and pinned to the document end only for this capture. At 320 the identity plate and the vehicle assembly stack by design; judge the stacking rules rather than pixel positions against the 390 Lab capture.

**Verdict.** Frame Shift is substantially transferred and real functionality remains visibly exposed, but the header drift and source-honesty issues prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold release sign-off for the issues below. The capture shows the real records, independent states and principal destinations still exposed; it does not establish that navigation, editing, payouts or permission checks work. After correction, recapture at 320px and smoke-test those existing flows.

Most operational styling and hierarchy transferred well: the narrow layout stacks without clipping the identity or money, sources remain compact, controls remain visible, and real verification, work, earnings and assignment states are retained. The main visual drift is the light 64px header interrupting the approved graphite identity plane. More importantly, the BMW photograph contradicts its Toyota caption, and the Story preview loses explicit source provenance. The intentional 320px stacking and capture-only tab-bar placement are not defects.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 5 |
| uniqueness | 7 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 7 |
| ai slop risk | 1 |

## Keep

- The intentional 320px stacking: the identity remains first, the full name is visible, and vehicle facts are not squeezed beside the photograph. Do not restore the 390px coordinates.
- The 104×130px identity reservation, strong name hierarchy, 16px page gutters and readable, unboxed record values.
- Mineral canvas, graphite identity plane, square white vehicle facts, restrained dividers and shadow-free ordinary regions.
- The compact, contained vehicle photograph and explicit Smart Vehicle · Photos only state, without a fabricated model or unavailable 3D control.
- Source-aware recent-work framing, separate backend status labels and the View Activity action.
- The capability order, private Earnings section, portfolio/public-profile/settings destinations and selected Profile navigation. The tab bar's document-end placement is capture-only, not a regression.

## Expected differences (real data)

- The D initial, demo-creator name, @democreator handle and Raleigh location replace Maya's fixture identity. No replacement portrait or Demo label is needed.
- $34 Earned, 1 Completed and New Rating correctly represent a different record and an absent rating; fixture earnings and reviews must not be restored.
- Instagram shows 1,850 followers and Confirmed manually, while creator verification independently shows Verified. These real states need not match the unverified Lab fixture.
- Real vehicle metadata, Listed for ads and the All vehicles destination can differ from the Lab's Corolla and Add vehicle action. The photograph's identity mismatch is a separate issue.
- The video reference and different creative proportions are legitimate source differences. In review, In review and Paid must remain backend-driven rather than matching the fixture statuses.
- Available $34 and No payout requested correctly replace the fixture balance and requested payout. Lifetime earnings and available money remain separate despite having the same value.
- Unread counts and Your shoots · 1 assigned expose real account functionality absent from the Lab fixture.

## Drift and usability

1. [data_honesty] **Resolve the photograph and year/make/model from the same vehicle.id, with no cross-record or generic vehicle-image fallback. Check the saved upload as well as the binding: correct the association or saved asset through the existing vehicle-edit flow. Show an identity-matched Camry photograph, or the existing compact no-photo state if none is available; do not guess new metadata from the image. Retain the 184×136px source reservation and contained media treatment.** (Vehicles: photograph attached to 2021 Toyota Camry). The photograph visibly depicts a BMW, including its kidney grille, while the attached facts say 2021 Toyota Camry. That breaks the source-to-fact relationship regardless of whether the cause is migration code or stored production data.
2. [drift] **Apply the Profile route's graphite treatment to the existing 64px root header: background #101820, primary text and icons #F6F8FB, secondary account text #B3C0CE. Retain the circular initial fallback, account switcher, unread badges, existing actions and 44px targets.** (Top account and navigation header). Production introduces a light header above the graphite masthead. The approved capture presents one continuous graphite identity/navigation plane; this difference is not required by real data or the 320px stack.
2. [data_honesty] **Restore a record-bound source-role line beneath the Story status using IBM Plex Sans 400 at 14/20px in #526171. Render Supplied creative when this thumbnail is the supplied creative; if it is actual submitted evidence, display its truthful source role instead. Keep In review independent and unchanged.** (Recent work: middle Story item). Production shows only Story and In review beneath the creative. Unlike the Lab's explicit Supplied creative caption, it does not establish whether the image is a supplied sheet or submission evidence.
