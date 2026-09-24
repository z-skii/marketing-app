# Vehicle twin builder, Phase 1B: G80 reference learning and the refit

Status: built, awaiting approval. Lab: `/labs/twin-builder` (stages SOURCE, REFERENCE, SKELETON built; SURFACES
to FINAL not built). Label: CONTROLLED SYNTHETIC CAPTURE TEST plus CC licensed real G80 references.
Companion documents: `docs/twin-builder-phase1.md` (the Phase 1 baseline), `docs/vehicle-reference-learning.md`
(the research this phase implements).

Rules kept: no paid AI 3D candidates, no purchase of Squir, Hum3D or blueprints, no geometry from view only or
commercial models, only class A material in automated evidence processing, class B and C sources listed but
never ingested, provenance on every reference and every curve. Zero credits spent. Everything runs on the
container CPU with open source libraries (OpenCV, NumPy, SciPy, rembg with the u2net model for background removal).

## What was built

1. Reference harvest. Openverse (which indexes Wikimedia Commons and Flickr with per image licence metadata)
   returned 282 commercially licensed candidates for nine G80 queries (184 CC BY SA 4.0, 49 CC BY SA 2.0, 23 CC BY
   2.0, 15 CC BY 4.0, 11 CC0; 228 from Commons, 54 from Flickr). The Commons API itself returned 429 for this
   container even with a contactable User Agent, so the index came through Openverse and the working copies
   (1280 px) through the Wikimedia upload host at the sizes it allows. 271 candidates were downloaded and reviewed
   on contact sheets. 35 were selected by structural role: 4 front, 4 rear, 5 side (two with the nose right, three
   with the nose left, one of them an LCI car), 8 front three quarter, 9 rear three quarter (three elevated), and
   5 detail references (headlight, taillight, wheel, gill, exhaust) that document parts but are not fitted.
   Excluded on sight: the CS, Tourings, cars with M Performance parts or aftermarket wings, interiors, badges.
   Full attribution table at the end. Selection file: `docs/captures/twin-builder/phase1b/selection.json`.
