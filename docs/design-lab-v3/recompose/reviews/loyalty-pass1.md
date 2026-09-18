# V3 recomposition review: Business to Loyalty sequence, pass 1

Reviewer: Astra. Verdict: **fix**. Captures: loop-d-0.png, loop-d-0.3.png, loop-d-0.7.png, loop-d-1.png, loop-m-0.png, loop-m-2.png, loop-m-7.png, loop-m-8.png, loop-d-strip.png, loop-m-strip.png.

**Two second read.** A Loopday loyalty program came from Jasmine; Sara’s card progresses toward free coffee. At the ending, Jasmine receives attribution. The business meaning is visible, but the transition is not yet the memorable moment.

## The six questions

- Would someone remember this website tomorrow? **PARTLY**. The source-to-return relationship is more memorable than a generic loyalty dashboard. The visual signature is still a green pass followed by sparse metrics; next-day recall has not been tested.
- Could this homepage belong to any other startup? **PARTLY**. This isolated scene could still belong to another loyalty platform. Jasmine’s retained campaign source is the differentiator, but the complete TapMart homepage is not shown.
- Do Recreate, Story and Drive each have a recognizable physical identity? **PARTLY**. Story is recognizable as an intact vertical creative, and the member pass is distinct from it. Recreate and Drive are outside this capture set.
- Does the car moment make TapMart feel unique? **NO**. Not demonstrated in these Loyalty captures; this is not a judgment of the Drive build.
- Does the Loyalty loop make a business understand why TapMart is more than creator marketing? **PARTLY**. Yes at the semantic level: retained source, member identity, dated returns, reward readiness and unique-member aggregates are present. Mobile collisions and the unproven foreground handoff prevent the full visual explanation from landing.
- Would someone scroll because they want to see what happens next? **PARTLY**. The card creates a clear expectation of progress. The sampled sequence still resembles a controlled specimen presentation, and the finale feels more like a replacement chart than a consequential object movement.

## Scores

- media quality: 8
- could not be another startup: 5
- slop risk: 2
- car moment unique: 0
- motion continuity: 4
- loyalty more than marketing: 7
- material quality: 5
- text discipline: 8
- scroll pull: 5
- typography: 6
- spatial quality: 5
- truthfulness: 8
- physical identity: 6
- remembered tomorrow: 5

## Still a web prototype

Desktop still reads as an editorial specimen stage: chapter heading upper-left, state label upper-right, source in one column, centered artifact, dated annotation in another, and a bottom toolbar. The final ledges resemble a separate presentation slide. Mobile is more sequential but remains a stack of labels, specimen and controls, with an unnecessarily empty finale. Where it escapes that reading: the intact Story sitting over its link sheet, the convincing opaque pass, and Jasmine’s enlarged final identity. Those are useful physical anchors, not generic dashboard cards.

## Spatial read

The intended source, member, event relationship is legible on desktop, but most of its depth currently comes from a shadow beneath one isolated artifact. At attribution, the displaced card provides continuity in principle, yet its washed-out treatment undermines physicality. Mobile uses the correct full-width source band rather than a narrow sidebar, but the undersized pass and rigid event positioning weaken the composition. Fix these specific relationships; do not restart the product architecture or add decorative depth.

## Material read

The pass at rest succeeds: opaque dark artwork, readable reward fields and a clean QR quiet zone. The Story and trusted-link sheet also have a plausible overlap. Navigation has a restrained soft edge, but these captures do not show content passing beneath it, so its optical behavior is unproven. The major material failure is the translucent-looking pass at desktop attribution. Restore opacity and use occlusion, not more glass or stronger shadows.

## Motion read

The strips prove that different dated card values and attribution endpoints were captured, including a return to earlier states. They show stable-looking pass artwork and QR while values change, and different source/card positions at the conclusion. They do not prove continuous travel, shared DOM identity, the specified 440ms/220ms timing, a downward occluded mobile exit, smooth reversal or paused behavior. No transition should be approved as smooth from these strips alone.

## Media read

The existing Story and coffee artwork are worthy of this sequence; no replacement photography is needed. The intact creative establishes the campaign, and the coded pass has a credible product identity. The weakness is the staging between them, not the assets. Scores use a 1 to 10 scale, with higher slop_risk meaning worse; 0 means outside this capture set, not a failure.

## Drift

- The mobile pass is approximately 270px wide instead of the specified 334px, causing business-name truncation.
- The mobile reward event uses overlapping text positions instead of a natural-height dated band.
- The desktop attribution pass is faded into grey rather than remaining an opaque object behind another plane.
- The desktop card moves roughly 560px horizontally between the supplied endpoints rather than the directed 360px.
- The desktop attribution ledges are spaced approximately 100px apart rather than 78px.
- The source underline and attribution ledges still read as separate graphic treatments.
- Cross-boundary continuity, the Story-to-signup overlap and the same-element source handoff remain unverified by the supplied evidence.

