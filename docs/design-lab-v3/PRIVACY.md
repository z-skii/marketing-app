# TapMart Loyalty: privacy model

Recorded 2026-09-17 for the V3 Design Lab. The Loyalty architecture
collects the minimum a loyalty card needs and draws a hard line between
what a business sees and what a creator sees. Companion documents:
LOYALTY_ARCHITECTURE.md (entities and events), WALLET_RESEARCH.md (what
the Wallet platforms carry).

## What is collected

Required from a customer
- First name (1 to 40 characters).
- One contact: an email address or a phone number with a country code.
  It exists so the person can be told apart at the counter and, later,
  recover their card. It is not a marketing channel: the MVP sends no SMS,
  no email and no app push, and the signup says so.
- Agreement to the program terms and privacy notice, with the version and
  time of agreement.
- A member code: an opaque identifier printed as the member QR. It is not
  the contact, not the signup QR and not guessable.

Never collected in the MVP
- Surname, username, password, birthday, address, photos, location,
  purchase amounts, receipts, device identifiers, social accounts.
- A "How did you hear about us" declaration. Attribution comes only from a
  registered link or QR resolved server side.
- Marketing consent for channels TapMart does not run.

Kept by the business's program
- The member's first name, masked contact, member code, progress, counted
  and uncounted events, earned and redeemed rewards, Wallet state
  (save opened, save confirmed, removed), the immutable acquisition source.

## Who sees what

The business (its team members)
- First name, masked contact (the last two digits of a phone or a masked
  email such as •••@example.test), progress, visit history with dates,
  earned and redeemed rewards, Wallet state, the acquisition source
  (creator, campaign, counter, TapMart link or "Source not tracked").
- Not the full contact. The MVP collects no permission to contact the
  customer, so no Contact action exists. Counter lookup uses the masked
  contact and the first name.
- No export, no CRM, no customer directory.

Creators
- Nothing about individual members. No names, contacts, timestamps, member
  lists or drill-downs, in any product surface, API response or export.
- Future creator analytics may show aggregate counts for the creator's own
  links only: joined, came back, redeemed per campaign. The creator API
  never joins loyalty_members.

TapMart staff
- What the business sees, behind a support role, with every access logged.

The Wallet card
- Carries the business's branding, the member's first name, the member ID,
  progress and the reward. Terms live on the back or in details. No
  contact details are printed on the pass.

Public pages
- The signup page shows the business, the reward, the rule and the source
  acknowledgment ("From Jasmine's Story", "Join at the counter"). It never
  shows other members.

## Rules the product enforces

- One member per program per normalised contact. A second signup with the
  same contact returns to the existing card without creating a new member
  or a new attribution. Before production, that return path needs verified
  possession of the contact or an authenticated handoff; typing someone
  else's contact must never reveal their QR or history. The lab marks this
  as a lab-only shortcut.
- The acquisition source is written once at signup and never overwritten.
  A later touch is a separate event ("Also reached through"), never a
  reassignment.
- Same-day attempts are recorded as uncounted and never inflate returns.
- Deletion: on request the member row is anonymised (name and contact
  removed, code rotated); events stay for counts; attribution counts stay
  aggregate. Blocking stops progress without deleting history.
- Location: the business address is stored for Wallet relevance only if
  the business turns nearby reminders on (later). Customer location is
  never collected.
- Nothing in the Design Lab is stored: entered details live in the browser
  until reload and are never sent to a server.

## What the customer is told

At signup: "Design Lab · Simulated signup", "Use fictional details only",
"Used to find your card at the counter. No texts or emails.", the demo
program terms and the demo privacy notice. In production the same
sentences lose "demo" and gain the real terms.
