# V2 review: User Profile, pass 2 (final)

Reviewer: Astra, TapMart's design director.

Captures: user-profile-m.png, user-profile-m-full.png, user-profile-s.png, user-profile-t.png, user-profile-u.png, user-profile-d.png, user-profile-l.png, user-profile-m-work.png, user-profile-d-work.png, user-profile-m-vehicle.png, user-profile-m-settings.png, user-profile-d-settings.png, user-profile-m-share.png, user-profile-m-public.png, profile-open-m-strip.png

**Verdict: fix.** This is Maya’s fictional profile: her work and US$420.00 earned here. The person comes before account administration.

## The ten questions

- Does this feel like a premium modern product? **yes**. The portrait scale, differentiated media proportions, restrained typography and open paper surface feel deliberately designed. The desktop Settings background displacement still needs correction.
- Does it explain itself without paragraphs? **yes**. Name, Earned, Completed, Work and Listed for ads establish the hierarchy. The measured phone first screen contains 24 interface words, down from 57.
- Does it feel like a consumer platform, not business software? **yes**. People and work lead. There is no dashboard grid, account checklist or collection of management panels.
- Is it memorable? **yes**. The portrait submission, narrow Story and landscape placement meeting one straight cut give this profile a recognisable composition.
- Does motion improve understanding? **partly**. The strip establishes the same work opening and focus returning to its source. It contains no visible intermediate bounds, so it does not establish the specified shared-image transition or its timing.
- Does each earning type feel different? **yes**. Authored café content, finished Story artwork and physical vehicle placement have different subjects and proportions. They read as distinct completed work rather than interchangeable cards.
- Is business discovery exciting? **partly**. This person’s work gives a business something useful to inspect, but no business discovery surface is shown. Discovery itself is not approved by these captures.
- Is Profile identity, not settings? **yes**. Decisively. The person and portfolio dominate; administration appears only after opening the gear.
- Does the website make someone keep scrolling? **partly**. The phone profile’s changing media proportions provide a reason to continue down to the car. These are not website captures, so website scrolling appeal remains unassessed.
- Is it significantly stronger than current production? **yes**. Work is large enough to inspect, identity is immediate, repeated administration is removed and desktop fits the complete composition within the captured viewport.

## Scores

- earning types distinct: 9
- motion understanding: 5
- keeps scrolling: 8
- slop risk: 2
- text discipline: 10
- identity not settings: 10
- stronger than production: 9
- discovery excitement: 7
- memorable: 8
- self explaining: 9
- truthfulness: 9
- premium: 8
- consumer not software: 9

## Spec drift

- Desktop Settings moves the underlying profile down by approximately 32px. Restore the resting coordinates and scroll anchor while the working layer opens.
- Public preview in Share is presented as regular unadorned text rather than the system’s underlined secondary action. Apply the action treatment without adding another label.
- The phone signals have moved into the portrait’s factual rail. This departure is approved; retain it rather than restoring the taller specified arrangement.

## Spec was wrong

- I placed the phone connection and payout signals beneath the metrics. The build’s placement beside the portrait is better for this fixture: both leading work images arrive earlier. Keep it, allowing longer identities and signals to wrap without shrinking type.
- The system requested Lucide while this screen specification requested bundled Phosphor. That contradiction was mine. Retain Phosphor regular consistently across the lab, with 20px standard icons, 22px navigation icons and 44px minimum targets; do not introduce a second family.

## Fixes

- 1. Keep the underlying profile at exactly its resting geometry when Settings opens. At 1440px, the portrait must remain at y88 and the leading work image at approximately y130, rather than moving down to y120 and y162. Only the drawer and scrim should move or appear. (Desktop Settings opening, comparing user-profile-d.png with user-profile-d-settings.png.): The captured 32px background displacement breaks spatial continuity and makes a temporary task feel like a page relayout.
- 2. Render Public preview as an underlined secondary action in 14px DM Sans 600 with a minimum 44px target. Keep it above the fictional-link notice and preserve the existing copy. (Phone Share profile sheet.): It currently resembles ordinary body text. Inspecting the public presentation should be visibly actionable before copying its link.
- 3. Verify the normal-motion object transition with timestamped intermediate captures at opening, during expansion and at rest, then during return. If the implementation currently cuts directly between layouts, restore the specified 320ms opening and 240ms return using the selected image’s bounds without stretching. Keep reduced motion immediate. (Work and vehicle object opening; profile-open-m-strip.png.): The supplied strip shows endpoints and restored focus, but not the semantic movement being claimed. Do not add more animation merely to make it noticeable.

## Keep

- The rectangular portrait, prominent name and unboxed identity facts. Do not restore Edit profile, a dark masthead or administrative rows.
- The desktop four/eight-column allocation, three different media silhouettes and continuous brick-tipped baseline. Keep the 1280px content cap at large desktop.
- The separation between historical placement work and the smaller current vehicle listing. Preserve complete source media in inspection.
- The warm paper canvas, green-black typography, square media and restrained accent. No card containers, shadows around work or decorative gradients.
- US$420.00 labelled Earned, the separate Completed count and honest No reviews yet text. Preserve Credited versus bank payout in work details.
- The persistent fictional-profile designation and public presentation without owner earnings, payout readiness or account controls.
- Four labelled personal destinations, a simple selected underline and one Settings entrance containing the eight specified categories.
- The measured 30/34-word interface baseline. The artwork contributes another six visible words across the Story and placement images; report those separately rather than altering the media.

## Why better than production

Production makes the profile feel like an account page: editing, connection details and vehicle management compete with small work thumbnails. V2 starts with a person and their work. Earnings have one clear label, the listed car is secondary, and administration has one entrance. Measured interface copy falls from 98 to 30 words on phone and 102 to 34 on desktop without losing the four familiar destinations. Desktop is genuinely composed for its width rather than stretching the phone layout. This is a substantial improvement, not just a colour change. The remaining corrections are surgical; do not recompose it.

## Remaining risks

- The opening strip does not establish transition timing, intermediate image geometry or reduced-motion behaviour. This is an evidence gap, not proof that the animation is absent.
- Story and placement detail states are not captured here. Their historical intervals, manual confirmation, proof period and individual credit records still need inspection.
- The default public capture visibly removes private owner information. Public work-detail exclusions are reported by the engineer but not shown; verify those views and the public payload before treating sharing as privacy-safe.
- Missing portrait, empty work, unavailable earnings, failed loading, keyboard navigation, browser Back, 200% zoom and safe-area behaviour are not established by these captures. The richer fictional portfolio must not become a fallback for absent production data.
- The discovery and scrolling scores describe this profile’s contribution only. They are not approval of Business Home or the public website.
