# Design: Business Settings

**Concept.** Business Settings becomes a dense, premium graphite utility screen: current business context first, then short grouped rows for account, business setup, identity switching and session actions. It removes dashboard noise and keeps every complex flow one tap deeper while still showing the real state that matters: email, connection health, brand kit, plan, public URL and current identity.

**Three seconds.** This is settings for the current business, the important setup states are visible in the rows, and the user can switch who they are acting as or log out from the bottom section.

**Layout.** Phone 390px: root background #090c0e with radial-gradient(circle at 50% 0%, rgba(43,55,58,0.42) 0%, rgba(9,12,14,0) 340px). Fixed top bar 56px. Scroll region x=0 y=56 w=390, content x=16 w=358, top padding 14px, section gaps 24px, bottom padding 24px. Groups are one rounded list surface each, not separate cards per row. Desktop 1360px: fixed rail x=0 w=88, workspace x=88 w=1272, page background same wash. Header x=120 y=0 w=1148 h=72. Main grid x=120 y=96 w=1148 with left settings column 760px, gap 28px, right identity/session column 360px sticky top 96px.

## moved deeper

- Account editing, email change and personal profile details move into the Account settings page.
- Notification channels and toggles move into the Notifications settings page.
- Password, sessions and security controls move into the Security settings page.
- Business category, city, public profile fields and verification details move into Business details.
- Per-provider OAuth details, reconnect actions and Google attention items move into Connections.
- Brand kit research sources, logo, colors, type, photo style, voice and approvals move into Brand kit.
- Invoices, payment method, subscription management and plan changes move into Plan and billing.
- Public page preview and share/copy controls move into Public page.
- Identity switch confirmation, if needed because of unsaved work, appears as a bottom sheet on phone and dialog on desktop.
- Log out confirmation moves into a destructive confirmation sheet/dialog.

## visual hierarchy

- Current business name and category/city at the top, so the user knows which business these settings affect.
- Short grouped rows with right-side status badges, especially Connections, Brand kit and Plan status.
- Use TapMart as identity list, then the destructive Log out action at the end.

## content order

