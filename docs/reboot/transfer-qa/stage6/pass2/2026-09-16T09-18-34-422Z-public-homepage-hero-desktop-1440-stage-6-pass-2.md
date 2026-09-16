# Transfer QA: Public homepage hero (desktop 1440), Stage 6 pass 2

Production: `d-hero.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T09:18:34.422Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Pass 2 after the pass 1 fixes: every frame now carries a native provenance caption (Demo product, the account and the literal state) and an Inspect action that opens the same capture at readable size in a dialog with Close, Escape and focus return; the Recreate reference, the Story creative and the car placement carry a native commitment plane beside the source (amount, basis, conditions from the same demo record, offset 24px desktop and 12px phone, square, no shadow, cobalt for Recreate); the filming and car images are captioned as generated illustrations and the shoot images as generated samples; the supplied Story is an intact sheet with no radius and only the source shadow; the 12px mats are gone; the hero heading is 104/96 at 1440, the chapter headings 88/84, the business and Get paid headings 64/64; the wordmark is 30/32; the business section sits on the canvas; the plan lines and the spending note carry no decorative border; the plan regions are square; the hero phone is 280px wide on a phone; the phone strips have Previous and Next controls with a Step n of N line; the business review frame is a real Story proof review with loaded media; the Drive booking frame shows the literal installation-next state; browser housings carry no ambient shadow. The first screen: the four-word line, one explanation, Start earning and For businesses, and a composition of a real Home frame, a supplied Story creative and a filming photograph.

**Verdict.** TapMart’s identity and visible functionality survive, but the missing hero inspection affordance and Story-to-terms joint prevent a complete Frame Shift sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The public entry points and real product information remain exposed as far as this capture shows. Release sign-off is blocked by the two visible hero omissions below. Recapture this viewport after fixing them and verify the inspection dialog; later chapters, navigation destinations and payout behavior are outside this capture.

The hero successfully establishes what TapMart does through strong verbs, concrete explanation, real working UI and conditional money. Its surfaces, typography, controls and media restraint are recognizably Frame Shift, and the different layout is valid. However, the visible hero does not include the promised frame inspection affordance or a native commitment plane for its standalone Story source. Those are implementation omissions, not reasons to restore the Lab layout.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 9 |
| premium feel | 8 |
| fidelity | 7 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- The 104/96px headline, explanatory paragraph and two clear entry actions quickly establish a local consumer-and-business platform—not SaaS or an agency.
- The mineral canvas, graphite typography, restrained cobalt, 30/32px wordmark and outlined secondary controls follow Frame Shift.
- The real Home frame carries the composition and exposes recognizable work, conditional payments and product navigation.
- Keep the supplied Story intact and square, the filming image restrained, and the explicit generated-illustration disclosure.
- Keep the production-specific hero layout and Pricing navigation. Neither needs to match the Lab’s page composition.
- Keep approval-based earnings language; the hero does not promise instant payouts or present demo amounts as customer outcomes.

## Expected differences (real data)

- Tyler Okafor, Demo Coffee Co. and the production task titles correctly replace the Lab’s fixture identities and records.
- The displayed $75.00 Recreate payment and $25.00 Story payment correctly differ from the Lab’s $65.00 and $35.00. Their approval and live-duration conditions remain visible.
- The opening-the-shop reference and iced-latte Story are legitimate production-record sources; they should not be replaced with the Lab’s coffee-pour reference and supplied creative.
- The actual Home capture correctly retains production filters, search, messages, notifications, Save and Home/Activity/Earnings/Profile navigation rather than reproducing the Lab mockup.

## Drift and usability

1. [usability] **Apply the shared native frame-caption component to the hero: “Demo product · Tyler Okafor · Home — For you”, using IBM Plex Sans 14/20px. Add a visible ink Inspect action with a minimum 44×44px target. Open this exact Home capture at readable size in the existing dialog, retaining Close, Escape and focus return. Keep these controls outside the screenshot; do not alter the production UI image.** (Hero Home device and caption beneath the right-hand composition.). The 280px-wide device reduces operational copy to approximately 8–10px. Beneath it, the capture shows only a combined provenance paragraph—not the promised account/state caption or an Inspect action. The embedded “Inspect reference” belongs to the screenshot and does not provide an obvious way to inspect the product frame.
2. [drift] **Give the standalone supplied Story its native source-to-commitment assembly within the existing source cluster: intact sheet at 0px radius, a narrow #FFFFFF terms plane starting 24px lower beside it, 0px plane radius and no plane shadow. Bind the plane to the same Story record and show $25.00 in Archivo 700 at 34/38px, with “after 24h live and approval” and the actual follower requirement in IBM Plex Sans 14/20px. Retain only the permitted Story-source shadow. Do not attach an earnings claim to the generated filming illustration.** (Standalone iced-latte Story sheet below the filming illustration.). The separate iced-latte sheet currently reads as a floating promotional image. Its payment and eligibility connection exists only inside the miniature Home screenshot. The native Story commitment plane described for pass 2 is not visible, leaving the signature source-to-decision relationship incomplete outside the device.
