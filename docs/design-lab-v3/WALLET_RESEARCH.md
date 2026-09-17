# Wallet capability research for TapMart Loyalty

Recorded 2026-09-17 for the V3 Design Lab. This is what Apple Wallet passes
and Google Wallet loyalty cards can do today according to the platforms'
own documentation, so that the Loyalty concept and its architecture
promise nothing the platforms cannot deliver.

How it was gathered: the sandbox this was written in cannot open most
websites directly, so the facts below come from the official pages'
indexed text (Firecrawl search on developer.apple.com and
developers.google.com), one archived Apple guide fetched in full, the
local Human Interface Guidelines mirror in the repo
(.claude/skills/apple-design-skill/references/technologies/wallet.md, from
developer.apple.com/design/human-interface-guidelines/wallet), and web
search summaries for the 2026 platform announcements. Every claim below
names its source. Anything not confirmed on an official page is marked
"unverified".

Sources
- Apple, Wallet Passes, "Adding a Web Service to Update Passes"
  (developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes)
- Apple, Wallet Passes, "Register a Pass for Update Notifications",
  "Send an Updated Pass", "Unregister a Pass for Update Notifications"
- Apple, Wallet Passes, "Pass" (top level keys: barcodes, locations,
  maxDistance, relevantDates, expirationDate, storeCard, webServiceURL)
- Apple, Wallet Passes, "Distributing and updating a pass"
- Apple, Wallet Developer Guide (archive): "Pass Design and Creation",
  "Updating a Pass", "Distributing Passes"
- Apple, Human Interface Guidelines, "Wallet" (local mirror, 2026-07-10)
- Apple, "Getting Started with Apple Wallet" (developer.apple.com/wallet/get-started)
- Google, Wallet API, "REST Resource: loyaltyclass" and "REST Resource:
  loyaltyobject" (developers.google.com/wallet/reference/rest/v1/...)
- Google, Loyalty cards, "Trigger Push Notifications", "Update Passes
  Classes and Passes Objects", "Loyalty Template", "Customize Google Wallet
  Passes", "Google Wallet API FAQ"
- Google, Generic pass, "Issuing passes for web, email, SMS", "Key concepts
  and terminology", "Requesting publishing access"
- Web search summaries of WWDC 2026 Wallet coverage and Google I/O 2026
  Wallet coverage (secondary; marked unverified where used)

## 1. Apple Wallet passes

### Supported now (official documentation)

Pass creation
- A pass is a signed, zipped package (pass.json, images, manifest,
  signature). It is signed with a Pass Type ID certificate from the Apple
  Developer Program; "the pass type identifier must match the certificate
  used to sign the pass" and the team identifier must match the
  certificate's Team ID. (Archive guide, Pass Design and Creation.)
- Five pass styles; the one for loyalty is the **store card**: "for store
  loyalty cards, discount cards, points cards, and gift cards. If an account
  carries a balance, the pass usually displays it." Generic and the newer
  poster generic style are alternatives when store card does not fit. (HIG
  Wallet; archive guide.)
- Field areas: logo and logo text, header fields (visible when the pass is
  stacked), one primary field, secondary and auxiliary fields, footer,
  back fields. "In general, a pass can have up to three header fields, a
  single primary field, up to four secondary fields, and up to four
  auxiliary fields"; store cards with a square barcode can have up to four
  secondary and auxiliary fields combined. (Archive guide.)
- Images: icon 29x29 pt, logo 160x50 pt, strip 375x123 pt behind the
  primary fields (store card), thumbnail 90x90 pt, footer 286x15 pt,
  background 180x220 pt (blurred). Provide 1x, 2x and 3x. (Archive guide.)
- Colours: backgroundColor, foregroundColor (field values) and labelColor
  (field labels) as rgb() strings. (Archive guide.) The HIG asks for
  "sufficient contrast between background and text colors" and a pass that
  is "instantly identifiable" through brand colours and imagery.

