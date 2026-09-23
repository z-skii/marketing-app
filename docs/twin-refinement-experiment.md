# Twin refinement experiment: source views to semantic twin

Lab: `/labs/twin-refinement` (branch `claude/install-design-dev-skills-u6bo6j`,
preview alias `marketing-app-git-claude-install-design-e46ce2-z-skiis-projects.vercel.app`).
Follows `docs/twin-cleanup-experiment.md`. CONTROLLED SYNTHETIC CAPTURE TEST: the
sixteen source views are AI generated images of one consistent car, not photographs.

## Question

Can the cleaned Meshy reconstruction be pushed to TapMart's visual quality by
projecting semantic information from the original sixteen source views onto the
mesh, without a new reconstruction, without replacement geometry and without a
handcrafted per car parts library?

## Inputs

- Geometry: the cleaned twin of the previous experiment (welded, hole filled,
  Taubin smoothed): 308,200 triangles, 152,184 vertices after welding the seven
  region meshes back into one surface. Nothing else. No Meshy or Tripo credits
  were spent; the Higgsfield balance is unchanged at 725.5.
- Images: the sixteen source views in `docs/captures/ai-g80-controlled/`
  (2528 x 1696), used at 1264 x 848.
- Trusted dimensions: BMW press sheet T0316649EN (4794 x 1903 x 1433 mm,
  wheelbase 2857, width over mirrors 2067).

## Pipeline

```
SOURCE IMAGES -> PART SEGMENTATION -> CAMERA REGISTRATION -> PROJECT MASKS -> MULTI VIEW VOTES -> SEMANTIC SURFACE MAP
                                                                              -> PANEL LINE POINTS -> _SEAMP shader lines
                                                                              -> SOURCE APPEARANCE -> wheels, lights, grille, trim colour
                                              CURVATURE AWARE SMOOTHING (paint only) -> MEASURE AGAIN -> REFINED GLB + SEMANTIC GLB
```

### 1. Part segmentation (what worked)

Each view was annotated by TapMart's vision model (gpt-5.5 through the existing
OpenAI client, `route("minor_qa")`, medium effort) on a grid labelled copy of the
image (cyan lines every 100 px). The model returns polygons in pixel coordinates
for: windshield, rear glass, each side window and quarter glass, headlights,
taillights, kidney grille, lower intakes, mirrors, door handles, rocker trim,
splitter, diffuser, carbon roof, gills, exhaust tips, badges, and every painted
panel (hood, trunk lid, roof panel, bumpers, fenders, doors, rear quarters,
pillars, spoiler lip); wheels as circles. About 30 regions per view, 60 to 115
seconds each. The polygons are rasterised into a class map and a panel map.

What did not work first: the elevated views labelled the whole roof as
windshield. A second pass for views 13 to 16 with explicit roof and rear glass
guidance fixed it. Wheel circles from the model were 20 to 30 px off, so wheels
and tyres keep their geometry classes (the four wheel components, rim versus
tyre by radius) and image wheel votes on body triangles are treated as arch
paint. Accuracy of the polygon edges is roughly 10 px at 1264 px, about 4 cm on
the car.

Alternatives considered: Higgsfield background removal and SAM style tools
(credits, and no part labels), classical colour segmentation (the car is dark
graphite with bright reflections, so glass, paint and roof are not separable by
colour), and silhouette only (no parts at all).

### 2. Camera registration (what worked)

Known capture angle as the start (azimuth from the view name, elevation 2.5 or
12 degrees), then automatic refinement of azimuth, elevation, distance, target
shift (two axes) and vertical fov by coordinate descent. Objective: a one
directional chamfer distance from the rendered mesh outline to the image edge
map, plus the silhouette IoU against the union of all vision polygons (the whole
car), plus a bounding box term. Straight views may only move 5 degrees in
azimuth (their wheels are perfect circles, so they were generated straight);
three quarter views 20 degrees; elevated views keep an elevation between 8 and
22 degrees. Coarse search uses a vertex splat (fast), the final search a real
triangle rasteriser. 2.5 minutes for sixteen views.

What did not work first: a leaky background silhouette (the bright hood and roof
reflections merged with the studio wall), a dark pixel prior (collapsed the rear
view onto the lower half of the car), and an unconstrained azimuth (the straight
side view settled 25 degrees off with the same outline error).

