# Design: Business Home

**Concept.** Business Home becomes a dark, media-led marketplace for discovering real creators and real vehicles, not a dashboard. The first screen shows faces/work, cars, visible car ad prices, and direct Story/Reel request actions without analytics or setup noise.

**Three seconds.** A business can browse creators for Story or Reel requests and cars priced for monthly ads, then tap a face, Story/Reel, or View car.

**Layout.** Phone 390px: root #090c0e with radial page wash at top. Top bar 56px sticky, then content padding 16px left/right. Tabs/search row 48px, then active marketplace feed. For you order is People near you, Cars available, More people. People tab replaces the feed with one continuous 2-column people grid below tabs. Cars tab replaces the feed with one continuous single-column vehicle list below tabs. Nearby filters both people and cars to the business city and uses the same mixed order. Bottom scroll padding is 96px for the glass nav.

## moved deeper

- Creator portfolio galleries, rating breakdowns, past campaign detail, and full Instagram verification detail move to the person page.
- Story/Reel request brief, dates, usage notes, negotiated price, and confirmation move to the direct request flow after tapping Story or Reel.
- Vehicle placement selection, wrap preview, offer amount, creative upload, and terms move to the car detail and car offer flow.
- Advanced search fields, sorting, location radius, follower ranges, rating filters, and vehicle placement filters move to the separate Search screen.
- Business settings, subscription state, connection warnings, team, billing, and notifications preferences stay behind Settings or Business, never in Home.
- Campaign performance, spend, approvals, and analytics stay in Campaigns or Content, never in discovery.

## visual hierarchy

- Creator and vehicle media cards: real portraits/work and real car photos or 3D models dominate the first read.
- Car ad price: lime monthly price appears first on every vehicle card when a real placement price exists.
- Direct decision controls: Story, Reel, View car, tabs, and Search are visible but compact.

## content order

