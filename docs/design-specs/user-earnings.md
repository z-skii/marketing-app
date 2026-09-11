# Design: User Earnings

**Concept.** A money-first Earnings screen where the available balance is the visual anchor, followed immediately by whether the user can request a payout. Transactions combine earnings and payout requests into one compact history so every dollar has a source, status and date without turning the screen into a dashboard.

**Three seconds.** The user understands how much is available now, whether payout is possible, how much is pending, and the newest money movements.

**Layout.** Phone 390px: page background #090c0e with radial wash at top. Top bar 56px. Scroll content begins at y70 with 16px side gutters and width 358. Money summary 152px, payout action 80px enabled or 114px disabled, 24px section gap, transactions label 18px, transaction list variable. Content bottom padding 96px so the last row clears the glass bottom nav.

## moved deeper

- Payout confirmation moves into a bottom sheet opened by the enabled Request payout button; the sheet repeats the payout amount, expected timing, and fee note before the final request is submitted.
- Long campaign context stays in the campaign detail opened from an earning row; the Earnings screen only shows title, kind or business source, date, status and amount.
- Payment provider setup, bank details and payout method management do not appear on this screen unless they already exist in a separate settings flow.

## visual hierarchy

- Available balance in lime, large and unboxed.
- Request payout button, or the disabled payout state with the minimum amount needed.
- Pending, lifetime and minimum payout stats.
- Transaction amounts and statuses in the history list.

## content order

- **Phone top bar**: 390px wide root top bar. Transparent at page top, switches to glass-top-bar-scrolled after 12px scroll. Center title 'Earnings' at 16px/20px weight 760, #f5f7f2. No left icon and no right icons on this screen; the only primary screen action is payout.  [56px]
- **Money summary stat strip**: Position x16 y70, width 358. No enclosing card. Top label 'AVAILABLE' at x0 y0, 12px/15px weight 760, uppercase, letter spacing 1.4px, #9ca4a7. Available balance at x0 y20 using formatted availableBalanceCents, 46px/48px weight 850, letter spacing -1.2px, #c9ff38. Under it, three stat columns starting y86: column widths 112px, 112px, 112px with 11px gaps. Column 1 value pendingCents, 18px/20px weight 780, #ffcc66 when pending > 0 else #f5f7f2; label 'PENDING' 10px/12px weight 550 uppercase #9ca4a7. Column 2 value lifetimeCents, 18px/20px weight 780 #f5f7f2; label 'LIFETIME'. Column 3 value minimumPayoutCents, 18px/20px weight 780 #f5f7f2; label 'MINIMUM'.  [152px]
- **Payout action**: Position x16, width 358, immediately after money summary. If availableBalanceCents >= minimumPayoutCents: render one primary-button, 358x52, label 'Request payout', icon Wallet 20px #071004 optional at left, then caption at y62: 'TapMart pays within a few days. {platformFeePercent}% fee already deducted.' 12px/16px weight 500 #9ca4a7. If availableBalanceCents < minimumPayoutCents: render disabled primary-button, 358x52, label 'Request payout'; below at y62 a 358x6 progress rail, radius 999px, fill #171d20, progress fill width clamp(availableBalanceCents / minimumPayoutCents, 0, 1) * 358, fill rgba(201,255,56,0.45), radius 999px; below at y78 caption max 2 lines: 'Minimum payout is {minimum}. {remaining} more needed. {platformFeePercent}% fee already deducted.' 12px/16px #9ca4a7.  [80px when payout enabled; 114px when payout disabled]
- **Transactions section label**: Position x16, width 358, 24px below payout action. Text 'TRANSACTIONS' 12px/15px weight 760 uppercase, letter spacing 1.4px, #9ca4a7. No filter chips; all real earnings and payout requests are shown newest first.  [18px]
- **Transaction list**: Position x16, width 358, 10px below section label. If there is at least one earning or payout request: one list container with fill #121719, radius 18px, overflow hidden, no shadow, no decorative border. Container padding 6px 0. Each row is 70px high, padding 10px 13px, background transparent, pressed fill #20282c. Divider between rows: 1px rgba(255,255,255,0.08), inset left 65px right 13px. Leading type tile at x13 y15, 40x40, radius 12px, fill #171d20. Icons: Recreate earning = Video 18px #c8cecf; Story earning = Smartphone 18px #c8cecf; Car earning or car booking = Car 18px #c8cecf; payout request = Wallet 18px #c8cecf. Text block x65 y11, width 178px if chevron exists, 196px without chevron. Title 14px/18px weight 700 #f5f7f2, one line, truncates tail. Subtitle y32, 12px/16px weight 500 #9ca4a7, one line, format: status dot + status label + ' · ' + date + ' · ' + kind/source. Amount right aligned: with chevron, x255 width 52; without chevron, x267 width 78. Amount text 17px/20px weight 800. Earning amounts show '+' except rejected earnings, which show the amount without plus. Available and paid earning amounts are #c9ff38; pending earnings are #ffcc66; requested earnings are #9ed7ff; rejected earnings are #6f777a. Payout request amounts show '−' for requested, approved and paid; rejected payout requests show the amount without minus. Payout request amount colour: requested/approved #f5f7f2, paid #9ca4a7, rejected #6f777a. Earning rows that can open an existing campaign have a ChevronRight 18px #9ca4a7 at x327 y26 and the whole 70px row is a 44px-min tap target. Payout rows are not clickable and have no chevron. If both lists are empty: render empty-state-card, width 358, min-height 190, radius 20, fill #121719, padding 18. Leading Wallet icon tile 48x48 radius 14 fill #171d20, icon 24 #c8cecf. Title 'No earnings yet' 18px/22px weight 780 #f5f7f2, y72. Copy 'Find a Recreate, Story, or Car opportunity to start earning.' 13px/18px #9ca4a7, max 2 lines. Primary button at bottom, 322x52, label 'Open Home'.  [Variable: 82px + 70px per extra row, or 190px empty]

