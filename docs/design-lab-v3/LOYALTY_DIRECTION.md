# TapMart V3: the Loyalty direction

Decided by Astra, TapMart's design director. Source: loyalty-direction.json.

## Founder read

The founder is asking for Open Cut's missing third act, designed as a working product rather than a feature teaser. A shop should create a simple branded loyalty card, enroll someone from a creator's link or the counter, count a qualifying visit in seconds, redeem a real earned reward in the concept, and understand which source brought people back. The V3 direction is Open Cut: The Return. Its signature is continuity from source to member to progress, not another dashboard aesthetic. Loyalty must never become a CRM, a coupon engine, a campaign-access paywall, a pretend messaging app or an invented revenue report. This is a complete isolated simulation awaiting approval, not a production launch.

## What Loyalty is

TapMart has three connected acts. Get attention through Recreate, Story and Car campaigns. Turn that attention into identifiable customers through a short, source-aware loyalty signup and a branded Wallet card. Bring them back through recorded visits or points, earned rewards and honest Wallet updates. Loyalty is the business's simple return loop, not a separate marketing suite: a creator's link can lead to a member, that member can become a repeat visitor, and the business can see the resulting counts without inventing transactions or exposing customers to creators.

## Placement

**business home entry.** Keep the marketplace opening exactly as built: Maya's face and work, plus Eli's car. On phone, insert one Loyalty strip after the complete car action band and before Nora. On desktop, insert it across the full content width below the lead person/car action bands and above the lower people roster. It is not an attention banner above discovery. Use 1px top and bottom separators, no enclosing card, no shadow and no new background. At 1440 it is 1176px wide and approximately 104px high; at 1920 it stays within the existing 1280px app maximum. At 390 it is 358px wide and approximately 132px high; at 320 it can grow to 152px rather than squeeze type. A 56px square crop of the program's actual artwork and loop mark sits left; this is an artwork fragment, not a tiny unreadable Wallet screenshot or QR. Copy: Loyalty / 10 members · 6 came back / Open loyalty. Open loyalty is a quiet 44px action. Show only these two counts here; the four-count overview belongs one tap away. No program: Loyalty / Turn visits into rewards. / Create program, with the brand mark instead of a pretend card. Draft: Loyalty / Draft · Free coffee / Continue setup. Live without members: Loyalty / 0 members · 0 came back / View QR. Keep the same insertion point in every marketplace filter; the strip is a business tool, not a People or Cars result.
**route map.** 
- /design-lab-v3, the V3 public homepage. Carry V2 forward and add the Loyalty sequence inside its business chapter.
- /design-lab-v3/home, the unchanged-in-intent V2 Personal Home copied into V3. All internal preview links remain inside V3.
- /design-lab-v3/profile, the V2 Personal Profile copied into V3. No Loyalty member identities or business customer records enter Personal mode.
- /design-lab-v3/business, the V2 marketplace with the specified Loyalty strip. Preserve its people, cars, filters, attention counts and request boundaries.
- /design-lab-v3/business/profile, the supporting Business destination: existing brand-profile language, cover, loop logo, Loopday Coffee, Coffee shop · Austin, Share and Settings. The first operational row below brand identity is Loyalty, with 10 members · 6 came back. Do not fabricate plan, shoot or active-campaign facts to fill an overview.
- /design-lab-v3/business/loyalty, Loyalty Home and its no-program, draft and live states.
- /design-lab-v3/business/loyalty/create?step=program|reward|card|signup|launch, one five-step wizard. Direct entry to a later step validates prerequisites. With a live program, show Loopday already has a live program. and View program; a separate Lab action can start the blank creation scenario.
- /design-lab-v3/business/loyalty/program, the live rule, terms and card previews. edit=reward and edit=card open contextual editing sheets. Program type is fixed after launch.
- /design-lab-v3/business/loyalty/qr, the counter signup QR, local shareable link and launch tools. view=print opens the labelled demo printout, not a new application route.
- /design-lab-v3/business/loyalty/members, member list. filter=repeat|ready|redeemed and source=<fixture-source-id> are views over the same local projections. view=redemptions lists reward-redemption events rather than pretending their total is a unique-member count.
- /design-lab-v3/business/loyalty/members/:memberId, member detail, immutable acquisition source, counted and uncounted history, earned rewards and Wallet state.
- /design-lab-v3/business/loyalty/record, counter recording. member=<fixture-id> preselects a member only after an explicit business action. Scan and Search remain modes of this route.
- /design-lab-v3/business/loyalty/attribution, the complete source descent. source=<fixture-source-id> opens one source's explanation and business-only member drill-down.
- /design-lab-v3/business/loyalty/updates, automatic and business-authored Wallet update history, explicitly simulated.
- /design-lab-v3/business/loyalty/updates/new, compose, preview and simulate one business Wallet update. Review is a step of this route, not a separate notification product.
- /design-lab-v3/c/:linkCode, a fixture campaign-link handoff. The code resolves through the fixture link registry, records an explicitly simulated trusted-link click after deliberate activation, and opens the appropriate signup. Arbitrary URL creator parameters cannot grant attribution.
- /design-lab-v3/join/:joinCode, public customer signup. loopday-counter maps to BUSINESS_QR; loopday-jasmine-story, loopday-maya-recreate and loopday-eli-car map to their source objects; loopday-direct is the plain, untracked signup entry.
- /design-lab-v3/card/:memberCode?platform=apple|google, the responsive Wallet concept wrapper. The opaque demo member code is distinct from both a signup QR and the readable member ID. Details opens within this route. Saving is simulated; no .pkpass or Google save JWT is produced.
- All additional overlays use these routes or in-route state. Content, campaign Create, Campaigns, Messages, Notifications and unimplemented Settings destinations retain their V2 meanings but open Outside this preview / This destination is outside the V3 lab. They do not navigate to production. Browser Back closes the top layer before leaving its parent.
- The persistent Design Lab control opens scenario selection and Reset demo. Scenarios: Live program, No program, Draft, Live · no members, Points · 82 of 100, Points · 99 of 100, Same-day visit, Wallet not added, Google limit reached, Recording error. Changing a scenario asks Change demo state? / This resets local changes. / Cancel / Change state. These are replacement fixture contexts, not additional live programs.
- Documentation is not navigation: produce docs/design-lab-v3/LOYALTY_ARCHITECTURE.md, WALLET_RESEARCH.md, PRIVACY.md, MVP_VS_LATER.md and REPORT.md. The architecture must retain the brief's purpose, fields, relationships and MVP/future distinction for loyalty_programs, loyalty_members, loyalty_rewards, loyalty_member_progress, loyalty_events, loyalty_attribution, wallet_passes, wallet_pass_registrations and wallet_updates.
- Architecture refinements: distinguish versioned reward definitions from earned member reward instances; add loyalty_member_rewards with member, reward version, unlock event, consumed credits, status and redemption event. Preserve additional progress rather than resetting it destructively. Record business timezone, counted delta, qualifying-visit identity, staff actor and idempotency key on counter events. A positive POINTS_ADDED event must contribute a qualifying visit day so points members can be measured as repeat visitors.
- Architecture refinements: immutable attribution includes source type, campaign, creator, link or QR, first-touch time, signup time, session and confidence. A unique program/contact identity prevents duplicate signups. Preserve the first known source through signup; later touches are separate events. Production session signing and identity verification are design requirements, not integrations built by V3.
- Wallet documentation must distinguish a save action opened from a confirmed save, an update submitted from delivery, and a notification request from a notification seen. Preserve the research's source-access limitations and unverified 2026 claims; do not relabel them newly verified. REPORT.md contains route inventory, actual browser captures, text counts, normal/reduced-motion recordings, event/count checks and unresolved issues. Stop for approval.
**decision.** Loyalty belongs to the business itself, not to a fourth campaign type or a new Growth destination. Its permanent home is Business → Loyalty, as the first operational row below the brand profile. A shallow, unmistakable entry inside Business Home makes it discoverable without converting the marketplace into a dashboard. Home still answers who can advertise for me; Loyalty answers who joined and came back. This preserves the five-destination mental model while making daily counter work one tap from its Home entry.
**navigation changes.** 
- None to the five primary destinations: Home, Content, Create, Campaigns, Business.
- None to the 200px desktop sidebar, 80px tablet rail or five-item phone bar. Reuse the as-built V2 Phosphor regular icon set; do not introduce a second library.
- Business becomes an implemented V3 supporting profile destination and contains the Loyalty row. Loyalty routes keep Business selected; desktop breadcrumb is Business / Loyalty. Do not add a sixth rail icon, nested permanent rail menu or Loyalty notification badge.
- The consolidated Settings list remains Account, Business Details, Connections, Google Business, Brand Kit, Plan and Billing, Team, Notifications, Security, Log out. Loyalty is not buried in Settings and does not add another Settings row.
- Counter, creation and customer signup are focused tasks. The business bar remains on overview/list pages; full-height recording and creation can cover it while providing Back and Close. Customer routes never show business navigation.