- **Phone root top bar**: Full width 390px, height 56px, transparent at top and becomes glass-top-bar-scrolled after 12px scroll. Left: Messages icon-button-transparent at x16 y6, 44x44, Lucide message-circle 22px #f5f7f2; if real unread messages exist, show a 6px #c9ff38 dot at x48 y12. Center: Tapmart wordmark text centered, 21px/24px 820, #f5f7f2, with the brand dot in #c9ff38. Right: Notifications icon-button-transparent at x286 y6, Settings icon-button-transparent at x338 y6, each 44x44; bell shows the same 6px lime dot only when real unread notifications exist.  [56px]
- **Tabs and search control**: Placed 14px below top bar inside 16px side padding. Width 358px, height 48px. Left chip viewport width 306px, horizontal scroll only if localized labels overflow; chips are 34px high with 8px gaps: For you, People, Cars, Nearby. Active chip uses filter-chip active fill rgba(201,255,56,0.16), text #c9ff38; inactive chips fill rgba(255,255,255,0.08), text #c8cecf. Right: Search icon-button-surface at x330 within content, 44x44, radius 14, icon search 22px; tapping opens the separate Search screen.  [48px]
- **People section header**: Only on For you and Nearby tabs. Width 358px, margin-top 18px. Left label 'PEOPLE NEAR YOU' or 'PEOPLE IN {business city}' when the active tab is Nearby and a real business city exists; 12px/15px 760 uppercase, letter spacing 1.4px, #9ca4a7. Right tertiary text button 44px tall labelled 'All people' with chevron-right 16px; #c8cecf; hidden on the People tab.  [44px]
- **People grid**: Two-column grid inside 16px side padding. Card width 172px, height 275px, gap 14px horizontal and 14px vertical. Each person-marketplace-card has radius 20px, premium-card-fill, overflow hidden, shadow card-soft. Media area 172x215px using the person's best media priority: approved work or portfolio still, else connected Instagram picture, else TapMart photo. Bottom media scrim from y103 to y215. Top-left media-chip at x10 y10 shows confirmed Instagram follower count such as '12.4K IG' only when Instagram is connected with a real confirmed count; otherwise show neutral 'Not connected'. Top-right media-chip shows '★ 4.9' only when rating exists. Bottom overlay at x12 y158: display name 15px/19px 800 #f5f7f2 with verified-mark 16px inline when verified; second line 12px/16px 500 #c8cecf formatted '@username · City · {completed} done', truncated to one line. Footer/action area 172x60px fill #121719. Left direct action: 'Story' compact primary segment x8 y8 76x44, radius 14, lime gradient, text #071004 13px/16px 800. Right direct action: 'Reel' compact secondary segment x88 y8 76x44, radius 14, fill #171d20, border 1px rgba(255,255,255,0.08), text #f5f7f2 13px/16px 760. Tapping media/name opens the person page; tapping Story or Reel starts that direct request.  [275px per row]
- **Cars section header**: Only on For you and Nearby tabs. Width 358px, margin-top 24px. Left label 'CARS AVAILABLE' or 'CARS IN {business city}' when Nearby is active and a real city exists; 12px/15px 760 uppercase, letter spacing 1.4px, #9ca4a7. Right tertiary text button 44px tall labelled 'All cars' with chevron-right 16px; hidden on the Cars tab.  [44px]
- **Vehicle list**: Single-column list inside 16px side padding, 14px gap. Each vehicle-marketplace-card is 358x333px, radius 20px, premium-card-fill, overflow hidden, shadow card-soft. Media area 358x269px. If the vehicle has a real scanned 3D model, show the model centered on #090c0e with a subtle dark turntable, max model bounds 320x218px, glass-pill '3D model' top-left, and a 30px glass drag hint centered at bottom reading 'Drag to rotate'. If no 3D model exists, show the first real vehicle photo cropped 4:3; for demo car advertising records use the attached wrapped car image here, never as a generic placeholder. Add media-bottom-scrim from y120 to y269. Bottom media text x14 y196: price line 24px/28px 850 #c9ff38 formatted 'from ${lowest placement price}/mo' when at least one real placement asking price exists; if no placement price exists, omit the lime price. Vehicle title below, 20px/25px 760 #f5f7f2, max one line, formatted '{year} {make} {model}'. Metadata below, 13px/17px 600 #c8cecf: 'City · {monthly miles} mi/mo'. Footer 358x64px fill #121719. Footer left x14 y10 width 210: placement summary 12px/16px 500 #9ca4a7, e.g. 'Driver door, Rear window +2', generated only from real placement names. Footer right: secondary-button 112x44 at x232 y10 labelled 'View car'. Tapping the media/title or View car opens the car page.  [333px per card]
- **More people header**: Only on For you when there are more people after the first section. Width 358px, margin-top 24px. Left label 'MORE PEOPLE', 12px/15px 760 uppercase, letter spacing 1.4px, #9ca4a7. No right action; the People tab is the complete people view.  [44px]
- **More people grid**: Same two-column person-marketplace-card grid as People grid. Render only real remaining people. Do not duplicate a person already shown above unless the backend returns duplicate records, in which case de-duplicate visually by person id.  [auto, 275px per row]
- **Bottom breathing space**: Empty scroll padding so the final card is not hidden behind the floating bottom navigation. Background remains #090c0e with page wash.  [96px]

## media

- People media uses creator-portrait treatment: 4:5 crop, object-fit cover, card media 172x215px on phone and 260x325px on desktop. Use approved work or portfolio still first, connected Instagram picture second, TapMart photo third; if all are absent, show the honest empty person media state instead of a stock image.
- For demo creator records, the attached Recreate Reel coffee-shop image may be used only when it is that person's real best-media/portfolio still. Crop around the creator and phone setup; keep the face inside a 14px safe area above bottom overlay text.
- Instagram Story creative is not a generic Business Home background. Use the attached Story phone image only if a real person/media record supplies it as best media; otherwise it belongs in Story creation, request, or detail flows.
- Vehicle media uses car-ad-media treatment: phone 358x269px 4:3, desktop 360x270px 4:3, object-position center. For demo vehicle/ad-wrap records, use the attached wrapped car image. Keep the car body clear of price/title overlay by using the bottom scrim.
- Real scanned vehicle models replace photos inside the same vehicle media frame. Put transparent 3D on #090c0e or #121719, no fake environment, no decorative glow, one initial vehicle nudge only.
- All media has radius inherited from the card top corners, no borders over photos, no filters except scrims needed for readable text.

