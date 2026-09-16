# Transfer QA: Public homepage, full page (phone 390), Stage 6 pass 1

Production: `m-full.png` · Approved Lab: `m-design_lab_public_home-full.png` · Reviewer: Astra, design QA director · 2026-09-16T08:58:04.097Z
Instructions: Stage 6 is the public TapMart website, the final visual migration. It is not a transfer of the Lab public home mockup; the Lab capture is supplied only as the approved Frame Shift language and approved copy reference, not a layout to match. The production app is the source of truth: every screen shown inside a device frame is a real production capture (User Home, Recreate detail and its revision state, Story detail and submitted proof, the car campaign and its booking, Activity, Earnings, Business Home, Content, Create and Review) taken with local demo accounts, so demo names and demo amounts appear inside the frames and are captioned as demo. Judge whether the page reads as a real consumer and business platform on the Frame Shift foundation, not a SaaS landing page, an AI template, an agency site or a generic marketplace; whether a visitor understands TapMart quickly (Recreate, Post, Drive, Get paid, then how businesses use it: campaigns and monthly content) and wants to enter; and whether the real product frames carry the story. Desktop chapters use a sticky product stage that swaps the real frame as the reader moves through the steps; where a chapter is supplied as a composite, the upper image is the chapter start and the lower image is a later step with its frame. Phone is natural vertical flow with a horizontal strip of frames per chapter, so the strip's later items are cut at the right edge by design. Product rules that are not drift: subscription, campaign credit and creator earnings are three separate amounts and are stated as such; there is no instant payout promise (TapMart sends payouts by hand, the minimum and the fee are real settings); no fabricated earnings as outcomes; no video exists in production media so none is shown; no fake installed ad on a real car (the wrapped car inside the campaign frame is the business's supplied campaign illustration, the photographed car carries no ad); prices and shoot allocations come from production configuration; the public site may be more expressive than the signed-in app. Do not propose a new design system. Flag drift from Frame Shift, weak hierarchy, anything that reads as template or SaaS, anything dishonest, and usability problems, each with an exact fix. The entire phone page.

**Verdict.** The real product story survives, but Frame Shift is only partially transferred; restore readable commitments, meaningful source joints and phone-strip navigation before shipping.

**Faithful transfer: NO. Functionality intact: YES. Ready to ship: NO.** The capture preserves the platform's functional story and exposes earning, business onboarding, plans and legal navigation. It cannot verify menu operation, strip scrolling, destination routing or authenticated workflows. Sign off after the visual fixes and a keyboard/touch navigation check at 390px and 320px.

This reads as a real consumer and business platform, not an agency portfolio: the page names the three earning tasks, shows actual work states and explains campaigns versus monthly shoots. Its surfaces, restrained palette and source selection substantially follow Frame Shift. The incomplete transfer is in hierarchy and composition: commitments have become miniature screenshot content, the website rarely expresses the 12px source-to-fact joint, and the lower pricing treatment falls back to rounded SaaS cards. No visible evidence establishes broken production functionality or fabricated earnings, but this phone presentation is not yet a release-quality transfer.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 6 |
| media quality | 7 |
| uniqueness | 7 |
| clarity | 7 |
| premium feel | 6 |
| fidelity | 6 |
| usability | 6 |
| brand recognition | 7 |
| ai slop risk | 3 |

## Keep

- The immediate explanation of local paid work and the two clear audience entry actions.
- The Recreate → Post → Drive → business campaigns → monthly content sequence.
- Graphite for making, mineral canvas for supplied creative and the underlay for vehicle inventory.
- Real application screens showing briefs, proof, review and content states instead of invented product illustrations.
- The intact Story artwork, unwrapped vehicle photograph and restrained cobalt accents.
- Explicit approval conditions, separate campaign spending and literal manual-payout wording.

## Expected differences (real data)

