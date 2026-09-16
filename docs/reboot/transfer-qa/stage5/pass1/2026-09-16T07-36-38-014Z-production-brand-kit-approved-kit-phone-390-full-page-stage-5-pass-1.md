# Transfer QA: Production Brand kit, approved kit (phone 390, full page), Stage 5 pass 1

Production: `m-business_brand-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:36:38.014Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The approved kit as a visual: logo, colours, typography direction, photo style, voice, content style, rules.

**Verdict.** Frame Shift is substantially faithful and the visible functionality survives, but fix media framing, the suggestion control and navigation selection before shipping this viewport.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Close, but hold release at 390px for the targeted fixes below. The capture exposes account switching, search, messages, notifications, Settings, Suggest improvements and business navigation. It cannot verify their behavior; smoke-test that suggestions preserve the current kit and that a proposal changes it only after explicit Approve.

The supplied Lab image is a creator Profile, not a Brand kit specification, so this is a system-level comparison. Production successfully carries over the mineral surface, strong heading hierarchy, operational text, restrained borders and literal status treatment without importing an inappropriate profile hero. All requested approved-kit categories are visible, and no money or fictional capability has been added. The remaining issues are localized: source-photo cropping, a compact suggestion control and missing navigation selection. Proposal comparison, source discovery and approval gating are outside this captured state and cannot be certified from these pixels.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 7 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 1 |

## Keep

- Mineral canvas, ink typography, restrained dividers and white navigation without floating cards or shadows.
- Strong Brand kit heading and a straightforward sequence covering identity, colours, typography, photography, voice, content and rules.
- Literal Approved status in confirmed green, with cobalt reserved for meaningful application actions.
- Explicit profile-image provenance and the statement that changes require the user’s decision.
- The quiet utility composition: no graphite hero, financial content or decorative source-to-commitment notch is needed in this approved-kit view.

## Expected differences (real data)

- Demo Coffee Co., its profile image, photographs and approved brand guidance replace the Lab’s fictional creator records.
- The lime #C8FF3D, dark #0B0D0E and off-white #F7F7F5 swatches are business brand data, not incorrect TapMart interface colours. Likewise, “Body — Inter” describes the kit rather than the application typography.
- “Logo from your profile, not yet part of the kit” honestly distinguishes the available profile asset from an approved kit logo.
- This approved state appropriately shows Current brand · Approved and Suggest improvements rather than a pending proposal’s Approve action.
- Business navigation and the notification count reflect the production account context. Creator earnings, vehicle information and personal-profile sections do not belong here.

## Drift and usability

2. [usability] **Give Suggest improvements a minimum 44px hit height and IBM Plex Sans 600 at 16/20px. At widths of 390px and below, place it below the status with a 12px gap and width:100%; retain the 8px radius, white surface and 1px #788595 border.** (Current brand · Approved / Suggest improvements row). The visible button is approximately 40 CSS pixels high and uses smaller action text than the approved button treatment. The current side-by-side row has insufficient room to restore the action typography comfortably.
2. [drift] **Render the Photo style references at width:84px; height:auto; aspect-ratio:auto with an 8px gap and top alignment. Remove square-cover cropping and retain 4px media corners. Change the profile-sourced logo frame from approximately 8px to 4px corners while preserving its contained image.** (Photo style thumbnails and profile-sourced logo frame). The cup photograph is shown as a landscape source in the logo fallback but becomes a cropped square in Photo style. Source material should retain its composition rather than being normalized into square tiles.
2. [usability] **Keep Business selected on its nested management routes: add the Lab’s centered 24×3px #2450E8 top selection edge, use #151B23 for its icon and label, and set the label to IBM Plex Sans 600. Expose the current section programmatically.** (Bottom navigation — Business). Every destination currently has the same muted treatment. The prominent Create action does not communicate the current location; the Lab navigation provides both a selected edge and stronger selected text.
