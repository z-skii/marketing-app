/** Technical notes for the Details drawer. Numbers are measured by the refinement pipeline (docs/twin-refinement-experiment.md). */
export const STYLE_NOTES: [string, string][] = [
  ["Geometry", "The refined twin of the previous experiment, byte for byte the same GLB (308,200 triangles, 10 meshes). Nothing was regenerated, reconstructed or retextured, and no credits were spent."],
  ["Classes", "The style reads semantic classes, not a make or model: BODY_PAINT, GLASS, WHEEL, TIRE, HEADLIGHT, TAILLIGHT, GRILLE, TRIM, MIRROR. A mesh is classified from its glTF extras or a generic naming table, so the same code applies to any reconstructed vehicle."],
  ["Body colour", "Detected from the sixteen source views: the median projected colour over 43,054 confidently painted vertices is #59575f under studio light; the paint albedo is set to #46464a (the same lightness minus a fixed 15 percent studio light compensation, with the slight blue cast of the studio reflections removed). Black and white are standard recolours of the same material."],
  ["Paint", "Satin automotive finish: metalness 0.12, roughness 0.62, clearcoat 0.35 with rough clearcoat. No mirror-like gloss, so reconstruction ripples are not emphasised. Mirrors follow the body colour."],
  ["Glass", "One standard near-black opaque glass for every pane with a controlled clearcoat reflection. No interior is reconstructed or shown."],
  ["Wheels and tyres", "Dark graphite satin wheels, matte black rubber. The projected spoke pattern of the refinement lab is dropped so imperfect spokes are not emphasised."],
  ["Lights and trim", "Headlights as a smoked clear lens, taillights as a deep red lens, grille and trim in satin black. The regions come from the source view projection."],
  ["Panel lines", "Removed. The projected lines were dashed and a few centimetres off, so the style shows only the class separation the projection got right."],
  ["Studio", "Soft neutral light studio: wide key, cool fill, top light, hemisphere ambient, 0.8 environment, a larger contact shadow and a 4.5 percent floor reflection."],
  ["Ad", "Demo Coffee Co. is a runtime THREE.DecalGeometry on the body_door_fl mesh only (the semantic front left door), never baked into the surface, so it cannot reach glass, trim, the arch or another panel."],
];