- The production homepage uses real product captures and step-by-step frame strips rather than reproducing the Lab's interactive demonstration layout. That is intentional.
- Tyler Okafor, Demo Coffee Co., different campaign amounts, submitted proof and edit-requested content correctly replace the Lab fixtures.
- Later frames being partially visible at the right edge is intentional phone-strip behavior, not responsive overflow drift by itself.
- Configured $99 and $199 subscriptions, shoot allocations, the 15% earnings fee and the $25 payout minimum appropriately replace unspecified Lab settings.
- Subscription charges, campaign credit and creator earnings remain separate. Manual payout processing is correctly described without an instant-payment promise.
- Still references are appropriate when no reference footage exists. The unwrapped vehicle photograph and supplied campaign illustration are distinct sources, not evidence of an installed advertisement.
- A public marketing page need not expose the Lab's editable forms or reproduce its demo mutations.

## Drift and usability

1. [usability] **Keep the production frame strips, but add native HTML commitment captions to each relevant step: 14/20px IBM Plex Sans for task, payment basis and status; 30/34px Archivo 700 with tabular numerals for the opportunity amount. Bind these to the same captured demo record and formatter, retaining gross/net distinctions and conditional wording. Give each strip a visible 14/20px demo-scope caption.** (Recreate, Post and Drive frame strips; business Content demonstration). The real frames establish credibility, but their money, eligibility, deadlines and review states are too small to carry the operational explanation. The Lab made these facts readable outside its miniature phone. Here the visitor must decipher screen pixels or infer the conditions from general copy.
1. [drift] **Attach the native commitment caption to its source with --tm-shift-phone: 12px: inset the factual plane 12px from the source's leading edge and place it directly after the source. Use square corners and no shadow; use #2450E8 for the Recreate payment plane and white or ink treatment for the other materials. Apply this once per meaningful source-to-decision assembly, not to every step.** (Hero source assembly and earning chapter source-to-fact boundaries). Outside the captured app, the production page mostly presents independent screens and images in rows. Frame Shift's defining source-to-commitment relationship is largely confined to tiny pixels inside those screens rather than expressed by the website itself.
2. [usability] **Add visible Previous and Next controls with 44×44px minimum targets and a native 14/20px 'Step 1 of N' indicator to each chapter strip. Use overflow-x: auto, scroll-snap-type: x proximity and scroll-snap-align: start. Keep each step's explanatory copy within its own slide and preserve the intentional next-slide peek.** (Phone Recreate, Post and Drive horizontal strips). The screenshot cuts the second step's heading, explanation and device at the right edge, but shows no explicit browsing control or position indicator. A peek suggests more content without clearly communicating how much of the workflow remains.
2. [drift] **Restore the phone hierarchy: hero Archivo 800 at 48/48px with -0.05em tracking at 390px, reducing to 40/42px only below 360px; earning chapter headings Archivo 780 at 36/38px with -0.04em tracking. Keep operational body copy at 16/24px and section padding at 48px.** (Hero headline and Recreate, Post and Drive chapter headings). The hero and earning statements are visibly more compressed than the approved language. The small numbered labels, long chapter sentences and similar-sized business headings flatten the intended distinction between the public promise and supporting explanation.
2. [drift] **Make the Essential and Growth financial regions square with border-radius: 0, box-shadow: none and 24px padding. State each shoot allocation once per plan rather than repeating it in both the lead and checklist. Keep the configured prices, feature availability, separate-spending explanation and existing plan actions.** (Business plans section). The rounded white pricing cards and repeated allocation copy introduce the page's strongest generic SaaS treatment. These financial regions should follow Frame Shift's flat, square working surfaces without removing the real subscription product.
3. [drift] **Use the exact shared lockup in both header and footer: 28px mark, original 32×32 viewBox and paths, 8px gap, and Archivo 700 wordmark at 30/32px with -0.04em tracking. Retain at least 12px clear space and the 44px Menu target.** (Public header and footer). The production header and footer lockups are visibly undersized relative to the approved mark-and-wordmark treatment, weakening recognition despite the correct basic symbol.
