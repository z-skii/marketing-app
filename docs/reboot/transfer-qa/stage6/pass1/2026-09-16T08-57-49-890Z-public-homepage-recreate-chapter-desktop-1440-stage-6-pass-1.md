# Transfer QA: Public homepage, Recreate chapter (desktop 1440), Stage 6 pass 1

Production: `d-recreate-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:49.890Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Graphite chapter: reference, your own version, review with a revision note, earnings.

**Verdict.** Frame Shift is substantially present and the visible product functionality is preserved, but missing example provenance and insufficient inspection access prevent desktop release sign-off.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The captures preserve the product’s visible data, navigation and independent work states. They do not verify navigation handlers, sticky-frame switching, keyboard access or application submission. Resolve the presentation issues below before desktop sign-off; this review covers only the supplied Recreate chapter.

The chapter reads as a concrete creator workflow rather than a SaaS template: a supplied reference, conditional payment, actual review feedback and an earnings destination carry the explanation. Its graphite/cobalt relationship and in-product source joint are recognizably Frame Shift. The alternative sticky layout is not the problem. The remaining weaknesses are visible demo provenance, the readability and inspectability of the small product evidence, and the undersized header lockup. No fabricated payout, autoplay, installed-ad claim or obvious loss of production functionality is visible.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 7 |
| uniqueness | 7 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 7 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 2 |

## Keep

- Graphite making surface, mineral navigation shell, restrained cobalt payment ledge and pale-blue step numbers.
- Direct task headline and the reference → original version → review → earnings explanation.
- Real production frames rather than invented product illustrations.
- The source-to-payment offset inside the Recreate screen, square financial plane and identifiable reference.
- Explicit conditional pay, separate gross/net/fee values and literal revision feedback.
- Visible Home, Activity, Earnings and Profile navigation inside the product, plus persistent public Sign in and Get started actions.

## Expected differences (real data)

- The production opportunity, Demo Coffee Co., deadline and eight available spots correctly replace the Lab’s Loopday fixtures.
- $75.00 per approved version, $63.75 net and the separately disclosed $11.25 fee correctly reflect production configuration; they should not be changed to the Lab’s $65.00.
- The actual reference still replaces the Lab’s coffee-pour reference. Keeping it labeled “Reference · still” without playback controls is correct.
- Tyler’s portrait and Devon’s initial represent different real demo-account records. Neither needs replacement with Maya’s Lab identity.
- The revision-requested screen and specific business feedback are valid production states, not deviations from the Lab’s open opportunity.
- The sequential sticky product stage, additional Pricing destination and repeated header across this two-capture composite are not layout defects.

## Drift and usability

1. [data_honesty] **Reserve a caption immediately below the sticky device with a 12px gap, IBM Plex Sans 14/20px and #B3C0CE text. For these frames use “Demo product · Tyler · Open opportunity” and “Demo product · Devon · Revision requested”. Add “Separate example records, not a live progression” once beside the stage. Keep the caption visible with its frame at every sticky position.** (Sticky product stage in both captured chapter positions). Neither captured state visibly identifies the surrounding product demonstration as demo. “Demo Coffee Co.” inside a small screenshot is not sufficient provenance. The account also changes from Tyler to Devon while the narrative reads as one continuous journey; the public framing must distinguish examples without altering authentic app pixels.
1. [usability] **Keep the existing montage, but add a native “Inspect demo screen” control beneath the frame: minimum 44px height, 16/20px IBM Plex Sans 600, 8px radius, #F6F8FB text and a 1px #6E8194 border. Open the selected original capture at its native 390px width in a scrollable inspector, with a visible 44px Close control, Escape dismissal and focus return. Beside it provide a 44px “Find Recreate work” link into the existing earning entry route.** (Below the Recreate device and its provenance caption). The roughly 310px-wide device reduces operational metadata and fee details to approximately 10–12px. The first frame ends before the opportunity’s actionable controls, and the later frame’s revision note is similarly small. The chapter’s central evidence needs an inspectable destination; embedded screenshot controls cannot substitute for a working public next action.
2. [drift] **Restore the public header lockup to a 28px mark, an 8px mark-to-wordmark gap and Archivo 700 at 30/32px with -0.04em tracking. Preserve the exact 32×32 SVG viewBox and approved paths; retain at least 12px clear space.** (Public header in both composite captures). The production header lockup appears reduced to approximately a 24px mark and 24px wordmark. The surrounding navigation remains readable, but this weakens the explicitly fixed brand signature relative to the approved treatment.
