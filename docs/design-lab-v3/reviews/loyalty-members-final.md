# V3 final verification: Members, member detail and recording

Reviewer: Astra. Verdict: **BLOCKER**. Captures: members-m.png, members-d.png, member-m-full.png, member-d.png, record-m-found.png, record-m-unlocked.png, record-m-same-day.png, add-visit-m-strip.png.

**Two second read.** Find Sara, see one visit remaining, count once, then redeem. Her original source stays attached.

## Confirmed
- The roster is readable and unboxed, with compact progress, no portraits and Business selected.
- Desktop pairs the roster with a substantial member inspection rather than stretching the phone list.
- Sara correctly shows 4 of 5 visits and Jasmine’s Morning loop · Story campaign.
- Reward unlock completes all five marks, preserves Sara’s identity and QR, and exposes Redeem with Wallet update simulated.
- Imani’s same-day receipt explicitly says unchanged, explains the daily rule and makes no Wallet-update claim.
- The initial scanner is locally labelled as a simulation with no camera use.

## Blockers
- **Capture 3, member-m-full.png; captures 2 and 4, members-d.png and member-d.png, member inspection Wallet section..** The Wallet section shows only Apple Wallet · simulated; View demo card is missing. Why it blocks: The required labelled route to inspect the member’s current demo card is absent. On phone, the detail also has no visible member QR, so this leaves no discoverable card-access action. Fix: Add View demo card beside or below Sara’s simulated Wallet state, opening her read-only card wrapper without changing Wallet state. Use Show demo card for members without Wallet.
- **Capture 7, record-m-same-day.png, Imani’s Already counted today receipt..** The same-day receipt has no Details action for the last-counted time. Why it blocks: Staff cannot inspect the required last-counted evidence when a visit is rejected. The receipt explains the rule but omits its specified evidence disclosure. Fix: Add a quiet Details action to the same-day receipt that reveals Last counted today at 9:10 AM. Keep the unchanged result and progress intact.

## Notes, not blockers
- The recognized-member action shows both a plus icon and “+1 visit.” Removing the redundant icon would make the label cleaner.

**For the founder.** The visual hierarchy and counter states are ready. Two required inspection entry points are still missing; restore those without recomposing the surface.
