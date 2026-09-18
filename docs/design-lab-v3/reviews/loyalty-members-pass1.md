# V3 review: Members, member detail and recording, pass 1

Reviewer: Astra, TapMart's design director.

Captures: members-m.png, members-d.png, member-m-full.png, member-d.png, record-m-found.png, record-m-unlocked.png, record-m-same-day.png, add-visit-m-strip.png

**Verdict: recompose.** Sara has four visits toward a free coffee. Count one more and her reward becomes ready. Her membership came from Jasmine’s Story.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette and open surfaces are strong. The stretched desktop directory, oversized square stamps, duplicate headers and loose detail spacing feel unfinished.
- Does it explain itself without paragraphs? **partly**. Counting and the same-day rejection are understandable. Repeated roster units, expanded history and repeated unlock copy weaken the intended brevity.
- Does it feel like a consumer platform, not business software? **partly**. Phone recognition is direct and approachable. Desktop becomes a full-width administrative list followed by a sparse record page.
- Is it memorable? **partly**. The campaign source attached to Sara is distinctive. The prominent stamp squares are generic loyalty imagery rather than Open Cut’s straight progress language.
- Does motion improve understanding? **partly**. The strip establishes scan → recognized member → reward ready. It does not resolve the specified recognition sweep or newly earned stroke animation; the whole stamp row changes to lime.
- Does each earning type feel different? **partly**. Not assessable here. Only a Story acquisition label appears; no earning-type compositions are captured.
- Is business discovery exciting? **partly**. The marketplace is outside these captures. The preserved Home destination is not evidence of discovery quality.
- Is Profile identity, not settings? **partly**. Profile is not shown. The member record appropriately leads with identity and progress, but it is not a Profile review.
- Does the website make someone keep scrolling? **partly**. No public website or Loyalty sequence is included in this surface.
- Is it significantly stronger than current production? **partly**. The visible member-to-source relationship adds meaningful capability. A direct production comparison and the completed redemption loop are not supplied.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **partly**. The shell, palette and Business selection fit. The stamp graphics and desktop directory do not follow the specified Open Cut composition.
- Does it strengthen the business value proposition? **yes**. The captures connect a named campaign source to an identifiable member and show a qualifying return unlocking a reward.
- Can a business understand it quickly? **partly**. The recognized-member action is obvious. The roster lacks a visible counter entrance, and the same-day state leaves the rejected action prominent.
- Does it feel consumer quality rather than SaaS admin? **partly**. The phone counter is simple. Desktop is a stretched list, and the expanded record history makes the detail feel administrative.
- Does attribution feel powerful without becoming fake analytics? **partly**. Jasmine remains attached to Sara without revenue or conversion claims. Source persistence after redemption and the underlying timestamp evidence still need verification.

## Scores

- motion understanding: 4
- slop risk: 4
- text discipline: 4
- natural part of tapmart: 7
- attribution honest power: 6
- memorable: 5
- quick to understand: 7
- self explaining: 6
- business value: 7
- wallet realism: 2
- truthfulness: 7
- consumer not software: 5
- premium: 5

## Spec drift

- Desktop has neither the 440px roster/detail split nor Sara’s initial inspection. Replace the full-width list and isolated detail composition with the specified split layout.
- The phone roster retains the global utility header and omits its visible Add visit action. Replace that stack with the focused roster header.
- Collecting roster rows show full visit sentences and stamp graphics instead of compact fractions under a Visits heading. Remove both repetitions.
- An extra Redeemed filter appears and clips on phone. Keep the specified three default filters; preserve redemption drill-downs through their existing query views.
- Progress uses large squares, dashed outlines and lime completion rather than thin ink strokes. Restore the specified geometry, color and weight.
- Member detail shows +1 visit rather than Add visit, includes the joined date in identity, and expands History by default. Restore the task boundary and on-demand hierarchy.
- The source thread includes an initial tile and persistent preservation explanation. Replace these with the open, operable source block and its brick-ended edge.
- The scanner in the strip is dark and rectangular with lime brackets. Restore the square paper simulation and local labels outside the aperture.
- Recognition and results omit the member QR and readable member ID. Reinstate the stable identification area.
- The ready result omits 5 of 5 visits and duplicates Reward ready · Free coffee. Keep numeric completion and remove the repeated sentence.
- The same-day result leaves +1 visit dominant instead of settling into a receipt. Replace that action after the attempt.
- The fictional-context label is duplicated by a floating, shadowed Design Lab capsule. Use the existing context control as the single entrance.