## Vocabulary

- Members means people enrolled in this business's program, including people who have not added Wallet. Avoid subscribers, contacts, leads and audience as the main membership noun.
- Visits is the customer-facing unit for the visits program. Do not alternate Visits, Stamps and Purchases across screens. Stamps can explain the category in documentation, not become a second UI vocabulary.
- Points is the unit for the points program. Use 82 of 100 points in the app and supported compact balance strings on Wallet. Never translate points into money.
- Reward ready means an earned, unredeemed reward exists. Avoid Available credit, unlocked value and claimed prize.
- Reward redeemed is the member's completed-use state. Redeemed is the compact attribution label. Never equate redemption with a verified purchase or revenue.
- Wallet update is the name for every business-authored member message. Notification describes only a platform behavior that may occur; it is never a substitute for SMS, email or TapMart customer-app push.
- Joined from introduces the preserved acquisition source. Also reached through is reserved for a separate known later touch. Avoid last-touch wins, influenced sales and automatic source reassignment.
- Came back is the human attribution label. Repeat visitors is the Loyalty Home count. Both require counted activity on two distinct business days; signup plus one visit is not a return.
- Counter QR means the acquisition code used to join. Member QR means the opaque identifier used by staff to record progress. They are different codes and must never be visually presented as interchangeable.
- Live is always qualified as simulated at the program-state decision in the lab. Added is always qualified as simulated for Wallet. Never use Pass issued, Delivered or Read.
- Direct signup / Source not tracked describes an arrival without known TapMart acquisition data. Avoid claiming Organic proves no campaign influence.
- Use Create program for Loyalty and Create campaign for advertising. The central lime Create destination still means campaign creation, not a miscellaneous creation menu.

## Surface: Business Home with Loyalty

**Two seconds.** Find someone to advertise for the shop. Loyalty is here too: ten members, six who came back.

**Primary action.** The marketplace keeps Request as each person's filled action. Loyalty contributes only the quiet Open loyalty entry in the live fixture.

Hierarchy:

- Retain the as-built identity header, fictional context, city and For you / People / Cars / Nearby controls.
- Maya's portrait and authored work lead. Keep View person and Request and the existing independent car composition.
- After the complete car on phone, insert the single shallow Loyalty strip. It connects acquisition and retention without displacing marketplace discovery.
- Nora and the finite continuation follow. Desktop inserts the same strip between the featured spread and the Nora/Eli roster.
- Use V2 paper, square media, 4px controls, existing type and the straight separators. The strip's artwork does the visual work; no dashboard boxes appear.

On demand:

- Open loyalty navigates directly to the live overview, not a marketing explanation.
- The alternate strip copy and actions are defined in placement.business_home_entry.
- Retain V2 person, work, city, car placement and request boundary behavior. No Loyalty mutation occurs merely by viewing a creator.
- Business opens the brand profile with the permanent Loyalty row. Its settings gear retains the consolidated administrative list.
- Do not hide the strip inside More or make it disappear on People and Cars filters.

Visible copy:

- Loopday Coffee
- Design Lab · Fictional preview
- Austin
- For you
- People
- Cars
- Nearby
- Maya Chen
- @maya.tapmart_demo
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
- More
- Eli Moss
- Round Rock
- @eli.tapmart_demo
- TapMart
- Home
- Content
- 2
- Create
- Create campaign
- Campaigns
- 3
- Business
- Search
- Messages
- Notifications

Truth labels:

- Design Lab · Fictional preview replaces the existing Fictional preview context label in V3 only.
- The car amount remains an explicitly fictional asking rate; it is unrelated to Loyalty value.
- Do not label Loyalty Live on the marketplace strip unless opening the program establishes its explicitly simulated status.

## Surface: Loyalty Home

**Two seconds.** Ten members. Six returned. One reward is ready. Add the next visit.

**Primary action.** Add visit; Add points in the points scenario.

Hierarchy:

- Phone: 56px header with Back to Business, Loyalty and Add visit. A compact Design Lab context follows.
- Four unboxed counts in a two-by-two alignment: 32px tabular numerals, 13px labels, generous space and no tinted backgrounds.
- Recent customers: June, Ben, Imani. First names and compact progress only; a section-level Visits label supplies context.
- Program: actual artwork fragment, Free coffee, 5 visits, Live and View program.
- Joined from: Jasmine's three-step descent and View attribution.
- Working actions: View QR, Members, Send update. Keep safe-area clearance above the normal business bar.
- At 1440: use the existing 1176px canvas. Counts form one four-column row; recent customers occupy eight columns and the compact program presentation four. Attribution spans the next row. At 1920 cap at 1280px; do not add more metrics or customers.
- At 768 to 1023: retain the 80px labelled rail and use the eight-column grid. At 320: counts remain two-by-two, controls wrap, labels never clip. No miniature desktop panel.

On demand:

- Each count explains its definition and opens the corresponding member or redemption view. Rewards ready and Rewards redeemed count reward instances/events, not necessarily unique members.
- A recent-customer tap opens that member, including masked contact, source, visit history and Wallet state.
- View program reveals the realistic Apple and Google concepts, terms, Edit reward and Edit card.
- Recent ordering uses latest signup, counted counter activity or redemption. A same-day no-op and a Wallet content update do not reorder the customer list.
- No program, draft and live-zero states use the specified state-dependent primary action; do not leave Add visit as the dominant disabled button.
- The Design Lab control exposes scenarios and reset. No ordinary shop owner needs a fixture selector in the product hierarchy.

Visible copy:

- Loyalty
- Design Lab · Fictional preview
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

Truth labels:

- The overview is globally labelled Design Lab · Fictional preview.
- Opening Live shows Live · simulated and This program exists only in the Design Lab.
- There is no Live activity label, updated-just-now timer, estimated growth or animated count-up.

## Surface: Create program

**Two seconds.** Choose the rule, name the reward, make the card yours, then put the QR on the counter.

**Primary action.** Continue through steps one to four; Launch demo program on the final review.

Hierarchy:

- One five-step task: Program, Reward, Card, Signup, Launch. Phone shows the current title and n of 5; desktop shows the five plain text steps.
- Program: two generous unboxed choices, Visits and Points, with one sentence each. Visits is selected by default.
- Reward: reward name, requirement and optional terms. Visits default to five; points default to 100. One qualifying purchase per day is a visible fixed MVP rule for both kinds.
- Card: show the platform-realistic preview before the controls on phone. On desktop preview occupies five columns and controls seven. Apple Wallet and Google Wallet are platform tabs, not two tiny side-by-side phones.
- Signup: inspect the short customer page and its source-aware variants. This is a preview, not enrollment into a draft.
- Launch: review reward and rule, then the demo QR and local signup link. Launch demo program is the only commit. The result is Live · simulated with zero members.
- Creation uses ink actions. The navigation's campaign Create remains the only routine lime-filled control.
- Visit requirement accepts whole numbers 2 to 50; points requirement accepts 2 to 10,000. The points award is fixed at one per qualifying purchase in this MVP. There is no spend calculation or arbitrary staff balance editor.

On demand:

- Validation strings: Enter a reward name. / Enter 2 to 50 visits. / Enter 2 to 10,000 points. / Use a whole number. / Text needs more contrast. Errors stay beside their field and block the relevant Continue action.
- Use brand defaults restores the approved fixture brand only. It does not fetch, research or change the business's production Brand Kit.
- Preview state exposes Collecting, Reward ready, Reward redeemed and Updated offer. Its examples never create members or counter events.
- Draft exit: Keep draft / Discard demo draft / Keep editing. Saving says Draft saved in this preview. No persistence across reload is promised.
- The QR page says Counter QR / Scan to join Loopday Coffee / Collect 5 visits. Your next coffee is free. / Demo QR · Design Lab only / Copy demo link / Preview printout / Download demo QR / Open signup. Copy confirmation: Demo link copied. Downloads are locally generated labelled QR artwork, not Wallet passes.
- The QR printout is a simple A5 portrait composition: brand, reward, 5-visit rule, at least a 45mm QR with quiet zone, Scan to join and Demo QR · Design Lab only. Print demo invokes browser print only after a tap. No print-order service is implied.
- Edit reward creates a new reward definition. Before Save changes show Changes apply to new reward cycles. Earned rewards stay unchanged. Existing unfinished cycles retain their original requirement; no retrospective change is made to history.
- Program type is fixed after launch. is visible where a live user might expect to change Visits to Points. Do not silently migrate member balances.

Visible copy:

