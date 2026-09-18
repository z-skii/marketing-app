# TapMart V3 experience direction

Author: Astra (design director). Written from docs/design-lab-v3/EXPERIENCE_BRIEF.md and ARTEC_LIVE_STUDY.md.

## Founder read

The founder is not asking for Open Cut with a Loyalty section attached. They approved Loyalty's product foundation, then rejected the material ceiling of the surrounding experience. Open Cut got marketplace hierarchy, truthful money, distinct opportunity types and restrained navigation right. Its square media, straight earning edge, warm paper, heavy display type and prohibition on transparency made it feel like an editorial inventory rather than a desirable product in motion. V3 must replace that physical language, not decorate it. The current captures establish what exists and what must keep working; they do not determine composition, typography, material or motion. This is direction for the entire five-surface experience, with the public homepage first.

## Artec read

The supplied September 17 live study, not a new inspection performed here, shows a more selective material system than the phrase glass website suggests: a floating navigation bar, a responsive closing panel, a few overlays, tinted shadows, edge highlights and working-looking product miniatures. It reports 12 backdrop-filter elements on the creator page, alongside much more numerous ambient and looping animations. Its screenshots are incomplete evidence; the useful primary evidence is the retrieved DOM, CSS, media inventory and measured copy. Take the rationed material, explicit money, product-scale objects, compact captions and visible motion control. Do not copy the purple mesh button, clouds, metallic headings, repeated four-beat section template or infinite loops. Artec uses separate creator and hiring pages and does not demonstrate narrative scroll sequences or working public interfaces. TapMart must solve the harder two-worlds-on-one-page problem and make motion explain actual product relationships. The benchmark is material confidence, not a visual theme to imitate.

## Thesis

TapMart V3 is a product experience about the same work changing hands: a reference becomes a submission, a vehicle becomes specific advertising inventory, and a creator's source stays attached to a customer who returns. Real media supplies desire; readable coded objects supply understanding. A bright, restrained canvas and a few optically convincing control surfaces give those handoffs physical depth. Keep Open Cut's product discipline and the approved Loyalty foundation, but replace its flat editorial shell with material and motion that reveal what the product does.

## Material system

**layers.**
- Canvas / z0: background #F6F7F5; blur 0; saturation 1; border none; inset highlight none; shadow none; radius 0. This replaces V2's global warm paper. The Loopday brand retains its own approved colors.
- Media / z10: original image or video colors at opacity 1; blur 0; saturation 1; border none; inset highlight none; shadow none. Recreate media radius 4px, intact Story creative radius 0, car field radius 0, portrait radius 4px. These small edge decisions never become enclosing cards.
- Working paper / z20: background #FFFFFF; blur 0; saturation 1; border none except an exposed 1px #DCE2DE divider where needed; inset highlight 0 1px 0 rgba(255,255,255,0.9); shadow 0 16px 48px rgba(43,67,54,0.10) only when floating over another task; radius 24px 24px 0 0 on mobile sheets and 18px on exposed desktop drawer corners. Long forms and details are opaque.
- Light lens / z40: background rgba(255,255,255,0.58); backdrop blur 16px and saturate 1.16; 1px masked edge stroke using a 135deg gradient from rgba(255,255,255,0.88) at 0%, rgba(255,255,255,0.16) at 48%, to rgba(223,234,225,0.64) at 100%; inset highlight 0 1px 0 rgba(255,255,255,0.74); shadow 0 8px 28px rgba(46,74,60,0.09); radius 18px for navigation and 14px for an inspection rail. The gradient describes an edge, never a decorative panel fill.
- Dark lens / z40: background rgba(22,34,27,0.64); backdrop blur 16px and saturate 1.12; 1px edge stroke rgba(235,246,237,0.26) with a top highlight rgba(255,255,255,0.36); inset highlight 0 1px 0 rgba(255,255,255,0.18); shadow 0 8px 28px rgba(10,28,17,0.22); radius 18px or 14px by the same roles. Restricted to controls over the public dark media stage.
- Grip / z50: background #17221E; blur 0; saturation 1; border none; inset highlight 0 1px 0 rgba(255,255,255,0.16); shadow 0 5px 14px rgba(35,60,44,0.14) only when the control physically floats; radius 12px. This is the primary action, not another glass layer.
- Native pass object / z20: preserve Loopday background #18231D, text #F7F4EB and label #C4CDBF; blur 0; saturation 1; border none; inset highlight none; restrained shadow 0 10px 30px rgba(35,60,44,0.12) in the concept wrapper only; Apple concept boundary 12px, Google concept follows its approved distinct composition. Never refract pass text or the QR.
- Modal scrim / z60: background rgba(20,32,25,0.30); blur 0; saturation 1; border none; highlight none; shadow none; radius 0. A scrim dims; it is not a full-screen frosted material.

**typography.**
- {"face":"Existing bundled DM Sans","sizes":"Public display 52px/1.04 on phone, 44px at 320, 76px/1.02 at 1440, maximum 88px; weight 500; tracking -0.045em.","role":"Audience proposition and the few necessary public display lines. Retire Bricolage's heavy headline treatment; do not replace it with metallic lettering."}
- {"face":"Existing bundled DM Sans","sizes":"Chapter verbs 32px phone and 44px desktop; profile name 32px and 44px; sheet title 28px and 32px; weight 500 to 600; tracking -0.03em.","role":"Product-scale titles. Short enough to remain part of the object, not a second marketing layer."}
- {"face":"Existing bundled DM Sans","sizes":"Opportunity money 36px phone and 44px desktop; compact 32px at 320; overview counts 32px and 40px; actual balance contract 48px and 72px; weight 600; tabular lining numerals.","role":"Money and counts. Basis stays adjacent at 13px. No K abbreviations, invented rounding or animated intermediate values."}
- {"face":"Existing bundled DM Sans","sizes":"Body and obligations 16px/24px; actions 14px/20px at weight 600; secondary facts 13px/18px; navigation and noncritical labels 12px/16px minimum.","role":"Readable product UI. No 9px monospace metadata layer."}
- {"face":"System UI font stack","sizes":"Use the approved Apple and Google concept hierarchy at readable native-like scale; never shrink the pass to make two specimens fit a phone.","role":"Wallet concepts only, visibly distinct from TapMart's app typography."}

**tokens.**
- {"value":"#F6F7F5","token":"--v3-canvas","role":"Bright neutral app canvas; replaces the global V2 warm paper."}
- {"value":"#FFFFFF","token":"--v3-paper","role":"Opaque reading and task surfaces."}
- {"value":"#17221E","token":"--v3-ink","role":"Text, money and primary actions."}
- {"value":"#59655D","token":"--v3-muted","role":"Secondary text at full opacity."}
- {"value":"#DCE2DE","token":"--v3-line","role":"Separators and input boundaries, not media outlines."}
- {"value":"#142019","token":"--v3-stage-dark","role":"The public business acquisition stage and deliberate media inspection."}
- {"value":"#D5E85A","token":"--v3-create","role":"Preserved Business Create fill and a small labelled review-needed indicator."}
- {"value":"#315E49","token":"--v3-focus","role":"2px focus outline with 3px offset on light surfaces; use white on dark surfaces."}
- {"value":"#236444 / #835400 / #B3261E","token":"--v3-success / --v3-warning / --v3-danger","role":"Confirmed success, real warnings and explicit errors. Never opportunity-money decoration."}
- {"value":"#F7F4EB / #18231D / #B73E28 / #C4CDBF","token":"--loopday-paper / --loopday-ink / --loopday-terminal / --loopday-label","role":"Preserved Loopday brand and Wallet defaults. The brick terminal belongs to its logo, not every TapMart divider."}
- {"value":"4, 8, 12, 16, 24, 32, 48, 64, 96, 128px","token":"--v3-space-scale","role":"Keep V2's useful spacing discipline. Use 16px phone page padding, 32px desktop main padding and generous object separation."}
- {"value":"44px minimum targets; 64px mobile navigation plus safe area; 104px plus safe-area content clearance","token":"--v3-interaction-geometry","role":"Readable, operable controls with no content obscured by the floating navigation."}

