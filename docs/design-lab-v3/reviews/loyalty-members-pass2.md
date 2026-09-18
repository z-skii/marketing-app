# V3 review: Members, member detail and recording, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: members-m.png, members-d.png, member-m-full.png, member-d.png, record-m-found.png, record-m-unlocked.png, record-m-same-day.png, add-visit-m-strip.png

**Verdict: fix.** Find Sara. She has four of five visits toward a free coffee. Count the next visit; a reward becomes ready. Her member record connects her to Jasmine’s Story.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette, typography and open layout are convincing. Duplicate actions, uneven type sizes and the unfinished counter composition prevent finished-product approval.
- Does it explain itself without paragraphs? **yes**. Name, progress, reward and action are immediately understandable. The same-day receipt explains its consequence in three short lines.
- Does it feel like a consumer platform, not business software? **partly**. Names and large progress avoid CRM density. The desktop directory styling and detached QR-first counter layout still feel more utilitarian than considered.
- Is it memorable? **partly**. The five strokes and brick-ended acquisition thread provide identity. The source-to-return connection is more distinctive than the roster itself.
- Does motion improve understanding? **partly**. The strip establishes recognition before counting, followed by a completed fifth stroke and Reward ready. It does not establish sweep timing, progressive stroke fill or numeric crossfades; the action stack also shifts.
- Does each earning type feel different? **partly**. Earning opportunities are outside these captures. Story campaign is correctly named as acquisition context; do not add earning demonstrations to this surface.
- Is business discovery exciting? **partly**. The marketplace is not captured. These screens preserve its navigation but provide no evidence about the discovery composition.
- Is Profile identity, not settings? **partly**. Sara’s member detail prioritizes identity and progress over administration. Personal and Business Profile are not shown.
- Does the website make someone keep scrolling? **partly**. No public website is included in this review. A public sequence must not be added here to answer this question.
- Is it significantly stronger than current production? **partly**. The proposed source-linked counter workflow adds meaningful business value. These captures do not establish production readiness or provide a direct production comparison.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. Open Cut surfaces, the brick source seam and unchanged Business navigation make Loyalty feel owned by the existing business context.
- Does it strengthen the business value proposition? **yes**. The shop gets a clear repeat-visit routine, an earned-reward state and a member record connected to a campaign source.
- Can a business understand it quickly? **yes**. Four of five, Free coffee and Add visit communicate the immediate job. Same-day rejection is equally explicit.
- Does it feel consumer quality rather than SaaS admin? **partly**. There are no dashboard tiles, contact columns or engagement scores. Counter hierarchy, roster selection and inspection affordances still need finishing.
- Does attribution feel powerful without becoming fake analytics? **partly**. Jasmine’s named campaign is useful and makes no sales claim. Source evidence, aggregate reconciliation and preservation after redemption are not demonstrated in these captures.

## Scores

- motion understanding: 5
- slop risk: 2
- text discipline: 7
- natural part of tapmart: 8
- attribution honest power: 7
- memorable: 6
- quick to understand: 8
- self explaining: 8
- business value: 8
- wallet realism: 3
- truthfulness: 8
- consumer not software: 7
- premium: 7

## Spec drift

- Desktop shows a global filled Add visit as well as Sara’s filled Add visit. Replace the global control with quiet Scan and restore the full-width roster search.
- Phone adds Scan and Name beyond the specified compact roster hierarchy. Remove both; retain the header Add visit and Visits unit heading.
- Sara is selected through a name underline rather than the specified desktop row edge. Use the ink edge and brick terminal on desktop, with no automatic selected-member treatment on the phone roster.
- The desktop decision column and phone strokes stop at roughly 320px. Restore the 440px desktop reading column and full phone content-width strokes; restore the reward’s 18px hierarchy.
- Recognition places the QR before the member name rather than grouping identity above a centered QR. Restore the stable identification region and the Back path without reintroducing idle scanner controls.
- Unlock removes the numeric progress value and changes the action/footer positions. Keep an explicit 5 of 5 visits result and reserve the receipt/action geometry.
- View demo card and receipt Details are absent from the visible member and counter surfaces. Restore these contextual inspection actions.
- The QR matrix appears smaller than the specified version-2 matrix. Verify its actual encoding and render the specified 25-module symbol at integral module dimensions.

## Spec was wrong

- Requiring a separate phone identity block beneath a Members header spends space without improving recognition. Keep Sara as the single header title, move Member actions into its upper-right corner, group the masked contact beneath the lab context, and remove the redundant bottom Members link. Back must clearly return to Members.
- Repeating No visits yet in zero-progress roster rows makes the compact list unnecessarily wordy. Show 0/5 beneath Visits; retain No visits yet in member detail. This communicates zero counted visits without confusing enrollment with activity.
- Persistent Scan/Search controls are unnecessary after recognition. Keep them on scanner/search entry, then use Back to return to the selected mode and Close to exit. Do not restore idle scanner chrome around an already recognized member.

## Fixes

