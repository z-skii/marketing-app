import * as THREE from "three";
import { CAMERA_FOV, framePreset, getVehicle, type CameraPresetKey } from "../catalog";
import type { Placement } from "../placement";
import { addStudioLights, buildFloor, disposeFloor, loadVehicle, studioEnvironment } from "./scene";
import { buildArtworkDecal, disposeObject, loadArtworkTexture } from "./decals";

/**
 * Still renders of the same 3D scene for lists and cards. One hidden
 * WebGL renderer for the whole page, one render per request, results
 * cached as data URLs: a list of twenty cars costs one context, not
 * twenty. Requests run one after another so the renderer is never shared
 * between two frames.
 */
export type ThumbnailRequest = {
  vehicleId?: string;
  paint: string;
  placement?: Placement | null;
  preset?: CameraPresetKey;
  width?: number;
  height?: number;
  reflection?: boolean;
};

let renderer: THREE.WebGLRenderer | null = null;
let environment: THREE.Texture | null = null;
let unavailable = false;
const cache = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();

function keyOf(r: ThumbnailRequest): string {
  const p = r.placement ? `${r.placement.zone}|${r.placement.artworkUrl ?? ""}|${r.placement.scale}|${r.placement.offsetX}|${r.placement.offsetY}|${r.placement.rotation}` : "";
  return [r.vehicleId ?? "", r.paint, r.preset ?? "", r.width ?? 0, r.height ?? 0, r.reflection === false ? 0 : 1, p].join("~");
}

function getRenderer(): THREE.WebGLRenderer | null {
  if (renderer) return renderer;
  if (unavailable || typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "low-power" });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(1);
    environment = studioEnvironment(renderer);
    return renderer;
  } catch {
    unavailable = true;
    return null;
  }
}

/** True when this browser cannot make a WebGL context; the caller shows a static fallback. */
export function thumbnailsAvailable(): boolean {
  return getRenderer() !== null;
}

export function renderThumbnail(req: ThumbnailRequest): Promise<string> {
  const key = keyOf(req);
  const hit = cache.get(key);
  if (hit) return hit;
  const job = queue.then(() => renderOnce(req));
  queue = job.catch(() => undefined);
  cache.set(key, job);
  job.catch(() => cache.delete(key));
  return job;
}

async function renderOnce(req: ThumbnailRequest): Promise<string> {
  const gl = getRenderer();
  if (!gl || !environment) throw new Error("WebGL is not available.");
  const vehicle = getVehicle(req.vehicleId);
  const width = req.width ?? vehicle.thumbnail.width, height = req.height ?? vehicle.thumbnail.height;
  const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  gl.setPixelRatio(dpr);
  gl.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.environment = environment;
  scene.environmentIntensity = 0.9;
  addStudioLights(scene);
  const preset = vehicle.cameras.find((c) => c.key === (req.preset ?? vehicle.thumbnail.preset)) ?? vehicle.cameras[0];
  const framed = framePreset(preset, width / height);
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 0.1, 80);
  camera.position.set(...framed.position);
  camera.lookAt(new THREE.Vector3(...framed.target));

  const loaded = await loadVehicle(vehicle, req.paint, gl);
  scene.add(loaded.root);
  const floor = buildFloor(loaded, vehicle.dims, req.reflection !== false);
  scene.add(floor);
  let art: THREE.Object3D | null = null;
  const placement = req.placement;
  if (placement?.artworkUrl) {
    const zone = vehicle.zones.find((z) => z.id === placement.zone);
    if (zone) {
      try {
        const tex = await loadArtworkTexture(placement.artworkUrl);
        art = buildArtworkDecal(vehicle, loaded.root, zone, placement, tex);
        if (art) scene.add(art);
      } catch { /* the car still renders without its artwork */ }
    }
  }
  try {
    gl.render(scene, camera);
    return gl.domElement.toDataURL("image/png");
  } finally {
    disposeObject(art);
    disposeFloor(floor);
    scene.remove(loaded.root);
    loaded.dispose();
  }
}