- **Phone detail top bar**: Canvas width 390px. Fixed at top, x=0 y=0 w=390 h=56, transparent over page at scrollTop 0 and glass-top-bar-scrolled after 12px scroll. Left back icon button x=8 y=6 w=44 h=44 using icon-button-transparent, chevron-left 22px #f5f7f2. Center title 'Settings' at x=96 w=198, 16px/20px weight 760 #f5f7f2, vertically centered. Right slot empty, but reserve no visible control.  [56px fixed]
- **Current business heading**: Scroll content starts below top bar with 16px side padding and 14px top gap. Block x=16 w=358 h=66. Title line y=0: current business name, 23px/29px weight 800 letter -0.45px #f5f7f2, max 1 line with ellipsis. Subtitle line y=32: business category and city formatted '{category} · {city}', 14px/18px weight 500 #9ca4a7, max 1 line. If either value is missing, show only the real available value; if both are missing, show 'Business'. No card, no border, no CTA.  [66px]
- **Account section**: Top gap 24px after heading. Section label x=16 h=15 text 'ACCOUNT', 12px/15px weight 760 uppercase letter 1.4px #9ca4a7. 10px below label, list container x=16 w=358 h=174, radius 20px, fill #121719, overflow hidden, shadow none. Three rows, each h=58, fill transparent, pressed fill #20282c, dividers 1px rgba(255,255,255,0.08) from x=69 to x=345 after rows 1 and 2. Row anatomy: leading icon tile x=13 y=rowTop+7 w=44 h=44 radius 14 fill rgba(255,255,255,0.06), icon 20px #c8cecf; title x=69 y=rowTop+11, 14px/18px weight 700 #f5f7f2; subtitle x=69 y=rowTop+31, 12px/16px weight 500 #9ca4a7; trailing chevron x=327 y=rowTop+20 18px #9ca4a7. Row 1 icon UserRound, title 'Account', subtitle account email. Row 2 icon Bell, title 'Notifications', subtitle real notification summary if available, otherwise 'Preferences'. Row 3 icon ShieldCheck, title 'Security', subtitle 'Password and sessions'.  [199px]
- **Business section**: Top gap 24px after Account section. Section label x=16 h=15 text 'BUSINESS', same section-label styling. 10px below label, list container x=16 w=358 h=348, radius 20px, fill #121719, overflow hidden. Six rows, each h=58, dividers from x=69 to x=345 after rows 1 through 5. Row 1 Store icon, title 'Business details', subtitle '{category} · {city}', trailing chevron. Row 2 Link2 icon, title 'Connections', subtitle 'Instagram {state} · Google {state}' using real states shortened to Connected, Not connected or Needs reconnect; trailing before chevron shows one compact status: attention-badge '{n} issue' or '{n} issues' if needsAttentionCount > 0, otherwise ready status 'Connected' only if both providers are connected, needs-reconnect status if any provider needs reconnect, otherwise not-connected status. Row 3 Palette icon, title 'Brand kit', subtitle real brand kit state label such as Ready, Pending, Needs review or Not set; trailing status maps to ready, pending, review or not-connected. Row 4 CreditCard icon, title 'Plan and billing', subtitle plan name, trailing status text from plan status mapped to active, pending, error or done; chevron. Row 5 Users icon, title 'Team', subtitle 'Coming later'; disabled styling: title #6f777a, subtitle #6f777a, icon #6f777a, tile fill rgba(255,255,255,0.035), no chevron, no pressed state. Row 6 Globe icon, title 'Public page', subtitle public page URL, trailing external-link icon 18px #9ca4a7 instead of chevron.  [373px]
- **Use TapMart as section**: Top gap 24px after Business section. Section label x=16 h=15 text 'USE TAPMART AS'. 10px below label, identity list container x=16 w=358, height = 66px multiplied by identity count plus 58px for Add business, radius 20px, fill #121719, overflow hidden. Identity rows repeat for every real identity in the list, h=66. Leading avatar/logo x=13 y=rowTop+9 w=48 h=48 radius 999px; use real image/logo if available, otherwise initials centered on #171d20 with 16px/20px weight 700 #f5f7f2 and border 1px rgba(255,255,255,0.08). Text x=75: identity name y=rowTop+13, 14px/18px weight 700 #f5f7f2, max 1 line; type y=rowTop+33, 12px/16px weight 500 #9ca4a7, exactly 'Personal' or 'Business'. Current identity row fill #1b2225; trailing text x=280 y=rowTop+24, 'Current', 12px/15px weight 760 #c9ff38. Non-current identity rows are tappable, pressed fill #20282c, trailing tertiary text button x=282 y=rowTop+11 w=63 h=44, label 'Switch', 14px/17px weight 700 #c8cecf. Dividers 1px rgba(255,255,255,0.08) from x=75 to x=345 between all identity rows and before Add business. Add business row h=58, leading plus tile x=13 y=rowTop+7 w=44 h=44 radius 14 fill transparent, plus icon 20px #f5f7f2; title x=75 y=rowTop+20 'Add business', 14px/18px weight 700 #f5f7f2; trailing chevron x=327 y=rowTop+20 18px #9ca4a7; pressed fill #20282c.  [dynamic: 25px + 66px per identity + 58px add row]
- **Session section**: Top gap 24px after identity section. Section label x=16 h=15 text 'SESSION', 12px/15px weight 760 uppercase letter 1.4px #9ca4a7. 10px below label, standalone row x=16 w=358 h=58 radius 16px fill #121719, pressed fill rgba(255,107,107,0.08). Leading icon tile x=13 y=7 w=44 h=44 radius 14 fill rgba(255,107,107,0.10), LogOut icon 20px #ff6b6b. Title x=69 y=20 'Log out', 14px/18px weight 700 #ff6b6b. No subtitle. Tapping opens confirmation sheet. Scroll content ends with 24px bottom padding because phone bottom nav is not shown on this detail route.  [83px]

