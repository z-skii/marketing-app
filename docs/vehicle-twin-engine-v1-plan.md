# TapMart Vehicle Twin Engine V1: automatic vehicle builder plan (revision 2)

Status: proposal, revised 2026-09-24 after the decision that the engine must
construct the generation twin itself and people only correct what it flags.
No code, no credits, no deployment.

## The honest headline

An automatic structured builder is technically feasible in 2026, with one
qualification: the body, panels, glass, pillars, wheel placement, arches and
the main character lines can be built and fitted automatically from photos
plus known dimensions; the parts that carry brand identity in small areas
(grille internals, light signatures, unusual wheels, badges) can be built to
a plausible level automatically but will need a human to confirm or correct
on the first vehicle of a generation. Expect the engine to deliver 80 to 90
percent of a professional exterior on its own and to hand a person two to
four flagged components, not a whole car. That replaces "an artist models
every generation" with "a reviewer fixes a grille", which is the change
requested.

The design decision behind this: the universal prior is a curve network,
not a mesh. Professional automotive surfacing is curve first (feature
curves, then Class-A patches between them). Feature curves are exactly what
photos constrain best (silhouettes, beltline, roofline, window boundaries,
seams, arches, bumper edges), what multi-view curve reconstruction recovers
in 2026, and what makes an M3 differ from a Camry. Surfaces are then
generated from the curves with continuity constraints, so they are clean by
construction.

## Research findings

1. Parametric vehicle reconstruction. Vehicle-specific priors work when they
   are part aware and fitted with differentiable rendering: CADSim (Waabi,
   2023) fits a small set of CAD car priors with articulated wheels to
   in-the-wild sensor data; 3DRealCar (ICCV 2025) gives 2,500 real scanned
   cars with dimensions for benchmarking; Common3D (CVPR 2025) learns a
   category template plus deformation field from casual videos, code
   released. Classic PCA car shape spaces exist but are too blunt for
   brand identity; they are useful only as a coarse initialiser.
2. Image to CAD and B-rep generation. CADENA (2026, code released), CAD-Recode
   (ICCV 2025), CADCrafter, BrepGen, BrepDiff, AutoBrep, BrepGPT and
   DreamCAD (ECCV 2026, differentiable Bezier patch tessellation, code to be
   released) show that programs and B-reps can be inferred and optimised
   against images. They are trained on mechanical parts (sketch and extrude,
   ABC, DeepCAD); none targets free-form car bodies. Their usable lesson is
   the representation: parametric patches with a differentiable tessellation
   can be optimised against images end to end.
3. Subdivision and patch fitting. Catmull-Clark subdivision is a linear
   operator on control points, so a control cage can be optimised through a
   differentiable renderer directly; Loop and Catmull-Clark fitting to
   targets is mature. OpenCASCADE (LGPL) provides constrained surface
   filling with G1 and G2 continuity (BRepFill_Filling, GeomPlate) and Gordon
   curve network interpolation through occ_gordon (Python). This is the
   "clean surfaces by construction" toolset.
4. Multi-view curve reconstruction. CGGT (SIGGRAPH Asia 2026) reconstructs
   parametric 3D curves feed-forward from sparse unposed photos and
   separates structural edges from silhouette and texture edges; SGCR,
   CurveGaussian, SketchSplat, EMAP and NEF do it by optimisation. This is
   new since our last plan and it is the piece that makes a curve-first
   builder practical.
5. Procedural and agentic construction. LL3M, Procedura (2026), MeshCoder
   and the 3DCodeBench and P3D-Bench benchmarks (2026) show VLM agents can
   write part-structured procedural programs and improve them in a render,
   critique, rebuild loop; Procedura produces the sharpest edges of any
   method on hard-surface benchmarks. The same benchmarks report the limits:
   assemblies are the hardest case, global shape is recovered but precise
   parametric geometry is not, and free Blender code produces floating
   parts. Conclusion for TapMart: the agent decides structure and diagnoses
   defects; numerical optimisation owns every dimension and curve.
