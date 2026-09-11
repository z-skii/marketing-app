# TapMart UI system

**TapMart Graphite UI System v1**

## buttons

- **primary-button**: height 52px; radius 18px; padding 0 18px; fill linear-gradient(180deg,#d8ff5f 0%,#c9ff38 48%,#aef927 100%); text #071004; label 15px/18px 800; icon 20px; gap 10px; shadow 0 10px 24px rgba(201,255,56,0.18), inset 0 1px 0 rgba(255,255,255,0.34) (Use for the single main action on a screen or card, such as Apply, Accept, Post Story, View Ad Preview, Create campaign or Payout.)
- **primary-button-states**: pressed: scale 0.985, fill linear-gradient(180deg,#cfff48 0%,#bff72f 100%); duration 100ms; disabled: fill #2a3328, text #6e785f, shadow none; loading: spinner 18px #071004 (Use for primary action feedback without changing layout.)
- **secondary-button**: height 48px; radius 16px; padding 0 16px; fill #171d20; text #f5f7f2; label 14px/17px 760; optional border 1px rgba(255,255,255,0.08); pressed fill #20282c; disabled fill #121719 text #596164 (Use for secondary actions beside or below a primary action, such as Decline, Save draft, Change photo or View details.)
- **tertiary-button**: height 44px; radius 14px; padding 0 12px; fill transparent; text #c8cecf; label 14px/17px 700; pressed fill rgba(255,255,255,0.06); destructive text #ff6b6b (Use for quiet actions that must remain visible but not compete with money or the primary CTA.)
- **icon-button-transparent**: width 44px; height 44px; radius 14px; fill transparent; icon 22px; icon #f5f7f2; pressed fill rgba(255,255,255,0.08); disabled icon #4e5659 (Use in top bars for back, settings, notifications, overflow, close and share.)
- **icon-button-surface**: width 44px; height 44px; radius 14px; fill #171d20; border 1px rgba(255,255,255,0.08); icon 22px #f5f7f2; pressed fill #20282c (Use for floating media controls, upload controls, carousel arrows and desktop row actions.)
- **filter-chip**: height 34px; radius 999px; padding 0 12px; fill rgba(255,255,255,0.08); text #c8cecf; label 12px/14px 700; icon 14px; gap 6px; active fill rgba(201,255,56,0.16); active text #c9ff38 (Use for filters and tabs inside a page; only the active chip may use lime.)
- **media-chip**: height 30px; radius 999px; padding 0 10px; fill rgba(9,12,14,0.62); backdrop blur 12px; text #f5f7f2; label 12px/14px 760; icon 13px (Use on top of media for opportunity type, count, deadline or requirement metadata.)
- **destructive-button**: height 48px; radius 16px; padding 0 16px; fill rgba(255,107,107,0.12); text #ff6b6b; border 1px rgba(255,107,107,0.20); label 14px/17px 760 (Use for irreversible actions in confirmation sheets only.)
- **business-create-nav-button**: width 44px; height 40px; radius 15px; fill linear-gradient(180deg,#d8ff5f 0%,#c9ff38 100%); icon 22px #071004; shadow 0 8px 20px rgba(201,255,56,0.16) (Use only for the center Create item in Business mode bottom navigation.)

## status

- **status-anatomy**: dot 6px; text 12px/15px 650; dot has 0 0 0 3px same-color at 14% opacity (Use this anatomy for all inline connection, campaign, payment and vehicle states.)
- **ready**: dot #9ded62; text #9ded62; chip fill rgba(157,237,98,0.12); chip border rgba(157,237,98,0.16); label Ready (Use when a vehicle, connection, file or setup is ready for ads or ready for the next step.)
- **active**: dot #9ded62; text #9ded62; chip fill rgba(157,237,98,0.12); label Active (Use when a campaign, booking, subscription item or car ad is currently running.)
- **pending**: dot #ffcc66; text #ffcc66; chip fill rgba(255,204,102,0.12); label Pending (Use when TapMart or the business has not yet completed a required review, payment or approval.)
- **review**: dot #c9ff38; text #c9ff38; chip fill rgba(201,255,56,0.14); label Review (Use when the next important action is review or approval and the item should draw attention.)
- **done**: dot #8b9497; text #9ca4a7; chip fill rgba(255,255,255,0.07); label Done (Use for completed, paid, archived or published items that do not need action.)
- **error**: dot #ff6b6b; text #ff6b6b; chip fill rgba(255,107,107,0.12); chip border rgba(255,107,107,0.18); label Error (Use for failed uploads, payment problems, reconnect-required errors and blocked campaign states.)
- **submitted**: dot #7cc8ff; text #9ed7ff; chip fill rgba(124,200,255,0.10); label Submitted (Use when work has been submitted and is waiting on the business.)
- **paid**: dot #c9ff38; text #c9ff38; chip fill rgba(201,255,56,0.14); label Paid (Use when money has cleared or is available; this is a money state so lime is allowed.)
- **not-connected**: dot #6f777a; text #9ca4a7; chip fill rgba(255,255,255,0.06); label Not connected (Use for Instagram, Google or payment providers when no real connection exists.)
- **needs-reconnect**: dot #ffcc66; text #ffcc66; chip fill rgba(255,204,102,0.12); label Needs reconnect (Use when an integration exists but requires user action before TapMart can use it.)

## badges

- **verified-mark**: width 16px; height 16px; fill #c9ff38; icon check 10px #071004; radius 999px (Use beside verified person and business names only.)
- **money-badge**: height 28px; radius 999px; padding 0 10px; fill rgba(9,12,14,0.66); backdrop blur 10px; text #c9ff38; label 14px/16px 850; prefix optional (Use on media cards where the earning amount needs to be seen before the title.)
- **type-badge-neutral**: height 26px; radius 999px; padding 0 9px; fill rgba(255,255,255,0.09); text #f5f7f2; label 11px/13px 760; letter spacing 0.1px (Use for Recreate, Story and Car labels when the badge is informational, not active.)
- **type-badge-active**: height 26px; radius 999px; padding 0 9px; fill rgba(201,255,56,0.14); text #c9ff38; label 11px/13px 780; letter spacing 0.1px (Use only for the selected opportunity type or the most important review status.)
- **metadata-badge**: height 24px; radius 999px; padding 0 8px; fill rgba(255,255,255,0.07); text #9ca4a7; label 11px/13px 650 (Use for small honest metadata such as city, duration, spots left, requirement or plan name.)
- **attention-badge**: height 24px; radius 999px; padding 0 8px; fill rgba(255,204,102,0.12); text #ffcc66; label 11px/13px 700 (Use when a non-primary warning needs to be seen without becoming the main action.)
- **error-badge**: height 24px; radius 999px; padding 0 8px; fill rgba(255,107,107,0.12); text #ff6b6b; label 11px/13px 700 (Use for compact failed, expired or blocked labels.)

## surfaces

- **page-background**: #090c0e; optional page wash radial-gradient(circle at 50% 0%,rgba(43,55,58,0.42) 0%,rgba(9,12,14,0) 340px) (Use as the app background on every screen.)
- **surface-0-raised-page**: #0d1113 (Use for full-height desktop panels that need slight separation from the page.)
- **surface-1**: #121719 (Use for default cards, rows, bottom sheets, modals and list containers.)
- **surface-2**: #171d20 (Use for elevated rows, secondary buttons, fields and card footers.)
- **surface-3**: #1b2225 (Use for selected rows, hover states, media wells and high-emphasis containers.)
- **surface-pressed**: #20282c (Use for pressed states on dark controls and desktop hover when clickability needs to be clear.)
- **premium-card-fill**: linear-gradient(180deg,rgba(255,255,255,0.055) 0%,rgba(255,255,255,0.018) 100%), #121719 (Use for hero cards, profile vehicle cards and media-heavy campaign cards.)
- **hairline-border**: 1px solid rgba(255,255,255,0.08) (Use sparingly on elevated surfaces, fields and separators only when tone alone is insufficient.)
- **strong-border**: 1px solid rgba(255,255,255,0.14) (Use only for focused fields, selected media, active drop zones and desktop keyboard focus.)
- **divider**: height 1px; background rgba(255,255,255,0.08); inset left 0 or aligned to content after leading thumbnail (Use inside plain lists instead of boxing each item.)
- **media-bottom-scrim**: linear-gradient(180deg,rgba(0,0,0,0.00) 0%,rgba(0,0,0,0.22) 42%,rgba(0,0,0,0.74) 100%) (Use over media when money, title or CTA text sits on the image.)
- **media-top-scrim**: linear-gradient(180deg,rgba(0,0,0,0.64) 0%,rgba(0,0,0,0.00) 100%) (Use over media only when badges or top controls need contrast.)
- **modal-scrim**: rgba(0,0,0,0.58) (Use behind sheets, dialogs and full-screen preview overlays.)
- **text-field**: height 52px; radius 15px; padding 0 14px; fill #171d20; border 1px rgba(255,255,255,0.08); focus border #c9ff38; error border #ff6b6b; text #f5f7f2; placeholder #6f777a (Use for all inputs, selects and search inside sheets or settings, never as a permanent discovery header.)
- **textarea**: min-height 112px; radius 15px; padding 14px; fill #171d20; border 1px rgba(255,255,255,0.08); focus border #c9ff38 (Use for campaign briefs, notes, messages and rejection reasons.)
- **upload-drop-zone**: min-height 148px; radius 18px; fill #121719; border 1px dashed rgba(255,255,255,0.16); active border #c9ff38; active fill rgba(201,255,56,0.08) (Use for video, story creative, brand asset and vehicle photo uploads.)
- **bottom-sheet**: radius 22px 22px 0 0; fill #121719; border-top 1px rgba(255,255,255,0.10); padding 18px 16px calc(18px + safe-area-bottom) (Use for filters, confirmation, payment setup, upload options and direct request actions.)
- **dialog**: width 320px phone max calc(100vw - 32px), desktop 420px; radius 22px; fill #121719; border 1px rgba(255,255,255,0.10); padding 18px (Use for destructive confirmations or focused decisions that cannot be a sheet.)
- **toast**: height 48px; radius 16px; fill rgba(18,23,25,0.92); border 1px rgba(255,255,255,0.10); text #f5f7f2; shadow 0 12px 30px rgba(0,0,0,0.34) (Use for short success or error feedback at the bottom above navigation.)

## cards

- **hero-opportunity-card-base**: phone width 358px; radius 20px; fill premium-card-fill; overflow hidden; media 358x260px; footer 86px; padding footer 14px; gap 8px; shadow card-soft (Use as the shared scale for User Home opportunity cards while allowing type-specific media composition.)
- **recreate-opportunity-card**: media 358x260px full-bleed 4:5 crop from Reel frame or creator filming image; top-left type badge; bottom scrim; bottom content order money 27px lime, title max 2 lines 20px, meta row 13px; footer order business row, spots/deadline, primary button 52px (Use for Recreate Reel opportunities; the reference video or creator filming media is the dominant object.)
- **story-opportunity-card**: height 342px; radius 20px; fill premium-card-fill; padding 14px; layout media preview left 140x249px 9:16 radius 16px, text/action right width remaining; money first, title max 2 lines, business and requirement below; primary button anchored bottom right (Use for Instagram Story opportunities; show the finished Story creative as a 9:16 object, not a generic image card.)
- **car-opportunity-card**: media 358x236px 4:3 crop from wrapped car or vehicle/campaign visual; top-left type badge; bottom scrim; bottom content order money per month 27px lime, title max 2 lines, city/duration; footer 92px with vehicle/campaign metadata and primary button (Use for car advertising opportunities; the car or wrap image is the visual anchor and money must read as monthly.)
- **profile-vehicle-card**: width 358px; radius 18px; fill premium-card-fill; padding 12px; header 32px with maker logo 28px, title 14px/700, status dot line 11px; media well 334x128px; chevron 18px at right; optional drag hint 11px (Use on User Profile and vehicle summaries when a real vehicle exists.)
- **manage-vehicle-hero**: width 358px; min-height 360px; radius 22px; fill #090c0e; media/3D vehicle area 358x300px; zone callouts 11px/700 in glass pills; drag hint below; no footer unless actions are present (Use on Manage Vehicle, car detail and ad preview where the 3D model or vehicle media is the primary content.)
- **ad-zone-tile**: width 106px; height 88px; radius 12px; fill #171d20; image 106x62px; label 11px/13px 700 bottom left; chevron 14px bottom right (Use for available ad zones such as Full Side, Doors and Rear Window.)
- **person-marketplace-card**: phone width 172px in two-column grid or 358px full row; desktop width 260px; radius 20px; media ratio 4:5; overlay bottom scrim with name, city, connected Instagram when real; action row height 52px (Use in Business Home for real people and creators.)
- **vehicle-marketplace-card**: phone width 358px; desktop width 360px; radius 20px; media ratio 4:3; overlay money 24px lime and vehicle title; footer 64px with city, zones, one action (Use in Business Home car browsing and car advertising offer flows.)
- **business-profile-card**: width 358px phone; radius 20px; cover media 358x156px 16:9; logo 72px overlaps cover by 28px; content padding 0 14px 16px; name 23px; metadata one line; rows below not nested (Use for Business profile identity and public business previews.)
- **content-delivery-card**: radius 18px; fill #121719; padding 14px; media thumbnail 100% width ratio source; title 15px/19px 740; status chip top-right; action footer 52px (Use in Business Content for real delivered shoots, scheduled posts and assets awaiting approval.)
- **empty-state-card**: radius 20px; fill #121719; padding 18px; icon or small media 48px; title 18px/22px 780; copy one sentence 13px/18px #9ca4a7; one button max (Use for honest empty states when there is no real data, no connection or no subscription content.)
- **stat-strip**: no enclosing card; numbers sit directly on page; three columns; value 18px/20px 780 or balance 46px/48px 850; label 10px/12px 550 uppercase muted (Use for profile stats, earnings summary and campaign counts instead of rows of boxed metric cards.)
- **campaign-summary-card**: radius 18px; fill #121719; padding 14px; media top ratio type-specific; bottom order title, status, submissions or recipient, money/action; no nested cards (Use in Business Campaigns for active, review and completed campaigns.)

## glass

- **glass-navigation**: fill rgba(9,12,14,0.74); backdrop-filter blur(18px) saturate(140%); border 1px rgba(255,255,255,0.10); shadow 0 18px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08) (Use for phone bottom navigation and desktop rail overlay sections.)
- **glass-control**: fill rgba(13,18,20,0.70); backdrop-filter blur(14px) saturate(130%); border 1px rgba(255,255,255,0.10); shadow 0 10px 26px rgba(0,0,0,0.30) (Use for floating media controls, callout labels, drag hints and compact overlays.)
- **glass-top-bar-scrolled**: fill rgba(18,23,25,0.82); backdrop-filter blur(20px) saturate(140%); border 1px rgba(255,255,255,0.10) (Use for phone top bars only after content scrolls underneath.)
- **glass-sticky-action-bar**: fill rgba(9,12,14,0.52); backdrop-filter blur(22px); border-top 1px rgba(255,255,255,0.10) (Use for sticky bottom CTA areas on detail, upload and checkout flows.)
- **glass-pill**: fill rgba(9,12,14,0.66); backdrop-filter blur(12px); border 1px rgba(255,255,255,0.10); radius 999px (Use for media labels and 3D vehicle ad-zone callouts.)

## colors

- **background-page**: #090c0e (The root background for every screen.)
- **background-raised**: #0d1113 (A slightly raised background for desktop workspaces and full-height panels.)
- **surface-1**: #121719 (Default card, row, sheet and modal surface.)
- **surface-2**: #171d20 (Elevated row, field, footer and secondary control surface.)
- **surface-3**: #1b2225 (Selected, hover and high-emphasis dark surface.)
- **surface-pressed**: #20282c (Pressed state for dark controls and rows.)
- **line-hairline**: rgba(255,255,255,0.08) (Default divider and subtle border.)
- **line-strong**: rgba(255,255,255,0.14) (Focus, selected or active non-lime border.)
- **text-primary**: #f5f7f2 (Primary text, titles and important labels.)
- **text-secondary**: #c8cecf (Secondary readable metadata that still matters.)
- **text-muted**: #9ca4a7 (Quiet metadata, subtitles and section helper text.)
- **text-tertiary**: #6f777a (Low-priority timestamps, placeholders and inactive hints.)
- **text-disabled**: #4e5659 (Disabled labels and unavailable icon states.)
- **lime**: #c9ff38 (Use only for money, primary CTA fill, active navigation, active chip, verified mark and important review or paid status.)
- **lime-highlight**: #d8ff5f (Top stop for lime gradients and small specular highlights on primary buttons.)
- **lime-deep**: #aef927 (Bottom stop for lime gradients and pressed primary actions.)
- **text-on-lime**: #071004 (Text and icons on lime fills.)
- **success**: #9ded62 (Ready, connected and active status dots/text.)
- **warning**: #ffcc66 (Pending, waiting and needs-attention states that are not the main action.)
- **error**: #ff6b6b (Error, failed, destructive and reconnect-blocking states.)
- **info**: #7cc8ff (Submitted or informational states when success, warning and lime are not appropriate.)
- **neutral-status**: #8b9497 (Completed, done and archived states.)
- **glass-fill**: rgba(9,12,14,0.74) (Navigation glass fill.)
- **glass-control-fill**: rgba(13,18,20,0.70) (Floating media control and callout fill.)
- **scrim-modal**: rgba(0,0,0,0.58) (Overlay behind sheets, dialogs and full-screen media preview.)
- **scrim-media-bottom**: rgba(0,0,0,0.74) (Darkest end of media bottom scrim for overlaid text.)
- **media-placeholder**: #151b1e (Use as the base behind loading or absent media before an honest empty state appears.)
- **lime-tint**: rgba(201,255,56,0.14) (Active chip or review status background only.)
- **success-tint**: rgba(157,237,98,0.12) (Ready or connected status chip background.)
- **warning-tint**: rgba(255,204,102,0.12) (Pending or attention chip background.)
- **error-tint**: rgba(255,107,107,0.12) (Error chip or destructive surface background.)

## icon style

- **icon-family**: Lucide Rounded or equivalent; stroke 1.75px; round caps and joins; no filled icons except verified mark and the Create plus button (Use for all product icons so the interface feels precise and premium.)
- **top-bar-icon-size**: 22px icon in 44px tap target (Use for settings, bell, back, close, overflow and share.)
- **bottom-nav-icon-size**: 22px icon; inactive #9ca4a7; active #c9ff38; label below 10px (Use for phone navigation items.)
- **row-leading-icon**: 20px icon inside 44px or 48px leading tile; icon color #c8cecf; tile fill rgba(255,255,255,0.06) (Use for settings rows, profile rows and non-media utility rows.)
- **chevron-icon**: 18px icon; color #9ca4a7; hover/pressed #f5f7f2 (Use at the right edge of rows and cards to indicate drill-in.)
- **metadata-icon**: 16px icon; color inherits text; stroke 1.75px (Use inside chips, metadata rows and status labels.)
- **emphasis-icon**: 24px icon; color #c9ff38 only when representing money or the active create action, otherwise #f5f7f2 (Use sparingly for payout, active create and high-priority review affordances.)
- **icon-restraint**: No decorative icon grids; no multi-color icon squares; no icon used as replacement for real media (Use this rule to prevent generic SaaS visuals and preserve the media-first system.)

## media ratios

- **reel-video**: source 9:16; feed crop 358x260px for Recreate card; detail display 358x636px max-height 520px with object-fit cover; thumbnail 48x72px (Use for Recreate Reel references, submitted videos and reel thumbnails.)
- **story-creative**: 9:16; phone feed preview 140x249px; detail preview 242x430px centered; desktop preview 270x480px; radius 16px (Use for Instagram Story ads because the ad is already made and should look ready to post.)
- **car-ad-media**: 4:3; phone card 358x236px or 358x268px depending available height; desktop card 360x270px; object-position center (Use for wrapped car campaign imagery and car marketplace photos.)
- **vehicle-3d-model**: profile card media well 334x128px; manage hero 358x300px; desktop manage hero 640x420px; transparent 3D background must sit on #090c0e or #121719 (Use only for real scanned vehicle models on profile, manage vehicle, car detail and ad preview.)
- **business-cover**: 16:9; phone 358x156px; desktop 720x320px; radius 20px top corners when inside profile card (Use for business profile covers and brand imagery.)
- **creator-portrait**: 4:5; phone grid card 172x215px; phone full card 358x448px; desktop card 260x325px (Use for Business Home people browsing and creator profile media.)
- **avatar**: 1:1; sizes 32px, 40px, 48px, 72px, 96px; radius 999px; border 2px rgba(255,255,255,0.10) on dark media (Use for user, business and team member identities.)
- **row-thumbnail**: 48x48px radius 12px; activity thumbnail can be 48x64px for vertical media; settings/icon rows use 44x44px icon tile (Use for compact rows in Activity, Campaigns, Content, transactions, messages and notifications.)
- **ad-zone-thumbnail**: 106x62px image inside 106x88px tile; radius 12px (Use for vehicle ad-zone examples and specs.)
- **delivered-shoot-media**: 16:10; phone 358x224px; desktop 540x338px; radius 20px (Use for subscription content, made-for-you assets and business content review.)
- **general-business-photo**: 3:2; phone 358x239px; desktop 360x240px (Use for business location photos, Google or Instagram brand photos when real.)
- **media-fitting-rule**: object-fit cover by default; never stretch; important subject safe area 14px from all overlaid text; no placeholder illustrations (Use for every real image or video asset in TapMart.)

## animation

- **page-reveal**: 180ms cubic-bezier(0.22,1,0.36,1); opacity 0 to 1; translateY 6px to 0; stagger children 35ms max 5 items (Use when a route or major tab first appears.)
- **tap-press**: 100ms ease-out scale 1 to 0.985 on press; 140ms ease-out return (Use for buttons, cards and rows that navigate or submit.)
- **nav-active-change**: 160ms cubic-bezier(0.22,1,0.36,1); background and icon color transition (Use when bottom navigation, desktop rail or page filter active state changes.)
- **sheet-enter**: 260ms cubic-bezier(0.22,1,0.36,1); sheet translateY 18px to 0; scrim opacity 0 to 1 (Use for bottom sheets and mobile filter panels.)
- **sheet-exit**: 220ms ease-in; sheet translateY 0 to 18px; scrim opacity 1 to 0 (Use for dismissing sheets and dialogs.)
- **dialog-enter**: 280ms cubic-bezier(0.22,1,0.36,1); scale 0.96 to 1; opacity 0 to 1 (Use for confirmation dialogs on desktop and compact modal decisions.)
- **success-pop**: 420ms cubic-bezier(0.22,1,0.36,1); check scale 0.72 to 1.08 to 1; haptic optional (Use after accepted request, submitted work, payment setup, connected account or saved campaign.)
- **vehicle-initial-nudge**: 650ms cubic-bezier(0.22,1,0.36,1); vehicle rotates 8deg then settles once; opacity of drag hint 0 to 1 (Use only on real interactive vehicle models to teach drag once, never looping.)
- **live-dot-pulse**: 1200ms ease-in-out; dot opacity 0.45 to 1; loop only while live upload, scan, processing or active recording state is running (Use for real active processes and stop immediately when the process ends.)
- **loading-skeleton**: 220ms linear; skeleton shimmer rgba(255,255,255,0.03) to rgba(255,255,255,0.07); max 2s before honest loading or empty state text (Use while real data or media is loading.)
- **desktop-row-hover**: 140ms ease-out; desktop row hover translateX 0 to 2px and fill #1b2225 (Use for hover-capable devices only.)

## radius

- **radius-xs**: 6px (Use for tiny internal elements, progress bars and small image corners.)
- **radius-sm**: 10px (Use for small chips inside constrained media.)
- **radius-md**: 12px (Use for thumbnails, ad-zone tiles and compact media.)
- **radius-control**: 14px (Use for icon buttons and form controls when height is 44px.)
- **radius-row**: 16px (Use for compact rows and secondary buttons.)
- **radius-button**: 18px (Use for 52px primary buttons and large controls.)
- **radius-card**: 20px (Use for hero cards, media cards and marketplace cards.)
- **radius-sheet**: 22px (Use for bottom sheets, dialogs and large empty states.)
- **radius-xl**: 24px (Use for large desktop panels and immersive media containers.)
- **radius-nav**: 28px (Use for floating phone bottom navigation.)
- **radius-full**: 999px (Use for avatars, pills, status chips and round badges.)

## navigation

- **phone-top-bar-root**: phone height 56px; padding 0 16px; safe-area top included by platform; center title/wordmark; left slot 44x44; right slot up to two 44x44 icons with 8px gap; background transparent at top, glass-top-bar-scrolled after 12px scroll (Use on root screens; show Tapmart wordmark or current section title, never a search field.)
- **phone-top-bar-detail**: phone height 56px; padding 0 8px; back button 44x44 left; centered title 16px/20px 760; right icon 44x44; transparent or scrolled glass (Use on detail, settings, manage vehicle, upload and preview screens.)
- **phone-bottom-nav-container**: width calc(100% - 20px); max-width 370px; height 68px; left 10px; right 10px; bottom calc(10px + safe-area-bottom); radius 28px; fill glass-navigation; padding 6px 8px; z-index above content (Use for User and Business mode primary navigation.)
- **user-bottom-nav**: 4 items; each min tap 58x56px; icon 22px; label 10px/12px 650; inactive icon/text #9ca4a7; active icon/text #c9ff38; no active background (Use exactly for User mode items Home, Activity, Earnings and Profile.)
- **business-bottom-nav**: 5 items; each min tap 58x56px; normal items icon 22px label 10px; center Create uses business-create-nav-button; inactive #9ca4a7; active #c9ff38 (Use exactly for Business mode items Home, Content, Create, Campaigns and Business.)
- **desktop-rail-collapsed**: desktop width 88px; fixed left 0 top 0 bottom 0; fill #0d1113; border-right 1px rgba(255,255,255,0.08); padding 18px 12px; logo 44x44 top; nav stack gap 10px; bottom account/mode switcher (Use at 1024px and above so desktop is not a stretched phone.)
- **desktop-rail-item**: rail item width 64px height 56px; radius 16px; icon 22px; label optional 10px; inactive #9ca4a7; active fill rgba(201,255,56,0.12); active icon/text #c9ff38 (Use for desktop navigation items in both modes.)
- **desktop-create-campaign-button**: width 64px height 52px in collapsed rail or 204x52px in expanded business rail; radius 18px; fill lime gradient; text/icon #071004 (Use as the single prominent create action in Business desktop rail.)
- **desktop-page-header**: height 64px; margin-left rail; padding 0 32px; background transparent; title left 23px/29px 800; right actions 44px; appears only when screen needs a desktop header (Use on desktop pages instead of duplicating mobile top bars.)

## principles

- Media first: real Reels, Story creatives, cars, people, business photos and deliverables carry the color and the UI stays graphite.
- Money is obvious: earning amounts use lime, sit where the eye lands first and are never buried in metadata.
- One primary action: each screen, card or flow has one lime action; all other actions are quiet.
- Less text: if copy is not required for the next decision, remove it, shorten it or move it deeper.
- Tone before borders: surfaces separate by graphite levels and soft depth, not outlines around everything.
- Lime is restrained: only money, primary CTA, active navigation, active chips, verified mark and important status use #c9ff38.
- Phone first, real desktop: design at 390px first, then compose desktop with a left rail and wider content, never a stretched phone.
- Honest states only: no fake metrics, users, connections, followers, content, campaigns or placeholder illustrations.

## responsive rules

- **phone-breakpoint**: phone 0-767px; design canvas 390px; content width 358px with 16px side padding; bottom content padding 96px (Use for the primary product design and all mobile screenshots.)
- **tablet-breakpoint**: tablet 768-1023px; content max 640px centered; bottom nav remains if touch-first; two-column grids allowed only when cards stay at least 172px wide (Use for large phones and tablets without introducing the desktop rail.)
- **desktop-breakpoint**: desktop 1024px and up; 1360px reference canvas; fixed left rail 88px; workspace padding 32px; no bottom nav (Use for real desktop composition.)
- **desktop-content-widths**: desktop content max 1180px; detail max 940px; settings max 760px; earnings max 860px; marketplace max 1240px (Use to prevent stretched lines and oversized cards.)
- **user-home-desktop-composition**: User Home desktop: grid with main column 720px and side column 360px, gap 24px; opportunity cards may be 352-360px in a two-column section (Use to translate phone opportunity discovery into a useful desktop layout.)
- **business-home-desktop-composition**: Business Home desktop: tabs top, then people/cars grid; people cards 260px wide, vehicle cards 360px wide; grid gap 18px; left rail create button remains visible (Use for browsing real people and cars without creating a dashboard look.)
- **detail-desktop-composition**: Detail desktop: media left 540-640px, decision panel right 340px sticky top 88px; gap 28px; primary button in right panel (Use for opportunity detail, car detail, creator detail and campaign review.)
- **card-scaling-rule**: Phone cards become desktop cards by preserving media ratio and increasing grid count, not by stretching a single card beyond 420px (Use whenever a phone card is placed on desktop.)
- **interaction-accessibility**: All tap and click targets min 44x44px; hover states only on pointer devices; focus ring 2px #c9ff38 offset 2px for keyboard (Use for every interactive component.)
- **safe-area-rule**: Safe areas: top handled by native shell; bottom nav offset calc(10px + safe-area-bottom); sticky CTA padding-bottom calc(12px + safe-area-bottom) (Use for iOS and mobile browser layouts.)

## rows

- **standard-row**: min-height 72px; radius 16px; fill #121719; padding 12px 13px; gap 12px; leading 48x48px; title 14px/18px 700; sub 12px/16px 500 #9ca4a7; trailing status then chevron 18px; row gap 9px (Use for Activity, Profile rows, Campaigns rows, Content rows and integration rows.)
- **settings-row**: min-height 58px; radius 0 in plain list or 16px when standalone; padding 10px 0 or 12px 13px; leading icon tile 44x44px; title 14px/18px 700; value/status right; chevron 18px (Use in Settings groups for Account, Business details, Connections, Plan, Team, Notifications and Security.)
- **activity-row**: height 72px; leading media 48x64px radius 12px for vertical or 48x48px for square; title format 'Type · Business' 14px/18px 700; status below; money right 17px/20px 800 lime; chevron 18px (Use for accepted, active, submitted, completed work and direct requests in User Activity.)
- **transaction-row**: height 66px; leading optional 40x40px icon; title 14px/18px 700; date/source 12px/16px #9ca4a7; amount right 17px/20px 800; positive/available #c9ff38, pending #ffcc66, neutral #f5f7f2 (Use for Earnings transaction history and payout events.)
- **campaign-row**: min-height 80px; leading media 56x56px radius 13px or 48x64px for Story/Reel; title 14px/18px 700; sub 12px/16px; status chip top-right; optional submission count bottom-right; chevron 18px (Use for compact campaign lists and review queues.)
- **direct-request-row**: min-height 84px; fill #171d20; radius 16px; padding 12px; title 15px/19px 760; sub 12px/16px #9ca4a7; actions right or bottom: Accept primary 96x44, Decline secondary 92x44 (Use when a business request appears for a user and needs Accept or Decline.)
- **connection-row**: height 76px; leading logo/avatar 48px; title 14px/18px 700; handle/category 12px/16px muted; connection state right with status dot and text; chevron (Use for Instagram, Google, payment and account connection states.)
- **detail-fact-row**: height 64px; background transparent; padding 0; left label 13px/17px #9ca4a7; right value 15px/19px #f5f7f2; divider bottom hairline (Use in detail pages for campaign rules, requirements, payment terms and vehicle specs.)
- **message-notification-row**: min-height 88px; leading media 64x64px radius 14px; title 14px/18px 700; message preview max 2 lines 13px/18px #c8cecf; timestamp 11px #6f777a; unread dot 6px #c9ff38 (Use for messages and notifications while keeping them compact and media-led when possible.)

## typography

- **font-family**: Inter Variable, fallback -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-feature-settings 'cv02','cv03','cv04','ss03'; text-rendering geometricPrecision (Use for all TapMart product UI.)
- **earnings-balance**: 46px; line-height 48px; weight 850; letter-spacing -1.2px (Use for the main Available balance on Earnings.)
- **desktop-page-title**: 30px; line-height 36px; weight 820; letter-spacing -0.8px (Use for desktop screen titles when a page header is needed.)
- **screen-title**: 23px; line-height 29px; weight 800; letter-spacing -0.45px (Use for mobile page titles, profile names and main identity names.)
- **wordmark-text**: 21px; line-height 24px; weight 820; letter-spacing -0.45px (Use for the centered Tapmart wordmark when rendered as text.)
- **hero-card-title**: 20px; line-height 25px; weight 760; letter-spacing -0.35px (Use for opportunity card titles over media or in hero card text blocks.)
- **hero-money**: 27px; line-height 30px; weight 850; letter-spacing -0.7px (Use for opportunity card money and monthly car ad earnings.)
- **detail-money**: 24px; line-height 28px; weight 820; letter-spacing -0.6px (Use for money in detail decision panels when hero-money is too large.)
- **section-heading**: 18px; line-height 22px; weight 780; letter-spacing -0.25px (Use for important section headings below the page hero.)
- **stat-value**: 18px; line-height 20px; weight 780; letter-spacing -0.25px (Use for small profile stats and summary numbers.)
- **stat-label**: 10px; line-height 12px; weight 550; letter-spacing 0.1px (Use below small stat values.)
- **subhead**: 16px; line-height 22px; weight 650; letter-spacing -0.15px (Use for short explanatory lines in detail pages and empty states.)
- **card-title**: 15px; line-height 19px; weight 740; letter-spacing -0.15px (Use for non-hero card titles and content delivery titles.)
- **row-title**: 14px; line-height 18px; weight 700; letter-spacing -0.1px (Use for primary row labels.)
- **row-subtitle**: 12px; line-height 16px; weight 500; letter-spacing 0px (Use for secondary row text and compact metadata.)
- **row-money**: 17px; line-height 20px; weight 800; letter-spacing -0.2px (Use for money in activity, transaction and campaign rows.)
- **body**: 14px; line-height 20px; weight 500; letter-spacing -0.05px (Use for settings, form help and concise explanatory copy.)
- **media-meta**: 13px; line-height 17px; weight 600; letter-spacing -0.05px (Use for metadata on media cards and small fact rows.)
- **section-label**: 12px; line-height 15px; weight 760; letter-spacing 1.4px; text-transform uppercase (Use for quiet section labels above groups.)
- **chip-label**: 12px; line-height 14px; weight 700; letter-spacing 0px (Use inside filter chips, type badges and status chips.)
- **caption**: 11px; line-height 14px; weight 550; letter-spacing 0px (Use for timestamps, hints, drag labels and legal microcopy.)
- **nav-label**: 10px; line-height 12px; weight 650; letter-spacing 0px (Use for bottom navigation and optional desktop rail labels.)
- **button-label**: 15px; line-height 18px; weight 800; letter-spacing -0.05px (Use for primary and large secondary button labels.)

## shadow

- **card-soft**: 0 12px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.045) (Use for premium cards that sit above the page without strong borders.)
- **card-elevated**: 0 18px 44px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.06) (Use for hero media cards, dialogs and important elevated panels.)
- **navigation-shadow**: 0 18px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08) (Use for bottom navigation and glass rail elements.)
- **primary-button-shadow**: 0 10px 24px rgba(201,255,56,0.18), inset 0 1px 0 rgba(255,255,255,0.34) (Use only on lime primary buttons.)
- **focus-ring**: 0 0 0 3px rgba(201,255,56,0.18) (Use for keyboard focus and active upload drop zones.)
- **small-control-shadow**: 0 8px 20px rgba(0,0,0,0.24) (Use for floating icon buttons and media controls.)
- **success-dot-glow**: 0 0 0 3px rgba(157,237,98,0.14) (Use around ready, connected and active status dots.)
- **flat-list-shadow**: none (Use for plain rows and settings lists; do not add depth to every row.)

