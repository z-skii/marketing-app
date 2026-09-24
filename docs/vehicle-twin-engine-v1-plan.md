# TapMart Vehicle Twin Engine V1: research and engineering plan

Status: proposal, 2026-09-24. No code, no credits, no deployment. Not committed.

## The honest headline

No 2026 system turns arbitrary phone photos or video of a car into the green
reference quality automatically. The best image to 3D generators (TRELLIS.2,
Hunyuan3D 3.1, Rodin Gen-2, Hitem3D, Tripo 3.1, Meshy 7) produce one dense
surface with baked appearance; at 1024 to 1536 voxel resolution the shape is
plausible but never a structured, clean-topology, part-separated asset, and a
full car from uncontrolled captures degrades further (our G80 is the proof).
Feed-forward multi-view geometry (MapAnything, Depth Anything 3, VGGT) and
Gaussian splatting give real, metric evidence of the user's car but not a
usable surface on reflective paint and glass. Part generators (PartCrafter,
Hunyuan3D-Part, Tripo segmentation) give parts, but generic ones.

What does reach the target is a hybrid: identify the exact generation, fit a
clean parametric template (quad topology, named panels, part slots) to every
view at once under real dimensions, fill part slots with dedicated
reconstruction or library parts, refine with differentiable rendering,
validate by reprojection, have a person sign off, and bank the result as a
generation twin so the next owner costs minutes. The first vehicle of a
generation is artist-in-the-loop; every one after is automatic fitting.

## 1. End to end architecture

```
CAPTURE (photos, video, optional VIN)
  -> A. Intake and quality gate
  -> B. Identification (ensemble, evidence weighted)
  -> C. Reference intelligence (dimensions, options, generation record)
  -> D. Evidence extraction (cameras, depth, masks per part, landmarks, splat)
  -> E. Library lookup: generation twin exists?
       yes -> F2. Instance fit (template + options + wheels + colour)
       no  -> F1. Generation build (template fit + part reconstruction + artist finish)
  -> G. Validation loop (render, compare, error map, refine, repeat)
  -> H. Review (automatic pass or human queue)
  -> I. Master asset (USD, parts, semantics, ad surfaces) -> LODs -> web GLBs
  -> J. Library update (generation twin, variants, ad-safe surfaces)
```

Stage by stage:

A. Intake: photos or video (video is sampled to keyframes by blur and overlap
   scoring); EXIF focal length; optional LiDAR depth from iPhone; optional VIN
   photo or typed VIN. Quality gate: coverage map of the car (12 sectors),
   blur, exposure, distance. Fails fast with a specific ask ("walk around the
   rear right").

B. Identification: three independent signals, fused with confidence:
   VLM on the multi-view set (GPT-5.5 through our client, structured output,
   already proven at 0.90 to 0.99 on the G80), a fine-grained make model
   generation classifier API (Carnet.ai claims 97 percent to generation level;
   Plate Recognizer VMMR as alternative), and, when available, the VIN decoded
   through NHTSA vPIC (free, official, definitive make, model, year, body,
   trim, doors). Disagreement or confidence under 0.85 on generation or
   facelift goes to the user as a two option question with photos, never
   guessed.

C. Reference intelligence (legally safe): official dimension facts from
   Transport Canada's Canadian Vehicle Specifications (length, width, height,
   wheelbase, front and rear track, overhangs, side glass height, 1972 to
   2027, public), NHTSA vPIC (body class, doors, plant, GVWR), manufacturer
   press specifications (facts are not copyrightable), tyre and wheel sizes
   from the fitment data on the door jamb label (the user photographs it).
   Press photography is used only as human reference for the artist during a
   first generation build; nothing is copied into the asset. No commercial 3D
   model is downloaded or traced. The generation record stores the option
   matrix (wheel designs, spoilers, packages) as a checklist for evidence.