6. Part-aware generation. PartCrafter (MIT), PartPacker, OmniPart, HoloPart,
   FullPart, Hunyuan3D-Part (P3-SAM segmentation of any mesh, X-Part
   completion; community licence, not EU) and Tripo mesh segmentation give
   part candidates from crops or meshes. Quality is generic; a G80 kidney
   grille comes back plausible, not exact. Good enough as a candidate that
   is retopologised (QuadWild, feature-line driven pure quad remeshing) and
   fitted into a slot, never as truth.
7. Automotive surfacing. Class-A reconstruction from feature curves is an
   established industrial workflow (PDE surfaces from feature curves,
   QuickSurface 2026 curve-based patching, PolyWorks automatic surfacing).
   The engine copies the workflow, not the tools.
8. Data for a universal prior. Objaverse and Objaverse-XL objects carry
   Creative Commons licences and MeshFleet (2025) is a filtered, quality
   annotated vehicle subset intended for domain generative modelling;
   ShapeNet is non-commercial. Fitting the curve network to a few hundred
   CC-BY car meshes gives a statistical prior on curve control points per
   body style without touching any branded commercial model.
9. Wheels. DeepWheel (2025) shows wheel geometry from images is tractable;
   for TapMart a parametric wheel builder (rim, spoke count and profile from
   the straight side view, tyre torus) is simpler and exact enough.
10. Single-image generators remain evidence. SAM 3D reports symmetry errors,
    floaters and lost thin structures on wheels; TRELLIS.2 and Hunyuan 3.1
    give one surface. They stay in the pipeline as coarse volumetric hints
    and as part candidates only.

## Revised architecture

```
CAPTURE (photos, video, optional VIN)
 -> A intake and coverage gate
 -> B identification (VLM + VMMR API + VIN decode, fused)
 -> C reference intelligence (official dimensions, option matrix, generation record)
 -> D evidence: cameras and metric depth, SAM 3 part masks, 2D edges, 3D feature curves, wheel centres and radii, coarse volumetric hint
 -> E library lookup
      hit  -> F2 instance solve (facelift, trim, wheels, options, colour, modifications)
      miss -> F1 VEHICLE BUILDER
              F1.1 chassis: wheelbase, track, wheel centres, axles, ride height, ground plane
              F1.2 skeleton: body-style curve network initialised from the universal prior and dimensions
              F1.3 curve fit: every curve optimised against all views (masks, edges, 3D curves, silhouettes)
              F1.4 body surfacing: patches from the curve network with G1 and G2 continuity, symmetry, crease constraints
              F1.5 panel split: doors, hood, trunk, fenders, quarters, bumpers, roof, pillars, glass from the seam curves, real gaps
              F1.6 part builders: wheels, tyres, mirrors, handles, grille, intakes, lights, spoiler, exhaust, badge pucks
              F1.7 assembly with mates and symmetry
 -> G BUILD, RENDER, CRITIQUE, REBUILD loop with component scores
 -> H confidence gate: components under threshold to a reviewer, everything else auto approved
 -> I master (USD, B-rep where available, parts, semantics, ad surfaces) -> LODs -> web GLBs
 -> J library: frozen, versioned generation twin
```

### The universal vehicle prior

Eight body-style skeletons (sedan, coupe, hatchback, wagon, SUV and
crossover, pickup, van, sports car), each a named curve network of about 40
to 60 B-spline curves (roofline, beltline, shoulder line, sill, rocker,
DLO and window boundaries, A B C pillar edges, hood centre and edges,
cowl, trunk edges, bumper edges, wheel arches, fender lines, door seams,
grille outline, light outlines, mirror base, spoiler edge) plus a patch
layout graph that says which curves bound which panel. The curves carry
identity; the layout carries topology. Each skeleton has a statistical prior
on control points learned from CC-BY vehicle meshes, used only to
initialise and regularise. This is built once per body style by an engineer
and a modeller, which is the one-time human investment, not per generation.

Why this beats a mesh template: two sedans with the same layout but
different curves are different cars; a lattice-deformed mesh template
cannot move a shoulder line without dragging the whole surface. Why this
beats free procedural code: the program is a fixed vocabulary (curves,
patches, part builders, mates) so an agent can only choose and parameterise,
never invent unconnected geometry.

