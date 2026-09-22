import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * A sedan generated in code: TapMart's legally clean placeholder mesh at
 * the G80's outer dimensions. Real geometry (an extruded, bevelled side
 * profile with wheel arches, a glass cabin, four wheels) that decals
 * project onto exactly like a scanned or licensed GLB would. It is meant
 * to be replaced by the licensed model; nothing else in the engine knows
 * the difference.
 */
export type SedanParts = { group: THREE.Group; body: THREE.Mesh; cabin: THREE.Mesh };

const LENGTH = 4.794, WIDTH = 1.903, WHEELBASE = 2.857, WHEEL_R = 0.36;

function profile(points: [number, number][]): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) s.lineTo(points[i][0], points[i][1]);
  s.closePath();
  return s;
}

function smoothProfile(points: [number, number][]): THREE.Shape {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, "catmullrom", 0.35);
  const pts = curve.getPoints(160);
  const s = new THREE.Shape();
  s.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
  s.closePath();
  return s;
}

export function buildSedan(paint: string): SedanParts {
  const half = LENGTH / 2;
  // Lower body: nose at +x. Beltline at 1.0 m, roofline is the cabin's job.
  const bodyProfile = smoothProfile([
    [-half + 0.05, 0.34], [-half, 0.5], [-half + 0.02, 0.8], [-half + 0.12, 0.98], [-1.3, 1.02], [-0.2, 1.01], [0.95, 1.0], [1.1, 0.985],
    [2.0, 0.93], [2.3, 0.86], [half, 0.72], [half - 0.02, 0.5], [half - 0.1, 0.34], [2.0, 0.24], [-2.0, 0.24],
  ]);
  for (const x of [WHEELBASE / 2, -WHEELBASE / 2]) {
    const arch = new THREE.Path();
    arch.absarc(x, WHEEL_R, WHEEL_R + 0.07, 0, Math.PI * 2, true);
    bodyProfile.holes.push(arch);
  }
  const bodyGeo = new THREE.ExtrudeGeometry(bodyProfile, { depth: WIDTH - 0.24, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.09, bevelSegments: 6, curveSegments: 8, steps: 1 });
  bodyGeo.translate(0, 0, -(WIDTH - 0.24) / 2);
  const body = new THREE.Mesh(finish(bodyGeo), paintMaterial(paint));
  body.name = "body";

  // Cabin: the greenhouse as one dark clearcoated volume (glass and pillars).
  const cabinProfile = smoothProfile([
    [-1.35, 0.99], [-1.1, 1.14], [-0.85, 1.33], [-0.55, 1.415], [0.1, 1.433], [0.45, 1.41], [0.75, 1.3], [0.98, 1.12], [1.05, 0.99],
  ]);
  const cabinGeo = new THREE.ExtrudeGeometry(cabinProfile, { depth: WIDTH - 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.12, bevelSegments: 5, curveSegments: 8, steps: 1 });
  cabinGeo.translate(0, 0, -(WIDTH - 0.5) / 2);
  const cabin = new THREE.Mesh(finish(cabinGeo), glassMaterial());
  cabin.name = "cabin";

  const group = new THREE.Group();
  group.name = "vehicle";
  group.add(body, cabin);

  // Wheels and rims.
  const tyre = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.92, metalness: 0 });
  const rim = new THREE.MeshStandardMaterial({ color: "#C9CBD0", roughness: 0.28, metalness: 0.9 });
  const tyreGeo = new THREE.CylinderGeometry(WHEEL_R, WHEEL_R, 0.27, 40);
  const rimGeo = new THREE.CylinderGeometry(WHEEL_R * 0.66, WHEEL_R * 0.66, 0.29, 24);
  const hubGeo = new THREE.CylinderGeometry(WHEEL_R * 0.16, WHEEL_R * 0.16, 0.31, 16);
  for (const x of [WHEELBASE / 2, -WHEELBASE / 2]) for (const z of [WIDTH / 2 - 0.19, -(WIDTH / 2 - 0.19)]) {
    const wheel = new THREE.Group();
    const t = new THREE.Mesh(tyreGeo, tyre); const r = new THREE.Mesh(rimGeo, rim); const h = new THREE.Mesh(hubGeo, tyre);
    t.name = "tyre"; r.name = "rim"; h.name = "hub";
    wheel.add(t, r, h);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, WHEEL_R, z);
    group.add(wheel);
  }

  // Lights and grille as simple inset details so the ends read as a car.
  const lamp = new THREE.MeshStandardMaterial({ color: "#F3F4F6", emissive: "#DDE3EA", emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.2 });
  const tail = new THREE.MeshStandardMaterial({ color: "#7A1116", emissive: "#5A0A0E", emissiveIntensity: 0.5, roughness: 0.3 });
  const dark = new THREE.MeshStandardMaterial({ color: "#0E0F12", roughness: 0.6, metalness: 0.2 });
  for (const z of [0.6, -0.6]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.42), lamp); head.position.set(half - 0.03, 0.72, z); head.name = "light"; group.add(head);
    const rear = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.5), tail); rear.position.set(-half + 0.03, 0.86, z); rear.name = "light"; group.add(rear);
  }
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.6), dark); grille.position.set(half - 0.02, 0.5, 0); grille.name = "grille"; group.add(grille);

  return { group, body, cabin };
}

function finish(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const merged = mergeVertices(geo, 1e-4);
  merged.computeVertexNormals();
  merged.computeBoundingBox();
  return merged;
}

export function paintMaterial(color: string): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.55, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.15 });
}

function glassMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color: "#0C1014", metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });
}

export const SEDAN_DIMS = { length: LENGTH, width: WIDTH, wheelbase: WHEELBASE };
export { profile as _profile };