**reduced motion.** Under prefers-reduced-motion, remove autoplay, sticky narrative mapping, parallax, comparison-mask travel, refraction displacement, pointer movement and all introductory motion. Present ordered states in document flow; direct actions replace layouts immediately, with no required fade. Video never autoplays. A visible Pause motion / Resume motion control is present beside the compact lab context and remains reachable without opening settings. Pause freezes media and presentation timelines without resetting position; necessary product state changes still render immediately and truthfully. Off-screen sequences stop. Direct manipulation has button equivalents. Reduced transparency, unavailable backdrop filtering or an unreadable background uses an opaque #FFFFFF or #17221E substitute.

**principle.** Glass is a thin control material between the person and something they are inspecting. It earns its existence only when real content can be seen moving beneath it or when it preserves context around a temporary control. Content itself is usually opaque or uncovered. V3 explicitly replaces V2's no-transparency rule, square-everything rule and brick earning-edge signature; it keeps V2's money truth, media ownership, navigation and point-of-need disclosure discipline.

**motion easing.**
- Open, 440ms, cubic-bezier(0.16,1,0.3,1): object-to-detail and audience reorientation. Controls are active immediately.
- Settle, 220ms, cubic-bezier(0.2,0.8,0.2,1): alignment of a fact, progress mark or contextual action after confirmed state.
- Reveal, 160ms, cubic-bezier(0.2,0,0,1): a label or consequence becoming readable.
- Scrub, linear input mapping with no momentum added: comparison handle and desktop narrative position.
- Return, 280ms, cubic-bezier(0.22,1,0.36,1): restore the source object and exact scroll anchor.
- Press, 100ms down and 160ms return, cubic-bezier(0.2,0,0,1): at most scale 0.98 on the control only.
- Value replacement, 120ms linear crossfade of complete values after authoritative or approved local-fixture confirmation. Never roll digits.
- No overshooting springs, perpetual breathing, random stagger or animation-delayed actions.

**refraction and depth.** Use actual backdrop filtering for the lens body. For the three controlled public stages only, approximate edge refraction with an aria-hidden duplicate of the same static source image, clipped to a 6 to 8px inner rim, scaled 1.015 around the shared media origin, displaced at most 1.5px and blurred 0.5px at opacity 0.34. Its coordinates must remain registered to the underlying image. This is an optical approximation, not a claim of physically accurate refraction. Never duplicate a video decoder, distort text or sample unrelated imagery. The central reading area stays stable. Pointer-capable devices may move a restrained edge highlight up to 16px; photos and passes never tilt. Depth comes from occlusion, differently moving planes, a thin top highlight and restrained green-grey shadows. Maximum two active backdrop-filter regions on phone and three on desktop; do not nest them. Target total visible blur area below 20% of the viewport. If contrast cannot hold, increase the lens's opaque reading backing rather than darkening or blurring the media.

**allowed on.**
- Floating public navigation: media genuinely passes beneath it and it remains spatially separate from the page.
- Mobile app navigation: a functional foreground over the scrolling feed, with readable labels and safe-area clearance.
- The hero audience control: it belongs to the shared object and makes the change of viewpoint tangible.
- An active media inspection or approval rail: it temporarily holds a control while the inspected object remains visible below.
- A focused task's compact sticky header: only when its own content scrolls underneath; the form body remains opaque.

**forbidden on.**
- Opportunity containers, people, work galleries and car photographs.
- Balances, money badges, Loyalty counts and attribution ledges.
- Customer rows, event history, forms, legal text and settings lists.
- Native Wallet pass artwork, supported fields, QR codes and quiet zones.
- The Loyalty discovery strip and the desktop sidebar.
- Whole-page backgrounds, full-screen modal blur and decorative floating panels.


## Two worlds

**wording.**
- Make money / Grow your business, chosen. Clear, direct and faithful to the two reasons to open TapMart.
- Earn with TapMart / Advertise with people, more specific, but the business wording undersells cars, subscription content and Loyalty.
- Get paid / Bring people back, useful closing beats, not audience names; each describes too little of its world.

**hero.** One matched Loopday reference is the shared brief. In the earning lens it is a paid opportunity; in the business lens it becomes an outgoing brief beside an unassigned, inspectable Maya candidate. Hero words: Make money. Grow your business. Recreate this Reel. US$75. On approval. Loopday Coffee. No supporting paragraph. Do not imply that Maya created the business-owned reference or has accepted the brief.

**answer.** Build one shared stage, not a split hero and not two marketing pages. A two-position audience control sits on the stage's foreground edge, with both names always visible. The object changes viewpoint: incoming work and pay for the person; outgoing brief, candidate work and request actions for the business. The active action anchors to that world's first chapter. Both complete stories remain in the same document in a stable order, so the visitor can understand the exchange rather than choose a site before understanding it.

**audience switch.** A tap updates ?audience=earn|business and the selected state immediately. Over 440ms the same reference reduces into a labelled Campaign reference position while Maya's own portrait/work enters as a separate candidate object; returning restores the opportunity and its amount/basis. The hero's local background changes between bright canvas and the restrained green-black business stage. Nothing elsewhere jumps or reorders. Explore earning and Explore business are native anchors, not mode-switch commands. Keyboard selection, focus, browser Back, both directions and the unchanged surrounding document must be recorded. On phone the stage shows one readable composition at a time; no two-column miniature desktop hero.


## Wow moments

### The work changes hands (user_earning, /design-lab-v3, Recreate; the opening continuity is reused in User Home opportunity detail.)

**explains.** The reference is an instruction, the creator's output is a separate submission, business approval creates earnings, and a payout is a separate event. The work remains identifiable through the handoff.
**trigger.** The public Recreate stage supports a comparison handle and a visible Next control. Desktop native scroll may advance the same sequence over a maximum 160svh region. Mobile never pins. Replay resets presentation only. No scroll, drag or playback action submits, approves or credits anything.
**reduced motion.** Show Reference, Creator version, the submission preview and the supplied approval example as ordered, stationary objects. The comparison remains operable through Reference and Creator version buttons. No sliding mask, sticky stage or automatic playback.
**engineering.** Use real React media and workflow elements, a clipped comparison viewport and transform-based shared-element transitions. The images are distinct layers; do not dissolve one photograph into another as if it were generated or filmed. The approval rail is the one refracting material object. Use a source-matched static image copy only inside its narrow optical rim. The default execution is still-based. Resolve reference/submission/approval ownership through the media and state manifests before enabling a continuous-record replay. The supplied approved latte still may appear as a separately labelled Approved example, but cannot inherit Loopday's US$75 or another campaign's identity.
**motion.** Begin with the reference at rest. A deliberate comparison drag moves a hard reveal boundary linearly, exposing the creator version without interpolation. Next opens the submission surface in 440ms using open easing; the reference reduces to a small, labelled source object. The same submission moves 24px beneath the stationary approval rail over 360ms. Its image is momentarily displaced by 1.5px only within the rail's optical rim. Reveal the supported approval snapshot in 160ms. A ledger continuation appears in 220ms, aligned with the work rather than flying toward a balance. Only a supplied ledger state can show an earned amount; otherwise the endpoint reads Approval earns. Payout is separate. End completely still.
**product object.** The matched Loopday reference and ownership-matched creator work from the V2 manifests; alternatively, the supplied /uploads/seed/demo-latte.webp as its own approved example. No invented reference-to-submission relationship.

### One part of a real car (car, /design-lab-v3, Find cars; /design-lab-v3/business vehicle preview.)