- Create program
- Design Lab · Fictional preview
- Program
- Reward
- Card
- Signup
- Launch
- 1 of 5
- 2 of 5
- 3 of 5
- 4 of 5
- 5 of 5
- Visits
- One visit per qualifying purchase.
- Points
- One point per qualifying purchase.
- One qualifying purchase counts per day.
- Continue
- Back
- Close
- Save draft
- Reward name
- Free coffee
- Visits to reward
- 5
- Points to reward
- 100
- Terms
- Optional
- Apple Wallet
- Google Wallet
- Design Lab · Apple Wallet concept
- Design Lab · Google Wallet concept
- No pass is issued.
- Logo
- Business name
- Loopday Coffee
- Program name
- Loopday Rewards
- Card colour
- Text colour
- Label colour
- Artwork
- Change image
- Remove artwork
- Crop
- Reward title
- Use brand defaults
- Preview state
- Example member · Sara
- Preview signup
- Counter QR
- Creator link
- Signup preview · not live
- Launch before joining.
- Ready to launch
- Draft
- 5 visits → Free coffee
- Demo QR · activates after launch.
- Launch demo program
- Live · simulated
- View QR
- Open loyalty

Truth labels:

- Both platform previews carry their exact Design Lab concept label directly above the card, with No pass is issued. below it.
- Preview state and Example member · Sara distinguish specimen progress from actual enrolled customers.
- The launch button itself says Launch demo program; its success is Live · simulated.

## Surface: Customer signup and Wallet card

**Two seconds.** Five visits earn a free coffee. Join without an app, then keep the card in Wallet, simulated here.

**Primary action.** Create my card, then the explicitly simulated Wallet action appropriate to the selected platform.

Hierarchy:

- Signup is a public, single-column branded page, maximum 440px wide. No TapMart account header, business rail or app bottom bar.
- The loop mark and business name lead; the source acknowledgment is small but visible.
- Reward and material counting rule precede the form. The first name and one contact are the complete identity request.
- After signup, the new zero-progress card leads. Wallet choices and the simulation note sit directly beneath it.
- The Wallet concept wrapper shows its platform label above the card and a stable Details action outside it. Do not invent unsupported actions on the pass front.
- At 390, the pass is approximately 358px wide. At 320 it is 296px wide and remains legible; QR size does not fall below 144px. Desktop is deliberately a single customer task, not a dashboard.

On demand:

- All validation, phone, legal, duplicate-contact and simulated-save strings are specified in signup.copy.
- Details reveals the reward requirement, terms, member ID and the current offer if one exists. It never prints phone or email.
- Apple front fields, Google front fields and platform-specific content limits are specified in card_designer. These are not one web card wearing two platform logos.
- A new member's first card has zero progress. The designer's historical 3-of-5 specimen never leaks into a real fixture signup.
- The membership QR is newly generated from the member's opaque demo code. It is not the signup QR reused with a different caption.
- Official Wallet badge artwork may be used according to platform guidelines. If unavailable, use the exact labelled text action rather than fabricating an official badge or operating-system save sheet.

Visible copy:

- Design Lab · Simulated signup
- Use fictional details only.
- Loopday Coffee
- From Jasmine’s Story.
- Free coffee
- Collect 5 visits. Your next coffee is free.
- One qualifying purchase per visit. One counted visit per day.
- First name
- Email
- Use phone
- Used to find your card at the counter. No texts or emails.
- I agree to the demo program terms and privacy notice.
- Create my card
- Use demo details
- Your demo card
- 0 of 5 visits
- Add to Apple Wallet
- Add to Google Wallet
- Simulated actions. No pass is issued.
- Not now
- Design Lab · Apple Wallet concept
- Design Lab · Google Wallet concept
- No pass is issued.
- VISITS
- 0 of 5
- REWARD
- Free coffee
- MEMBER
- Tess
- STATUS
- Collecting
- Loopday Rewards
- Visits
- 0/5
- Rewards
- 0
- Member
- Member ID
- LD-011
- Details
- Done

Truth labels:

- Design Lab · Simulated signup is visible before entering data.
- Each Wallet action has Simulated actions. No pass is issued. beside it.
- After a save simulation, show Apple Wallet add simulated. or Google Wallet add simulated. and Nothing was added to your device.
- The platform concept label remains visible when the card is inspected or shared as a screenshot.

## Surface: Members and recording

**Two seconds.** Find Sara, see four of five, count her next visit. The source stays attached.

**Primary action.** Add visit for a collecting member; Redeem for a member with a ready reward.

Hierarchy:

- Members begins with title, Search members and compact All / Repeat visitors / Reward ready filters. No spreadsheet columns on phone.
- Rows show first name, progress or reward state, and a quiet chevron. No made-up headshots or colored engagement scores.
- Member detail: first name and masked contact; large progress; the reward; the appropriate Add visit or Redeem action; then Joined from, Wallet and History.
- Source and history are important, but they never stand between identifying the customer and counting a visit.
- Recording is the focused scanner/search flow specified in recording. It is not a camera thumbnail embedded in a member dashboard.
- Desktop keeps a 440px member list beside a readable detail region when space allows. Deep links and phone use the same detail as a full page. At tablet widths do not squeeze two unusable columns.

On demand:

- Default member ordering is ready rewards first, then current progress descending, then first name; explicit search does not imply a loyalty ranking. Recent-customer order is separately defined on Home.
- History shows SIGNUP as Joined, positive VISIT as Visit counted, positive POINTS_ADDED as Point added, same-day attempts as Not counted · same day, unlock as Reward ready and redemption as Reward redeemed. Show actual fixture dates and times on demand.
- For Sara: September 8 first visit; September 10 Came back; September 13 third visit; September 16 fourth visit. September 17 is added only through a deliberate recording action.
- Mina's detail leads with Reward ready / Free coffee / Redeem. Lena's leads with Reward redeemed / 0 of 5 visits / Add visit. Neither state is an invented reminder.
- Wallet states are Wallet not added, Apple Wallet · simulated, Google Wallet · simulated or Both Wallets · simulated. There is no Issued label.
- Source details can show Also reached through when a separate trustworthy later touch exists; it never replaces Joined from. The default fixture does not invent a later touch.
- Masked contact and source are business-only. There is no full-contact reveal, customer export or creator-visible member page.
- Empty search: No members match. / Try another name or contact. Empty list: No members yet. / View QR.

Visible copy:

- Members
- Design Lab · Fictional preview
- Search members
- All
- Repeat visitors
- Reward ready
- Add visit
- Mina
- Reward ready
- Sara
- 4 of 5 visits
- Noah
- 3 of 5 visits
- Imani
- 2 of 5 visits
- Theo
- 1 of 5 visits
- Luca
- 1 of 5 visits
- Ben
- 1 of 5 visits
- Lena
- Reward redeemed
- Ava
- No visits yet
- June
- No visits yet
- ••42
- Free coffee
- Joined from
- Jasmine
- Morning loop · Story campaign
- Joined Sep 8, 2026
- Wallet
- Apple Wallet · simulated
- History
- Sep 16, 2026
- Visit counted
- View demo card
- Back
- Close

Truth labels:

- The member list and detail retain Design Lab · Fictional preview.
- Recording adds Scanner simulation and No camera is used. at the viewfinder.
- Every local progress, redemption or save receipt distinguishes fixture success from Wallet delivery.

## Surface: Attribution

**Two seconds.** Jasmine brought four members; three came back; one redeemed. Maya brought fewer, but both returned.

**Primary action.** Select a source to understand it. View members is the contextual next action, not a global export button.

Hierarchy:

- Attribution title and a compact All time scope label. No date-picker toolbar in the MVP.
- The complete 10 Joined, 6 Came back, 2 Redeemed descent is the first visual object.
- A quiet explanatory line: From signup to a recorded return.
- Sources follow as unboxed identity-plus-descent objects, sorted consistently and scaled together.
- Jasmine, Maya, Counter QR, Eli and Direct signup all appear. The absence of creator credit is not hidden.
- Source definitions and member drill-down are revealed only after selecting a source. Never turn the main surface into a table.

On demand:

- How counts work: Joined / Members who signed up. Came back / Members with counted visits on two different days. Redeemed / Members who used at least one reward.
- Acquisition explanation: The first known signup source stays attached. / Later visits and links do not replace it.
- Source details uses View members for a business-only drill-down. Explain Link recorded or Source not tracked according to the stored confidence.
- Count histories can be inspected through the relevant members, not through a fabricated chart of daily values.
- RECREATE, STORY, CAR, DIRECT_CREATOR_REQUEST, TAPMART_LINK, BUSINESS_QR and ORGANIC remain stored types. Human labels are Recreate campaign, Story campaign, Car campaign, Creator request, TapMart link, Counter QR and Direct signup.
- Do not render zero-result creator or campaign objects merely to imply more activity. The honest pre-campaign state is specified in attribution_view.empty.

Visible copy:

- Attribution
- Design Lab · Fictional preview
- All time
- 10 Joined
- 6 Came back
- 2 Redeemed
- From signup to a recorded return.
- Sources
- Jasmine
- Morning loop · Story campaign
- 4 Joined
- 3 Came back
- 1 Redeemed
- Maya
- Counter pour · Recreate campaign
- 2 Joined
- 2 Came back
- 1 Redeemed
- Counter QR
- 2 Joined
- 1 Came back
- 0 Redeemed
- Eli
- Around Austin · Car campaign
- 1 Joined
- 0 Came back
- 0 Redeemed
- Direct signup
- Source not tracked
- 1 Joined
- 0 Came back
- 0 Redeemed
- How counts work
- Back
- Home
- Content
- Create
- Campaigns
- Business