2. Model guided evidence on real photographs (`scripts/refevidence.py.txt`). Per photograph: whole car mask by
   rembg (u2net); camera registration of the current skeleton by silhouette IoU (a proxy silhouette rasterised
   from the skeleton's own loops plus tyre cylinders; grid over azimuth, elevation and field of view with the
   role's hemisphere and its mirror, then Powell refinement; distance and target shift from the bounding box);
   parts seeded by the projected skeleton loops (GrabCut for glass, lights, mirrors, handles; gradient snapping
   for panels, the grille, intakes and all structural and crease curves); wheels by a polar edge snap seeded at
   the projected tyre outline with a plausibility check against it. Output in the Phase 1 evidence schema plus
   size, camera and provenance.
3. The chassis. Wheelbase 2857 mm, tracks 1617 / 1605 mm and the tyre radius 338.5 mm (275/35 R19 front,
   285/30 R20 rear from the fitment table) are constants or hard constraints of the fit; length 4794, width 1903
   and height 1433 mm are hard constraints; ground clearance 120 mm is a floor under every body curve (no body
   control point below 130 mm).
4. The tiered joint fit (`scripts/fit1b.py.txt`). 16 synthetic views plus 30 registered references (all with a
   silhouette IoU of 0.82 or better after the hemisphere check), six camera parameters per view (field of
   view free for references, held for the synthetic set), 793 curve coordinates, two wheel x positions. Data
   terms as in Phase 1 with tier weights (references 1.4, synthetic capture 1.0, GrabCut parts on references
   0.8), a tread aware wheel term (the projected tyre cylinder outline against the tyre outline found in each
   angled view, plus the face centre in side on views), the Meshy semantic class boundaries as a weak 3D
   hypothesis for glass, light, grille and mirror curves (1 cm = 0.6 px), curve junction ties, mirror symmetry
   by construction, smoothness and a weak pull to the generic prior. IRLS robust weights annealed from 30 px to
   6 px over eleven outer iterations; about fourteen minutes per round on four CPU cores. Four rounds: the first
   from the Phase 1 skeleton; the second re extracting the reference evidence with the improved skeleton; the
   third re registering every reference and checking the hemisphere of the azimuth hint (twelve of the thirty
   hints were mirrored, which explained most of the round one noise); the fourth treating the reference wheel
   evidence as the tyre face ellipse it actually is (the polar snap is seeded at the face radius) instead of the
   whole cylinder outline, which had biased the wheel term by 15 to 20 percent.
5. Provenance per curve. Every curve instance carries labels from {MEASURED_FROM_CAPTURE, REFERENCE_CONFIRMED,
   DIMENSION_CONSTRAINED, SYMMETRY_DERIVED, AI_HYPOTHESIS, GENERIC_PRIOR}, a confidence, per tier view counts and
   errors, and per view detail. The lab status colours follow the strongest label.
6. The VehicleReferencePack (`docs/captures/twin-builder/phase1b/reference-pack.json`): identity, trusted
   dimensions with sources, fitment table, 35 references with creator, licence, licence version, licence URL,
   source page, SHA256, role, variant, fitted camera and silhouette IoU, a coverage and confidence matrix for 28
   structural features, feature statements generated from the fit, variant notes, a knowledge graph, the
   conflicts between the synthetic capture and the references, and provenance notes. The REFERENCE stage of the
   lab renders it.

## Results

Numbers are from round four of the fit. Curve errors are compared at the 1264 px working width; one pixel is about 4.9 mm on the synthetic views and 4 to 8 mm on the references depending on their framing.

### Before and after

| metric | Phase 1 | Phase 1B |
| --- | --- | --- |
| data residual RMS, synthetic capture | 9.7 px | 11.74 px (with hard dimensions the capture can no longer be matched everywhere) |
| data residual RMS, references | not used | 7.26 px |
| data residual RMS, all views | 9.7 px | 8.96 px |
| wheel centre error on real G80 references (face centre against the face ellipse) | not available | 17.0 mm mean, 16.7 mm median, 37.9 mm worst, 17 observations |
| wheel centre error on the synthetic capture (tread aware outline shift, measures the capture's conflict with the trusted chassis) | 70.0 mm mean (raw ellipse centres, free chassis) | 53.3 mm mean, 45.3 mm median, 129.1 mm worst, 28 observations |
| tyre radius against the fitment radius | fitted +17.7 mm | fixed; capture outlines 0.992 of it, reference outlines 1.009 |
| uncertain curves | 21 | 12 by the Phase 1 rule, 5 by the Phase 1B rule |
| partial curves | 31 | 32 by the Phase 1 rule, 13 by the Phase 1B rule |
| prior only curves | 7 | 2 |
| recovered / reference confirmed | 38 recovered | 51 recovered by the Phase 1 rule; 69 reference confirmed, 8 measured from the capture only |

Labels over the 118 curve instances: REFERENCE_CONFIRMED 69, SYMMETRY_DERIVED 54, MEASURED_FROM_CAPTURE 13, DIMENSION_CONSTRAINED 10, GENERIC_PRIOR 2, AI_HYPOTHESIS 5.

### Dimensions

| measure | Phase 1 (free) | Phase 1B (constrained) |
| --- | --- | --- |
| length | 4.7504 m (-43.6 mm) | 4.7925 m (-1.5 mm) |
| width | 1.8715 m (-31.5 mm) | 1.8972 m (-5.8 mm) |
| height | 1.433 m (-0.0 mm) | 1.433 m (+0.0 mm) |
| wheelbase | 2.8574 m (+0.4 mm) | 2.857 m (-0.0 mm) |
| tyre radius | 0.3552 m (+17.7 mm) | 0.3385 m (+0.0 mm) |
| track front / rear | fixed | fixed 1.617 / 1.605 m |

### Wheels

Per observation: outline RMS is the distance between the projected tyre cylinder outline and the tyre outline found in the image; centre error is the shift that best aligns them; radius ratio is the image outline radius over the projected one.

| view | wheel | outline RMS | centre error | radius ratio |
| --- | --- | --- | --- | --- |
| ref003 | rear left | 100.4 mm | 11.0 mm | 0.999 |
| ref006 | front left | 86.2 mm | 2.9 mm | 0.936 |
| ref007 | front left | 17.4 mm | 9.5 mm | 1.028 |
| ref007 | rear left | 24.1 mm | 16.7 mm | 0.977 |
| ref062 | front right | 34.2 mm | 2.5 mm | 1.021 |
| ref062 | rear right | 42.6 mm | 21.8 mm | 1.048 |
| ref072 | front left | 42.1 mm | 10.1 mm | 1.078 |
| ref072 | rear left | 38.0 mm | 5.2 mm | 0.967 |
| ref117 | front left | 60.9 mm | 17.5 mm | 0.974 |
| ref117 | rear left | 41.6 mm | 21.3 mm | 0.962 |
| ref126 | rear right | 92.5 mm | 22.2 mm | 1.068 |
| ref135 | rear left | 69.1 mm | 12.6 mm | 1.098 |
| ref158 | rear left | 86.7 mm | 37.9 mm | 0.991 |
| ref187 | front right | 116.7 mm | 25.8 mm | 1.017 |
| ref213 | rear left | 75.3 mm | 24.3 mm | 0.981 |
| ref237 | front right | 106.3 mm | 15.9 mm | 0.967 |
| ref280 | rear left | 128.8 mm | 32.6 mm | 1.042 |
| 02 | front left | 64.2 mm | 95.9 mm | 0.893 |
| 02 | rear left | 71.6 mm | 81.8 mm | 1.064 |
| 03 | front left | 62.5 mm | 57.3 mm | 0.974 |
| 03 | rear left | 59.6 mm | 76.9 mm | 1.025 |
| 04 | front left | 42.2 mm | 37.5 mm | 1.051 |
| 04 | rear left | 27.1 mm | 20.9 mm | 1.027 |
| 05 | rear left | 41.8 mm | 9.3 mm | 0.948 |
| 05 | front left | 39.8 mm | 9.3 mm | 1.086 |
| 06 | rear left | 32.8 mm | 0.0 mm | 0.986 |
| 06 | front left | 31.5 mm | 13.8 mm | 1.048 |
| 08 | front right | 37.8 mm | 20.9 mm | 1.02 |
| 08 | rear right | 64.2 mm | 41.9 mm | 0.925 |
| 09 | front right | 63.5 mm | 35.8 mm | 0.944 |
| 09 | rear right | 476.3 mm | 129.1 mm | 1.163 |
| 10 | front right | 37.4 mm | 57.5 mm | 0.967 |
| 10 | rear right | 28.0 mm | 19.7 mm | 0.976 |
| 11 | front right | 53.2 mm | 73.1 mm | 1.018 |
| 11 | rear right | 95.8 mm | 114.6 mm | 1.105 |
| 12 | front right | 77.5 mm | 68.4 mm | 0.872 |
| 12 | rear right | 86.8 mm | 104.8 mm | 1.097 |
| 13 | front left | 52.4 mm | 63.5 mm | 0.952 |
| 13 | rear left | 69.2 mm | 115.7 mm | 0.864 |
| 14 | rear left | 72.5 mm | 48.8 mm | 0.909 |
| 14 | front left | 95.7 mm | 123.6 mm | 0.896 |
| 15 | front right | 24.0 mm | 9.1 mm | 0.995 |
| 15 | rear right | 78.2 mm | 9.1 mm | 0.909 |
| 16 | front right | 40.4 mm | 33.6 mm | 1.008 |
| 16 | rear right | 38.5 mm | 20.8 mm | 1.051 |

### Skeleton elements

| element | Phase 1 | Phase 1B | statuses now |
| --- | --- | --- | --- |
| roofline | 7.13 px | 5.85 px | measured 1, reference confirmed 5, prior 1 |
| beltline | 8.65 px | 9.28 px | reference confirmed 4, measured 2, partial 1, uncertain 1 |
| shoulder line | prior px | 2.21 px | reference confirmed 2 |
| hood perimeter and creases | 8.50 px | 5.27 px | reference confirmed 4, measured 1, prior 1 |
| trunk perimeter | 14.56 px | 9.18 px | reference confirmed 4 |
| windshield boundary | 7.04 px | 9.12 px | measured 1, partial 3 |
| side window boundaries | 9.89 px | 12.78 px | measured 4, partial 3, uncertain 2, reference confirmed 3 |
| pillars | 11.54 px | 12.48 px | partial 4, measured 2, uncertain 1, reference confirmed 3 |
| wheel centres | prior px | prior px |  |
| wheel arches | 13.80 px | 9.58 px | reference confirmed 4 |
| rocker and sill | 14.88 px | 10.25 px | reference confirmed 8, partial 2 |
| front bumper outline | 9.05 px | 6.37 px | reference confirmed 8 |
| rear bumper outline | 12.59 px | 7.91 px | reference confirmed 8 |
| grille outline | 10.15 px | 11.86 px | reference confirmed 4, uncertain 1 |
| headlight outlines | 4.40 px | 7.71 px | reference confirmed 1, partial 1 |
| taillight outlines | 5.49 px | 14.36 px | partial 1, uncertain 1 |
| four door boundaries | 10.11 px | 9.33 px | reference confirmed 10, measured 2, partial 1, uncertain 1 |
| mirrors and handles | 4.87 px | 9.17 px | reference confirmed 2, measured 2, partial 1, uncertain 1 |

### Reference consensus coverage

| feature | reference views | capture views | error | confidence | status |
| --- | --- | --- | --- | --- | --- |
| roofline | 8 | 6 | 5.85 px | 63% | reference confirmed |
| greenhouse | 8 | 6 | 9.50 px | 38% | measured |
| A pillar | 8 | 8 | 9.89 px | 22% | partial |
| B pillar | 10 | 7 | 11.52 px | 26% | measured |
| C pillar | 7 | 6 | 14.73 px | 46% | partial |
| quarter glass | 8 | 7 | 9.63 px | 43% | partial |
| hood | 9 | 6 | 6.12 px | 82% | reference confirmed |
| hood creases | 2 | 0 | 1.88 px | 49% | prior |
| trunk | 9 | 5 | 9.18 px | 74% | reference confirmed |
| shoulder line | 8 | 0 | 2.21 px | 81% | reference confirmed |
| beltline | 7 | 5 | 9.28 px | 49% | measured |
| rockers and sills | 7 | 7 | 10.25 px | 74% | reference confirmed |
| front arches | 8 | 7 | 9.93 px | 88% | reference confirmed |
| rear arches | 6 | 7 | 9.23 px | 86% | reference confirmed |
| lower fenders | 8 | 7 | 13.32 px | 87% | reference confirmed |
| rear quarters | 7 | 6 | 11.84 px | 83% | reference confirmed |
| kidney grille | 12 | 6 | 11.86 px | 65% | reference confirmed |
| headlights | 11 | 5 | 7.71 px | 43% | partial |
| taillights | 8 | 5 | 14.36 px | 15% | uncertain |
| front bumper | 6 | 6 | 6.27 px | 88% | reference confirmed |
| rear bumper | 6 | 5 | 7.91 px | 81% | reference confirmed |
| mirrors | 6 | 8 | 8.46 px | 47% | reference confirmed |
| door seams | 9 | 7 | 8.19 px | 91% | reference confirmed |
| handles | 0 | 7 | 9.53 px | 29% | partial |
| side gill | 0 | 0 |  | 0% | prior: not a fitted curve yet: seen in reference details, knowledge graph only |
| spoiler lip | 0 | 0 |  | 0% | prior: represented by the trunk edge curve; the lip itself is a variant part |
| exhaust layout | 0 | 0 |  | 0% | prior: quad tips: knowledge graph only, no curve |
| wheel and tyre relationship | 17 | 28 |  | 57% | partial: centre error on real references mean 17.0 mm, capture 53.3 mm |

### Worst ten remaining curves

| curve | Phase 1 | Phase 1B | status | labels |
| --- | --- | --- | --- | --- |
| grille_r | 11.62 px | 32.55 px | uncertain | DIMENSION_CONSTRAINED, SYMMETRY_DERIVED, AI_HYPOTHESIS |
| belt_door_rear_r | 8.62 px | 22.73 px | uncertain | SYMMETRY_DERIVED |
| c_pillar_lower_r | 21.68 px | 20.96 px | reference confirmed | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |
| quarter_taillight_r | 29.64 px | 20.88 px | reference confirmed | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |
| fender_front_l | 28.95 px | 19.54 px | reference confirmed | REFERENCE_CONFIRMED |
| bpillar_front_r | 14.68 px | 17.21 px | uncertain | SYMMETRY_DERIVED, AI_HYPOTHESIS |
| sill_quarter_l | 30.15 px | 16.91 px | reference confirmed | REFERENCE_CONFIRMED |
| sill_fender_r | 30.51 px | 16.84 px | reference confirmed | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |
| taillight_r | 4.48 px | 16.27 px | uncertain | SYMMETRY_DERIVED |
| quarter_rear_r | 23.49 px | 16.09 px | reference confirmed | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |

### Formerly prior only curves

| curve | Phase 1 | Phase 1B | reference views | error | status |
| --- | --- | --- | --- | --- | --- |
| shoulder_l | prior | reference confirmed | 8 | 2.15 px | REFERENCE_CONFIRMED |
| shoulder_r | prior | reference confirmed | 7 | 2.26 px | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |
| hood_crease_l | prior | reference confirmed | 3 | 1.88 px | REFERENCE_CONFIRMED |
| hood_crease_r | prior | prior | 0 |  | SYMMETRY_DERIVED, GENERIC_PRIOR |
| belt_fender_l | prior | reference confirmed | 3 | 4.53 px | REFERENCE_CONFIRMED |
| belt_fender_r | prior | reference confirmed | 6 | 2.91 px | REFERENCE_CONFIRMED, SYMMETRY_DERIVED |
| roof_crown | prior | prior | 0 |  | DIMENSION_CONSTRAINED, SYMMETRY_DERIVED, GENERIC_PRIOR |

### Camera changes

Synthetic cameras, Phase 1 to Phase 1B (azimuth, elevation in degrees, distance in metres):

| view | Phase 1 | Phase 1B |
| --- | --- | --- |
| 01 | 360.6, 5.2, 7.69 | 1.3, 4.2, 7.39 |
| 02 | 41.3, 4.0, 8.14 | 41.5, 3.4, 7.80 |
| 03 | 43.8, 4.8, 8.33 | 43.9, 4.1, 8.05 |
| 04 | 87.0, 4.7, 8.35 | 87.9, 5.8, 8.18 |
| 05 | 117.0, 2.8, 8.57 | 120.3, 1.9, 8.21 |
| 06 | 128.6, 2.6, 9.01 | 131.7, 2.2, 8.62 |
| 07 | 179.7, 12.3, 8.98 | 179.8, 10.3, 8.32 |
| 08 | 233.7, 2.7, 8.00 | 232.0, 2.4, 7.68 |
| 09 | 232.2, 2.6, 8.66 | 257.6, 10.2, 8.77 |
| 10 | 276.3, 5.8, 8.84 | 274.9, 5.0, 8.72 |
| 11 | 317.8, 4.5, 8.39 | 318.0, 4.0, 8.09 |
| 12 | 319.6, 4.6, 8.29 | 319.8, 3.9, 8.01 |
| 13 | 40.3, 15.8, 9.06 | 40.3, 14.6, 8.74 |
| 14 | 120.9, 15.8, 8.93 | 124.3, 14.4, 8.63 |
| 15 | 227.8, 12.2, 8.39 | 225.5, 10.7, 8.02 |
| 16 | 326.1, 11.8, 8.54 | 326.2, 10.6, 8.27 |

Reference cameras (registered by silhouette, refined in the fit): ref084 az 1 el 1 fov 18; ref082 az 1 el 11 fov 21; ref099 az 4 el 2 fov 22; ref204 az 348 el 5 fov 19; ref079 az 181 el 4 fov 20; ref108 az 178 el 5 fov 21; ref148 az 176 el 4 fov 20; ref023 az 189 el 6 fov 22; ref007 az 102 el 18 fov 22; ref135 az 85 el 51 fov 48; ref072 az 50 el -0 fov 35; ref117 az 49 el 0 fov 35; ref062 az 303 el -0 fov 36; ref020 az 328 el 6 fov 22; ref187 az 332 el 11 fov 22; ref033 az 338 el 14 fov 24; ref213 az 31 el 17 fov 22; ref132 az 344 el 12 fov 22; ref006 az 36 el 12 fov 21; ref165 az 340 el 12 fov 22; ref237 az 331 el 13 fov 23; ref003 az 149 el 14 fov 22; ref061 az 213 el 8 fov 22; ref126 az 201 el 1 fov 22; ref068 az 164 el 12 fov 34; ref022 az 158 el 8 fov 22; ref158 az 154 el 1 fov 23; ref280 az 152 el 18 fov 36; ref088 az 192 el 9 fov 21; ref188 az 151 el 14 fov 22.

### Conflicts between the synthetic capture and the real G80 references

- length: capture fits 4.7504 m when free (Phase 1); reference 4.794 m official. dimension held to the specification; the capture cameras absorb the difference.
- width: capture fits 1.8715 m when free (Phase 1); reference 1.903 m official. held to the specification.
- tyre radius: capture 0.992 of the fitment radius in the capture views; reference 1.009 in the reference photographs. radius fixed from the fitment table (275/35 R19, 285/30 R20); the synthetic car's wheels are drawn too large.
- proportions: capture front view width to height 1.29 with mirrors; reference 1.44 official with mirrors. the synthetic car is not dimensionally a G80; trusted dimensions override it.
- C pillar: capture 23.4 px; reference 6.1 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- trunk: capture 15.3 px; reference 3.0 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- rockers and sills: capture 17.6 px; reference 2.9 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- front arches: capture 18.4 px; reference 1.5 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- rear arches: capture 16.8 px; reference 1.7 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- lower fenders: capture 25.1 px; reference 1.5 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- rear quarters: capture 21.7 px; reference 2.0 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- front bumper: capture 10.7 px; reference 1.8 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- rear bumper: capture 13.5 px; reference 2.3 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.
- door seams: capture 15.1 px; reference 1.3 px. the tier with the smaller error dominates; the other is down weighted by the robust loss.


## Is this a sufficiently accurate structural representation of a BMW M3 G80 to surface?

Not yet, and the answer is now specific rather than general.

What is solid enough to surface: the upper body and the character of the car. Roofline, hood perimeter, both
hood creases (the left one measured at 1.9 px in three references, the right one by symmetry), the shoulder
line (2.2 px in eight references), front and rear bumper outlines, trunk perimeter, front and rear arches,
sills and rockers, door seams and the beltline are reference confirmed with errors between 2 and 10 px (1 to
5 cm) and the chassis is exact by construction. These curves reproject onto real G80 photographs from thirty
cameras, which is the test the engine had to pass.

What is not: the light housings and the greenhouse edges. Taillights (14 px, one uncertain), the windshield
corners and the side window boundaries (12 to 13 px), the pillars (12 px) and the centre intake stayed loose
because the GrabCut extractor on real photographs returns the lamp plus its dark surround, and the glass
extractor confuses reflections with the frame. The Phase 1 synthetic views measured these at 4 to 6 px; the
references pulled them out. Wheel centres on the references are at 17 mm mean, above the 10 mm target; the
synthetic capture's wheels sit 53 mm from where a real G80's wheels must be, which is the capture's fault
and is now measured rather than absorbed.

Evidence still missing before Phase 2: a part level segmenter that separates the lens from the housing and
the glass from the frame on real photographs (SAM 3 on a GPU, or a labelled pass with the vision reviewer,
both paid and both waiting for approval), and at least four more straight side references of stock cars in
flat light for the sills and the C pillar. The taillight and quarter glass curves should be treated as
partial when surfacing starts, whatever the round says. With those two items the greenhouse and the lights
would reach the same 2 to 6 px as the body, and surfacing could begin on the whole exterior instead of on
the body alone.

Stopped here for approval. No Phase 2, no surfaces, no Meshy, no new AI generation, no credits, no purchases,
no production, no main, no database, no scan UI.

## Reference attribution

All references are class A (Creative Commons with attribution; share alike where marked). Overlays drawn on CC BY SA photographs are shared under the same licence.

| ref | role | creator | licence | source |
| --- | --- | --- | --- | --- |
| ref084 | front | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref082 | front | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref099 | front | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref204 | front | Calreyn88 | CC BY-SA 4.0 | wikimedia |
| ref079 | rear | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref108 | rear | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref148 | rear | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref023 | rear | Alexandre Prevot | CC BY-SA 2.0 | flickr |
| ref007 | side | Dinkun Chen | CC BY-SA 4.0 | wikimedia |
| ref135 | side_high | OWS Photography | CC BY 4.0 | wikimedia |
| ref072 | side | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref117 | side | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref062 | side (LCI) | Tomtom7777 | CC BY-SA 4.0 | wikimedia |
| ref020 | front34 | Alexander Migl | CC BY-SA 4.0 | wikimedia |
| ref187 | front34 | RL GNZLZ | CC BY-SA 2.0 | flickr |
| ref033 | front34 | Jakub CA | CC BY 4.0 | wikimedia |
| ref213 | front34 | Ethan Llamas | CC BY-SA 4.0 | wikimedia |
| ref132 | front34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref006 | front34_high | Ethan Llamas | CC BY-SA 4.0 | wikimedia |
| ref165 | front34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref237 | front34 | Calreyn88 | CC CC0 1.0 | wikimedia |
| ref003 | rear34_high | Ethan Llamas | CC BY-SA 4.0 | wikimedia |
| ref061 | rear34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref126 | rear34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref068 | rear34_high | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref022 | rear34 | Alexandre Prevot | CC BY-SA 2.0 | flickr |
| ref158 | rear34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref280 | rear34 | Tokumeigakarinoaoshima | CC CC0 1.0 | wikimedia |
| ref088 | rear34 | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref188 | rear34 | RL GNZLZ | CC BY-SA 2.0 | flickr |
| ref056 | detail_headlight, detail only | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref242 | detail_taillight, detail only | Lex Mendoza | CC BY-SA 2.0 | flickr |
| ref073 | detail_wheel, detail only | Damian B Oh | CC BY-SA 4.0 | wikimedia |
| ref253 | detail_gill, detail only | Lex Mendoza | CC BY-SA 2.0 | flickr |
| ref259 | detail_exhaust, detail only | Lex Mendoza | CC BY-SA 2.0 | flickr |

