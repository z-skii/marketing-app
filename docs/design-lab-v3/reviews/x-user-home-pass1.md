# V3 experience review: User Home, pass 1

Reviewer: Astra. Verdict: **fix**. Captures: user-home-m.png, user-home-m-full.png, user-home-d.png, user-home-d-full.png, 08-opportunity-open-return-m-strip.png, 08-opportunity-open-return-d-strip.png, home-open-m.png, home-open-story-m.png, home-open-car-m.png, home-filter-m.png.

**Two second read.** A coffee reference. US$75 on approval. View. This clearly answers what I can earn from right now.

## The nine questions

- Would someone keep scrolling? **YES**. The pouring reference earns attention, and the tall Story followed by the wide car changes the browsing rhythm. Exactly three opportunities feels deliberate rather than padded.
- Does motion reveal the product? **PARTLY**. The strips establish opportunity-to-requirements and return, but do not establish a convincing continuous handoff. Recreate opens to a crop that removes the cup, the very object the brief asks someone to recreate. Transition timing, focus and exact anchor restoration remain unproven.
- Is this more desirable than production? **PARTLY**. The generous reference and distinct opportunity silhouettes are promising improvements over the described production inventory. No production comparison capture is supplied, so a definitive comparative approval is not supported.
- Is the hierarchy instantly understood? **YES**. Reference, US$75, On approval and View read clearly together on phone. Desktop exposes all three amounts and actions without forcing equal image heights.
- Does this feel like a consumer product? **YES**. Media leads, navigation is restrained, and details reveal practical tasks rather than dashboard metrics. The repeated white reading blocks still retain some directory-like scaffolding.
- Does the Business side justify paying? **PARTLY**. Not assessed by these Personal Home captures. Do not add Business metrics or sales copy here to satisfy this question.
- Does Loyalty strengthen the story? **PARTLY**. Not assessed by this evidence. Its absence from Personal Home is correct; the Business and public closing-loop reviews must answer this.
- Are we actually at the quality benchmark? **NO**. The resting phone composition is strong, but the broken reference inspection crop, cramped Story rail, unresolved fixture claims and insufficient motion evidence prevent benchmark approval.
- Are there at least three memorable product moments? **NO**. Three distinct browsing objects are visible, not three demonstrated product moments. This surface explicitly requires no standalone wow sequence; the three required moments belong to the wider experience.

## Scores

- business justifies paying: 0
- slop risk: 2
- text discipline: 8
- memorable moments: 4
- material quality: 6
- loyalty strengthens: 0
- keep scrolling: 8
- at benchmark: 5
- truthfulness: 5
- more desirable than production: 6
- motion reveals product: 4
- hierarchy instant: 8
- consumer product: 8

## Wow moments seen

- The phone feed changes from a substantial pouring reference to an intact tall Story, then to a full-width vehicle photograph. This is a memorable browsing composition, not a demonstrated workflow wow moment.

## Material read

Real photography and opaque reading surfaces do most of the work. Glass is confined to the functional phone navigation, where the dark Story visibly passes beneath it; this is not blanket cheap glassmorphism. The broad white reading blocks and conspicuous navigation highlight still feel more like styled UI than fully resolved physical material. Refraction or motion quality cannot be established from these strips.

## Word count read

Reported browser totals are 29 words in the phone first viewport, 58 across the phone page and 62 on desktop. The first viewport comfortably meets the 35-word ceiling. Full-page totals are below the pressure ranges, which is not a reason to add copy. Manually audit the five embedded words in “Take a coffee break.” plus all visible labels and badge counts before calling these inclusive totals. Detail states appropriately spend more words on real obligations; they need separate measurements, not compression.

## Spec drift

- Phone Recreate detail crops out the finished drink instead of containing the reference.
- The desktop detail strip presents the reference as an unusually narrow, tall image rather than a confidently proportioned inspection object.
- Story money is visibly smaller on desktop than the specified 44px opportunity scale.
- Phone reading-band text is inset beyond the specified x16 datum.
- Story detail displays a connected Instagram identity despite the direction's approved default disconnected state.
- Vehicle example is visible in discovery but absent from the shown Car detail.

## Spec was wrong

- The prescribed 104px Story rail did not adequately account for internal padding around 36px currency. Use the full rail width and a stacking fallback rather than protecting the silhouette at the expense of fit.
- The desktop instruction to give every opportunity an opaque reading pedestal produces more repeated white-box scaffolding than intended. Keep opaque monetary reading areas, but reduce their panel-like extent.
- The 448px phone reference leaves only a thin Story teaser beneath navigation. That is acceptable for the first-opportunity hierarchy, but the spec overstated how strongly the first viewport alone would invite the next scroll.

## Fixes

