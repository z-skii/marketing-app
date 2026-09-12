# Transfer QA: Production Earnings (phone 390), stage 2 pass 1

Production: `m-earnings-full.png` · Approved Lab: `m-design_lab_user_profile-full.png` · Reviewer: Astra, design QA director · 2026-09-12T16:37:48.259Z
Instructions: Stage 2 translates the approved Frame Shift language to a screen the Lab never drew; the Lab capture is the approved system reference, not a layout to match. Judge whether the language (mineral canvas, graphite media and identity regions, cobalt only for decisions and commitments, the 12px phone and 24px desktop source-to-commitment joint, real media, short operational copy, literal status words, restrained borders, strong money hierarchy, honest states, no generic card dashboard) was transferred faithfully for this screen's purpose, and whether real functionality is intact. Earnings must be the clearest financial screen: Available first, then the payout action with its real minimum, then Pending and Lifetime, then real transactions with their fee shown. Earning states pending, available, requested, paid, rejected and payout states keep their own words. Real cents; nothing animates.

**Verdict.** Frame Shift’s language and visible functionality are largely intact, but Earnings should not ship until the real payout minimum is disclosed at the action.

**Faithful transfer: YES. Functionality intact: YES. Ready to ship: NO.** Hold release until the real payout minimum is visible beside the payout action. The capture exposes the account controls, payout action, balances, transaction and navigation; it cannot establish that handlers, eligibility enforcement or other payout-state branches work.

This is a faithful Stage 2 translation rather than a misplaced copy of Profile. The 390px layout retains approximately 16px gutters, the mineral financial canvas, strong Archivo-style money hierarchy, restrained borders and the familiar navigation treatment. The transaction remains a plain source-linked record rather than a floating dashboard card. Its accounting reconciles exactly: $40.00 minus the stated 15% fee of $6.00 equals $34.00. Available and Pending remain distinct, and nothing shown misrepresents a payout as paid. The concrete release gap is the omitted payout minimum, not the absence of Profile-specific graphite, portrait or vehicle assemblies.

| score | 0 to 10 |
| --- | --- |
| viewport quality | 8 |
| media quality | 8 |
| uniqueness | 7 |
| clarity | 8 |
| premium feel | 8 |
| fidelity | 8 |
| usability | 7 |
| brand recognition | 7 |
| ai slop risk | 0 |

## Keep

- Mineral canvas, ink amounts, muted operational copy and flat, unboxed financial regions.
- The hierarchy: Available first, prominent payout action, then Pending, Lifetime and Transactions.
- The approximately 44/48px available balance, smaller secondary totals and explicit two-decimal currency formatting.
- Cobalt primary payout action with white separation, restrained control rounding and no card shadows.
- The actual transaction thumbnail, literal Available status and explicit gross-to-fee-to-net accounting.
- The four-destination bottom navigation, selected Earnings edge and unobstructed transaction content.
- The Earnings-specific composition; do not import Profile’s portrait masthead or add decorative joints to standalone balances.

## Expected differences (real data)

- The D initial and demo-creator identity correctly replace Maya’s fixture portrait and name.
- Available $34.00, Pending $0.00 and Lifetime $34.00 reflect production balances rather than the Lab’s fixture amounts.
- The single real transaction shows Available, Sep 9 and +$34.00, with $40.00 gross less a $6.00 fee. Its source image and stored title should remain unchanged.
- The unread counts of 2 and 3 are real navigation states absent from the Lab capture.
- The Lab’s requested $50.00 payout must not be reproduced without a corresponding production record.

## Drift and usability

1. [usability] **Add “Minimum payout · {formatted production minimum}” directly below Request payout, using the existing production minimum in cents and the existing currency formatter with two decimal places. Use IBM Plex Sans 14/20px, #526171, an 8px top gap and the existing 16px page gutter. Retain the manual-payout timing explanation below it. Preserve the existing payout mutation and eligibility checks, including the actual minimum; do not invent or hard-code a threshold.** (Request payout and its supporting copy, approximately y=240–332 CSS px.). The action is prominent and apparently enabled, but neither its label nor its explanatory copy states the minimum. A user with $34.00 cannot determine the payout threshold before acting.