Truth labels:

- The fictional context stays visible above the descent.
- All time describes the actual fixture scope; it does not imply a live analytics connection.
- Definitions distinguish a member's signup and recorded returns from verified sales or causal campaign effectiveness.

## Surface: Public site sequence

**Two seconds.** TapMart gets the shop attention, turns it into identifiable members, then helps those people return.

**Primary action.** Open loyalty preview at the end of the sequence; the public hero's existing audience actions remain unchanged.

Hierarchy:

- Keep V2's photography-first hero, earning examples and approval/payout boundary intact.
- Retain the dark For businesses marketplace chapter and its existing people, car, creation and review controls.
- Before the tonal cut back to Monthly Content, extend that chapter with one large Loyalty sequence. This replaces its empty closing shoulder and repeated preview ending, not the marketplace opening.
- Three acts become visible through the sequence: Get attention. / Turn them into customers. / Bring them back.
- A real matched Story leads to the signup, a distinct member card, recorded visits on named days and Reward ready. Source identity survives the handoff.
- Use one readable coded stage, not three floating devices, screenshots of dashboards or a new feature-grid section.
- Finish with Open loyalty preview, opening the unscaled V3 Loyalty Home. Monthly Content remains a separate subscription story.

On demand:

- Story, Signup and Reward jump to the corresponding narrative chapter. Previous and Next expose every frame without scroll choreography.
- Play sequence is deliberate, runs once and leaves the final frame at rest. Pause is visible throughout playback. Replay never enrolls or credits a working member.
- Open loyalty preview opens /design-lab-v3/business/loyalty. Other public preview entrances point to their V3 equivalents, not production.
- Media sources explains that Jasmine is a fictional source identity and the Loopday Story is a matched fixture creative. Do not borrow Maya's portrait to invent a picture of Jasmine.
- Unchanged V2 earning and marketplace panels retain their full existing copy inventories, monetary bases, requirements and honest boundaries. Intrinsic Story lettering remains the source asset's lettering, not rewritten overlay copy.
- If the Loopday asset cannot be verified, show Media unavailable. Never substitute the supplied Demo Roastery creative or perspective-extract the photographed phone.

Visible copy:

- TapMart
- Earn
- For businesses
- How it works
- Pricing
- Sign in
- Menu
- Start earning
- Your everyday can earn.
- Recreate
- Post
- Drive
- Campaign imagery
- Fictional product preview
- Apply or accept
- Work or proof
- Business approval
- Approved work earns. Payout is separate.
- Payout details
- Find people
- Find cars
- Create campaign
- Review work
- Open preview
- Loyalty
- Get attention.
- Turn them into customers.
- Bring them back.
- Design Lab · Simulated sequence
- Jasmine
- Morning loop · Story campaign
- Join Loopday
- Joined from Jasmine · Story campaign
- Story
- Signup
- Reward
- Play sequence
- Pause
- Previous
- Next
- Replay
- Open loyalty preview
- Design Lab · Apple Wallet concept
- No pass is issued.
- Monthly Content
- Shoot samples
- Essential
- 1 shoot / month
- 10 photos · 3 videos
- Growth
- 2 shoots / month
- 20 photos · 6 videos
- Price unavailable
- Campaign spending is separate.
- Get started
- Terms
- Privacy
- Creator terms
- Campaign rules
- Media sources

Truth labels:

- Design Lab · Simulated sequence stays in the stage's upper edge throughout playback.
- The Wallet concept has its own adjacent platform label and No pass is issued.
- No posted, approved, paid, message-delivered or real-pass-issued state is created by scrolling.
- The public replay uses its own isolated state and cannot change the business's fixture counts.

## Loyalty Home hierarchy

- Header: Loyalty, with Add visit as the single filled action. In a points program, the action is Add points. Business remains the selected primary destination.
- First: four counts directly on paper, in this order: Members, Repeat visitors, Rewards ready, Rewards redeemed. No statistic cards, trends or comparison periods.
- Second: Recent customers. Show three compact, operable rows with first name and progress or reward state. No invented portraits, contact details or source explanations in these rows.
- Third: the program. Show its actual brand artwork, Free coffee, 5 visits and Live. This is the rule, not an average member's progress. View program reveals the card and program controls.
- Fourth: Joined from. Show the leading source, Jasmine · Story campaign, with 4 Joined, 3 Came back, 1 Redeemed as a small descent. View attribution opens the complete comparison.
- Last: quiet working actions. View QR, Members and Send update are secondary. Do not arrange five equally prominent buttons across the top.
- Edit reward is on demand inside View program. Card editing and program terms live there too, not in general Business Settings.
- State-dependent primary action: Create program when absent; Continue setup for a draft; View QR when live with no members; Add visit or Add points once members exist.

## Card designer

**apple concept.** Draw a conventional Apple Wallet store-card concept, not an invented 2026 layout. Use a 375px reference width and an approximately 500 to 540px content-led height, with a restrained platform-like 12px pass boundary; this is the sole card-shape exception, not a new app container style. At top, a compact loop logo and Loopday Coffee logo text. Use a 375:123 strip artwork area behind the one primary field. Compose the actual Loopday photo on the right and a solid brand-color reading area on the left; no gradient is needed to make text legible. Primary: VISITS / 3 of 5, or POINTS / 82 of 100. Under it use three combined secondary/auxiliary fields: REWARD / Free coffee, MEMBER / Sara, STATUS / Collecting. This remains within the square-barcode store-card field budget. Put a black-on-white member QR below, with a four-module quiet zone, plus readable member ID LD-001. Never place a logo over the QR. Back fields contain Reward, Requirement, Terms, Member ID and Offer when present. Do not use a generic-pass background image, arbitrary web progress controls, a front Redeem button, featured actions or an embedded tap target that Apple has not been verified to support. The wrapper, not the pass, supplies Details, platform switching and lab controls. Typography approximates platform rendering with the system font rather than pretending Wallet uses TapMart's Bricolage.
**controls.** 
- Logo, default to the approved fixture loop mark. Change logo accepts a local preview asset; no production upload occurs. Keep a rectangular Apple logo treatment and Google's supported circular logo crop.
- Business name, Loopday Coffee. Also expose the Google program name, Loopday Rewards, with a 20-character design limit to avoid depending on platform truncation.
- Card colour, #18231D; Text colour, #F7F4EB; Label colour, #C4CDBF. These are the fixture's approved brand defaults. Validate contrast and block an unreadable result.
- Artwork, the matched /design-lab/reference-loopday-01.jpg fixture source. Verify and record its crop in the V3 media manifest. Allow Change image, Remove artwork and Crop; never stretch the image or imply it is an actual member's photograph.
- Reward title, Free coffee, inherited from the reward step. Editing here updates the same draft value, not a second contradictory reward definition.
- Use brand defaults is quiet and reversible. It does not overwrite the production Brand Kit.
- Platform controls: Apple Wallet / Google Wallet. Preview state controls: Collecting / Reward ready / Reward redeemed / Updated offer. These are inspection controls outside the card, not fields printed on it.
**truth.** Immediately above every Apple specimen: Design Lab · Apple Wallet concept. Immediately above every Google specimen: Design Lab · Google Wallet concept. Immediately below: No pass is issued. Creation specimens additionally say Example member · Sara. State selectors never imply a real card changed. Saving uses Apple Wallet add simulated. or Google Wallet add simulated., with Nothing was added to your device.
**progress display.** The app can use five simple progress strokes, but the native Wallet concepts use supported text/balance fields. Apple visits: VISITS / 3 of 5, with REWARD / Free coffee and STATUS / Collecting. Apple points: POINTS / 82 of 100. Google visits: loyalty-points label Visits with balance 3/5; secondary label Rewards with balance 0. Google points: Points with balance 82/100 and Rewards / 0. Its requirement text is 5 visits = Free coffee or 100 points = Free coffee. These compact string balances fit the researched field constraints. The live member preview defaults to Sara's actual 4 of 5; 3 of 5 is explicitly her earlier September 13 example, not an invented current average. Points examples live in a separate scenario and never mix into the visits cohort.
**states.** 
- Collecting, Apple VISITS 3 of 5 or POINTS 82 of 100, STATUS Collecting. Google Visits 3/5 or Points 82/100, Rewards 0. The QR, brand and member identity are unchanged. A counted update is silent on Apple; Google may notify on the supported changed balance within its allowance.
- Reward ready, Apple primary progress reaches the requirement and STATUS becomes Reward ready. Google balance reaches 5/5 or 100/100 and Rewards becomes 1; a supported details field says Reward ready. The business interface offers Redeem, never the pass front. Apple may show Your reward is ready. as a time-critical change message. Google may present its platform-controlled reward/balance notification. No notification is delivered in V3.
- Reward redeemed, Consume the earned instance and show the retained next-cycle progress, zero in the basic example. Apple STATUS becomes Reward redeemed; Google Rewards becomes 0 and the details state says Reward redeemed. Apple may show Your reward was redeemed. as a time-critical change message; Google may notify on its changed balance. The state persists until subsequent counted activity rather than disappearing on an arbitrary timer.
- Updated offer, Keep progress and reward status intact. Add Offer / Afternoon coffee / Ask us what’s pouring after 2 PM. to Apple back fields and Google's pass-details message. Do not overwrite Reward ready with an advertisement. Apple makes this a silent content change; Google may use a supported message-and-notify operation within its limit. The preview opens Details so the business can see exactly where the offer lives.
- Additional progress while a reward waits is retained. The front prioritizes ready reward count; Details can say 1 visit toward your next reward. A second earned instance is another quantity of the same reward, not a new tier. Redeeming one instance cannot zero out unrelated credits.
- A live reward edit leaves already earned instances and unfinished cycles on their original reward version. New cycles use the new definition; the member's visible title and terms must match the version actually being earned or redeemed.
**google concept.** Draw a Google Wallet loyalty-card concept, not a recolored Apple pass. Use the circular loop logo, Loopday Rewards as the program name, Loopday Coffee as issuer identity, and a wide approximately 3:1 hero image using the verified Loopday photo. Below, show the supported Visits or Points balance beside Rewards. Then Member / Sara and Member ID / LD-001, followed by the same member's black-on-white QR with a proper quiet zone. Requirement, reward status, terms and the current offer live in supported text modules/details. Use Google's hex background-color model and platform-like spacing/system typography. Keep essential labels and values outside imagery. No tiers row, Smart Tap action, rotating QR, NFC symbol or fabricated proprietary native control. The platform's exact rendering is not guaranteed by this concept; the adjacent Design Lab label makes that explicit.

