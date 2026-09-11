# Design: Business Campaigns

**Concept.** Business Campaigns becomes a media-led control room for live campaigns, review work and finished requests, with the Review count and inline action cards making the next business decision obvious. Recreate uses Reel media, Story uses a true 9:16 creative preview, and Car uses vehicle or wrap imagery while quiet campaigns collapse into compact rows.

**Three seconds.** This is the business’s campaign list: Active, Review and Completed are clear, the Review count shows real work waiting, and the first media card tells what campaign needs action and what button to press.

**Layout.** Phone 390px: fixed 56px top bar; scroll content x 16 w 358 with 14px top spacing, 29px title, 14px gap, 34px tabs, 18px gap, dynamic campaign feed, 96px bottom padding; fixed 68px glass bottom nav. Desktop 1360px: fixed rail x 0 w 88 h 100%, page x 88 w 1272, content max 1180 at x 120, desktop header h 64, tabs at y 80, campaign content starts y 128 in a 3-column 360px grid with 18px gaps; no element stretches beyond 420px just because desktop is wide.

## moved deeper

- Create campaign remains only in the Business mode Create bottom-nav item and the desktop rail create button, never as a page CTA.
- Pause, close, duplicate, edit budget, edit slots, upload artwork details and full submission management live inside campaign detail.
- Full creator, driver, vehicle and direct-request history moves into campaign detail; this screen only shows the minimum status needed to choose Review, Verify, Add artwork or Open.
- Settings is not a third top-bar icon on this screen; settings remains behind the Business tab/profile and desktop account area.
- Long campaign descriptions, rules, payment terms, timestamps and internal notes are removed from the list and shown in detail only.

## visual hierarchy

- First: the first campaign that needs action, led by real media, lime money and a single Review, Verify or Add artwork button.
- Second: the tab strip, especially the Review chip with its real count.
- Third: compact campaign rows showing status, audience, progress and pay without competing with the action cards.

## content order