## Spec was wrong

- The ready-state instructions allowed Reward ready to replace the numeric progress headline. That loses useful confirmation of the completed requirement. Keep Reward ready as the leading status, with 5 of 5 visits visible immediately beneath it.
- The recognition specification put identity above the QR while also requiring the QR to remain stationary. Reserve fixed identity and QR bounds across recognition, counting and redemption; let receipts grow below them rather than shifting the identification area.
- Restricting Next customer to post-result states was unnecessarily rigid. Keep it available before counting as an explicit way to abandon a mistaken recognition. It must clear the member and query without recording an event.
- The text-budget acceptance needs a reproducible counting rule. Report the first 390×844 viewport separately from the full document, count navigation and every visible repeated label, and never count a clipped row as one of the seven readable rows.

## Fixes

- 1. Recompose desktop into the specified 440px roster, 24px gutter and 712px member region at 1440. Inspect Sara initially without recording anything. Keep the detail reading column at 440px, add its 165px member QR shoulder, and retain the roster on explicit member selection. (members-d.png and member-d.png): The current 1176px-wide directory and separate mostly empty detail page miss the central desktop design decision. This is structural, not a spacing polish.
- 2. Restore task-specific headers. Phone roster: Back, Members and Add visit in one 56px row, followed by the 32px fictional-context row. Remove the extra identity/utilities header on this task. Desktop: add the quiet Scan action. Detail: use a Members return link, a separate identity block and Member actions overflow; label its primary action Add visit, reserving +1 visit for confirmed recognition. (Roster and member-detail headers and primary actions): Counter work currently has no visible entry in either roster capture, and the member detail blurs opening the task with committing a visit.
- 3. Use only All, Repeat visitors and Reward ready as the default filters. Replace repeated collecting sentences with compact fractions under Visits. Remove roster stamps. Keep 72px minimum rows and show seven complete readable rows at 390×844. Make the existing fictional-context control open Design Lab and remove the duplicate floating capsule. (members-m.png and members-d.png): The phone roster exceeds the under-40-word target, clips the extra Redeemed filter and partially obscures the seventh row. Desktop repeats the same information across an excessive distance.
- 4. Replace square stamps with five equal 4px-high strokes separated by 8px. Use ink for completed strokes and a solid 1px muted outline for remaining strokes; remove dashed next-stamp styling and lime reward fills. Use DM Sans 600 progress at 32px on phone and 48px on desktop. Place the brick-ended source edge with Joined from, not above the member’s progress. (Member detail and all recording states): The current stamp system introduces an unapproved visual language and makes every mark change when only the final visit was earned.
- 5. Rebuild scanner recognition around the specified paper aperture: 264px square at 390, 244px at 320, ink corner brackets, Scanner simulation above and No camera is used. below. Keep Scan/Search accessible. On recognition, preserve the aperture bounds and show the masked identity, actual 165px member QR and readable LD identifier. (add-visit-m-strip.png and record-m-found.png): The strip begins with a tall dark, lime-bracketed camera-like panel, then replaces it with a completely different layout. No member QR is visible in any recognized or result capture.
- 6. Use a reserved result region instead of retaining a count action after a no-op. Same-day: replace +1 visit with the unchanged receipt, Details, Done and Next customer. Unlock: show Reward ready, 5 of 5 visits, Free coffee once, Redeem and the simulation receipt. Consolidate the exit actions into one wrapping row of 44px targets and remove the ambiguous second close icon beside the member. (record-m-found.png, record-m-unlocked.png and record-m-same-day.png): The current same-day screen visually invites another count despite its own rejection. The unlock repeats the state and reward, omits the numeric completion and moves secondary actions unnecessarily.
- 7. Tighten detail to identity → progress → full-width 48px Add visit → source after 32px → compact Wallet → collapsed History. Remove the Jasmine initial tile. Move joined date, acquisition explanation and event times into their relevant disclosures. (member-m-full.png and member-d.png): The full phone detail is roughly three screens long before any disclosure is requested. Source identity matters; its explanatory paragraph and full audit trail do not need to compete with daily counter work.
- 8. Audit history against the supplied fixture events. Sort displayed events consistently by their actual timestamps. Remove the 8:53 AM Wallet-save time and 8:50 AM link event unless a separately supplied fixture record supports each; a simulated saved-platform projection is not timestamp evidence. (Sara’s expanded History): The visible September 8 events are out of chronological order, and the captures introduce precise evidence absent from this surface’s fixture inventory.
- 9. Implement the restrained transition after the event commits: animate only the newly earned stroke for 220ms and crossfade the complete number for 120ms. Keep identity, QR and source bounds stable; make Redeem available immediately. Supply a timestamped normal-motion strip and its reduced-motion equivalent. (Recognition and reward-unlock interaction): The current strip shows state endpoints but does not prove semantic progress motion, stable QR continuity or the specified timing. Recoloring all five stamps is not the intended explanation.

