import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";
import type { PlacementZone, VehicleModel } from "../catalog";
import { decalBox, type Placement } from "../placement";

/**
 * Surface mapping. Artwork and zone highlights are DecalGeometry: the
 * zone's projector box is clipped against the real body triangles, so the
 * result follows the panel's curvature, keeps perspective, and stays
 * attached under rotation and zoom. Nothing here is a screen space
 * rectangle. Each zone projects only onto the meshes it names, so artwork
 * cannot bleed onto another panel.
 */
export const ZONE_TINT = "#E0212B";

const _z = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _m = new THREE.Matrix4();

/** The projector frame of a zone: +Z along the panel normal, +Y the artwork's up, +X the viewer's right. */
export function zoneFrame(zone: PlacementZone): { position: THREE.Vector3; quaternion: THREE.Quaternion; basis: { x: THREE.Vector3; y: THREE.Vector3; z: THREE.Vector3 } } {
  const z = _z.set(...zone.normal).normalize().clone();
  const up = _y.set(...zone.up).normalize();
  const x = _x.crossVectors(up, z).normalize().clone();
  const y = new THREE.Vector3().crossVectors(z, x).normalize();
  _m.makeBasis(x, y, z);
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(_m);
  return { position: new THREE.Vector3(...zone.center), quaternion, basis: { x, y, z } };
}

function targetsOf(vehicle: VehicleModel, root: THREE.Object3D, zone: PlacementZone): THREE.Mesh[] {
  const names = zone.meshTargets.length ? zone.meshTargets : vehicle.bodyMeshes;
  const out: THREE.Mesh[] = [];
  root.traverse((o) => { if ((o as THREE.Mesh).isMesh && (names.length === 0 || names.includes(o.name))) out.push(o as THREE.Mesh); });
  return out;
}

function projectorEuler(zone: PlacementZone, rotationDeg = 0): THREE.Euler {
  const { quaternion } = zoneFrame(zone);
  if (rotationDeg) quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), THREE.MathUtils.degToRad(rotationDeg)));
  return new THREE.Euler().setFromQuaternion(quaternion);
}

function decalGeometry(targets: THREE.Mesh[], position: THREE.Vector3, euler: THREE.Euler, size: THREE.Vector3): THREE.BufferGeometry | null {
  const parts: THREE.BufferGeometry[] = [];
  for (const mesh of targets) {
    mesh.updateWorldMatrix(true, false);
    const g = new DecalGeometry(mesh, position, euler, size);
    if (g.getAttribute("position") && g.getAttribute("position").count > 0) parts.push(g); else g.dispose();
  }
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  // Concatenate: the decal geometries share the same non indexed layout.
  const total = parts.reduce((n, g) => n + g.getAttribute("position").count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of parts) {
    const p = g.getAttribute("position").array as Float32Array, n = g.getAttribute("normal").array as Float32Array, u = g.getAttribute("uv").array as Float32Array;
    pos.set(p, o * 3); nor.set(n, o * 3); uv.set(u, o * 2); o += g.getAttribute("position").count; g.dispose();
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  merged.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  merged.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return merged;
}

/** A translucent red wash over the whole printable area, with a slightly stronger rim so the panel reads as selected. */
export function buildZoneHighlight(vehicle: VehicleModel, root: THREE.Object3D, zone: PlacementZone, strength: 1 | 0.5 = 1): THREE.Group {
  const group = new THREE.Group();
  group.name = `zone-${zone.id}`;
  const targets = targetsOf(vehicle, root, zone);
  const { position } = zoneFrame(zone);
  const euler = projectorEuler(zone);
  const [w, h, d] = zone.size;
  const outer = decalGeometry(targets, position, euler, new THREE.Vector3(w, h, d));
  if (outer) {
    group.add(new THREE.Mesh(outer, new THREE.MeshBasicMaterial({ color: ZONE_TINT, transparent: true, opacity: 0.42 * strength, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })));
  }
  const inner = decalGeometry(targets, position, euler, new THREE.Vector3(w - 0.05, h - 0.05, d));
  if (inner) {
    group.add(new THREE.Mesh(inner, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.22 * strength, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
  }
  return group;
}

const textureCache = new Map<string, Promise<THREE.Texture>>();
export function loadArtworkTexture(url: string): Promise<THREE.Texture> {
  let p = textureCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; resolve(t); }, undefined, (e) => reject(e));
    });
    textureCache.set(url, p);
  }
  return p;
}

export function textureAspect(t: THREE.Texture): number {
  const img = t.image as { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number } | undefined;
  const w = img?.naturalWidth || img?.width || 2, h = img?.naturalHeight || img?.height || 1;
  return w / h;
}

/** The artwork as vinyl on the panel: a textured decal clipped to the placement box inside the zone. */
export function buildArtworkDecal(vehicle: VehicleModel, root: THREE.Object3D, zone: PlacementZone, placement: Placement, texture: THREE.Texture): THREE.Mesh | null {
  const targets = targetsOf(vehicle, root, zone);
  const { position, basis } = zoneFrame(zone);
  const { w, h, dx, dy } = decalBox(zone, placement, textureAspect(texture));
  const centre = position.clone().addScaledVector(basis.x, dx).addScaledVector(basis.y, dy);
  const euler = projectorEuler(zone, placement.rotation);
  const geo = decalGeometry(targets, centre, euler, new THREE.Vector3(w, h, zone.size[2]));
  if (!geo) return null;
  const material = new THREE.MeshStandardMaterial({ map: texture, transparent: true, depthTest: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6 });
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = `artwork-${zone.id}`;
  mesh.renderOrder = 2;
  return mesh;
}

/** Which zone a world point on the body belongs to, if any. Used for click selection on the real surface. */
export function zoneAtPoint(vehicle: VehicleModel, point: THREE.Vector3, candidates: readonly PlacementZone[] = vehicle.zones): PlacementZone | null {
  let best: PlacementZone | null = null, bestArea = Infinity;
  for (const zone of candidates) {
    const { position, basis } = zoneFrame(zone);
    const d = point.clone().sub(position);
    const lx = d.dot(basis.x), ly = d.dot(basis.y), lz = d.dot(basis.z);
    const [w, h, depth] = zone.size;
    if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2 && Math.abs(lz) <= depth / 2) {
      const area = w * h;
      if (area < bestArea) { best = zone; bestArea = area; }
    }
  }
  return best;
}

export function disposeObject(o: THREE.Object3D | null | undefined) {
  if (!o) return;
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (m.isMesh) { m.geometry?.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); }
  });
  o.parent?.remove(o);
}
