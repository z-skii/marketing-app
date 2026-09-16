# Transfer QA: Public homepage, Drive chapter (desktop 1440), Stage 6 pass 1

Production: `d-drive-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:43.258Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Underlay chapter: a real car with no ad, the placement, the booking waiting for installation photos.

**Verdict.** Frame Shift’s visual foundation is recognizable, but the Drive chapter needs corrected source provenance, a properly fitted device and the actual booking-proof state before release.

**Faithful transfer: NO. Functionality intact: NO. Ready to ship: NO.** Not ready for desktop sign-off. The capture preserves substantial real campaign functionality visually, but the installation-proof step displays campaign detail rather than the booking state it promises. This does not establish that backend functionality is broken; the public presentation has not demonstrated the required workflow.

The chapter reads as a tangible consumer workflow rather than a SaaS dashboard pitch: a large unwrapped car, direct task language and a real campaign screen carry it. Surface temperature, ink hierarchy and cobalt restraint are consistent with Frame Shift. However, the later frame shows the wrong workflow state, is obscured by the header, and lacks the visible demo/status handoff needed to explain the product without deciphering small screenshot text. The source caption also overstates the provenance of the reused illustration.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 6 |
| media quality | 7 |
| uniqueness | 6 |
| clarity | 6 |
| premium feel | 7 |
| fidelity | 6 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 3 |

## Keep

- Mineral header, underlay Drive chapter, graphite typography and restrained cobalt actions.
- The large, unobscured unwrapped-car source and its separation from supplied campaign artwork.
- Clear consumer instructions: add a car, book, install and submit proof.
- Conditional monthly-pay wording rather than an instant or guaranteed earnings promise.
- Authentic product pixels, including gross/net payment distinctions, placement terms, artwork inspection and application navigation.

## Expected differences (real data)

- Production campaign terms correctly replace Lab fixtures: $300.00 per month, $255.00 after the 15% fee, rear-window placement, 30 days and Raleigh. Do not restore the Lab’s $240.00 rear-door campaign.
- Devon Carter, Demo Roastery and the initial avatar are legitimate production demo-account content.
- The wrapped vehicle inside the product capture is supplied campaign creative, distinct from the unwrapped contextual photograph; it is not inherently a fabricated installation claim.
- The sequential sticky product presentation and additional Pricing destination are intentional public-site differences, not reasons to recreate the Lab layout.
- The repeated header and omitted intermediate step belong to the supplied composite, not necessarily the page implementation.

## Drift and usability

1. [usability] **Bind Drive step 03 to the real car-booking capture showing its literal waiting-for-installation-photos status and proof action. Keep the campaign-detail capture assigned to the campaign/placement step. Update the frame and its caption together when the active step changes; do not simulate a booking transition.** (Lower composite, step 03 and its sticky phone). “Book it, install it, prove it” is paired with campaign detail showing Save, campaign terms and artwork inspection. No booking status or installation-photo action is visible, so the product frame does not substantiate this step.
1. [data_honesty] **Replace “A real car in its neighbourhood” with accurate asset provenance. For this reused Lab illustration, use “Campaign illustration · No installed ad” at 14/20px. Keep any explanation of installation separate from the source caption.** (Caption beneath the unwrapped-car image). The same contextual asset is explicitly labeled a campaign illustration in the approved capture. Calling it a real car without that provenance makes the source sound like photographed production inventory.
1. [responsive] **Reserve the sticky header’s full height plus 24px above the device: set the product stage’s sticky top to calc(var(--public-header-height) + 24px). Fit the complete device and its caption within the remaining viewport height; below that fit threshold, use normal document flow rather than clipping the frame.** (Lower composite, top of the phone immediately beneath the public header). In the later-step capture, the device’s upper edge disappears beneath the navigation. The first stage looks composed, but the working-product stage looks cropped by the shell.
2. [drift] **Attach a native HTML factual caption to the active source/frame with a 24px desktop offset, square corners and no shadow. Use 14/20px for “Demo product” and literal status, and 16/24px for the relevant condition. For step 03, identify the demo booking and its actual installation-photo requirement. Keep the caption visible with the frame and avoid repeating the amount as an outcome.** (Sticky product assembly, especially the installation-proof step). The current arrangement leaves explanatory copy far from a standalone phone, with important conditions reduced to screenshot text and no visible external demo caption. The approved language connects source to a readable commitment; here that relationship is weaker than the neutral palette and typography.
