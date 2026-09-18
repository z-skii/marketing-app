# V2 review: User Profile, pass 1

Reviewer: Astra, TapMart's design director.

Captures: user-profile-m.png, user-profile-m-full.png, user-profile-s.png, user-profile-t.png, user-profile-u.png, user-profile-d.png, user-profile-l.png, user-profile-m-work.png, user-profile-d-work.png, user-profile-m-vehicle.png, user-profile-m-settings.png, user-profile-d-settings.png, user-profile-m-share.png, user-profile-m-public.png

**Verdict: fix.** This is fictional creator Maya Chen, with US$420.00 earned and three completed works. Her café content and Story lead; her listed car follows. One work image is visibly unavailable.

## The ten questions

- Does this feel like a premium modern product? **partly**. The portrait, restrained palette and independent media silhouettes feel considered. The missing owner-gallery image, detached desktop edge terminal and undersized sheet headings prevent a finished impression.
- Does it explain itself without paragraphs? **yes**. Identity, earned history, completed work and a listed car are clear through short labels. The measured default has no blocks of 18 or more words.
- Does it feel like a consumer platform, not business software? **yes**. A person and visual work dominate. There are no dashboard tiles, management shelves or administrative rows on the profile.
- Is it memorable? **partly**. The asymmetric work cut has a recognizable shape. Its third subject is absent in every owner capture, weakening the intended signature.
- Does motion improve understanding? **partly**. The supplied detail endpoints preserve the selected subject, but no motion strip demonstrates continuity, timing or restoration. Motion itself is unassessed.
- Does each earning type feel different? **partly**. Authored café content and finished Story creative have distinct silhouettes. Historical car placement appears in the public capture but fails in the owner gallery.
- Is business discovery exciting? **partly**. Not assessable from a personal profile. No Business Home or discovery interaction is shown.
- Is Profile identity, not settings? **yes**. Maya, her portrait, work and history are the page. Settings is a separate, orderly layer.
- Does the website make someone keep scrolling? **partly**. No website capture is supplied. Within this profile, the leading work encourages inspection, but the large unavailable-media block interrupts continuation.
- Is it significantly stronger than current production? **partly**. The measured reduction in copy and page height is substantial. A direct visual comparison requires the production capture, and this implementation still has a blocking media defect.

## Scores

- earning types distinct: 6
- motion understanding: 0
- keeps scrolling: 0
- slop risk: 2
- text discipline: 9
- identity not settings: 9
- stronger than production: 7
- discovery excitement: 0
- memorable: 7
- self explaining: 8
- truthfulness: 8
- premium: 7
- consumer not software: 9

## Spec drift

- The owner gallery does not render the supplied placement image, although the public gallery does. Resolve the same record-backed asset in both projections.
- The 1440px work area starts around x640 rather than x632, and the placement frame is about 192px rather than 248px. Restore the twelve-column allocation and specified widths.
- Desktop gallery edges contain a detached extra terminal. Replace these with one continuous line ending in one flush brick segment.
- Desktop portrait starts at approximately y100 rather than y88; media starts around y142 rather than y128. Restore the coordinated vertical positions.
- Desktop Fictional profile begins at x200 rather than the padded content edge; large-desktop header controls do not follow the centered content container. Align the complete header with the content.
- Phone work inspection uses a square crop of the 4:5 still. Contain the original source ratio.
- Object previews show a back arrow rather than the specified visible Close control.
- Sheet headings are materially smaller than the 28px phone and 36px desktop title tokens.
- Public No reviews yet is outside the explicit supplied public projection. Omit it unless the contract is deliberately expanded.
- Measured copy is 32 words on phone and 36 on desktop, two above the screen targets. Media unavailable accounts for that difference relative to the intended populated state; remeasure after restoring the asset rather than cutting useful labels.

## Spec was wrong

- The phone instruction put connection and payout signals below the metrics. The built arrangement beside the portrait is more compact and keeps both leading work images visible at 390px. Keep this arrangement when it fits; move signals below the metrics only when identity wrapping requires it.
- The screen spec inconsistently requested Phosphor while the shared system specifies Lucide. Follow the shared Lucide system throughout: 20px utility icons, 22px navigation icons, consistent strokes and 44px targets.
- The public projection should not preserve the owner's metric layout after removing private fields. Put the permitted Completed count in the identity rail beneath the location, and start Work 32px below the portrait row. Do not reserve an empty owner-money section.
- The literal dollar examples were insufficiently explicit about currency ambiguity. Keep an unambiguous USD representation, but avoid the redundant 'US$80.00 USD' treatment in Payment details. Use '80.00 USD' there and retain the compact unambiguous currency treatment elsewhere.

## Fixes

