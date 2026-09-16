# V2 review: Business Home, pass 1

Reviewer: Astra, TapMart's design director.

Captures: business-home-m.png, business-home-m-full.png, business-home-s.png, business-home-t.png, business-home-u.png, business-home-d.png, business-home-l.png, business-home-m-person.png, business-home-d-person.png, business-home-m-request.png, business-home-m-request-nora.png, business-home-d-car.png, business-home-m-car-end.png, business-home-m-location.png, business-home-m-more.png, business-home-d-cars.png, biz-open-m-strip.png

**Verdict: fix.** I can inspect Maya's work and request her. There is also a car with monthly advertising space, and I can browse people or cars around Austin.

## The ten questions

- Does this feel like a premium modern product? **partly**. The main desktop spread and 390px feed do. Missing work, the 320px overlap, blue placement styling and the oversized phone detail portrait still expose unfinished product craft.
- Does it explain itself without paragraphs? **yes**. Faces, work, Request and the monthly placement ask establish the marketplace quickly. Measured default copy is comfortably within budget, with no 18-word blocks.
- Does it feel like a consumer platform, not business software? **yes**. People and media lead instead of campaign administration. The phone person preview partially regresses into a vertical fact sheet.
- Is it memorable? **partly**. The portrait/work montage meeting the car at a straight earning edge is recognizable. The incomplete roster and generic preview hierarchy weaken that signature.
- Does motion improve understanding? **partly**. The strip preserves Maya's identity and shows a return to the source with a visible focus outline. It mostly shows settled layouts and a facts fade; it does not demonstrate the commissioned shared-bound transition or reduced-motion behavior.
- Does each earning type feel different? **partly**. People and monthly car placements have clearly different silhouettes and actions. Story and Recreate are explicit request choices, but their downstream distinction is not demonstrated in these captures.
- Is business discovery exciting? **yes**. Large faces and tangible work are far more inviting than production's small repeated shelves. Complete the supplied portfolio media before calling the discovery experience finished.
- Is Profile identity, not settings? **partly**. Profile itself is not supplied. The person inspection is identity-led and contains no settings, but that does not establish the separate Profile destination.
- Does the website make someone keep scrolling? **partly**. The public website is not supplied. This app feed has a strong next-object tease and finite continuation, but that is not evidence for the website.
- Is it significantly stronger than current production? **yes**. Hierarchy, media scale, text discipline and marketplace character are substantially stronger. This is a fix pass, not a recompose.

## Scores

- earning types distinct: 7
- motion understanding: 4
- keeps scrolling: 5
- slop risk: 3
- text discipline: 9
- identity not settings: 5
- stronger than production: 8
- discovery excitement: 8
- memorable: 7
- self explaining: 8
- truthfulness: 8
- premium: 7
- consumer not software: 8

## Spec drift

- 320×568: the leading media cap is not producing the specified reachable action row. Reduce the first deck to 212px at this height and keep both full controls above navigation.
- 768–1023px: the car is top-aligned instead of sharing the featured montage's lower earning-edge datum. Bottom-align the media, not the entire factual composition.
- Phone Create lacks its lime disc; desktop Create campaign fills only its icon. Restore the viewport-specific navigation treatments.
- The identity switcher adds Business, explicitly excluded from the phone header. Remove the visible subtitle.
- Car /month is below the amount rather than adjacent. Keep amount and basis together without removing the explicit currency.
- Desktop car inspection crops the original photograph. Use contained media.
- Object previews and sheets use icon-only dismissal instead of visible Close and nested Back labels.
- The supplied work set is not complete in the reviewed default captures. Approval requires a stable recapture containing all six images.
- The 1023px capture is 1023×768 rather than the commissioned 1023×900. Supply the required viewport as well.
- The phone car-end capture shows selected placement and Offer, not the claimed offer boundary. Supply the actual boundary showing the retained context and no-send notice.

## Spec was wrong

- The phone person-preview hierarchy was insufficiently constrained. A large portrait followed by four vertically stacked facts pushes Work and Request beyond the first screen. Better instruction: cap the portrait at 280px on 390×844, put identity and Request immediately beneath it, then Work, with supporting facts in a compact two-column section afterward.
- The mixed spread's empty shoulder should not survive a single-type filter. Better instruction: in Cars, start the existing landscape frame 24px below the tabs; reserve bottom alignment and the taller shared deck for mixed results only.
- The spec claimed paired work stills would depict the same sequence, but Maya's visible samples change sleeves and staging. Do not treat that continuity as established. Review the supplied assets as separate project stills, and do not approve any stronger sequence claim without supporting media.
- The currency instructions were unnecessarily inconsistent. Retain the explicit US$ treatment used here; it is truthful and portable. The essential correction is to keep the monthly basis beside the amount, not to shorten the currency.

## Fixes

