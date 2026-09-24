import * as THREE from "three";

/**
 * TapMart Standard: one rendering style for every reconstructed vehicle.
 *
 * The style consumes semantic classes, never a make or model. A mesh gets its
 * class from `userData.semanticClass` (glTF extras) when the pipeline wrote one,
 * otherwise from its name through a generic naming table. Unknown surfaces are
 * treated as painted body. Materials are deliberately not photoreal: satin
 * paint in the detected body colour, near opaque black glass (no interior),
 * dark satin wheels, matte rubber, stylised lenses, satin black trim.
 */
export type SemanticClass = "BODY_PAINT" | "GLASS" | "WHEEL" | "TIRE" | "HEADLIGHT" | "TAILLIGHT" | "GRILLE" | "TRIM" | "MIRROR";

const NAME_RULES: [RegExp, SemanticClass][] = [
  [/tyre|tire|rubber/i, "TIRE"],
  [/wheel|rim|spoke|hub/i, "WHEEL"],
  [/head_?l(ight|amp)|drl|fog/i, "HEADLIGHT"],
  [/tail_?l(ight|amp)|brake|rear_?l(ight|amp)/i, "TAILLIGHT"],
  [/grille|grill|intake|mesh_front/i, "GRILLE"],
  [/mirror/i, "MIRROR"],
  [/glass|window|windshield|windscreen/i, "GLASS"],
  [/trim|rocker|sill|diffuser|splitter|spoiler_lip|gill|handle|badge|exhaust|carbon|molding|moulding/i, "TRIM"],
];

export function semanticClassOf(mesh: THREE.Mesh): SemanticClass {
  const tagged = mesh.userData?.semanticClass as string | undefined;
  if (tagged && isSemanticClass(tagged)) return tagged;
  for (const [re, cls] of NAME_RULES) if (re.test(mesh.name)) return cls;
  return "BODY_PAINT";
}

function isSemanticClass(v: string): v is SemanticClass {
  return ["BODY_PAINT", "GLASS", "WHEEL", "TIRE", "HEADLIGHT", "TAILLIGHT", "GRILLE", "TRIM", "MIRROR"].includes(v);
}

export type StandardStyle = {
  /** Body paint in sRGB hex: the detected real colour, or a recolour. */
  bodyHex: string;
  /** Mirror housings follow the body colour (true) or the trim colour (false). */
  mirrorsBodyColour?: boolean;
};

export type StandardHandle = {
  setBody: (hex: string) => void;
  classes: Record<string, SemanticClass>;
  dispose: () => void;
};

function satin(color: string, o: Partial<THREE.MeshPhysicalMaterialParameters> = {}): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.12, roughness: 0.62, clearcoat: 0.35, clearcoatRoughness: 0.55, envMapIntensity: 0.75, ...o });
}

/** Materials per class; the paint is shared by every BODY_PAINT mesh so a recolour is one uniform change. */
export function buildStandardMaterials(style: StandardStyle): Record<SemanticClass, THREE.MeshPhysicalMaterial> {
  const paint = satin(style.bodyHex);
  paint.name = "tapmart_paint_satin";
  const trim = satin("#121214", { metalness: 0.2, roughness: 0.6, clearcoat: 0.08, clearcoatRoughness: 0.7, envMapIntensity: 0.4 });
  return {
    BODY_PAINT: paint,
    MIRROR: style.mirrorsBodyColour === false ? trim : paint,
    // opaque, very dark, a controlled specular so the pane reads as glass without showing anything behind it
    GLASS: new THREE.MeshPhysicalMaterial({ color: "#07080a", metalness: 0.0, roughness: 0.16, clearcoat: 1.0, clearcoatRoughness: 0.08, envMapIntensity: 1.0 }),
    WHEEL: new THREE.MeshPhysicalMaterial({ color: "#1a1b1e", metalness: 0.35, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5, envMapIntensity: 0.6 }),
    TIRE: new THREE.MeshPhysicalMaterial({ color: "#0c0c0d", metalness: 0.0, roughness: 0.96, envMapIntensity: 0.3 }),
    HEADLIGHT: new THREE.MeshPhysicalMaterial({ color: "#2a2e34", metalness: 0.15, roughness: 0.14, clearcoat: 1.0, clearcoatRoughness: 0.05, emissive: "#0d1014", envMapIntensity: 1.2 }),
    TAILLIGHT: new THREE.MeshPhysicalMaterial({ color: "#7c0e14", metalness: 0.05, roughness: 0.22, clearcoat: 1.0, clearcoatRoughness: 0.08, emissive: "#3c060a", envMapIntensity: 1.0 }),
    GRILLE: satin("#0f0f10", { metalness: 0.15, roughness: 0.6, clearcoat: 0.15, clearcoatRoughness: 0.7, envMapIntensity: 0.5 }),
    TRIM: trim,
  };
}

/** Replace every material under root by the class material. Vertex colours, textures and custom shaders of the source are dropped on purpose. */
export function applyStandardStyle(root: THREE.Object3D, style: StandardStyle): StandardHandle {
  const mats = buildStandardMaterials(style);
  const classes: Record<string, SemanticClass> = {};
  const old: THREE.Material[] = [];
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const cls = semanticClassOf(m);
    classes[m.name || `mesh_${old.length}`] = cls;
    const prev = m.material as THREE.Material;
    if (prev && !old.includes(prev)) old.push(prev);
    m.material = mats[cls];
  });
  for (const p of old) p.dispose();
  return {
    classes,
    setBody: (hex) => { mats.BODY_PAINT.color.set(hex); if (mats.MIRROR === mats.BODY_PAINT) return; },
    dispose: () => { for (const m of Object.values(mats)) m.dispose(); },
  };
}

/** Body colour presets: the detected colour of the scanned car, or a standard recolour. */
export const STANDARD_COLOURS = {
  black: { label: "Matte black", hex: "#141416" },
  graphite: { label: "Matte graphite", hex: "#46464a" },
  white: { label: "Matte white", hex: "#e6e6e3" },
} as const;
export type StandardColourKey = keyof typeof STANDARD_COLOURS;