D. Evidence extraction on the user's images:
   cameras and metric geometry: MapAnything (Apache 2.0 checkpoint) or Depth
   Anything 3 (Apache 2.0); VGGT only with the commercial checkpoint. A
   gsplat scene (Apache 2.0) trained for a few minutes gives a dense
   silhouette and novel views for the fit, never the final surface.
   Part masks: SAM 3 with concept prompts ("headlight", "kidney grille",
   "door handle", "side mirror", "wheel", "windshield") on every keyframe,
   tracked in video, giving per part masks with confidence; far better than
   the polygons we used.
   Landmarks: wheel centres and arch apexes from masks and depth; body
   creases and panel gaps from edge maps constrained to the template's seam
   set.

E. Library lookup by generation and facelift code.

F1. Generation build (first vehicle of a generation):
   1. Body style template: TapMart owns a small set of canonical quad
      templates (sedan, coupe, hatch, wagon, SUV, pickup, van), each with named
      panels, seams, pillars, glass, part slots and a low-dimensional
      deformation basis (blend shapes plus free-form lattice). This is the
      "clean topology from the beginning" answer: the mesh never comes from a
      generator, so it is clean by construction.
   2. Coarse fit: dimensions from C fix scale, wheelbase, track, overhangs,
      glass height; silhouettes and depth from D fit the lattice; then per
      vertex refinement with differentiable rendering (PyTorch3D, BSD, or
      Mitsuba 3, BSD; nvdiffrast is non-commercial and is excluded) against
      silhouettes, part masks, normals from the splat, and seam positions,
      with symmetry and smoothness priors and dimensions as hard constraints.
      One coherent model against all views at once.
   3. Part slots: headlights, taillights, grille and intakes, mirrors,
      handles, wheels, spoiler, exhaust. Each slot has a bounding frame on
      the template. Candidates come from (a) the TapMart part library when a
      matching part exists, (b) a part generator conditioned on the user's
      crops (TRELLIS.2 at part scale, MIT; PartCrafter, MIT; Hunyuan3D-Part
      X-Part under Tencent's community licence, not in the EU), (c) an
      artist. Wheels are built from a parametric rim and tyre with the spoke
      pattern reconstructed from the straight side view (count, shape,
      concavity), never a solid disc.
   4. Coarse AI evidence: a single high resolution generation (TRELLIS.2 or
      Hunyuan 3.1 with multi view) is run once as a volumetric hint for the
      fit and for the artist, not as the asset.
   5. Artist finish: a modeller opens the fitted template in Blender with the
      evidence overlays, corrects creases, seams and part slots, and signs
      off. Expected 4 to 12 hours for a first generation. This is the step
      that makes the twin look like the green reference.

F2. Instance fit (a generation twin exists): identify options from evidence
   (wheel design, spoiler, splitter, facelift lights), select variants, fit
   the instance lattice within tight bounds, detect body colour, fit wheels,
   flag aftermarket parts. Fully automatic; minutes.

G. Validation loop: for every source view, render silhouette, part id map,
   normals and seams with the registered camera; compare against SAM 3 masks
   (IoU per part), edge chamfer, landmark error, seam distance; dimensions
   against C. Produce a per panel error heat map. Refine the worst panels
   (local lattice or vertex optimisation, or a part slot re-candidate) and
   repeat until thresholds hold or the budget is spent.

H. Review: automatic pass if all thresholds hold and identification is
   confident; else a reviewer sees the overlays and either accepts, fixes in
   the tool, or requests capture ("need clearer front left headlight").

I. Master and LODs (section 10 to 12).

J. Library: the approved generation twin, its variants, the part library
   entries, the ad-safe surfaces and the validation report are stored;
   instance twins reference the generation twin.

## 2. Which model, service or library performs each stage

| Stage | Component | Licence or terms |
| --- | --- | --- |
| A quality gate | Custom (OpenCV, EXIF, coverage model) | Ours |
| B identification | GPT-5.5 vision (existing client); Carnet.ai or Plate Recognizer VMMR; NHTSA vPIC VIN decode | OpenAI terms; commercial APIs; public data |
| C dimensions | Transport Canada CVS, NHTSA vPIC, OEM press specs | Public facts |
| D cameras and depth | MapAnything (Apache checkpoint), Depth Anything 3 | Apache 2.0 |
| D splat evidence | gsplat (nerfstudio) | Apache 2.0 |
| D part masks | SAM 3 | SAM licence, commercial allowed |
| D landmarks | Custom | Ours |
| F1 template | TapMart canonical templates (commissioned) | Ours |
| F1 fit | Custom on PyTorch3D or Mitsuba 3 | BSD |
| F1 parts | TRELLIS.2 (MIT, 24 GB VRAM), PartCrafter (MIT), Hunyuan3D-Part (community licence, not EU), Tripo mesh segmentation (API), TapMart part library | Mixed, see 19 |
| F1 coarse hint | TRELLIS.2 self hosted, or Hunyuan3D 3.1 API with multi view | MIT or Tencent enterprise terms |
| F1 artist finish | Blender (GPL tool, assets are ours), Quad Remesher (per seat, not SDK) | Ours |
| G validation | Custom renderer on PyTorch3D or Mitsuba 3 | BSD |
| H review tool | Custom web tool (our lab viewer is the seed) | Ours |
| I master and LODs | OpenUSD, Blender, meshoptimizer, gltf-transform, Draco | Apache or BSD |
| J library | Postgres plus object storage | Ours |

Excluded on purpose: nvdiffrast (non-commercial), the original 3D Gaussian
Splatting and 2DGS code (Inria non-commercial), Kaolin's non_commercial
module, VGGT research checkpoint, Meshy or Tripo generation as the geometry
source, marketplace car models (branded models are editorial only).

## 3. Custom TapMart code

Intake and coverage scoring, identification fusion, reference record, the
template format and deformation basis, the multi-view fitter and validation
renderer, part slot management, wheel parametric builder, symmetry logic,
review tool, master export, LOD build, library schema and versioning, ad
surface definitions. Everything in the middle of the pipeline is ours; the
external models are evidence providers.

## 4. GPU stages

MapAnything or DA3 (8 to 16 GB), gsplat (8 GB), SAM 3 (8 GB), TRELLIS.2
(24 GB), PartCrafter (8 GB), the differentiable fit and validation renders
(8 to 16 GB). One L40S 48 GB or A100 80 GB worker covers all of it; Modal or
RunPod serverless at about 1.3 to 2 USD per hour. Identification, review
tool, LOD build and library are CPU.

## 5. Processing time, first vehicle of a generation

Automatic stages: intake 1 min, identification 1 min, evidence 5 to 10 min,
coarse hint 2 min, template fit 10 to 20 min, part candidates 5 min,
validation loop 10 min: about 40 to 60 minutes of GPU wall time. Then artist
finish and review: 4 to 12 hours of a person. Calendar time one to two days.

## 6. Processing time when the generation twin exists

Intake 1 min, identification 1 min, evidence 3 to 5 min, instance fit 2 to
4 min, validation 2 min, LOD build 1 min: 10 to 15 minutes automatic, plus a
2 minute human glance while we are still calibrating the thresholds.

## 7. Cost, first generation

GPU about 1 to 2 USD; APIs (VMMR call, one Hunyuan 3.1 or Rodin generation
as a hint, Tripo segmentation if used) 2 to 5 USD; identification tokens
under 0.5 USD; artist 4 to 12 hours: 200 to 900 USD at freelance rates, less
in house. Budget 300 to 1,000 USD per generation, dominated by the person.
Roughly 2,000 to 3,000 generations cover the cars TapMart will see most.

## 8. Cost, subsequent users of the same generation

GPU 0.3 to 0.5 USD, identification under 0.2 USD, no artist, optional
2 minute review. Under 1 USD compute, under 3 USD with review.

## 9. Data and storage architecture

Postgres (existing): vehicle_generations (make, model, code, years, body
style, facelift, option matrix, dimensions with source), twin_templates
(body style templates, versions), generation_twins (master asset ref, parts,
seams, ad surfaces, validation report, approval), part_library (part class,
generation or generic, asset ref), captures (user, frames, EXIF, quality
report), evidence (cameras, masks, landmarks refs), instance_twins
(generation twin ref, options, colour, wheels, modifications, validation,
LOD refs), reviews (who, what, when). Object storage (Supabase Storage or
S3): originals, keyframes, masks, splat, masters, LODs; content addressed,
immutable versions. Never delete masters.

## 10. Master mesh format

OpenUSD (usdc) as the master: quads preserved, a real hierarchy (vehicle,
body shell, panels, glass, pillars, lights, grille, mirrors, handles,
wheels, tyres, trim, badges), variant sets for options and colours, material
bindings by semantic class, custom attributes for seams and ad surfaces.
Blender file kept as the working source. glTF is the delivery format, not
the master (it has no quads and flattens hierarchy semantics into names).

## 11. Target triangle count for the master

Body shell 400k to 800k quads (0.8 to 1.6M triangles) with creases and
seams modelled, plus wheels 150k to 300k triangles for four, lights and
grille 150k to 300k, mirrors, handles, trim 100k. Master 1.5 to 3M
triangles. Quality first; nothing is decimated at this stage.

## 12. LOD strategy for web and mobile

LOD0 desktop 300 to 500k triangles with 4k normal and 2k material masks
baked from the master; LOD1 tablet 120 to 180k; LOD2 mobile 50 to 80k with
normal maps carrying creases; LOD3 thumbnail 15k. Built with meshoptimizer
simplification per part (seams and silhouettes protected), Draco or meshopt
compression, KTX2 textures. Parts stay separate meshes so semantics, ads and
materials survive at every LOD.

## 13. How semantic components are stored

As geometry: each component is its own prim in USD and its own mesh in the
GLBs, with attributes semantic_class (nine classes for rendering), part_id
(door_front_left and so on), side, symmetry_pair, confidence, evidence
sources, and ad_surface definitions (UV rectangle, size in metres, safe
margin, curvature limit). Labels are never painted onto one surface again.

## 14. Dimension validation

Length, width, height, wheelbase, front and rear track, front and rear
overhang, side glass height from CVS or OEM specs, compared with the fitted
template: tolerance 1 percent on wheelbase and track, 1.5 percent on length,
width and height, 3 percent on glass height. Failures block approval. The
user's capture is also checked for scale drift (LiDAR or wheel diameter from
the tyre label).

