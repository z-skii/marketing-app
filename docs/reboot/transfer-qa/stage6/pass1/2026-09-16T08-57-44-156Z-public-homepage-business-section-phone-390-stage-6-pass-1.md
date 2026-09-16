# Transfer QA: Public homepage, business section (phone 390), Stage 6 pass 1

Production: `m-business-review.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:44.156Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Composite of four viewport captures down the business section: the head, campaigns with its phone frames, monthly content with the Content frame and shoot photos, the plan lines and the spending separation.

**Verdict.** Frame Shift is substantially faithful and the visible product semantics remain intact, but this phone business section needs readable frame inspection and the mineral canvas restored before sign-off.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** The visible production functionality and financial distinctions are preserved. This capture cannot verify menu behavior, strip navigation, account-entry destinations or application actions. Hold this viewport for a small surface correction and a clearly exposed way to inspect the product frames.

This reads as a real consumer-and-business platform rather than a generic SaaS template: work-led discovery, campaign setup and delivered-content review occupy the page, with practical copy explaining what businesses do. The heading hierarchy, 16px phone gutters, restrained controls and unboxed plan treatment broadly retain Frame Shift. Subscription prices are not presented as creator earnings, and campaign funding is explicitly separate. The phone strips are an authorized production composition, not layout drift from the Lab. The remaining weaknesses are the broad white canvas and product details reduced below comfortable reading size without a visible inspection route. Repeated headers and cropped section boundaries belong to the supplied viewport composite and are not page defects.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 8 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 8 |
| ai slop risk | 2 |

## Keep

- The direct business proposition and clear Campaigns → Monthly content sequence.
- Real Business Home, Create and Content captures as the product evidence; do not replace them with fabricated marketing UI.
- The approved phone-strip approach, including intentional right-edge clipping of later items.
- The restrained TapMart lockup, graphite device housings, cobalt primary action and outlined secondary action.
- Unboxed plan rows with explicit shoot allocations and prices.
- The prominent distinction between content subscription spending and campaign credit.
- The external “Sample shoot photography” caption and the separate photographic source.

## Expected differences (real data)

- The frames show production demo-account records, including Demo Coffee Co. and Jasmine Reed, rather than the Lab’s Maya and Loopday fixtures.
- Content shows the actual “The slow pour.” record and “Edit requested” state instead of the Lab’s “Counter reset” and “New” state. That state must not be normalized to the Lab.
- The configured $99/month Essential and $199/month Growth prices correctly replace the Lab’s unpriced inclusion lines. Shoot and output allocations remain explicit.
- Production application screens retain their actual navigation, campaign creation choices, content library and review states rather than the Lab’s isolated interactive excerpts.

## Drift and usability

1. [usability] **Keep the horizontal strips, but add a visible ink “Inspect screen” action for each product frame, using 16/20px IBM Plex Sans 600 and a minimum 44px target. Open the selected original in a viewer that fits it to the available viewport width and supports zoom; provide a visible 44px Close control, Escape dismissal and focus return.** (Campaigns Business Home/Create frames and the Monthly content Content frame.). Each device is approximately 184 CSS px wide at this 390px viewport. Business identity, file status, provenance and much of the navigation consequently render at roughly 6–8px. The overall screen silhouettes communicate real software, but visitors cannot comfortably inspect the details carrying the product story. No external inspection affordance is visible here.
2. [drift] **Set the outer business chapter background to --tm-canvas: #F4F3EF rather than #FFFFFF. Preserve white inside the captured working UI and preserve #E7E7E2 for actual source backing. Do not recolor screenshot pixels.** (Business chapter, from “For businesses” through the business account and plans actions.). The business chapter is a large white marketing field, whereas the approved mineral canvas distinguishes the public narrative from white working surfaces. The production header and following Get paid region already demonstrate that warmer neutral.