## spacing

- **phone-content-padding**: 16px left/right; top 14px below top bar; bottom 96px with bottom nav (Use for all phone root screens.)
- **phone-detail-padding**: 18px left/right on immersive detail media screens when content needs slightly more edge protection (Use for opportunity detail, manage vehicle and media preview pages.)
- **desktop-page-padding**: 32px (Use for desktop workspace padding around content.)
- **section-gap**: 24px (Use between major sections on a screen.)
- **section-label-gap**: 10px (Use between an uppercase section label and its content.)
- **card-gap**: 14px (Use between hero cards and media cards in vertical feeds.)
- **row-gap**: 9px (Use between separate rounded rows.)
- **internal-gap**: 12px (Use as the default gap inside cards, rows and button icon spacing groups.)
- **compact-gap**: 8px (Use between closely related labels, icons and metadata.)
- **micro-gap**: 6px (Use inside chips, status labels and compact metadata rows.)
- **card-padding**: 14px (Use for default card internal padding.)
- **large-card-padding**: 18px (Use for empty states, dialogs and important panels.)
- **row-padding**: 13px horizontal, 12px vertical (Use for standard rounded rows.)
- **media-overlay-padding**: 14px (Use for text and badges over media edges.)
- **form-field-gap**: 10px (Use between stacked form fields.)
- **form-section-gap**: 18px (Use between groups of fields in settings and creation flows.)
- **minimum-tap-target**: 44px minimum (Use for every interactive element.)
- **bottom-nav-item-target**: 58px item width minimum inside bottom nav (Use to keep each phone navigation item easy to tap.)
- **desktop-column-gap**: 28px (Use between desktop detail media and sticky decision panel.)
- **desktop-grid-gap**: 18px (Use between marketplace and campaign grid cards.)