| View | Outline error (px at 632 wide) | Silhouette IoU | Azimuth | Elevation |
| --- | --- | --- | --- | --- |
| 01 straight front | 0.47 | 0.894 | 0.5 | 7.6 |
| 02 front driver 3/4 | 1.26 | 0.845 | 39.8 | 2.2 |
| 03 front driver intermediate | 1.55 | 0.827 | 40.0 | 1.9 |
| 04 straight driver side | 0.75 | 0.842 | 89.0 | 8.1 |
| 05 rear driver intermediate | 1.01 | 0.858 | 119.3 | 3.4 |
| 06 rear driver 3/4 | 1.25 | 0.857 | 136.3 | 1.2 |
| 07 straight rear | 0.40 | 0.895 | 180.0 | 9.0 |
| 08 rear passenger 3/4 | 1.16 | 0.840 | 229.0 | 1.0 |
| 09 rear passenger intermediate | 1.33 | 0.814 | 232.0 | 5.5 |
| 10 straight passenger side | 0.73 | 0.853 | 271.8 | 8.6 |
| 11 front passenger intermediate | 1.68 | 0.861 | 313.5 | 8.2 |
| 12 front passenger 3/4 | 0.97 | 0.842 | 317.3 | 3.9 |
| 13 elevated front driver 3/4 | 1.28 | 0.889 | 45.0 | 19.0 |
| 14 elevated rear driver 3/4 | 3.65 | 0.869 | 137.3 | 15.6 |
| 15 elevated rear passenger 3/4 | 3.91 | 0.897 | 221.3 | 12.3 |
| 16 elevated front passenger 3/4 | 1.14 | 0.876 | 322.0 | 16.5 |

Mean outline error 1.41 px at 632 px wide (about 5.6 px at full resolution, about
2.5 cm on the car). Views 14 and 15 are the weakest. The SOURCE OVERLAY toggle in
the lab shows every registration: the render is locked to the registered camera
and the source view is laid over it.

### 3. Projection and voting

Every triangle centroid is projected into every registered view. Where it passes
the z buffer (2 percent tolerance) it takes the class under it, weighted by the
absolute facing cosine (the reconstruction's winding is not consistent) and by
1.2 for the four straight views. Labels are the vote winner, confidence the
winner's share of the triangle's total weight. Two majority passes on the
triangle adjacency graph, then islands under 80 triangles absorb the surrounding
label. Triangles that no view reaches (127,273 of 308,200: underbody, wheel
wells, interior shells) fall back to paint or trim by height with confidence 0.

### 4. Curvature aware smoothing

Ten Taubin passes (0.5 / -0.53) on 36,544 vertices whose whole one ring is
BODY_PAINT, at least 3.5 cm from a panel line, with a curvature proxy under 0.55
(uniform Laplacian over mean edge length plus the normal spread of the incident
triangles). Grille, lights, glass boundaries, arches, creases, mirrors and wheels
are never touched. The extreme vertex on every axis is pinned and nothing is
scaled, so the bounding box is identical before and after: 4.794 x 1.446 x
2.001 m.

### 5. Panel lines without cutting the mesh

Boundaries between adjacent painted panels in each view's panel map (panels grown
3 px to close polygon gaps) are unprojected through the z buffer into 3D points
on the mesh: 25,502 points from sixteen views. Each vertex takes the nearest
point from the two views that see it most head on (facing 0.5 or more) within
35 cm and stores it as a `_SEAMP` attribute; the paint shader measures the
fragment's distance to the interpolated point and draws a darker, rougher groove
under 1 cm (metalness and final colour reduced along the line). Inside a
triangle whose vertices all point at the same straight line the interpolated
point is the fragment's own foot on the line, so the distance is exact even
though flat panels are triangulated at 10 to 25 cm.

What did not work first: a per vertex scalar distance (invisible: the vertices
are far coarser than a 1 cm line), and taking the minimum over all sixteen views
(a web of cracks: every view's polygon error accumulated).

### 6. Materials

- Paint: MeshPhysicalMaterial from the GLB, base 0.034/0.036/0.040, metalness
  0.42, roughness 0.40, clearcoat 1.0 (clearcoat roughness 0.08); the shader adds
  a hashed world position flake to roughness and normal.
- Glass: tinted, alpha 0.9, ior 1.5. The pillars are no longer glass: the
  projection only marks the panes the polygons covered.
- Headlights and taillights: their own meshes and materials (clearcoat, faint
  emissive) with the source view appearance projected as vertex colour.
- Grille, wheels, tyres, trim: source appearance as vertex colour on their own
  materials; wheels get two extra normal smoothing passes.
- Colour space: source pixels and class colours are sRGB and are converted to
  linear before they are stored in COLOR_0.

### 7. Ad decal

The front left door triangles (panel vote door_front_left, 7,515 triangles) are
exported as their own mesh `body_door_fl`, and the driver_door zone's
`meshTargets` names only that mesh, so THREE.DecalGeometry cannot reach glass,
the arch, the sill trim or the neighbouring panels.

## Measurements

| | Before (cleaned twin) | After (refined) |
| --- | --- | --- |
| Validation score | 0.785 | 0.785 |
| Length to width (real 2.319) | 2.395, error 3.3% | 2.395, error 3.3% |
| Length to height (real 3.345) | 3.314, error 0.9% | 3.314, error 0.9% |
| Wheelbase to length (real 0.596) | 0.598, error 0.4% | 0.598, error 0.4% |
| Width to height (real 1.442) | 1.384, error 4.1% | 1.384, error 4.1% |
| Bounding box | 4.794 x 1.446 x 2.001 m | 4.794 x 1.446 x 2.001 m |
| Triangles | 308,200 | 308,200 (body 215,509, door 7,515, glass 18,075, headlights 2,292, taillights 1,248, grille 9,319, wheels 23,131, tyres 19,464, trim 10,438, mirrors 1,209) |
| Regions | 7 rule based | 9 semantic classes, 10 meshes |
| File | 893 KB | 1.41 MB (Draco; carries COLOR_0, _SEAM, _SEAMP, _CONF), semantic map 750 KB |

Confidence per region (mean winner share, share of triangles at 60% or more,
share under 35%, mean views that saw a triangle):

| Region | Triangles | Mean confidence | Confident | Uncertain | Views |
| --- | --- | --- | --- | --- | --- |
| BODY_PAINT | 223,024 | 0.32 | 29% | 62% | 1.9 |
| GLASS | 18,075 | 0.64 | 56% | 13% | 6.0 |
| HEADLIGHT | 2,292 | 0.59 | 39% | 15% | 3.8 |
| TAILLIGHT | 1,248 | 0.63 | 50% | 9% | 4.3 |
| GRILLE | 9,319 | 0.67 | 58% | 14% | 5.8 |
| WHEEL | 23,131 | 1.00 | 100% | 0% | 5.4 |
| TIRE | 19,464 | 1.00 | 100% | 0% | 3.0 |
| TRIM | 10,438 | 0.43 | 21% | 39% | 4.8 |
| MIRROR | 1,209 | 0.53 | 33% | 14% | 6.8 |

Of the 179,680 triangles that at least one view sees, 69% are confidently
classified and 12% are uncertain. Over all 308,200 triangles (including the
127,273 hidden ones) 41% confident, 47% uncertain. Body paint confidence is low
because those triangles are small and mostly seen by one or two views; the
class is right where it matters (the semantic map shows it), the number is
honest about how thin the evidence per triangle is.

## What improved, what did not

- Lights: yes. Headlights and taillights are their own regions with the source
  appearance; the clean twin had 403 light triangles found by colour rules, the
  refined twin has 3,540 from the images.
- Windows: yes. Glass is only where the panes are; the A, B and C pillars are
  paint or carbon. Gaps remain where a view's polygon missed a pane (the driver
  side rear quarter glass in view 04).