## Direction was wrong

- The prescribed sparse desktop relationship leaves the source marker too easy to treat as peripheral metadata. Keep its identity and general datum, but make the return registration and final shared origin do more visible relational work.
- The direction did not specify enough vertical clearance for the longest mobile event qualification. The event band must be content-sized; preserving an art-directed coordinate is less important than keeping the historical distinction readable.

## Fixes

- 1. **loop-m-7.png; mobile member-history and reward states.** Make the mobile event band natural-height: member identity, dated event, continuation qualification and reward badge must occupy separate, non-overlapping lines. Place the concept label after that band with at least 12px clearance. Reserve enough room for the longest event rather than positioning each replacement into a fixed-height text slot. Why: Sara’s identity and September 17 collide, and the Reward ready badge intrudes into the Wallet concept label. This damages the most important truth distinction in the sequence: an existing member reaching an example continuation, not a new customer or redemption.
- 2. **loop-m-2.png and loop-m-7.png; mobile Wallet specimen and sequence slot.** Restore the mobile pass to 334px wide, centered within the 358px composition. Keep its approved internal hierarchy and allow its full natural height to extend below the viewport. Keep the complete Loopday Coffee name readable. Put all controls and preview entrances after the object in document flow; do not shrink the pass to preserve a one-screen tableau. Why: The supplied 2× mobile capture shows a pass approximately 270 CSS pixels wide, with Loopday Coffee truncated. The direction explicitly prioritized a readable specimen over fitting the sequence into the viewport.
- 3. **loop-d-1.png; reward-to-attribution handoff and final rest.** Keep the desktop pass fully opaque during attribution. Translate it approximately 360px right and 24px down from its resting position, then let an opaque foreground reading plane occlude the portion behind the attribution composition. Retain a recognizable edge silhouette without washing out the artwork, text or QR. Why: The current final pass becomes a large grey ghost. That reads as disabled UI or an editorial fade, not a physical object yielding the foreground. It also violates the opaque-pass material rule.
- 4. **loop-m-8.png and loop-d-1.png; attribution heading, ledge origin and spacing.** Tighten the attribution composition around Jasmine’s source datum. On mobile, give the enlarged name, underline and campaign descriptor distinct line boxes, then reduce the large gap before the ledges. Retain the correct 216/162/54px ledge lengths. On desktop, bring the ledges to the specified 78px vertical rhythm. During the handoff, visibly derive their common origin from the source underline rather than presenting an unrelated underline above a separate chart. Why: The current conclusion is readable but still resembles a new analytics slide. The mobile underline presses against the campaign descriptor, while excessive separation weakens the recognition that these results belong to the source already seen.
- 5. **Reward-to-attribution transition at both widths; especially the mobile final sequence slot.** Preserve the relationship in the actual transition: show the reward-ready card and advancing Jasmine marker together before the card exits. On phone, move the card down 104px behind an opaque lower plane; do not substitute a whole-stage fade. Let the final mobile controls follow the resolved content rather than remain separated by the large empty lower field. Keep source, member and event datums stable through the dated states. Why: The sampled endpoints support the intended story, but the mobile finale currently reads as card removed, chart inserted. The powerful moment must be the source taking the card’s foreground, not merely a larger name appearing in the next state.
- 6. **Next review evidence package for /design-lab-v3#loyalty.** Return actual browser recordings of the Business boundary through the Loyalty conclusion at both widths. Include the signup replay, each dated return, uninterrupted forward and reverse travel, direct steps, Pause motion and reduced motion. Include a short lower-page mobile scroll proving access to Wallet options and Open loyalty preview, plus measured frame-time and layout-shift evidence. Why: The supplied strips cannot establish shared-element persistence, occlusion, timing, smoothness or control behavior. The Business-to-Story entry and historical signup replay are not demonstrated here. Implementation approval must wait for those recordings after the visible fixes.

## Keep

- Jasmine is established before Sara and remains outside the pass.
- Morning loop retains its Story campaign identity.
- The intact coffee creative and attached trusted campaign-link object.
- The distinct, opaque member-card concept and unchanged-looking QR across the supplied visit states.
- Explicit September 17 Example continuation and Reward ready wording.
- Whole 4/3/1 aggregate values, common-scale ledges and the Recorded aggregates · Unique members qualification.
- Reduced copy, visible simulation labels and accessible preview intent; add no explanatory paragraph.
