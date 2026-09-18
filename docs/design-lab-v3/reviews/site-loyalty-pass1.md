# V3 review: Public site: the business story with Loyalty, pass 1

Reviewer: Astra, TapMart's design director.

Captures: site-d-frame1.png, site-d-frame3.png, site-d-frame6.png, site-d-frame8.png, site-m-frame4.png, site-play-m-strip.png, site-scroll-d-strip.png

**Verdict: recompose.** A coffee campaign leads to a loyalty signup, then visits build toward free coffee. Jasmine is involved, but her source connection does not yet feel like the permanent thread.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette, photography and large type are strong. The left-stacked desktop composition, almost invisible pass boundary, undersized QR and excessively wide final button make the new section feel unfinished.
- Does it explain itself without paragraphs? **partly**. The three acts are understandable, but tabs, repeated headings, moving source copy and a fuller-than-needed signup add reading. The daily counting rule is absent from the captured signup.
- Does it feel like a consumer platform, not business software? **yes**. Real coffee imagery, a simple reward and a member card lead. There are no dashboard tiles, spreadsheets or invented performance charts.
- Is it memorable? **partly**. The coffee imagery has character. The intended signature, one stationary acquisition thread through changing objects, is missing, so the sequence currently resembles a conventional feature carousel.
- Does motion improve understanding? **partly**. Both strips show an intelligible progression from Story to signup to visits and reward. They also show source relocation and weak date placement. The phone strip catches 5 of 5 with Collecting before Reward ready, making the event boundary ambiguous.
- Does each earning type feel different? **yes**. The desktop scroll strip preserves distinct Recreate, Post and Drive media silhouettes: filming context, a photographed phone and a car. Detailed earning requirements are not inspectable here.
- Is business discovery exciting? **yes**. The retained marketplace frame gives Maya's portrait and authored work substantial space alongside the car. Loyalty has not replaced discovery with an overview dashboard.
- Is Profile identity, not settings? **partly**. No Profile surface is supplied. This question remains unverified rather than approved by inference.
- Does the website make someone keep scrolling? **partly**. The photography and paper-to-ink transition encourage exploration. Loyalty's large unused right side and repetitive Wallet frames reduce momentum before Monthly Content.
- Is it significantly stronger than current production? **partly**. The visible return journey extends the business proposition meaningfully. These captures do not establish an end-to-end production comparison, and the new section still needs structural correction.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **partly**. It uses the existing business chapter and visual language, with no new primary navigation. The separate title/tab/toolbar stack makes it feel appended rather than integrated.
- Does it strengthen the business value proposition? **yes**. The visible journey extends advertising into membership, recorded returns and an earned reward without inventing sales or revenue.
- Can a business understand it quickly? **partly**. Free coffee after five visits is clear. The first-versus-repeat distinction and the business-side outcome need stronger date placement and the missing final receipt.
- Does it feel consumer quality rather than SaaS admin? **partly**. The content is appropriately simple and visual. The public Wallet object and desktop stage still lack the finish expected of a consumer product.
- Does attribution feel powerful without becoming fake analytics? **partly**. Jasmine remains named and there are no invented metrics. But the changing source placement weakens continuity, and the first-known-source explanation is not captured.

## Scores

- motion understanding: 5
- slop risk: 3
- text discipline: 4
- natural part of tapmart: 7
- attribution honest power: 5
- memorable: 5
- quick to understand: 6
- self explaining: 6
- business value: 7
- wallet realism: 4
- truthfulness: 7
- consumer not software: 8
- premium: 5

## Spec drift

