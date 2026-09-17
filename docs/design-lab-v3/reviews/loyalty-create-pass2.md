# V3 review: Create program, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: create-m-step1.png, create-m-step2.png, create-d-step3.png, create-d-step4.png, create-m-step5.png, create-d-launched.png

**Verdict: fix.** Choose visits or points, offer a free coffee after five visits, make the card yours, then launch a clearly simulated signup QR.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette, photography and flat surfaces are considered. “Visits datum: 5,” undersized desktop hierarchy and the largely empty launch spread prevent finished-product approval.
- Does it explain itself without paragraphs? **yes**. The rule and next actions are immediately readable. Manual counts are approximately 32, 38 and 32 words in the supplied phone views, including numbers and actions but excluding punctuation-only marks. Brevity passes; missing customer disclosures do not.
- Does it feel like a consumer platform, not business software? **partly**. The branded card and reward rule help. The long desktop field stack and boxed, abbreviated signup specimen still feel like configuration software.
- Is it memorable? **partly**. The loop, coffee and five-visit rule provide identity. Their continuity is not yet strongly composed through the desktop signup and launch stages.
- Does motion improve understanding? **partly**. No motion strip or recording was supplied. Static step captures cannot establish transitions, focus continuity or whether launch motion follows the commit. The motion score reflects absent evidence, not a demonstrated animation defect.
- Does each earning type feel different? **partly**. Recreate, Story and Car are not pictured. Visits and Points are distinguishable choices, but they are not the earning types this question concerns.
- Is business discovery exciting? **partly**. Marketplace discovery is outside these captures. This focused task appropriately does not insert a discovery dashboard.
- Is Profile identity, not settings? **partly**. No Profile surface is shown. Creation’s brand controls cannot establish the quality of Profile.
- Does the website make someone keep scrolling? **partly**. The public website and Loyalty sequence are not shown. No website approval follows from these wizard captures.
- Is it significantly stronger than current production? **partly**. The retention-setup proposition is meaningful. These pixels do not establish a finished end-to-end return loop, and no production comparison capture is supplied.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. The paper, ink, brick, real artwork and focused task language belong to Open Cut. Permanent placement inside Business is not shown here.
- Does it strengthen the business value proposition? **yes**. A shop can understand the new proposition: define a reason to return and prepare a branded way to join. Actual retention and Wallet operation remain unproven.
- Can a business understand it quickly? **yes**. The five-visit reward, daily rule, draft state and launch action are plain. Remove the construction label and clarify optional versus fixed terms.
- Does it feel consumer quality rather than SaaS admin? **partly**. The card and photography carry consumer character. The desktop form stack, boxed signup summary and uncomposed launch result still need product-design finishing.
- Does attribution feel powerful without becoming fake analytics? **partly**. Counter QR and Creator link acknowledge different acquisition paths without invented analytics. No selected creator acknowledgment, preserved source record or return comparison is visible, so attribution power is not established.

## Scores

- motion understanding: 0
- slop risk: 3
- text discipline: 7
- natural part of tapmart: 8
- attribution honest power: 3
- memorable: 6
- quick to understand: 8
- self explaining: 7
- business value: 8
- wallet realism: 6
- truthfulness: 8
- consumer not software: 7
- premium: 6

## Spec drift

- Phone Program uses a separate paper brand row and full-width photo instead of the compact ink brand/photo strip. Restore 358×104 at 390 and 296×88 at 320.
- The Reward rule’s five-stroke datum became literal “Visits datum: 5” text. Replace it with the specified graphical strokes.
- Desktop uses the small centred current-step heading and position rather than the Create program task header. Restore the desktop shell, type scale and 1176px composition.
- Desktop Signup uses a narrower boxed customer summary instead of the complete 440px inspection. Restore the identity, counting rule, contact explanation, contact-mode control and legal affordances.
- The launched desktop result is a single left column rather than a QR-and-working-summary spread. Move status, link and actions into the right column.
- The Apple specimen QR’s visible module density does not match the specified version-4 matrix. Regenerate to the explicit specimen contract and verify its decoded payload; do not infer correctness from its recognisable QR silhouette.
- Card platform tabs and Preview state occupy the specimen column, and Crop is a visible shared slider. Put editing controls in the editing column and provide separate platform crop inspection.
- Phone headings and action geometry depart from the specified 28px titles and consistent 48px primary-action treatment. Restore those values without shrinking content to force the fold.

## Spec was wrong

- The final review was too dependent on Terms for a material restriction. Add “Redeem on a later purchase.” beside the rule before launch. Keep the full conditions in Terms.
- Calling the editable field simply “Terms” makes the program’s fixed conditions sound optional. Use “Additional terms · Optional” for the editable disclosure and “Program terms” for the fixed agreement.
- The abbreviated phone launch hierarchy works without another “Ready to launch” heading. Keep Launch, the prominent reward rule and Draft; do not restore a redundant heading merely to match my inventory.
- The first-screen word target must not produce an abbreviated customer inspection. Show the complete customer-facing rule, contact explanation and legal controls; report the expanded inspection separately.

## Fixes

