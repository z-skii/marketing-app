# AI 3D test: BMW M3 Competition G80 from reference photographs

Route: `/labs/ai-g80` (isolated, no database, no account, `?v=<candidate>` shows
the other providers' results). Question asked: can a reference based
reconstruction produce a car that a person recognises as an M3 Competition G80,
with body surfaces clean enough for TapMart to project an advertisement onto?

Everything below is measured or observed. Nothing is a downloaded BMW mesh.

## References used

Photographs: one Alpine White BMW M3 Competition (G80) photographed in a car
park by Damian B Oh, published on Wikimedia Commons under CC BY-SA 4.0 as the
17 image series "BMW G80 M3 Competition Alpine White (1) to (17)". Four of them
were sent to the reconstruction models:

| Photo | View | Commons file |
| --- | --- | --- |
| 10 | Front, straight on | https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(10).jpg |
| 8 | Front three quarter, passenger side | https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(8).jpg |
| 12 | Rear three quarter, passenger side | https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(12).jpg |
| 14 | Rear three quarter, driver side | https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(14).jpg |
| 17 | Rear, straight on | https://commons.wikimedia.org/wiki/File:BMW_G80_M3_Competition_Alpine_White_(17).jpg |

The series has no straight side view, and the car sits between other cars
under garage lighting. That is a realistic customer capture, not a studio one.
The images were imported into TapMart's Higgsfield account by URL; no image
was edited. (Five background cutouts were queued first, but they were still waiting
when the reconstructions were submitted, so every model received the original
photographs with the car park in them.)

Dimensions (BMW M3 Competition G80, 2021 to 2024): length 4,794 mm, width
1,903 mm (2,067 mm over mirrors), height 1,433 mm, wheelbase 2,857 mm, track
1,617 / 1,605 mm. Sources: ultimatespecs.com/car-specs/BMW/123190 and
encycarpedia.com (BMW M3 Competition G80 sedan). The catalog entry uses these
to scale the mesh to real size and to check proportions.

## Reconstruction runs (2026-09-23, through TapMart's Higgsfield account)

All three ran at once, submitted 02:20 UTC.

| Candidate | Model | Inputs (order) | Output | Done | Credits |
| --- | --- | --- | --- | --- | --- |
| ai-g80-tripo | Tripo H3.1 multiview to 3D, detailed geometry and texture, PBR | 10, 14, 17, 8 (front, left, back, right slots) | GLB, 1 mesh, 1,900,141 triangles, 3 JPEG textures 4096 px, 57.8 MB | 02:25 (about 5 min) | 18 |
| ai-g80-meshy | Meshy multi image to 3D, texture + PBR, 200k target, symmetry on | 8, 12, 14, 17 | GLB, 1 mesh, 206,616 triangles, 4 textures 2048 px (base, normal, metallic roughness, emissive), 20.2 MB | 02:25 (about 5 min) | 30 |
| ai-g80-hunyuan | Hunyuan3D v3 image to 3D with multiple views, PBR, 300k faces | 10, 17, 14, 12 | GLB, 1 mesh, 299,800 triangles, 3 PNG textures 4096 px, 35.8 MB | 02:23 (about 3 min) | 23 |

Round two, submitted 02:44 UTC, after the background cutouts had arrived
(the cutout of photo 14 failed, so its original was used):

| Candidate | Model | Inputs | Output | Done | Credits |
| --- | --- | --- | --- | --- | --- |
| ai-g80-tripo1 | Tripo H3.1 image to 3D, detailed geometry and texture, PBR | cutout of 8 only | GLB, 1 mesh, 1,883,593 triangles, 3 JPEG textures 4096 px, 56.2 MB | 02:48 (about 4 min) | 18 |
| ai-g80-hunyuan2 | Hunyuan3D v3 image to 3D with multiple views, PBR, 300k faces | cutouts of 10, 17, 12 and the original 14 | GLB, 1 mesh, 300,000 triangles, 3 PNG textures 4096 px, 31.7 MB | 02:48 (about 4 min) | 23 |

Web files were made with gltf-transform 4.5 (Draco geometry, WebP textures at
2048 px; the Tripo mesh simplified to 475,008 triangles):
ai-g80-tripo.glb 2.16 MB, ai-g80-meshy.glb 2.47 MB, ai-g80-hunyuan.glb 1.37 MB.
Every candidate has positions, normals and one UV set, one material, no
separate parts: wheels, glass, lights and body are one surface.

## Proportions against the real car

Bounding box of each raw mesh, scaled so the length is 4,794 mm:

| Candidate | Length / width | Length / height | Width at 4,794 mm | Height at 4,794 mm |
| --- | --- | --- | --- | --- |
| Real G80 | 2.52 (2.32 over mirrors) | 3.35 | 1,903 (2,067 over mirrors) | 1,433 |
| Tripo | 1.85 | 2.38 | 2,588 | 2,013 |
| Meshy | 2.34 | 3.17 | 2,047 | 1,513 |
| Hunyuan | 1.93 | 2.43 | 2,485 | 1,969 |
| Tripo, one cutout (round two) | 2.30 | 2.84 | 2,087 | 1,686 |
| Hunyuan, cutouts (round two) | 1.88 | 2.48 | 2,543 | 1,932 |

Meshy is within 1 percent of the real width over mirrors and 6 percent tall.
The round one Tripo and Hunyuan meshes are about 25 percent too short for
their width and height: the three quarter photographs in their "side" slots
read as a shorter car, and scaling them to the real length makes them 2.5 m
wide. Tripo from a single clean cutout gets the width right (1 percent) and is
18 percent too tall. Hunyuan stays short with clean cutouts too, so for
Hunyuan the cause is the missing true side view, not the background.

## What is on /labs/ai-g80

The default is the round one Tripo multiview mesh: the most detailed of the
five, with both ends true to the photographs. `?v=ai-g80-meshy` and
`?v=ai-g80-hunyuan2` show the other two kept for comparison; the round one
Hunyuan mesh and the single photo Tripo mesh were measured and then dropped
from the repository (their numbers are above). The page is a dark studio, the
car nearly edge to edge, drag to orbit, pinch or scroll to zoom, four view
chips, a "Test ad on driver door" toggle and a facts sheet with everything in
this document. Screenshots: desktop 1440 and phone 390 through Playwright
(software WebGL); no console errors on either.

## Visual comparison against the photographs (default mesh)

Accurate:

- Front: vertical kidney grille, slim headlights, three part lower bumper and
  splitter. A person who knows the car reads "M3 G80" at once.
- Rear: light shape, diffuser and four exhaust tips match.
- Details the photographs showed: fender gills, M mirrors, spoiler lip, wheel
  design, red calipers, roof panel.
- Stance from the front and rear three quarter views.

Wrong or invented:

- Proportions: about 25 percent too short for its width and height. The side
  view shows a tall, short sedan with a short wheelbase. This is the biggest
  error and it comes from the inputs: no straight side view, and three quarter
  photographs in the model's left and right slots.
- Side surfaces: glass and door areas are wrinkled; door shut lines are faint
  and partly invented; the panoramic roof edge is smeared.
- Hood and roof carry texture noise from the car park lighting.
- Wheels are part of the body surface, not separate parts; tyres are thin in
  places.
- Meshy: right proportions, muddy surfaces and textures, a dark blob where the
  fender gill should be. Hunyuan3D: the cleanest surfaces and the best front
  and rear, but a two door side with no door lines, and also too short.

## Test ad

One zone, the driver front door, placed by hand as a fraction box on the
fitted mesh (the same driver_door box the sedan lab uses). The Demo Coffee Co.
creative is projected with THREE.DecalGeometry onto the generated triangles
inside that box, so it follows the surface and stays attached under rotation
and zoom (verified in screenshots: driver view, two drags, one zoom). The
generated door accepts the decal; the noisy window edge above it does not
matter because the box stops below it.

## Credits and time

Five generations and five cutouts used 116 Higgsfield credits from the
account's existing Plus plan (967.5 before, 851.5 after). Each generation took
3 to 5 minutes. No new key, account or purchase was needed; the direct Tripo
API would price the same multiview job at 30 credits, 1 credit = 0.01 USD.

## Assessment for the scan to digital twin idea

Recognisable, yes. Every provider produced an M3 Competition G80 that a person
would name from the front and rear three quarter views, from four phone
photographs in a car park, in five minutes, for well under a dollar. That part
of the idea works.

Good enough for placing advertisements, not yet:

1. Proportions are not trustworthy without a straight side view. Two of the
   three providers built a car a quarter too short, and a customer's own
   photographs will be no better than these. The capture flow must require
   true side views (and ideally a known dimension) and the pipeline must check
   the bounding box against catalog dimensions and reject a mesh that misses
   by more than a few percent.
2. Surfaces are one blob. No provider returns separate panels, so door, hood
   and quarter panel zones stay hand placed boxes on a fitted mesh, exactly as
   in the placement lab. That works for a decal, but "the ad cannot leave the
   door" depends on the box, not on real door geometry.
3. Unseen surfaces are invented. Anything the photographs did not show (the
   far side, the roof, the underside) is a guess, sometimes a wrong one. A
   digital twin library that reuses a validated mesh per make, model and
   generation is therefore the right shape: reconstruct once from a complete
   capture, validate by a person, reuse for every customer with that car.
4. The best surfaces and the best proportions came from different providers,
   so a real pipeline needs the provider abstraction and a measurable selection
   step, not one fixed provider.
5. Rights: a mesh that reproduces a BMW design is still a BMW design. The
   photo licence and the generation terms do not clear commercial use.

Recommendation: keep the idea, change the inputs. The next experiment should
be one controlled capture of a real car with eight true angles including both
straight sides, run through Tripo multiview and Hunyuan3D with cutouts, and a
pass or fail on proportions before anything is shown to a customer.