## 15. Multi-view reprojection validation

For every keyframe with a registered camera: render silhouette, part id map,
seam map and normals from the model; compare with SAM 3 masks (IoU per part,
target 0.9 body, 0.8 lights and grille, 0.85 wheels), edge chamfer under
3 px at 1264 px, landmark error under 4 px, seam distance under 2 cm; build a
per panel error heat map; refine the worst panels; iterate at most five
rounds. The report is stored and shown in the review tool. Our refinement
lab already holds the registration and overlay parts of this.

## 16. Missing component reconstruction

Per part, in order: symmetry mirror from the opposite side when the part is
symmetric and the other side is confident; the generation part library;
a part generator conditioned on the user's crops, fitted into the slot and
validated by reprojection; the user is asked for a closer photo; the part is
flagged for review. A part is never left melted and never invented silently.

## 17. User modifications

The instance layer records deviations from the generation twin: wheel design
(parametric refit from the side view), spoiler or splitter (part swap or
generator), wrap or colour, facelift mismatch (re-identify), aftermarket
parts (flag, generator, review). Modifications are stored as a diff against
the generation twin, so library improvements propagate.

## 18. Badges and logos

Geometry: the template carries emblem placeholders at the correct positions
and sizes (a plain puck or plate). Artwork: manufacturer logos are trademarks;
naming the make and model in text is nominative use, showing the roundel in
advertising renders is not clearly covered and TurboSquid style marketplaces
mark such models editorial only for that reason. Default: neutral emblem
geometry, brand names in text. Real logo artwork only under a brand licence,
or with counsel's sign off for a specific use. Design rights on the car
shape itself are a separate question: in the EU, since May 2025, virtual
reproductions of registered designs are within design law; in the US trade
dress and design patents apply and the AM General v Activision ruling
protected expressive uses, not advertising. Recommendation: US launch first,
a legal opinion on rendering a customer's own car for that customer's
advertising, and a licensing conversation with the first two or three OEMs
whose cars dominate the fleet.

