# V3 review: Business Home with Loyalty, pass 1

Reviewer: Astra, TapMart's design director.

Captures: business-home-m-full.png, business-home-d.png, business-home-states-m-none.png, business-home-states-d-live-empty.png

**Verdict: fix.** Find a person or car to advertise Loopday. Below that, Loyalty shows ten members and six who came back, with a direct way to open it.

## The ten questions

- Does this feel like a premium modern product? **yes**. Large untreated photography, clear action bands and open spacing feel considered. Inconsistent brand marks and the floating lab pill are the remaining polish defects.
- Does it explain itself without paragraphs? **yes**. People, car asking terms and Loyalty's members-to-return sentence are understandable without supporting paragraphs.
- Does it feel like a consumer platform, not business software? **yes**. Faces and work dominate. Loyalty is a small business tool within discovery, not an administrative dashboard.
- Is it memorable? **partly**. The portrait/work composition has character. The return seam is coherent but intentionally quiet; the inconsistent Loopday identity weakens its signature.
- Does motion improve understanding? **partly**. No motion strip was supplied. Static states establish a sensible hierarchy but cannot prove transitions, recognition or count-update behavior.
- Does each earning type feel different? **partly**. People and vehicle opportunities have distinct silhouettes. Recreate versus Story is not demonstrated on this surface.
- Is business discovery exciting? **yes**. Maya's face and two work samples invite inspection; the car provides a genuinely different advertising option. Nora continues the visual quality below.
- Is Profile identity, not settings? **partly**. Profile is not captured. The Business navigation label does not establish the quality of its destination.
- Does the website make someone keep scrolling? **partly**. The public website is outside these captures. This marketplace does offer a clear visual continuation, but that is not evidence for the public sequence.
- Is it significantly stronger than current production? **partly**. The Loyalty entry adds a useful retention proposition while protecting discovery. No production comparison or operational Loyalty captures were supplied to establish the full improvement.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. It occupies a deliberate seam inside the existing marketplace and adds no primary destination, dashboard or competing visual system.
- Does it strengthen the business value proposition? **yes**. Members and came back introduce retention alongside advertising discovery. The actual recording and redemption benefits still require their own review.
- Can a business understand it quickly? **yes**. The live entry is one count sentence and one action. No-program and live-empty states each offer an appropriate next step.
- Does it feel consumer quality rather than SaaS admin? **yes**. A small brand object and plain-language counts sit directly on paper. There are no metric tiles, tables or administrative toolbar.
- Does attribution feel powerful without becoming fake analytics? **partly**. The entry honestly distinguishes membership from return and makes no revenue claim. No source descent, definitions or drill-down is shown, so attribution power remains unproven.

## Scores

- motion understanding: 0
- slop risk: 2
- text discipline: 9
- natural part of tapmart: 9
- attribution honest power: 6
- memorable: 7
- quick to understand: 9
- self explaining: 9
- business value: 8
- wallet realism: 0
- truthfulness: 8
- consumer not software: 9
- premium: 8

## Spec drift

- Eli's vehicle location reads Austin rather than the specified Round Rock. Restore the vehicle's record location without changing the discovery-city control.
- Phone and desktop business switchers use an LC initials disc instead of the approved loop mark. Replace only the identity artwork, preserving the switcher behavior.
- The live Loyalty thumbnail places a prominent loop over the image rather than a reduced mark in an 18px ink corner block. Restore the prescribed crop and corner treatment.
- The build adds a floating Design Lab pill alongside the already visible fictional-context entrance. Consolidate its presentation and prevent media occlusion.
- The build uses two work images, phone identity below media and different desktop image baselines. These are accepted departures under the revised instructions in spec_was_wrong; do not mechanically revert them.

## Spec was wrong

