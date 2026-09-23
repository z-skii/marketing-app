# Controlled synthetic capture test: source views

Sixteen AI generated reference views of ONE consistent car, made on
2026-09-23 through TapMart's Higgsfield account with Google's Nano Banana
image model (requested as `nano_banana_pro`, 2k, 3:2; the job records name
the served model `nano_banana_2`). These are reconstruction inputs, not
photographs, and this whole experiment is labelled CONTROLLED SYNTHETIC
CAPTURE TEST: it does not prove that real phone captures behave the same.

The files here are JPEG copies (quality 92) of the 2528 x 1696 PNGs the
providers received; the PNG originals stay in the Higgsfield account under
the job ids listed in the experiment document.

Target: BMW M3 Competition G80 sedan, stock body, dark graphite metallic grey
(Skyscraper Grey), gloss black M double spoke wheels, dark interior, seamless
light grey studio, soft even light, 50 mm perspective, camera at beltline
(2.2 m for the four elevated views).

## How consistency was kept

View 02 (front driver three quarter) was generated first from text alone and
became the canonical car. Every other view was generated with view 02 as an
image reference and the instruction to change only the camera position.
Passenger side views kept coming out mirrored (the model reproduced the
reference's composition), so 03, 05, 08, 10, 11 and 15 were regenerated with
a second reference showing the correct side and explicit "nose points to the
left edge of the frame" wording; 08 and 15 needed a third pass. The final
sheet was checked view by view: same grille, headlights, tail lights, wheels,
mirrors, gills, colour, roof, spoiler lip, ride height and door count in all
sixteen. Views 03 and 05 came out closer to 45 degrees than the 70 and 110
degrees asked for; they were kept because they are consistent and were not
reconstruction inputs.

| View | File | Used for reconstruction |
| --- | --- | --- |
| 01 | 01-front.jpg | yes (front) |
| 02 | 02-front-driver-34.jpg | no (canonical reference) |
| 03 | 03-front-driver-int.jpg | no |
| 04 | 04-driver-side.jpg | yes (left) |
| 05 | 05-rear-driver-int.jpg | no |
| 06 | 06-rear-driver-34.jpg | no |
| 07 | 07-rear.jpg | yes (back) |
| 08 | 08-rear-passenger-34.jpg | no |
| 09 | 09-rear-passenger-int.jpg | no |
| 10 | 10-passenger-side.jpg | yes (right) |
| 11 | 11-front-passenger-int.jpg | no |
| 12 | 12-front-passenger-34.jpg | no |
| 13 to 16 | elevated three quarters | no |

Both providers accept at most four images, so both received exactly views
01, 04, 07, 10 in that order (front, left, back, right for Tripo's ordered
slots; front first for Meshy). Neither provider saw the other's output.

Image credits: 24 generations at 2 credits (16 views plus 8 regenerations),
48 credits.

## Blind identification (before any reconstruction)

Views 01, 02, 04, 07 and 12 at 1280 px went to the QA vision model through
TapMart's OpenAI client with a strict schema and no hint of the target.
Answer in 12 seconds: make BMW (0.99), model M3 (0.96), generation G80
(0.90), body sedan (0.98), trim null (0.25), years 2021 onward (0.75),
colour dark metallic grey #4B4A4E, black multi spoke wheels, no
modifications. Evidence quoted: roundel, M3 badges, vertical kidney grille,
flared fenders, side gills, quad exhausts. Full JSON in the experiment log.

## Trusted dimensions

BMW Group press specification sheet "Specifications. BMW M3 Sedan. M3
Competition Sedan" (press.bmwgroup.com, attachment T0316649EN): length,
width, height 4,794 / 1,903 / 1,433 mm; wheelbase 2,857 mm; track front and
rear 1,617 / 1,605 mm; unladen weight (DIN) 1,705 kg for the Competition.
Width over mirrors 2,067 mm from ultimatespecs.com and encycarpedia.com (not
on the press sheet).
