# V3 review: Customer signup and Wallet card, pass 1

Reviewer: Astra, TapMart's design director.

Captures: join-m-full.png, join-m-card.png, join-m-apple.png, join-d-google.png, card-m-apple-ready.png, card-m-google-updated.png, join-errors-m.png

**Verdict: fix.** Loopday offers a free coffee after five qualifying visits. Give a first name and one contact to get a demo card. Wallet saving is simulated.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette and typography are considered. Heavy pass shadows, notification-like bubbles, improvised Wallet badges and the narrow desktop stack lower the finish.
- Does it explain itself without paragraphs? **yes**. Free coffee, five visits, one counted visit per day and two identity fields explain the core task. Secondary wrapper copy still repeats information.
- Does it feel like a consumer platform, not business software? **yes**. A reward, a short form and a personal card lead. There are no dashboard tiles or administrative tables.
- Is it memorable? **partly**. The coffee object and dark pass have character. The distinctive source-to-member thread is pushed to the bottom or missing from specimens.
- Does motion improve understanding? **partly**. Only still captures were supplied. They show different states, not the transitions, timing or reduced-motion behavior.
- Does each earning type feel different? **partly**. Not assessable here: this customer surface contains no Recreate, Story or Car earning compositions.
- Is business discovery exciting? **partly**. Business discovery is outside these captures. The customer signup cannot establish that result.
- Is Profile identity, not settings? **partly**. No Profile capture was supplied. The member card is identity-led, but it is not evidence about Profile.
- Does the website make someone keep scrolling? **partly**. The public narrative is not shown. This task should encourage completion rather than prolonged scrolling.
- Is it significantly stronger than current production? **partly**. The new enrollment-and-return proposition is valuable. Final superiority requires the missing interaction, QR and state-integrity evidence, not just attractive cards.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **partly**. The warm palette, typography and brick details fit. Floating Lab furniture and notification bubbles introduce a conflicting visual language.
- Does it strengthen the business value proposition? **yes**. A source-aware enrollment and a card worth keeping extend advertising into an identifiable customer relationship without invented revenue.
- Can a business understand it quickly? **yes**. The five-visit reward and zero-progress member card explain enrollment quickly. Counter operation and return measurement are not demonstrated here.
- Does it feel consumer quality rather than SaaS admin? **partly**. The core form and card do. Platform presentation and desktop composition need refinement before the consumer-quality claim is convincing.
- Does attribution feel powerful without becoming fake analytics? **partly**. Jasmine and Counter QR are named without percentages or sales claims. The source thread is too distant, and these screenshots cannot establish immutable attribution or count reconciliation.

## Scores

- motion understanding: 3
- slop risk: 5
- text discipline: 6
- natural part of tapmart: 7
- attribution honest power: 5
- memorable: 6
- quick to understand: 8
- self explaining: 8
- business value: 7
- wallet realism: 4
- truthfulness: 5
- consumer not software: 8
- premium: 6

## Spec drift

- Signup artwork is absent, not shown as a labelled failure. Restore the specified responsive 4:3 asset region or its honest reserved fallback.
- The task header is merged with business branding, Back is absent, and the loop mark has an enclosing disc on signup. Separate the task header and use the unbadged open-loop mark beside the business name.
- The signup reward heading appears about 34px at the supplied phone scale rather than 28px/32px. Restore the specified app heading size.
- Initial signup success lacks platform tabs and the adjacent Apple concept label. Both must appear before saving.
- Wallet controls imitate official badges despite the specification requiring plain labelled buttons when no approved assets are supplied.
- Both passes have substantial shadows. Apple adds a photographic fade and changes the field arrangement; Google changes the header hierarchy and repeats Member ID.
- QRs appear approximately 131px overall rather than 176px phone and 192px desktop. Replace them with verified payload-based renderings at the specified sizes.
- Notification-like banners replace the specified plain Details explanations. Remove those banners entirely.
- Sara examples omit Example member · Sara, snapshot dates and Preview only; state controls are printed on the phone page instead of being confined to the Lab sheet.
- The desktop member result remains a narrow vertical stack rather than the specified card-and-action composition.
- Source acknowledgment is relegated to the bottom of new-card pages and absent from the visible specimen hierarchy. Restore it directly above the card.

## Spec was wrong

- The fewer-than-40-words signup viewport target is not a useful acceptance gate alongside a complete, honest form. Measure and report first-screen and full-document copy, but prioritize reward comprehension, qualification rules and consent. Do not use image height simply to push obligations below the fold.
- The strict copy inventory omitted the required historical specimen date. Explicitly permit the supplied snapshot date and a labelled continuation date beside Example member · Sara.
- The instruction to place the desktop simulation caption at the card/action seam was too ambiguous. Put the action qualification directly above the Wallet action pair so it cannot become detached from the controls it qualifies.

## Fixes