- **Page background**: Root fill #090c0e with page wash radial-gradient(circle at 50% 0%,rgba(43,55,58,0.42) 0%,rgba(9,12,14,0) 340px). Content width 358px, x 16px. No decorative graphics.  [full viewport, minimum 844px on a 390px phone]
- **Phone top bar**: x 0 y 0 w 390 h 56. Transparent at top; after 12px scroll use glass-top-bar-scrolled: rgba(18,23,25,0.82), blur 20px, saturate 140%, border-bottom 1px rgba(255,255,255,0.10). Center wordmark text 'Tapmart' at 21px/24px 820, #f5f7f2 with the Tapmart mark/T in #c9ff38 if the wordmark component supports it. Right side has two 44x44 transparent icon buttons: MessageCircle at x 286 and Bell at x 338, icons 22px #f5f7f2. Add a 6px #c9ff38 unread dot at the icon top-right only when the real unread state exists. Left slot empty.  [56px fixed top]
- **Page title**: x 16 y 70 w 358 h 29. Text 'Campaigns' in screen-title: 23px/29px, weight 800, letter-spacing -0.45px, color #f5f7f2. No subtitle.  [29px]
- **Campaign tabs**: x 16 y 113 w 358 h 34. Horizontal chip row with 10px gap. Each chip uses filter-chip height 34px, radius 999px, padding 0 12px, label 12px/14px 700. Active chip fill rgba(201,255,56,0.16), text #c9ff38. Inactive chips fill rgba(255,255,255,0.08), text #c8cecf. Order: Active, Review, Completed. Review chip label is 'Review' followed by a real count pill when count > 0: min 18x18, radius 999px, fill rgba(201,255,56,0.18), text #c9ff38, 11px/13px 760. If count is 0, hide the pill and keep the chip width natural. Each chip tap target remains at least 44px wide by using invisible horizontal hit padding if needed.  [34px]
- **Selected tab campaign feed**: x 16 w 358. Top gap from tabs 18px. Items use 14px vertical gap after media action cards and 9px after compact rows. Render real campaigns only. Active tab includes non-closed campaigns and direct requests, sorted with needs-action items first, then open, paused, draft and sent/accepted direct requests in backend order. Review tab includes only items with submissions waiting, Story verification needed, drivers applied or artwork needed; its count equals this real item count. Completed tab includes closed campaigns plus declined or cancelled direct requests. Every card and row is tappable and opens campaign detail.  [dynamic, starts y 165]
- **Needs-action campaign card, Recreate or Car**: Width 358px, radius 20px, fill linear-gradient(180deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.018) 100%), #121719, shadow 0 12px 32px rgba(0,0,0,0.28), overflow hidden. Media area 358x220px. Recreate media uses the campaign reference Reel poster or the attached Recreate Reel coffee-shop image for demo data; object-fit cover, object-position center. Car media uses car campaign image, vehicle/ad photo or the attached Car Advertising image for demo data; object-fit cover, object-position center. If no media exists, use business cover; if no cover exists, use #151b1e with centered text 'No media' 12px/16px #6f777a. Add top scrim gradient from rgba(0,0,0,0.64) to transparent over the top 72px and bottom scrim over the bottom 120px. Top-left badges at x 14 y 14, 6px gap: type-badge-neutral text 'Recreate' or 'Car', then metadata-badge text 'Direct' or 'Public'. Top-right status chip y 14, right 14, height 24 to 28 depending label; use status-anatomy. Bottom overlay x 14, bottom 14: pay amount from pay_cents formatted as money in hero-money 27px/30px 850 #c9ff38, hidden if pay is absent; below it campaign title max 2 lines in hero-card-title 20px/25px 760 #f5f7f2. Footer area h 92px, padding 14px, fill #121719. Footer left w 204: first line row-title 14px/18px #f5f7f2 for audience, 'Sent to @{person}' for direct requests or 'Public campaign' for public. Second line row-subtitle 12px/16px #9ca4a7 for the most relevant real metric: '{submissions_waiting} ready to review', '{drivers_applied} drivers applied', 'Artwork needed', '{approved_count}/{slots} approved', '{cars_active_count} cars active' or invite status. Footer right primary button w 112 h 52, x 232 y footer+20, label from action mapping: Review, Verify, Add artwork or Review drivers.  [312px for Recreate and Car action cards]
- **Needs-action campaign card, Story**: Width 358px, height 254px, radius 20px, fill premium-card-fill, shadow card-soft, padding 12px. Left media preview x 12 y 12 w 126 h 224, radius 16px, 9:16 crop of the real Story creative; demo data uses the attached Instagram Story image. No stretch. Right content x 150 y 12 w 196 h 224. Top badge row: type-badge-neutral 'Story' plus metadata-badge 'Direct' or 'Public'; status chip directly below if needed, y 44. Money from pay_cents at y 72 in detail-money 24px/28px 820 #c9ff38, hidden if absent. Title below money, max 2 lines, card-title 15px/19px 740 #f5f7f2. Metadata below title in row-subtitle 12px/16px #9ca4a7: 'Sent to @{person}', '{verified_count}/{approved_count} verified', '{approved_count}/{slots} approved' or invite status. Bottom-right primary button w 196 h 52 at y 184, label 'Verify' when verification is waiting, otherwise 'Review' if the item is in the review queue.  [254px]
- **Compact campaign row**: Width 358px, min-height 84px, radius 16px, fill #121719, padding 12px, gap 12px. Leading media: Recreate and Story use 48x64px radius 12px vertical thumbnail; Car uses 56x56px radius 13px square thumbnail; fallback business cover uses 56x56px. Text column starts x 80 for vertical media or x 84 for square media, width 196 if money is present or 240 if money is absent. Title max 1 line, row-title 14px/18px 700 #f5f7f2. Subtitle line 1 max 1 line, row-subtitle 12px/16px #9ca4a7: '{kind} · {audience or invite status}'. Subtitle line 2 max 1 line when useful: '{approved_count}/{slots} approved', '{verified_count}/{approved_count} verified', '{cars_active_count} cars active', 'Paused', 'Draft' or 'Closed'. Trailing money at right x 282, y 18, max w 46, row-money 17px/20px 800 #c9ff38 when pay_cents exists; otherwise hide. ChevronRight 18px #9ca4a7 at x 328 center-y. Whole row has tap-press and opens detail.  [84px minimum]
- **Business bottom navigation**: x 10 bottom calc(10px + safe-area-bottom) w calc(100% - 20px), max-width 370px, h 68px, radius 28px, fill glass-navigation rgba(9,12,14,0.74), blur 18px, border 1px rgba(255,255,255,0.10), padding 6px 8px. Five items: Home, Content, Create, Campaigns, Business. Each item min 58x56. Campaigns is active with icon and label #c9ff38. Create center item uses business-create-nav-button 44x40, lime gradient, Plus icon 22px #071004, label 'Create' below in inactive #9ca4a7 because this screen is not Create. Bottom content padding for the feed is 96px so the last row is never hidden.  [68px fixed bottom]