- 1. Verify and correct the actual QR objects. Sara’s specimen must use the specified version-4, error-correction-M matrix, including its four-module quiet zone, at 164×164 CSS pixels. Acquisition codes must use black modules on white, integer module sizing and their distinct draft or launched payloads. Decode the specimen, draft, launched and exported codes with an ordinary reader. (Card specimen, Signup acquisition object, Launch review and launched QR.): The Sara matrix is visibly much coarser than the specified 33×33 encoded modules. QR appearance cannot prove its payload. A believable card containing the wrong identifier is not an acceptable finished concept.
- 1. Make the desktop signup inspection the complete customer surface at a 440px readable measure, without the enclosing outlined form box. Include its own business identity, daily counting restriction, Use phone control, contact-purpose sentence and distinguishable legal links. Keep the agreement and Create my card disabled. Remove the duplicate desktop “Open signup preview” entrance when the same preview is already present. (create-d-step4.png, right-hand signup inspection.): The current right-hand specimen omits material content and interaction choices. Showing the daily rule in the separate business column does not make the customer page complete.
- 1. Add “Redeem on a later purchase.” to the final review beside the daily rule, before Launch demo program. Preserve the full program terms as an operable disclosure. (Launch review, phone and desktop.): The present summary can be read as an immediate fifth-purchase reward. The fixture’s later-purchase condition should not be discoverable only after opening Terms.
- 1. Delete “Visits datum: 5” and render the actual five straight 2px rule strokes. Rename the optional editing group “Additional terms · Optional,” retaining Add terms and a separately named Program terms disclosure. (create-m-step2.png.): Construction terminology is visible in a customer-facing product. The current three-part Terms treatment also leaves unclear which conditions are optional.
- 1. Supply the approval evidence after these changes: all six required viewport sizes; phone Card and Signup; both program kinds and both Wallet templates; draft exit, guard, failure and success states; normal and reduced-motion recordings; decoded QR results; event assertions; keyboard, Back, zoom and safe-area checks. (V3 capture set and REPORT.md.): Six static captures do not satisfy the final acceptance gate. A visible success label does not establish atomic launch, zero enrollment events, functional controls or accessible navigation.
- 2. Restore the desktop task composition: a centred 1176px width at 1440, 132px outer margins, a 72px task header and 56px step row. Put Create program in the desktop header and use the specified display hierarchy. Use 476px and 676px columns with a 24px gap. On launch success, place the QR left and Live · simulated, 0 members, link, utility actions and Open loyalty right. (Desktop Card, Signup and launched result.): The supplied desktop shell retains a small phone-style heading. Signup shifts the preview too far right, while launch collapses everything into one left stack and leaves most of the canvas unused. Launch tools may be below the capture; they belong in the available working column, not below a narrow tower.
- 2. Compact the phone Program brand object into the specified 358×104 ink-and-photo strip, with the photograph occupying the right 132×104 area. Use 296×88 at 320. Restore 28px Bricolage step titles and Back on Program. Give all steps one consistent 76px action treatment, a top separator, 48px primary buttons and safe-area clearance; Save draft remains in the scroll content. (Phone Program, Reward and Launch shell.): The separate brand row and wide photograph consume substantially more height than the intended compact object. Header type and primary-button geometry also vary from the system. Do not diagnose a fixed footer solely from a full-page capture’s painted position; the visible problems are the absent shared treatment and inconsistent geometry.
- 2. Move desktop platform tabs and Preview state into the editing column, leaving the card wrapper for its concept label, specimen, truth notes and Details. Limit controls to the specified 568px inner measure and pair related short fields. Replace the visible shared Crop slider with a Crop action opening the active platform’s image window and labelled horizontal, vertical and zoom controls. (create-d-step3.png.): The current editor duplicates platform information above the specimen and presents crop as a generic slider described as affecting both layouts. Apple’s photographic strip and Google’s hero need independent, inspectable positioning.

## Keep

- The warm paper, green-black ink and restrained brick accents. The visible brand colour values match the intended palette.
- Exactly two unboxed program choices, with the fixed one-qualifying-purchase-per-day rule visible.
- The prominent “5 visits → Free coffee” rule. It is the clearest object in the flow.
- The repeated coffee artwork and loop identity. Do not replace them with illustrations, unrelated café media or decorative effects.
- The Apple specimen’s supported-field approach: progress, reward, member, status and QR, without a front Redeem button or invented native progress widget.
- The adjacent concept, specimen and no-issuance labels, plus the distinction between Draft and Live · simulated with 0 members.
- The focused creation task without business navigation, dashboard metrics or a sixth destination.

## Why better than production

This gives a shop a next step after advertising: define a reward, preview its branded Wallet card and prepare a signup QR. It starts turning campaign attention into an ongoing customer relationship rather than ending at the campaign. These captures demonstrate setup and an honestly labelled, zero-member demo launch, not issued passes, returning customers or proven attribution.

## Remaining risks

- QR payloads, scannability and export contents cannot be approved from screenshots. The specimen matrix mismatch makes decoding a release blocker.
- Only three phone steps and three desktop states are supplied. Narrow-phone, tablet, large-desktop, Google, points and exceptional-state quality remain unreviewed.
- Launch atomicity, idempotency, zero-member projections, draft preservation and the absence of signup or Wallet events require event assertions.
- The screenshot does not establish independent crop storage, contrast validation, local image handling, legal-link behavior or functional clipboard and download tools.
- Keyboard navigation, focus restoration, browser Back, 200% text zoom, reduced motion and footer clearance are unverified.
- The visible Wallet honesty is good, but the concept is not evidence of native rendering, pass issuance, save confirmation or notification delivery.
- Creator-source preservation and the complete return-to-redemption loop are outside this capture set. Do not present setup approval as attribution or retention validation.
- Scores are out of ten. Motion and attribution scores reflect the limited evidence supplied, not a claim that unseen implementations are defective.
