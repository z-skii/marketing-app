# V3 review: Attribution, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: attribution-m-full.png, attribution-d.png, attribution-d-open.png, attribution-m-how.png

**Verdict: fix.** Ten joined, six came back, two redeemed. Jasmine has the most returners; both of Maya’s members returned.

## The ten questions

- Does this feel like a premium modern product? **partly**. The palette, exposed rules and typography are controlled. Desktop wastes the editorial lane and compresses every source into the right-hand region; phone source numerals are too small.
- Does it explain itself without paragraphs? **yes**. The three count labels and source names communicate the central result. Longer definitions are appropriately behind an action.
- Does it feel like a consumer platform, not business software? **partly**. Names and open compositions avoid dashboard chrome. The undersized desktop comparison still feels more like a reporting module than a deliberately composed TapMart surface.
- Is it memorable? **partly**. The diminishing ink ledges with brick terminals provide a recognizable signature. Their impact is weakened by the nested desktop layout.
- Does motion improve understanding? **partly**. Only static closed and open states were supplied. Timing, semantic transitions, focus restoration and reduced motion cannot be judged.
- Does each earning type feel different? **partly**. Story, Recreate and Car retain distinct source classifications. Their earning experiences are outside these captures; adding decorative type imagery here would not establish that distinction.
- Is business discovery exciting? **partly**. Business discovery is not shown. The existing navigation survives, but these screenshots cannot establish the quality of the marketplace.
- Is Profile identity, not settings? **partly**. Profile is not shown. Business remains the selected owning destination without adding settings rows to Attribution.
- Does the website make someone keep scrolling? **partly**. No public website or Loyalty sequence was supplied. This operational source list is not evidence of public-site storytelling.
- Is it significantly stronger than current production? **partly**. The source-to-return comparison adds meaningful business value. The unsupported first-touch timestamp and unfinished composition prevent approval as a finished improvement.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **yes**. Paper, ink, brick terminals and the existing Business navigation make the ownership clear without introducing a separate analytics brand.
- Does it strengthen the business value proposition? **yes**. The source comparison connects member acquisition with recorded returns and reward use. View members provides a concrete next step.
- Can a business understand it quickly? **yes**. The baseline 10/6/2 and Jasmine’s 4/3/1 are straightforward. Cohort and endpoint qualifications still need refinement.
- Does it feel consumer quality rather than SaaS admin? **partly**. No tiles, spreadsheet or invented engagement scores appear. Full-width desktop composition and stronger phone numerals are needed to finish the consumer-quality presentation.
- Does attribution feel powerful without becoming fake analytics? **partly**. The visible counts reconcile, zeros remain honest, and untracked acquisition is retained. The fabricated first-touch timestamp is a direct breach of that otherwise strong restraint.

## Scores

- motion understanding: 0
- slop risk: 3
- text discipline: 7
- natural part of tapmart: 9
- attribution honest power: 6
- memorable: 7
- quick to understand: 8
- self explaining: 8
- business value: 9
- wallet realism: 0
- truthfulness: 6
- consumer not software: 7
- premium: 7

## Spec drift

- The desktop source composition is nested inside the right-hand chart region. Move source identity from approximately x632 to x232 and source plots from approximately x896 to x632; restore full-width source rows and separators.
- Sources is absent on both overview captures. Restore the section heading between the overall descent and the source list.
- Phone source numerals are visibly below the specified 24/28px hierarchy. Restore that size rather than using small counts to fit more content.
- The phone shows the desktop explanatory caption and How counts work above the descent, plus a duplicate footer Back. Move the explanation to its specified on-demand/footer locations and remove the duplicate navigation.
- Signup period is rendered as a single inline phrase with a right chevron instead of the compact labelled selector. Restore the two-level trigger and the dedicated small-phone row.
- The source drawer shows an unsupported first-touch timestamp and Jasmine’s Story sticker. Use Not recorded and Morning loop signup link.
- View members appears after provenance instead of directly after the source counts. Restore the action-first hierarchy, its signup-period note and the business-only privacy boundary.
- The definition layer lacks the explicit snapshot timestamp and separate overall-scale explanation. The overview timestamp lacks CDT; add the factual endpoint consistently.

## Spec was wrong

- Requiring Source details followed by another large source title creates unnecessary hierarchy. Keep Jasmine as the visible drawer title; use Source details: Jasmine as its accessible name.
- Mandatory stacked count labels were overprescriptive. Inline count-and-label pairs read well where they fit. Preserve the specified numeral sizes and stack only when necessary.
- The prescribed sentence Creators see counts for their own links implies an implemented creator experience. Replace it with Member details are business-only. Keep future aggregate creator access in the documentation.

## Fixes

