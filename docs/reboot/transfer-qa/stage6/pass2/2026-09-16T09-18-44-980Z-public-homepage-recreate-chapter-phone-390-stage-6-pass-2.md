# Transfer QA: Public homepage, Recreate chapter (phone 390), Stage 6 pass 2

Production: `m-recreate.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T09:18:44.980Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Pass 2 after the pass 1 fixes: every frame now carries a native provenance caption (Demo product, the account and the literal state) and an Inspect action that opens the same capture at readable size in a dialog with Close, Escape and focus return; the Recreate reference, the Story creative and the car placement carry a native commitment plane beside the source (amount, basis, conditions from the same demo record, offset 24px desktop and 12px phone, square, no shadow, cobalt for Recreate); the filming and car images are captioned as generated illustrations and the shoot images as generated samples; the supplied Story is an intact sheet with no radius and only the source shadow; the 12px mats are gone; the hero heading is 104/96 at 1440, the chapter headings 88/84, the business and Get paid headings 64/64; the wordmark is 30/32; the business section sits on the canvas; the plan lines and the spending note carry no decorative border; the plan regions are square; the hero phone is 280px wide on a phone; the phone strips have Previous and Next controls with a Step n of N line; the business review frame is a real Story proof review with loaded media; the Drive booking frame shows the literal installation-next state; browser housings carry no ambient shadow. Graphite chapter on a phone: head, then the strip of steps with a real frame under each.

**Verdict.** Yes—the captured Recreate chapter faithfully expresses Frame Shift through real TapMart product content, with no visible functional regression; behavioral verification remains separate.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: YES.** Visual sign-off for this captured 390px chapter view. The approximately 194px-wide product capture is an overview, not readable working UI; the supplied implementation’s native captions and Inspect flow are therefore important. Those controls, the strip pager and the standalone native commitment plane are below this crop and are not visually verified here. Routing, dialog keyboard behavior and application mutations still require interaction testing.

The visible treatment faithfully carries Frame Shift without needing to duplicate the Lab’s page layout. Typography, mineral-to-graphite transition, spacing, outlined controls and cobalt conditional pay form a coherent TapMart chapter. The reference remains identifiable, the filming illustration is separately attributed, and the real application supplies specific work, business, deadline and payment information. There is no visible autoplay fiction, fabricated outcome, floating-card styling or guaranteed-earnings language. The public earning CTA, Menu and illustration inspection remain exposed. In-frame controls demonstrate the actual product but are screenshot content, not evidence of working webpage controls. No concrete implementation drift or broken public control is established by these pixels.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 9 |
| usability | 7 |
| brand recognition | 9 |
| ai slop risk | 2 |

## Keep

- Mineral header, graphite chapter, restrained cobalt payment region and clearly differentiated on-dark primary and supporting text.
- The exact restrained mark, approximately 30/32px wordmark, 16px phone gutters and generous chapter-top spacing.
- The strong two-line task heading and direct “Find Recreate work” action. The proposition reads as specific paid creative work, not generic marketplace or SaaS copy.
- The real product frame’s source-left, graphite-facts-right and square cobalt conditional-payment relationship.
- The explicit explanation that the frames represent separate demo records, plus the generated-filming-illustration attribution.
- The intentional next-step preview at the right edge. This is the specified horizontal strip, not accidental page overflow.

## Expected differences (real data)

- The production frame shows Tyler Okafor and Demo Coffee Co., rather than the Lab’s Maya and Loopday fixtures. These are local demo-account records, not customer-result claims.
- “Employee POV: opening the shop” and its supplied still reference correctly replace the Lab’s “Your coffee pour” example.
- $75.00 per approved version, 8 spots and the September 20, 2026 deadline correctly replace the Lab’s $65.00, 4 spots and May deadline. Preserve the production record’s amount and payment basis.
- The production application’s own header, business location and detail controls remain visible instead of being replaced by a simplified Lab excerpt.

## Drift and usability