- 1. Recompose recognition into a stable 264px identification region: name and masked contact first, the 165px QR centered beneath, then its readable ID. Place progress and the counting action immediately below. Add a 44px Back control that returns to the selected recognition mode. Render +1 visit without the additional decorative plus icon. (record-m-found.png and all recognized counter states): The current left-aligned QR leads before the person and leaves a large unused shoulder. Staff should confirm the customer before interpreting a code; the button currently reads as two plus signs.
- 2. Keep Reward ready as the unlock headline, but retain an explicit 5 of 5 visits value beside the completed strokes. Reserve the receipt space before commitment so +1 visit and Redeem share the same action datum. Use 48px primary controls and one wrapping group of 44px Done, View member and Next customer targets. Before commitment show Done rather than Next customer. (record-m-found.png, record-m-unlocked.png and add-visit-m-strip.png): The numeric result currently disappears, Redeem shifts downward and the secondary actions move again when Done appears. The reward should become available without recomposing the transaction.
- 3. On desktop replace the global filled Add visit with the quiet Scan action and remove Scan from beside the search field. The inspected member’s Add visit must be the only filled product action. On phone retain the header Add visit, remove the duplicate Scan action and let search span the full content width. (members-m.png, members-d.png and member-d.png): Two filled desktop Add visit controls conceal the important distinction between starting an unselected scan and counting for Sara. The phone duplicates the same entry unnecessarily.
- 4. Restore the desktop detail’s 440px reading/action column inside the 712px region, with its separating hairline and 32px inset. Make Free coffee 18px rather than the current small metadata treatment. Extend phone progress strokes across the full 358px content width, using five equal strokes and 8px gaps. Keep desktop progress at 48px and phone progress at 32px. (member-m-full.png, members-d.png, member-d.png and counter progress groups): The desktop action and progress are currently only about 320px wide, while the phone strokes also stop short of their action edge. The reward should read as the benefit, not a footnote.
- 5. Restore View demo card beneath the saved-Wallet summary. Add Details to the Wallet-update and same-day receipts: the former reveals Nothing was sent.; Imani’s latter reveals Last counted today at 9:10 AM. The card action must open the read-only platform concept without changing Wallet state. (Member Wallet summaries, record-m-unlocked.png and record-m-same-day.png): The current Wallet label has no visible inspection action, and neither receipt exposes the specified evidence. Simulation labels alone do not complete the inspection path.
- 6. Finish the phone identity header using the revised instruction: one Sara title, Member actions in the header, compact masked-contact grouping and no orphan overflow row or bottom Members link. (member-m-full.png): The current overflow sits in empty space between identity and progress. Navigation is repeated at the bottom instead of being resolved at the top.
- 7. Remove the unnecessary Name column heading. Use 18px names, 16px tabular fractions and 13px state labels. Apply the revised 0/5 treatment to zero-visit roster rows. Remove Sara’s persistent name underline on phone; on desktop use the specified 2px selected-row edge with a short brick terminal. (members-m.png and desktop roster): The mobile roster exposes at least seven readable rows, but its first screen is approximately 41 visible tokens before attention badges, or 43 including them. These changes remove redundancy without hiding records or shrinking required information.
- 8. Inspect and regenerate the member QR as the specified fixed version-2, error-correction-M symbol: 25×25 data modules, four-module quiet zone, 165px total size, black modules on white and whole-pixel placement. Verify that decoding returns the existing opaque member payload; do not change member identity across states. (Desktop member QR and all recording QRs): The visible finder-to-symbol proportions appear to be a 21-module symbol, not the specified 25-module matrix. A crisp-looking QR is not proof that its encoding and raster alignment meet the contract.
- 9. Submit the corrected responsive captures and a timestamped normal/reduced-motion recording through recognition, unlock, explicit redemption confirmation and retained-progress redemption. Include the missing desktop counter and both Wallet concepts, plus the event/count and accessibility checks. (Final V3 review evidence and REPORT.md): The current evidence supports targeted fixes, not final acceptance. It cannot establish reward consumption, preserved extra credits, Wallet realism, timing or behavior at the other required widths.

## Keep

- The warm paper, green-black typography, restrained brick source edge and flat surfaces. This belongs to Open Cut; no palette or container redesign is needed.
- The five business destinations, Business selection and contained lime campaign Create action. Do not add a Loyalty destination.
- The 440px desktop roster beside a substantial member region, rather than a stretched list or spreadsheet.
- First names, masked contacts, compact progress and no invented customer portraits, scores or contact-marketing controls.
- Sara’s correct Jasmine / Morning loop · Story campaign acquisition thread, positioned after the counting decision.
- The visible distinction between recognition, reward readiness and a same-day rejection. The same-day receipt explicitly says unchanged and makes no Wallet-update claim.
- The stable Sara identity and QR between the recognized and unlocked frames. No confetti, fake notification or automatic redemption appears.
- Scanner simulation, No camera is used., Apple Wallet · simulated and Wallet update simulated at their relevant surfaces.

## Why better than production

This adds the return visit to TapMart’s advertising story. A shop can find Sara, see that she is one visit from a free coffee, count that visit and make the reward available. Her member record still names Jasmine’s Story as where she joined. That gives staff a simple counter routine and connects customer membership to the original campaign, not an invented sales or ROI report. The captures demonstrate this as a fictional workflow, not a live Wallet integration.

## Remaining risks

- Only phone and 1440px desktop compositions are evidenced here. The required 320px, tablet, 1023px and 1920px behavior, 200% text zoom and keyboard/focus behavior remain unproven.
- No Apple or Google card front is shown. The wallet_realism score reflects missing evidence, not a judgment that the visible QR is a native Wallet design.
- The strip confirms state order but has no timestamps and does not resolve the specified scan, stroke or crossfade motion. Reduced motion is not shown.
- Redemption confirmation, successful redemption, extra-progress preservation, retry idempotency and aggregate/source count reconciliation require event checks; pixels alone cannot establish them.
- The same-day receipt is honest visually, but business-timezone enforcement, zero-delta history and unchanged recent ordering are not proven by that receipt.
- QR payloads, scanner rejection, route privacy and search masking need functional verification. Their appearance does not establish security or scannability.
- This remains an isolated fictional prototype. Real Wallet issuance, delivery behavior, verified card recovery and production permissions are separate implementation and approval work.
