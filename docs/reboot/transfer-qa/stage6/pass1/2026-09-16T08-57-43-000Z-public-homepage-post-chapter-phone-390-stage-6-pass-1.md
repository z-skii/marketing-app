# Transfer QA: Public homepage, Post chapter (phone 390), Stage 6 pass 1

Production: `m-post.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:43.000Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Canvas chapter on a phone: the creative first, then the campaign and proof frames.

**Verdict.** Frame Shift is substantially recognizable and the visible product semantics are preserved, but the supplied-sheet treatment and access to readable campaign conditions need correction before phone release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture preserves recognizable product data, navigation and independent review/payment states. It cannot verify menu operation, strip navigation, inspection links or onboarding destinations. Fix the source treatment and provide readable access to the product conditions before signing off this viewport.

The chapter reads as a concrete consumer task, not a SaaS pitch: supplied artwork leads into a real Story opportunity and proof state. The palette, typography, generous section spacing and restrained header broadly carry Frame Shift. However, the rounded backing changes the approved supplied-sheet treatment, and the source-to-commitment relationship is clearer visually than operationally because its payment and status details live inside a miniature device capture. The deliberate horizontal strip is not the problem; readable conditions and inspectable sources are.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 7 |
| uniqueness | 7 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 6 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- Mineral canvas, restrained cobalt, graphite typography and the recognizable TapMart header.
- The direct heading “Share the supplied Story.” and the immediate eligibility/live-time qualification.
- Creative-first sequencing and the explanation that the business supplies the artwork.
- Actual product screens showing conditional payment and submitted proof rather than invented success states.
- The distinction between the creative's $4 retail promotion and the opportunity's $25.00 conditional creator payment.

## Expected differences (real data)

- The supplied iced-latte creative replaces the Lab coffee-and-croissant fixture. Preserve its business branding, promotional $4 price and original artwork.
- The production Story opportunity shows $25.00, a 500-follower requirement, Demo Coffee Co. and a September deadline rather than the Lab fixture values.
- Tyler Okafor and submitted proof marked In review correctly replace the Lab's Maya identity and open opportunity. Submission must not be presented as approval or earned money.
- The horizontal sequence of creative, campaign and proof frames is intentional for this public-site migration. The next item being cut off at the right edge is not itself responsive drift.
- Real production captures replace the Lab's native working excerpts; their internal application navigation and controls should remain unchanged.

## Drift and usability

1. [usability] **Keep the authentic device capture, but expose the campaign's payment and conditions as selectable HTML in its strip item: amount at Archivo 700 30/34px and basis/requirements at IBM Plex Sans 14/20px. Populate these from the same demo record, including $25.00, after 24h live and approval, and 500+ followers. Add an ink “Inspect campaign screen” action with a minimum 44px target opening the same capture at readable size; provide equivalent inspection for the supplied creative and proof screen.** (Campaign and proof items in the phone strip). The visible device renders essential conditions and proof status at miniature screenshot scale. Swiping it fully into view will remove clipping but will not increase that text size. Unlike the Lab's readable operational excerpts, this view currently relies on a small image to explain the commitment. Embedded screenshot controls are not substitutes for actual public-page controls.
2. [drift] **Remove the Story's rounded mineral backing and its approximately 12px inset padding. Render the supplied image as an intact sheet with width:180px; height:auto; object-fit:contain; border-radius:0; background:transparent; box-shadow:0 6px 16px #10182018. Keep the existing horizontal sequence.** (First strip item, beneath “The creative is ready”). The production creative sits inside a thick rounded underlay. The approved Post material is the supplied sheet itself, with square edges and source-only depth—not a generic media card. This weakens the chapter's distinct silhouette.