## 19. Commercial and licensing notes per external component

TRELLIS.2 MIT; PartCrafter MIT; Depth Anything 3 Apache 2.0; MapAnything
Apache checkpoint only; gsplat Apache 2.0; SAM 3 and SAM 3D SAM licence
(commercial allowed, no military); VGGT research weights non-commercial,
commercial checkpoint by application; Hunyuan3D 2.1, 3D-Part community
licences exclude EU, UK, South Korea and cap at 1M MAU; Hunyuan 3.1 API under
Tencent enterprise terms; Rodin, Meshy, Tripo, Hitem3D outputs owned on paid
plans, terms change without notice; nvdiffrast non-commercial; Inria
Gaussian splatting code non-commercial; Quad Remesher per seat, no SDK
without agreement; Blender GPL (tool only); marketplace branded car models
editorial only; OEM press photos copyrighted, reference only; dimension
databases public facts.

## 20. What can be automated

Intake, identification, reference lookup, evidence extraction, instance
fitting, part candidate generation, validation, LOD build, library storage,
ad surface derivation. After the first hundred generations most of the fleet
never touches a person.

## 21. What still needs human review

The first build of every generation (artist finish and approval), any
instance under threshold, aftermarket parts, ambiguous identification, and a
periodic audit sample of automatic passes.

