# Design: User Profile

**Concept.** The User Profile becomes a premium TapMart identity and setup hub with the person first, money readable, and the vehicle presented as a compact smart asset rather than a giant photo card. It keeps the existing profile, vehicle, Instagram, campaign, payout, shoots, messages, notifications and settings functionality, but removes dashboard clutter and pushes utility actions into disciplined rows and chrome.

**Three seconds.** This is demo-creator's TapMart profile, they have earned $34, completed 1 campaign, have a ready 2021 Toyota Camry for ads, Instagram is connected, and the next useful taps are vehicle management, payout, campaigns, shoots, messages, notifications, or settings.

**Layout.** Phone 390px: root #090c0e with radial page wash; fixed top bar 56px; scroll content width 358px with 16px side padding and top y=70; identity 140px; 24px gap; vehicle card 196px; 24px gap; YOUR SETUP label 15px plus 10px gap; five 72px rows with 9px gaps; 24px gap; COMMUNICATION label plus Messages row; bottom padding 96px; glass bottom nav fixed over page. Desktop 1360px: fixed rail x=0 width 88; workspace x=88 width 1272 padding 32; content max 1120 arranged as main column 660px and side column 420px with 28px gap; no stretched phone column.

## moved deeper

- Messages moves out of the crowded phone top bar into a Communication row below setup; on desktop it remains available in the left rail utility stack with its real unread count.
- Vehicle scan and vehicle management live inside the vehicle card tap path; the profile card only shows a compact Scan my car control when a real 3D model is missing.
- Detailed campaign history, payout setup/history, shoot assignments, Instagram reconnect, and vehicle ad-zone management stay in their existing detail routes opened from rows.
- Account editing, security, notification preferences, and provider connection management remain behind the settings gear.

## visual hierarchy

- Identity: avatar or initial, demo-creator, verified mark, Creator · Raleigh, NC.
- Money and reputation strip: $34 Earned, 1 Completed, New Rating.
- Smart vehicle card: 2021 Toyota Camry, Vehicle Ready for Ads, vehicle media or real 3D model.
- Setup rows: Instagram Connected, Vehicle Ready for Ads, Recent Campaigns, Payout Ready, Your shoots.
- Communication and chrome actions: Messages row, Notifications icon, Settings icon, bottom navigation.

## content order

