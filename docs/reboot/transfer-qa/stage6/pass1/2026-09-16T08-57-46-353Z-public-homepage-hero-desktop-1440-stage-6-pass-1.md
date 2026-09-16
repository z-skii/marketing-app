# Transfer QA: Public homepage hero (desktop 1440), Stage 6 pass 1

Production: `d-hero.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:46.353Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. The first screen: the four-word line, one explanation, Start earning and For businesses, and a composition of a real Home frame, a supplied Story creative and a filming photograph.

**Verdict.** Frame Shift is substantially present and the visible production functionality survives, but media provenance and a few explicit system treatments need correction before this desktop hero ships.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture exposes coherent production records, payment conditions, inspection, save and navigation controls without visible functional loss. It does not establish that public links, frame inspection, authentication or later sticky-stage transitions work. Correct the visible provenance and system-treatment issues before visual sign-off.

The platform proposition is understandable immediately, and the real Home frame supplies meaningful proof: identifiable work, conditional money, status metadata and genuine app navigation. The revised composition is not a failure to match the Lab layout. The remaining departures are specific: reduced display and wordmark sizing, passive mats around supplied media, and lost provenance on the generated filming visual. No functional break is visible, but later business chapters and interaction behavior are outside this capture.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 6 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 8 |
| brand recognition | 8 |
| ai slop risk | 3 |

## Keep

- The immediate Recreate / Post / Drive / Get paid message and the single explanation connecting local businesses, work and approval.
- The prominent Start earning action paired with For businesses.
- The real Home frame as the dominant product object, including its source-to-cobalt-payment joint, approval conditions, inspection action and permanent navigation.
- The restrained mineral canvas, graphite text, cobalt primary actions and absence of decorative gradients or floating app cards.
- The three-object composition: supplied creative, filming visual and actual working product. It reads as a consumer platform rather than an agency or SaaS dashboard.

## Expected differences (real data)

- The production Home frame correctly shows Tyler Okafor, real demo campaign records, $75.00 Recreate pay and $25.00 Story pay rather than the Lab fixtures.
- The supplied iced-latte Story creative correctly replaces the Lab coffee-break creative.
- Using a real Home capture alongside two source objects, rather than reproducing the Lab hero layout and external payment ledge, is appropriate for this Stage 6 migration.
- The Pricing link and production entry actions are legitimate navigation differences.
- Still references and the explicit demo-campaign caption are appropriate; no video or customer earnings outcome is fabricated.

## Drift and usability

1. [data_honesty] **Add the caption “Generated filming illustration” directly below the filming visual in IBM Plex Sans 14/20px, color #526171, with an 8px gap. Keep the existing real-screen/demo-campaign caption scoped to the product frame.** (Filming visual above and to the left of the Home device). The filming visual matches the image explicitly identified as generated in the approved Lab. Production removes that provenance. The caption about real TapMart screens does not identify the separate illustration and can lend it unintended documentary credibility.
2. [drift] **Remove the 12px neutral padding and decorative backing from both standalone source wrappers: padding: 0; background: transparent. Render the filming image at its source ratio with 4px corners. Render the supplied Story intact with 0px corners and, if depth is retained, only box-shadow: 0 6px 16px #10182018.** (Standalone filming-image and Story-creative wrappers). Both sources currently sit inside inset neutral mats. These are passive containers rather than actual letterboxing or source-to-decision joints. The Story should read as a free supplied sheet, not a rounded card containing an image.
2. [drift] **At the captured 1440px desktop width, set the hero heading to Archivo 800, font-size: 104px; line-height: 96px; letter-spacing: -0.05em. Preserve the three intentional lines and the existing copy. Reserve 72/72px for widths below 1200px.** (Main Recreate / Post / Drive / Get paid heading). The heading is visibly closer to 84px than the approved 104px desktop display scale. Its wording is strong, but the reduced scale weakens the expressive Frame Shift hierarchy and leaves the hero feeling more conventional.
3. [drift] **Set the header wordmark to Archivo 700 at 30/32px with letter-spacing: -0.04em. Retain the exact 28px SVG mark and 8px mark-to-wordmark gap.** (Top-left TapMart lockup). The wordmark appears approximately 24px, below the specified brand lockup size. The symbol treatment itself should not be redrawn or enlarged independently.