Barcode and QR
- "Wallet supports QR, PDF417, Aztec, Code128, Code 39, Codabar, EAN-13,
  and Interleaved 2 of 5 (ITF) barcode formats" (Creating a generic pass,
  current documentation). QR, PDF417, Aztec and Code128 need no fallback on
  iOS 9 and later; watchOS does not show Code128. (Archive guide.) The
  `barcodes` array replaces the single `barcode` key; "the system uses the
  first displayable barcode for the device" (Pass reference).
- A member QR on a TapMart store card is therefore fully supported.

Distribution ("Add to Apple Wallet")
- Passes can be added from an app, from Safari (a .pkpass served with the
  MIME type application/vnd.apple.pkpass) and from Mail as an attachment.
  "Mail and Safari support passes in iOS 6 and later ... so you can use them
  to distribute passes by email or from a website." Apple provides an Add
  to Apple Wallet badge for websites and email and publishes guidelines for
  its use. (Distributing Passes; Distributing and updating a pass; HIG.)
- No app is required to issue or update a pass.

Updates
- Any field except the serial number and authentication token can be
  updated: "An updated pass is a new pass with the same pass type identifier
  and serial number." (Adding a Web Service to Update Passes.)
- Mechanism: the pass carries `webServiceURL` and `authenticationToken`;
  the device registers with the web service (device library identifier plus
  push token, scoped to pass type and serial number); when something
  changes the server sends an APNs push with an empty payload using the
  pass signing certificate; the device asks for changed serial numbers and
  then fetches the updated pass. Endpoints: POST /v1/devices/{device}/
  registrations/{passType}/{serial}, GET /v1/devices/{device}/registrations/
  {passType}?passesUpdatedSince, GET /v1/passes/{passType}/{serial}, DELETE
  registration, POST /v1/log. HTTPS is required. (Adding a Web Service to
  Update Passes; Register a Pass; Send an Updated Pass; archive guide.)
- Push notifications "are not guaranteed to be delivered" and "multiple push
  notifications from the same source are coalesced". (Archive guide.)

Notifications the customer sees
- A field may carry a `changeMessage`. "If the value of a field has changed
  and the field specifies a change message, the device shows the message to
  inform the user about the change." Otherwise the update is silent.
  (Archive guide.)
- Apple's rule: "Use change messages only for updates to time-critical
  information ... Never use a change message for marketing or other
  noncritical communication." (HIG Wallet.)
- Consequence for TapMart: "Reward ready" and "Reward redeemed" are
  legitimate field changes with a change message. A "special offer" or
  "new promotion" broadcast is not a permitted change message on Apple;
  it can only appear as updated pass content (for example a back field or
  an updated strip) that the customer sees when they open the pass.

Location relevance
- Up to ten `locations` and one relevant date; `maxDistance` caps the
  radius. For the store card style: relevant date "Not supported";
  locations "Required if relevance information is provided. Interpreted
  with a small radius. Relevant if any location matches." The system can
  then show the pass on the Lock Screen when the person is near the shop.
  (Pass reference; archive guide; HIG.)
- Up to ten beacon UUIDs are also supported. (Archive guide.)

Expiry and lifecycle
- `expirationDate` and `voided` control when Wallet hides a pass; "Wallet
  automatically hides expired passes". Always ask before deleting passes.
  (HIG; Pass reference.)

Devices
- Passes appear on iPhone and Apple Watch; Watch shows fewer fields and
  images. Do not put essential information in elements that may be
  unavailable on Watch. (HIG.)

### 2026 additions (announced; secondary sources, unverified here)

- WWDC 2026 coverage describes redesigned layouts for all pass styles
  including store cards, "Featured Actions" (quick actions on the card
  front, for example redeem or find the nearest location), four extra
  barcode formats in iOS 27, and Apple's Pass Designer app for building
  pass templates. The local HIG mirror (July 2026) already documents
  featured actions, semantic tags, poster generic passes and Pass Designer,
  so these are consistent with the official guidelines, but the exact
  behaviour of featured actions for store cards was not read from a primary
  page and stays "future" for TapMart planning.