## Keep

- The warm paper, green-black text, restrained separators and absence of enclosing dashboard cards.
- The five Business destinations, selected Business state, 200px desktop sidebar and campaign-specific lime Create action.
- First-name-only roster identities and masked member contacts. Do not add portraits, full-contact controls or engagement scores.
- Sara’s correct source: Jasmine / Morning loop · Story campaign.
- The explicit fictional context, Apple Wallet · simulated summary and Wallet update simulated receipt.
- The same-day explanation: Already counted today., unchanged progress and the daily counting rule. No Wallet-update receipt appears in that captured no-op state.
- Reward ready exposes Redeem rather than automatically consuming the reward. Keep the restrained, non-celebratory result.
- The visible baseline roster order and the distinction between Reward ready, Reward redeemed and No visits yet.

## Why better than production

This introduces a useful business loop: find a member, count a qualifying return, reveal an earned reward, and retain the campaign that brought that person in. Sara’s connection to Jasmine is visible, and the same-day receipt explains why another attempt earns nothing. That strengthens TapMart beyond acquiring attention. However, these captures do not yet demonstrate the complete source-to-redemption loop or a production-ready counter experience.

## Remaining risks

- Scores use a 0 to 10 scale. Wallet realism scores review evidence, not a rejected card design: no native Wallet concept is visible in these captures.
- No desktop recording capture, 320px, tablet, 1920px, text-zoom or keyboard/focus evidence is supplied.
- The strip has no timestamps. Recognition latency, immediate action availability, commit timing and reduced-motion behavior cannot be verified.
- No redemption confirmation or completed redemption is captured. Reward-instance consumption, retained extra progress and Jasmine’s changed unique-redeemer count remain unverified.
- The screenshots cannot establish idempotency, atomic event projections, timezone handling, route isolation or the absence of production/network mutations.
- Points, unknown QR, recording error, Wallet-not-added, Google-cap, no-program and empty-list states remain unreviewed.
- Actual QR encoding, quiet zone and readability cannot be assessed until the member QR is rendered.
- Exact font loading and color values require implementation inspection; the paper and ink appear broadly aligned, but computed tokens are not available from these images.
- The full-page phone capture’s fixed controls are not treated as a page-layout defect. The floating Lab control nevertheless visibly obstructs roster content in the viewport capture.