- 1. Apply the short-height media cap of min(252px, 100svh minus 356px): 212px at this viewport. Contain all three images without distortion and keep the complete 44px action row above y=504. Remove the redundant Business subtitle from the identity switcher. (320×568 Home): Request and View person are covered by fixed navigation in the actual 320×568 viewport. This is not a full-page capture artifact.
- 2. Finish loading and decode-checking the six already commissioned assets before capture. Recapture the entire default phone and desktop scope plus phone after More. Preserve honest fallbacks only in the explicit failed-media QA variant. (Default work montages and capture preparation): Nora's second sample is missing in the full phone capture; Eli has two missing samples on desktop and one missing after More. The final Eli image has not been reviewed from these pixels.
- 3. Bottom-align the tablet car image with Maya's complete portrait/work group. Compute the shared deck from the taller montage rather than top-aligning the car. Keep its landscape ratio and its own factual band below that datum. (768–1023px mixed discovery layout): At both tablet widths the car floats at the top while Maya extends much farther down. The signature joint works on desktop but disappears on tablet.
- 4. Reorder phone person inspection to capped portrait, identity with the single Request action, Work, then supporting facts. Use two columns for Completed, Rating and Followers where available; render Verified creator as a factual label rather than a label followed by Yes. Preserve omitted states for Nora and Eli. (Phone person preview): Inspection should help evaluate work, not require scrolling past a portrait and a long statistics stack before reaching it.
- 5. Contain the complete original car photograph in the desktop preview media area. Preserve paper around its intrinsic ratio instead of using a near-square cover crop. (Desktop car preview): The current detail cuts off both ends of the car. Opening an object must reveal more of the actual vehicle, not less.
- 6. Keep US$240 and /month on one baseline with a 4px gap across discovery and previews. Maintain Asking rate and Rear doors nearby. Move the action to a separate row only if the narrow layout genuinely cannot fit; never detach the basis. (All car money bands): The basis is visible but consistently drops below the amount, weakening the monthly-price reading despite ample room at most sizes.
- 7. Restore a 32px lime Create disc inside the phone's 44px target. At desktop, make Create campaign the single lime-filled navigation action, not just a lime icon. Remove the Business subtitle across identity switchers while retaining business context in the accessible name. (Shared Business navigation and identity header): The phone loses the system's functional lime anchor, and desktop only partially implements its primary creation action. The subtitle spends scarce header space on repeated context.
- 8. Add visible Close text to first-level object previews and sheets; reserve visible Back for nested states. Give Story and Recreate equal neutral surfaces at rest, using a brick outline for keyboard focus rather than a persistent soft fill on Recreate. (Person/car preview headers, Request and Location sheets): Current close controls are icon-only. The shaded Recreate row reads as a preselected choice even though the task should begin unselected.
- 9. Label the supplied SVG Placement diagram, preserve its supported geometry and intrinsic ratio, and constrain it to 320×200px on phone and 440×260px on desktop. Replace blue selection with an ink outline and restrained system treatment; keep the check, Selected text and equivalent Rear doors toggle. (Car placement selector): The current blue-on-white diagram is oversized and visually imported from another product. Its status as a diagram must remain explicit.
- 10. In Cars-only results, remove the mixed-deck top spacer and place the existing 376px-wide car frame 24px below the tabs at 1440px. Keep the finite single record and surrounding paper. (Desktop Cars filter): The current unexplained gap looks like missing inventory. Fix the position without stretching the car or duplicating it.

## Keep

- The warm paper, green-black typography, square untreated media and restrained brick earning edge. Do not add card containers, shadows, gradients or image overlays.
- The 1440px featured montage and car sharing one lower media datum, with an open gutter between their independent edges.
- The centered 1280px composition at 1920px. Extra space should remain breathing room, not additional inventory.
- The separate View person and Request actions, and the car's single View action.
- Nora's discovery surface without a fabricated Instagram identity, and her explicit Story connection prerequisite inside Request.
- The visible Fictional preview context, placement-specific asking-rate qualification and absence of invented sent, booked or paid states.
- The short discovery copy and attention counts confined to Content and Campaigns. Do not restore administrative summaries above discovery.

## Why better than production

This is a substantial improvement, not a palette refresh. Production makes businesses decode small repeated images, administrative notices and dense creator metadata. V2 leads with a face, inspectable work and a distinctly priced car placement. The desktop spread is deliberately composed rather than another shelf. Measured default copy falls from 208 to 44 words on phone and 249 to 58 on desktop; phone first-screen copy falls from 69 to 25 words. Those gains are visible. Approval is still blocked by the covered action at 320px, incomplete media captures, tablet alignment and weaker object previews.

## Remaining risks

- The motion strip is insufficient to approve shared-image bounds, timing, reduced motion or closing continuity. Capture normal and reduced-motion opening, Request, placement selection and return with intermediate frames.
- Keyboard focus trapping, inert backgrounds, browser Back, scroll restoration, 200% text zoom and touch targets cannot be verified from still captures alone.
- People, both Nearby city results, identity switching, request continuation, the actual offer boundary and exceptional QA states are not demonstrated here.
- The generated samples must remain explicitly fictional. Their visible sequence inconsistencies must not be described as documentary evidence of the same shoot.
- Text counts pass comfortably, but the final stable-media capture should be measured again. Missing-media labels currently affect the totals.
- Profile and the public website were not captured. Their scores of 5 are neutral unassessed markers, not approval of those screens.
