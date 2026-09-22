# The 3D vehicle system

TapMart shows cars as real 3D meshes: a WebGL scene the person can orbit,
zoom and tap, with advertising zones defined on the mesh and creatives
mapped onto the actual body surface. No photographs, no PNG cutouts, no
CSS perspective, no image floating in front of a car. This document is
the reference for the engine, the assets, their licences, and how to add
a vehicle.

## What is real and what is a placeholder

| Part | Status |
| --- | --- |
| Rendering | Real WebGL (three 0.186, React Three Fiber 9, drei 10). One canvas per interactive stage, one hidden renderer for every thumbnail on a page. |
| Orbit, zoom, presets | Real: OrbitControls with damping, no pan, polar limits so the camera never goes under the floor; camera presets tween on the orbit (never through the car). Touch rotate and pinch zoom verified with Playwright. |
| Zones | Real: projector boxes in the vehicle frame (centre, normal, up, size, mesh targets). Selection raycasts the actual mesh and asks which zone contains the hit point. |
| Highlight | Real: DecalGeometry clipped against the body triangles, so the red wash follows the panel. |
| Artwork | Real: a DecalGeometry with the creative as its texture, clipped to the placement box inside the zone. It follows curvature, keeps perspective and stays attached under rotation and zoom. |
| Thumbnails | Real: the same scene rendered once by a shared offscreen renderer and shown as an image. |
| The G80 body | PLACEHOLDER. A sedan generated in code (src/vehicle/engine/sedan.ts) at the G80's outer dimensions. It is not a BMW model and is labelled "Demo vehicle" everywhere it appears. |

## The asset that is still needed

The product's universal demonstration vehicle is a BMW M3 Competition
(G80). No G80 mesh could be obtained in this environment under a licence
TapMart can rely on:

- Sketchfab's download API needs an account token; none is configured, so
  the CC BY models found there could not be fetched (the search API is
  reachable, the download endpoint answers 401).
- No other source offered a G80 with a verifiable licence.

Rather than pretend, the engine ships on a legally clean placeholder mesh
and is built so the licensed GLB drops in without touching the viewer,
the editor or the thumbnails.

Candidates found (verify the licence page yourself before use; all are
Creative Commons Attribution, which allows commercial use and
modification with credit to the creator):

| Model | Creator | Licence | Faces | Link |
| --- | --- | --- | --- | --- |
| BMW M3 (G80) | alex20010804 | CC BY 4.0 | about 103k | https://sketchfab.com/3d-models/bmw-m3-g80-e7d8be35e2f34b7f84e0543fff7fda27 |
| 2021 BMW M3 Competition (G80) | supercarmodels | CC BY 4.0 | about 415k | https://sketchfab.com/3d-models/a9027a26b7ee4da4b564d939b6c27559 |
| Low Poly BMW G80 M3 | sharkycat109 | CC BY 4.0 | about 6.6k | https://sketchfab.com/3d-models/ea3e807ff69e40fe82c5577ee9f0a2f4 |

Two things a person must decide before any of these ships:

1. Attribution. CC BY requires crediting the creator wherever the model is
   shown or in an accessible credits page. The catalog stores this in
   `license.attributionRequired` and `license.creator`.
2. Trade dress. A CC BY licence covers the 3D file, not BMW's design
   rights or trademarks. Showing a recognisable BMW as "TapMart's demo
   vehicle" in marketing is a legal question for TapMart, not a licensing
   question for the file. The catalog keeps the name factual and the
   "Demo vehicle" badge on every stage.

## Adding the licensed G80 (or any vehicle)

1. Export or convert to glTF binary (.glb). Compress with Draco or
   Meshopt (`npx gltf-transform optimize in.glb out.glb --compress draco
   --texture-compress webp`); the loader supports Draco, Meshopt and
   KTX2 out of the box. Aim for under 3 MB and under 150k triangles for
   the interactive stage.
2. Put it under `public/vehicles/<id>.glb`.
3. Add a `VehicleModel` entry in `src/vehicle/catalog.ts`:
   - `asset: { kind: "glb", url: "/vehicles/<id>.glb" }`
   - `transform`: scale, Y rotation and offset that bring the model into
     the vehicle frame (nose along +X, up +Y, driver side +Z, ground at
     y = 0, centred on x = z = 0). Check with the lab page.
   - `bodyMeshes`: the mesh names artwork may project onto. Leave empty
     to accept every mesh whose name is not glass, window, wheel, tyre,
     rim, light, lamp, grille, interior or mirror.
   - `zones`: centre, normal, up and size of each printable panel, in
     metres, plus `meshTargets` so a door decal cannot bleed onto the
     glass. Only list zones that are real surfaces on this body.
   - `cameras`: the five presets, tuned on a wide stage; narrower stages
     pull back automatically (`framePreset`).
   - `license`: source, creator, licence, commercial use, attribution,
     modification, notes.
4. Open `/vehicle-lab`, walk every zone, confirm the highlight sits on the
   panel and the demo creative reads correctly from its preset.
5. Set `demo: true` only for TapMart's demonstration vehicle.

Nothing else changes: the viewer, the editor, thumbnails and every screen
that uses them read the catalog.

## Engine layout

```
src/vehicle/
  catalog.ts                vehicles, zones, cameras, licences, paint map, framing
  placement.ts              Placement type, defaults, clamping, stored form, decal box
  engine/sedan.ts           the placeholder mesh (procedural)
  engine/scene.ts           load a vehicle, studio environment, lights, floor + reflection
  engine/decals.ts          zone frames, highlight and artwork decals, click to zone
  engine/thumbnail.ts       shared offscreen renderer with a cache and a queue
  VehicleScene.tsx          the R3F canvas (client only)
  VehicleViewer.tsx         the stage: lazy mount, loading, fallback, badge, presets
  VehicleThumbnail.tsx      a still of the same scene for cards and lists
  VehicleZoneOverlay.tsx    the zone chooser chips
  VehiclePlacementEditor.tsx  creative, placement, size, position, rotation, preview, save
  vehicle.css               all v3d- styles
```

Placements are stored on campaigns as `details.placement_config` (jsonb,
no migration): `{ zone, artworkUrl, scale, offsetX, offsetY, rotation }`.
`zone` uses the product's existing placement keys (`driver_door`,
`passenger_door`, `driver_rear_door`, `passenger_rear_door`,
`rear_window`, `rear_panel`, `hood`, `full_side`). Wraps (`partial_wrap`,
`full_wrap`) are not surfaces; the 3D system shows them on the full side.

## Performance choices

- The canvas renders on demand: an idle car costs no GPU time.
- Device pixel ratio is capped at 1.5 on the interactive stage.
- The stage mounts only when it scrolls near the viewport.
- Thumbnails share one renderer and are cached per (vehicle, paint,
  placement, preset, size).
- The reflection is the car's own geometry mirrored, faded in a shader:
  no second render pass, no extra memory.
- The environment is a procedural room (PMREM), no HDR download.
- GLB decoders (Draco, Meshopt, KTX2) are wired for the licensed asset.

## Scan and recognition (existing, unchanged by this work)

`src/lib/vehicles/recognition.ts` sends scan photos to a vision model and
returns a structured guess with a confidence; `confirmRecognition` records
the person's confirmation. `reconstruction.ts` stops at `waiting_provider`
because no reconstruction provider is configured. The 3D system does not
claim to reconstruct a person's car: a person's vehicle row keeps its real
year, make, model and colour, and the 3D stage shows the catalog vehicle
with a "3D preview" badge until a matching catalog model exists.