## navigation

Phone uses the Business mode bottom nav exactly: floating glass-navigation container width calc(100% - 20px), max 370px, height 68px, x10, bottom calc(10px + safe-area-bottom), radius 28px, padding 6px 8px. Items are Home, Content, Create, Campaigns, Business; Home is active with icon and label #c9ff38, inactive items #9ca4a7, center Create uses the 44x40 lime business-create-nav-button. Desktop removes bottom nav and uses the fixed 88px collapsed left rail with Home active, Content, Create, Campaigns, Business, plus Search/messages/notifications/settings in the page header.

## animation

- Route enter uses page-reveal: 180ms cubic-bezier(0.22,1,0.36,1), opacity 0 to 1, translateY 6px to 0; stagger section headers and first five cards by 35ms.
- Tab change uses nav-active-change: 160ms cubic-bezier(0.22,1,0.36,1) for chip fill/text; content crossfades 140ms and translates 4px upward, no sliding carousel effect.
- Buttons and tappable cards use tap-press: scale 1 to 0.985 for 100ms ease-out, return 140ms ease-out.
- 3D vehicle cards use vehicle-initial-nudge only once per session when first visible: 650ms, rotate 8deg then settle; drag hint fades in and does not loop.
- Loading cards use loading-skeleton shimmer 220ms linear, max 2s before showing honest loading text or an empty state.

## typography

- Wordmark: 21px/24px, weight 820, letter spacing -0.45px, #f5f7f2; brand dot #c9ff38.
- Section label: 12px/15px, weight 760, letter spacing 1.4px, uppercase, #9ca4a7.
- Section link: 14px/17px, weight 700, #c8cecf, chevron 16px #9ca4a7.
- Person name: 15px/19px, weight 800, letter spacing -0.15px, #f5f7f2.
- Person metadata: 12px/16px, weight 500, #c8cecf over media; low-priority overflow fades under the scrim.
- Media chip label: 12px/14px, weight 760, #f5f7f2 or #9ca4a7 for not-connected.
- Person compact action labels: 13px/16px, weight 800 on Story, 760 on Reel.
- Vehicle price: 24px/28px, weight 850, letter spacing -0.6px, #c9ff38.
- Vehicle title: 20px/25px, weight 760, letter spacing -0.35px, #f5f7f2.
- Vehicle metadata and placements: 13px/17px, weight 600 for media meta #c8cecf; footer placement text 12px/16px weight 500 #9ca4a7.
- Bottom nav label: 10px/12px, weight 650; active #c9ff38, inactive #9ca4a7.

## desktop

- 1360px canvas: fixed left rail x0 y0 w88 h100%, fill #0d1113, border-right 1px rgba(255,255,255,0.08), padding 18px 12px. Logo/mark 44x44 at top. Rail items 64x56 radius 16, gap 10; Home active with fill rgba(201,255,56,0.12), icon/text #c9ff38. Create is the single lime rail action, 64x52 radius 18. No bottom navigation.
- Main workspace starts x88, width 1272, padding 32px, max marketplace content width 1208px. Page background #090c0e with the same radial wash.
- Desktop page header: x120 y0 w1208 h64. Left title 'Marketplace' 30px/36px 820 #f5f7f2, no analytics subtitle. Right actions: Search secondary-button 118x48 with search icon and label, Messages icon-button-transparent 44, Notifications 44, Settings 44, 8px gaps; unread dots only from real unread state.
- Tabs row: x120 y88 h34. Chips For you, People, Cars, Nearby use the same filter-chip states as phone. Search is not duplicated here because it is in the header.
- For you desktop feed starts y140. Section headers are 44px high, same typography as phone. People grid uses desktop person cards width 260px, height 385px, 4 columns max, 18px gap. Media is 260x325px, footer/action row 60px; Story segment 116x44, Reel segment 116x44.
- Vehicle grid uses vehicle cards width 360px, height 334px, 3 columns max, 18px gap. Media 360x270px, footer 64px, View car button 112x44. Cards never stretch wider than 360px.
- People tab: one continuous 4-column people grid below tabs, no section cards, no dashboard widgets. Cars tab: one continuous 3-column vehicle grid. Nearby tab: mixed people then cars filtered to the business city.
- Hover-capable desktop uses desktop-row-hover on cards: translateX 0 to 2px and surface/media footer fill #1b2225 over 140ms; image scale does not zoom.

