# Transfer QA: Public homepage, Post chapter (desktop 1440), Stage 6 pass 1

Production: `d-post-review.png` · Approved Lab: `d-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:57:44.732Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. Canvas chapter: the 9:16 creative as the major object, eligibility, proof, Activity.

**Verdict.** The real product story survives, but Frame Shift is only partially transferred: restore the readable source-to-terms joint, the unframed Story sheet and explicit device provenance before release.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** Not ready for visual sign-off at this desktop viewport. The capture preserves recognizable production data, states and navigation, but essential terms need readable public HTML and the source-to-decision relationship needs restoring. Frame switching, Activity coverage, links and keyboard behavior still require interaction testing.

This reads as a concrete consumer task rather than an AI template: supplied artwork leads to posting instructions and a real proof-review screen. The captured app still exposes Home, Save, creative inspection, proof inspection, Activity, Earnings and Profile, with no visible fabricated approval or payout. However, the first composition separates the source from all concrete creator terms, and the later composition relies on miniature device text to explain the decision. The neutral picture mat also weakens the approved free-sheet treatment. These are language and usability gaps, not reasons to reproduce the Lab's three-column layout. The supplied composite does not show the eligibility or Activity frame, so their implementation cannot be signed off from these pixels.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 7 |
| media quality | 8 |
| uniqueness | 6 |
| clarity | 7 |
| premium feel | 7 |
| fidelity | 6 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 2 |

## Keep

- The prominent portrait creative and direct “Share the supplied Story” instruction make Post understandable without generic platform claims.
- Keep the mineral canvas, graphite typography, restrained cobalt actions and unboxed explanatory steps.
- Keep the real Story-detail and proof capture, including separate supplied-creative and proof inspection controls, conditional pay and literal review status.
- Retain the public navigation, including Pricing, Sign in and Get started.
- Retain the approved Stage 6 sticky-frame storytelling approach. The repeated header belongs to the composite capture and is not evidence of a duplicated page header.

## Expected differences (real data)

- Demo Roastery's iced-latte artwork correctly replaces the Lab's Loopday Story. Preserve the supplied creative, including its promotional price; that price is not creator pay.
- The production opportunity pays $25.00 rather than the Lab's $35.00. Its actual follower requirement, deadline, availability and conditional payment wording should remain.
- Devon Carter and the initial avatar correctly reflect the captured production account rather than the Lab's Maya fixture.
- Submitted proof marked “In review · Sent Sep 9” is a legitimate later production state, not drift from the Lab's open opportunity.

## Drift and usability

1. [usability] **Add a stationary, square-cornered HTML terms excerpt joined to the Story stage with one 24px desktop offset. Bind it to the same demonstrated opportunity: $25.00, “after 24h live and approval,” “1,000+ followers,” and “24h live.” Use Archivo 700 at 34/38px for pay and IBM Plex Sans at 14/20px minimum for conditions. Keep these facts visible as the stage changes from creative to proof; do not animate the amount or infer eligibility.** (Right-hand sticky Story/product stage and its relationship to the chapter explanation). At the chapter start, the creative's $4 offer is the only prominent money. Creator pay and concrete requirements appear later as small text inside the reduced phone capture. The general eligibility sentence does not supply an equally readable commitment. This also leaves the major source without Frame Shift's characteristic source-to-fact joint.
2. [drift] **Remove the Story wrapper's approximately 12px all-around neutral padding and rounded backing. Render the supplied sheet at aspect-ratio: 9 / 16 with object-fit: contain, border-radius: 0 and no artwork overlays. If depth is needed, apply only 0 6px 16px #10182018 to the sheet. Keep its caption outside the image.** (Large iced-latte Story at the chapter start). The production creative sits inside a thick neutral picture mat with rounded outer corners. The approved Story treatment is an intact, square-edged supplied sheet; underlay is for necessary letterboxing, not a decorative frame.
2. [data_honesty] **Place a persistent caption immediately below the device stage with an 8px gap, IBM Plex Sans 14/20px and #526171: “Demo product · Story proof in review.” Update the descriptive portion to match each displayed capture. Add an ink “Inspect screen” control with a minimum 44px target that opens the same production capture at readable size; support Escape, a visible Close control and focus return.** (Later-step Story proof device frame). The visible later device has no external demo caption or enlargement affordance. Its operational text is reduced substantially, while the creative's embedded development label does not establish the scope of the account, amount and proof state shown in the separate product frame.