## media

- Recreate campaigns: use the real reference Reel poster or video poster first. On phone action cards crop to 358x220px with object-fit cover; compact rows use 48x64px vertical crop; desktop cards use 360x228px. Demo Recreate campaigns use the attached coffee-shop creator filming image. Do not autoplay in the list; open detail for video review.
- Story campaigns: always show the real Story creative as a 9:16 object. Phone action card preview is 126x224px, rows are 48x64px, desktop action card preview is 132x235px. Demo Story campaigns use the attached Instagram Story phone image. Never turn a Story into a wide banner.
- Car campaigns: use the campaign car image, ad wrap image or vehicle photo first, then business cover. Phone action cards crop to 358x220px, rows use 56x56px; desktop action cards crop to 360x240px. Demo Car campaigns use the attached wrapped-car advertising image.
- Fallback media: if campaign media and business cover are both absent, show a #151b1e media well with the one-line label 'No media' in #6f777a. No illustrations, no fake stock images and no icon-only media placeholders.
- Overlays: use media-top-scrim only behind badges and media-bottom-scrim only where money and title sit on image. Keep all overlaid text at least 14px from media edges.

## navigation

Phone uses a fixed transparent Tapmart root top bar that turns to glass after scroll, two global icon actions for messages and notifications, and the 5-item Business bottom nav with Campaigns active. Desktop removes the bottom nav and uses the collapsed 88px left rail with Home, Content, Create, Campaigns and Business; Campaigns has active lime tint, Create remains the only lime create action in the rail.

## animation

- On route entry, use page-reveal: 180ms cubic-bezier(0.22,1,0.36,1), opacity 0 to 1 and translateY 6px to 0; stagger title, tabs and first five campaign items by 35ms.
- On tab switch, animate chip background and text with nav-active-change 160ms cubic-bezier(0.22,1,0.36,1); new tab content crossfades 120ms with translateY 4px to 0. Do not slide the whole page horizontally.
- Buttons, rows and cards use tap-press: 100ms scale to 0.985, 140ms return. Primary buttons keep their lime gradient and shadow while pressed.
- Desktop rows and cards use desktop-row-hover only on pointer devices: 140ms ease-out, translateX 0 to 2px and fill #1b2225 for rows; cards raise shadow subtly without changing size.
- Loading media uses skeleton shimmer 220ms linear, max 2s before showing honest loading text if the request is still unresolved. No looping decorative motion.

## typography

- Top wordmark: 21px/24px, weight 820, letter-spacing -0.45px, color #f5f7f2 with restrained lime mark when available.
- Phone page title: 23px/29px, weight 800, letter-spacing -0.45px, color #f5f7f2.
- Desktop page title: 30px/36px, weight 820, letter-spacing -0.8px, color #f5f7f2.
- Tab and badge labels: 12px/14px, weight 700 to 780, color per chip state.
- Hero money on Recreate and Car media: 27px/30px, weight 850, letter-spacing -0.7px, color #c9ff38.
- Story card money: 24px/28px, weight 820, letter-spacing -0.6px, color #c9ff38.
- Media/card title: 20px/25px, weight 760, letter-spacing -0.35px, color #f5f7f2, max 2 lines.
- Compact row title: 14px/18px, weight 700, letter-spacing -0.1px, color #f5f7f2, max 1 line.
- Row subtitles and metadata: 12px/16px, weight 500, color #9ca4a7; important audience text may use #c8cecf.
- Row money: 17px/20px, weight 800, letter-spacing -0.2px, color #c9ff38.
- Primary button label: 15px/18px, weight 800, color #071004.

## desktop