## empty states

- People loading: render two 172x275 phone skeleton cards or four 260x385 desktop skeleton cards with #151b1e media blocks, footer shimmer, no fake names or follower counts.
- Cars loading: render one 358x333 phone skeleton or three 360x334 desktop skeleton cards with #151b1e media blocks and muted footer shimmer.
- No people in active tab: show one empty-state-card width 358px phone or 420px desktop, radius 20, fill #121719, padding 18. Title 'No creators here yet' 18px/22px 780 #f5f7f2; copy 'Try another tab or search for a specific creator.' 13px/18px #9ca4a7; one secondary button 'Search' 48px high.
- No cars in active tab: empty-state-card title 'No cars available yet'; copy 'Check back later or search another city.' Button 'Search'. Do not show car illustrations.
- No Nearby city on the business profile: Nearby chip remains visible but opens an empty-state-card title 'Add a business city'; copy 'Nearby uses your business city.' Button 'Open settings' as secondary. This state appears only if the backend has no city.
- Person without any usable media: card media area fill #151b1e with the person avatar centered 72x72 if available; if no avatar, show display name initials in #171d20 circle. Still show real name, city, Instagram state, completed count, and actions.
- Vehicle without photos and without 3D: card media area fill #151b1e; centered muted text 'No vehicle photo' 13px/17px #9ca4a7. Keep title and footer if real vehicle data exists; omit price if no placement price exists.
- Short lists: never pad with fake cards. Let the grid end naturally and preserve bottom padding.

## cards and rows

- Person items are media cards because the business is choosing a human/creator visually; the media area is the card, and details stay over the scrim.
- Vehicle items are media cards because the business is buying visibility on a real car; price and car title sit on the media, placement detail sits in the footer.
- Section headers are bare rows with no enclosing card to avoid a dashboard feel.
- Tabs are filter chips, not navigation cards; only one active chip uses lime.
- Search is an icon/button leading to a separate screen, not a persistent text field on Home.
- Top chrome and bottom nav are glass controls; they float above content and do not create boxed page regions.
- Empty states are cards because they replace a missing marketplace object and need one clear next action.

## implementation

- 1. Replace the existing Business Home visual structure with the new page root: #090c0e background, top radial wash, 56px phone top bar, 16px content padding, and 96px bottom scroll padding. (Business Home route root, phone breakpoint)
- 2. Build the phone top bar with Messages on the left, centered Tapmart wordmark, Notifications and Settings on the right. Preserve existing routes/actions for each icon and render unread dots only from real unread state. (Business Home global chrome)
- 3. Create the tabs/search row: For you, People, Cars, Nearby filter chips in a 306px horizontal viewport and a 44px Search surface button opening the existing Search screen. (Business Home below top bar)
- 4. Map person display data exactly: media priority approved work or portfolio still, then connected Instagram picture, then TapMart photo; show display name, verified flag, username, city, Instagram connected state with confirmed follower count when available, completed campaign count, and rating only when present. (Person marketplace card data adapter)
- 5. Build the 172x275 phone person marketplace card with 172x215 media, bottom scrim, Instagram/rating chips, name/meta overlay, and 60px split action footer with Story primary segment and Reel secondary segment. Card media/name opens the person page; Story/Reel start the corresponding direct request. (Business Home people lists)
- 6. Map vehicle display data exactly: year, make, model, city, monthly miles, real vehicle photos, real scanned 3D model when present, placement names, and lowest real asking price as the 'from' price. (Vehicle marketplace card data adapter)
- 7. Build the 358x333 phone vehicle card with 4:3 media or 3D model, bottom scrim, lime monthly from-price only when a real placement price exists, vehicle title, city/miles, placement summary, and one View car secondary button. (Business Home car lists)
- 8. Implement active tab content: For you shows People near you, Cars available, More people; People shows one continuous people grid; Cars shows one continuous vehicle list; Nearby filters people and cars to the business city. (Business Home feed controller)
- 9. Add honest loading, empty, no-media, no-city, and short-list states exactly as specified; do not render placeholder users, fake cars, fake followers, fake ratings, or fake prices. (Business Home feed states)
- 10. Replace phone bottom navigation with the Business mode glass nav: Home active, Content, Create lime plus, Campaigns, Business. Preserve existing navigation destinations. (Business mode shell)
- 11. Build desktop composition at 1024px and above: fixed 88px rail, 32px workspace padding, 64px page header, header search/messages/notifications/settings actions, tabs row, 260px people grid, and 360px vehicle grid. (Business Home desktop breakpoint)
- 12. Apply motion states: page reveal, chip active transition, tap press, loading skeleton, and one-time 3D vehicle nudge; do not add looping decorative animation. (Business Home interactions)

