/** Measured facts of the cleanup run (scratchpad clean/cleanup.mjs on the raw Meshy GLB, 2026-09-23). Nothing here is typed from memory. */
export const CLEANUP_REPORT = {
  source: "Meshy multi image to 3D from the four orthogonal synthetic views (Prototype 2, Model A). Raw GLB preserved as delivered: 376,141 vertices, 308,192 triangles, one mesh, one textured material.",
  cleanup: [
    "Welded by position (0.01 mm): 376,141 vertices became 152,182; the raw file had split every UV seam and hard edge.",
    "Connectivity: 5 components found, the body and four wheels. No floating fragments to remove (smallest component 5,059 vertices).",
    "Hole repair: 349 boundary edges; 2 small closed loops filled with 8 triangles, 238 open non manifold seams left as they are (wheel arch lips, underside, mirror bases).",
    "Taubin smoothing, 6 passes (lambda 0.5, mu minus 0.53), boundary vertices pinned: bounding box changed by under 0.1 percent on every axis.",
    "Fresh smooth vertex normals per region. No simplification: 308,200 triangles kept, the file is 0.89 MB without textures.",
    "No axis was scaled or stretched at any point.",
  ],
  triangles: "308,192 raw, 308,200 clean (8 added by hole repair).",
  score: "0.733 raw, 0.785 clean. Length to width 3.2 to 3.3 percent, length to height 1.0 to 0.9, width to height 4.0 to 4.1: unchanged within measurement noise. Wheelbase to length moved from 1.6 percent off to 0.4 percent (2,904 to 2,868 mm) because welding and smoothing tightened the wheel vertex clusters the measurement reads, not because anything was scaled.",
  regions: "Automatic from geometry alone: body, wheels (the four separate components) and tyres (outer 26 percent of each wheel's radius). Automatic from geometry plus the scan texture: tail lights (red texels on the tail face) and grille (dark texels facing forward at the nose). Rule based on position only: glass (above the sill between the pillars, not facing up), trim (rockers and splitter under 15 percent of the height, dark lower bumper intakes, mirror caps). A two pass neighbourhood majority filter removes jagged islands. Headlights could not be separated: their texels are as dark as the paint, so they render as body. Triangles: body 216,555, glass 30,818, wheels 23,131, tyres 19,464, lights 403, grille 3,864, trim 13,965.",
  rules: [
    "The nose direction was found from the red tail light texels (1,148 at one end, 13 at the other); every rule then reads positions in that frame.",
    "Glass thresholds (height above 66.5 percent, normal not facing up, between the A and C pillars) are hand chosen for a sedan; the pillars are inside the glass region.",
    "Light, grille and trim thresholds are hand chosen from the measured mesh; nothing was learned.",
    "Materials: graphite paint with clearcoat, tinted glass at 82 percent opacity, dark metallic wheels, matte rubber tyres, light lenses with a faint emissive, black grille, satin black trim.",
  ],
  decal: "The driver front door box is unchanged. On the clean twin the decal projects onto the body region only, so it can no longer bleed onto the window or the wheel; it stays attached under rotation and zoom.",
  remaining: [
    "Panel gaps, door handles, badges and light interiors are not modelled; the scan never had them as geometry, only as texture.",
    "Headlights render as paint: no rule separated them.",
    "The greenhouse region includes the pillars, so the pillars render as glass.",
    "238 open seams remain at the wheel arch lips and the underside.",
    "Wheel spokes are a solid disc with relief, not open spokes.",
  ],
};