## Signup

**fields.** 
- First name, required, 1 to 40 characters after trimming. No surname, username, birthday, password or TapMart account.
- Email or Phone, exactly one required contact. Email is selected initially; Use phone swaps the field, and Use email swaps it back. Phone exposes a country-code selector, defaulting to United States +1 for the fixture, without assuming the customer's device location.
- The contact is normalized for same-program deduplication. It is unverified in the concept. Never claim a code was sent or that a recovery flow works.
- One unchecked required agreement: I agree to the demo program terms and privacy notice. The links open explicitly labelled demo documents. There is no marketing checkbox because the MVP has no contact-marketing channel.
- A separate Lab helper, Use demo details, fills Tess and tess@example.test after a tap. It does not select the agreement or submit the form.
**source awareness.** A known Jasmine acquisition shows one quiet line above the reward: From Jasmine’s Story. A known counter acquisition shows Join at the counter. Direct signup shows no invented referrer; source details later say Direct signup / Source not tracked. These are acknowledgment, not referral-discount promises. A prior known TapMart source carried in the same fixture session wins even if the final arrival is through the counter QR. The page uses the preserved acquisition source, not the last visible URL. Never ask How did you hear about us? in this MVP.
**copy.** 
- Design Lab · Simulated signup
- Use fictional details only.
- Loopday Coffee
- Free coffee
- Collect 5 visits. Your next coffee is free.
- One qualifying purchase per visit. One counted visit per day.
- From Jasmine’s Story.
- Join at the counter.
- First name
- Email
- Phone
- Country code
- United States +1
- Use phone
- Use email
- Used to find your card at the counter. No texts or emails.
- I agree to the demo program terms and privacy notice.
- program terms
- privacy notice
- Create my card
- Use demo details
- Tess
- tess@example.test
- Enter your first name.
- Enter a valid email.
- Enter a valid phone number.
- Agree to the demo terms to continue.
- Couldn’t create the demo card.
- Try again
- Your demo card
- 0 of 5 visits
- No visits yet.
- Add to Apple Wallet
- Add to Google Wallet
- Simulated actions. No pass is issued.
- Not now
- Apple Wallet add simulated.
- Google Wallet add simulated.
- Nothing was added to your device.
- View Apple concept
- View Google concept
- Add another Wallet
- Done
- Wallet not added
- You can still show this demo QR at the counter.
- Already a member in this preview.
- Open demo card
- Card access is simulated; production recovery needs verification.
- This program isn’t live yet.
- Signup preview · not live
- Launch before joining.
- This signup link is unavailable.
- Close
- Back
- Demo program terms
- One qualifying purchase earns one visit. A maximum of one visit counts per business day.
- Collect five visits for one free barista-made coffee on a later purchase.
- Redeeming a reward does not earn a visit. Earned rewards have no expiry in this example.
- Additional counted visits are kept toward your next reward.
- These are demo terms, not a live program agreement.
- Demo privacy notice
- This Design Lab keeps entered details in this browser until reload. Nothing is sent to a server.
- The production design requires a first name and one contact. Businesses see masked contacts; creators see counts only.
- No contact details appear on the Wallet card.
- For the points variant: Collect 100 points. Your next coffee is free.
- For the points variant: One point per qualifying purchase. One counted purchase per day.
- For the points variant: 0 of 100 points
**flow.** 
- A counter QR opens the local BUSINESS_QR signup route. A creator's campaign link opens the corresponding source-aware route. These are acquisition codes, not member codes.
- The first screen contains the loop mark, business, source acknowledgment when known, reward, rule and short form. No full-screen account pitch or Wallet platform choice precedes signup.
- Create my card validates locally and appends SIGNUP once. Signup does not count a visit. The immutable source snapshot and agreement version/time are written into fixture state together with the member.
- A new Tess from Jasmine increases Members from 10 to 11 and Jasmine Joined from 4 to 5. Repeat visitors and reward counts do not change. An existing normalized contact creates neither a second member nor a new source.
- The next screen is Your demo card with a zero-progress card and member QR. Show the two official Wallet action labels together, with the preferred device platform first only when detection is reliable. Both remain available. The simulation note is immediately adjacent, never confined to a global footer.
- Tapping Add to Apple Wallet or Add to Google Wallet opens the matching coded concept with the explicit simulated-add receipt. It changes only the lab's Wallet projection. No operating-system sheet, API request, device notification or issued-pass state is faked.
- Done leaves a readable demo member card. Not now preserves the signup and shows Wallet not added; the member QR is still available. Adding the second platform does not create another member.
- The duplicate-contact path is a lab-only return to a fixture card. Before production, access to an existing member's card needs verified possession or an authenticated safe handoff; typing someone else's contact must not expose their QR or history.
- Draft signup previews are inspectable but cannot enroll a member. Invalid join codes do not silently become counter acquisition. A real cross-device production session is not simulated: scans on another browser start that browser's fixture state.

## Recording

**reward moment.** After the qualifying event commits to local fixture state, the final progress mark completes and Reward ready replaces the ordinary progress caption. Keep the member's name and QR stable. Show Free coffee and an immediately available Redeem action; do not open a celebratory modal. Sara's fifth visit changes the default counts to 10 Members, 6 Repeat visitors, 2 Rewards ready, 2 Rewards redeemed. Her Apple concept changes to VISITS: 5 of 5 and STATUS: Reward ready. The adjacent business receipt says Wallet update simulated. Redeem opens a small confirmation: Redeem Free coffee? / Use one ready reward. This does not add a visit. / Cancel / Redeem reward. Confirmation consumes that specific earned reward, appends the redemption event and shows Reward redeemed. Sara then has 0 of 5 visits, five lifetime counted visits and one redemption. Counts become 10, 6, 1, 3; Jasmine's source becomes 4 Joined, 3 Came back, 2 Redeemed. Apple may use a time-critical change message; Google may notify within its shared notification allowance. Nothing is delivered by the lab. Do not discard extra progress earned while a reward was waiting: consume only the credits attached to the redeemed reward and retain subsequent progress.
**same day.** Already counted today. / 2 of 5 visits · unchanged / One visit counts per day. / Done / Next customer. For Imani, the detail is Last counted today at 9:10 AM. A fresh second attempt is recorded as an uncounted same-day event; a duplicate request with the same idempotency key produces no additional event. Neither changes progress, repeat counts, reward counts or Wallet content. Use the business's America/Chicago calendar day, not the scanning device's timezone. The points equivalent is Already counted today. / 82 of 100 points · unchanged / One qualifying purchase counts per day.
**flow.** 
- Tap Add visit. Open a full-height counter surface on phone and a focused 560px working pane on desktop. Its title is Add visit; Scan and Search are local controls. Keep the return destination and scroll anchor.
- Scan is the default. The lab displays Scanner simulation, a coded square viewfinder, No camera is used., and Simulate scan. It requests no camera permission and does not display a fake live camera feed. A Lab-only Sample member selector defaults to Sara.
- Simulate scan resolves the selected fixture immediately. A single 320ms viewfinder sweep explains recognition; it is not an artificial network delay. The member and action are usable before the animation finishes.
- Search replaces the viewfinder with Name, phone or email. Match the local fixtures by normalized name or contact. Results show first name, masked contact and progress. Selecting a result enters the same confirmation state as scanning.
- Recognized member: Sara / ••42 / 4 of 5 visits / Free coffee / +1 visit. Source and history are available through View member, not between scanning and the counting action. Recognition to the available counting button should take under 400ms.
- Tap +1 visit once. Disable that request immediately against double activation. Commit the fixture event and projections together, then animate the confirmed progress for 220ms. Normal result: Visit counted. A practiced counter interaction should require one scan and one tap, approximately two seconds excluding camera acquisition in a future production system.
- In the points scenario, the title is Add points and the confirmation is 1 point / Per qualifying purchase / Add 1 point. V3 deliberately uses a fixed one-point award, not an arbitrary balance editor. The program counts at most one qualifying purchase per business day. An 82-point example becomes 83; a separate 99-point QA state demonstrates unlocking at 100.
- If the event unlocks a reward, reveal Reward ready and Redeem in the same action area. Done and Next customer remain available; earning a reward never automatically redeems it.
- After an ordinary counted visit, show Visit counted / 4 of 5 visits / Wallet update simulated, or Wallet not added when applicable. Do not claim that an unsaved Wallet received an update.
- An unknown or other-program QR says This QR isn’t a Loopday member card. with Search members and Try another QR. No guessed identity appears. A simulated failure says Visit wasn’t counted. / Try again; retain the member and the same request key.
- Next customer clears the recognized member and returns to the selected Scan or Search mode. Escape, Close and browser Back restore the originating Loyalty or member surface.
- The lab clock remains September 17, 2026, 10:00 AM CDT. A Lab-only Advance demo day control is explicit; no hidden timer fabricates a later day or another qualifying visit.

