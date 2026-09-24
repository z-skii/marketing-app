# Vehicle twin builder, Phase 1: G80 structural skeleton

Status: built, awaiting approval. Lab: `/labs/twin-builder` (engineering lab, not a customer screen).
Label: CONTROLLED SYNTHETIC CAPTURE TEST. The 16 source views are AI generated images of one consistent car
(see `docs/captures/ai-g80-controlled/README.md`); nothing here proves that real phone captures behave the same.

Phase 1 of the plan in `docs/vehicle-twin-engine-v1-plan.md` (revision 2): 16 source images to camera
registration, vehicle dimensions, detected curves and landmarks, and an optimised 3D curve network. No surfaces,
no mesh, no Meshy, no production, no database, no scan UI. Zero paid API or GPU credits were spent: every step
runs on the container CPU with open source libraries (OpenCV, NumPy, SciPy) plus the part polygons that were
already paid for in the refinement experiment.

## What was built

1. Evidence extraction (`scripts/evidence.py.txt`, `scripts/wheels.py.txt`). Per view, on 1264 x 848 working
   images: whole car silhouette by GrabCut seeded from the union of the existing part polygons; contrast parts
   (glass, lights, grille, intakes, mirrors, rocker trim, handles) by GrabCut initialised from their polygons;
   panels (hood, trunk, doors, fenders, bumpers, pillars, roof) by snapping the polygon to the nearest strong
   gradient with a Viterbi smoothed normal search; wheels by a polar edge snap around the initial circle and a
   robust ellipse fit. Output: 16 evidence files (`evidence/NN.json`) and QA images (`evidence/NN-qa.jpg`).
2. Vehicle prior (`scripts/prior.py.txt`). A sedan curve network authored from proportions and the official G80
   dimensions: 54 named curves (centre curves plus left curves mirrored to the right), 118 curve instances,
   loops that map each part polygon to an ordered list of curves, a silhouette curve set and outward normals
   for visibility. The prior is authored for Phase 1, not learned.
3. Joint fit (`scripts/fit.py.txt`). Unknowns: 793 curve control coordinates, wheel x positions, tyre radius
   and five parameters per camera (azimuth, elevation, distance, two target shifts; the field of view stays at
   the registered value). Cameras are initialised by a coarse grid search of azimuth and elevation against the
   silhouette and wheels, then refined jointly. Data terms: curve samples to polygon contour distance (through
   a distance transform), contour points to nearest visible curve sample, silhouette points to nearest
   silhouette curve, wheel face centres and, in the two side views, tyre ellipses. Constraints: wheelbase and
   arch to wheel ties (strong), length, width, height and tyre radius (soft priors), curve junctions, mirror
   symmetry (by construction), smoothness relative to the prior, weak pull to the prior, weak camera prior.
   Solved with SciPy least squares on a sparse finite difference Jacobian, IRLS robust weights annealed from
   30 px to 6 px over ten outer iterations (about two minutes on four CPU cores).
4. Outputs: `skeleton.json` (curves with control points, dense samples, status, per view errors; wheels;
   cameras; dimensions), 16 overlays with the network reprojected through the fitted cameras, and the lab.

## Results

Data residual (all views, all curve and contour terms): 22.4 px before the fit, 9.7 px after (RMS).
One pixel is about 4.9 mm on the car at these camera distances.

Dimensions (fitted against the official spec):

| measure | fitted | spec | difference |
| --- | --- | --- | --- |
| length | 4.750 m | 4.794 m | -44 mm |
| width | 1.871 m | 1.903 m | -32 mm |
| height | 1.433 m | 1.433 m | 0 mm |
| wheelbase | 2.857 m | 2.857 m | 0 mm |
| tyre radius | 0.355 m | 0.338 m | +18 mm |

The synthetic car is not dimensionally a G80: in the straight views its silhouette is about 8 to 10 percent
narrower and shorter relative to its height than the spec, and its wheels are about 10 percent larger relative
to the wheelbase. The wheelbase is held to the spec (it sets the scale), the other dimensions are soft priors,
so the differences above are the compromise between the images and the spec, not measurement noise.

Wheel centres: 28 observations in the 14 angled views (the two straight views see the tread, not a wheel
face, and are excluded). Mean error 14.4 px (about 70 mm), median 14.3 px, worst 26.1 px. Part of this is
evidence bias: in three quarter views the fitted ellipse centre of the visible tyre is pulled toward the tread.