## media

- No campaign imagery, Recreate, Story or Car advertising demo images appear on this utility screen.
- Identity avatars use real user photo or business logo when available at 48x48px, radius 999px, object-fit cover, border 1px rgba(255,255,255,0.08).
- If no real avatar/logo exists, render an honest initials circle on #171d20; do not use placeholder illustrations, generated logos or decorative icon art.
- Row leading icons are utility icons, not media: Lucide Rounded or equivalent, 20px, stroke 1.75px, #c8cecf inside a 44x44 graphite tile.

## navigation

Phone uses phone-top-bar-detail with a back button and centered 'Settings' title; no phone bottom navigation on this settings detail route, so the utility list has full height and no row is obscured. Desktop uses the fixed 88px collapsed left rail, active Business rail item, lime Create campaign rail button, and no bottom navigation; the Settings page header lives in the desktop workspace.

## animation

- Route reveal: page-reveal, 180ms cubic-bezier(0.22,1,0.36,1), opacity 0 to 1 and translateY 6px to 0; stagger sections 35ms, max 5 items.
- Rows and identity switch targets: tap-press, 100ms ease-out scale 1 to 0.985, return 140ms ease-out; pressed fill appears for the same duration.
- Phone logout sheet: sheet-enter 260ms cubic-bezier(0.22,1,0.36,1), scrim opacity 0 to 1 and sheet translateY 18px to 0; exit 220ms ease-in.
- Desktop logout confirmation: dialog-enter 280ms cubic-bezier(0.22,1,0.36,1), scale 0.96 to 1 and opacity 0 to 1.
- After a successful identity switch, show toast above the bottom safe area on phone or bottom-left of workspace on desktop for 2200ms; check icon uses success-pop 420ms once.
- Loading skeleton for rows: 220ms linear shimmer rgba(255,255,255,0.03) to rgba(255,255,255,0.07), max 2 seconds before honest loading or error text.

## typography

- Top bar title: 16px/20px, weight 760, #f5f7f2, letter -0.1px.
- Phone current business title: 23px/29px, weight 800, #f5f7f2, letter -0.45px.
- Desktop page title: 30px/36px, weight 820, #f5f7f2, letter -0.8px.
- Header subtitle and row secondary text: 12px/16px or 14px/18px as specified, weight 500, #9ca4a7.
- Section labels: 12px/15px, weight 760, uppercase, letter-spacing 1.4px, #9ca4a7.
- Row titles: 14px/18px, weight 700, #f5f7f2; disabled row title #6f777a; destructive row title #ff6b6b.
- Status text: 12px/15px, weight 650; success #9ded62, warning #ffcc66, neutral #9ca4a7, error #ff6b6b, current identity #c9ff38.
- Switch tertiary label: 14px/17px, weight 700, #c8cecf.
- Button labels in confirmation sheet/dialog: primary/destructive 15px/18px, weight 800.

## desktop

