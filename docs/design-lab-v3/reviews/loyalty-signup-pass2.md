# V3 review: Customer signup and Wallet card, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: join-m-full.png, join-m-card.png, join-m-apple.png, join-d-google.png, card-m-apple-ready.png, card-m-google-updated.png, join-errors-m.png

**Verdict: fix.** Loopday offers a free coffee after five qualifying visits. Join with a name and one contact, then receive a demo member card. The reward is immediately understandable; the Apple card's narrow layout is immediately noticeable too.

## The ten questions

- Does this feel like a premium modern product? **partly**. The signup and Google card are considered and restrained. The approximately 219px-wide Apple pass inside a 358px phone column is an obvious unfinished layout.
- Does it explain itself without paragraphs? **yes**. Free coffee, five visits, the daily rule and two fields explain the task. The post-signup duplication of issuance disclaimers is unnecessary.
- Does it feel like a consumer platform, not business software? **yes**. A recognizable reward and personal card lead. There are no dashboard tiles, customer-management columns or administrative navigation.
- Is it memorable? **partly**. The coffee image, loop mark and attached Jasmine source provide identity. The narrow Apple object and repetitive action area weaken the finished impression.
- Does motion improve understanding? **partly**. No motion strip was supplied. These stills establish different states, not the quality of arrival, platform switching, save receipts or reduced-motion behavior.
- Does each earning type feel different? **partly**. Recreate, Post and Drive are outside these captures. The two Wallet platforms are visibly different, but that does not answer the earning-type question.
- Is business discovery exciting? **partly**. The marketplace is not shown. This customer task correctly avoids importing discovery or business navigation.
- Is Profile identity, not settings? **partly**. Profile is not shown. The customer card is identity-led, but it is not evidence of the Profile surface.
- Does the website make someone keep scrolling? **partly**. The signup photograph is inviting, but this is a focused enrollment page. The public website and its narrative sequence cannot be judged here.
- Is it significantly stronger than current production? **partly**. The customer acquisition-to-card proposition is a meaningful addition. QR integrity, Apple sizing and the demonstrated save/offer outcomes still prevent finished-product approval.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. The paper, green-black typography, brick-terminal loop and untreated media carry Open Cut into a focused customer task without adding business navigation.
- Does it strengthen the business value proposition? **yes**. It gives campaign attention a concrete next step: enrollment and a recognizable reward card. The attached source makes that handoff more valuable than a generic loyalty form.
- Can a business understand it quickly? **partly**. The five-visit reward and collecting/ready states are clear. Counter speed, redemption and the business counts are not demonstrated on this surface.
- Does it feel consumer quality rather than SaaS admin? **partly**. The signup and Google layout do. The narrow Apple pass and unresolved action hierarchy fall below finished consumer-product quality.
- Does attribution feel powerful without becoming fake analytics? **partly**. From Jasmine's Story stays visible outside the specimen, with no fabricated sales or performance claims. Immutable source preservation and the aggregate comparison cannot be verified from these stills.

## Scores

- motion understanding: 3
- slop risk: 4
- text discipline: 6
- natural part of tapmart: 8
- attribution honest power: 6
- memorable: 7
- quick to understand: 8
- self explaining: 8
- business value: 8
- wallet realism: 5
- truthfulness: 7
- consumer not software: 8
- premium: 6

## Spec drift

- Apple phone width is approximately 219px rather than the specified 358px. Restore the full responsive card width and equal-width phone platform tabs without scaling the QR or text.
- The QR symbols appear too low-version to contain the required full member URLs. The desktop Google QR is also approximately 176px rather than 192px. Use genuine automatically sized encoding and verify decoded capture payloads.
- Initial Wallet states display both No pass is issued. and Simulated actions. No pass is issued. Keep only the shared longer caption while the save-action pair is present.
- The initial Wallet buttons are filled rather than outlined, and Done appears before a save or skip outcome. Restore the specified action hierarchy and state-dependent controls.
- The supplied Updated offer result remains on the card front with Details closed. The required review result is an open Offer details section with the underlying snapshot preserved.
- The desktop source and ordinary-progress copy sit above the tabs, while the action column starts above the pass. Move the source/action composition to the pass field region and return No visits yet to Details.
- Signup qualification, consent and input sizing appear below the specified 16px/24px material text and 52px inputs. Restore those values rather than reducing copy.
- Specimen headers retain Design Lab · Wallet concept instead of the shorter post-signup Design Lab control. Keep the platform-specific truth label adjacent to the specimen, not duplicated in the header.

## Spec was wrong

- My fewer-than-40-words first-viewport target was too rigid for this continuous signup with visible rules and consent. The Jasmine capture contains approximately 61 words in the initial 390×844 viewport and 67 across the complete page, including navigation and actions. Retain the necessary copy, restore the specified readable type sizes, and report the exception. Do not manufacture compliance with extra whitespace, smaller text or hidden obligations.

## Fixes