- The desktop stage is left-stacked rather than using the asymmetric source/object composition. Move the active object into columns 6 to 9 of the centered 1280px narrative grid.
- The build retains Loyalty, Story / Signup / Reward and a top-right playback toolbar. Replace these with the compact persistent context and bottom eight-segment replay controls.
- Design Lab · Simulated sequence is used instead of Design Lab · Fictional replay. Use the surface-specific wording once per scene.
- From Jasmine is not stationary: it appears as source metadata beside the Story, From Jasmine’s Story inside signup, then Joined from Jasmine · Story campaign above the pass. Replace all three with the persistent external source control.
- The phone Story is shown in a narrow side-by-side media/source composition. Center the intact 246×437px Story at 390, with Join Loopday in the adjacent paper action band; use 234×416px at 320.
- The signup has rounded outer corners, omits the loop mark, business name and daily rule, and includes consent copy excluded from the public excerpt. Restore the specified read-only selection without altering working signup.
- The Wallet uses the full working member field set, an oversized photo share and a roughly 125px QR square. Apply the public field subset, 62:38 strip split and specified responsive QR dimensions.
- Wallet scenes retain large act headlines and abbreviated dates such as Sep 10. Remove those headlines and show the full compact ISO dates outside the pass.
- The phone strip captures 5 of 5 with Collecting and a separate +1 visit badge. Show the pre-event state as 4 of 5 / Collecting and the committed state as 5 of 5 / Reward ready, with the business action replaced by Visit counted.
- The final scene does not cut to the business receipt and omits Get started. Replace the repeated pass with the specified receipt and its two bounded actions.

## Spec was wrong

- The pass and public chapter share #18231D, so the card boundary nearly disappears. Keep both colours, but permit a restrained 1px inverse-muted boundary around this Wallet specimen only, with the specified 12px corners. Do not add a shadow or another container.
- The 650ms zero-visit hold and roughly half-second return cuts are too short for a first-time viewer to read the card, date and truth labels. For deliberate playback, give zero visits and the first return at least 1500ms each, and subsequent dated visits at least 1000ms each. Report the revised runtime; do not force the story back into 7300ms.
- The initial word budget left 17 words for asset lettering before inspection. This capture shows only 'Take a coffee break.' in the Story. That provides useful headroom, not permission to restore tabs, repeated headings or campaign metadata.
- Date placement was not constrained tightly enough on phone. Make the date immediately precede the card and keep the counting receipt directly adjacent to it. The date must not sit below the entire pass, detached from the value it explains.

## Fixes

