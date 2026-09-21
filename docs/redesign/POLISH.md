# TapMart redesign: final UI and UX polish pass

Recorded 2026-09-21 on the redesign preview branch. The visual system
approved in docs/redesign/REPORT.md is unchanged: typography, glass,
photography, backgrounds, card style, motion, car presentation, red
accent, navigation and the landing page all stay. This pass makes the
product simpler to read without removing a function.

## 1. Copy

Visible sentence strings in the diff: 323 removed (1,851 words), 247
added (888 words), so roughly half the words on the touched screens are
gone. Page subtitles that explained the page were removed on Home,
Activity, Earnings, Business Home, Campaigns, Brand kit, Connections and
Business details. Examples of the shortening rule:

| Before | After |
| --- | --- |
| Find paid work / Available near you · Raleigh | Hi, Devon / Raleigh, NC |
| Your work, from accepted to paid. | (removed) |
| Approved work, the fee, what is yours. | (removed) |
| Pending · not yet released / Lifetime · earned on TapMart | Pending / Lifetime |
| Transactions: Gross, fee and what you keep | History |
| Gross / TapMart fee / You keep | Gross / Fee (15%) / Yours |
| Post the Story and send proof | Post the Story |
| Film and upload your version | Film your version |
| Upload a photo of the car | Send car photo |
| Waiting for the business | Waiting |
| Approve and pay $75.00 / Request changes | Approve $75.00 / Revise |
| Decide on 3 submissions. Creators and drivers are waiting on you. | 3 submissions [Review] |
| Find people and cars / See all people | People and cars / All people |
| View person / View car | View |
| Create a campaign | New campaign |
| Add the reference, Your campaign brief, Pay per approved video, How many approved videos, Deadline and city, Publishing credit, Ready to publish | Reference, Campaign, Pay, Creators, When and where, Credit, Review |
| Edit profile: Display name, "What businesses and other creators see..." | Name, (removed) |
| Share and earn: five long step descriptions | Five one line steps |

Settings, campaign detail, submission review, plan, team, loyalty, car
booking and vehicle verification copy were cut to one line each.

## 2. Icon based actions

- Approve (check circle, filled), Reject (x circle, inside More), View
  profile (user), Open original (link), Download (download) on the
  submission review screen. Primary, secondary and a "More" menu
  (`src/ds/Menu.tsx`) replace the three inline buttons.
- Edit profile is a pencil plus "Edit"; Settings is the gear; Save is
  the bookmark on every opportunity card with a tooltip; Search,
  Messages and Notifications in the top bar carry tooltips; the
  identity button shows "Settings".
- Every settings row carries its icon: profile, verification,
  portfolio, public page, Instagram, car, saved, bell, wallet, lock,
  shield, document, help, storefront, connections, Google, palette,
  team, credit card, sign out.
- Notification kinds are switches with an icon each.
- Icon sizes normalised to 16, 20 and 24 across 51 files; icon buttons
  are 32, 40 or 48px with an accessible name and, on desktop pointers, a
  `data-tip` tooltip.

## 3. Standardised between Creator and Business

- Buttons 32 / 40 / 48; icon buttons 32 / 40 / 48; radii 12 (controls,
  rows, inputs), 20 (cards), 28 (sheets); icons 16 / 20 / 24. The
  tokens live in `src/app/globals.css`; `frame-shift.css` and
  `src/ds/app.css` now use the same values.
- Page title 28px on the phone, 34px on the desktop; section 20 to 24;
  card title 17; body 14 to 16; meta 12 to 14. Huge editorial sizes stay
  on the marketing site only.
- Status chips share one vocabulary and colour set (`STATUS_LABEL` in
  `src/ds/ui.tsx`): Open, Live, Full, Submitted, In review, Revision,
  Approved, Paid, Scheduled, Posted, Needs review.
- Cards: image, kind chip, pay, title, one metadata row, at most two
  requirement chips, status chip and one action, on Home, People, Cars
  and Campaigns.
- Settings use one primitive set (`SettingsGroup`, `SettingsRow`,
  `NotificationSwitch`, `IdentitySwitch`, `SignOutRow`) in both apps;
  the creator page moved into the same frame as the business page.
- Empty states: title, one line, one action.
- The "More" menu, tooltip, chip row (`ap-chips`, quiet variant for a
  secondary row) and compact attention row (`ap-row`) are shared.

## 4. Settings

Both apps: grouped rounded cards with an uppercase group title and rows
of [icon] Label, an optional current value or status on the right and a
caret. Groups: Account; Creator or Business; Notifications; Payments;
Privacy and security; Support; then "Use TapMart as" and Log out. No
description under rows; the Notifications screen is a list of switches.
Account, Security and Notifications subpages return to the right
Settings for the current identity.

## 5. Mobile fitment (375, 390, 393, 430)

- Opportunity card: the two column facts block and the long sentence
  are gone; the one metadata row truncates instead of wrapping.
- Campaign card: stat labels no longer wrap ("Left", "Per video").
- Business Home: the four attention tiles became one compact row per
  item plus four overview tiles; the long recommendation card only
  shows when nothing needs attention.
- Submission review: Approve, Revise and More fit on one line at 375.
- Settings rows are 52px with the value truncating at 44vw.
- Earnings hero: value first, then "Available"; metrics are one word.
- Bottom navigation never covers the last row: page padding was kept and
  full page checks at every width found no horizontal overflow.

## 6. Desktop fitment (1024, 1280, 1440, 1728)

- Sidebar create action reads "New campaign".
- Settings sit in a 640px column with the identity switch beside it.
- Submission review keeps the source wide and the decision narrow; the
  action row does not wrap at 1024.
- Card grids keep their max width; no stretched cards at 1728.
- Tooltips appear for icon only controls after a short hover.

Tablet (768, 820, 1024): 768 and 820 use the phone shell (top bar and
floating tab bar) on purpose; the sidebar starts at 1024.

## 7. Screens manually reviewed

Creator: Home, Opportunity detail (Recreate, Story, Car), Activity,
Earnings, Cars, Share, Profile, Edit profile, Settings, Notifications.
Business: Home, Campaigns, Campaign detail, Submission review, Create
(chooser and Recreate step 1), Content, Calendar, Loyalty, Brand kit,
Profile, Settings, Plan, Billing, Team, Messages, Alerts. Public:
Landing, Sign in, Sign up.

## 8. Tests

See the final report in the conversation for the numbers of this run:
typecheck, eslint, vitest, production build, local sweep at ten widths
and the preview sweep at 390, 430 and 1440.

## 9. Preview

https://marketing-app-git-claude-install-design-e46ce2-z-skiis-projects.vercel.app
(isolated preview environment, demo accounts only).
