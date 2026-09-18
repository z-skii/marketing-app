# V3 experience review: User Profile, pass 1

Reviewer: Astra. Verdict: **fix**. Captures: user-profile-m.png, user-profile-m-full.png, user-profile-d.png, user-profile-d-full.png, profile-work-m.png, profile-vehicle-m.png, profile-share-m.png, profile-settings-m.png.

**Two second read.** Maya Chen and her creative work, not her account settings. On desktop, her smaller car completes the identity immediately; on phone, it rewards the next scroll.

## The nine questions

- Would someone keep scrolling? **YES**. The portrait establishes a person worth inspecting, and the first work images provide a clear continuation. The smaller vehicle closes the profile without becoming a competing hero.
- Does motion reveal the product? **PARTLY**. The work-inspection still preserves Maya’s identity while enlarging her work. That is the right relationship, but no recordings or motion strips were supplied to establish continuity, timing or return behavior.
- Is this more desirable than production? **PARTLY**. The identity-led composition is substantially more desirable than the account-summary approach described in the brief. A direct production comparison was not supplied.
- Is the hierarchy instantly understood? **YES**. Maya, public reputation, work, then vehicle. Desktop makes that relationship particularly clear. Missing desktop Share and Settings controls weaken the action hierarchy.
- Does this feel like a consumer product? **YES**. Photography, restrained identity facts and understandable actions outweigh administrative UI. The vehicle inspector’s settings instructions unnecessarily break that character.
- Does the Business side justify paying? **PARTLY**. This profile supplies useful selection evidence through personality and varied work. Business commitment, review and paid value are outside these captures and cannot be approved here.
- Does Loyalty strengthen the story? **PARTLY**. Not assessable from this surface. Keeping Loyalty out of the shareable personal identity is correct; do not add it to satisfy this question.
- Are we actually at the quality benchmark? **NO**. The resting composition is promising, but mobile artwork collides, desktop owner actions disappear, and the work context falls back to a large rounded panel. Public-view and interaction evidence are also missing.
- Are there at least three memorable product moments? **NO**. None of the three required cross-product sequences is demonstrated here. This profile should support those moments, not invent a fourth.

## Scores

- business justifies paying: 0
- slop risk: 3
- text discipline: 7
- memorable moments: 0
- material quality: 7
- loyalty strengthens: 0
- keep scrolling: 8
- at benchmark: 6
- truthfulness: 7
- more desirable than production: 7
- motion reveals product: 0
- hierarchy instant: 8
- consumer product: 8

## Wow moments seen


## Material read

Mostly real, rationed and photographic. The bright canvas, uncovered media and opaque task sheets are convincing. The phone navigation visibly picks up the warm photograph underneath, giving it an actual foreground role rather than decorative glass. Its broad milky blur and bright edge still need scrolling contrast checks. The rounded work-context panel is the clearest material regression; more glass would not fix it.

## Word count read

Reported browser counts are 22 words in the phone first viewport and 28 across its page; desktop reports 30 in both. These are comfortably lean, but not yet verified inclusive totals. The Story visibly says “Take a coffee break.” and the vehicle-work image says “Spurroom Bikes”; the Activity badge also contributes a visible numeral. Audit these against the browser totals rather than assuming they are included. The resting profile likely remains within the intended ceilings; the vehicle explanation is the main visible copy excess. Report actual CSS page heights and separate public, inspection, Share, Settings, error and reduced-motion counts.

## Spec drift

- Desktop owner captures omit Share profile and Settings entirely.
- The phone Story meets the leading work image without the specified gutter and is wider than the planned 118px.
- Work context uses a large rounded white card rather than an open or square-edged reading surface.
- Vehicle inspection adds duplicated identity and account-management explanation.
- The displayed handle uses @maya.tapmart.demo rather than the specification’s expected @maya.tapmart_demo; verify the fixture rather than changing it to match prose.
- An Activity badge of 2 appears outside the specified profile inventory. Verify its backing record and include it in visible counts.
- No public-view captures, motion recordings or performance results accompanied this pass.

## Spec was wrong