## media

- No campaign demo images are used on this screen because the available Earnings data does not include transaction thumbnails or media. Do not use the Recreate, Story or Car advertising images as decoration here.
- Transaction leading visuals are functional monochrome type icons in 40x40 graphite tiles, not media placeholders. If future backend data adds real campaign thumbnails, replace the icon tile only with a 48x64 vertical thumbnail for Recreate or Story and a 48x48 square crop for Car, preserving the same row height.

## navigation

Phone: use the User bottom navigation exactly: Home, Activity, Earnings, Profile. Container fixed width calc(100% - 20px), max 370px, height 68px, left 10px, bottom calc(10px + safe-area-bottom), radius 28px, glass-navigation fill, padding 6px 8px. Earnings item active with Wallet icon 22px and label 10px/12px #c9ff38; other items #9ca4a7. Desktop: no bottom nav; use fixed collapsed left rail, width 88px, fill #0d1113, border-right 1px rgba(255,255,255,0.08), logo 44x44 at top, nav items Home, Activity, Earnings active, Profile stacked with 10px gap.

## animation

- Page reveal on route entry: 180ms cubic-bezier(0.22,1,0.36,1), opacity 0 to 1, translateY 6px to 0; stagger money summary, payout action and transaction list by 35ms.
- Buttons and clickable transaction rows use tap-press: scale 1 to 0.985 for 100ms ease-out, return over 140ms ease-out.
- Enabled Request payout opens the confirmation bottom sheet with sheet-enter: 260ms cubic-bezier(0.22,1,0.36,1), sheet translateY 18px to 0, modal scrim opacity 0 to 1.
- After a successful payout request, show success-pop on the confirmation check for 420ms and a toast above navigation reading 'Payout requested'.
- Desktop transaction rows use desktop-row-hover only on pointer devices: 140ms ease-out, translateX 0 to 2px and fill #1b2225.

## typography

- Screen title: 16px/20px, weight 760, #f5f7f2 in phone top bar; desktop page title 30px/36px weight 820 #f5f7f2.
- Available label and section labels: 12px/15px, weight 760, uppercase, letter spacing 1.4px, #9ca4a7.
- Available balance: 46px/48px, weight 850, letter spacing -1.2px, #c9ff38.
- Small stat values: 18px/20px, weight 780; pending #ffcc66 when nonzero, lifetime and minimum #f5f7f2.
- Small stat labels: 10px/12px, weight 550, uppercase, #9ca4a7.
- Primary button label: 15px/18px, weight 800, #071004; disabled button label #6e785f.
- Payout helper captions: 12px/16px, weight 500, #9ca4a7.
- Transaction row title: 14px/18px, weight 700, #f5f7f2, one line.
- Transaction row subtitle: 12px/16px, weight 500, #9ca4a7, one line.
- Transaction row amount: 17px/20px, weight 800; colour depends on transaction type and status as specified in the list block.
- Empty state title: 18px/22px, weight 780, #f5f7f2; empty copy 13px/18px, weight 500, #9ca4a7.