- 1. Verify and correct the QR encoding before approval. Generate the complete current-origin V3 member URL with its stored opaque member code, error correction M, automatic version selection and a four-module quiet zone. Keep one payload per member across platform, save and specimen changes. Decode the resulting browser captures and record the decoded destinations. (All member QRs, especially join-m-card.png and join-m-apple.png. Retain 176px phone QRs and use 192px from tablet upward.): The visible matrices appear to be only 21×21 modules, which cannot accommodate the specified full URL. Tess's two LD-011 captures also show different patterns; their session provenance is not supplied. A convincing-looking square is not sufficient for the central membership identifier.
- 2. Restore the Apple pass to the available phone width: 358px at 390, 296px at 320 and 375px on tablet/desktop. Preserve real system text, the 176px phone QR, 12px boundary and content-led field regions; do not enlarge a scaled image. Let the strip follow 375:123. Make the phone platform tabs two equal-width, minimum-44px targets. (join-m-card.png, join-m-apple.png and card-m-apple-ready.png.): The Apple pass currently occupies approximately 219 CSS pixels while the Google pass correctly occupies 358px. The large empty right shoulder makes the Apple object look broken, not intentionally platform-specific.
- 3. Make Updated offer an overlay on the currently selected snapshot and open Details directly to Offer. Show Afternoon coffee and its supplied message in the supported details location. Capture an offer layered over Reward ready, retaining 5/5 and one ready reward on Google, and the corresponding ready status on Apple. (card-m-google-updated.png and the read-only specimen controls.): The supplied updated-offer image shows only a closed Google front at 4/5 with zero rewards. It demonstrates neither the offer's placement nor preservation of a ready reward. These separate stills do not prove a reset occurred, but they do not satisfy the required result.
- 4. Rebuild the initial Wallet action area as one coherent state: one shared Simulated actions. No pass is issued. caption, two outlined platform actions, Not now and Details. Remove the second issuance caption and remove Done from this initial state. After a deliberate save simulation, replace the action area with the exact platform receipt, Nothing was added to your device., and Done; expose only the remaining unsaved platform through Add another Wallet. (The action areas in join-m-card.png, join-m-apple.png and join-d-google.png.): Both phone card captures repeat No pass is issued, use two heavy filled buttons and offer Done alongside Not now. This obscures the distinction between inspection, skipping and a completed simulation. No supplied capture demonstrates the save receipt.
- 5. Restore the form's specified reading scale: qualification and agreement text at 16px/24px, helper text at 13px/18px, and inputs at 52px high. Ensure validation boundaries are 2 CSS pixels. Allow the document to grow naturally and retain every obligation. (join-m-full.png and join-errors-m.png.): The qualification and consent appear closer to 14px, helpers closer to 12px, and inputs approximately 48px high. The hierarchy is sound, but material copy must not become the density adjustment.
- 6. Finish the card wrapper composition. On desktop, keep the 375px pass, 48px gap and 280px action column, but move the source acknowledgment and action group down to the selected card's balance/field region. Remove the redundant ordinary-progress sentence above the tabs; No visits yet belongs in Details. Shorten the post-signup header control to Design Lab while retaining the exact platform concept label adjacent to the card. (join-d-google.png and the phone specimen headers.): The desktop actions begin around y=186, above the card itself, leaving the lower companion area unused. The repeated zero-progress line adds another explanation of an already legible balance. The long specimen header also consumes unnecessary phone width.
- 7. Supply the corrected acceptance captures at all six specified viewport sizes, including a clean direct entry. Add a same-session sequence showing signup, zero-progress card, platform inspection, deliberate save and return from Sara's examples. Include the corresponding reduced-motion evidence, QR decode results and keyboard/200% text-zoom checks. (Final V3 capture set and REPORT.md.): The present set is predominantly 390px phone captures plus one desktop card. It cannot establish responsive completion, state continuity, motion semantics or accessible operation.

## Keep

- The untreated coffee photograph and its subject-safe signup crop: pouring stream, cup and hand remain readable. Keep square edges and text outside the image.
- The warm paper, green-black pass, restrained brick terminal and Bricolage/DM Sans wrapper hierarchy. This belongs to Open Cut.
- The focused public signup: first name, one contact, unchecked agreement and no account pitch or business navigation.
- The explicit inline validation messages. Errors identify the affected fields without replacing the form or pretending signup succeeded.
- The distinct platform structures: Apple's primary field and secondary fields versus Google's issuer/program header, separate hero and paired balances.
- Zero progress on the new-member cards, explicit Reward ready on Sara's specimen, and the absence of front-side Redeem controls, fabricated notifications or operating-system save sheets.
- The source acknowledgment outside the pass, plus Sara's name, specimen date and Preview only qualification. Preserve these without exposing contact information.

## Why better than production

Beyond helping a shop find advertisers, this adds somewhere for that attention to go: a simple reward signup and an identifiable customer card. The known creator source stays attached, giving TapMart the customer side of a return loop rather than ending at campaign delivery. The captures explain that proposition without claiming extra sales. This remains a simulation, not a working Wallet launch.

## Remaining risks

- QR contents have not been decoded in this review. The apparent module-capacity problem is an approval blocker, not a cosmetic concern.
- The route was identified as the plain direct entry, but the visible examples show Jasmine or Counter acquisition. A clean untracked entry and preservation of a prior known source need separate evidence; these captures do not establish incorrect attribution.
- Pixels cannot prove idempotent signup/save behavior, unchanged business projections during specimen inspection, duplicate-contact privacy, reload reset or absence of production/network activity.
- No redeemed, points, Google-limit, open-offer, duplicate-contact or save-receipt capture is supplied. In particular, an offer over a ready reward remains unverified.
- The supplied stills do not establish 320px behavior, tablet composition, large-desktop restraint, keyboard focus, screen-reader errors, browser Back or reduced motion. The low motion score reflects missing evidence, not an observed bad animation.
- These are labelled Wallet concepts, not verified native rendering or delivery. Production still requires supported platform integration and verified member-card access; the signup contact field must not become an unverified recovery mechanism.