- The specified mobile inspection placed work navigation after a potentially long image. In the real composition this makes sequential inspection too laborious. Keep navigation at the Work threshold while preserving the portrait’s document position.
- The Share inventory was too terse about the destination’s status. The added explicit fictional-profile notice is useful truthfulness, not disposable marketing copy; retain it and measure that state separately.

## Fixes

- 1. **/design-lab-v3/profile at 1440px and wider.** Restore visibly labelled Share profile and exactly one 44×44 Settings gear in the desktop owner header. Keep them outside the sidebar and preserve the current identity/work columns. Why: The surface’s primary promise is sharing, yet desktop provides no visible sharing or administrative entrance.
- 1. **/design-lab-v3/profile?view=public.** Capture directly opened ?view=public at 390 and 1440, including full pages. Verify that Settings, Personal, owner utilities and owner navigation are removed, and that desktop uses the centered public canvas without an empty sidebar. Why: The central acceptance question cannot be approved from owner screenshots or a Share sheet alone.
- 1. **Phone default Work arrangement.** Separate the phone Story from the leading still with a genuine 16px gap: retain the leading image at x16 to 240 and place the 118px-wide Story at x256 to 374. Preserve both original frames and the staggered vertical start. Why: The current images meet at one edge, making independently authored work look like a composite and obscuring the intended physical distinction.
- 2. **Inline Work inspection.** Remove the rounded white shell around work context. Use an open context group or square-edged opaque reading surface with one exposed divider. Put Previous and Next beside the Work/Close controls, reflowing into a second row when necessary; retain matching public context beneath the image. Why: The current oversized rounded panel reintroduces generic card language, while navigation sits below a long image and is unnecessarily expensive to reach.
- 2. **Vehicle inspection.** Remove the repeated Maya’s car heading below the photograph and the sentence about one photograph and Settings → Account → Vehicles. Keep the task title, intact photograph, supported listing state and city. Keep management instructions inside owner Settings. Why: A public-safe vehicle viewer should describe the vehicle, not explain account architecture. The absence of gallery controls already communicates a single image.
- 2. **Profile evidence package and recordings 11, 19 and 20.** Supply the profile interaction recordings at both sizes: work opening and switching, Close and browser Back, vehicle return, actual clipboard success and failure, public entry, and Settings navigation. Include reduced-motion, paused-motion and keyboard takes. Why: Static endpoints do not prove shared-object motion, correct source restoration, clipboard truth or accessible task behavior.
- 2. **MEDIA_MANIFEST.json, TEXT_COUNTS.md and REPORT.md.** Reconcile the visible profile records with the ownership manifest, including all three work items, the Approved label, the completion count, the displayed handle and the Activity badge. Attach rendered-text counts plus a separate manual media-lettering audit for each reviewed state. Why: The images visibly contain lettering that browser text-node counts cannot establish, and screenshots cannot verify ownership or approval provenance.

## Keep

- The generous, still portrait and spare right margin on phone.
- The desktop four-column identity and eight-column independent work composition.
- The restrained completion fact and absence of private earnings, disconnected-account warnings and invented reputation badges.
- The distinct tall Story, substantial still and landscape work formats.
- The quieter vehicle contact sheet and intact vehicle photograph in inspection.
- The single phone Settings entrance and readable, opaque settings rows.
- The visible lab context and motion control.

## Remaining risks

- Sharing is visually promising but the actual guest composition and copied destination remain unreviewed.
- Ownership, public approval context and the supported completion count require record evidence.
- Focus restoration, browser Back, modal inertness and exact scroll restoration are not demonstrated.
- 320px, tablet, 1920px, 200% text zoom, reduced motion and opaque-material fallback are not evidenced.
- Media transfer, LCP, CLS, interaction timing, frame timing and long tasks have not been supplied.
- Scores use a 0 to 10 scale; 0 denotes an unassessed or unshown dimension here, not a judgment that Business or Loyalty is intrinsically weak. Higher slop risk is worse.
- Final approval requires a new review after fixes, followed by human approval.

## Why better than production

Against the production approach described in the brief, this replaces readiness and financial administration with a person, authored work and a supporting vehicle. That is a meaningful product improvement, not merely a palette change. The supplied evidence does not establish a direct side-by-side production win.
