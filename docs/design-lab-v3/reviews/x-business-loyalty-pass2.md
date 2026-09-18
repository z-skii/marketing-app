# V3 experience review: Business Loyalty, pass 2

Reviewer: Astra. Verdict: **fix**. Captures: loyalty-home-m.png, loyalty-home-m-full.png, loyalty-home-d.png, loyalty-home-d-full.png, loyalty-create-m.png, loyalty-card-m.png, loyalty-qr-m.png, loyalty-attribution-m.png, loyalty-attribution-d.png, loyalty-program-d.png, 11-loyalty-visit-reward-m-strip.png, 11-loyalty-visit-reward-d-strip.png, 19-reduced-motion-visit-m-strip.png.

**Two second read.** Ten members. Six returned. One reward is ready. Add the next visit.

## The nine questions

- Would someone keep scrolling? **YES**. On Loyalty Home, the coffee artwork leads naturally from operational counts into Jasmine's source attribution. This is useful continuation rather than marketing suspense. The complete attribution page is more repetitive, but appropriately inspectable.
- Does motion reveal the product? **PARTLY**. The strips establish recognition, a fifth visit, reward availability, explicit confirmation and redemption. Desktop visibly connects those actions to Home and Jasmine's projections. They do not establish easing quality or exact timing, and the reduced-motion strip needs investigation.
- Is this more desirable than production? **PARTLY**. The open facts, substantial photography and branded pass provide a convincing improvement over the described administrative shell. No production comparison capture is supplied here, so superiority is not fully established.
- Is the hierarchy instantly understood? **YES**. Add visit is unmistakable. Four fully named counts, three recent customers and the program rule all fit the phone viewport. Desktop separates immediate operations from source attribution cleanly.
- Does this feel like a consumer product? **YES**. The member pass and coffee artwork make this a tangible customer relationship rather than a CRM. Business operations remain appropriately quiet and readable.
- Does the Business side justify paying? **PARTLY**. Counting visits, managing earned rewards and inspecting campaign-linked returns demonstrate credible utility. This surface contributes to paid value; it cannot establish the complete subscription proposition by itself.
- Does Loyalty strengthen the story? **YES**. Jasmine's named Story campaign, Sara's retained identity and the visible attribution update connect acquisition to an ongoing relationship. The experience does not stop at campaign approval.
- Are we actually at the quality benchmark? **PARTLY**. Home, the acquisition QR and the Apple concept now belong in the restrained V3 language. Duplicate counter results, desktop task composition and reduced-motion uncertainty prevent unqualified approval.
- Are there at least three memorable product moments? **NO**. This package shows one local product payoff, not the three public sequences. That is correct for this operational route; the earning, car and source-preserving public moments still require their own review.

## Scores

- business justifies paying: 7
- slop risk: 2
- text discipline: 8
- memorable moments: 6
- material quality: 8
- loyalty strengthens: 9
- keep scrolling: 8
- at benchmark: 7
- truthfulness: 8
- more desirable than production: 7
- motion reveals product: 7
- hierarchy instant: 9
- consumer product: 8

## Wow moments seen

- Sara's fifth visit makes a reward available while her identity and QR remain recognizable.
- The desktop strip visibly resolves Home from 10/6/1/2 to 10/6/2/2 and then 10/6/1/3, while Jasmine's Redeemed changes from 1 to 2. These are two views of one local payoff, not separate public wow sequences.

## Material read

Rationed and credible, not cheap glassmorphism. Home is an uncovered neutral canvas with real photographic color, exposed hairlines and unboxed facts. The phone navigation visibly overlays artwork and text; its restrained frost earns its location. The pass is correctly opaque branded material. Counter and QR tasks are readable white working surfaces. Do not add more glass to make this route feel more spectacular.

## Word count read

Browser measurements: Home phone 50 first-screen / 78 page words at 1369px; desktop 87 / 87 at 900px. The phone overage appears accounted for by the two navigation badges and should be documented as a justified exception if verified. Attribution measures 66 / 114 at 1822px on phone and 90 / 124 at 1489px on desktop; definitions and comparison controls earn this larger inventory. QR is 55 words at both sizes and remains readable. Do not trim simulation labels, counting consequences or customer rows merely to hit a smaller number.