### Future or requires additional work

- Apple Developer Program membership, a Pass Type ID and certificate, and a
  production APNs setup. TapMart would be the issuer for every business's
  cards (one pass type, one serial number per member card), or each
  business would need its own certificate. Issuer-of-record is a product
  and legal decision.
- A pass web service (registration, serial number listing, updated pass,
  logging) with HTTPS and token checks, plus certificate rotation.
- Watch-specific layout testing.
- Any "message to all members" concept is not an Apple change message.
  Supported shapes: update the pass content silently; or a time-critical
  field change such as "Reward ready". Marketing broadcasts would require
  another channel and are out of scope for Loyalty MVP.
- Relevance on the Lock Screen requires the business's location on the pass
  and cannot be more precise than the system's small radius.
- Featured Actions and the 2026 layouts: verify on a primary page before
  designing around them.

## 2. Google Wallet loyalty cards

### Supported now (official documentation)

Model
- A `LoyaltyClass` (the program: programName, programLogo, issuerName,
  hexBackgroundColor, heroImage, labels for account name and id, optional
  rewardsTier, textModulesData, linksModuleData, messages, merchantLocations,
  reviewStatus) and a `LoyaltyObject` per member (accountName, accountId,
  loyaltyPoints, secondaryLoyaltyPoints, barcode, state, validTimeInterval,
  messages, textModulesData, heroImage, merchantLocations). Class IDs and
  object IDs are `issuerId.identifier`. (loyaltyclass, loyaltyobject.)