### Curves as the fitted quantity

Per view, SAM 3 masks give part boundaries, edge maps give creases, the
cameras come from MapAnything or Depth Anything 3, and a CGGT-style curve
lift (or our own multi-view curve optimisation on the registered cameras)
gives 3D curve estimates. The fitter minimises, over all views together,
mask boundary distance, edge chamfer, silhouette IoU, 3D curve distance,
wheel centre and radius error, symmetry violation and curvature roughness,
with official dimensions as hard constraints. One coherent car, never one
view at a time.

### Surfaces by construction

Patches are generated from the fitted curves with OpenCASCADE constrained
filling and Gordon interpolation (G1 default, G2 on large panels), creases
as tangent-discontinuous curve constraints, arches as procedural flares,
symmetry enforced by mirroring the driver side unless evidence marks an
asymmetric detail. Output is a real B-rep body, tessellated at 1 to 2 mm
for the master. A Catmull-Clark cage path in Blender is the fallback when
a patch fails to fill. No triangles are ever smoothed after the fact.

### Parts

Each slot has a builder in order of preference: parametric (wheels, tyres,
handles, mirrors, exhaust, badge pucks, simple grilles and intakes as
outline plus bar or mesh pattern), library (a validated part from another
generation), generative candidate (TRELLIS.2 or PartCrafter on the user's
crops, retopologised with QuadWild, scaled and oriented into the slot,
mirrored), then review. A candidate is accepted only when its reprojection
matches the crops in every view that sees it.

### Build, render, critique, rebuild

After every pass, the car is rendered in the source cameras with a
component id map. Scores are computed per component and per view: silhouette
IoU, part mask IoU, boundary chamfer, curve reprojection error, dimension
error, symmetry error. A VLM critic receives the source crop and the render
crop for each component and returns a defect label and a severity, never a
number that overrides the metrics. The controller picks the worst component,
applies the diagnosed fix (refit its curves, swap the part candidate, adjust
a builder parameter), re-renders, and repeats until every component passes
or the budget is spent. Component level, not one global loss.

### Confidence gate

Each component ends with a confidence from its metric margins and view
agreement. Above threshold: auto approved. Below: the reviewer sees only
those components with overlays and three actions (approve, correct in the
tool, request capture). The engine reruns validation after corrections.

### Frozen generation twin

Approval freezes and versions the generation twin: curve network, B-rep,
parts, variants, ad surfaces, validation report. Later owners of the same
generation run F2 only: facelift and trim check, wheel refit, options,
colour, user modifications, validation.

## What still genuinely needs a person

1. One-time: designing the eight body-style skeletons and their patch
   layouts (engineer plus modeller, weeks, done once).
2. First vehicle of a generation: confirming or correcting the components
   the engine flags, typically grille internals, light signatures, unusual
   wheels, spoilers and aftermarket parts. Estimate one to three hours,
   falling as the part library grows.
3. Threshold calibration during the first few dozen generations.
4. Legal decisions on badge artwork and design rights (unchanged from the
   previous plan): neutral emblem geometry by default, brand names in text,
   real logo artwork only under licence or counsel sign-off; US first; a
   legal opinion on rendering a customer's own car for that customer's ads.

## Realistic accuracy

Automatic, without correction: dimensions within 1 percent (they are
constraints); body silhouette within 3 px at 1264 px in every view; panels,
seams, glass and pillars in place; wheels with the right diameter, width,
offset and spoke count; main creases present. Not reliable without a
person: exact grille bar geometry, headlight and taillight internal
signatures, badges, very subtle surface transitions. Not achievable at all
from photos: interior, underbody, dents, sub-millimetre surfaces.

## Prototype: the G80 builder

One question: can TapMart automatically construct a professional structured
G80 exterior substantially closer to the green reference than Meshy did,
without starting from any pre-existing BMW 3D model. Evidence set: the 16
controlled G80 images and BMW's published dimensions. No database, no
accounts, no scan UI, no mobile capture.

Scope: 16 images -> structured G80 master -> validation -> interactive
viewer.