**explains.** A car is not one undifferentiated advertising slot. The business is inspecting a real vehicle, a specific placement and that placement's asking rate. The US$240 asking rate is not the user's US$300 campaign opportunity.
**trigger.** Tap Rear doors or View on Eli's car. On the public page, Next advances the demonstration and Replay restores the wide photograph. The working business preview accepts zone selection only for supported zones. No hover is required.
**reduced motion.** Open the full photograph and the labelled two-dimensional placement plan immediately. Selected zone and asking rate update without movement. A photograph never acquires drag-to-rotate controls.
**engineering.** Use the actual vehicle image with an expanding clip and translated image plane; retain the original aspect ratio and all vehicle geometry. Render /design-lab/placement-rear-doors.svg as a separate two-dimensional plan, not a fake wrap painted onto the photo. Align any connecting leader to manually verified image landmarks; omit the leader if the crop cannot support it. The photograph can move beneath the narrow inspection rail, but the car is never extracted, reconstructed or rotated. No WebGL is needed for the supplied still-only fixture.
**motion.** Open the existing 3:2 vehicle composition to a wider inspection stage over 440ms, with the image translating at most 40px and scaling no more than required by the reviewed crop. Over the following 240ms, the placement plan unfolds beside, not over, the intact photograph. Its rear-door zone receives a 160ms fill reveal. The US$240 /month Asking rate line moves 12px into alignment with that zone over 220ms. The final action stays available throughout. Return reverses the composition in 280ms and restores the exact feed anchor.
**product object.** /design-lab/vehicle-eli-01.jpg, /design-lab/placement-rear-doors.svg and Eli's existing rear-door US$240/month asking-rate fixture.

### The source never leaves (business_loyalty_loop, /design-lab-v3, business-to-Loyalty closing sequence.)

**explains.** A creator's known first touch survives signup, Wallet choice, later visits and an earned reward. The business can inspect the resulting member aggregates without exposing customer information to the creator.
**trigger.** Desktop native scroll maps to the approved dated sequence, with a final attribution frame. Mobile uses Play sequence, Pause, Previous, Next and Replay in ordinary document flow. Playback runs once. Any direct navigation stops playback. Open loyalty preview enters the separate working store.
**reduced motion.** Present the source, signup, zero-progress card, dated visits, reward and attribution as normal ordered sections. Combine the three intermediate dates into one readable event strip without losing values. No autoplay or sticky mapping.
**engineering.** Build the Story, signup replay, distinct member QR, Apple or Google concept, date band, counter confirmation and attribution descent as coded elements. Use the approved independent public replay store. Keep the source marker outside the native pass boundary; source is not invented Wallet content. Measure attribution ledges from fixture projections on the approved common scale. Customer QR and acquisition QR use different fixture codes. No camera, pass issuance or notification delivery is simulated as native behavior.
**motion.** The Story rests for 1000ms. Its source marker remains fixed while a 450ms handoff replaces media with the signup. Hold the supplied September 8 signup replay for 1100ms. The zero-progress card arrives from 16px below over 320ms, followed by a 330ms hold. Show September 8's first visit for 800ms. Use three discrete date-labelled replacements across 1600ms for September 10, 13 and 16. The explicit September 17 example continuation takes 600ms. Complete the fifth app stroke in 220ms and reveal Reward ready in 140ms, then hold for the remainder of 1100ms. Finally, over 440ms, move the card aside and let the unchanged source marker become Jasmine's attribution heading; reveal the 4 / 3 / 1 ledges in 220ms. Rest. The QR and member identity never morph or change.
**product object.** /design-lab/story-loopday-01.jpg; Sara's approved historical fixture; coded member card and member QR; Jasmine's source object and attribution projections.

## User story

### recreate

Frames:
- Reference, the brief
- Creator version, a separate work object
- Submit, the actual preview surface
- Approved example, supported snapshot
- Earnings, approval relationship, not a bank payout

**Motion.** Use The work changes hands. This is object continuity, not a time-lapse of invented work. The still-based execution is intentional. A continuous-record reference/submission/approval sequence requires verified ownership and state snapshots; otherwise the approved example is explicitly separated and receives no borrowed amount.

Copy:
- Recreate
- Reference
- Creator version
- Submit
- Approved example
- Approval earns.
- Payout is separate.
- Open preview