## Attribution view

**form.** Use an open, descending three-step composition: Joined, Came back, Redeemed. Each step is a horizontal ink rule with a solid measured length and its count outside the rule, aligned to a fixed text column. Right edges descend as counts narrow; left edges share a datum. Use a brick terminal only to connect this to Open Cut, not as an extra metric. The overall descent is 10 → 6 → 2. Below, source objects are stacked without boxes: identity at left, three measured ledges at right on desktop; identity above the ledges on phone. All source objects use one common scale based on the largest joined source, four members in this fixture. Do not normalize every source to its own 100%, invent a minimum-width zero bar or put tiny labels inside narrow bars. A zero is an empty rule with 0 outside. Default order is Came back descending, then Joined descending, then name. Never show a spreadsheet, revenue, ROI, order value, impressions-to-sales estimates, invented conversion percentages, causal lift or inferred offline exposure. Joined is a signup, not a verified purchase. Came back requires counted activity on two distinct business days. Redeemed is unique members who redeemed at least once, not the number of redemptions.
**empty.** Before any campaign has produced a member, retain measured counter or direct sources if they exist and show No members from campaigns yet. / Share a campaign’s signup link to connect future members. / View QR. Do not fill this space with sample creator performance. With no members anywhere, show No members yet. / Your first signup will appear here. / View QR. Counts may honestly be zero; no descent is drawn as if a cohort exists.
**per source.** Each object contains a human source name, campaign name and kind when known, then three unique-member counts. Example: Jasmine / Morning loop · Story campaign / 4 Joined / 3 Came back / 1 Redeemed. Tap opens Source details: Joined from, the immutable source classification, named link or QR, known first-touch time, signup range and the definition of each count. A business-only View members action opens the corresponding filtered member list. Direct signup is explicitly Source not tracked. Counter QR is a known entry mechanism, not proof that a creator had no earlier offline influence. Creators are absent from this MVP's operational routes; any future creator response contains only aggregates for their own links, never names, contacts, individual timestamps or a customer drill-down.

## Updates

**composer.** Send update opens a short composer headed Wallet update. Fields, in order: Kind, Title, Message. The business-authored choices are Special offer, New promotion and Milestone. Title is at most 40 characters; Message is at most 140. Default example: Special offer / Afternoon coffee / Ask us what’s pouring after 2 PM. Audience is fixed to members with a simulated saved Wallet: 8 members with Wallet · simulated. No segmentation, scheduling or contact-channel selector. Show this exact material note before preview and final confirmation: Wallet update. Apple Wallet shows it on the card; Google Wallet may notify. Once a day. Then Preview Wallet update opens Apple and Google results with Changes the card. and May notify. The final action is Simulate update, not a pretend production Send. Success says Wallet update simulated. / Nothing was sent. One business-authored message is allowed per program per America/Chicago calendar day across all three kinds. After one is simulated, disable the next and show Update already used today. / Next update: Sep 18, 12:00 AM CDT. Automatic progress and reward updates do not consume this business-message allowance, but all Google notifying requests share a conservative maximum of three per pass in a rolling 24 hours. Coalesce a visit and its reward unlock into one notification request. At the cap, update content without requesting another notification; show Notification limit reached. / Card content still updates. in platform details. Never claim delivery or a read.
**never.** 
- No SMS, email, customer-app push, inbox, subscriber list or Send to phone implication. The contact field is not a messaging channel.
- No Apple marketing change message. Special offers, new promotions and noncritical milestones change pass content silently.
- No unlimited Google notifications or separate three-notification budgets for each update kind.
- No exact promised Google system-notification appearance for a balance update. Platform presentation and user settings remain outside TapMart's control.
- No claim that pressing a Wallet badge issued or saved a real pass.
- No Delivered, Read, Open rate, Reach or guaranteed lock-screen appearance.
- No per-member business messaging, scheduled blasts, automatically invented birthdays or behavioral milestone campaigns.
**kinds.** 
- Reward ready, Automatic Wallet update. Triggered only by an actual fixture REWARD_UNLOCKED event, never selected as a broadcast to all members. Apple may show a time-critical change message; Google may notify on the changed reward balance within its allowance.
- Special offer, Business Wallet update. Apple updates an Offer back field; Google adds a pass-details message and may notify. It does not issue a coupon or create a new reward entitlement.
- New promotion, Business Wallet update. Same platform distinction as Special offer. It is optional card content, not proof that a campaign was created or seen.
- Milestone, Business Wallet update, manually authored for a shop milestone such as an anniversary. It is not an automatic member streak, birthday, tier or personalized trigger.
- Reward redeemed, Automatic Wallet update, visible in history rather than in the business composer. Apple may use a time-critical change message; Google may notify on the changed reward balance.
- Visit counted and Points added, Automatic Wallet updates. Silent progress changes on Apple. Google may notify on a supported changed balance, within the same three-per-pass rolling allowance. Uncounted same-day attempts produce no Wallet update.

## Public sequence

**Where.** Inside the existing dark For businesses chapter, after the marketplace's people/car/create/review demonstration and before Monthly Content returns to paper. Replace the current chapter's empty closing shoulder and duplicate Open preview ending with this third-act sequence. Do not move Loyalty into the earning hero or imply that Monthly Content subscriptions include campaign spend. The V3 page becomes longer; measure and report the new document height and complete copy count rather than pretending the old four-surface V2 budget was met unchanged.

Storyboard:

- 01, The source (1000ms): The intact /design-lab/story-loopday-01.jpg creative at 9:16, after manifest verification. A solid adjacent source band says Jasmine / Morning loop · Story campaign. Join Loopday is a coded link below the media, not an invented Instagram interface. Design Lab · Simulated sequence remains visible. Moves: Begin at rest. A matched Story may shift at most 24px toward the shared Open Cut datum as the sequence advances.. Copy: Get attention.
- 02, A deliberate tap (450ms): The same known campaign link opens Loopday's short signup. The source acknowledgment is From Jasmine’s Story. No QR is required for this link-led route. Moves: A single small tap indicator touches Join Loopday, then disappears. Cut to the signup rather than pretending the Story was posted or approved.. Copy: Turn them into customers.
- 03, Join (1100ms): A read-only replay of Sara's September 8 signup: business, Free coffee, five-visit rule, first name, one contact and the agreement. The replay's selected agreement is a depicted prior demo action, not an action performed on the working signup form. Create my card is the only product verb. Moves: Crossfade into a supplied replay state containing Sara and a fictional contact. No character-by-character typing or automatic consent animation.. Copy: Turn them into customers.
- 04, Keep the card (650ms): Sara's new member card, 0 of 5, Free coffee and its distinct member QR. Adjacent labels: Design Lab · Apple Wallet concept / No pass is issued. Outside the pass, the acquisition thread reads Joined from Jasmine · Story campaign. Moves: The Apple concept arrives with the 320ms Card arrives motion; the remaining time is a stable reading hold.. Copy: Turn them into customers.
- 05, First counted visit (800ms): Sep 8 · First visit in the replay's event band. The card shows 1 of 5. This is the first qualifying visit, not yet a repeat visitor. Moves: A compact counter confirmation meets the card edge; update 0 of 5 to 1 of 5 only after its illustrated counted event.. Copy: Bring them back.
- 06, Different days (1600ms): The same card and QR. The event band changes dates with each recorded visit. Came back appears at September 10, the second distinct day. No series of same-day taps is presented as repeat business. Moves: Three discrete date-labelled cuts, not a numeric count-up: Sep 10 to 2 of 5; Sep 13 to 3 of 5; Sep 16 to 4 of 5. Each field replacement uses a short crossfade.. Copy: Bring them back.
- 07, The next return (600ms): Sep 17 · Visit counted. This is an example continuation from Sara's four-visit baseline, confined to the public replay store. Moves: Show one explicit +1 visit action in a compact counter band. The fifth progress mark completes; the Wallet field changes from 4 of 5 to 5 of 5.. Copy: Bring them back.
- 08, A reason to return again (1100ms): Reward ready / Free coffee on the supported card fields. The counter band names Wallet update · simulated; it is not a fake lock-screen notification. Joined from Jasmine · Story campaign is still visible outside the pass. Open loyalty preview is the final action. Moves: Use The return unlocks once, then leave the composition completely still. Do not automatically redeem or loop.. Copy: Bring them back.

