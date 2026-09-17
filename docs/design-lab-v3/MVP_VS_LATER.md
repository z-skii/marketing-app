# TapMart Loyalty: MVP versus later

Recorded 2026-09-17 for the V3 Design Lab. What the concept shows and the
first production stage would build, against what is deliberately left for
later. Companion documents: LOYALTY_ARCHITECTURE.md, PRIVACY.md,
WALLET_RESEARCH.md, LOYALTY_DIRECTION.md.

## MVP

Program
- One live program per business: visits or points. Program type is fixed
  after launch.
- One qualifying purchase counts per business day (America/Chicago in the
  fixture, the business's own time zone in production).
- Visits: 2 to 50 visits to a reward. Points: one point per qualifying
  purchase, 2 to 10,000 points to a reward. No spend calculation, no
  staff balance editor.
- One active reward definition, versioned on edit. Earned instances keep
  their version; unfinished cycles keep their original requirement.
- Extra progress while a reward waits is retained toward the next reward.

Card
- Logo, business name, Google program name (20 characters), card colour,
  text colour, label colour with contrast validation, artwork with crop,
  reward title. Apple Wallet store card concept and Google Wallet loyalty
  card concept with platform-realistic fields.

Acquisition
- Counter QR and a shareable signup link. Creator-specific links minted per
  accepted campaign (Story sticker, Recreate caption, Car placement QR).
- Public signup: first name, email or phone, agreement. No account, no app.
- Add to Apple Wallet and Add to Google Wallet from the signup page.
  Production requires the issuer setup in WALLET_RESEARCH.md; the lab
  simulates the add.

Counter
- Scan the member QR or search by name or contact; +1 visit or Add 1
  point; reward ready; Redeem with confirmation; same-day attempts recorded
  and uncounted; Next customer.

Business surfaces
- Loyalty row on the Business profile and one quiet strip on Business Home.
- Loyalty Home: Members, Repeat visitors, Rewards ready, Rewards redeemed;
  recent customers; the program; the leading source; View QR, Members,
  Send update.
- Members list and detail; program page with edit sheets; QR page with a
  printout; updates history and composer.
- Attribution: the whole-program descent and per-source descents on one
  scale; source details; View members.

Wallet updates
- Automatic: visit counted, points added, reward ready, reward redeemed.
- Business authored: Special offer, New promotion, Milestone, one per
  program per day, to members with a simulated saved Wallet.
- Google notifying requests capped at three per pass per rolling 24 hours,
  visit and unlock coalesced; at the cap, content updates without a
  notification request.

Documentation
- Architecture, privacy, Wallet research, this list, the report.

## Later

- Multiple programs, tiers, streaks, birthdays, points expiry, complex
  coupons, choice rewards, time-limited rewards, scheduling.
- Counter PIN mode, multiple locations, per-location counts, staff roles.
- Nearby Wallet reminders (Apple locations, Google merchantLocations) once a
  business opts in and its address is verified.
- Reversals and corrections interface (the events already allow it).
- Declared attribution and multi-touch views built from the event history.
- Verified contact (one-time code) and secure card recovery.
- Creator aggregate analytics: joined, came back, redeemed for their own
  links, never identities.
- POS integration, receipt scanning, Smart Tap, NFC, rotating barcodes.
- Revenue or value reporting, only if verified transaction data exists.
- Apple featured actions and the 2026 layouts, once verified on a primary
  page.
- The production issuer decision (TapMart as the single issuer with one
  Apple pass type and one Google class per program is the recommended
  model), certificates, the pass web service, APNs, Google publishing
  access.
