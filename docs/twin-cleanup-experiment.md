# Twin cleanup experiment: raw Meshy reconstruction to clean digital twin

CONTROLLED SYNTHETIC CAPTURE TEST, continued. Route: `/labs/twin-cleanup`
(RAW, CLAY, CLEAN TWIN, Ad on and off). `/labs/twin-compare` is untouched.
No Meshy or Tripo credits were spent; the input is the Prototype 2 Meshy
mesh exactly as delivered, preserved unmodified (28.5 MB raw in the
experiment scratchpad, its Draco and WebP copy at
`public/vehicles/syn-g80-meshy.glb` with the same vertices).

## What was done to the geometry (scratchpad clean/cleanup.mjs)

| Step | Result |
| --- | --- |
| Weld by position, 0.01 mm | 376,141 vertices to 152,182; the raw file split every UV seam and hard edge |
| Degenerate faces | none found |
| Connectivity | 5 components: body 131,137 vertices and four wheels of about 5,000 to 5,500. No floating fragments, nothing removed |
| Hole repair | 349 boundary edges; 2 closed loops filled with 8 triangles; 238 open non manifold seams left (wheel arch lips, underside, mirror bases) |
| Taubin smoothing | 6 passes, lambda 0.5, mu minus 0.53, boundary vertices pinned; bounding box moved under 0.1 percent on every axis |
| Normals | fresh smooth vertex normals per region |
| Simplification | none; 308,200 triangles kept, 0.89 MB on the web without textures |
| Scaling | none, on any axis, at any point |

## Geometry validation, before and after (measure.mjs, raw files)

| Ratio | Real | Raw Meshy | Clean twin |
| --- | --- | --- | --- |
| Length to width | 2.319 | 2.393, 3.2 percent, PASS | 2.395, 3.3 percent, PASS |
| Length to height | 3.345 | 3.313, 1.0 percent, PASS | 3.314, 0.9 percent, PASS |
| Wheelbase to length | 0.596 | 0.606, 1.6 percent, PASS | 0.598, 0.4 percent, PASS |
| Width to height | 1.442 | 1.385, 4.0 percent, PASS | 1.384, 4.1 percent, PASS |
| At 4,794 mm | 2,067 / 1,433 / 2,857 | 2,004 / 1,447 / 2,904 | 2,001 / 1,446 / 2,868 |
| Score | | 0.733 | 0.785 |

The three bounding box ratios are unchanged within measurement noise. The
score rises only because the wheelbase reading moved from 2,904 to 2,868 mm:
welding and smoothing tightened the low vertex clusters the measurement uses
for the axles. Nothing was scaled to earn that.

## Material regions

| Region | How it was found | Triangles |
| --- | --- | --- |
| wheels, tyres | automatic: the four separate components; tyre is the outer 26 percent of each wheel's radius | 23,131 and 19,464 |
| tail lights | automatic from the scan texture: red texels on the tail face (this also fixed the nose direction: 1,148 red texels at one end, 13 at the other) | 403 |
| headlights | not separable: their texels are as dark as the paint and the lens has no geometry of its own, so they render as body | 0 |
| grille | texture plus geometry: dark texels facing forward at the nose | 3,864 |
| glass | position rule only: above 66.5 percent of the height, not facing up, between the A and C pillars; the pillars fall inside it | 30,818 |
| trim | position rule only: rockers, splitter and diffuser under 15 percent of the height, dark lower bumper intakes, mirror caps | 13,965 |
| body | everything else, after a two pass neighbourhood majority filter that removes jagged islands | 216,555 |

Materials assigned (glTF PBR, no scan texture): graphite paint with a
clearcoat, tinted glass at 82 percent opacity, dark metallic wheels, matte
rubber tyres, light lenses with a faint emissive, black grille, satin black
trim. Because the regions are separate named meshes, the decal engine's
existing name filter keeps the door decal on the body region only.

## Decal

The driver front door box is unchanged from Prototype 2. On the clean twin
the Demo Coffee Co. creative projects onto the body region only and stays
attached under rotation and zoom (verified in screenshots). Ad on and Ad
off work in all three modes.

## What clay mode shows

With one neutral material the reconstruction reads as a clean clay model of
a G80: the silhouette, roof line, hood, doors, wheel arches, rear shoulders,
trunk and diffuser are smooth and in proportion; the kidney grille block,
the headlight recesses and the tail light shapes exist as shallow relief.
The ugliness of the raw view is almost entirely the scan texture (baked
reflections, dark smears, painted seams) and the mirror like material that
texture implies. Geometry defects that clay does reveal: slight ripples on
the door skins (visible under glossy paint, invisible in clay), a few lumps
along the trunk edge and rear quarters, blobby mirrors, wheels that are
solid discs with spoke relief, soft front intakes, no panel gaps or handles.

## Assessment

The geometry is good enough to be the base of a premium twin; the surface
finish is not there yet. Automated cleanup and region materials turned a
scan into something that reads as a product render from the front and rear
three quarter views, but the glossy graphite paint exposes the door ripples
that clay hides, and the segmentation is rule based: glass and trim by
position, lights and grille by texture colour, headlights not separable at
all. What would close the gap, without regenerating anything:

1. A stronger smoothing pass restricted to the door and quarter panels
   (curvature aware, so body lines survive), or a surface fitting step that
   snaps the panels to a low order surface.
2. Learned segmentation (a part model on the four source views projected
   onto the mesh) instead of hand thresholds, so pillars, handles, lights
   and grille come out as their own regions.
3. Small geometry inserts for the parts a scan never gives well: wheels,
   mirrors, light lenses, grille bars, from a per generation parts library.
4. Paint with a real flake model and a slightly rougher clearcoat, so
   remaining ripples read as reflections of the studio rather than dents.