- Points: `loyaltyPoints` has a label ("Points", recommended 9 characters or
  fewer) and a balance as string, int, double or money ("recommended maximum
  length is 7 characters"). `secondaryLoyaltyPoints` shows a second value
  such as "Rewards". (loyaltyobject.) Visits can be shown as the points
  balance with the label "Visits", or as a text module ("Visits: 3 of 5").
  The Loyalty Template page shows exactly where POINTS, REWARDS, MEMBER NAME,
  MEMBER ID, the barcode and the hero image sit in the default layout.
- Custom layout: `classTemplateInfo.cardTemplateOverride` arranges up to
  three items per row from predefined or text module fields. (Customize
  Google Wallet Passes.)
- Program name: "The app may display an ellipsis after the first 20
  characters." Account name and id: recommended 20 characters or fewer.
  (loyaltyclass, loyaltyobject.)
- Colour: `hexBackgroundColor`; if unset Google uses the dominant colour of
  the hero image, then of the logo. A wide logo variant exists. (loyaltyclass.)

Barcode and QR
- `barcode` (type and value, optional alternateText under the code) and
  `rotatingBarcode`; a QR is a supported type. If no barcode is set the
  accountId is shown. (loyaltyobject; Loyalty Template.)

Distribution ("Add to Google Wallet")
- Passes are issued through an "Add to Google Wallet" link:
  https://pay.google.com/gp/v/save/<signed_jwt>, usable on websites, in
  email and SMS, ideally behind the official "Add to Google Wallet" button.
  (Issuing passes for web, email, SMS.) No app is required.
- Prerequisites: a Google Wallet API issuer account, a service account to
  sign JWTs, classes in `reviewStatus: underReview` which Google approves,
  and publishing access: "Before you can issue passes that any user can
  save to their Google Wallet, you must be approved for publishing access."
  (Key concepts; Requesting publishing access; loyaltyclass.)

Updates
- PUT or PATCH on loyaltyclass (program-wide) or loyaltyobject (one
  member). "Businesses can update information on Google Wallet passes that
  customers have already saved." (Update Passes Classes and Passes Objects.)

Notifications the customer sees
- Two partner-triggered kinds, both documented on "Trigger Push
  Notifications" for loyalty cards:
  1. Add Message and Notify: `addMessage` with message type
     `TEXT_AND_NOTIFY` "adds a message to the pass details and triggers a
     push notification, directing users to the new message within Google
     Wallet."
  2. Update Field and Notify: PATCH or UPDATE with
     `notifyPreference: notifyOnUpdate` triggers a notification when an
     allow-listed field changes; for LoyaltyObject the supported fields are
     `loyaltyPoints.balance` and `secondaryLoyaltyPoints.balance`.
- Limits: "Both message and update notifications are limited to 3 per pass
  within a 24-hour period to prevent spamming." Google "may throttle your
  push notification delivery quota". Users must have Google Wallet
  notifications enabled. The FAQ's phrase "Developer authored push
  notifications are not currently supported" refers to free-form pushes;
  the two mechanisms above are the supported shapes.
- Nearby notifications: `merchantLocations` (maximum ten per class and per
  object) "will trigger a notification when a user enters within a
  Google-set radius of the point." The older `locations` field "is currently
  not supported to trigger geo notifications." (loyaltyobject, loyaltyclass.)
- Messages: up to ten `messages` on a class and ten on an object are shown
  in the pass details.

Lifecycle
- `state` (active, completed, expired, inactive) and `validTimeInterval`
  control display; an inactive object moves to "Expired passes".
  (loyaltyobject.)
- Smart Tap (NFC redemption) exists but needs certified terminals; not MVP.

### 2026 additions (announced; secondary sources, unverified here)

- Google I/O 2026 coverage describes live loyalty benefits (points earned,
  next reward, tier progress), improved nearby passes, post-tap loyalty
  enrolment and a pass upgrade flow. The loyalty object already carries
  the fields these rely on; treat the new surfaces as future until read on
  a primary page.

### Future or requires additional work

- Issuer account, service account key management, class review and
  publishing access approval (a review by Google before any real customer
  can save a card).
- A decision on issuer of record: TapMart as the single issuer with one
  class per business program is the simplest model and matches the
  architecture document.
- Message broadcasts count against the 3 per pass per 24 hours limit and
  are visible in pass details; treat "Send update" as at most one message
  per day per program in product rules.
- Smart Tap, rotating barcodes, linked offers, tiers: later.

## 3. What this means for the TapMart Loyalty concept

Supported on both platforms today, and therefore allowed in the concept
- A branded card with logo, business name, background colour, artwork
  (Apple strip or Google hero image), the reward title and the member's
  name.
- A member QR (or barcode) that the business scans at the counter.
- Progress on the card: Apple as a primary or secondary field ("3 of 5
  visits", "82 points"); Google as loyaltyPoints with label "Visits" or
  "Points" plus a text module for the reward requirement.
- Card state changes pushed to the phone: visit counted, points added,
  reward ready, reward redeemed. Apple shows a change message only where
  the field defines one and the change is time critical; Google notifies
  on balance changes when `notifyOnUpdate` is set, within 3 per 24 hours.
- "Add to Apple Wallet" and "Add to Google Wallet" from a web page after a
  short signup, with no app.
- A nearby reminder when the member is close to the business (Apple
  locations, Google merchantLocations), optional.
- Reward terms on the back of the pass (Apple back fields) or in text
  modules and links (Google).

Not allowed in the concept, or labelled as future
- Any text implying SMS, email or an app push from TapMart. The concept
  labels every business-side message as a "Wallet update".
- Marketing broadcasts on Apple; a "Special offer" or "New promotion" on
  Apple is an updated pass content, not an interruption. The concept shows
  the business the difference between "changes the card" and "notifies".
- Unlimited Google messages: the concept caps at one Wallet update per day
  and says so.
- "Pass issued" claims: the Design Lab simulates the add; nothing is signed
  or issued.
- Precise geofencing, tiers, Smart Tap, receipts, revenue.

## 4. Open items to verify on primary pages before production

- Apple featured actions on store cards and the 2026 store card layout.
- Whether Apple's 2026 "Pass Builder" tooling changes the web service
  requirements (unlikely; the update protocol above is unchanged in the
  current documentation).
- Google's live loyalty benefits fields, if any are new beyond
  loyaltyPoints, secondaryLoyaltyPoints and rewardsTier.
