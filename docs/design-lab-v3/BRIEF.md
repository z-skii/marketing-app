# V3 brief: TapMart Loyalty, designed in from the beginning

The founder's brief, recorded 2026-09-17. Loyalty is included in the new
TapMart exploration now so that the Business experience, navigation, the
public website, the attribution model and the product architecture all
account for it. V3 is the V2 Open Cut exploration carried forward, plus
Loyalty; the V2 Lab at /design-lab-v2 stays untouched as the record of
the approved direction work.

## What must not happen

No real production Loyalty backend. No production routes. No live database
change. No production migrations. No Apple Wallet API integration. No
Google Wallet API integration. No real notification delivery. No change to
the live TapMart UI. Everything stays inside /design-lab-v3 and its
supporting V3 documentation and code.

## What to build now

A complete interactive Loyalty product concept, coded enough to click
through and understand exactly how the finished product would work, at
/design-lab-v3/business/loyalty and the supporting V3 demo routes.

## The MVP product

A business creates a loyalty program. Two kinds only: visits or stamps
("Buy 5, get the 6th free") and points ("1 point per qualifying purchase,
100 points = reward"). No tiers, no complicated coupons, no enterprise
features.

## The creation flow (premium)

1. Program: visits or stamps, or points.
2. Reward: reward name, requirement, optional terms.
3. Card design: a realistic Wallet card preview; the business controls
   logo, business name, brand colours, background or artwork and the
   reward title; an Apple Wallet concept and a Google Wallet concept as
   Design Lab representations only, never claiming a real pass was issued.
4. Signup: the customer acquisition experience. The business receives a
   QR; the customer scans; a very short signup (first name, phone or
   email; only what is needed); then Add to Apple Wallet and Add to Google
   Wallet as simulated V3 actions.
5. Launch: QR, shareable signup link, print or download QR concept,
   program status.

## Business Loyalty Home

A real Loyalty dashboard, visual and simple, not another analytics SaaS
dashboard. Quickly: Members, Repeat visitors, Rewards ready, Rewards
redeemed. Then recent customers, program progress, campaign attribution,
quick actions. Potential primary actions: View QR, Add visit, Send update,
Edit reward, Members. Astra decides the final hierarchy.

## Members

Member list, member detail, reward progress ("Sara, 4 / 5 visits, Joined
from Jasmine, Story campaign" or "82 / 100 points"). Only measurable facts.

## Recording a visit or reward

Scan a member QR or search a member, then Add visit or Add points.
Extremely fast: scan, the customer appears, +1 visit, progress updates;
reward available, Redeem. No POS integration for the MVP.

## Customer Wallet experience

A beautiful simulated Wallet card state: business, reward progress,
current visits or points, reward status. States: 3 of 5 visits, Reward
ready, Reward redeemed, Updated offer. Aligned with what Apple Wallet and
Google Wallet can realistically support.

## Notifications and updates

The business-side concept for Reward ready, Special offer, New promotion,
Milestone, labelled correctly as Wallet update or notification. Never
imply SMS, push or a customer app unless TapMart implements it later.

## Attribution is critical

Source attribution is architected now. A loyalty signup may have a source
type, source campaign, source creator, source link or QR and a signup
timestamp. Source types: RECREATE, STORY, CAR, DIRECT_CREATOR_REQUEST,
TAPMART_LINK, BUSINESS_QR, ORGANIC. TapMart connects Campaign, Creator,
Customer signup, First visit, Repeat visit, Reward, Redemption.

## Business attribution view

One beautiful attribution experience, not a spreadsheet: "Jasmine, Story
campaign: 34 joined, 11 came back, 6 redeemed", or a visual descent
34 Joined, 11 Returned, 6 Redeemed. The business immediately understands
which campaign or creator creates repeat customers. Never revenue unless
TapMart has verified transaction data.

## Public website

Loyalty becomes part of the business story: GET ATTENTION (Recreate,
Story, Car), TURN THEM INTO CUSTOMERS (Wallet loyalty signup), BRING THEM
BACK (visits, rewards, Wallet updates). One of the strongest visual
sequences on the site, very little copy, motion: Story campaign, customer
taps, QR or signup, Wallet card appears, progress changes, reward
unlocked. Astra creates something stronger if possible.

## Business Home

Loyalty exists naturally in the new Business experience without another
primary navigation item by default. Astra decides whether Loyalty belongs
inside Business, as a prominent business tool, inside a Growth area, or
another simple structure. Easy to find, navigation not crowded.

## Architecture now, backend later

docs/design-lab-v3/LOYALTY_ARCHITECTURE.md documents the future
production model (loyalty_programs, loyalty_members, loyalty_rewards,
loyalty_member_progress, loyalty_events, loyalty_attribution,
wallet_passes, wallet_updates, improved where useful), each with purpose,
fields, relationships, MVP and future; an append-only event model
(SIGNUP, VISIT, POINTS_ADDED, REWARD_UNLOCKED, REWARD_REDEEMED,
WALLET_ADDED, WALLET_UPDATED, and CAMPAIGN_CLICK when a trustworthy link
event exists); attribution rules (preserve the first known TapMart
acquisition source, never overwrite it, multi-touch separate and later);
and privacy (required and optional customer data, what the business sees,
what creators must not see: creators get aggregate counts only, never
names, emails or phone numbers).

## Wallet research

docs/design-lab-v3/WALLET_RESEARCH.md verifies, from official platform
documentation where possible, pass and card creation, barcode and QR
support, updates, notifications, location relevance, supported fields,
program progress and limitations, separating SUPPORTED NOW from FUTURE or
REQUIRES ADDITIONAL WORK. No unsupported behaviour is promised.

## No production backend

Local fixture and mock state only: member signup, adding visits, reward
unlocking, redemption, wallet added and campaign attribution are
simulated. Nothing writes to production or creates Supabase tables.

## Astra review

Astra reviews Loyalty as seriously as the other V3 experiences: Business
Loyalty Home, program creation, the Wallet card creator, customer QR
signup, member progress, attribution and the public site sequence,
asking: does this feel like a natural part of TapMart; does it strengthen
the business value proposition; can a business understand it quickly;
does it feel consumer quality rather than SaaS admin; does attribution
feel powerful without becoming fake analytics.

## The final deliverable (twenty items)

1. Where Loyalty lives in Business navigation. 2. Loyalty overview desktop.
3. Loyalty overview mobile. 4. Create-program flow. 5. Wallet card
designer. 6. Customer QR. 7. Customer signup. 8. Simulated Apple Wallet
state. 9. Simulated Google Wallet state. 10. Member list. 11. Member
detail. 12. Add-visit interaction recording. 13. Reward-unlock
interaction. 14. Attribution view. 15. Public homepage Loyalty animation.
16. Future backend architecture. 17. Wallet capability research.
18. Privacy model. 19. MVP versus later features. 20. Astra's final
Loyalty verdict.

Nothing migrates into production. The work stops and waits for approval.