- 1. Remove both notification-shaped previews. Updated offer must open Details at Offer. Show Apple change-message examples only as plain quoted text inside the expanded Wallet update explanation. Google gets conditional behavior text, its shared rolling allowance and Nothing is sent in this preview. (card-m-apple-ready.png and card-m-google-updated.png, above the pass): The rounded, shadowed banners depict a system presentation the lab neither delivers nor controls. May notify does not make a fabricated notification appearance acceptable.
- 2. Generate and decode the actual member-route QRs. Render the complete QR including its four-module quiet zone at 176px on phones and 192px on tablet/desktop, with square white boundaries. Supply decoded payload results for both members and platforms. (Every Apple and Google card capture): The visible QR containers are approximately 131 CSS pixels, below even the 144px minimum. Their unusually sparse patterns also require verification against the long opaque-route payload; visual resemblance is not proof of a usable member identifier.
- 3. Label Sara inspection with Example member · Sara, the supplied snapshot or continuation date and Preview only. Keep the preserved Jasmine acknowledgment above the card, outside the native fields. Put phone state controls in the Lab sheet and provide Back to my card or Back to signup. (Both card-m specimen captures and the specimen return flow): The ready and offer screens currently look like an ordinary member’s current state rather than a deliberately selected, isolated example. They also lose the signature acquisition thread.
- 4. Give the initial member card the exact Apple concept label and two platform tabs before any save action. Replace the badge-like controls with equal-width, 48px-high labelled text buttons. Place Simulated actions. No pass is issued. immediately above that pair. After saving, use Done and the remaining-platform flow; remove redundant View Apple concept or View Google concept links. (join-m-card.png, join-m-apple.png and join-d-google.png): The first card is currently unqualified as a platform concept, inspection is not independently available, and the Google badge uses the shop’s loop mark as though it were platform branding.
- 5. Rebuild the pass geometry without shadows or image fades. Apple: 60px header, 375:123 strip with a hard 60% solid/40% photo split, 32px primary value, Reward and Member on one row and Status below. Google: 72px header with program first and issuer beneath, separate 3:1 hero, title-case 12px labels and 30px balances. Keep the 12px pass boundary and system typography. (All pass fronts; remove the second Google member ID beneath its QR): Apple currently uses a roughly 42% solid/58% photo strip with a blended edge and three compressed fields on one row. Google reverses the header hierarchy, shrinks its type and duplicates the member ID. Both feel like styled web cards rather than disciplined native concepts.
- 6. Restore the signup composition: separate 56px task header with Back and the Lab control, then the open-loop brand row, 358×268.5px untreated artwork at 390, source, 28px reward heading and rules. Move Use fictional details only. directly before the first field. Remove the invented earning-edge divider here. (join-m-full.png and join-errors-m.png; use 296×222px artwork at 320 and the specified compact inset on desktop): The supplied build omits the entire artwork region despite using the asset on the cards. Its oversized heading and merged header make the signup more generic and less faithful to the branded object that follows.
- 7. At 1440, replace the centered 440px post-signup stack with the specified stage beginning around x=260: a 375px pass, 48px gap and 280px action column. Align source and actions near the pass field baseline; Details expands the companion region to 440px. Cap the stage at 920px at larger widths. (join-d-google.png): The desktop capture is a phone-like column surrounded by unused paper. The actions and source sit far below the object instead of forming a deliberate desktop task.
- 8. Use one header-based Design Lab entrance, shortened after signup. Move Return to business preview into that panel, remove the customer-page business footer and floating pill, and restore visible Back navigation. Put From Jasmine’s Story. or Join at the counter. directly beneath the card heading. (All customer wrappers): Repeated lab controls, promotional footer furniture and a distant source line compete with a focused customer task. The acquisition thread should be immediately legible, not a footer discovery.
- 9. Make the unchecked agreement visually empty: surface fill, clear boundary and an explicit check only when selected. Retain its native semantics, 44px target, independent legal links and existing inline error treatment. (join-m-full.png and join-errors-m.png, consent control): The solid dark square reads ambiguously as selected even in the missing-agreement error capture.

## Keep

- Warm paper, green-black text and the restrained brick accent; this already belongs to Open Cut.
- The short first-name-plus-one-contact form, visible daily rule and consent before submission.
- Explicit inline validation beside each affected control; errors do not erase the form or masquerade as success.
- Zero visits on the newly created member card and the visible distinction between membership and Wallet saving.
- The exact simulated-save receipts and Nothing was added to your device.
- Different Apple and Google compositions, real coffee photography, readable member identity and no contact details on the pass front.
- No business rail, customer directory, revenue claims or staff Redeem action in the customer task.

## Why better than production

This introduces a useful next step after advertising: a customer can join the shop’s reward program, receive a distinct member card and keep their acquisition source attached. The captures make zero starting visits and simulated Wallet saving clear. That is a stronger business proposition, but these pixels do not yet prove working attribution, secure card identification or platform-realistic updates.

## Remaining risks

- No motion strip, reduced-motion recording or task-timing evidence was supplied; animation semantics remain unreviewed.
- Captures at 320, 768, 1023 and 1920, plus 200% text zoom, are still required. The desktop signup introduction is also unseen.
- QR payload correctness, cross-platform stability, absence of contact data and separation from signup QRs require decoding, not visual approval.
- The stated direct route is shown with Jasmine and counter contexts. These could be deliberate preserved-source scenarios; capture a fresh direct alias and document each capture’s entry state before judging attribution behavior.
- The desktop new member is Omar rather than the supplied Tess helper. This may be deliberate fictional input; record the test input and do not treat it as proof of an identity-switch defect.
- Offer-over-ready, redeemed, points, Google-cap, duplicate-contact, phone, draft, invalid-link and retained-failure states are not demonstrated.
- Fixture isolation, idempotent signup/save, reward preservation, source reconciliation and return from Sara examples to unchanged Tess need event-level checks.
- Keyboard operation, focus restoration, screen-reader errors, consent semantics, browser Back and network isolation cannot be approved from still images.
- Artwork provenance and crop approval remain to be documented; visible use of a photograph does not establish manifest verification.