## Spec drift

- Home measures 50 first-screen words on phone rather than the specified 48-token ceiling; desktop measures 87 rather than the proposed 65 to 85 range.
- The counter still duplicates Reward redeemed despite the engineer's one-result-area description.
- The desktop counter reflows the underlying overview instead of leaving its composition still beneath a modal task.
- The reduced-motion strip does not yet demonstrate an immediately complete reward-progress state.

## Spec was wrong

- The hard 48-token phone ceiling failed to accommodate the visible Content and Campaigns attention badges. Accept 50 when both counts are fixture-backed; do not remove useful operational content to recover two tokens.
- The shared desktop specimen guidance permitted native-like objects without sufficiently guarding minimum label sizes. A 375px reference width is not permission to scale down every field.
- The operational route does not need three memorable film moments. Its success is immediate use and a precise confirmed consequence behind the public closing sequence.

## Fixes

- 1. **Counter reduced-motion reward transition and shared motion controls.** Under system reduced motion, render all five confirmed strokes fully filled in the first reward-ready frame. Remove any subsequent stroke fill, outline transition or required fade. Keep the motion control's wording consistent with its actual available behavior. Why: The reduced-motion strip shows Reward ready while the final stroke is still outlined, followed by fully filled strokes. This could be presentation travel or a delayed visual state; either conflicts with immediate, complete reduced-motion confirmation.
- 2. **Counter recognized, unlocked and redeemed states at both sizes.** Use one fixed progress-and-status stack: retain the large visit value, put Reward ready or Reward redeemed directly below it, and remove the repeated Reward redeemed heading from the receipt. Keep only the local Wallet receipt and necessary consequences beneath. Reserve enough width that the desktop status does not wrap into two oversized lines. Why: The final strips still show Reward redeemed twice. Desktop also squeezes the status beside the QR, weakening the stable axis achieved elsewhere in pass 2.
- 3. **Desktop counter opening and return.** Open the desktop counter over the unchanged Home layout using the specified 560px pane and restrained dim scrim. Do not squeeze Home into a newly composed narrow dashboard. Preserve its scroll anchor and restore it exactly on close. Why: The strip shows Home reflowed beside the counter, while its undimmed Add visit and navigation remain visually competitive. Inert behavior alone does not communicate modal ownership.
- 4. **Desktop program inspector and shared Wallet specimen.** Audit the desktop pass's computed typography. Bring noncritical field labels and concept notices to at least 12px, retain readable native-like values, and allow the specimen to grow vertically rather than proportionally shrinking its contents. Why: The desktop program specimen has visibly tiny field labels and qualification text compared with the readable phone pass. A genuine product object should not become miniature screenshot typography.

## Keep

- All four complete count definitions and all three recent rows in the first phone viewport.
- The portrait-proportioned Home photograph and open reward rail.
- Business selected within the unchanged five-destination navigation.
- Jasmine's campaign identity, exposed attribution ledges and separately labelled whole-cohort scale.
- The focused acquisition QR with no raw URL, enclosing promotional card or app navigation.
- Apple store-card anatomy, source acknowledgment outside the pass and explicit No pass is issued.
- Readable redemption confirmation before the deliberate commit.

## Remaining risks

- Strips establish state order, not measured timing, action latency, focus trapping, inertness or exact return behavior.
- Google composition, complete creation and signup, both entry paths, all five attribution sources and counter exception states are not fully shown here.
- Visible projections reconcile in the desktop strip; event-model correctness, idempotency and public-replay isolation still require implementation evidence.
- 320px, tablet, 200% text zoom, opaque material fallback and measured performance are not evidenced in this submission.
- After these fixes, capture the final states and obtain the final Astra review before stopping for human approval.

## Why better than production

Relative to the supplied description of the earlier shell, this replaces compressed administration with a legible customer relationship: real coffee, a usable membership object, immediate counter action and named source returns. It belongs inside V3 without borrowing decorative spectacle. Direct production superiority remains unverified in this capture set.
