# TapMart Standard style experiment

Lab: `/labs/twin-style` (branch `claude/install-design-dev-skills-u6bo6j`, preview
alias `marketing-app-git-claude-install-design-e46ce2-z-skiis-projects.vercel.app`).
Follows `docs/twin-refinement-experiment.md`. CONTROLLED SYNTHETIC CAPTURE TEST:
the test asset is the G80 reconstructed from sixteen AI generated views.

## Question

Before paying for another AI stage (Hunyuan3D Paint, Meshy Retexture), does a
standardised TapMart rendering style on the existing refined geometry and its
semantic regions solve enough of the visual problem?

## What changed and what did not

- Geometry: `public/vehicles/syn-g80-meshy-refined.glb`, byte for byte the same
  file as the refinement lab. No regeneration, reconstruction or retexture. Zero
  credits spent (Higgsfield balance still 725.5).
- Semantic regions: the ten meshes of that file (body, body_door_fl, mirrors,
  glass, headlights, taillights, grille, wheels, tyres, trim), as classified by
  the source view projection.
- New: a style layer (`src/vehicle/style/standard.ts`) that maps meshes to nine
  semantic classes and replaces every material; a TapMart studio light rig; a
  quieter floor (larger contact shadow, 4.5 percent reflection); a customer
  facing lab screen.

## The style layer is not vehicle specific

`semanticClassOf(mesh)` reads `userData.semanticClass` (glTF extras) when a
pipeline wrote one, otherwise a generic naming table (tyre, wheel, headlight,
taillight, grille, mirror, glass, trim words). Unknown surfaces are painted
body. `applyStandardStyle(root, { bodyHex })` then assigns one material per
class. Nothing in it knows the make, model, mesh count or geometry. The G80 is
only the asset it was tested on; a second reconstructed vehicle with the same
class names, or with extras, renders through the same code unchanged.

| Class | Material |
| --- | --- |
| BODY_PAINT | Satin paint in the detected colour: metalness 0.12, roughness 0.62, clearcoat 0.35 with rough clearcoat |
| MIRROR | Same paint (body colour looked cleaner than black on this mesh) |
| GLASS | Opaque near black (#07080a), roughness 0.16, clearcoat 1.0: no interior shown |
| WHEEL | Dark graphite satin (#1a1b1e), metalness 0.35, roughness 0.5 |
| TIRE | Matte rubber (#0c0c0d), roughness 0.96 |
| HEADLIGHT | Smoked lens (#2a2e34), roughness 0.14, clearcoat 1.0, faint emissive |
| TAILLIGHT | Deep red lens (#7c0e14), clearcoat 1.0, faint red emissive |
| GRILLE, TRIM | Satin black (#0f0f10, #121214) |

Panel lines: removed (the refined shader path is off). The projected lines were
dashed and a few centimetres off; the style shows only the class separation the
projection got right.

## Detected body colour

Median projected source colour over 43,054 confidently painted vertices:
#59575f (mean #58565e, lower quartile #3e3c42), measured by the refinement
pipeline (`docs/captures/twin-refinement/pipeline-report.json`, `body_colour`).
That value includes the studio light of the source images and a slight blue cast
from the reflections, so the paint albedo is #46464a: same lightness minus a
fixed 15 percent light compensation, neutralised. Black (#141416) and white
(#e6e6e3) are recolours of the same material through one uniform change; the
floor reflection is rebuilt so its cloned materials follow.

## Screen

Vehicle name, the car filling most of the stage, three colour swatches, AD OFF /
AD ON, four small view chips, a Details button that opens the technical notes.
Direct drag rotation, vertical orbit within the existing rig limits, wheel and
pinch zoom, touch. The ad is Demo Coffee Co. as a runtime THREE.DecalGeometry
on `body_door_fl` only, never baked into the surface.

## Assessment

See the eight answers in the report delivered with this commit; the short
version: matte paint and black glass remove most of the "photograph turned into
3D" look, the silhouette still reads as a G80, recolouring is free, the ad works,
and the remaining defects are the jagged class boundaries (glass, headlights,
grille) and the front bumper geometry, which are region and reconstruction
problems, not style problems.

## Screenshots

`docs/captures/twin-style/`: `colours.jpg` (graphite, black, white, ad),
`views.jpg` (front, driver, rear, passenger), `compare-refinement.jpg` (the same
views in the refinement lab), `phone.jpg`, `details.jpg`.