- 1. Recompose the desktop stage into the specified 1280px spread: source and act in columns 1 to 4, active object in columns 6 to 9, intentional empty shoulder in columns 10 to 12. Keep the sticky content below the public header with the 88px offset. On phone, remove the extra introductory stack and keep one ordinary-flow stage. (All Loyalty scenes, especially site-d-frame1, site-d-frame3 and site-m-frame4.): Nearly all meaningful content currently occupies the left third of desktop. The remaining width is vacant rather than composed, while phone spends substantial height before reaching the card.
- 2. Install one stationary From Jasmine control beside Design Lab · Fictional replay, with the short acquisition seam. Keep its position unchanged through Story, signup, card and receipt. Move Morning loop · Story campaign and the replay-store explanation into its disclosure. (Persistent context band and source treatment across every scene.): Attribution is the distinctive product idea. It currently changes wording and location, including moving inside the signup excerpt, so the viewer must reconstruct the connection.
- 3. Remove the extra Loyalty title and Story / Signup / Reward tabs. Put previous, play/pause and next below the object on a stable baseline with the eight-segment scrubber. Show Play sequence only at initial rest; use accessible icon names thereafter, including Replay sequence. (Top control rows in all captures.): The build has retained the earlier chapter navigation instead of the specified film-style replay. Removing it restores hierarchy, reduces words and gives precise access to the dated states.
- 4. Use the public Apple field subset, not the full working member card: business header, VISITS and value, Free coffee, STATUS and value, then QR. Remove the redundant REWARD label, MEMBER / Sara and LD-001 from this public specimen only. Use a 375px desktop pass and 358px pass at 390, 32px progress, at least 16px field values and 13px labels. Restore the 62% solid reading area and 38% photo strip. (Wallet scenes 4 to 7; site-d-frame6 and site-m-frame4.): The current pass looks like small web fields placed directly on the chapter. Extra fields consume space while essential values and the card silhouette lack presence.
- 5. Increase the member QR white square to 184px at 390 and 160px at 320, with a four-module quiet zone and crisp modules. Generate and decode-test the specified opaque member payload; preserve it across all snapshots. (Lower area of every public Wallet specimen.): The phone image is captured at 2× scale: its approximately 250px raster QR square is only about 125 CSS pixels. The desktop square is similarly small. Both fall below the specified minimum.
- 6. Rebuild the signup as the specified square-edged, read-only editorial excerpt: loop mark, Loopday Coffee, Free coffee, 5 visits, One counted visit per day., First name / Sara, Phone / +12025550142 and the depicted Create my card action. Remove the agreement depiction and expanded promotional sentence from this replay only; preserve full consent in working signup. (Scene 3, site-d-frame3 and the third phone-strip frame.): The captured excerpt omits the business identity and material daily rule while adding consent copy that makes it resemble an operative form. It also materially exceeds the 29-word scene ceiling.
- 7. Remove act headlines from Wallet scenes 4 to 7. Show the specified ISO date immediately above the pass. In scene 7, replace +1 visit with Visit counted, and change the complete progress value and status together at the depicted commit. Use an ink/paper business strip, not a lime counting badge. (Dated return scenes and the seventh frame of site-play-m-strip.): Dates explain why these are returns rather than repeated taps. In the phone strip they sit below the card, and the captured 5 of 5 / Collecting state suggests progress and reward readiness are separate events.
- 8. Make scene 8 the business-side receipt, not another Wallet frame: Bring them back., Sara, five completed strokes, 5 of 5 visits, Reward ready, Free coffee and Wallet update · simulated. Follow it with Open loyalty preview and the quiet Get started handoff. Limit the desktop receipt to 440px and align its actions to that composition. (site-d-frame8 and final frames of both strips.): The last scene currently repeats the card and stretches the CTA across most of the right side. The specified viewpoint change is what makes the business value land.
- 9. Lengthen deliberate playback holds as revised above, retain immediate pause and manual inspection, and keep the QR and source fixed while complete dated values crossfade. Recapture zero visits, first visit, second-day return, fifth-visit commit and final receipt at readable scale. (Timed playback and the next motion review.): The strips establish scene progression, not enough reading time or a clear atomic reward transition. Motion should explain the event sequence rather than simply advance content.
- 10. Measure actual scene copy after recomposition, including truth labels, controls and Story lettering. Submit all six required viewport captures, reduced-motion stills and text-zoom captures, plus the source disclosure and Get started handoff. Verify replay isolation separately with before-and-after business captures. (Acceptance report and pass-2 capture set.): The current card and signup scenes visibly exceed the agreed ceiling. Missing responsive, overlay and state-isolation evidence prevents approval even after the visual fixes.

## Keep

- The warm paper public header, green-black business chapter, restrained brick signature and tonal return to Monthly Content.
- The intact coffee Story and real pouring photograph. Do not substitute unrelated campaign media, add a Jasmine portrait or frame the Story as a phone.
- The retained photography-led marketplace spread: Maya's face and work, plus the independent car presentation.
- The distinction between zero visits after signup, collecting progress and Reward ready.
- The adjacent Apple Wallet concept and No pass is issued labels.
- The explicit Wallet update · simulated wording; no delivery, saved-pass or revenue claim is visible.
- Deliberate Play, an available Pause during playback and a final resting state rather than an automatic loop.
- A source outside the Wallet fields, real coded text and a stable-looking member QR across the captured visit states.

## Why better than production

The visible story adds a useful business promise: a campaign can lead to a named loyalty member, whose recorded visits earn a reward. Production's attention-and-advertising proposition gains a return journey. The prototype demonstrates that journey, but does not yet make the source continuity or final business benefit clear enough to approve.

## Remaining risks

- Screenshots cannot verify QR payload, decodability, idempotency or separation of replay and working business state.
- No 320, tablet, 1920, reduced-motion or 200% text-zoom captures are supplied.
- Keyboard operation, scrubber semantics, focus restoration, browser Back and playback pausing are unverified.
- Source disclosure, Get started handoff, failed-media states and destination boundaries are not shown.
- The strips cannot establish precise timing, easing or whether every intermediate dated state remains manually inspectable.
- The scroll strip shows Monthly Content prices of US$99 and US$199. Preserve the existing section, but verify their authoritative provenance; the V3 direction otherwise specifies Price unavailable.
- The homepage phone first-screen word count and complete expanded-page copy cannot be established from this capture set.