- Grille: yes. 9,319 triangles with the projected mesh pattern instead of a
  flat dark box; the lower intakes are included.
- Wheels: material split (rim, tyre), smoother normals and the projected spoke
  pattern make them read as wheels with spokes. They are still solid discs; the
  silhouette did not change and cannot without new geometry. Acceptable for a
  hero shot, not for a close up.
- Panel lines: present at the door edges, hood and trunk, but dashed and a few
  centimetres off. Coarse polygons and coarse triangulation, not the method.
- Door ad: works; the decal is confined to the door mesh.
- Dimensions: unchanged to the millimetre; no scaling of any kind.
- Surface: the door skin ripples and trunk edge lumps are still there. The
  smoothing is restricted to keep dimensions and creases, so it cannot remove
  defects of that size.

## Screenshots

`docs/captures/twin-refinement/`: `before-refined.jpg` (BEFORE and REFINED, hero
and driver views), `semantic-overlay.jpg` (semantic map and source overlay),
`phone.jpg` (390 wide), `seg-qa-sheet.jpg` (all sixteen segmentations over the
grid images), `registration-sheet.jpg` (rendered outline over every view),
`segmentation/NN.json` (the model's polygons), `cameras.json` (registered
cameras), `pipeline-report.json` (every measured number) and the pipeline
scripts as `.txt`.

## Decision: can this scale across many models without a per car library?

Partly. The chain source views -> part polygons -> registered cameras -> voted
semantic map -> materials, panel lines and a confined decal is automatic end to
end and used nothing specific to a BMW. It gets a reconstruction from "one grey
blob with rule based regions" to "a car with glass, lights, grille, wheels and
panel lines in the right places". It does not get to a configurator grade twin
on its own, and the remaining problems split like this:

- A, automatically solvable now: polygon accuracy (a mask model instead of
  polygons, or a local edge snap of the polygon edges), the registration of the
  two weak elevated views (more starts, a second refinement on the class edges),
  hidden triangle fallback (a proper inside/outside test), dashed panel lines
  (bake the lines into a texture or a decal strip instead of per vertex points),
  confidence display (per view agreement instead of winner share).
- B, better models: the surface ripples, trunk lumps, solid wheels and blobby
  mirrors are reconstruction quality; a better image to 3D model or a mesh
  refinement model fixes them, not projection.
- C, generation specific template: light interiors, wheel spokes as geometry,
  door handles, gills and badges. These need a template per generation (G80
  sedan) or a parts library; projection can place them but cannot invent them.
- D, human review: the class boundaries and panel line placement are good enough
  for a marketing hero, but a person must confirm the ad surface and the
  silhouette per car before anything goes live. The lab's semantic map and
  source overlay are exactly the review tools.
- E, fundamentally missing from this approach: interior, underbody, anything the
  source views do not show, and true panel geometry (gaps, shut lines) which no
  amount of projection creates.

Recommendation: the projection layer is worth keeping as the automatic step
between reconstruction and review. Quality across many models will be decided
by B (the reconstruction) and C (a small set of generation templates for the
parts that projection cannot create), not by more projection work.