## desktop

- 1360px canvas: fixed left rail x0 y0 w88 h100%, fill #0d1113, border-right rgba(255,255,255,0.08). Workspace begins x88. Use desktop page padding 32px.
- Desktop header: x88 y0 w1272 h64, title 'Earnings' at x120 y17, 30px/36px weight 820 #f5f7f2. No message, notification or settings actions in this header.
- Main content max width 860px, x120 y88. Top grid width 860, two columns: left summary column 404px, right payout panel 420px, gap 36px. The left column repeats the phone stat strip without an enclosing card: AVAILABLE label, 46px balance, then Pending, Lifetime, Minimum in three columns. The right column is a premium payout panel 420x154 enabled or 420x184 disabled, radius 22px, fill premium-card-fill, padding 18, shadow card-soft. Panel title 'Payout' 18px/22px weight 780 #f5f7f2; button width 384 height 52; helper caption below. Disabled state includes the same 384x6 progress rail.
- Transactions section on desktop starts 32px below the top grid at x120, width 860. Section label at top. List container width 860, radius 20, fill #121719. Rows are 72px high, padding 12px 16px. Leading tile 44x44. Text block width 560. Amount column width 120 right aligned. Chevron at far right only for clickable earning rows. Row hover uses #1b2225.
- Desktop content remains 860px wide and aligned left inside the workspace; do not stretch the transaction list across the full 1272px workspace.

## empty states

- Loading balances: keep the page structure fixed. Replace available balance with a 180x48 skeleton block, stat values with 70x20 skeletons, payout button with a 358x52 skeleton on phone or 384x52 on desktop. Use loading-skeleton shimmer for max 2s before showing real data or an honest empty state.
- Loading transactions: show three 70px skeleton rows inside the #121719 list container with 40x40 leading skeletons and 120x16 / 160x12 text skeletons.
- No earnings and no payout requests: show the empty-state-card in the transaction area with the primary 'Open Home' action. Keep the $0 balance and disabled payout state above it if available is below minimum.
- Available balance below minimum: Request payout is visible but disabled, with the progress rail and exact remaining amount. Do not show a fake available action.
- No payout requests but some earnings: show only the combined transaction list with earning rows; do not render a separate empty payout section.
- No earnings but some payout requests: show payout request rows in the transaction list; do not show the 'No earnings yet' card because there is still transaction history.

## cards and rows

- Money summary is a stat-strip directly on the page, not metric cards. This keeps the number dominant and avoids a dashboard feel.
- Phone payout action is a button plus caption, not a large card. Desktop uses a payout panel only because the wider layout needs a stable action column.
- Transaction history is one grouped list surface with plain rows and internal dividers, not separate floating cards per transaction.
- Earning rows are clickable rows when they can open an existing campaign; payout request rows are read-only transaction rows.
- The empty state is the only card in the empty transaction area because it represents a complete state and contains the alternate action Open Home.

## implementation

