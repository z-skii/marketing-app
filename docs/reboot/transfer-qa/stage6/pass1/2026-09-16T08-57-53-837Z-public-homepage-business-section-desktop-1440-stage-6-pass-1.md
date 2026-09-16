# Transfer QA: Public homepage, business section (desktop 1440), Stage 6 pass 1

Production: `d-business-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:53.837Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Two systems: campaigns (Business Home browser frame with a review phone) and monthly content (Content browser frame with sample shoot photos), then the two plan lines and the spending separation.

**Verdict.** The production functionality remains visibly represented, but this business section needs targeted media, provenance, readability and Frame Shift corrections before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The captures retain recognizable production data, navigation, actions and independent statuses. They cannot establish that public links, sticky-stage switching, keyboard access or backend actions work. Resolve the visible media and presentation issues before desktop sign-off; the rest of the homepage is outside this capture’s review scope.

The business proposition is quickly understandable, and genuine discovery, review and Content screens keep it grounded in TapMart rather than agency imagery or fabricated software. Plan allocations and spending semantics are unusually clear. However, the blank review media, missing readable provenance and non-inspectable miniature statuses weaken the central claim that the real product carries the story. The white canvas, reduced heading hierarchy and decorative cobalt callout also dilute Frame Shift’s approved language.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 5 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 6 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 3 |

## Keep

- The direct business headline and immediate explanation of campaigns versus monthly content.
- Campaign discovery paired with submission review, followed by Content paired with shoot imagery: these demonstrate an actual platform rather than abstract software benefits.
- Graphite product navigation, restrained cobalt decisions, ink typography and unboxed plan rows.
- Separate subscription and campaign-credit explanations; neither is presented as creator earnings.
- Visible production controls for finding people and cars, reviewing files, requesting edits and scheduling content.
- The composite’s repeated headers and overlapping scroll positions should not be treated as duplicated page content.

## Expected differences (real data)

- Real production browser and phone captures replace the Lab’s interactive fixture gallery. The two-system presentation and composite sticky-stage captures are intentional, not layout drift.
- Demo Coffee Co., Jasmine Reed, Devon Carter, Raleigh-area cars and actual Content records correctly replace the Lab’s people, location and work fixtures.
- Initial-based identity fallbacks and differing work-image ratios are legitimate production states; do not substitute fixture portraits.
- Content correctly shows Edit requested separately from Post · Not scheduled, while other filmstrip records retain their own approval and publication states.
- The configured $99 and $199 monthly prices and corresponding shoot allocations appropriately replace the Lab’s unpriced plan descriptions.
- Pricing navigation and separate business-account and plan actions expose production destinations absent from the Lab reference.

## Drift and usability

1. [usability] **Regenerate the review-phone capture after its actual source state has settled. If the submitted file has playable media, use its genuine loaded poster or decoded frame. If it is unavailable, render the production fallback at 14/20px with the literal unavailable state and any existing retry or file action. Do not retain a blank white player or invent replacement footage.** (Campaigns stage, overlapping review phone). The Submitted video phone is dominated by a white media area above a visible playback timeline. At both captured campaign positions, the supposed review evidence looks broken rather than inspectable.
1. [data_honesty] **Add a persistent native-HTML caption below each complete device assembly, 14/20px IBM Plex Sans in #526171 with an 8px top gap: “Demo account · Production screen.” Identify the small shoot images as sample shoot photos where that is their actual provenance. Keep these captions outside the captured pixels.** (Campaigns and Monthly content device assemblies). The visible stages do not expose the promised readable demo captions. Tiny account names inside scaled frames are insufficient provenance, and the loose shoot photographs currently have no visible source description.
2. [usability] **Provide an ink “Inspect production screen” action below each assembly with a minimum 44px target. Open the same capture at readable size in an accessible viewer with a visible 44px Close control, Escape dismissal and focus return. Preserve the intact device compositions in the page.** (Both business product stages). The browser frames carry the right product story, but names, payment details and operational statuses are too small to inspect at their displayed scale. The review phone is smaller still.
2. [drift] **Use #F4F3EF for the outer business-section canvas; retain #FFFFFF for actual working surfaces inside the product. Set the business section heading to Archivo 700 at 64/64px with -0.04em tracking at 1440px, retaining the existing responsive layout.** (Business section background and “Put your business out there.” heading). The broad white field and smaller headline flatten the distinction between public canvas and working product. Compared with the approved mineral foundation and stronger business heading, this reads more like a conventional software screenshot section.
3. [drift] **Remove the campaign-spending callout’s cobalt left border and its border-specific left padding. Keep a 24px gap above the text and preserve the existing plan dividers and wording.** (Campaign-spending explanation below the plans). This cobalt rule decorates explanatory copy rather than marking a selected edge, primary decision or source-to-commitment boundary. The financial separation is already clear through the plan rows and explicit text.