## 22. Realistic accuracy

With the hybrid: dimensions within 1 to 1.5 percent, silhouettes within
3 px at 1264 px in every view, panels and seams in the right place, parts
defined. Not achievable: sub-millimetre surface accuracy, dents, interior,
exact aftermarket parts without review. The visual target is reachable
because the surface quality comes from the template and the artist, not the
capture; the capture decides fit and options.

## 23. Failure conditions that ask for more capture

Coverage sector missing; wheels not seen straight from the side; lights or
grille only seen obliquely; blur or exposure fail; identification ambiguous
between facelifts; scale not recoverable; a part slot without a confident
candidate. The message names the missing view.

## 24. How the library improves over time

Every approved generation twin, part and validated instance is banked; part
library reuse grows across generations of the same brand; templates gain
deformation modes from fitted instances; thresholds are calibrated from
review outcomes; ad surfaces are defined once per generation. The first G80
costs a day; the thousandth costs minutes and cents.

## 25. Exact next prototype

Generation twin of the G80 through the real pipeline, judged against the
green reference, three weeks:
1. Commission one canonical sedan template (quads, named panels, seams,
   part slots, lattice) from a modeller, TapMart owned.
2. Fitter: dimensions plus multi-view fit of the template to our 16 views
   with PyTorch3D, using SAM 3 masks and MapAnything cameras.
3. Part slots: parametric wheels from the side view; lights, grille and
   mirrors from a part generator and the artist.
4. Validation loop and review tool (from the refinement lab's overlays).
5. Artist finish, USD master, LODs, the standard style, the door ad on the
   named door panel, a lab page.
Cost: one artist week plus about 20 USD of GPU and API. Decision at the end:
does it read like the reference from every angle.