## removed

- Remove any dashboard metrics, performance widgets, campaign analytics, spend summaries, or setup prompts from Business Home because this screen is discovery only.
- Remove the permanent search field pattern; Home uses a Search button that opens the separate Search screen.
- Remove fake red or solid-color fallback creator tiles; absent media must use the honest no-media state.
- Remove repeated outlined pill buttons that make the page feel like a wireframe; use the compact split action footer on person cards and one View car action on vehicle cards.
- Remove decorative borders around every card; surfaces separate by graphite tone, scrim, radius, and soft shadow.
- Remove long subtitles and explanatory marketplace copy; section labels and card metadata are enough for the next decision.
- Remove invented follower counts, ratings, campaign counts, placement prices, or vehicle availability labels.

## cta

- Messages: icon-button-transparent, 44x44, top-left on phone and header-right on desktop; opens Messages.
- Notifications: icon-button-transparent, 44x44; opens Notifications.
- Settings: icon-button-transparent, 44x44; opens Business settings.
- Search: phone icon-button-surface 44x44 at the right of tabs; desktop secondary-button 118x48 in header labelled 'Search'; opens separate Search screen.
- Filter tabs: filter-chip buttons, 34px high, labels For you, People, Cars, Nearby; active chip uses lime text and tint.
- All people: tertiary text button 44px high with chevron in People section header; switches to People tab or opens the existing all-people listing if that route already exists.
- All cars: tertiary text button 44px high with chevron in Cars section header; switches to Cars tab or opens the existing all-cars listing if that route already exists.
- Open person: tapping person media/name area; invisible card action with tap-press; opens the person page.
- Story: compact primary segment on every person card, 44px high, lime gradient, label 'Story'; starts Request Story directly for that person.
- Reel: compact secondary segment on every person card, 44px high, fill #171d20, label 'Reel'; starts Request Reel directly for that person.
- Open car/View car: secondary-button 112x44 in vehicle footer labelled 'View car'; media/title also open the car page where the ad offer starts.
- Bottom nav Home, Content, Create, Campaigns, Business: Business mode destinations preserved; Home active.

## spacing

- Phone side padding: 16px; content width 358px.
- Top bar to tabs gap: 14px.
- Tab chip gap: 8px; chip height 34px; search gap from chip viewport: 8px.
- Tabs to first section: 18px.
- Section header height: 44px; section label vertically centered.
- Section header to cards: 10px when header and cards are separate blocks.
- People card grid: 14px horizontal gap, 14px vertical gap; card width 172px.
- Person media overlay padding: 12px left/right at bottom; media chips 10px from top/side.
- Person footer padding: 8px top/bottom/left/right; action gap 4px.
- Cars list gap: 14px vertical.
- Vehicle media overlay padding: 14px; footer padding 14px left and 10px vertical.
- Major section gap after a completed list: 24px.
- Phone bottom content padding: 96px.
- Desktop rail width: 88px; workspace padding: 32px; marketplace max content width at 1360 is 1208px.
- Desktop grid gap: 18px; people cards 260px wide; vehicle cards 360px wide.