Media:
- /design-lab/reference-loopday-01.jpg
- /design-lab/work-*.jpg, only the ownership-matched submission selected through its manifest
- /design-lab-v2/assets/*.jpg and their .jpg.json relationship manifests
- /uploads/seed/demo-latte.webp, only as its own supplied approved example

### post

Frames:
- Story creative, the deliverable
- Posting preview, the phone-sized task
- Post, supported handoff boundary
- Proof, requirement and submission surface
- Earnings, only after approval

**Motion.** The intact 9:16 creative moves from a freestanding media object into the coded posting viewport in 440ms. A proof surface then enters alongside it in 280ms while the creative remains identifiable. Do not draw a fake Instagram interface, synthesize a live timer or treat opening a handoff as proof of posting. A supplied approved record may resolve to its earnings state; otherwise the sequence ends at the approval requirement.

Copy:
- Post
- Post for 24 hours
- US$25
- On approval
- Creative
- Handoff preview
- Proof required
- Open preview

Media:
- /design-lab/story-loopday-01.jpg
- /uploads/seed/demo-story.jpg only in a separately identified Demo Roastery example
- /uploads/seed/tapmart-story.jpg only as an intact Preview photo, never extracted or offered for posting

### drive

Frames:
- Real car, campaign media
- Placement, supported zone plan
- Campaign, dates and obligations
- Monthly opportunity, approval basis

**Motion.** The actual campaign image opens into the car-specific detail surface. The placement diagram is an adjacent plan, not a fabricated wrap. Resolve to the fixture's monthly opportunity and its approval basis. No accepted offer, moving car or installation image causes an earnings update.

Copy:
- Drive
- US$300
- /month
- Monthly approval
- {car.city}
- {car.duration_short}
- Placement preview
- View campaign

Media:
- The vehicle/campaign image actually bound to the existing US$300/month User Home opportunity
- /design-lab/placement-rear-doors.svg where the opportunity's zone mapping supports it
- /uploads/seed/tapmart-car.jpg only as matched campaign media or separately labelled Campaign imagery
- /uploads/seed/demo-bmw.webp only with its own verified vehicle record

### get_paid

Frames:
- Approved work, the source
- Earnings, the ledger relationship
- Payout, a separate action

**Motion.** The approved work thumbnail stays attached to a clean ledger continuation. Show a financial amount only when a supplied authoritative fixture or clearly dated recorded snapshot supports it. The payout action opens its conditions; it never finishes as Paid merely because the film reached its last frame. No rolling digits or balance count-up.

Copy:
- Get paid
- Approval earns.
- Earnings
- Payout is separate.
- Payout details
- Recorded example

Media:
- /marketing/frames/earnings-390.webp or the actual matching earnings capture from the supplied capture inventory, after verifying the exact filename
- The approved work's own thumbnail
- Coded ledger and payout-detail objects, not a generated screenshot

## Business story

**chapters.**
- {"motion":"Maya's portrait remains still while one ownership-matched work sample expands beside it. Selecting View person opens the same portrait-and-work composition, not a database inspector. Request opens the existing request composer; it does not imply that Maya accepted.","object":"Maya's fixture portrait, her own work and the real coded person preview. Nora and Eli remain independently inspectable people, not duplicated background inventory.","copy":["Find people","Maya Chen","View person","Request"],"chapter":"find_people"}
- {"motion":"Eli's photograph opens horizontally into the placement inspection stage. The supplied rear-door diagram separates from the photograph as a clearly labelled plan. Its asking rate becomes attached to the selected zone, not to an imaginary full wrap.","object":"Eli's fixture vehicle, the verified rear-door placement diagram and the existing US$240/month asking-rate record.","copy":["Find cars","Eli’s car","Rear doors","US$240","/month","Asking rate","View"],"chapter":"find_cars"}
- {"motion":"Three physically different entry objects occupy one open composition: reference media, a tall Story creative and a wide vehicle image. Selecting one expands its actual campaign-creation preview. The other two recede through opacity, not a rotating carousel.","object":"Exactly three campaign types. Loyalty is not a fourth choice.","copy":["Create","Recreate a Reel","Instagram Story ads","Car advertising","Open preview"],"chapter":"create"}
- {"motion":"The selected work becomes the review object. A narrow review surface opens alongside it while the work remains large. Financial consequences appear at the approval decision. An approved example is a supplied snapshot, never a success generated by scrolling.","object":"An ownership-matched submission or proof record, its review state and the existing approval disclosure.","copy":["Review","Work","Proof","Business approval","Approval credits earnings.","Payout is separate."],"chapter":"review"}
- {"motion":"The review surface leaves; actual delivered shoot photographs spread onto the page at their natural proportions. Selecting a photograph opens the delivered asset. Scheduling and publishing appear only when supported by the fixture.","object":"Loopday's matched subscription content. This is visibly separate from campaign work and campaign approval.","copy":["Monthly content","Made for you","View content","Campaign spending is separate."],"chapter":"content"}
- {"motion":"The matched Story opens the source-preserving customer sequence. Its source marker survives signup, a distinct member card, dated visits, reward unlock and the final business attribution view.","object":"The approved Loopday Loyalty model, expressed through its customer objects rather than a dashboard introduction.","copy":["Loyalty","Attention","Customer","Return customer","Open loyalty preview"],"chapter":"loyalty"}

**loop.** {"frames":["Story creative, Jasmine","Trusted campaign link, Join Loopday","Customer signup, Sara","Distinct member card, 0 of 5","September 8, First visit","September 10, Came back","September 13, 3 of 5","September 16, 4 of 5","September 17 continuation, Reward ready","Business attribution, Jasmine, 4 joined, 3 came back, 1 redeemed"],"motion":"Use the approved dated replay, then add a final attribution resolution. The Story's source marker remains outside every customer and Wallet object. When the final card moves aside, that marker becomes the heading of Jasmine's measured attribution descent. The descent reveals existing values; it does not count up or pretend that Sara newly joined on September 17. Public playback stops at Reward ready. Redemption requires a deliberate action in the working Loyalty preview.","copy":["Attention","Customer","Return customer","Joined from Jasmine","Reward ready","4 Joined","3 Came back","1 Redeemed","Open loyalty preview"],"why_it_is_powerful":"The business can follow one known source through a real membership relationship and recorded returns. The product no longer ends when content is approved. The final attribution object answers who brought people back without claiming verified sales, revenue or causal lift. Moving Monthly Content before this closing loop changes the website's narrative order only; it does not merge subscriptions, campaigns and Loyalty."}


## Loyalty placement

**navigation.**
- Home, unchanged; a marketplace for people and cars, not an operational dashboard.
- Content, unchanged; subscription shoots, deliveries and publishing.
- Create, unchanged; the lime campaign action and exactly three advertising types.
- Campaigns, unchanged; campaign work, requests and review.
- Business, unchanged; brand identity and the permanent home of Loyalty.
- Desktop retains the 200px sidebar; tablet retains the 80px labelled rail. No sixth destination or permanently expanded Loyalty submenu.

**decision.** Keep Business → Loyalty as the permanent architecture. Loyalty is the business's ongoing member relationship, not a campaign type, account setting or separate Growth product. Business Profile places Loyalty as its first operational row beneath brand identity.

**discovery.** Keep the approved shallow Home strip after the complete lead person/car spread and before the lower people roster. On phone it follows the complete car action band. It remains at that position in every marketplace filter. Loyalty is one tap from this strip and one tap from Business Profile. From other Business destinations it is normally two taps through Business; do not describe it as universally one tap away. Once inside Loyalty, Add visit is immediately available. The public closing loop also opens Loyalty directly.

**reasoning.**
- Preserving the five destinations keeps acquisition, content, campaign work and business ownership distinct.
- A permanent sixth tab would compete with the marketplace and central campaign creation without improving the meaning of either.
- The Home strip provides discovery without placing retention metrics above Maya's face and Eli's vehicle.
- The strip remains an open, separated band with an artwork fragment, two counts and one quiet action. It is not upgraded into a glass promotional card.
- The Business destination stays selected on Loyalty routes. Desktop breadcrumb: Business / Loyalty.
- Keep the approved state-dependent primary actions: Create program, Continue setup, View QR, then Add visit or Add points.
- Do not add a global counter shortcut, notification badge or alternate navigation architecture in V3. A future change would require evidence that the preserved entry causes a daily operational problem.


## Settings architecture

**removed from visible ui.**
- Edit profile buttons, verification explanations, payout setup rows and account-management lists leave the shareable Profile.
- Private earnings do not appear in the public identity composition. Earnings remains the financial destination.
- Business Home has no billing summary, campaign-credit tile, connection recovery panel or brand-research status.
- No Loyalty row is added to general Settings. Reward, terms and card editing remain inside View program.
- No second gear appears on Loyalty, a vehicle, the content gallery or a customer card.
- Saved stays in Activity. Mode switching stays in the identity switcher. Sharing stays in Share.
- Google setup and brand research do not imply live integrations or approved brand changes.

**user.**
- Account, identity editing, portfolio management and Vehicles, including listing, placements and asking rates.
- Instagram and connections, factual connection states and manual-versus-API distinctions.
- Verification, current state and corrective actions.
- Payout, setup and payout-request history; balances and transactions remain in Earnings.
- Notifications
- Privacy, public visibility controls and the boundary around private earnings.
- Security
- Log out, confirmation; the lab never signs out production.

**business.**
- Account, the signed-in person's account.
- Business Details, the selected business's identity.
- Connections, supported connections with Connected, Not connected, Needs reconnect and Error.
- Google Business, preserve the approved separate row; no duplicate Google control inside Connections.
- Brand Kit, sources, research state, approved kit and separately labelled proposed refinements.
- Plan and Billing, subscription, invoices and a separate Campaign credit section.
- Team, retain the existing unavailable state with Later; do not fabricate working team management.
- Notifications
- Security
- Log out

**entry.** One Settings gear on the owner's User Profile and one on Business Profile: the same administrative entry pattern in each mode, never multiple entrances within a profile. The gear has a 44×44 target and the accessible name Settings. On phone it opens an opaque, full-height working sheet with a restrained material header; at desktop it opens a 480px right drawer. Rows are at least 56px high. Public profile mode has no gear. The approved list and ownership boundaries remain unchanged; unimplemented destinations open the existing Outside this preview notice.


## Surfaces

### public-home

**not a card.**
- The hero is a shared media stage with an audience control, not two audience cards.
- Recreate is a comparison and handoff surface, not a phone screenshot.
- Story is the creative itself inside a readable posting preview, not a mock phone inside another phone.
- Car is an open photographic inspection stage.
- Business discovery is an arranged portrait/work/vehicle spread, not a bento grid.
- The final proof is an open attribution descent. The Wallet pass is a genuine product-shaped exception, not a container template.

**hierarchy.**
- Phone: a 56px floating navigation bar inset 12px, followed by the compact lab and motion controls.
- The two audience names appear together before the hero object. Make money is the default lens.
- One large, matched reference object leads. Its amount and approval basis sit on an opaque adjacent reading surface. No introductory paragraph.
- Explore earning anchors to Recreate, Post, Drive and Get paid. Both worlds remain in the document.
- The business run follows: Find people, Find cars, Create, Review, Monthly content, Loyalty.
- Close on the source-preserving return loop and its attribution object, followed by one Open loyalty preview action.
- Terms, privacy, campaign rules, creator terms, plan information and media sources remain in a quiet footer or their relevant disclosures.
- At 1440, use a maximum 1376px public canvas. The hero object grows through composition, not giant type. At 1920 cap at 1600px; narrative stages remain at most 1280px wide.

**first question.** Can I make money here, or use people and cars to grow my business?

**truth.**
- This is a fictional coded product preview, not a functioning live marketplace or a record of new work being completed.
- The default hero uses the existing Loopday opportunity only after its media and amount mapping is verified. A public audience switch does not change account mode or the production session.
- All named people use their own fixture portraits and work. Jasmine has no invented portrait.
- A still is never given a play icon. The photographed Story phone remains a photograph, never a downloadable creative.
- Public playback uses a separate replay store and cannot alter working Loyalty counts.
- Unsupported earning transitions remain visibly labelled examples or unavailable proof beats. A missing approval or ledger relationship blocks approval of that wow moment; it is not repaired with an invented state.

**motion.**
- The first entrance reveals the media-to-money relationship once; it does not cycle campaign types or count money.
- The audience switch reorients the hero in 440ms while preserving the reference object's identity.
- Only the three required product sequences may use desktop scroll-linked stages. No wheel interception, mandatory dwell or mobile pinning.
- Every sequence has direct frame access, a stable final state and an unscaled working-preview entrance.

**two second read.** Two sides of one product: earn through real work, or choose people and cars for the business.

**visible strings.**
- TapMart
- Sign in
- Menu
- Make money
- Grow your business
- Design Lab · Fictional preview
- Pause motion
- US$75
- On approval
- Recreate this Reel
- Loopday Coffee
- Explore earning
- Open preview
- Recreate
- Reference
- Post
- Post for 24 hours
- US$25
- Creative
- Drive
- US$300
- /month
- Monthly approval
- {car.city}
- {car.duration_short}
- Get paid
- Approval earns.
- Payout is separate.
- Find people
- Maya Chen
- View person
- Request
- Find cars
- Eli’s car
- Rear doors
- US$240
- Asking rate
- View
- Create
- Recreate a Reel
- Instagram Story ads
- Car advertising
- Review
- Work
- Monthly content
- Made for you
- View content
- Campaign spending is separate.
- Loyalty
- Attention
- Jasmine
- Morning loop · Story campaign
- Join Loopday
- Design Lab · Simulated sequence
- Play sequence
- Previous
- Next
- Story
- Signup
- Reward
- Open loyalty preview
- Terms
- Privacy
- Creator terms
- Campaign rules
- Plan information
- Media sources

**on demand.**
- Grow your business changes the hero to an outgoing brief and inspectable candidate composition. Its additional strings are Campaign reference, Find people, Maya Chen, View person, Request and Explore business.
- The user_story and business_story inventories define later narrative labels; only the current frame is rendered as active content.
- Media sources opens ownership, provenance, specimen and state-snapshot notes.
- Requirements, fees, eligibility, rights and payout conditions appear at the relevant commitment preview, not as film captions.
- Sign in and unavailable destinations open explicit lab notices rather than production authentication.

**copy budget.** Hero under 20 meaningful words; complete default page target 260 to 360 words on phone. Measure inclusive controls and all alternate frames separately.

**physically different.** An open media composition becomes a brief, a portrait becomes selectable creative inventory, a wide car photograph becomes placement inventory, and a native-shaped member pass becomes a source-led attribution object. They share motion continuity and typography, not a common rectangle.


### user-home

**not a card.**
- No enclosing opportunity cards, shared shadows or repeated metadata footers.
- Recreate uses a large open reference surface with a short, attached brief edge.
- Story is an independent tall creative with a narrow opposing money/action rail.
- Car breaks into a full-width photographic field with a plain monthly-rate band beneath it.
- Money is type on an opaque reading surface, never a translucent badge.

**hierarchy.**
- Identity and utilities remain in the 56px header. The compact fictional context and visible Pause motion follow; Filter is the only discovery control.
- The leading Recreate reference and its amount must be visible together in the first viewport. Then title, business, actual spots and closing date, and one View action.
- Story follows as a different silhouette: at 390, a 238px-wide 9:16 creative beside a 104px information rail with a 16px gap. Required duration and follower threshold remain visible.
- Car follows as a broad image, monthly amount, city, duration and View. It may bleed to the phone edges; its text returns to the 16px datum.
- Four destinations remain Home, Activity, Earnings, Profile in a restrained floating material bar.
- At 1440, keep the 200px sidebar and 1176px content area, but replace the current shared-bottom-line triptych with staggered independent compositions: Recreate five columns, Story three, Car four. Their money remains immediately comparable without forcing equal media heights.
- At 320 and at text zoom, use one column with natural height. Do not clip requirements to preserve the composition.

**first question.** What can I earn from right now?

**truth.**
- The existing US$75, US$25 and US$300/month fixture values remain attached to their own records. They are opportunities, not earned balances.
- On approval and Monthly approval remain explicit. Gross-only amounts also require Before fee; the exact breakdown appears before commitment.
- Spots, closing dates, follower requirements, city and duration are bound values, not invented copy.
- Story posting is unavailable without a valid creative and supported handoff.
- Only a real urgent action or blocking financial issue earns the existing compact attention strip. It is not present by default.
- User Home has no earning-type tabs and no fake live arrival ticker.

**motion.**
- Opening media expands the same object into detail in 440ms. The reading surface opens from its attached edge rather than arriving as an unrelated generic modal.
- Story keeps its tall silhouette when opened; the surrounding task surface changes, not the creative's proportions.
- Car opens horizontally into its photo and supported placement information.
- Closing takes 280ms and restores the exact filter, scroll anchor and originating focus.
- The bottom material bar reveals real feed content moving beneath it. Opportunity media itself does not float or hover-zoom.

**two second read.** A large reference, US$75 on approval, one action. Two other visibly different ways to earn follow.

**visible strings.**
- Personal
- Design Lab · Fictional preview
- Pause motion
- Filter
- US$75
- On approval
- Recreate this Reel
- Loopday Coffee
- {recreate.remaining_spots} spots
- Closes {recreate.close_date_short}
- View
- US$25
- Post for 24 hours
- {story.minimum_followers}+ followers
- US$300
- /month
- Monthly approval
- Drive with this campaign
- {car.city}
- {car.duration_short}
- Home
- Activity
- Earnings
- Profile
- TapMart
- Search
- Messages
- Notifications

**on demand.**
- Filter opens For you, Nearby, Top pay and the optional kind selector; city is requested only when Nearby needs it.
- Detail reveals the actual numbered requirements, eligibility, dates and timezone, financial breakdown and material rights before any commitment.
- Direct requests retain their Accept / Decline banner and normal type-specific flow.
- Save belongs inside the object preview; saved work remains in Activity.
- Desktop utility labels are visible in the sidebar. Phone utilities use accessible icons rather than printing those labels beside each icon.

**copy budget.** 20 to 35 words in the first 390 viewport, target 28 to 33 including navigation and lab/motion controls. Initial three-record feed target 60 to 85.

**physically different.** Recreate is a broad reference-and-brief surface; Story is a freestanding vertical creative with a side rail; Car is a panoramic photographic field and monthly-rate strip. Their opening directions, proportions and interaction surfaces differ. None receives the same card shell.


### user-profile

**not a card.**
- Identity is composed directly on the page, not placed inside an account card.
- Work is an ownership-matched editorial gallery with mixed proportions, not uniform portfolio tiles.
- The vehicle is a smaller photographic contact sheet beneath work, not a competing hero card.
- Reputation is a short typographic fact, not a badge cluster or statistic grid.

**hierarchy.**
- Owner header: identity switcher, Share and the single Settings gear. Guest mode removes the administrative controls.
- A generous portrait leads. On phone use the intact portrait at a reviewed 4:5 presentation rather than the current tiny identity thumbnail.
- Name, TapMart handle and city follow on an opaque page surface. Connected Instagram appears only when actually connected.
- Show the fixture's 3 completed work items as a supported reputation fact. Rating or public achievements appear only when records support them.
- Work begins immediately after identity. No account-readiness rows intervene.
- Maya's smaller real vehicle presentation follows the work, with its actual listing state and one View action.
- At 1440, identity occupies four columns and work eight. The vehicle stays beneath the work. Do not enlarge private statistics to fill the left column.

**first question.** Who is this person, and would I want their work associated with my business?

**truth.**
- The default owner route presents the same public identity composition a person would share. Private earnings, including the existing US$420 example, are not printed into that composition.
- The TapMart handle is not proof of an Instagram connection. The supplied disconnected state must not become a connected Instagram icon.
- Missing rating means no rating object. Missing achievements mean no invented badges.
- Only Maya's own work and vehicle appear.
- Share opens or copies the isolated public-profile preview, not an unimplemented production profile URL.

**motion.**
- A work selection expands the same media in 440ms; the portrait stays anchored as identity.
- Share opens an opaque, readable sharing sheet without capturing owner-only controls.
- The vehicle opens a real image gallery or supported placement preview. No introductory rotation is applied to the photograph.
- There is no portrait parallax, reputation count-up or decorative verified pulse.

**two second read.** Maya, her work, her reputation and her car. This is an identity someone can share, not their account settings.

**visible strings.**
- Personal
- Design Lab · Fictional preview
- Pause motion
- Maya Chen
- @maya.tapmart_demo
- Austin
- 3
- Completed
- Work
- Maya’s car
- Listed for ads
- View
- Home
- Activity
- Earnings
- Profile
- TapMart
- Search
- Messages
- Notifications

**on demand.**
- Share opens /design-lab-v3/profile?view=public with owner administration removed.
- Work detail reveals its actual campaign context and any supported review.
- Settings contains Instagram not connected, payout readiness, identity editing, verification and vehicle management.
- A connected Instagram record adds its real linked identity; the default disconnected fixture does not.
- A future production migration would decide canonical public URLs and privacy defaults separately.

**copy budget.** 20 to 30 words in the first 390 viewport. No financial or readiness labels are added to fill the target.

**physically different.** A person-sized portrait, mixed-format authored work and a quieter vehicle contact sheet create three different scales of identity. The only floating material is functional navigation or an active viewer control.


### business-home

**not a card.**
- Maya's portrait and work form one open selection spread, not a bordered creator card.
- Eli's car occupies an independent wide photographic composition.
- The Loyalty entry stays a separator-defined strip with no shadow or enclosing background.
- The lower roster contains real additional people, not duplicated cards used to complete a grid.

**hierarchy.**
- Active business identity and utilities, compact lab/motion controls, city and For you / People / Cars / Nearby.
- Maya leads on phone: a substantial portrait beside two smaller ownership-matched work crops. Her name, supported identity and View person / Request follow.
- Eli's car follows with US$240/month, Rear doors, Asking rate and View.
- The Loyalty strip comes after the complete car action band: artwork fragment, Loyalty, 10 members · 6 came back, Open loyalty.
- Nora and the finite continuation follow. Keep the approved initial record scope.
- At 1440, Maya's portrait/work spread occupies eight columns and Eli's vehicle four. The full-width Loyalty strip sits below both action bands and above the lower roster.
- The five-destination Business navigation remains unchanged.

**first question.** Who or what can grow my business?

**truth.**
- Faces, authored work, connected identities and vehicle rates come from their own fixture records.
- The US$240 rate is an asking rate for Rear doors, not a full-wrap price or guaranteed campaign earning.
- Loyalty's 10 members and 6 came back are projections from the approved local event model.
- Selecting Maya does not assign her to a campaign. Sending, accepting and approving remain distinct boundaries.
- Existing attention counts appear only when backed by the current fixture; they are not decorative marketing badges.
- No plan, shoot, revenue or growth metric is invented to fill space.

**motion.**
- View person opens the portrait and selected work in one continuous 440ms expansion.
- Request opens a focused working sheet while retaining the person's identity. The final live send boundary remains explicit.
- The car uses One part of a real car, not a generic person-detail transition.
- The Loyalty strip is stationary. It does not pulse or advertise itself above the marketplace.
- Return restores the exact person, vehicle, filter and scroll position.

**two second read.** Choose Maya's creative work or a real placement on Eli's car. Loyalty is available after discovery, not instead of it.

**visible strings.**
- Loopday Coffee
- Design Lab · Fictional preview
- Pause motion
- Austin
- For you
- People
- Cars
- Nearby
- Maya Chen
- {maya.connected_instagram_handle}
- View person
- Request
- Eli’s car
- US$240
- /month
- Rear doors
- Asking rate
- View
- Loyalty
- 10 members · 6 came back
- Open loyalty
- Nora Vale
- {nora.connected_instagram_handle}
- Eli Moss
- Round Rock
- {eli.connected_instagram_handle}
- More
- Home
- Content
- Create
- Campaigns
- Business
- TapMart
- Create campaign
- Search
- Messages
- Notifications
- {actual_content_attention_count}
- {actual_campaign_review_count}

**on demand.**
- Connected-handle bindings are absent when no real connected fixture state exists; they never print placeholder handles.
- Person preview reveals real eligibility, completed work and reviews, then the Story or Recreate request composer.
- Request recording reaches the review/commit boundary. No Request sent or Accepted state is fabricated for the film.
- Vehicle preview reveals supported zones, the rate's scope and the offer requirements.
- No-program, draft and live-zero Loyalty strip states retain the approved copy and insertion point.
- Business opens the supporting brand profile with Loyalty as its first operational row and Settings in the corner.

**copy budget.** 20 to 35 words in the first phone viewport. The complete initial inventory, including Loyalty, targets 65 to 90 phone words.

**physically different.** People are portrait-and-work spreads; cars are wide inspectable photographic inventory; Loyalty is a shallow operational strip. Only active task surfaces receive material depth.


### business-loyalty

**not a card.**
- The four counts remain directly on the page, with no statistic tiles.
- Recent customers remain simple operable rows, without portraits or CRM metadata.
- The program is its actual artwork and rule, not a miniature dashboard.
- Attribution is a measured open descent, not a chart inside a glass panel.
- The native-shaped Wallet concept is opaque branded material. The surrounding inspector may use glass; the pass itself does not.

**hierarchy.**
- Header: Back to Business, Loyalty and the state-dependent primary action. The live member fixture leads with Add visit.
- Four unboxed counts in the approved order: Members, Repeat visitors, Rewards ready, Rewards redeemed. Phone uses a generous two-by-two alignment; desktop uses one row.
- Recent customers: June, Ben, Imani, with compact progress. Keep all three.
- Program artwork, Free coffee, 5 visits, Live and View program.
- Joined from: Jasmine's common-scale 4 Joined / 3 Came back / 1 Redeemed descent and View attribution.
- Quiet actions: View QR, Members, Send update.
- At 1440, recent customers occupy eight columns and the program four; attribution spans the next row. Keep the 1176px area and 1280px large-screen cap.
- Counter, creation and signup remain focused task surfaces. They can cover app navigation while retaining Back and Close.

**first question.** Who has joined, who came back, and can I count the next visit immediately?

**truth.**
- Preserve the entire approved model: first known source, campaign and creator identity, members, visits and points, versioned rewards, earned instances, redemption, QR distinctions, Wallet concepts, privacy, aggregate attribution and event history.
- Default counts remain 10 Members, 6 Repeat visitors, 1 Rewards ready and 2 Rewards redeemed. They are projections, not separately authored display numbers.
- The lab clock stays September 17, 2026, 10:00 AM CDT. Same-day qualification uses America/Chicago. No hidden animation advances a day.
- Sara's qualifying fifth visit yields counts 10, 6, 2, 2. Deliberate redemption yields 10, 6, 1, 3 and Jasmine 4 Joined, 3 Came back, 2 Redeemed.
- Home redemption totals count reward instances/events; source Redeemed counts unique members. Never merge these measures.
- Keep one counted qualifying purchase per business day, fixed one-point awards in the points scenario, idempotency, uncounted attempts and retained extra progress.
- Preserve the approved Wallet research and its source-access limitations. This direction makes no new claim that 2026 platform behavior has been verified.

**motion.**
- The counter surface opens in 320ms, with the member action usable immediately after fixture recognition.
- Only the newly confirmed app progress stroke fills, over 220ms. Wallet values crossfade as whole values in 120ms.
- Reward ready appears in the existing action area, with Redeem available immediately. Identity and QR stay fixed.
- Redemption consumes the specific earned instance after confirmation and preserves unrelated progress.
- Same-day attempts do not animate progress, update Wallet content or reorder Recent customers.
- The active counter header can be a material lip over scrolling task content. Counts, member rows and attribution never receive glass.

**two second read.** Ten members. Six returned. One reward is ready. Count the next visit.

**visible strings.**
- Loyalty
- Design Lab · Fictional preview
- Pause motion
- Add visit
- 10
- Members
- 6
- Repeat visitors
- 1
- Rewards ready
- 2
- Rewards redeemed
- Recent customers
- Visits
- June
- 0 / 5
- Ben
- 1 / 5
- Imani
- 2 / 5
- Free coffee
- 5 visits
- Live
- View program
- Joined from
- Jasmine
- Story campaign
- 4 Joined
- 3 Came back
- 1 Redeemed
- View attribution
- View QR
- Send update
- Home
- Content
- Create
- Campaigns
- Business
- TapMart
- Loopday Coffee
- Create campaign
- Search
- Messages
- Notifications

**on demand.**
- Count definitions and their existing filtered member or redemption views.
- The full approved five-step program wizard, contextual reward/card editing and fixed program type after launch.
- Counter Scan/Search, explicit Scanner simulation, masked contact, same-day, unknown-code and retry behavior.
- Source detail, immutable first touch, later trustworthy touches, counted and uncounted event history.
- Distinct counter acquisition QR and opaque member QR; short signup with first name, one contact and the approved agreement.
- Separate Apple and Google concepts with adjacent simulation labels, no contact details on the pass and no front Redeem button.
- The approved Wallet update composer and history, daily business-message allowance and conservative Google notification-request cap; no delivery or read claims.
- No-program, draft, live-zero, points, Wallet-not-added and failure scenarios remain selectable through Design Lab.

**copy budget.** 38 to 48 words in the first 390 viewport. This tool earns a slightly larger budget than discovery; labels and counter clarity take priority over a prettier count.

**physically different.** Unboxed overview numbers, lightweight customer rows, a branded program object, a native-shaped pass, a focused counter surface and open attribution ledges each have a distinct physical purpose. They are not reskinned instances of one dashboard card.


## Recordings

- docs/design-lab-v3/recordings/01-hero-{390,1440}.webm, /design-lab-v3. Record first render, media-to-money reveal and final rest. Prove that the real reference and approval basis are readable without a paragraph. Companion still: hero-1440.png.
- docs/design-lab-v3/recordings/02-audience-switch-{390,1440}.webm, /design-lab-v3?audience=earn and ?audience=business. Record both directions, focus, the preserved reference, incoming candidate identity, changed action and browser Back. Prove that both stories remain on one page.
- docs/design-lab-v3/recordings/03-recreate-{390,1440}.webm, /design-lab-v3#recreate. Record comparison, submission preview, supported approval example, earnings relationship and Replay. Include the state/provenance disclosure in a separate take.
- docs/design-lab-v3/recordings/04-story-{390,1440}.webm, /design-lab-v3#post. Record intact creative, coded posting viewport, explicit handoff boundary, proof surface and approval condition. Prove that no native Instagram success is invented.
- docs/design-lab-v3/recordings/05-car-wow-{390,1440}.webm, /design-lab-v3#find-cars. Record the whole vehicle, separate rear-door plan, US$240/month asking-rate scope and return. Prove that no new wrap or fake rotation appears.
- docs/design-lab-v3/recordings/06-business-discovery-{390,1440}.webm, /design-lab-v3/business. Record Maya, her work, Eli's car, the Loyalty strip, lower roster and People/Cars filters. Prove the strip's consistent insertion point and marketplace-first hierarchy.
- docs/design-lab-v3/recordings/07-business-loyalty-loop-{390,1440}.webm, /design-lab-v3#loyalty. Record Story, trusted source, signup replay, zero-progress member card, dated returns, reward ready and final 4/3/1 source descent. Open the working Loyalty preview afterward and prove that public playback did not mutate its baseline.
- docs/design-lab-v3/recordings/08-user-opportunity-return-{390,1440}.webm, /design-lab-v3/home and its opportunity query state. Record View, the same media expanding, requirements, financial boundary, Close and browser Back. Prove restored scroll, filter and focus.
- docs/design-lab-v3/recordings/09-creator-request-{390,1440}.webm, /design-lab-v3/business and its person/request query states. Record Maya's expansion, work inspection, Request, type selection and the review/commit boundary. Do not cut to fabricated Request sent or Accepted.
- docs/design-lab-v3/recordings/10-vehicle-offer-{390,1440}.webm, /design-lab-v3/business and its vehicle/zone query states. Record zone inspection, asking-rate scope, offer requirements and return. A photograph must never expose rotation controls.
- docs/design-lab-v3/recordings/11-profile-share-settings-{390,1440}.webm, /design-lab-v3/profile, ?view=public and the settings overlay. Record identity, work, vehicle, guest share view and the single gear. Prove private earnings and account administration are absent from the shared view.
- docs/design-lab-v3/recordings/12-loyalty-placement-{390,1440}.webm, /design-lab-v3/business → /design-lab-v3/business/profile → /design-lab-v3/business/loyalty. Record both entry paths and the unchanged primary navigation.
- docs/design-lab-v3/recordings/13-create-program-{390,1440}.webm, /design-lab-v3/business/loyalty/create?step=program|reward|card|signup|launch in the explicit No program scenario. Record validation, Visits/Points, distinct platform previews, draft behavior and Launch demo program with zero members.
- docs/design-lab-v3/recordings/14-qr-signup-wallet-{390,1440}.webm, /design-lab-v3/business/loyalty/qr, /design-lab-v3/join/loopday-jasmine-story and /design-lab-v3/card/:memberCode?platform=apple|google. Record acquisition QR, short signup, unchecked agreement, distinct member QR, simulated saves and both platform concepts. Keep simulation labels in frame.
- docs/design-lab-v3/recordings/15-visit-unlock-redeem-{390,1440}.webm, /design-lab-v3/business/loyalty/record and Sara's member route. Record labelled scan simulation, Sara at 4/5, one deliberate +1 visit, ready reward, unchanged QR, confirmation and redemption. Prove counts 10/6/1/2 → 10/6/2/2 → 10/6/1/3 and Jasmine 4/3/1 → 4/3/2.
- docs/design-lab-v3/recordings/16-counter-exceptions-390.webm, the approved same-day, points 82/100, points 99/100, Wallet-not-added and recording-error scenarios. Record unchanged same-day progress, one-point awards, unlock, retained retry state and no false Wallet update.
- docs/design-lab-v3/recordings/17-attribution-privacy-{390,1440}.webm, /design-lab-v3/business/loyalty/attribution and source/member drill-downs. Record common-scale ledges, unique-member definitions, masked contacts, first touch and event history. No creator customer access.
- docs/design-lab-v3/recordings/18-wallet-updates-390.webm, /design-lab-v3/business/loyalty/updates/new. Record platform-specific preview, the daily allowance, Simulate update, Nothing was sent and the limit-reached scenario. Never show Delivered or Read.
- docs/design-lab-v3/recordings/19-reduced-motion-{390,1440}.webm, repeat hero, all three wow moments, opportunity opening and visit-to-reward with prefers-reduced-motion. Prove complete information without pinned stages or animation.
- docs/design-lab-v3/recordings/20-pause-keyboard-back-390.webm, public and app routes. Record visible Pause motion, keyboard-equivalent controls, focus restoration and browser Back. These are actual browser recordings of React/CSS, not edited motion mockups.

## Text budgets

- {"target_words":"Under 20 meaningful words; target 15 to 18","surface":"Public hero","rule":"Count the two audience names, active proposition, amount, basis and identity. Report navigation, actions and the lab/motion controls separately as well as in the inclusive total. No supporting paragraph.","viewport":"390×844 and 1440×900"}
- {"target_words":"Under 25 act-local words across each act's visible labels","surface":"Public Recreate, Post, Drive and Get paid","rule":"The user_story copy is the act-local inventory. Shared page controls are counted separately and again in the rendered inclusive count. Expanded requirements and financial disclosures have their own measured state; they are not shortened to fit a film caption.","viewport":"Every narrative frame at 390 and 1440"}
- {"target_words":"12 to 24 per chapter; 24 to 38 in the final attribution frame","surface":"Public business story","rule":"A verb, a product object and its necessary labels. Source identity, monetary basis and simulation labels are not expendable. No paragraph explaining a scene that the scene should explain.","viewport":"Each chapter's default state"}
- {"target_words":"260 to 360 phone; 280 to 390 desktop","surface":"Complete public homepage","rule":"Pressure targets for the complete default document after entrance reveals, including visible controls and repeated truth labels. Report actual page height and separate totals for alternate narrative frames. Do not hide content merely to report the first frame's lower count.","viewport":"390 full page and 1440 full page"}
- {"target_words":"20 to 35; target 28 to 33","surface":"User Home first viewport","rule":"Include identity, lab context, Pause motion, Filter, the leading opportunity's money and basis, business, spots, closing date, action and four navigation labels.","viewport":"390×844"}
- {"target_words":"60 to 85 phone; 65 to 90 desktop","surface":"User Home initial three opportunities","rule":"Count actual bound requirements. No duplicate kind label plus title plus explanation. Longer legitimate business names or requirements may exceed the target and must be reported.","viewport":"390 full initial feed and 1440×900"}
- {"target_words":"20 to 30 phone; 25 to 40 desktop","surface":"User Profile first viewport","rule":"Identity, supported reputation, work and vehicle only. Private earnings and administration are not removed for counting convenience; they deliberately belong outside the shareable surface.","viewport":"390×844 and 1440×900"}
- {"target_words":"20 to 35; target 27 to 33","surface":"Business Home first viewport","rule":"Faces and work lead. Include filters, visible identity, person actions and primary navigation. Do not move Loyalty above discovery to make it appear in this count.","viewport":"390×844"}
- {"target_words":"65 to 90 phone; 80 to 110 desktop","surface":"Business Home initial inventory","rule":"Includes the Loyalty strip and the finite real fixture roster. Desktop has more visible inventory, not smaller labels.","viewport":"390 full initial feed and 1440×900"}
- {"target_words":"38 to 48 phone; 65 to 85 desktop","surface":"Business Loyalty first viewport","rule":"The four count definitions and recent customer progress earn their words. Keep all three recent rows. Do not compress the screen into unexplained numerals to force a marketplace budget onto a counter tool.","viewport":"390×844 and 1440×900"}
- {"target_words":"18 to 32 for recognition; 25 to 45 for unlock or redemption confirmation","surface":"Loyalty counter","rule":"Include Scanner simulation, No camera is used, progress, action and the local result. Required redemption consequences remain visible.","viewport":"390×844"}
- {"target_words":"Content-led; no artificial cap","surface":"Commitment, signup, terms, errors and settings","rule":"Use 16px readable text and short groups. Consent, financial consequences, counting rules, contact use and errors never disappear behind a word budget.","viewport":"320 to 1920 and 200% text zoom"}
- {"target_words":"Measured, never asserted from this specification","surface":"Counting protocol","rule":"Claude Code counts rendered visible text nodes after fonts and images settle, then manually audits lettering inside media. Count repeated visible occurrences, navigation, controls, amounts and notices; exclude inaccessible or hidden copies. Brace expressions in the surface inventories are data bindings, never literal UI. Resolve them before measuring. Record default, expanded, error and reduced-motion states separately.","viewport":"All required capture sizes"}

## What not to build

- Do not preserve the current captures' composition merely because it exists. They are functionality inventory, not visual approval.
- No production migration, production routes, live database, production session changes, notification delivery or real Wallet integration. Keep all work under /design-lab-v3 and its supporting V3 files; leave V2 untouched.
- No headline, paragraph, screenshot repetition, feature-card grid, generic bento layout or endless mock-phone gallery.
- No blanket glass, blurred content panels, translucent money labels, glossy metric tiles or full-screen backdrop-filter.
- No random gradients, AI purple, neon treatments, floating blobs, ambient clouds, metallic headline imitation or decorative 3D.
- No fake video controls on stills, perspective extraction from the photographed Story phone, generated portraits, generated replacement media or invented vehicle views.
- No photo rotation pretending to be 3D, background removal pretending to be a reconstructed car, or a new advertising wrap painted onto Eli's photograph.
- No fabricated reference/submission pairing, borrowed campaign price, fake approved state, fake payout, optimistic balance credit or timer-driven request acceptance.
- No fabricated followers, ratings, completed-work counts, source performance, revenue, ROI, customer value, conversion percentage or live activity.
- No sixth Business destination, Growth hub, Loyalty campaign type or central Create menu containing Loyalty.
- No redesign of the approved Loyalty logic. Preserve first touch, deduplication, versioned rewards, earned instances, extra progress, same-day rules, idempotency, QR distinctions, privacy and history.
- No CRM, contact export, unverified card recovery, creator-visible member list, per-customer marketing, SMS, email or customer-app push.
- No tiers, streaks, birthdays, points expiry, arbitrary point editing, complex coupons, POS, receipt scanning, NFC or Smart Tap.
- No native Wallet save sheet, issued-pass state, APNs behavior, Google API request or guaranteed notification appearance. Preserve the approved platform distinctions and research limitations.
- No automatic consent, signup, visit, redemption or day advancement through scrolling. Public replay and working fixture state remain separate.
- No mobile scroll pinning, wheel interception, mandatory animation waits, autoplay carousel or hover-only product access.
- No hiding obligations, errors or truth labels to meet a word count; no shrinking essential type to fit a screenshot.
- No ending the package with fixes applied after Astra review. Final fixes require a final review, then the package stops and waits for human approval.

## Self critique

- This could still become Open Cut with frosted navigation. The prevention rule is structural: the hero must change viewpoint around one brief, each earning type must open differently, and the three named handoffs must work as coded interactions. A palette and radius pass alone fails V3.
- This could become a cinematic prototype that lies about money. Every media relationship, state and amount must have a manifest or supplied record. The approved latte still cannot borrow Loopday's price. Missing evidence blocks that proof beat and its verdict; it never authorizes a plausible substitute.
- The car moment could become an expensive photograph zoom. Its success criterion is whether a visitor understands the specific placement and asking-rate scope afterward. If not, improve the plan-to-rate relationship, not the camera movement.
- The two-world hero could become a hidden second homepage. Both names remain visible, both stories remain in the same document, and changing the hero lens never removes the other world or switches the signed-in account.
- Glass could become decorative noise or illegible white-on-photo UI. Enforce the active-layer and blur-area budgets, opaque reading backing, contrast checks and no-glass content rules. An attractive screenshot is insufficient if scrolling exposes unreadable states.
- Profile could slide back into account administration. Review it in guest mode first. If it is not something Maya would share, remove administration rather than embellishing it.
- Business Home could slide back into CRM. Its first view must still be Maya's face and work. Loyalty remains after the car and underneath Business ownership, never a four-metric takeover.
- The Loyalty film could imply a signup is a sale or inflate returns. Show distinct named days, retain first touch, and reconcile every final projection. Sara is already a repeat visitor at the September 17 baseline; her fifth visit cannot increase the repeat count.
- Performance is an approval gate, not a footnote. Record actual device/browser and network conditions. Targets: mobile initial route media at or below 350KB where source quality permits, no more than one active video decoder, no continuous idle animation, LCP at or below 2.5 seconds, CLS at or below 0.1, and measured interaction-to-next-paint at or below 200ms for the recorded tasks. Report animation frame timings and long tasks on named test hardware; do not present targets as results.
- The evidence package must index all 36 requested items in docs/design-lab-v3/REPORT.md. Include the supplied Artec retrieval proof and limitations; full 390/1440 homepage captures; hero still; all five surfaces at both sizes; creation, Wallet, QR and attribution captures; architecture, settings and material documentation; actual word counts; recordings; performance and reduced-motion results; and production-migration boundaries.
- Use docs/design-lab-v3/MEDIA_MANIFEST.json for exact source ownership, crop and state bindings; EXPERIENCE_DIRECTION.md for this direction; MATERIAL_SYSTEM.md, TEXT_COUNTS.md and PERFORMANCE.md for implementation evidence. Preserve LOYALTY_ARCHITECTURE.md, WALLET_RESEARCH.md, PRIVACY.md and MVP_VS_LATER.md. FILE_MAP.md must list actual implemented routes and exact files after repository inspection, not guessed paths.
- Test 320×568, 390×844, 768×1024, 1023×900, 1440×900 and 1920×1080, keyboard operation, browser Back, 200% text zoom, reduced motion, transparent-material fallback and the approved error scenarios.
- Final Astra review must answer all nine experience questions for each primary surface, after the last fixes. This response approves the direction for an isolated build, not the finished implementation. No capture, recording, performance result or final quality verdict is claimed here. When the evidence is complete and reviewed, stop for human approval.
