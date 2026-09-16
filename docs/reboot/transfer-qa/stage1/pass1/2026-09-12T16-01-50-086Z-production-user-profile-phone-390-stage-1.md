# Transfer QA: Production User Profile (phone 390), stage 1

Production: `m-me-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:01:50.086Z
Instructions: Real signed-in production capture at 390 wide, full page; the tab bar is fixed in the app and pinned to the document end only for this capture. This person has no profile photo (an initial shows), a real listed car with one real photo and no 3D model, a manually confirmed Instagram, verified creator status, three real submissions (one a video without a poster), and no payout requested.

**Verdict.** Frame Shift is substantially transferred and real functionality remains visibly exposed, but the header drift, posterless-video treatment and vehicle identity conflict prevent release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Hold sign-off for the three issues below. The capture shows no obvious loss of real data or destinations, but cannot prove interaction behavior. After correction, smoke-test account switching, profile editing, vehicle and submission inspection, earnings and navigation; confirm Add vehicle remains accessible through All vehicles. Retain the app’s fixed 64px bottom bar plus safe-area spacing.

Most of the transfer is close: identity dimensions and overlap, typography hierarchy, unboxed records, neutral surfaces, compact vehicle joint, money treatment and bottom-navigation selection follow the Lab. Longer real content and the assigned-shoot destination explain legitimate layout differences. The remaining problems are concrete: the light shell breaks the continuous graphite masthead, the posterless video lacks a finished fallback, and the vehicle photograph conflicts with its named identity.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 6 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- The 104×130px identity reservation, 4px corners, 12px masthead overlap and prominent 30/32px name treatment closely match the approved composition.
- The mineral canvas, graphite identity plane, square white vehicle facts, restrained cobalt and shadow-free operational regions retain the approved surface hierarchy.
- The unboxed, content-aware record tracks preserve readable money and labels without squeezing the shorter real values into fixture-sized boxes.
- The vehicle remains subordinate to identity, with a contained photograph, offset factual plane, ink View vehicle action and explicit Smart Vehicle · Photos only caption.
- Recent-work frames retain source-ratio letterboxing and readable literal statuses rather than becoming cropped social-feed tiles.
- The section order, Edit profile, capability chevrons, View Activity, Open Earnings, secondary destinations and selected Profile navigation remain exposed.

## Expected differences (real data)

- The D initial correctly replaces the absent portrait while retaining the identity reservation. The real name, handle and Raleigh location should not be replaced with Lab content or given demo labels.
- $34 Earned, 1 Completed and New Rating correctly replace fixture statistics without inventing reviews.
- Confirmed manually · 1,850 followers and the independently Verified creator status are legitimate real states; the green verification text is appropriate.
- A different saved vehicle, its real listing metadata and Photos only state are expected. No model or View 3D control should be invented.
- The three real submissions correctly retain their own media ratios and In review, In review and Paid states. A posterless video needs an honest fallback, not replacement photography.
- Available $34 and No payout requested correctly replace the fixture balance, requested payout and date. Private earnings remain separate from public-profile destinations.
- Unread badges, All vehicles and Your shoots · 1 assigned preserve real-account functionality absent from the fixture.
- The bottom navigation appearing at the document end is an explained capture accommodation, not production positioning drift.

## Drift and usability

1. [data_honesty] **Verify the saved vehicle record before release. Bind the photo, year/make/model, color and View vehicle destination to the same vehicle.id; remove cross-record or fixture image fallbacks, using null when no photo exists. If the saved record itself contains this mismatch, correct it through the existing vehicle-edit/verification flow using confirmed owner data. Do not guess a replacement model name or insert a stock Toyota image.** (Vehicles: photograph and 2021 Toyota Camry factual plane). The photograph visibly depicts a BMW, while the adjacent facts say 2021 Toyota Camry. That contradicts the source-to-fact relationship. The capture cannot establish whether this is a migration binding error or inconsistent saved data.
2. [drift] **Set the existing 64px root header background to #101820, primary account text and navigation icons to #F6F8FB, and supporting text to #B3C0CE. Preserve the circular shell avatar, account switcher, unread badges and existing control targets. Keep the masthead boundary at y=246px; do not add height or move the identity assembly.** (Top account/navigation shell, y=0–64px). Production introduces a pale band above Profile, whereas the Lab header and identity masthead form one continuous graphite plane. This is a surface-treatment change, not a real-data difference.
2. [usability] **When poster_url is null, replace the blank video surface inside the existing 104×139px frame with #1D2833, a fully opaque 24px video/play icon at 1.75px stroke, and a labeled View video action with a minimum 44×44px target wired to that submission’s existing inspection route. Use 14/20px #B3C0CE text for No preview available. Retain the real Recreate and In review labels; do not fabricate a poster or autoplay.** (Recent work: first Recreate submission). The first recent-work item is mostly a blank white rectangle with only a Video badge. The absent poster is legitimate, but this rendering resembles unfinished or failed media and does not clearly communicate inspection.
