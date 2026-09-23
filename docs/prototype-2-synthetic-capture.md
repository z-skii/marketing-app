# Prototype 2: controlled synthetic capture to digital twin

CONTROLLED SYNTHETIC CAPTURE TEST. The source views are AI generated
images of one consistent car, not phone photographs. This experiment shows
what two reconstruction providers do with a clean, complete, consistent
capture; it does not prove that a real phone capture behaves the same.

Route: `/labs/twin-compare`. Source views and their provenance:
`docs/captures/ai-g80-controlled/` (README, contact-sheet.jpg,
identification.json).

## Loop

AI generated G80 views (16, Nano Banana) -> blind identification (BMW M3 G80
sedan, 0.90 to 0.99) -> Meshy and Tripo on the same four orthogonal views ->
two real GLB meshes -> normalised for three.js without stretching ->
measured against BMW's press dimensions -> compared side by side -> one
approved driver front door with the Demo Coffee Co. decal on the winner.

## Timeline (UTC, 2026-09-23)

| Step | Time |
| --- | --- |
| Canonical view generated | 04:12 |
| 15 further views, batch | 04:14 to 04:16 |
| 6 regenerations for mirrored or shallow views | 04:18 to 04:19 |
| 2 more regenerations (rear passenger views) | 04:22 |
| Blind identification (12 seconds) | 04:20 |
| Both reconstructions submitted | 04:23:31 |
| Tripo GLB ready | 04:27:37 (4 min 6 s) |
| Meshy GLB ready | 04:31:20 (7 min 49 s) |

## Providers, blind

Both providers received views 01 (front), 04 (straight driver side), 07
(rear) and 10 (straight passenger side), the original PNGs at 2528 x 1696,
no cutouts, in that order. Tripo's slots are front, left, back, right.
Neither run saw the other. Settings and raw outputs:

| | Model A: Meshy | Model B: Tripo |
| --- | --- | --- |
| Endpoint | multi image to 3D, texture and PBR on, 300k target, triangle, symmetry on | H3.1 multiview to 3D, texture and PBR on, detailed geometry and texture |
| Credits | 30 | 18 |
| Time | 7 min 49 s | 4 min 6 s |
| Raw output | GLB, 1 mesh, 308,192 triangles, 376,141 vertices, 4 textures 2048 px (base colour JPEG, normal PNG, metallic roughness JPEG, emissive JPEG), 28.5 MB | GLB, 1 mesh, 1,911,614 triangles, 1,024,451 vertices, 3 textures 4096 px JPEG (colour, ORM, normal), 58.2 MB |
| Raw file kept | scratchpad syn/recon/meshy-raw.glb | scratchpad syn/recon/tripo-raw.glb |
| Web file | syn-g80-meshy.glb 3.62 MB, Draco, WebP 2048, same triangle count | syn-g80-tripo.glb 2.20 MB, Draco, WebP 2048, simplified to 477,892 triangles |

Normalisation: the viewer turns the longest horizontal axis to the nose
axis (both meshes came nose backwards, so both get a 180 degree turn), puts
the lowest point on the ground, centres the car and scales it uniformly to
4,794 mm. No axis is stretched.

## Measurements (measure.mjs on the raw files, before any optimisation)

Real: length 4,794, width over mirrors 2,067, height 1,433, wheelbase 2,857
mm (BMW Group press sheet T0316649EN; mirrors from ultimatespecs.com).

| Ratio | Real | A Meshy | B Tripo |
| --- | --- | --- | --- |
| Length to width | 2.319 | 2.393 (3.2 percent, PASS) | 2.242 (3.3 percent, PASS) |
| Length to height | 3.345 | 3.313 (1.0 percent, PASS) | 3.035 (9.3 percent, FAIL) |
| Wheelbase to length | 0.596 | 0.606 (1.6 percent, PASS) | 0.592 (0.7 percent, PASS) |
| Width to height | 1.442 | 1.385 (4.0 percent, PASS) | 1.354 (6.1 percent, REVIEW) |
| At 4,794 mm: width, height, wheelbase | 2,067 / 1,433 / 2,857 | 2,004 / 1,447 / 2,904 | 2,138 / 1,580 / 2,836 |
| Score | | 0.733 | 0.555 |

The wheelbase is measured from the two clusters of vertices in the lowest
10 percent of the height; both meshes gave a reliable pair. Compared with
the first experiment (Tripo 0.011, Meshy 0.691 from car park photos
without a straight side), the straight sides fixed Tripo's length and
wheelbase entirely and moved Meshy's height error from 6 percent to 1.

## Visual comparison

Model A (Meshy): the silhouette, roof line, hood length, overhangs and wheel
placement read as a G80 from every angle. Kidney grille, headlights, hood
crease, four doors, rear shoulders, tail lights, trunk lip, diffuser and quad
exhausts are all present and in proportion. Surfaces are smooth with mild
ripples on the doors. The paint came out near black rather than graphite,
the grille bars are painted into the texture, and the wheels are part of the
body surface.

Model B (Tripo): far more surface detail (mirrors, gills, light interiors),
correct length and wheelbase, but 10 percent too tall, and the body is
crumpled: dented doors, wavy rockers and wheel arches, a warped hood and
trunk, seams that wander. From the rear three quarter it is still an M3;
from the side it looks damaged.

Winner: A, on geometry. Every ratio passes, the door surfaces are smooth
enough for a decal, and the rear and front fascias are in the right place.
B's detail does not compensate for a failed height ratio and dented doors.

## Approved surface

One surface on Model A only: the driver front door, a projector box placed
by hand on the fitted mesh (same fraction box the sedan lab uses). The Demo
Coffee Co. creative is projected with THREE.DecalGeometry onto the
generated door triangles; AD ON and AD OFF toggle it so the underlying
geometry can be inspected. Verified in screenshots: the decal follows the
door, keeps perspective, stays attached under rotation and zoom.

## Credits used in this experiment

48 for 24 image generations, 30 Meshy, 18 Tripo: 96 credits from the
existing plan (821.5 before, 725.5 after). No new key or purchase.
