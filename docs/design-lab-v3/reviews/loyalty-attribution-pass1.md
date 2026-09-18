# V3 review: Attribution, pass 1

Reviewer: Astra, TapMart's design director.

Captures: attribution-m-full.png, attribution-d.png, attribution-d-open.png, attribution-m-how.png

**Verdict: fix.** Ten joined, six came back, two redeemed. Jasmine supplied the largest returning group; Maya's two members both returned.

## The ten questions

- Does this feel like a premium modern product? **partly**. The paper and typography are composed, but thick three-colour bars, placeholder identity squares and undersized desktop chart numbers feel like a generic reporting component.
- Does it explain itself without paragraphs? **yes**. Joined, Came back and Redeemed make the baseline journey immediately legible. Scope and denominator explanations still need completion.
- Does it feel like a consumer platform, not business software? **partly**. Names and open paper help. Repeated traffic-light-style chart colours and the inline provenance expansion pull it toward analytics software.
- Is it memorable? **partly**. The source-to-return comparison is memorable as a proposition. The specified exposed ink-ledges signature has not been built.
- Does motion improve understanding? **partly**. Only static states were supplied. The open captures establish disclosure, not transition quality, duration or reduced-motion behaviour.
- Does each earning type feel different? **partly**. Story, Recreate and Car are honestly named. Their actual earning experiences are outside these captures; Attribution should not add decorative differentiation to compensate.
- Is business discovery exciting? **partly**. Marketplace discovery is not shown. This surface demonstrates outcomes, not discovery.
- Is Profile identity, not settings? **partly**. Profile is not captured. Business remains correctly selected, but that does not establish Profile quality.
- Does the website make someone keep scrolling? **partly**. No public website or sequence capture was supplied.
- Is it significantly stronger than current production? **partly**. The new business evidence is meaningful. Visual execution and missing scope interactions are not yet strong enough for finished-product approval; production comparison is contextual rather than side-by-side.

## The five Loyalty questions

- Does this feel like a natural part of TapMart? **partly**. Navigation, paper and campaign identities connect it to TapMart. The chart palette, source tiles and duplicated phone header depart from Open Cut.
- Does it strengthen the business value proposition? **yes**. A shop can connect named campaign acquisition to recorded returns and reward use, including counter and untracked acquisition.
- Can a business understand it quickly? **yes**. The baseline 10 → 6 → 2 and Jasmine's 4 → 3 → 1 are immediately readable. Understanding filtered cohorts is not yet supported visibly.
- Does it feel consumer quality rather than SaaS admin? **partly**. Open paper and human language are right. Thick multicolour charts and expanding metadata rows make it feel more like reporting software than the directed product.
- Does attribution feel powerful without becoming fake analytics? **partly**. Counts reconcile visually, untracked acquisition is explicit, and no revenue is invented. Missing cohort controls, scale definitions and snapshot qualification weaken that honesty.

## Scores

- motion understanding: 2
- slop risk: 5
- text discipline: 6
- natural part of tapmart: 7
- attribution honest power: 7
- memorable: 5
- quick to understand: 8
- self explaining: 7
- business value: 8
- wallet realism: 0
- truthfulness: 7
- consumer not software: 6
- premium: 6

## Spec drift

- Measured 2px ink ledges became thick ink, brick and lime bars; zero redemption rows have visible border remnants. Restore ink ledges with internal brick terminals and truly empty zero plots.
- Creators, Campaigns, Signup period and All sources are absent. Restore the specified grouping and cohort controls.
- Desktop uses a narrower content composition and mismatched overall/source plot datums. Restore the 1176px editorial-plus-chart spread and specified numeric hierarchy.
- Source portraits, initial tiles and blank artwork placeholders were added despite the no-media requirement. Remove them and restore source chevrons.
- Phone inherits an additional business utility header. Replace it with the route's focused Attribution header.
- Phone keeps the explanatory caption under the overall chart and How counts work beside Sources. Move them to the specified on-demand and footer positions.
- Source details expand inline instead of opening a focused drawer or full-height layer. Restore the layer and its complete provenance fields.
- View members is underlined beneath provenance rather than the source layer's first filled action with a cohort note. Restore that action hierarchy.
- The definition sheet lacks local fictional context and cohort, scale, business-day and outcome-endpoint qualifications. Add them without a prose wall.
- The full phone capture has no As of timestamp. Replace the redundant bottom Back treatment with the specified explanation and endpoint footer.

## Spec was wrong

- The 38-word phone target was too aggressive for the specified navigation, scope controls and complete Jasmine object. Measure the rebuilt first viewport and report its actual count; preserve meaningful labels rather than shrinking text or hiding qualifications.
- The proposed sentence 'Creators see counts for their own links' implies an implemented creator experience. Replace it with 'Member details are business-only.' Describe future creator aggregates in documentation, not as a current capability.

## Fixes