- **Phone top bar**: Width 390px; height 56px; padding 0 16px; background transparent at scrollY 0 and glass-top-bar-scrolled after 12px. Center wordmark Tapmart at x centered, 21px/24px weight 820, text #f5f7f2 with only the brand mark/dot in #c9ff38. Left slot is an empty 44x44 spacer so the wordmark stays optically centered. Right slot has Notifications icon-button-transparent 44x44 then Settings icon-button-transparent 44x44 with 8px gap; bell and gear are Lucide Rounded 22px stroke 1.75 #f5f7f2. If there are real unread notifications, place a 6px #c9ff38 dot at the bell top-right inside the 44px target; otherwise no dot.  [56px fixed top bar]
- **Identity header**: Scrollable content starts at y=70 with x=16 width 358. No enclosing card. Avatar at x=16 y=76 size 96x96 radius 999px, fill #1b2225, border 2px rgba(255,255,255,0.10); if a real photo exists use it 1:1 object-fit cover, otherwise show initial D centered at 42px/48px weight 760 #f5f7f2 on a subtle radial #20282c to #121719. Text column x=128 y=74 width 230. Name row height 29: demo-creator, 23px/29px weight 800 #f5f7f2, max one line with end truncation; verified-mark 16x16 placed 6px after the measured name. Meta line y=106: Creator · Raleigh, NC, 13px/17px weight 600 #9ca4a7. Stat strip y=136 height 42 inside the text column, three columns each 70px with 10px gap: value $34 in #c9ff38, 18px/20px weight 780; value 1 in #f5f7f2; value New in #c8cecf; labels Earned, Completed, Rating at 10px/12px weight 550 uppercase #9ca4a7. Keep stat values baseline aligned.  [140px]
- **Smart vehicle profile card**: x=16 y=210 width 358 height 196; radius 20px; fill premium-card-fill; shadow card-soft; overflow hidden; no decorative outline unless media needs contrast, then hairline-border only. Internal padding 12px. Header row x=28 y=222 width 334 height 40: leading maker logo if real 28x28 radius 999px, otherwise a 28x28 #171d20 tile with car icon 18px #c8cecf; title 2021 Toyota Camry at 14px/18px weight 700 #f5f7f2; status line below with 6px dot #9ded62 plus Vehicle Ready for Ads at 11px/14px weight 650 #9ded62; chevron-right 18px #9ca4a7 in a 44x44 tap area pinned right. Media well x=28 y=268 width 334 height 128 radius 14px fill #090c0e. If a real 3D model exists, render it centered on the well with transparent background on #090c0e, model fitting inside 310x116, shadow under vehicle, and a glass-control drag hint bottom-right 112x30 reading Drag to rotate. If no real 3D model exists but a vehicle photo exists, show the real vehicle photo 334x128 object-fit cover, object-position center, with media-bottom-scrim and an interactive glass-control Scan my car button visual 112x34 with 44px hit height pinned bottom-right 10px. Entire card opens Manage Vehicle; the Scan my car control opens the scan flow directly.  [196px]
- **Your setup section label**: x=16 y=430 width 358; label YOUR SETUP at 12px/15px weight 760 letter-spacing 1.4px uppercase #9ca4a7. Top gap from vehicle card is 24px; bottom gap to rows is 10px.  [25px]
- **Setup rows**: Five standard rows, each x=16 width 358 min-height 72 radius 16 fill #121719, padding 12px 13px, gap 9px, shadow none. Row 1 Instagram Connected: leading 48x48 radius 13 #171d20 with official Instagram mark centered 26px; title 14px/18px weight 700 #f5f7f2; subtitle @democreator 12px/16px #9ca4a7; trailing status dot #9ded62 and Connected 12px/15px weight 650 #9ded62, then chevron 18px #9ca4a7. Row 2 Vehicle Ready for Ads: leading car icon tile, subtitle 2021 Toyota Camry, trailing Active status #9ded62. Row 3 Recent Campaigns: leading arrow-up-right/activity icon tile, subtitle 3 active · 1 completed, trailing chevron only. Row 4 Payout Ready: leading wallet icon tile, subtitle $34 available with $34 in #c9ff38 and available in #9ca4a7, trailing chevron; no separate money badge. Row 5 Your shoots: leading camera icon tile, subtitle 1 assigned, trailing chevron. All rows have pressed fill #20282c and 100ms tap scale to 0.985.  [396px]
- **Communication section label**: x=16 width 358; top gap 24px after setup rows; label COMMUNICATION at 12px/15px weight 760 letter-spacing 1.4px uppercase #9ca4a7; bottom gap 10px.  [25px]
- **Messages row**: x=16 width 358 min-height 72 radius 16 fill #121719; padding 12px 13px. Leading 48x48 radius 13 fill #171d20 with message-circle icon 22px #c8cecf. Title Messages 14px/18px weight 700 #f5f7f2. Subtitle uses real state: 2 unread if unread count is 2, otherwise No unread messages; 12px/16px #9ca4a7. Trailing shows a compact unread count pill only when count > 0: min-width 24 height 24 radius 999px fill rgba(201,255,56,0.14), text #c9ff38 11px/13px weight 760, then chevron 18px #9ca4a7. Bottom content padding after this row is 96px so the glass nav never covers content.  [72px]

## media

- Avatar: use real user photo only when present; 96x96 phone, 112x112 desktop, 1:1 object-fit cover, radius 999px, border 2px rgba(255,255,255,0.10). If absent, use the initial avatar treatment; do not invent a portrait.
- Vehicle media: profile card media well is 334x128 on phone and 636x220 on desktop. Prefer a real scanned 3D model only if the backend has one; otherwise use the real vehicle photo. If neither exists, show a #151b1e media well with honest text Vehicle media not available and no fake car.
- 3D vehicle treatment: transparent model on #090c0e, centered, subtle platform shadow only, no looping rotation. One initial 8deg nudge is allowed once if the model is interactive.
- Vehicle photo treatment: object-fit cover, object-position center, media-bottom-scrim only when Scan my car or metadata overlays the photo. Never stretch or replace the actual car with the attached car advertising campaign image.
- Opportunity demo images are not used on User Profile; Recreate, Story, and Car campaign images belong to opportunity discovery and campaign creation screens, not this identity screen.