- Canvas 1360 wide: rail x 0 w 88, page x 88 w 1272. Page background remains #090c0e with the same top radial wash. Rail fill #0d1113, border-right 1px rgba(255,255,255,0.08), padding 18px 12px.
- Desktop rail: Tapmart mark 44x44 at top. Nav stack starts y 96 with 10px gap. Rail items are 64x56 radius 16; Campaigns active fill rgba(201,255,56,0.12), icon and optional 10px label #c9ff38. Create rail button is 64x52 radius 18 with lime gradient and Plus icon #071004. Bottom account/mode switcher sits at y auto bottom 18.
- Desktop header: x 120 y 0 w 1180 h 64. Left title 'Campaigns' in 30px/36px 820 #f5f7f2 at y 18. Right icon buttons MessageCircle and Bell, each 44x44 transparent, icons 22px #f5f7f2; real unread dots only. No create button in the header.
- Desktop tabs: x 120 y 80 h 34, same filter-chip styling and order as phone. Review count pill uses the same real count.
- Desktop content: x 120 y 128 w 1180. Use a fixed 3-column grid: 360px, 360px, 360px with 18px column and row gaps; leave the remaining 64px as breathing room on the right. Needs-action cards render first. Non-action campaigns render as 360px compact rows below action cards, still in the same grid, not as 960px stretched rows.
- Desktop Recreate action card: 360px wide, media 360x228px, footer 94px, total 322px. Desktop Car action card: 360px wide, media 360x240px, footer 94px, total 334px. Desktop Story action card: 360x276px with 132x235px Story preview on the left and a 192px text/action column on the right. Desktop compact row: 360x84px.
- At desktop widths above 1280, preserve card widths and increase empty space or grid count only if another full 360px column plus 18px gap fits; never stretch cards.

## empty states

- Loading: show one 358x312 skeleton action card and three 358x84 skeleton rows on phone; desktop shows three 360px card skeletons in the first row. Skeleton base #121719, media blocks #151b1e, shimmer rgba(255,255,255,0.03) to rgba(255,255,255,0.07).
- Active tab empty: empty-state-card x 16 w 358 min-h 156, radius 20, fill #121719, padding 18. Title 'No active campaigns' 18px/22px #f5f7f2. Copy 'Create one from the Create tab when you are ready.' 13px/18px #9ca4a7. No button, because Create belongs in navigation.
- Review tab empty: empty-state-card title 'Nothing to review' and copy 'Submissions, Story verification and car applications will appear here.' No button.
- Completed tab empty: empty-state-card title 'No completed campaigns yet' and copy 'Closed campaigns and finished direct requests will appear here.' No button.
- Media missing inside a real campaign: keep the campaign visible with #151b1e media well and text 'No media'. Do not substitute the demo images for real absent media in production.
- Error loading campaigns: use toast above bottom nav, height 48px, text 'Campaigns could not load' and a tertiary retry action inside the content area only if the existing product has retry support.

## cards and rows

- Needs-action items are cards because the business must inspect media before choosing Review, Verify or Add artwork. Cards carry real media, lime money and one primary action.
- Story needs-action cards are side-by-side instead of top-media cards so the 9:16 creative remains recognizable and does not get cropped into a banner.
- Recreate and Car needs-action cards use full-bleed media because the Reel poster or vehicle/wrap image is the strongest identifier.
- Stable active, sent, paused, draft, closed, declined and cancelled campaigns are compact rows because their next step is usually to open detail, not act immediately.
- Tabs are filter chips, not large buttons; only the active tab uses lime text/tint.
- The bottom navigation and desktop rail are glass/navigation surfaces; campaign items are graphite surfaces with minimal borders and no nested cards.

## implementation

