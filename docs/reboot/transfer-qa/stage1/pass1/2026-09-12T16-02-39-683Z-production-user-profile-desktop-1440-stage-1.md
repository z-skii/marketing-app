# Transfer QA: Production User Profile (desktop 1440), stage 1

Production: `d-me.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:02:39.683Z
Instructions: Real production capture at 1440x900 with the 200px graphite rail. The approved Lab defined the phone composition only; desktop keeps the same order in two columns (identity, record, capabilities and vehicle left; recent work, earnings and destinations right). Judge whether that translation keeps the approved treatment and is usable.

**Verdict.** Frame Shift is largely transferred and visible production functionality is preserved, but source honesty and the desktop vehicle joint need correction before sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Close, but not ready for release. Resolve the media identity/provenance issues and desktop vehicle offset, then recapture. Visible functionality appears preserved; navigation execution, editing, source inspection and scrolling to Settings still require a smoke test. Settings being below this capture is not evidence that it was removed.

Most of the transfer is convincing: the rail replaces the phone shell appropriately, the identity retains its measured overlap, typography and unboxed money remain hierarchical, and the two columns preserve the intended grouping without turning the vehicle into a hero. Real verification, review, payment and empty-payout states remain visible and independent. The release concerns are localized: an apparent vehicle/source identity mismatch, an uninformative video preview, missing Story provenance, and a vehicle joint still using phone geometry.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 5 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 8 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- Keep the approved desktop translation: 200px graphite rail, left-side identity/record/capabilities/vehicle, and right-side recent work/earnings/destinations.
- Keep the 104×130px identity reservation at x=232, y=68 and its exact 12px crossing below the masthead at y=186. The initial fallback preserves the identity composition.
- Keep the mineral canvas, graphite masthead, restrained mark, square financial regions and absence of app-card shadows.
- Keep the prominent name, unboxed record values, readable operational text and separate Earned versus Available money contexts.
- Keep the modest vehicle source, square white factual plane, Photos only caption and ink View vehicle action.
- Keep source-ratio letterboxing, literal text statuses, the selected Profile rail edge, and visible production destinations including All vehicles, Activity and Earnings.

## Expected differences (real data)

- The D initial, demo-creator identity, @democreator handle and Raleigh location legitimately replace Maya’s fixture identity. Do not invent a portrait or add a Demo label.
- $34 Earned, 1 Completed and New Rating replace the fixture statistics. New is an appropriate unrated state rather than an invented numerical rating.
- Confirmed manually, 1,850 followers and Verified reflect production states. Instagram provenance and creator verification correctly remain separate.
- The saved vehicle’s name, color and Listed for ads state may differ from the fixture. Photos only and the absence of a 3D control are appropriate; the apparent photo/identity mismatch is flagged separately.
- A video reference, landscape Story creative and square Recreate source can replace the fixture photographs. In review, In review and Paid must remain the actual record states.
- Available $34 and No payout requested correctly replace the fixture balance and requested payout. Omitting Demo money and the fixture payout date is correct.

## Drift and usability

1. [data_honesty] **Verify that the photograph and facts resolve from the same vehicle.id and its saved media association. The photograph appears to show a BMW, while the facts say 2021 Toyota Camry. If the mismatch is persisted data, correct it through the existing vehicle-record workflow rather than silently changing the displayed make/model. If no identity-matched photo is available, retain the 184×136px reservation with an honest Photo unavailable state; do not substitute stock imagery.** (Vehicles: photograph at approximately x=232, y=492 and adjacent 2021 Toyota Camry facts.). The visible kidney-grille vehicle does not appear to match the named Toyota. Frame Shift requires the inspected source and factual vehicle identity to describe the same object. The capture cannot establish whether this originated in migration or existing data.
2. [usability] **Render the selected video’s genuine poster or decoded frame with object-fit: contain inside the existing 104×139px frame. If no preview is available, show Video preview unavailable at 14/20px and retain the existing source-inspection destination with a minimum 44×44px target. Do not generate a replacement poster or require autoplay.** (Recent work: first Recreate tile, approximately x=920, y=262.). The first recent-work tile is visually blank apart from Video and dark side bars. A video instead of a still is valid, but this static state does not identify the work or explain the missing preview.
2. [data_honesty] **Restore a source-provenance line beneath the Story state using IBM Plex Sans 14/20px and #526171. Bind it to the actual asset role: Supplied creative only for supplied creative, or the corresponding truthful evidence label otherwise. Preserve In review independently.** (Recent work: Story caption beneath the middle preview.). The approved capture distinguishes the Story’s supplied creative from publication evidence. Production shows Story and In review but drops that source-role distinction.
2. [drift] **At the desktop breakpoint, set the vehicle factual plane’s block-start offset to --tm-shift-desktop: 24px, measured from the top of the 184×136px source reservation. Retain the centered 184×123px photograph, 4px media corners and 0px factual-plane radius. Leave the identity masthead’s explicit 12px crossing unchanged.** (Vehicles: source-to-fact joint around x=416, y=497.). The white vehicle plane starts only about 5–6px below the visible photograph, consistent with the phone’s 12px offset after the image’s centering inset. The approved desktop source-to-fact offset is 24px.
3. [drift] **Change All vehicles text and any associated icon to #151B23 while preserving its current route and minimum 44px target.** (Vehicles heading: All vehicles.). This is now a secondary collection-inspection link, not the Lab’s primary Add vehicle action. Its inherited cobalt treatment competes with the system’s reserved primary-decision accent.