## navigation

Phone uses the User mode bottom navigation exactly: Home, Activity, Earnings, Profile inside a 68px glass-navigation container, x=10, width calc(100% - 20px), max-width 370px, bottom calc(10px + safe-area-bottom), radius 28px, padding 6px 8px. Each item has min target 58x56; icons 22px, labels 10px/12px weight 650; inactive #9ca4a7 and active Profile icon/label #c9ff38 with no active background. Desktop removes the phone top and bottom bars and uses a fixed 88px left rail with Home, Activity, Earnings, Profile active, plus Messages and Notifications as utility rail items with real count pills; Settings is an icon action in the profile header area.

## animation

- Route enter: page-reveal 180ms cubic-bezier(0.22,1,0.36,1), opacity 0 to 1 and translateY 6px to 0; stagger identity, vehicle card, row group by 35ms, max 5 items.
- Top bar scroll: when scrollY passes 12px, transition to glass-top-bar-scrolled over 160ms; reverse when returning to top.
- Vehicle model: if a real 3D model exists, run vehicle-initial-nudge once after the card is visible: 650ms cubic-bezier(0.22,1,0.36,1), rotate 8deg then settle, then stay still. No loop.
- Tap feedback: rows, vehicle card, icon buttons, and nav items use tap-press scale 1 to 0.985 over 100ms and return over 140ms.
- Desktop hover: rows and vehicle card on pointer devices use desktop-row-hover 140ms, translateX 0 to 2px and fill #1b2225; do not apply hover on touch.
- Loading: skeleton shimmer max 2s for avatar, stats, vehicle media, and rows; after that show the honest empty/loading text for the specific block.

## typography

- Wordmark: 21px/24px weight 820 #f5f7f2, brand mark/dot #c9ff38.
- Profile name: 23px/29px weight 800 letter-spacing -0.45px #f5f7f2 on phone; 30px/36px weight 820 on desktop only when space allows.
- Identity meta: 13px/17px weight 600 #9ca4a7.
- Stat value: 18px/20px weight 780; money value #c9ff38, other values #f5f7f2 or #c8cecf for New.
- Stat label: 10px/12px weight 550 uppercase #9ca4a7.
- Section label: 12px/15px weight 760 uppercase letter-spacing 1.4px #9ca4a7.
- Vehicle title and row titles: 14px/18px weight 700 #f5f7f2.
- Row subtitles: 12px/16px weight 500 #9ca4a7; inline money in subtitles uses #c9ff38 weight 700.
- Status text: 12px/15px weight 650 with 6px dot; Connected and Active use #9ded62, Not connected uses #9ca4a7, Needs reconnect uses #ffcc66, Error uses #ff6b6b.
- Button and interactive pill labels: 13px/17px weight 700 for compact Scan my car; 15px/18px weight 800 for any primary button in empty states.
- Bottom nav label: 10px/12px weight 650; active #c9ff38, inactive #9ca4a7.

## desktop

- Canvas 1360px wide, root background #090c0e with radial wash from top center. Fixed rail x=0 y=0 width 88 height 100vh fill #0d1113, border-right 1px rgba(255,255,255,0.08), padding 18px 12px; TapMart logo mark 44x44 top; nav stack y=92 with Home, Activity, Earnings, Profile active; utility stack after a 24px gap contains Messages with count 2 if real and Notifications with count 3 if real; bottom account chip shows initial D and Personal.
- Workspace starts x=88. Content origin x=120 y=40. Main column width 660; side column x=808 width 420; column gap 28. No desktop page header because the profile identity itself is the page title; Settings icon-button-transparent sits at x=736 y=40 inside the main identity area.
- Desktop identity block x=120 y=40 width 660 height 148, no card. Avatar 112x112 at x=120 y=58. Text column x=252 y=48 width 420: name 30px/36px, verified 16px, meta below, stat strip y=116 with three 92px columns. Money remains #c9ff38.
- Desktop vehicle card x=120 y=216 width 660 height 300 radius 22 fill premium-card-fill shadow card-soft. Padding 12. Header 44px; media well 636x220 radius 16. Same model/photo/Scan my car conditional treatment as phone but larger; drag hint or scan button pinned bottom-right inside media.
- Desktop side column starts x=808 y=62. YOUR SETUP label, then five rows width 420 height 72 gap 9. COMMUNICATION label follows with Messages row. Rows keep the same leading icons, statuses, subtitles, and chevrons as phone; there is no stretched full-page list.
- Desktop focus states: keyboard focus ring 2px #c9ff38 offset 2px on rail items, rows, icon buttons, and vehicle scan control. Pointer hover uses #1b2225 and 2px translate only on rows/cards.

