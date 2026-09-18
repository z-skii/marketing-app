# V3 review: Public site: the business story with Loyalty, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: site-d-frame1.png, site-d-frame3.png, site-d-frame6.png, site-d-frame8.png, site-m-frame4.png, site-play-m-strip.png, site-scroll-d-strip.png

**Verdict: fix.** A coffee campaign leads to Sara’s card, repeat visits and a free coffee. Desktop keeps Jasmine attached; phone currently reads as a Wallet demo without that source connection.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette and restraint are credible. The approximately 210px-wide Wallet, undersized Story and disconnected controls make the composition feel unfinished.
- Does it explain itself without paragraphs? **partly**. Campaign, signup, progress and reward read through short labels. The missing source thread on phone prevents the complete relationship from explaining itself.
- Does it feel like a consumer platform, not business software? **yes**. Photography, a simple signup and a recognizable reward object lead. There are no dashboard tiles, CRM tables or enterprise toolbars.
- Is it memorable? **partly**. Following one person through dated visits is a useful signature. The source seam is absent and the product objects are too small to make that signature land.
- Does motion improve understanding? **partly**. The phone strip shows signup, zero progress, dated returns, five visits and the receipt. However, card positions, controls and the following section boundary shift between scenes. The samples do not establish every intermediate event or transition duration.
- Does each earning type feel different? **yes**. The desktop scroll strip retains distinct Recreate, Post and Drive media silhouettes. Their complete earning workflows are not shown here.
- Is business discovery exciting? **yes**. The retained marketplace spread uses a large real face, authored work and a separate car, with View person and Request still distinct.
- Is Profile identity, not settings? **partly**. No Profile capture is supplied. This surface provides no evidence for approving or rejecting that balance.
- Does the website make someone keep scrolling? **partly**. The acquisition-to-return narrative supplies a reason to continue. Long empty shoulders around miniature objects weaken momentum, particularly before the final receipt.
- Is it significantly stronger than current production? **partly**. The added retention story strengthens the proposition. A direct production comparison is not supplied, and the visible sizing and phone continuity defects prevent finished-product approval.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. It extends the existing dark business chapter and preserves the public shell and separate Monthly Content story. It does not introduce a new software aesthetic or navigation destination.
- Does it strengthen the business value proposition? **yes**. The visible sequence connects campaign attention to membership, counted returns and an earned reward. That is a meaningful third act.
- Can a business understand it quickly? **partly**. Five visits and Free coffee are clear. The small objects and missing mobile source thread make the broader business relationship slower to understand.
- Does it feel consumer quality rather than SaaS admin? **partly**. The composition avoids admin conventions, but the narrow Wallet and shifting playback layout fall short of finished consumer-product quality.
- Does attribution feel powerful without becoming fake analytics? **partly**. Desktop preserves From Jasmine without invented revenue or performance metrics. Phone loses that continuity, and the source explanation is not shown in the supplied captures.

## Scores

- motion understanding: 6
- slop risk: 3
- text discipline: 7
- natural part of tapmart: 8
- attribution honest power: 6
- memorable: 5
- quick to understand: 6
- self explaining: 6
- business value: 8
- wallet realism: 4
- truthfulness: 7
- consumer not software: 8
- premium: 5

## Spec drift

- The persistent fictional-replay context and From Jasmine thread are visible on desktop but absent from the supplied phone scenes. Restore both within the phone stage rather than relying on content above its scroll position.
- The Wallet renders approximately 210px wide on both captured layouts instead of 375px desktop and 358px at 390. Apply responsive card widths and preserve native-sized typography.
- The Story is approximately 200×356px on desktop instead of 300×533px. Restore the specified media dimensions and below-image action band.
- The desktop source begins at x≈32 rather than inside the centered 1280px narrative bounds. Recompose to the intended maximum and restore the missing acquisition seam.
- The source scene adds a second Jasmine identity and campaign description beside the image. Keep the stationary From Jasmine control and move that expanded identity into its disclosure.
- Wallet scenes retain editorial act headlines that the surface spec explicitly removed. Remove them, restore the zero-progress date and keep concise counted-event labels.
- The phone stage does not maintain a stable envelope: controls and the Monthly Content boundary move between samples, and initial controls wrap differently. Reserve consistent geometry throughout normal playback.
- The final receipt reverses the specified type hierarchy, enlarging Sara and minimizing progress. Restore progress and reward emphasis while retaining the approved inverse treatment.

## Spec was wrong

- The 360px desktop headline limit produces the awkward three-line “Turn them / into / customers.” Allow a 480px editorial rail at 1440px while retaining 64px display type and clear separation from the object.
- The paper-backed final receipt is not necessary. The built inverse receipt belongs naturally in the dark chapter. Keep that treatment, but restore the intended emphasis on progress and Reward ready rather than making Sara the largest information.
- The added date label “Came back” improves understanding of the second distinct visit. Keep it. Remove the redundant headline from Wallet scenes instead; the September 10 scene can then remain within the 29-word ceiling.
- A 44px-wide play control cannot accommodate its initial visible caption without disturbing this compact control row. Reserve a wider play-control slot throughout playback and let the scrubber flex on phone. Do not change control positions when the caption disappears.

## Fixes

