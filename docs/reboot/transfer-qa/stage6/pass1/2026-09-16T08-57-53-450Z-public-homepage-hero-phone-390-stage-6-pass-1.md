# Transfer QA: Public homepage hero (phone 390), Stage 6 pass 1

Production: `m-hero.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:53.450Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. The first screen on a phone: header with Menu, the line, the explanation, two actions, then the strip with the real Home frame first.

**Verdict.** Frame Shift and TapMart’s visible production semantics transferred faithfully, but the undersized Home preview and boxed Story treatment need correction before this phone hero ships.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The Frame Shift foundation and production semantics are preserved, but make the product preview more readable and remove the supplied Story’s generic container before signing off this viewport. This capture shows entry controls and real application functionality; it cannot establish that Menu, routing or strip interaction work. Later business chapters and payout disclosures are outside this capture.

The visible page reads as a consumer earning platform with a clear business entrance, not a SaaS dashboard pitch or agency portfolio. Strong verbs, specific work types, approval-based earnings language and an actual Home capture establish the product quickly. The mark, neutral surfaces, cobalt decision and conditional financial treatment are coherent with Frame Shift. The remaining weaknesses are presentation-level: the real product is too reduced to explain its working details comfortably, and the supplied Story has acquired an unnecessary rounded container. No fabricated result, instant-payout promise or replaced backend state is visible.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 7 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 7 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- The required phone sequence: Menu header, proposition, explanation, two entry actions, then the strip with real User Home first.
- The mineral canvas, graphite typography, restrained cobalt primary action and outlined business action.
- The direct consumer proposition and explanation connecting local businesses, specific work and approval-based earnings.
- The real Home screen’s source-to-payment joint, conditional money labels, opportunity actions and permanent navigation.
- The deliberate right-edge continuation of the horizontal strip; this is not accidental page overflow.

## Expected differences (real data)

- The production-first hero and horizontal strip correctly replace the Lab’s illustration-led composition; Stage 6 does not require matching that layout.
- Tyler Okafor, Demo Coffee Co., the $75 Recreate opportunity, the $25 Story opportunity and their conditions appropriately come from captured production records rather than the Lab fixtures.
- The supplied iced-latte creative correctly replaces the Lab’s coffee creative. Still media is appropriate because no production video is available.
- The caption explicitly identifies the screens as real TapMart screens with demo campaigns; the displayed amounts are not presented as customer earnings outcomes.

## Drift and usability

1. [usability] **At 390px, increase the first device from approximately 168px to 280px CSS width, using flex: 0 0 280px and proportional height. Retain the 16px page gutter, 12px strip gap, natural vertical flow and horizontal scrolling. Do not crop or reconstruct the production capture.** (Hero strip, first real User Home device). The Home screen is the right first source, but its approximately 140px-wide working area reduces conditions, status text and navigation labels to roughly 5–7px. Visitors can recognize a phone and an amount more readily than understand the real workflow. A larger first frame lets the product carry the story; later items may remain partially visible by design.
2. [drift] **Remove the supplied Story wrapper’s approximately 12px padding, rounded corners and #E7E7E2 background. Render the creative at its natural aspect ratio with height: auto, border-radius: 0 and no crop. Use only the approved source shadow, 0 6px 16px #10182018, if separation is needed.** (Iced-latte supplied creative immediately to the right of the Home device). The intact creative is correct, but the thick neutral rounded surround makes it read as another generic media card. Frame Shift explicitly treats supplied Story creative as a free, square-cornered sheet rather than a padded underlay.