- 1. Create a campaign list view model from existing campaign data with fields: tabBucket, needsAction, actionType, actionLabel, statusLabel, statusTone, audienceLabel, progressLabel, mediaKind, mediaUrl, payLabel and detailUrl. (Business Campaigns data adapter before rendering)
- 2. Map tabBucket as: Active for non-closed campaigns and non-declined/non-cancelled direct requests; Review for items with submissions_waiting > 0, Story verification needed, drivers_applied > 0 or artwork_needed true; Completed for closed campaigns plus declined or cancelled direct requests. The Review chip count is the real Review bucket length. (Business Campaigns tab logic)
- 3. Map statuses using existing colors: open without action = Active success; open with action = Review lime; paused = warning; draft = neutral; closed = Done neutral; invite sent = Pending warning; accepted = Active success; declined/cancelled = Done neutral. Use status-anatomy and do not introduce new colors. (Campaign card and row status component)
- 4. Replace the current page shell with the TapMart graphite background, phone root top bar, phone title, filter-chip tabs and Business bottom nav exactly as specified. (Business Campaigns phone route)
- 5. Build the Recreate/Car needs-action campaign card at 358px phone width with 358x220 media, type and audience badges, status chip, bottom money/title overlay, 92px footer and a 112x52 primary action button. (Campaign summary card component)
- 6. Build the Story needs-action card at 358x254 with a 126x224 9:16 creative preview, right-side money/title/metadata and a 196x52 primary action button. (Campaign summary card component)
- 7. Build the compact campaign row at 358px width and 84px minimum height with type-specific leading thumbnail, title, two short metadata lines, optional lime money and chevron; make the entire row open campaign detail. (Campaign row component)
- 8. Render the selected tab feed with needs-action cards first and compact rows after, using 14px gaps after cards and 9px gaps after rows; add 96px bottom padding for the glass nav. (Business Campaigns phone content)
- 9. Add honest loading, empty, missing-media and load-error states matching the specified skeletons and empty-state-card copy. (Business Campaigns states)
- 10. Implement the desktop 1360 composition: 88px fixed rail, 1180px content area, 64px header, tabs at y 80 and a 3-column 360px campaign grid with 18px gaps. Remove bottom nav on desktop. (Business Campaigns desktop breakpoint)
- 11. Wire actions without changing backend behavior: tab chips switch tabs; card and row taps open existing campaign detail; Review opens review submissions detail; Verify opens Story verification detail; Add artwork opens campaign detail focused on artwork upload. (Business Campaigns interactions)
- 12. Apply page reveal, tab transition, tap press, desktop hover and skeleton shimmer timings from the TapMart UI system. Respect reduced-motion by disabling translate and scale while keeping opacity changes. (Business Campaigns motion and accessibility)

## removed

- The oversized bright lime filled tab buttons are replaced with restrained filter chips so lime does not dominate the screen.
- The mixed old visual language, thick outlines and generic dark boxes are removed; surfaces now separate by graphite tone and soft depth.
- Long truncated subtitles that repeat the same information are reduced to one or two short metadata lines.
- Create campaign is removed from page content and header; it remains in the Business Create nav item and desktop rail only.
- Settings as a top-bar action on this screen is removed to keep the top bar to two global actions and avoid competing with campaign work.
- Stretched desktop rows are removed; desktop uses fixed-width campaign cards and rows in a real grid.

## cta

- Active tab chip, secondary/filter action, x 16 y 113 on phone and x 120 y 80 on desktop, label 'Active'.
- Review tab chip, secondary/filter action with real count pill when count > 0, placed after Active, label 'Review'.
- Completed tab chip, secondary/filter action, placed after Review, label 'Completed'.
- Needs-action primary button on Recreate campaign cards, 112x52 phone and desktop, footer right, label 'Review' when submissions are waiting.
- Needs-action primary button on Story campaign cards, 196x52 phone story layout and desktop story layout, bottom of text column, label 'Verify' when Story verification is waiting.
- Needs-action primary button on Car campaign cards, 112x52 footer right, label 'Review drivers' when drivers_applied > 0, or 'Add artwork' when artwork_needed is true.
- Campaign card or row open action, tertiary implicit action, entire 44px-minimum surface tap with chevron; opens campaign detail. No separate 'Open' button unless no other action exists and the surface is not otherwise clearly tappable.
- Phone bottom nav Create action, business-create-nav-button, center item, label 'Create'; navigates to Create but is not a Campaigns page CTA.
- Desktop rail Create action, desktop-create-campaign-button, in rail nav stack; navigates to Create. No duplicate create CTA in the page header.
- Top-bar Message and Notification icon buttons, transparent 44x44, right side; global navigation only, not campaign CTAs.

## spacing

- Phone content padding: 16px left/right, 14px below top bar, 96px bottom padding above bottom nav.
- Page title starts at y 70; tab row starts at y 113; campaign feed starts at y 165.
- Tab chip gap: 10px. Badge gap on cards: 6px. Card internal padding: 14px for footers, 12px for Story side layout.
- Vertical feed gaps: 18px from tabs to first item, 14px after action cards, 9px after compact rows.
- Media overlay padding: 14px from all media edges.
- Compact row padding: 12px vertical and horizontal, 12px between thumbnail and text.
- Primary campaign-card footer button: 112x52 for Recreate and Car, 196x52 for Story, all with 44px minimum target preserved.
- Phone bottom nav: x 10, bottom calc(10px + safe-area-bottom), h 68, padding 6px 8px.
- Desktop page padding: 32px from rail edge, content x 120, max width 1180.
- Desktop grid: columns 360px 360px 360px, column gap 18px, row gap 18px; preserve fixed card widths rather than stretching.
- Desktop header: h 64; tabs y 80; content y 128.