**Desktop.** At 1440 and 1920, extend the existing ink business chapter with a bounded 160svh native-scroll region. Its sticky stage is capped at 720px high at 1440 and 800px at 1920, always below the 72px public header. Map normalized native scroll to the same 7300ms storyboard; these timings define relative narrative weight, not forced waiting. No wheel interception or scroll lock. Keep content within the existing 1376px/1600px public maxima and cap the narrative composition at 1280px. The Story occupies a real 9:16 media region; the card remains approximately 375px wide at readable scale, not a wall-sized fake Wallet. At most one abstract phone viewport is permitted, with no notch, clock, signal or OS sheet. The source media remains unframed. Chapter controls, Previous and Next work independently of scroll; explicit playback pauses on scroll input. Extra 1920 width supplies breathing room, not another dashboard.

**Phone.** Use one readable stage in ordinary document flow, approximately 620 to 740px tall depending on viewport and text. No phone scroll pinning. Story, Signup and Reward are chapter-jump controls; Previous and Next expose all eight frames. Play sequence runs the 7300ms sequence only after a tap, with Pause always visible, then rests at the final frame. At 390 the card uses the available 358px width; at 320 remove decorative device framing entirely and use the 296px responsive concept. The stage's product UI is illustrative and non-interactive; Open loyalty preview opens the unscaled working product. Do not cram the business navigation or a whole dashboard into the frame.

**Reduced motion.** Remove sticky mapping, translations and playback. Present the same eight states as ordinary labelled sections, grouping the three return dates compactly while preserving their values. All source, platform and simulation labels remain. Previous/Next become native section links. No information depends on seeing a moving card or a notification.

## Motion additions

- Progress takes its place: A successful local VISIT or POINTS_ADDED commit.; Fill only the newly earned app progress stroke from its left edge. Crossfade the complete old numeric value to the complete new value in a fixed-width field. Wallet previews update supported text, not a custom animated native progress bar. No rolling digits, counts from zero or movement on uncounted attempts.; 220 for the app mark; 120 for Wallet field replacementms cubic-bezier(0.2, 0, 0, 1); explains A recorded qualifying visit changed progress; the animation did not create the event.; reduced motion: Replace the value and mark immediately; announce Visit counted, 4 of 5 visits once.
- The return unlocks: REWARD_UNLOCKED emitted with the qualifying event.; Complete the fifth stroke over 220ms. Crossfade the adjacent status into Reward ready over 140ms with a small check. Keep identity, artwork and QR stationary. The reward line gains emphasis through type, not confetti, glowing edges, vibration or a full-screen green flash.; 360 total; action available immediatelyms cubic-bezier(0.22, 1, 0.36, 1); explains The final counted requirement produced a redeemable reward.; reduced motion: Show the completed progress, Reward ready and Redeem immediately, with one polite announcement.
- Redeem and keep the thread: Confirmed REWARD_REDEEMED after the explicit confirmation.; The action area settles into Reward redeemed. Crossfade reward quantity and current progress once. Collapse only the consumed instance's ready action. No card shredding, disappearing member, QR replacement or celebration implying a payment.; 240ms cubic-bezier(0.22, 1, 0.36, 1); explains One earned reward was used, while remaining progress and other rewards survive.; reduced motion: Replace the ready state with Reward redeemed and the retained next-cycle progress; restore focus to Done.
- Card arrives: Successful fixture signup, then deliberate platform-concept opening.; The card enters from 16px below and fades into its final bounds. It does not flip, rotate or fly into a fake operating-system Wallet. The new membership QR is distinct from the signup QR. The platform label remains stationary above it.; 320ms cubic-bezier(0.22, 1, 0.36, 1); explains The signup now has a distinct member card to keep.; reduced motion: Show the card immediately with the same truth labels and focus placement.
- Counter recognition: Simulate scan in the labelled scanner surface.; One thin ink line traverses the coded viewfinder once; corner brackets then settle into a complete outline. Member information replaces the viewfinder without a flash or continuous scanning loop. The recognized action is not delayed by choreography.; 320 scan sweep; 160 recognition settlems linear for sweep; cubic-bezier(0.2, 0, 0, 1) for settle; explains The selected demo member code was recognized, not read by a real camera.; reduced motion: Show the recognition outline and member immediately; no sweep.

## Fixture story