## empty states

- Profile photo absent: show the initial avatar using the first available display-name initial; do not fetch or generate a fake person image.
- Verified false: remove the verified-mark and close the name spacing; do not show an empty placeholder.
- Rating absent: show New exactly as the value with label Rating; do not show 0, 0.0, stars, or fake review counts.
- Earned or completed absent from backend: show $0 Earned and 0 Completed only if those are real server values; otherwise show skeleton while loading, then an error toast if the request fails.
- No vehicle: replace the vehicle card with an empty-state-card width 358 phone or 420 side/660 main desktop depending placement, radius 20, icon car 48, title Add your vehicle, copy Scan your car to become available for car advertising, and one primary-button Scan my car 52px. Do not show the car advertising demo image.
- Vehicle exists but no 3D model: show the real vehicle photo if present and the secondary Scan my car control. If no photo exists, show #151b1e media well with Vehicle media not available and a secondary-button Add vehicle photos if that route exists; otherwise only Scan my car.
- Instagram not connected: row title Connect Instagram, subtitle Required for Reels and Stories, trailing Not connected status with neutral dot and chevron. If reconnect is needed, use Needs reconnect in #ffcc66 and keep the row action.
- No recent campaigns: row title Recent Campaigns, subtitle No campaigns yet, trailing chevron; no fake active or completed counts.
- No payout available: row title Payout, subtitle $0 available if real, trailing chevron. If payout provider is missing, subtitle Set up payouts and trailing Not connected status.
- No shoots assigned: row title Your shoots, subtitle No shoots assigned, trailing chevron.
- No unread messages: Messages row subtitle No unread messages and no count pill. If messages fail to load, keep the row and show a small error-badge Error only after the request fails.

## cards and rows

- Identity header is bare page content, not a card, because the person is the page subject and should feel native rather than boxed.
- Stats use stat-strip behavior directly on the page; no metric cards, no chart, no bordered numbers.
- Smart vehicle is the only premium media card on the screen because vehicle readiness is a core profile asset and needs grouped media, status, and action.
- Setup items are standard rows because they are drill-in states, not standalone marketing cards. Each row has one leading icon tile, title, subtitle, optional status, and chevron.
- Messages is a standard row in a separate Communication section on phone so utility navigation is preserved without crowding the top bar.
- Top bar and bottom nav are glass/navigation components, not cards. Bottom nav floats over content but content has 96px bottom padding to prevent obstruction.
- No nested cards are used. Rows sit directly on the page with 9px gaps and tone separation instead of repeated outlines.

## implementation

- 1. Replace the current User Profile root styling with #090c0e page-background plus radial wash; set phone content width to 358px with 16px side padding and bottom padding 96px. (User Profile route root, phone breakpoint 0-767px)
- 2. Build the phone top bar as 56px transparent/glass-on-scroll with centered Tapmart wordmark, Notifications icon, Settings icon, and unread notification dot only when real unread notifications exist. (User Profile phone top chrome)
- 3. Rebuild the identity header as bare page content with 96px avatar/initial, demo-creator name, verified mark, Creator · Raleigh, NC meta, and three-column stat strip showing $34, 1, New with exact typography and colors specified. (Top of User Profile scroll content)
- 4. Replace the large vehicle photo block with the 358x196 smart vehicle profile card: compact header, vehicle status, 334x128 media well, 3D model if real, otherwise real photo, and conditional Scan my car control when no 3D model exists. (Vehicle summary block below identity)
- 5. Create the YOUR SETUP section with five standard rows in this order: Instagram Connected, Vehicle Ready for Ads, Recent Campaigns, Payout Ready, Your shoots; bind every title, subtitle, count, and status to real existing data. (Profile setup list)
- 6. Add the COMMUNICATION section with Messages row and real unread count pill; remove the phone message icon from top chrome to keep only notification and settings there. (Below setup rows on phone)
- 7. Rebuild the User bottom navigation with exactly Home, Activity, Earnings, Profile; use glass-navigation container and active Profile styling in #c9ff38. (Phone fixed bottom navigation)
- 8. Create the desktop layout at 1024px and above: fixed 88px rail, no bottom nav, workspace padding 32px, main column 660px, side column 420px, 28px gap, identity and vehicle in main column, setup and communication rows in side column. (Desktop breakpoint, 1360px reference composition)
- 9. Add desktop rail primary items Home, Activity, Earnings, Profile with Profile active, plus utility items Messages and Notifications with real count pills, and bottom account/mode chip. (Desktop rail)
- 10. Implement honest empty states for missing photo, missing verified state, missing rating, no vehicle, no 3D vehicle model, disconnected Instagram, no campaigns, no payout, no shoots, and no unread messages exactly as specified. (Data rendering layer for User Profile)
- 11. Apply page-reveal, tap-press, glass top bar scroll transition, one-time vehicle nudge only for real 3D models, loading skeleton max 2s, desktop hover, and keyboard focus ring. (Interaction and motion layer)
- 12. Delete current decorative borders, giant lime avatar ring, oversized vehicle image layout, crowded three-icon phone header, boxed metric styling, and any content hidden underneath the bottom nav. (Cleanup of existing User Profile components)