- 1360px canvas: left rail x=0 y=0 w=88 h=100vh, fill #0d1113, border-right 1px rgba(255,255,255,0.08), padding 18px 12px. Logo mark 44x44 at top. Business mode rail items stack below with Home, Content, Create, Campaigns, Business; Business is active with fill rgba(201,255,56,0.12) and icon/text #c9ff38. Create is the lime desktop-create-campaign-button. Bottom rail account/mode switcher uses current identity avatar/initials 44x44.
- Workspace x=88 w=1272 min-height 100vh, background #090c0e with radial wash. Header x=120 y=0 w=1148 h=72: back icon button x=0 y=14 w=44 h=44; title 'Settings' x=56 y=13, 30px/36px weight 820 #f5f7f2; subtitle current business name x=56 y=47, 12px/16px #9ca4a7. No right-side action.
- Main content grid x=120 y=96 w=1148. Left column w=760 contains the current business heading as bare text at top, then Account section and Business section using the same row anatomy but row height 60px, list radius 20px, leading tile x=14 w=44, title x=72, chevron x=728. Section labels and spacing match phone.
- Right column x=908 y=96 w=360 is sticky. First block: 'USE TAPMART AS' label, then identity container w=360 with 66px identity rows and 58px Add business row. Current row fill #1b2225; non-current rows hover with desktop-row-hover, translateX 2px and fill #1b2225. Switch is a 44px tertiary text target aligned right.
- Desktop Session block sits 24px below identity container in the right column: label 'SESSION', then Log out row w=360 h=58 radius 16. Logout opens a centered dialog w=420 radius 22 fill #121719 with modal scrim rgba(0,0,0,0.58), title 'Log out?', one 13px/18px muted sentence, destructive button 'Log out' and secondary button 'Cancel'.
- Desktop does not stretch settings rows beyond 760px. The side identity column makes use of width while keeping row scan length short and matching the phone grouping language.

## empty states

- Whole screen loading: keep top bar/header visible; render each row as a 44px icon skeleton and two text-line skeletons inside the real group containers for up to 2 seconds, then show an honest error row if data cannot load.
- Missing account email: Account subtitle becomes 'Email unavailable' in #9ca4a7; row still opens Account if permitted.
- Missing business category or city: show whichever real value exists; if neither exists, Business details subtitle becomes 'Add business details'.
- Connections with no providers connected: subtitle 'Instagram not connected · Google not connected'; trailing not-connected status. No fake handles or imported accounts.
- Connections needing attention: subtitle uses real provider states and trailing attention-badge with the real count; if count is zero, do not show an attention badge.
- Brand kit not started: subtitle 'Not set'; trailing not-connected style. Tapping opens Brand kit setup.
- No plan data: Plan and billing subtitle 'Plan unavailable'; trailing neutral status 'Review' only if the backend marks an action required, otherwise no status chip.
- Team: always disabled until the feature exists; text 'Coming later' and no tap action.
- No public page URL: subtitle 'Public page not created'; trailing chevron opens Public page setup instead of external-link icon.
- Only one identity: identity list shows that single current identity and the Add business row; no fake businesses are shown.
- Logout network failure: keep the user on the screen and show toast 'Could not log out. Try again.' using toast styling.

## cards and rows

- The current business heading is bare text, not a card, because it is context rather than an object to act on.
- Account and Business are grouped list surfaces: one rounded #121719 container per section with dividers inside. This reduces the current stack of separate heavy cards and makes the screen feel like premium utility UI.
- Each setting is a settings-row, not a paragraph card. The row carries only icon, title, one real value/status, and a chevron or external-link icon.
- Identity switching uses rows inside one list container because each identity is a selectable object. The current identity uses surface-3 fill, not a loud badge or border.
- Team is a disabled row, not an empty card, because the only honest state is 'Coming later'.
- Log out is a standalone destructive row at the bottom and only becomes a destructive button inside the confirmation sheet/dialog.
- No media cards are used; this screen is about account utility, not opportunity discovery.

## implementation

