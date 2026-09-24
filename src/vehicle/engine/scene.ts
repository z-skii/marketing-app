import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { PlacementZone, VehicleModel } from "../catalog";
import { buildSedan, paintMaterial } from "./sedan";

/**
 * The parts of a vehicle scene that plain three.js and React Three Fiber
 * share: loading the asset into the vehicle frame, painting it, the
 * studio environment, the floor shadow and the faint reflection. One
 * code path, so a thumbnail and the interactive viewer show the same car.
 */
export type LoadedVehicle = {
  root: THREE.Group;
  bodyMeshes: THREE.Mesh[];
  /** The catalog entry with every zone in metres and dims measured from the fitted mesh. */
  model: VehicleModel;
  dispose: () => void;
};

THREE.Cache.enabled = true;
const gltfLoader = new GLTFLoader();
let decodersReady = false;
function withDecoders(renderer?: THREE.WebGLRenderer) {
  if (decodersReady) return gltfLoader;
  const draco = new DRACOLoader();
  draco.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");
  gltfLoader.setDRACOLoader(draco);
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  if (renderer) { const ktx2 = new KTX2Loader(); ktx2.setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/libs/basis/"); ktx2.detectSupport(renderer); gltfLoader.setKTX2Loader(ktx2); }
  decodersReady = true;
  return gltfLoader;
}

const EXCLUDED = /glass|window|wheel|tyre|tire|rim|light|lamp|grille|interior|mirror/i;

export async function loadVehicle(vehicle: VehicleModel, paint: string, renderer?: THREE.WebGLRenderer): Promise<LoadedVehicle> {
  let root: THREE.Group;
  if (vehicle.asset.kind === "procedural") {
    root = buildSedan(paint).group;
  } else {
    const asset = vehicle.asset;
    const gltf = await withDecoders(renderer).loadAsync(asset.url);
    root = new THREE.Group();
    root.add(gltf.scene);
    const material = paintMaterial(paint);
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.castShadow = false; m.receiveShadow = false;
      if (asset.keepMaterials) {
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) { mat.envMapIntensity = 1.1; mat.needsUpdate = true; }
        return;
      }
      const isBody = vehicle.bodyMeshes.length ? vehicle.bodyMeshes.includes(m.name) : !EXCLUDED.test(m.name);
      if (isBody) m.material = material;
    });
  }
  const { scale, rotationY, offset } = vehicle.transform;
  root.scale.setScalar(scale);
  root.rotation.y = rotationY;
  root.position.set(...offset);
  root.updateMatrixWorld(true);
  const dims = { ...vehicle.dims };
  if (vehicle.asset.kind === "glb" && vehicle.asset.autoFit) {
    // Fit: longest horizontal axis becomes the length along X, scaled to the catalog length, centred, on the ground.
    let box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    if (size.z > size.x) { root.rotation.y += Math.PI / 2; root.updateMatrixWorld(true); box = new THREE.Box3().setFromObject(root); box.getSize(size); }
    const k = vehicle.dims.length / Math.max(1e-6, size.x);
    root.scale.multiplyScalar(k);
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    const c = box.getCenter(new THREE.Vector3());
    root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box.min.y;
    root.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(root);
    box.getSize(size);
    dims.length = size.x; dims.width = size.z; dims.height = size.y;
  }
  const bodyMeshes: THREE.Mesh[] = [];
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && (vehicle.bodyMeshes.length ? vehicle.bodyMeshes.includes(m.name) : !EXCLUDED.test(m.name))) bodyMeshes.push(m); });
  const model: VehicleModel = { ...vehicle, dims, zones: vehicle.zones.map((z) => resolveZone(z, dims)) };
  return {
    root,
    bodyMeshes,
    model,
    dispose() { root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.geometry?.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose(); } }); },
  };
}

/** A fraction zone in metres for this body: x from the nose, y from the ground, z from the driver side. */
function resolveZone(zone: PlacementZone, dims: VehicleModel["dims"]): PlacementZone {
  if (zone.units !== "fraction") return zone;
  const [fx, fy, fz] = zone.center;
  return { ...zone, units: "m", center: [fx * dims.length, fy * dims.height, fz * dims.width] };
}

/** Studio lighting from a procedural room: no HDR download, works offline and in a thumbnail worker. */
export function studioEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return texture;
}

export function addStudioLights(scene: THREE.Scene) {
  const key = new THREE.DirectionalLight("#ffffff", 1.4); key.position.set(4, 7, 5);
  const fill = new THREE.DirectionalLight("#ffffff", 0.5); fill.position.set(-6, 4, -3);
  const rim = new THREE.DirectionalLight("#ffffff", 0.7); rim.position.set(-2, 5, 6);
  scene.add(key, fill, rim, new THREE.AmbientLight("#ffffff", 0.25));
}

let shadowTex: THREE.CanvasTexture | null = null;
function shadowTexture(): THREE.CanvasTexture {
  if (shadowTex) return shadowTex;
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 64, 8, 128, 64, 120);
  g.addColorStop(0, "rgba(0,0,0,0.78)"); g.addColorStop(0.55, "rgba(0,0,0,0.28)"); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.scale(1, 0.5); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  shadowTex = new THREE.CanvasTexture(c);
  return shadowTex;
}

/**
 * A soft floor shadow under the car and a faint mirrored copy for the
 * reflection. The mirror shares the car's geometry (no extra memory) and
 * fades out with depth in its own shader, so no colour matching against
 * the page is needed. No extra render pass.
 */
export type FloorOptions = { reflectionOpacity?: number; shadowOpacity?: number; shadowScale?: number };
export function buildFloor(vehicle: LoadedVehicle, dims: VehicleModel["dims"], reflection = true, opts: FloorOptions = {}): THREE.Group {
  const { reflectionOpacity = 0.18, shadowOpacity = 0.85, shadowScale = 1 } = opts;
  const g = new THREE.Group(); g.name = "floor";
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(dims.length * 1.5 * shadowScale, dims.width * 2.2 * shadowScale), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: shadowOpacity }));
  shadow.name = "floor-shadow";
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.004; shadow.renderOrder = 2;
  g.add(shadow);
  if (reflection) {
    const mirror = vehicle.root.clone(true);
    mirror.name = "reflection";
    mirror.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const src = m.material as THREE.Material;
      const mat = src.clone(); mat.transparent = true; mat.opacity = reflectionOpacity; mat.depthWrite = false; mat.side = THREE.BackSide;
      mat.onBeforeCompile = fadeWithDepth;
      m.material = mat;
      m.renderOrder = 0;
    });
    mirror.scale.y *= -1; mirror.position.y = -0.002;
    g.add(mirror);
  }
  return g;
}

/** Injected into the mirror's materials: alpha falls to zero as the reflected car goes "below" the floor. */
function fadeWithDepth(shader: THREE.WebGLProgramParametersWithUniforms) {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nvarying float vFadeY;")
    .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvFadeY = (modelMatrix * vec4(transformed, 1.0)).y;");
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", "#include <common>\nvarying float vFadeY;")
    .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( diffuse, opacity * smoothstep(-1.15, -0.02, vFadeY) );");
}

/** The floor's own resources only: the mirror shares the car's geometry, so just its cloned materials go. */
export function disposeFloor(floor: THREE.Object3D | null | undefined) {
  if (!floor) return;
  floor.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material; if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    if (m.name === "floor-shadow") m.geometry.dispose();
  });
  floor.parent?.remove(floor);
}