- 1. Replace First touch: Aug 27, 2026, 8:50 AM with First touch: Not recorded. Never derive a first-touch timestamp from the earliest signup. Replace Jasmine’s Story sticker with Morning loop signup link, and use Source confidence / Link recorded. (Jasmine source drawer, First touch, Link and Confidence fields.): The drawer currently turns a signup timestamp into acquisition evidence that the fixture does not contain. The sticker wording also asserts a placement beyond the registered-link evidence.
- 2. Make each desktop source span the full 1176px content width. At 1440, place source identity at x232 in the 376px editorial lane; start its plot at x632 after the 24px gutter. Use a 600px plotting lane, 24px gap and 152px count lane. Extend separators across the complete source row. Restore Sources above the list. Remove the redundant Back beside the desktop title and align Attribution to the main left datum. (Desktop overview header and every source comparison row.): Source identities currently start around x632 and their plots around x896, effectively nesting the entire comparison inside the chart column. This leaves a large unused left shoulder and makes the useful information unnecessarily small.
- 3. Restore mobile source numerals to 24/28px DM Sans 600. Remove the default phone caption From signup to a recorded return.; keep it in definitions. Move How counts work below the source list, restore the Sources heading, and remove the extra footer Back. Re-establish the specified spacing so Jasmine remains complete in the first 390×844 viewport without shrinking its counts. (Phone overview, overall introduction, source typography and footer.): The current source numbers read at body size. Through Jasmine, the shown copy already totals 46 words including the five navigation labels, excluding badges and any Maya content. Removing the duplicated pre-chart explanation and restoring Sources brings that content inventory back to 38.
- 4. Render Signup period as a 12px label above the 14px selected value, with a downward chevron. At 320, place the period control on its own 48px row below the grouping tabs. On desktop, bring the grouping and period controls together in the header’s right-hand area rather than separating them across the page. (Overview grouping and period controls.): The current single-line Signup period: All time treatment competes with the tabs and leaves little room for longer selected periods. The revised control keeps cohort scope explicit without becoming a toolbar.
- 5. Keep the source name as the drawer title. Move View members directly below the three counts, followed by Members shown match this signup period. Begin provenance 32px later under Joined from. Add Member details are business-only. Use 32px desktop padding and the specified modal scrim; keep Close visible while the drawer scrolls. (Desktop source drawer and equivalent phone source layer.): The useful next action currently follows all provenance fields. The undimmed background also weakens the distinction between an active modal task and the underlying comparison.
- 6. Define Joined as Members who signed up in this period. Show the actual endpoint, As of Sep 17, 2026, 10:00 AM CDT, in the definition layer and footer. Keep Returns and redemptions run through the demo date. as a separate short block. Explicitly distinguish the overall cohort scale from the shared largest-source scale. (How counts work layer and overview endpoint.): Signup period is central to interpreting these results. The current definition starts with an unqualified signup count, refers only to a generic demo snapshot, and the footer omits the business timezone.

## Keep

- The warm paper, green-black ink, restrained brick terminals and flat separators. Do not introduce statistic cards, photographic decoration or another colour system.
- The measured ledges: the visible overall proportions are 10/6/2, source lengths share a common scale, and zero outcomes have no invented bars.
- All five source objects, including Counter QR and Direct signup with Source not tracked. Their visible totals reconcile with the overall counts.
- The five existing business destinations, Business selected, and lime reserved for campaign Create. Attribution must not become another navigation product.
- Plain Joined, Came back and Redeemed labels, with definitions available on demand rather than a default analytics explanation.
- The business-only source drill-down, fictional-preview labels and absence of customer names, contact details, revenue or conversion percentages on the comparison.

## Why better than production

This adds the missing connection between advertising and customers returning. A shop can see which campaign links brought members, how many later came back, and how many used a reward, then inspect the matching members. That gives the owner something useful beyond finding creators and approving work. It does not prove sales or that a campaign caused a return, and this remains a fictional local preview.

## Remaining risks

- The supplied captures establish only the baseline overview, one source drawer and definitions. Campaign grouping, period selection, custom-date errors, excluded sources and empty states remain unverified.
- Screenshots cannot establish that counts are event-derived. Verify September 2026 as 9/5/1, Last 7 days as 5/1/0, no attribution change after Sara’s unlock, and 10/6/3 after her first redemption.
- The 320, tablet and 1920 layouts, 200% text zoom, keyboard operation, focus trapping/restoration and browser Back require acceptance evidence before ready.
- No motion strip or Wallet specimen is included. Their zero scores mean unassessed evidence, not failed design; neither should be added to this surface merely to obtain a score.
- The source-to-return relationship describes recorded acquisition and subsequent activity, not verified sales or causal campaign effectiveness. That boundary must survive future production copy and integrations.