- 1. Replace every thick coloured bar with a 2px square-ended ink ledge. Replace the final min(12px, measured length) with brick inside that length. Remove the standalone decorative rule above the overall chart. Render zero with no stroke, border or terminal. (Overall descent and every source descent, including open source inspection.): This restores the defining visual language and removes false colour semantics. The visible vertical marks at zero currently imply nonzero graphical magnitude.
- 2. Add Creators / Campaigns tabs and the labelled Signup period control. Include All sources above the overall descent. Implement period selection as a deliberate Apply task, preserving grouping and selecting members by signup date. (Phone scope row and desktop header; period dialog.): The capture has only an isolated All time label. The requested comparison and cohort controls are missing, not merely styled differently.
- 3. Recompose desktop to the full 1176px canvas at 1440: 376px editorial lane, 24px gap, 776px chart lane. Put All sources, the caption and How counts work on the left; align overall and source plots on the right. Use 48px overall numerals, 28px source numerals and fixed external label lanes. (1440px overview; carry the composition to the specified 1280px maximum at large desktop.): The overall chart currently starts at the page edge while source plots start much farther right. The page stops around x1332 instead of x1408, and small source counts undermine the comparison hierarchy.
- 4. Remove source portraits, the J initial tile and empty placeholder squares. Start each source identity directly on the grid and add a quiet chevron. Make the complete source object one operable link. Replace the shared LC identity placeholder with the approved Loopday loop mark. (All source identities and shared business identity chrome.): This is a comparison of acquisition records, not a people directory. Uneven portrait availability adds noise and invents an unnecessary identity system.
- 5. Remove the extra mobile business utility header from this route. Use the 56px Back / Attribution header, local lab context and responsive scope controls. Move the caption into definitions and How counts work below the source list. Restore 224/16/118px chart lanes at 390 and 162/16/118px at 320. (Phone overview.): The current phone stacks two headers and uses a different chart hierarchy. Recover space through structure, not smaller text, while retaining a complete leading source in the 390px first viewport.
- 6. Replace inline source expansion with a 560px desktop drawer and full-height phone layer. Include Source details, Close, local fictional context, retained counts, then one filled View members action. Show Source type, a human-readable named link or QR, confidence, First touch / Not recorded and the derived Signup range. Add the signup-period note beside View members. (Source inspection, demonstrated by attribution-d-open.png.): The current expansion displaces the comparison and exposes an internal link identifier instead of explaining the acquisition mechanism. It omits important provenance and scope distinctions.
- 7. Complete How counts work as a full-height phone layer with persistent Close and local fictional context. Define two different business days, unique redeemed members, signup-cohort scope, outcomes through the demo snapshot and the common source scale. Split the two acquisition sentences into separate blocks. Remove 'never a rate'; say 'A signup is not a purchase.' (Definition layer.): The current short sheet explains the three nouns but not their analytical boundaries. Its combined acquisition paragraph is 18 words, and the invented rate statement is less useful than the concrete purchase distinction.
- 8. Add the As of footer with the actual fixture timestamp. Use the existing fictional-context control as the scenario entrance rather than maintaining a second floating pill. Retain adequate bottom-navigation clearance and capture the rebuilt scope, source and empty states. (Overview footer, shared lab entrance and next review captures.): The fixed outcome endpoint is currently absent. The duplicate floating Lab control adds visual chrome and overlaps source territory without adding product meaning.

## Keep

- Warm paper, green-black text, open composition and restrained separators. Do not introduce chart cards or a dashboard background.
- The visible baseline totals: 10 Joined, 6 Came back, 2 Redeemed.
- The common source scale: Jasmine's four-member ledge is twice Maya's two-member ledge.
- The baseline source order: Jasmine, Maya, Counter QR, Direct signup, Eli.
- Human campaign names, explicit campaign kinds and Direct signup / Source not tracked.
- Five primary business destinations, Business selected, and lime reserved for campaign Create.
- No revenue, percentages, inferred sales, delivery claims or customer contact details on this surface.
- Definitions and provenance revealed on demand rather than expanded across the default comparison.

## Why better than production

This gives a shop a visible connection between campaign acquisition and recorded customer returns: Jasmine has four members, three returned, and one redeemed. Counter and untracked signups remain visible too. That is useful business evidence beyond finding advertisers, without pretending to measure revenue. The baseline story works; the missing scope controls and weakened inspection flow prevent approval.

## Remaining risks

- Scores use a 0 to 10 scale. Wallet realism is 0 because no Wallet specimen is shown; this is not a judgment of an unseen card.
- No motion strip or recording was supplied. Transition timing, focus movement and reduced-motion behaviour remain unverified.
- No 320px, tablet, 1023px, 1920px or 200% text-zoom captures were supplied.
- The full-page phone capture does not independently establish the exact first-viewport word count. Measure an unscaled 390×844 viewport after rebuilding the hierarchy.
- Screenshots cannot establish event-derived counts, idempotency, immutable attribution, period filtering or non-mutating inspection.
- Keyboard operation, full-row hit targets, accessible chart reading order, focus trapping, browser Back and scroll restoration require interaction checks.
- Verify September totals of 9 / 5 / 1, Last 7 days totals of 5 / 1 / 0, valid empty periods and invalid-source recovery.
- Verify Sara's fifth visit leaves attribution at 10 / 6 / 2, while her first redemption changes it to 10 / 6 / 3.
- Confirm View members preserves source and signup period and remains business-only.
