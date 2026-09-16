# TapMart V2: the study

Recorded 2026-09-16 before any V2 direction was explored. Four parts:
Artec, the current live TapMart, the backend and flows, and what makes the
current product heavy. Numbers are measured, not estimated.

## 1. Artec (benchmark)

Access note. The sandbox this study ran in cannot open artec.app,
shareartec.com or the App Store listing: the organisation's egress policy
denies those hosts, and the policy was not worked around. Everything below
comes from search engine snippets of those pages and third party listings.
It describes Artec's product model and copy strategy, not its pixels.
Pixel level study (type, spacing, motion) must be done by a person with a
browser or by adding the hosts to the sandbox policy.

What the snippets establish:

- Positioning in one line. The site title is "Only the top 500 creators get
  to work with you." The brand page says "Get paid by real brands." One
  claim per audience, no paragraph.
- Two accounts, one product. Brand accounts post deals, discover creators,
  manage campaigns. Creator accounts apply for deals, submit content,
  receive payments. Same two sided shape as TapMart.
- Discovery is work first. "Brands discover proven UGC creators, review
  their work, request contact, and hire directly." Profiles "show what they
  can do" and "are not reduced to a follower count".
- Information on demand as policy. Approved professional details, public
  work samples, reviews and broad audience ranges are visible; full
  identity, direct contact, exact metrics, resumes and private portfolio
  material stay protected until the talent accepts a request. Detail is a
  consequence of an action, not a default.
- A request is the unit of contact. "Send requests with the role or
  opportunity you want to discuss": discovery, application, contact,
  messaging and hiring records are one thread.
- The creator app is a score plus a next action. Viral Score 0 to 100,
  expected views range, potential brand value, feedback on hook, body and
  ending. The number is the interface; explanation follows the number.
- Copy discipline. Every quoted line is a short declarative sentence with a
  verb and an object. Nothing quoted explains the mechanism before the
  outcome.

What TapMart takes from this as principles (not pixels): one line per
audience; work before metadata; details revealed by an action; a request
as the single business to person gesture; numbers before explanations;
never reduce a person to a follower count.

## 2. The current live TapMart (Frame Shift, production 6049fce)

Measured from the local build of the production commit with the demo
accounts, at 390x844 (2x) and 1440x900, after all reveals ran. "Words" are
visible words in the DOM after hidden and screen reader only text is
excluded. "First screen" is the words visible without scrolling.

| Screen | Viewport | Words | First screen | Text nodes | Blocks of 18+ words | Links and buttons | Media | Page height |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage | 390 | 995 | 42 | 196 | 9 | 48 | 21 | 11790 |
| Public homepage | 1440 | 987 | 78 | 178 | 10 | 42 | 20 | 13486 |
| User Home | 390 | 199 | 90 | 83 | 0 | 28 | 5 | 2542 |
| User Home | 1440 | 203 | 152 | 87 | 0 | 29 | 5 | 1262 |
| User Profile | 390 | 98 | 57 | 56 | 0 | 23 | 3 | 1641 |
| User Profile | 1440 | 102 | 96 | 60 | 0 | 24 | 3 | 1076 |
| Business Home | 390 | 208 | 69 | 86 | 0 | 41 | 10 | 2601 |
| Business Home | 1440 | 249 | 245 | 111 | 0 | 56 | 13 | 960 |

Observations from the captures (see the before folder in the report):

- User Home: the first opportunity is a strong media and money
  composition, but it carries eleven separate text runs before the second
  opportunity appears (kind label, title, business, verb line, amount,
  basis, spots, deadline, View work, Save, Inspect reference). A tab row
  and a Kind filter sit above the first card; a status line about a
  revision sits above that. Three things compete for the first second.
- User Profile: a graphite header with initials, three stats, then rows
  that read like settings (Instagram with a confirmation method, Creator
  verification, Vehicles with "Smart Vehicle · Photos only", Recent work).
  The person's work is the last thing on the screen. No media of the
  person. "Edit profile" is the only top action; settings live elsewhere.
- Business Home: four sections of horizontal shelves with a metadata line
  under each portrait (kind, approval, Instagram, verification, followers,
  completed, rating, reviews) and two links per person. It is a good
  marketplace but reads like a directory at 1440: 245 words in the first
  screen, most of them metadata.
- Public homepage: nearly a thousand words on both viewports, ten blocks
  of eighteen words or more, every chapter captioned with provenance text.
  It documents the product faithfully; it does not make someone scroll.

## 3. Backend and flows (what V2 must present truthfully)

From docs/reboot/TAPMART_FUNCTIONAL_INVENTORY.md and the code:

- One campaign table, three kinds: recreate_reel (reference media, steps,
  application, submission with review states, approval pays),
  instagram_story (finished 9:16 creative, follower minimum, live hours,
  proof, approval pays), car_ads (placement zones, duration, monthly pay,
  vehicle preferences, booking, installation, proof, monthly payment).
- Money: business funds a campaign; platform fee percentage from settings;
  the person earns on approval; Available, Pending, Lifetime; payout
  minimum from settings. Subscription (Essential, Growth) is separate from
  campaign credit and from creator earnings.
- Identity: profile (photo, name, username, bio, city), Instagram
  connection (real API or manual confirmation, follower count), creator
  verification states, vehicles (photos; 3D only when a real model exists).
- Business: businesses with members and roles, brand kit, Google Business
  connection states, content subscription with shoot and deliverable
  states, campaigns with review queues, direct requests to a person or a
  car owner.
- Discovery: people (with work samples, Instagram when connected,
  verification, completed count, rating, reviews) and cars (vehicle,
  placements, asking price per month, city).

## 4. What makes the current product heavy

1. Every object explains itself on the surface. A card shows kind, title,
   business, verb, amount, basis, spots, deadline and two actions. Artec's
   model shows work, money, one line, one action; the rest follows a tap.
2. Metadata sits next to identity. Portraits carry approval, connection,
   verification, follower, completed, rating and review strings on one
   line. The strings are true but they turn a person into a record.
3. Profile is a settings index with a header. Rows about Instagram
   confirmation and verification outrank the person's work and media.
4. Status and filters sit above the first image. On User Home a revision
   notice, a tab row and a filter precede the first opportunity.
5. The public site captions everything. Provenance captions are honest and
   required for real captures, but eleven hundred words is documentation.
6. Motion is one time reveals and a scroll stage. Nothing transforms:
   a card does not become its detail, media does not expand, money does
   not settle, the car does not move.
7. One neutral material everywhere. Canvas, surface, graphite and cobalt
   are correct and calm; nothing in the palette or type belongs only to
   TapMart. The three earning types share one type scale and one grid and
   are separated mainly by layout.
8. Desktop stretches the phone's decisions. Business Home at 1440 is the
   phone shelves widened; the first screen carries 245 words.

Targets for V2, so the after numbers mean something: at most a third of
today's visible words on each screen at both viewports; no block of
eighteen words or more on any logged in screen; first screen words on
phone under 40; each opportunity readable in under two seconds from media,
amount and one verb; every settings row gone from Profile.