Steps:
1. Evidence: MapAnything cameras (replacing our silhouette registration),
   SAM 3 masks for about 25 concepts, edge maps, 3D feature curves by
   multi-view optimisation on the registered cameras (CGGT if released and
   licensed, otherwise our own lift), wheel centres and radii.
2. Sedan skeleton: the first of the eight, about 48 named curves and its
   patch layout, initialised from dimensions and a prior fitted to CC-BY
   sedan meshes. This is the largest engineering piece.
3. Curve fitter in PyTorch3D (BSD) or Mitsuba 3 (BSD): all 16 views at once.
4. Surfacing with OpenCASCADE through build123d or occ_gordon: B-rep body,
   panel split along seam curves with 4 mm gaps, tessellation at 1 to 2 mm.
5. Part builders: parametric wheels and tyres from the side view, mirrors
   and handles from mask contours, kidney grille as outline plus bar pattern
   from the front view, headlights and taillights as outline plus lens plus
   a generative interior candidate (TRELLIS.2 on crops, MIT), spoiler lip,
   exhaust, badge pucks. Symmetry by construction.
6. Loop: render, component scores, VLM critique, targeted rebuild, five
   rounds maximum.
7. Confidence report and a review screen listing only flagged components.
8. Master in USD plus the B-rep, LOD0 GLB, the TapMart standard style, the
   door ad on the named door panel, one lab page.

Pass criteria, all measured in the 16 registered views unless stated:
- Dimensions: length, width, height, wheelbase, front and rear track within
  1 percent of the BMW sheet; overhangs within 2 percent.
- Silhouette: whole-car IoU at least 0.95 in every view, boundary chamfer
  under 3 px at 1264 px.
- Wheel placement: wheel centre error under 1 cm, radius error under 3
  percent, wheels parallel to the body axis, four wheels symmetric.
- Roofline and beltline: reprojected curve error under 3 px in the four
  straight views and under 5 px in the three-quarter views.
- Windows and pillars: glass mask IoU at least 0.85 per pane, pillars
  present as separate solids with correct widths within 10 percent.
- Doors, hood, trunk: seam reprojection error under 4 px, panels closed
  solids with 4 mm gaps, door panel area within 5 percent of the mask.
- Headlights and taillights: outline IoU at least 0.8, lens surface a
  separate solid, an interior candidate present or the component flagged.
- Grille: outline IoU at least 0.85, opening count and bar orientation
  matching the front view, a separate solid.
- Bumpers: front and rear silhouette IoU at least 0.9 in the straight
  views, intakes as real openings.
- Mirrors: position error under 1 cm, mask IoU at least 0.7.
- Wheel geometry: spoke count and spoke shape class matching the side view,
  rim and tyre as separate solids with correct width.
- Panel boundaries: every seam a real edge in the geometry, none painted.
- Structure: every part a closed manifold with a name, symmetry pairs
  mirrored within 2 mm, no floating geometry, no intersections.

Visual test: six views (front, rear, driver, passenger, front three-quarter,
rear three-quarter) in the TapMart standard style, judged blind against the
Meshy twin and against the reference screenshot by a VLM panel and by mo:
pass only if it reads as a professionally modelled G80 from every angle,
the M3 is identifiable from the grille, lights and arches without a badge,
and no view shows a scan-like surface.

Time and cost: five to seven weeks of engineering for the first working
builder (the skeleton and fitter are new engine code, not a lab page); GPU
about 30 to 60 USD over the period; model API tokens under 100 USD; no
artist; one to three hours of review at the end for flagged components. A
second generation through the same builder should take under an hour of
compute and the same review pattern, which is the real test of the
approach.

Fallback if the prototype fails the visual test: the failure will be
localised by component, so the fix is a better builder for that component
(or a part library entry), not a return to whole-car generation.

## Unchanged from the previous revision

Identification, reference intelligence, storage, master format, triangle
budget, LODs, semantic storage, dimension validation, reprojection
validation, user modifications, badge treatment, licensing notes, failure
conditions and library growth are as in the first revision; the only change
is that the generation twin is built by the engine and corrected by a
person, not modelled by an artist.
