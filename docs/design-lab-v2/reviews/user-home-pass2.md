# V2 review: User Home, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: user-home-m.png, user-home-m-full.png, user-home-s.png, user-home-t.png, user-home-u.png, user-home-d.png, user-home-l.png, user-home-m-preview.png, user-home-m-preview-end.png, user-home-d-preview.png, user-home-m-filter.png, home-open-m-strip.png

**Verdict: fix.** At 390px: recreate this coffee reference for US$75 per approved version, then View. On desktop: three different opportunities—US$75 to recreate, US$25 after a 24-hour Story and approval, and US$300/month for a vehicle campaign. At 320px, the task itself is not yet visible, so the first read stops at coffee plus money.

## The ten questions

- Does this feel like a premium modern product? **partly**. The 390px and desktop resting screens do. Typography, untreated media and deliberate whitespace are convincing. Compact-phone cropping, reference-preview cropping and navigation inconsistencies still prevent finished-product approval.
- Does it explain itself without paragraphs? **partly**. At 390px and desktop, the activity, money and next action are clear. At 320px, the first screen shows coffee and US$75 but hides Recreate this Reel below navigation. Measured default text comfortably meets the targets.
- Does it feel like a consumer platform, not business software? **yes**. Photography and opportunities lead. There are no balance tiles, management summaries, permanent inspector or stacked administrative notices.
- Is it memorable? **yes**. The unequal reference, narrow Story and landscape vehicle meeting one straight earning edge create a recognisable composition. The phone Story rail carries that identity into scrolling.
- Does motion improve understanding? **partly**. The strip preserves the identity of the reference and visibly returns focus to its source. However, one opening frame leaves the detail region blank, and the opened reference loses its complete composition. The strip does not establish exact timing or reduced-motion behaviour.
- Does each earning type feel different? **yes**. Making a reference version, posting finished artwork and driving with a campaign have different media shapes, verbs and payment conditions. Car remains explicitly monthly and approval-dependent.
- Is business discovery exciting? **partly**. Creator-side opportunity discovery is appealing here, but business-side people, work samples and Request interactions are not shown. That screen is not assessed.
- Is Profile identity, not settings? **partly**. Profile is only a navigation destination in these captures. Its identity presentation cannot be judged.
- Does the website make someone keep scrolling? **partly**. The Home feed has a useful continuation cue in the next Story title, but no public website is shown. Website scrolling is not assessed.
- Is it significantly stronger than current production? **yes**. The before captures are dominated by small media, repeated explanation and competing controls. This version makes the opportunity and its value substantially easier to see, with a much stronger desktop composition.

## Scores

- earning types distinct: 9
- motion understanding: 6
- keeps scrolling: 0
- slop risk: 1
- text discipline: 9
- identity not settings: 0
- stronger than production: 9
- discovery excitement: 0
- memorable: 8
- self explaining: 8
- truthfulness: 9
- premium: 8
- consumer not software: 9

## Spec drift

- The 320px reference fills a 296×320px rectangle instead of presenting the complete 4:5 source inside the capped stage. Use containment within the revised compact geometry specified in fix 1.
- The Recreate preview shown in the motion strip uses a nearly square, full-width presentation rather than the complete contained reference. Match the intact-media behaviour already visible in the Story preview.
- The opening strip includes a frame with media but no destination detail content. Show destination information immediately while animating only the shared media.
- Tablet Personal begins at the rail boundary around x80 instead of respecting the 24px main-content inset. Move its content edge to x104.
- The desktop Activity count pushes its label to the right of the other destination labels. Reserve badge space without changing the common label alignment.

## Spec was wrong

- My compact-phone specification protected the amount and View but left the activity below navigation. At 320px, reserve space for Recreate this Reel above the image, without duplicating it below.
- Putting the phone Story title below the entire composition delayed understanding. Keep the pass-two title above the rails; do not revert to the original specification.
- The original Car discovery band understated the approval condition. Keep Approval required under the monthly money and Vehicle required as its own factual line.
- My tablet instructions did not explicitly suppress the desktop utility cluster. Search, Messages and Notifications should appear once, in the tablet header—not again at the bottom of its rail.

## Fixes