- The instruction to preserve the existing marketplace conflicted with the later instruction to reduce each person's authored work to one still. Keep the two ownership-matched work images shown here: they make discovery richer without adding explanation. Do not replace them merely to satisfy the single-slot dimensions.
- The phone specification put Maya's identity above her media. The built media-first composition reads better and preserves the inherited marketplace. Keep her name and actions below the images.
- Requiring a shared desktop image baseline would push the taller car fact band below Maya's actions. The captured composition instead brings the completed action bands to approximately the same bottom edge. Keep this action-band alignment; let the image baselines differ.

## Fixes

- 1. Replace Austin in Eli's vehicle fact band with Round Rock, using the vehicle record rather than the active discovery city. Preserve Austin in the Home city selector. (Eli's car on phone and desktop, including alternative Loyalty states and its linked preview.): The car's location is a material marketplace fact. Every supplied capture currently contradicts the specified vehicle fixture.
- 2. Replace the LC avatar in the phone identity switcher and desktop sidebar with the approved open-loop mark. Use the same loop geometry and brick terminal as the no-program entry, at the appropriate header size. (Phone header and desktop active-business switcher.): The page currently presents two identities for the same business. Consistency makes Loyalty look owned by Loopday rather than appended to it.
- 3. Restore the live thumbnail to an untreated photographic crop. Move the reduced loop into an 18px solid-ink corner block instead of placing a large pale mark over the middle of the photograph. (Live and live-empty Loyalty artwork; apply the same treatment to draft artwork when present.): The artwork should remain a recognizable fragment, not become a miniature promotional tile or watermark. The specified corner treatment is cleaner at 56px.
- 4. Consolidate the duplicated Design Lab entrances. Keep the visible fictional-context control at the top; show the floating lab shortcut only when that control is off-screen, and dock it outside media and product-action bounds. On phone reserve its clearance above navigation rather than covering work. (Shared Design Lab launcher on this route.): The large floating pill visibly interrupts the car on the full phone capture and Nora's work in the no-program capture. Lab tooling must not become the strongest overlay in the marketplace.
- 5. Supply the missing responsive and behavioral evidence before approval: all six required viewport sizes, draft state, discovery filters including empty results, More, return after signup, unchanged counts after Sara's unlock/redemption, keyboard focus, Back, 200% text zoom and reduced motion. (Next capture set and V3 review report.): The supplied states validate the composition, but not filter persistence, data-derived counts, narrow-phone fit or interaction safety.

## Keep

- Marketplace first: Maya's face and actual work remain the opening, with the independent car opportunity beside or after her.
- The Loyalty strip's exact structural placement: after the complete lead marketplace group and before Nora.
- The open paper strip, two hairline separators, small artwork, two counts and one quiet action. No dashboard container.
- Distinct View person and Request actions, square media, restrained earning edges and the visible asking-rate basis.
- All five primary destinations, Home selected here, and lime reserved for campaign Create.
- The captured state changes: no program offers Create program without fake counts; live-empty shows zero counts and View QR.
- The warm paper, green-black typography and restrained brick detail. This is recognizably Open Cut.

## Why better than production

This adds a clear bridge from finding someone to advertise the shop to seeing whether customers return. The business can discover Loyalty without losing the people-and-cars marketplace. The entry communicates enrollment and repeat visits in one line, with an appropriate next action even before a program has members. These captures demonstrate the entry, not yet the working retention or attribution system.

## Remaining risks

- Scores use a 0 to 10 scale. Motion understanding and Wallet realism are scored 0 because neither is observable here, not because this Home should contain motion demonstrations or Wallet cards.
- Only live, no-program and live-empty entries are visible. Draft behavior and the stability of every state across discovery filters remain unverified.
- The full-page phone image is not a substitute for a native first-viewport capture with a measured word count. Do not shrink the current readable type to meet the budget.
- No 320px, tablet, 1920px or 200% text-zoom evidence was supplied. Header fit, rail transitions and narrow count wrapping remain approval gates.
- Static pixels cannot establish shared-provider projections, idempotency, scroll restoration, route isolation or keyboard behavior.
- Media ownership, the Loopday crop source and exact color/font tokens require the manifest and implementation report; appearance alone cannot verify those bindings.
- Do not treat the full-page capture's fixed navigation placement as a layout defect.