Curve status (118 instances): recovered 38, partial 31, uncertain 21, prior 7. Mean reprojection error over
the curves with evidence 11.1 px, median 10.2 px.

| element | mean error | status |
| --- | --- | --- |
| headlight outlines | 4.4 px | recovered |
| mirrors and handles | 4.9 px | recovered |
| taillight outlines | 5.5 px | recovered |
| windshield boundary | 7.0 px | cowl and right A pillar recovered, left A pillar and roof front partial |
| roofline | 7.1 px | rails recovered, roof crown from the prior |
| hood perimeter and creases | 8.5 px | perimeter recovered or partial, creases from the prior |
| beltline | 8.7 px | door belts recovered, fender belt from the prior, quarter belt partial |
| front bumper outline | 9.1 px | recovered on the right, partial on the left, splitter recovered |
| side window boundaries | 9.9 px | mostly recovered, lower C pillar uncertain |
| four door boundaries | 10.1 px | belts and right sills recovered, seams mixed |
| grille outline | 10.2 px | intakes recovered, kidneys partial |
| pillars | 11.5 px | A and B mostly recovered, C pillar partial to uncertain |
| rear bumper outline | 12.6 px | diffuser recovered, upper seams uncertain |
| wheel arches | 13.8 px | rear partial, front uncertain |
| trunk perimeter | 14.6 px | uncertain |
| rocker and sill | 14.9 px | partial to uncertain |
| shoulder line | no evidence | prior |

Recovered means evidence in at least two views with a mean error of 8 px or less and at least 60 percent of
the samples within 12 px of a contour. Partial means one good view or a looser fit. Uncertain means evidence
existed but the fit stayed loose or the views disagree. Prior means no polygon in any view carries that curve
(shoulder line, hood creases, fender belt, roof crown): those curves sit where the prior and the junctions put
them and must not be trusted as measured.

Cameras: 15 of 16 stayed within 6 degrees of the registration of the refinement experiment. View 09 (rear
passenger intermediate) was mis-registered there (266 degrees azimuth, 27 degrees elevation, the worst chamfer of
that experiment); the coarse search put it at 235 / 7 and the overlay confirms it.

## What is honest about this skeleton

Strong: greenhouse (windshield, side windows, rear window, rails, A and B pillars), lights, mirrors, handles,
door belts, bumper outlines, wheel centres and the four wheel positions, overall proportions. These reproject
onto all 16 images with errors of a few millimetres to a centimetre.

Weak: the lower body. Sills, rockers, the front arches, the trunk edge and the rear bumper seams are partly
recovered with errors of 1 to 2 cm and disagree between views; the evidence there is the noisiest (dark paint
on dark rubber, soft shadows). Interior creases (hood creases, shoulder line) have no evidence at all.

Not measured: anything below the sill line, the underbody, the interior, the wheel design, badges, and the
exact section shapes between curves (no surfaces exist yet, by design).

## Is it strong enough to begin G1/G2 surfacing

Yes for the upper body and the greenhouse, no for the lower body as it stands. A surfacing pass could start on
the roof, glass, hood, trunk lid, doors above the sill and the front and rear fascias, using the recovered and
partial curves as boundaries. The sills, arches and trunk perimeter need one more evidence pass first (a
dedicated lower body extraction, or a paid segmentation model, see below), otherwise the surfaces there would
carry the same 1 to 2 cm disagreement. Recommendation: approve Phase 2 for the upper body with the lower body
curves flagged, or spend one more zero cost pass on lower body evidence before Phase 2.

## Paid options that would improve Phase 1 (none used)

- SAM 3 or a comparable promptable segmentation model on a GPU: cleaner part masks, especially sills, arches
  and the trunk edge. Needs a GPU host (the container has none).
- A curve or edge lifting network (CGGT style) and a multi view camera network (MapAnything style): direct
  3D curve hypotheses and cameras without the authored prior. GPU.
- OpenAI vision for crease labelling: the creases without evidence (hood creases, shoulder line) could be
  labelled in the 16 views from the API at low cost, then fitted like the other curves. API credits.

## Files

- `src/app/labs/twin-builder/` lab (stage selector, 3D skeleton viewer, source overlays, diagnostics).
- `public/labs/twin-builder/skeleton.json`, `overlays/NN.jpg`, `thumbs/NN.jpg`.
- `docs/captures/twin-builder/`: `skeleton.json` (readable), `evidence/`, `fit.log`, `scripts/` (archived
  copies of the scratch scripts), `screens/` (lab screenshots at 1360 and 390).