- 1. Build the Business Settings route with the page background #090c0e, radial top wash, phone detail top bar, no phone bottom nav, and desktop left rail active on Business. (Business Settings shell)
- 2. Create one reusable grouped settings list pattern: container #121719 radius 20, overflow hidden, 58px phone rows, 60px desktop rows, internal dividers aligned after the 44px leading icon tile. (Settings row system)
- 3. Render the current business heading from real business name, category and city; use fallback copy only for missing fields as specified. (Top of phone scroll content and desktop header/left column)
- 4. Render Account rows for Account, Notifications and Security with the exact icons, text, subtitles, chevrons and navigation actions. (Account section)
- 5. Render Business rows for Business details, Connections, Brand kit, Plan and billing, Team and Public page; map provider, brand kit and plan states to the specified status colors and badges. (Business section)
- 6. Render the identity list from the real identities array, marking the current identity with surface-3 fill and 'Current'; make all non-current rows and their Switch text target call the existing identity switch action. (Use TapMart as section)
- 7. Render Add business as the last identity-list row and wire it to the existing Add business flow. (Use TapMart as section)
- 8. Move Log out to the final Session section and require confirmation: phone bottom sheet, desktop centered dialog, destructive 'Log out' action and secondary 'Cancel'. (Session section and confirmation UI)
- 9. Implement desktop composition at 1024px and above: 88px rail, workspace padding 32px, header 72px, left column 760px, right sticky column 360px with identity/session blocks. (Responsive layout)
- 10. Add page reveal, tap press, desktop row hover, loading skeletons, toast feedback for identity switch/logout failure, and keyboard focus ring 2px #c9ff38 offset 2px on all actionable rows/buttons. (Interaction and accessibility pass)

## removed

- Root-screen phone chrome with Tapmart wordmark, messages, bell and settings icons; this is a detail utility route and only needs Back plus title.
- Phone bottom navigation overlay on the settings detail route; it obscures utility rows and competes with identity/session actions.
- Separate rounded card treatment for every row; replaced with grouped list surfaces and internal dividers.
- Log out placement between Account and Business; moved to the final Session section where destructive actions belong.
- Any paragraph-style explanatory copy under settings rows; each row now has one short real value only.
- Decorative lime dots or lime accents unrelated to active identity, primary action or important status.
- External-link styling on every row; only Public page uses the external-link icon because it opens a public URL.

## cta

- Back: icon-button-transparent, x=8 y=6 phone or x=120 y=14 desktop header, returns to Business tab/profile screen.
- Account row: tertiary row action, opens Account settings page; full row min tap target 58px high phone, 60px desktop.
- Notifications row: tertiary row action, opens Notifications settings page.
- Security row: tertiary row action, opens Security settings page.
- Business details row: tertiary row action, opens Business details page.
- Connections row: tertiary row action, opens Connections page.
- Brand kit row: tertiary row action, opens Brand kit page.
- Plan and billing row: tertiary row action, opens Plan and billing page.
- Public page row: tertiary row action with external-link trailing icon, opens the public page or public page setup when no URL exists.
- Switch identity: tertiary text action inside each non-current identity row, 63x44px phone and desktop; the entire non-current row is also tappable.
- Add business: tertiary row action at the bottom of identity list, opens Add business flow.
- Log out row: destructive tertiary row action, opens confirmation only.
- Confirmation Cancel: secondary-button, 48px high, label 'Cancel', closes sheet/dialog.
- Confirmation Log out: destructive-button, 48px high in confirmation sheet/dialog only, label 'Log out', runs logout action.

## spacing

- Phone side gutters: 16px; content width 358px.
- Phone top: fixed 56px detail bar, then 14px scroll content top padding.
- Major section gap: 24px between heading, Account, Business, Use TapMart as and Session sections.
- Section label gap: 10px between uppercase label and its list container.
- Grouped list row heights: 58px phone; 60px desktop.
- Row internal padding: 13px horizontal phone, 14px desktop; leading tile 44x44; gap from tile to text 12px.
- Identity avatar rows: avatar 48px, row height 66px, text starts 14px from row top, trailing target minimum 44px high.
- Dividers: 1px rgba(255,255,255,0.08), inset to align with text column, never full bleed through the leading icon area.
- Phone bottom padding: 24px because bottom nav is absent on this detail screen.
- Desktop workspace padding: 32px from rail edge and viewport right; main grid x=120, left column 760px, gap 28px, right column 360px.
- Desktop header height: 72px; main grid top: 96px.
- All interactive rows and controls maintain at least 44px tap/click target and 2px lime keyboard focus ring with 2px offset.