- 1. **Recreate detail on phone and desktop; opportunity opening and return.** Contain the complete Recreate reference within the phone detail's maximum 360px media stage. Preserve the pitcher, pour and cup together. On desktop, preserve the source aspect ratio rather than the extremely narrow, tall presentation visible in the strip. Carry the same registered image through opening and return without stretching or switching to a top-only crop. Why: Inspection currently reveals less useful information than discovery. The cup disappears on phone, breaking the media-to-task relationship.
- 1. **Story detail, Car feed/detail/viewer, Activity badge and MEDIA_MANIFEST.json.** Reconcile connection, eligibility and media claims with the authoritative fixtures. The default Story detail must show the approved disconnected state unless an explicitly selected, documented connected scenario supports this capture. Verify the vehicle eligibility, rear-door requirement, zero installation/removal costs and Activity count. Keep the Vehicle example qualification visible in detail and the original-image viewer; a label must not substitute for the required opportunity/media binding. Why: The visible Instagram connected @maya.open.cut.demo conflicts with the direction's default disconnected identity. Other consequential claims cannot be approved from pixels alone, and the car's example qualification disappears on opening.
- 2. **Story discovery rail at 390 and responsive variants; desktop Story reading surface.** Remove the Story rail's internal horizontal inset so its complete 104px width is usable. Keep US$25 on one line at 36px, with approval basis below and a full-width 44px-high View action. At narrower widths or text zoom, stack the reading surface below the intact creative rather than allowing overflow. On desktop restore the specified 44px Story money scale and let the action occupy its own row if needed. Why: The phone amount runs to the edge of its white rail, while desktop demotes it relative to the other opportunities. The composition should create contrast through silhouette, not cramped or smaller money.
- 2. **Phone earning bands and all three desktop reading surfaces.** Align phone Recreate and Car reading text to the x16 page datum instead of adding another 16px inset inside their bands. Reduce the boxed appearance of the three desktop reading surfaces: retain opaque money backing, but remove surplus panel padding and let the facts attach directly to their own media composition. Why: The current extra inset and repeated white rectangles make these read more like card footers than open earning edges. This is a refinement of the existing structure, not a new layout.
- 2. **Opportunity detail money and utility area, especially Car at 390.** Give View image and Save a stable utility row with 44px targets. In Car detail, keep View image on one line rather than squeezing it beside the amount/basis column. Keep the monthly basis immediately adjacent to US$300. Why: The wrapped Car utility label is an avoidable loss of finish and suggests the detail layout has not been resolved independently for this type.
- 2. **Recordings 08, Story/Car companion takes, 19 and 20.** Capture actual opening midpoints and complete task inspection for all three types, followed by Close and a separate browser-Back take. Demonstrate filtered return, source-relative scroll restoration, originating focus and immediate controls. Include reduced motion, pause during opening and the uncropped image viewer. Why: The supplied strips show useful endpoints but mostly repeat settled states. They do not prove the specified media continuity or the return contract.
- 3. **Phone navigation, material fallback evidence and TEXT_COUNTS.md.** Audit navigation contrast while both dark Story media and bright content pass underneath. Increase the opaque reading backing if inactive labels fail contrast, and supply the opaque fallback capture. Recount visible text with embedded creative lettering, example labels and the Activity count included; record actual page heights and alternate-state totals. Why: The lens is appropriately rationed, but dark-content frames weaken inactive-label contrast. The supplied browser totals do not establish that lettering inside the Story image was manually counted.

## Keep

- The large, source-identifiable pouring reference and adjacent approval basis.
- Exactly three opportunities with different media proportions.
- The intact Story creative without a phone bezel or fake playback controls.
- The complete car photograph, monthly amount and separate approval basis.
- The 200px desktop sidebar and staggered media heights.
- The opaque, readable filter sheet and explicit fictional-preview context.
- Requirements, deadlines, payment and rights appearing inside the task rather than being crowded into discovery.

## Remaining risks

- Scores use a 0 to 10 scale; higher is better except slop_risk. Business and Loyalty scores of 0 mean unassessed here, not failed products.
- Media ownership, authoritative zero-fee payment values, connection state and vehicle eligibility remain unverified in this evidence package.
- No supplied evidence establishes keyboard trapping, exact focus restoration, reduced-motion behavior, 200% text zoom or narrow-screen error handling.
- Performance, media bytes, frame timing, contrast measurements and transparent-material fallback are not supplied.
- Full mobile commitment boundaries and Story/Car payment disclosures are not visible in these captures.
- After fixes, recapture and submit a final review. This pass does not approve the surface for human sign-off.

## Why better than production

The strongest improvement is structural: media has room to create desire, the earning basis is immediate, and the three opportunity types no longer share one silhouette. That is a credible advance over the described inventory treatment, but production comparison and finished interaction evidence are still required.