**members.** 
- LD-001 Sara, joined Sep 8, 2026, 8:50 AM; 4 of 5 visits; counted Sep 8, 10, 13 and 16; latest visit Sep 16 at 4:20 PM; lifetime visits 4; returned yes; ready 0; redeemed 0. Source Jasmine / Morning loop / STORY / link-jasmine-story. Apple Wallet simulated. Required fixture contact +12025550142, displayed ••42. Member QR uses a separate opaque demo code.
- LD-002 Mina, joined Sep 1, 2026, 8:50 AM; 5 of 5 visits; counted Sep 1, 4, 8, 12 and 16, last at 9:00 AM; Reward ready since Sep 16; lifetime visits 5; returned yes; ready 1; redeemed 0. Source Jasmine / Morning loop / STORY. Google Wallet simulated. Contact mina@example.test, masked as •••@example.test.
- LD-003 Theo, joined Aug 27, 2026, 8:50 AM; 1 of 5 current visits; counted Aug 27, 29, 31, Sep 2 and 4; redeemed the first reward Sep 5 at 9:00 AM; counted again Sep 9 at 9:00 AM. Lifetime visits 6; returned yes; ready 0; redeemed 1. Source Jasmine / Morning loop / STORY. Apple Wallet simulated. Contact +12025550108, displayed ••08.
- LD-004 Ava, joined Sep 17, 2026, 8:40 AM; 0 of 5 visits; no counter events; returned no; ready 0; redeemed 0. Source Jasmine / Morning loop / STORY. Wallet not added. Contact ava@example.test, displayed •••@example.test.
- LD-005 Noah, joined Sep 3, 2026, 8:50 AM; 3 of 5 visits; counted Sep 3, 7 and 14, last at 9:00 AM. Lifetime visits 3; returned yes; ready 0; redeemed 0. Source Maya / Counter pour / RECREATE / link-maya-recreate. Google Wallet simulated. Contact noah@example.test, displayed •••@example.test.
- LD-006 Lena, joined Sep 2, 2026, 8:50 AM; 0 of 5 current visits; counted Sep 2, 5, 8, 11 and 14; reward redeemed Sep 15 at 9:00 AM. Lifetime visits 5; returned yes; ready 0; redeemed 1; current status Reward redeemed. Source Maya / Counter pour / RECREATE. Apple Wallet simulated. Contact +12025550126, displayed ••26.
- LD-007 Luca, joined Sep 16, 2026, 8:50 AM; 1 of 5 visits, counted Sep 16 at 9:00 AM. Lifetime visits 1; returned no; ready 0; redeemed 0. Source Eli / Around Austin / CAR / qr-eli-car. Google Wallet simulated. Contact luca@example.test, displayed •••@example.test.
- LD-008 Imani, joined Sep 15, 2026, 8:50 AM; 2 of 5 visits; counted Sep 15 at 9:00 AM and Sep 17 at 9:10 AM. A second attempt Sep 17 at 9:45 AM is uncounted and flagged same_day. Lifetime counted visits 2; returned yes; ready 0; redeemed 0. Source Counter QR / BUSINESS_QR / qr-loopday-counter. Both Wallets simulated. Contact +12025550117, displayed ••17.
- LD-009 Ben, joined Sep 17, 2026, 9:20 AM; 1 of 5 visits, counted at 9:30 AM. Lifetime visits 1; returned no; ready 0; redeemed 0. Source Counter QR / BUSINESS_QR. Wallet not added. Contact +12025550109, displayed ••09.
- LD-010 June, joined Sep 17, 2026, 9:55 AM; 0 of 5 visits; no counter events; returned no; ready 0; redeemed 0. Source Direct signup / ORGANIC / confidence none, visibly Source not tracked. Apple Wallet simulated. Contact june@example.test, displayed •••@example.test.
**sources.** 
- Jasmine, fictional creator with no supplied portrait; Morning loop · Story campaign; STORY; 4 Joined: Sara, Mina, Theo, Ava; 3 Came back: Sara, Mina, Theo; 1 Redeemed: Theo. Creator/campaign link is minted in the fixture registry; the finished Loopday Story is campaign media, not evidence of a live Instagram post.
- Maya, the existing fictional creator; Counter pour · Recreate campaign; RECREATE; 2 Joined: Noah, Lena; 2 Came back: Noah, Lena; 1 Redeemed: Lena. Use her existing identity and ownership-matched media only.
- Eli, the existing fictional creator/car owner; Around Austin · Car campaign; CAR; 1 Joined: Luca; 0 Came back; 0 Redeemed. Source is the campaign-specific placement QR; do not draw a new wrap on his photograph.
- Counter QR, BUSINESS_QR; 2 Joined: Imani, Ben; 1 Came back: Imani; 0 Redeemed. It is the business's generic acquisition QR, never the member-scanning QR.
- Direct signup, ORGANIC; 1 Joined: June; 0 Came back; 0 Redeemed; confidence none. UI says Source not tracked rather than claiming proven organic discovery.
- Total: 10 Joined, 6 Came back, 2 unique members Redeemed. Sources partition the cohort once; creator and campaign grouping must not double-count the same member.
- DIRECT_CREATOR_REQUEST and TAPMART_LINK are supported source types with fixture-registry examples available for signup QA, but no seeded members. Do not render fabricated zero-result creator objects in the default comparison.
**program.** Loopday Rewards, visits program, Free coffee. One qualifying purchase earns one visit; at most one visit counts per America/Chicago business day. Collect five visits and redeem one free barista-made coffee on a later purchase. Redemption earns no visit. No expiry in this example. One live program and one active reward definition; earned instances retain their definition version. Extra qualifying progress is not lost while a reward waits. Snapshot: September 17, 2026, 10:00 AM CDT. The alternative points scenario replaces this cohort context: one point per qualifying purchase, at most once per day, 100 points for Free coffee. It is not a second live Loopday program.
**counts.** Members 10: unique enrolled members, including two without Wallet. Repeat visitors 6: Sara, Mina, Theo, Noah, Lena, Imani, each with counted activity on at least two business days. Rewards ready 1: Mina's earned instance. Rewards redeemed 2: Theo's and Lena's redemption events. There are 28 counted visits, three unlocks and two redemptions in the seed; Imani's extra same-day attempt is not a counted visit. Eight unique members have a simulated Wallet: five Apple, four Google, nine platform cards because Imani has both. Home recent customers are June, Ben, Imani by latest signup/count/redemption activity. All displayed counts are projections of these fixture events, not separately hard-coded tiles.
**business.** Loopday Coffee, the same fictional Austin business as V2. Preserve Open Cut's warm paper #F7F4EB, green-black #18231D and brick #B73E28. The approved V3 fixture logo is a simple open loop with a short brick terminal: a return made visible, not a stamp badge. Wallet values use paper on green-black with #C4CDBF labels. Artwork uses the matched /design-lab/reference-loopday-01.jpg coffee-shop fixture, with a reviewed subject-safe crop and source recorded in the media manifest. No unrelated Demo Roastery creative, invented Jasmine portrait or generated UI image. Brand values: familiar, considered, quick at the counter.

## Honest states

- No program yet: no specimen pretending to be live and no dashboard of meaningless zero tiles. Loyalty / Turn visits into rewards. / Create program. Creation starts with visits versus points, not brand administration.
- Draft: Draft / Free coffee / Continue setup. Show the last completed step and Preview card on demand. No usable customer signup, no Live label, no member counts. Saving says Draft saved in this preview.; reload still resets local state.
- Live with no members: Live · simulated / 0 Members / 0 Repeat visitors / 0 Rewards ready / 0 Rewards redeemed. Primary View QR. Recent customers becomes No members yet. / Share your QR to start. Attribution shows no campaign result, not Jasmine's seeded performance.
- Member with no visits: Ava and June show 0 of 5 visits and No visits yet. A signup is not a first visit and adding Wallet is not a visit. Add visit remains available to staff.
- Wallet not added: Ava and Ben remain members and can accrue or redeem through the business interface. Detail says Wallet not added. and Show demo card. Do not show a notification receipt or claim their device changed.
- A ready reward is a stored earned instance. Closing the screen, sending an offer or editing the future reward does not erase it. Redeemed remains distinguishable from Reward ready and from ordinary progress.
- The whole lab uses a persistent Design Lab · Fictional preview context. Customer signup, simulated saving, scanner operation and update composition add action-local truth labels. Do not rely on one distant disclaimer.
- Real failures are distinguishable from empty states. Local QA error scenarios retain the uncommitted form or member; animations never imply success after a failed mutation.
- Full contact is not available through a business Contact action in this MVP because no permission to contact the customer is collected. Masked contacts and counter lookup are sufficient. No creator can reach the member routes.
- All events and projections are local to the V3 provider and reset on reload. Route changes and browser Back preserve the current in-memory scenario; public playback uses a separate replay store and cannot change the business's working counts.

## Not built on purpose

- No production routes, backend, Supabase access, database migrations, production session changes or live UI changes. Everything new stays under /design-lab-v3 and its V3 supporting files. /design-lab-v2 remains untouched.
- No Apple certificate, signed pass, APNs delivery, pass web service, Google issuer integration, signed save JWT, Wallet API request or real notification permission prompt.
- No new primary Loyalty or Growth tab, no sixth business destination and no campaign type called Loyalty.
- No CRM, full-contact directory, exports, marketing consent collection for unimplemented channels, SMS, email or customer-app push.
- No tiers, streaks, birthdays, points expiry, complex coupons, multiple active programs, choice rewards, scheduling, per-customer campaigns or enterprise roles.
- No POS, receipt scanning, verified spend claims, Smart Tap, NFC redemption, rotating barcodes, precise geofencing or nearby reminders. Location relevance remains documented as later, not shown as working.
- No revenue, customer lifetime value, average order value, campaign ROI, attributed sales, synthetic conversion rates or fake live activity.
- No declared-source questionnaire or multi-touch attribution model. Preserve the first known source now; store later trustworthy touches separately.
- No creator member list or creator customer-detail route. The future aggregate creator experience is documented, not built here.
- No production card recovery by unverified contact. No suggestion that the MVP's contact field already supports a secure recovery mechanism.
- No arbitrary points balance editing. The initial points program awards one point per qualifying purchase with the stated daily rule.
- No promotional notification on Apple, unlimited Google notifications or delivered/read metrics.
- No generated interface screenshots, generic bento grid, huge rounded admin cards, random gradients, AI purple, glass, floating blobs, fake 3D or decorative QR animation.
- No approval claim based only on this direction. Capture and review the real React/CSS at 320×568, 390×844, 768×1024, 1023×900, 1440×900 and 1920×1080; test keyboard, 200% text zoom, browser Back and reduced motion before approval.

## Self critique

- Does it feel native to TapMart? Yes in direction: it preserves the five destinations, marketplace-first Home and Open Cut's media-to-action seam. I rejected a Growth tab and a dashboard above Maya. The permanent Business row and the shallow Home strip make ownership and discovery clear.
- Does it strengthen the business proposition? Yes: the same source continues from campaign link to member to recorded return and redemption. I changed the public concept from a generic Wallet flourish to a dated, source-preserving story. Signup is explicitly not a purchase, and return is explicitly not causal revenue attribution.
- Can a shop understand it quickly? The four counts and Add visit lead; editing, platform limitations and history appear at their decisions. I removed the five-equal-button toolbar and put Edit reward inside the program. Engineering must still measure actual first-screen copy and counter task times; brevity is not proven by this specification.
- Does it feel consumer quality rather than SaaS admin? The program is a recognizable branded object, customers are simple names and progress, and sources are visual descents on open paper. I removed statistic tiles, spreadsheet rows and invented contact marketing. The Apple and Google concepts are intentionally different, not one decorative card with swapped logos.
- Is attribution powerful without fake analytics? The ten-person fixture reconciles, first-source identity is immutable and same-day attempts cannot inflate returns. I separated unique source redeemers from total reward-redemption events and added a counted-visit identity for points. Verdict: approve this direction for the isolated V3 build, not the finished implementation. Final Astra approval waits for real browser captures, responsive and accessibility review, event/count tests, truthful Wallet states and the V3 report; no production migration follows automatically.