## removed

- The oversized lime avatar ring is deleted; verification stays as the small lime verified mark beside the name.
- The huge vehicle photo card is replaced by a compact premium smart vehicle card so profile identity and setup states are visible sooner.
- The crowded phone top bar with messages, notifications, and settings all on the right is removed; phone top chrome keeps notifications and settings, while messages becomes a row.
- Metric-card/dashboard treatment is removed; stats sit directly on the page as a stat strip.
- Heavy outlines around every card and row are removed; tone, depth, and sparse hairlines create separation.
- Any placeholder or mismatched vehicle imagery is removed; use the actual vehicle media or an honest empty media well only.
- Content may no longer sit behind the bottom navigation; bottom padding is mandatory.

## cta

- Notifications: icon-button-transparent 44x44 in phone top bar; opens Notifications; unread dot only if real unread exists.
- Settings: icon-button-transparent 44x44 in phone top bar and desktop identity area; opens Settings.
- Smart vehicle card: full-card tertiary navigation target, 358x196 phone and 660x300 desktop; opens Manage Vehicle.
- Scan my car: secondary/glass control shown only when the user has a vehicle without a real 3D model; 44px minimum hit height; opens vehicle scan flow.
- Instagram row: standard-row navigation; label is Instagram Connected or Connect Instagram depending state; opens Instagram connection details/reconnect flow.
- Vehicle Ready for Ads row: standard-row navigation; opens vehicle readiness/manage vehicle details.
- Recent Campaigns row: standard-row navigation; opens campaign/activity history filtered to campaigns.
- Payout Ready row: standard-row navigation; opens Earnings or payout setup depending current payout state.
- Your shoots row: standard-row navigation; opens assigned shoots/content tasks.
- Messages row: standard-row navigation; opens Messages; count pill visible only when unread count > 0.
- Bottom nav Home, Activity, Earnings, Profile: four navigation targets; Profile is active in lime; no additional bottom nav actions.
- No persistent primary lime button is shown on a complete profile because there is no single screen-level conversion; primary-button appears only in empty setup states such as no vehicle with Scan my car.

## spacing

- Phone side gutters: 16px; content width 358px.
- Phone top content start: 14px below 56px top bar, so first content y=70.
- Major section gaps: 24px between identity, vehicle, setup, and communication sections.
- Section label gap: 10px from label to first row/card.
- Vehicle card padding: 12px; media well starts after 8px internal gap from header.
- Row gap: 9px between separate rounded rows.
- Row padding: 13px horizontal and 12px vertical; leading icon tile to text gap 12px.
- Compact metadata gaps: 6px inside status dot labels and 8px between related text elements.
- Bottom safe space: 96px minimum on phone scroll content so the 68px glass nav never covers the last row.
- Bottom nav position: left/right 10px, bottom calc(10px + safe-area-bottom), height 68px.
- Desktop workspace padding: 32px around content after the 88px rail.
- Desktop columns: main 660px, side 420px, gap 28px; do not stretch rows beyond 420px or the vehicle card beyond 660px on this screen.