- 1. Format all cent amounts using the same currency formatter: show no decimals for whole dollars, show two decimals for non-whole dollar amounts. Use this formatter for available, pending, lifetime, minimum, remaining, transaction amounts and payout amounts. (Earnings data adapter)
- 2. Derive payoutEnabled as availableBalanceCents >= minimumPayoutCents. Derive remainingCents as max(minimumPayoutCents - availableBalanceCents, 0). Derive payoutProgress as 0 when minimumPayoutCents is 0, otherwise clamp(availableBalanceCents / minimumPayoutCents, 0, 1). (Earnings screen state)
- 3. Render the phone root screen at 390px rules: background #090c0e with top radial wash, 56px top bar, content x16 width 358, bottom padding 96px. (User Earnings route)
- 4. Replace old boxed metric layout with the unboxed money summary: Available label, 46px lime balance, then three stat columns for Pending, Lifetime and Minimum. (Money summary block)
- 5. Render Request payout as a single full-width primary button. Use enabled primary-button styling only when payoutEnabled is true; otherwise use the defined disabled state. Show the enabled caption or disabled progress/caption exactly as specified. (Payout action block)
- 6. On enabled Request payout tap, open a bottom sheet with title 'Request payout', amount equal to availableBalanceCents, one line 'TapMart pays within a few days.', one caption '{platformFeePercent}% fee already deducted.', primary button 'Confirm request' and tertiary button 'Cancel'. Submit the existing payout request action from the sheet primary button. (Payout confirmation sheet)
- 7. Create one combined transaction array from earnings and payoutRequests. Sort descending by date. Do not invent rows. If dates tie, keep the backend order within each source list. (Transaction data adapter)
- 8. Map transaction row types to leading icons: Recreate to Video, Story to Smartphone, Car and car booking to Car, payout request to Wallet. Use monochrome graphite tiles only. (Transaction row component)
- 9. Map earning statuses: available = lime dot/text label 'Available'; requested = info dot/text label 'Requested'; paid = lime dot/text label 'Paid'; pending = warning dot/text label 'Pending'; rejected = error dot/text label 'Rejected'. (Transaction status renderer)
- 10. Map payout request statuses: requested = info label 'Requested'; approved = success label 'Approved'; paid = lime label 'Paid'; rejected = error label 'Rejected'. (Transaction status renderer)
- 11. For earning rows, call the existing open campaign handler when the earning has an existing campaign route. Show a chevron only in that case. Do not make payout request rows clickable. (Transaction list interactions)
- 12. If the combined transaction array is empty, render the empty-state-card with copy 'Find a Recreate, Story, or Car opportunity to start earning.' and primary action 'Open Home' wired to the existing User Home route. (Transaction empty state)
- 13. Implement desktop at 1024px and up with fixed 88px collapsed rail, 64px page header and max 860px content. Use the two-column top grid and full-width transaction list specified for 1360px. (Desktop responsive layout)
- 14. Remove top-bar message, notification and settings icons from this Earnings root screen unless they are enforced by a global shell outside this route. Do not add any search field, chart, fake projection or fake payout method. (Navigation chrome cleanup)

## removed

- The old oversized page title plus duplicate Tapmart wordmark stack; the top bar now carries the section title and the balance carries the page.
- Separate boxed statistic cards or dashboard-style metric panels; the balance and stats sit directly on the graphite page.
- Decorative borders around every transaction row; rows now live in one quiet list surface with internal dividers.
- Message, notification and settings icons from the Earnings top bar as screen-level actions; they compete with payout and are not required for the money decision.
- Any fake charts, estimated future earnings, invented payout dates, fake bank connection states or placeholder campaign images.

## cta

- Request payout: primary-button, phone x16 width 358 height 52 directly below the money summary; desktop inside the payout panel width 384 height 52. Enabled only when availableBalanceCents >= minimumPayoutCents. Opens the payout confirmation sheet.
- Confirm request: primary-button inside payout confirmation bottom sheet, full sheet width minus padding, submits the existing payout request action.
- Cancel: tertiary-button inside payout confirmation bottom sheet, closes the sheet without submitting.
- Open campaign: transaction row tap, row-level tertiary navigation affordance with chevron; available only on earning rows that have an existing campaign route.
- Open Home: primary-button in the empty-state-card only when there are no earnings and no payout requests; routes to User Home.
- Bottom navigation: Home, Activity, Earnings, Profile; Earnings is the active navigation item in lime.

## spacing

- Phone side gutters: 16px; content width 358px.
- Top bar to content: content starts 14px below the 56px top bar, at y70.
- Money summary internal spacing: 5px between label and balance; 18px between balance and stat row; 11px between stat columns.
- Payout action starts immediately after the 152px money summary; caption gap from button is 10px. Disabled progress rail starts 10px below button.
- Major section gap between payout action and Transactions label: 24px.
- Section label to transaction list gap: 10px.
- Transaction container padding: 6px top and bottom. Row height 70px phone, 72px desktop. Phone row padding 10px 13px; desktop row padding 12px 16px.
- Transaction leading tile to text gap: 12px. Text to amount minimum gap: 10px. Chevron tap target remains at least 44x44px through the row tap area.
- Bottom content padding on phone: 96px so content clears the 68px glass bottom nav.
- Desktop workspace padding: 32px from the rail; desktop top grid gap 36px; transactions start 32px below top grid.