- 1. At 320–359px, move Recreate this Reel above the reference: 24px title height followed by 8px spacing. Reduce the image-height allowance by those 32px and contain the complete reference rather than filling the frame. At 320×568 without a safe-area inset, the image stage should begin at y132 and be 288px tall; a 4:5 image is approximately 230×288px, centered horizontally. Keep the earning edge and money/View positions approximately where they are now. Subtract any bottom safe-area inset from the image allowance. (320–359px resting Home, especially user-home-s.png.): The current compact screen protects the price but not the meaning of the opportunity, and its full-width image presentation is not the specified contained 4:5 composition.
- 2. Apply intact containment to the Recreate detail media, not only Story. Within the existing 46svh phone media region, center the complete reference with paper gutters. At 390×844, a 4:5 reference should be approximately 311×388px, rather than filling a nearly square 390px-wide crop. Preserve that containment throughout opening and closing. (Recreate phone object preview and home-open-m-strip.png.): Inspection should reveal the complete reference, not remove more of it. The motion strip visibly changes the source composition when Recreate opens.
- 3. Remove the media-only opening beat. Make the destination money, task and requirements visible as soon as the preview opens. Hide only the duplicate source copy while the shared media moves; do not stage the destination information after it. (Shared-object opening transition, particularly the second frame of home-open-m-strip.png.): The blank detail region visible in the strip briefly removes the information the person opened the opportunity to read. Motion should preserve understanding rather than interrupt it.
- 4. Finish navigation alignment. At 768–1023px, remove the lower rail copies of Search, Messages and Notifications and retain their header controls. Inset Personal 24px from the rail boundary, aligning it at x104 with the content. On desktop, keep Activity’s label aligned with Home, Earnings and Profile; place its count in an overlay or reserved trailing position rather than allowing it to push the label right. (Tablet captures user-home-t.png and user-home-u.png; desktop sidebar in user-home-d.png and user-home-l.png.): Duplicated utilities and a shifting label column make an otherwise disciplined screen feel assembled rather than finished.

## Keep

- The 1440px composition: media begins at x232, all three images meet the y600 earning edge, and the empty space above Car remains empty. Preserve the centered 1280px composition at 1920px.
- The warm paper, green-black typography, square media, restrained brick terminals and small-radius ink buttons. Do not add cards, shadows, gradients or more accent colour.
- The restored 390px geometry: 16px margins, reference beginning at y100, large 4:5 presentation, and fully visible money and View.
- The phone Story title above its information rail and intact creative. Its silhouette is genuinely different from Recreate and Car.
- US$ currency notation, attached approval bases, explicit monthly pricing, Vehicle example and the visible fictional-preview label.
- One View action per opportunity, one Filter entrance, four familiar Personal destinations and the compact Activity count. Do not bring back the introductory headline or routine revision paragraph.
- The contained Story preview, readable requirements, explicit earnings-versus-payout distinction and disabled Apply after the requirements in normal flow.
- Filter’s check and underline, solid sheet surface and straightforward Show opportunities action.

## Why better than production

Before, people had to read notices, filters and repeated instructions around small pictures. Now the work leads, its payment conditions are attached, and each opportunity has one clear View action. Desktop is genuinely composed for its width: the reference, Story and car meet one clean line instead of looking like a miniature phone feed. The phone’s first screen has 33 measured words instead of 90. This feels like a place to discover paid work, not administer it. The direction is approved; the remaining changes are finishing work, not another redesign.

## Remaining risks

- The measured counts pass: 56 words on phone, 60 on desktop and 33 in the 390px first screen, with no reported horizontal overflow. However, the before capture contains five media items and this baseline contains three; the total reduction is not a same-inventory measure of copy editing alone.
- The supplied captures do not establish 320px safe-area behaviour, 200% text zoom, reduced motion, keyboard operation, Search behaviour or the disconnected, missing-data, urgent and empty variants. Resting scrollWidth measurements do not prove those states.
- Story’s visible requirements and disabled action are honest, but expanded Money details, Terms, Car obligations and missing-term blockers are not shown here. They still need verification before implementation approval.
- Business Home, Profile and the public website are outside this capture set. The zero scores for discovery_excitement, identity_not_settings and keeps_scrolling mean not assessed, not failed.
- All displayed money and eligibility remain fictional fixture values. Preserve the lab boundary and do not treat this visual review as approval of production financial or commitment workflows.