- 1. Make the delivered rear-door placement asset resolve consistently for the owner and public projections. Inspect the actual request, decode and fallback state; do not replace it with different imagery. Recapture the populated owner gallery at every width and retain a separate deliberate failure-state capture. (Third work record on /design-lab-v2/profile and its alias.): Every owner capture shows Media unavailable, while the public capture displays the placement image. The asset's existence does not establish that the owner implementation works.
- 2. Restore the exact desktop grid. At 1440px, begin work at x632 with a 776px area: 320px Recreate, 160px Story, 248px placement and two 24px gaps. At 1920px, preserve x420 for the content start, use the four/eight-column allocation and approximately 317px for placement. Draw one continuous 2px baseline with one 12px brick terminal flush at its right end. (1440px and 1920px completed-work spread.): At 1440px work starts around x640 and placement is only about 192px wide. Both large captures show a second, detached terminal beyond the media edge. This breaks the signature rather than merely changing spacing.
- 3. Align the desktop composition vertically: portrait and Work heading begin at y88, media deck runs y128–528, metric values begin at y544, and the vehicle row begins around y578. Keep header content within the same padded, maximum-width container: x232–1408 at 1440px and x420–1700 at 1920px. (Desktop main header, identity, work and vehicle alignment.): The current deck and vehicle sit roughly 14–16px low. Fictional profile is attached to the sidebar boundary and header controls sit at the viewport edge, disconnected from the composed content.
- 4. Show the complete 4:5 submission still in the phone work preview. Use a contained frame with reserved intrinsic ratio rather than the current square crop. Keep Expand media available without changing the source framing. (Phone Latte take preview.): The phone detail crops away source context while desktop contains it. Inspection should reveal the same work, not silently create a tighter composition.
- 5. Apply the sheet-title hierarchy consistently: 28px Bricolage 600 on phone and 36px on desktop. Retain the 56px Settings rows and 44px close targets. Do not enlarge the row text or introduce subtitles. (Phone Settings and Share sheets; desktop Settings drawer.): Settings and Share profile currently read at approximately ordinary section-heading size. Temporary tasks need a clearer title without making their content denser.
- 6. Give work and vehicle previews a visible Close label with a 44px target, matching the public preview's explicit exit. Preserve Escape, browser Back and focus restoration. (Phone and desktop object-preview headers.): The captures use an unexplained back arrow where the spec requires a visible Close control. A temporary inspection layer should have an unambiguous exit.
- 7. Reflow the public identity as specified in the revised instruction and remove No reviews yet from this projection unless review state is explicitly added to the permitted public contract. Verify that public work inspection also excludes credited amounts and Payment details. (Public-safe query state and its object previews.): The public capture retains a large owner-shaped metric region and displays review state outside the supplied public allowlist. Hiding the headline earnings alone is not sufficient privacy validation.
- 8. Render expanded payment amounts once with their currency, for example '80.00 USD', '5.00 USD' and '75.00 USD'. Keep Credited, its date and the bank-payout distinction. Supply a full-height phone capture showing the entire expanded disclosure. (Payment details in work previews.): The current repeated currency notation adds noise. The supplied phone capture ends before the full credited breakdown and consequence sentence can be inspected.

## Keep

- Warm paper, green-black typography, untreated imagery and square media edges. Do not introduce cards, gradients or decorative depth.
- The rectangular portrait, prominent name and unboxed Earned and Completed metrics.
- The bottom-aligned Recreate and intact 9:16 Story duet on phone.
- Four labelled personal destinations with a quiet Profile underline; Settings remains the sole administrative entrance.
- Explicit Fictional profile provenance, Instagram not connected, No reviews yet and the absence of invented ratings, followers or verification.
- Credited is distinct from a bank payout in the work preview. Keep the historical breakdown and its consequence sentence.
- The small current-vehicle presentation, full vehicle photography and honest Rate not listed state.
- The public capture excludes owner earnings, payout readiness, connection administration and owner navigation.

## Why better than production

The measured profile drops from 98 to 32 words on phone and 102 to 36 on desktop; phone first-screen copy falls from 57 to 26 words. More importantly, Maya and her work lead, while administration sits behind one gear. The phone page is 503px shorter without removing the three work records or vehicle. That is a meaningful structural improvement. No production screenshot was supplied, so visual superiority over production remains provisional. This pass is not ready: the owner gallery loses its third image, and several inspection and alignment details undermine the finish.

## Remaining risks

- Scores use a 0–10 scale; zero for motion_understanding, discovery_excitement and keeps_scrolling means unassessed, not demonstrated failure. The production-comparison score is provisional.
- No motion strip establishes shared-element continuity, reduced-motion behavior, focus movement or scroll restoration.
- Story and historical placement details were not captured. Their individual record mapping, historical intervals, manual confirmation, proof period and remaining ledger credits still require inspection.
- The visible Recreate breakdown supports 80.00 gross minus 5.00 fee equalling 75.00 credited. The complete 420.00 ledger total cannot be verified from these pixels alone.
- Public nested previews and serialized share data must be checked for private financial fields; the public landing capture alone cannot prove isolation.
- Loading, unknown earnings, missing portrait, empty work, missing vehicle and failed profile-read states are not demonstrated.
- Keyboard operation, 200% zoom, screen-reader semantics, safe-area behavior, clipboard success and failure, route gating and production isolation require interaction evidence.
- Artwork text must be measured separately from interface copy. The visible Story contains 'Take a coffee break.'; the placement branding appears only in the public capture.
- A second real capture after these fixes is required before approval.
