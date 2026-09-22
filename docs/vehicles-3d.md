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
| The G80 body | PLACEHOLDER. Two stand-ins exist: a sedan generated in code (src/vehicle/engine/sedan.ts) and, for the placement lab, a real GLB of a generic sports sedan generated for TapMart (public/vehicles/tapmart-temp-sedan.glb, see below). Neither is a BMW model; both are labelled on screen. |

## The temporary engineering mesh (the placement lab)

`/labs/vehicle-placement` runs on `public/vehicles/tapmart-temp-sedan.glb`:

| Fact | Value |
| --- | --- |
| What | A generic four door sports sedan, no make or model, generated from a text prompt on 2026-09-22 |
| How | Tripo text to 3D (`tripo_3d`, detailed geometry and textures, PBR) through TapMart's Higgsfield account, then optimised with glTF-Transform 4.5 (weld, simplify, Draco geometry, WebP textures at 2048 px) |
| Cost | About 33 Higgsfield credits in total, including a second candidate that was rejected |
| Rights | TapMart's own generated asset under the Higgsfield terms of service; commercial use and modification allowed, no attribution required |
| Geometry | 1 mesh, 138,455 triangles (284,227 before simplification), position, normal and one UV set |
| Textures | 3 WebP at 2048 x 2048: base colour, occlusion roughness metallic, normal |
| File | 1,000,016 bytes |
| Fitting | `autoFit`: the longest horizontal axis becomes the length along +X, scaled to 4.794 m, centred, on the ground; zones are given as fractions of the fitted body and resolved after load |
| Zones | Driver front door, driver rear door, passenger front door, passenger rear door, hood, trunk lid. The rear window and quarters are not offered because the single mesh has no separate glass or panel boundaries to validate them against. |
| Known artefacts | A generic emblem on the grille and boot from the generation; door seams and handles are baked into the texture, so a decal placed across a seam follows the surface, not the seam |

A second candidate from Hunyuan3D 3.1 (47 MB, 300k triangles) was rejected
without use: it came out as a recognisable BMW M3 replica, which is exactly
the faked G80 the brief rules out. Its file was deleted.

## The G80 chosen for the lab (prototype only)

mo chose "BMW M3 (G80)" by alex20010804 on Sketchfab (CC BY 4.0) for the
private placement lab. The catalog entry `bmw-m3-g80-alex` records the
credit the licence requires, printed on the lab page as:
"BMW M3 (G80)" by alex20010804 on Sketchfab, licensed CC BY 4.0, with links
to the model, the author and the licence. The entry is marked
commercialUse: false on purpose: the CC BY grant covers the file, not
BMW's design rights or trademarks, so the asset is not endorsed by BMW and
not cleared for production or commercial use. Only the four doors are
offered as zones until they are exact on the mesh.

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

### Market research, 2026-09-22

The important fact first: BMW Group does not license its cars to the 3D
marketplaces. BMW sued TurboSquid in 2016 and the marketplaces removed
BMW models from sale; CGTrader's forum states BMW models are forbidden;
Squir's own G80 product page carries the notice that BMW refuses to grant
a licence to sell BMW, Mini and Rolls-Royce models. So a purchasable G80
with a commercial licence does not exist on the mainstream stores. What
exists is: (a) community uploads on Sketchfab under CC BY, where the
uploader's own rights and the model's origin cannot be verified, (b)
Sketchfab Store items under the Editorial licence, which forbids
commercial use, (c) subscription libraries such as BlenderKit, whose
royalty free terms cover the file but not BMW's design rights.

Candidates checked (numbers from the Sketchfab API and the product pages):

| Model | Source | Licence | Faces | Materials, textures | Notes |
| --- | --- | --- | --- | --- | --- |
| BMW M3 (G80), alex20010804 | https://sketchfab.com/3d-models/bmw-m3-g80-e7d8be35e2f34b7f84e0543fff7fda27 | CC BY 4.0, free, downloadable | 102,676 | 11 materials, 3 textures | "Low poly, no interior, no BMW logos". The most web ready of the free set. |
| 2021 BMW M3 Competition (G80), supercarmodels | https://sketchfab.com/3d-models/2021-bmw-m3-competition-g80-a9027a26b7ee4da4b564d939b6c27559 | CC BY 4.0, free, downloadable | 415,715 | 100 materials, 121 textures | No description; the material count suggests many separate parts, typical of a game export. Origin unknown. |
| BMW M3 Competition G80, SLBofficial | https://sketchfab.com/3d-models/bmw-m3-competition-g80-0550ac4d2a3846b3bb75370eb8ef84c1 | CC BY 4.0, free, downloadable | 1,630,102 | 30 materials, 2 textures | Highest detail; needs heavy decimation for the web. Origin unknown. |
| BMW M3 Competition G80 2021, SQUIR3D | https://sketchfab.com/3d-models/bmw-m3-competition-g80-2021-a4ae8be4670a4ee48c4ba85fbabeb02d and https://squir.com/bmw-m3-competition-g80-2021.html | Editorial on Sketchfab (no commercial use); squir.com lists 129 EUR with the BMW licence notice | 1,415,498 (700k polygons on squir.com) | professional, interior included | Formats 3ds, c4d, fbx, lwo, max, obj, ma; no GLB. |
| BMW M3 Competition G80, Zifir3D on BlenderKit | https://www.blendkit.com/asset-gallery-detail/291ec023-52c0-48f5-aaf5-cf4964c76ad3/ | Royalty free under the paid Full Plan | 320,270 | Cycles and Eevee materials | Blender file, export to GLB needed. |
| Mid Poly BMW G80 M3 With Interior, FANNEC | https://sketchfab.com/3d-models/mid-poly-bmw-g80-m3-with-interior-c2cf67f9f000420c89a2e593dee1eef5 | Store listing, price and licence not shown to a signed out visitor | 34,740 | game ready, LODs | Openable doors and trunk, separate wheels and lights: the right structure for placement zones, low detail. |
| BMW M3 G80 2025, Golden-Models | https://sketchfab.com/3d-models/bmw-m3-g80-2025-bb30c32dc0624ca89bd865aed5214ca3 | CC BY 4.0, free | 658,311 | 100 materials, 69 textures | The 2025 facelift (different lights), not the 2021 car. |

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

The engine also supports `keepMaterials` (a single textured mesh keeps its
own PBR materials instead of being repainted) and `autoFit` (see the table
above), so a licensed G80 export with named panels and a generated stand-in
load through the same path.

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
