# Transfer QA: Production Google Business after connection (desktop 1440, full page), Stage 5 pass 1

Production: `d-business_google-full.png` · Approved Lab: `d-design_lab_business_content-full.png` · Reviewer: Astra, design QA director · 2026-09-16T07:39:58.778Z
Instructions: Stage 5 transfers the approved Frame Shift Design Lab to production for the quieter identity and management side of TapMart: Business Profile, Settings, Brand kit, Connections, Google Business, Plan and billing, Team, Notifications, Messages, Search, and the public creator and business profiles. The Lab never drew these screens; judge whether the approved language (mineral canvas, graphite only for identity and media regions, cobalt only for meaningful action, strong typography, restrained borders, real media at source ratio, short operational copy, literal status words, honest states, real provenance) was transferred as a product system to each screen's purpose, and whether real functionality survived. Utility screens intentionally use less media and less graphite than discovery screens; that is expected, not drift. They should feel simple, trustworthy, fast, organised, premium and easy to scan, never theatrical; no giant media compositions on settings screens, no dashboards, no generic card grids. Product rules that are not drift: subscription money, campaign credit and creator payout are three separate amounts and are never merged; Google shows only a connect state until a real connection exists, then only what Google returned, never ranking or search performance; connection states are the stored record (Connected, Finish connecting, Reconnect required, Needs attention, Not connected), never invented health; the brand kit shows what was found in real sources first, then a proposal beside what is in use, and nothing changes without Approve; Team lists the recorded members and roles and says plainly that invitations do not exist in the product yet, so no invited state is drawn; vehicles are private on a public creator profile, only Drives with TapMart shows; Instagram provenance on a profile is what the record holds (connected through Instagram, or confirmed manually by TapMart); a business viewer gets Request Story and Request Reel on a creator profile, never a person's name in the button. Real local demo data replaces the Lab's fictional records; treat those as expected differences. Do not propose a new design system. The listing as Google returned it: what needs attention with the observed value, fixes as On Google now and Proposed with one Approve each, reviews without a reply, the listing facts.

**Verdict.** Frame Shift is mostly transferred and TapMart’s real workflows remain visibly intact, but control sizing and two data-honesty copy issues must be fixed before shipping.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture preserves the visible data, states, actions and navigation, but it cannot establish that mutations or external links work. Correct the copy and control sizing below, then verify refresh, each approval, review/listing links and disconnect before release.

The transfer is close: the 200px graphite rail, 32px main gutter, mineral background, heading hierarchy, flat white proposal surfaces and ink secondary navigation carry the approved language convincingly. The listing’s counts and missing values remain consistent between attention items and final facts. No invented media, money, ranking dashboard or health score appears. The factual comparison is appropriately quieter than the Lab’s media-to-approval assembly. However, undersized proposal controls and unsupported claims inside factual and capability copy prevent a fully faithful, release-ready sign-off.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 9 |
| ai slop risk | 2 |

## Keep

- Keep the mineral canvas, graphite navigation rail, white working regions, restrained dividers and absence of card shadows.
- Keep the strong page and section headings, compact operational typography, rectangular proposal regions and restrained cobalt approval actions.
- Keep this as a quiet, single-column management screen. The supplied Lab image is Content, not a Google Business layout specification; its large media assembly should not be copied here.
- Keep On Google now and Proposed together, with separate approval for each actionable change. No decorative 24px notch is needed between ordinary text facts.
- Keep Connected separate from the Missing and Check findings, and retain observed values and read/check timestamps.
- Keep Settings navigation, Read it again, individual approvals, Google handoffs, review reply links, Open the listing on Google and Disconnect Google.

## Expected differences (real data)

- Demo Coffee Co., its thumbnail, Raleigh address and notification count replace the Lab’s fictional business records. Do not add fixture labels.
- Connected, the listing-read timestamp, four passing checks and six attention items are legitimate production states rather than the Lab’s content-delivery states.
- Missing hours, phone and description, two photos, fourteen reviews and two unanswered reviews are shown explicitly rather than replaced with complete example data.
- The phone and description have concrete proposals. Opening hours honestly says there is nothing to propose yet; it should not receive a fabricated proposal or Approve button.
- The review authors, dates, text, rating average and listing facts appropriately come from this listing rather than the Lab fixtures.

## Drift and usability

1. [data_honesty] **Change Photos → On Google now from “Only 2 photos. Listings with more photos get more calls.” to “2 photos”. Keep recommendations exclusively under Proposed.** (Fixes you can approve → Photos → On Google now). The photo count is an observed listing value; the calls claim is not. Placing both under On Google now makes an unsupported performance assertion look like something Google returned.
1. [data_honesty] **Replace “Google does not allow this change through the API. Do it in your Google Business Profile.” with “Make this change in your Google Business Profile.” in all three affected regions. Preserve their external actions.** (Photos, Photo activity and Review replies proposal regions). An external handoff does not establish a Google-wide API prohibition. The statement is particularly misleading for review replies, which Google exposes through its Business Profile API. Explain the available route without misrepresenting platform capabilities.
2. [usability] **Set proposal-region buttons to IBM Plex Sans 600 at 16px/20px with 8px corners. Make Approve this change buttons at least 48px high and Change it on Google buttons at least 44px high, with 16px horizontal padding and border-box sizing. Ensure Reply on Google links also have a minimum 44px hit area.** (Fixes you can approve buttons and Reviews without a reply actions). The proposal actions appear approximately 40px high at the native desktop scale, with smaller labels than the main controls. These are consequential actions, not metadata; they fall short of the system’s 44px minimum target and 16px action typography.