- 1. Restore “Design Lab · Fictional replay” and the operable “From Jasmine” control inside the stable phone stage header for every scene. Add the specified short 2px acquisition rule with its 12px brick terminal. Keep both labels outside the card and visible at the scene’s reading position. (Phone scenes 1 to 8; persistent source datum on desktop.): Neither label is visible in any supplied phone frame. This loses both the central attribution idea and the action-local explanation that the sequence is fictional.
- 2. Remove the approximately 210px pass-width constraint. Render the Apple concept at 375px on desktop/tablet, 358px at 390 and 296px at 320. Preserve 32px progress, at least 16px values and 13px labels without scaling the DOM. Use system typography, a broad store-card field arrangement and the 375:123 artwork strip. Retain the 12px pass boundary and supported field subset. (Desktop frame 6, phone frame 4 and all Wallet replay states.): The current narrow pass reads as a tall web coupon. On phone it leaves almost half the available content width unused; its labels are visibly too small.
- 3. Verify the rendered QR by decoding the actual browser capture. It must encode exactly “tapmart-demo-member:loopday:q7n4k9r2m6t8” at error correction M. Replace any placeholder symbol with a generated code, retain four modules of quiet zone and keep the same payload through every historical state. Use the specified 184px white square at 390 and 160px at 320. (Public Apple concept and QR acceptance evidence.): The visible coarse symbol and white margin do not establish that the required member payload is encoded. A believable-looking QR is not sufficient acceptance evidence.
- 4. Restore the Story to 300×533px on desktop, 246×437px at 390 and 234×416px at 320. Put “Join Loopday” in its solid adjacent action band below the image. Move the repeated Jasmine/campaign metadata into the source disclosure. Center the desktop narrative within 1280px, an 80px outside margin at 1440, and use the wider editorial rail without shrinking the object. (Source scenes, especially desktop frame 1 and the first two phone-strip samples.): The desktop Story is about 200×356px, and the phone strip also shows an undersized side-by-side composition. Empty space is dominating because the media is below its intended scale, not because the narrative needs more content.
- 5. Stabilize the normal-motion envelope against its tallest scene. Reserve consistent space for context, dates and platform labels; keep card and QR bounds stationary through scenes 4 to 7. Place controls on one fixed baseline below the active-object deck, not remotely under the desktop editorial rail. Keep the initial Play sequence caption from wrapping the scrubber onto a second row. At text zoom, switch to growing ordinary flow rather than clipping. (Playback layout on phone and desktop.): The phone strip shows controls moving vertically, the initial track wrapping and the following paper section moving as scenes change. This turns a source-preserving replay into a visibly shifting slideshow.
- 6. Remove act headlines from Wallet scenes 4 to 7. Show the signup date with the zero-progress card; retain the useful date/event labels on counted visits. Reserve “Bring them back.” for the final receipt. Recount each complete stage after restoring the missing phone context. (Wallet-scene copy and scene-specific hierarchy.): Desktop frame 6 contains 31 stage words, excluding navigation and punctuation, against the 29-word ceiling. Its extra headline contributes three. The zero-progress phone frame instead carries the previous act headline and no visible date.
- 7. Keep the open inverse receipt, but set Sara to 20/26, “5 of 5 visits” to 24/28, “Reward ready” to 28/32 on its own line and “Free coffee” to 18/24 beneath it. Keep five equal 4px strokes and the quiet simulated-update line. Position this compact result deliberately within the shared object deck instead of leaving it compressed at the top. (Desktop frame 8 and the final phone scene.): The current receipt makes Sara approximately 36px while progress is about 13px and the reward shares a smaller line. The earned outcome should be the climax, not the member’s name.

## Keep

- The warm paper public header, green-black business chapter, restrained brick wordmark terminal and existing typography direction. No palette refresh is needed.
- The photography-first hero and the retained marketplace pairing of Maya’s face and work with the separate car composition.
- The intact coffee Story creative. Its visible “Take a coffee break.” lettering is short enough; do not crop it or add an Instagram interface.
- The historical signup excerpt: fictional Sara, one contact, five-visit requirement and the explicit daily counting rule. No animated consent or account pitch.
- The zero-progress card before counted visits, followed by discrete dated progress states. The strip communicates progression without a money counter or automatic redemption.
- The adjacent Apple concept and issuance labels, and the final “Wallet update · simulated” receipt. Keep those distinctions.
- One active scene, one card and one final working-preview action. Do not fill the empty space with analytics, more devices or feature cards.
- Monthly Content’s separate return to paper and the visible campaign-spending boundary.

## Why better than production

This adds a missing business story: advertising can lead to a named loyalty member, recorded return visits and an earned reward. The shop can understand what happens after someone sees a campaign, rather than stopping at attention or content delivery. Keeping the original source attached makes that relationship useful without claiming sales or revenue. These captures demonstrate the proposition, not a production-ready Wallet integration.

## Remaining risks

- These captures do not establish that replay is isolated from the business provider. Verify that playback, scrubbing and opening previews leave the working baseline at ten members and Sara at four visits.
- The strips establish a useful sequence, not exact timing or every intermediate state. Confirm the separate first counted visit, September 10 return, explicit fifth-visit action, pause behavior and final non-looping rest.
- QR decoding and payload identity remain unverified. Do not treat visual similarity across frames as proof of a working member code.
- No 320px, tablet, 1920px, 200% text-zoom or reduced-motion capture is supplied here. Keyboard scrubbing, screen-reader descriptions and touch targets also require direct testing.
- Source disclosure, Get started handoff, failed-media behavior, browser Back and preview destinations are not evidenced by these images.
- Asset identity and crop provenance require the media manifest; pixels alone cannot authenticate the matched Loopday records.
- The scroll strip visibly shows Monthly Content prices of US$99 and US$199 per month. Confirm these are authorized carried-forward fixture prices. If unsupported by a record, show Price unavailable rather than preserving invented amounts.
- Native Wallet issuance, saving and notification behavior are outside this replay. The current concept and simulation labels must remain, and no production-readiness claim follows from this review.
