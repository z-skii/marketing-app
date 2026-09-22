"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, invalidate, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CAMERA_FOV, framePreset, getVehicle, type CameraPresetKey, type PlacementZone, type VehicleModel, type ZoneKey } from "./catalog";
import type { Placement } from "./placement";
import { addStudioLights, buildFloor, disposeFloor, loadVehicle, studioEnvironment, type LoadedVehicle } from "./engine/scene";
import { buildArtworkDecal, buildZoneHighlight, disposeObject, loadArtworkTexture, zoneAtPoint } from "./engine/decals";

/**
 * The interactive vehicle scene: one React Three Fiber canvas around the
 * shared engine. The car is a real mesh; zones are projector boxes on it;
 * highlights and artwork are decals clipped to the body triangles. The
 * canvas renders on demand (frameloop "demand"), so an idle car costs
 * nothing. Nothing here exposes technical 3D controls; the viewer decides
 * what a person sees around it.
 */
export type VehicleSceneProps = {
  vehicleId?: string;
  /** Paint hex; the catalog's paintFor() maps colour names. */
  paint?: string;
  /** Artwork on the car (null: nothing applied). */
  placement?: Placement | null;
  /** The zone drawn as selected. */
  selectedZone?: ZoneKey | null;
  /** Zones a click on the body may select; "none" turns selection off. */
  selectableZones?: readonly ZoneKey[] | "all" | "none";
  onSelectZone?: (zone: ZoneKey) => void;
  /** Camera preset; bump presetNonce to re-run the same preset. */
  preset?: CameraPresetKey;
  presetNonce?: number;
  interactive?: boolean;
  reflection?: boolean;
  /** Draw the red highlight for the selected zone (off in "preview" mode). */
  showHighlight?: boolean;
  /** Hover highlight for selectable zones (pointer devices only). */
  hoverHighlight?: boolean;
  reducedMotion?: boolean;
  /** The renderer's device pixel ratio range. */
  dpr?: [number, number];
  onReady?: () => void;
  onError?: (error: Error) => void;
  onArtworkError?: (error: Error) => void;
  /** Fires with the camera's preset name when a preset is reached, and null when the person orbits away. */
  onViewChange?: (preset: CameraPresetKey | null) => void;
};

const DIST = { min: 4.6, max: 14 };

export default function VehicleScene(props: VehicleSceneProps) {
  const vehicle = getVehicle(props.vehicleId);
  const hero = useMemo(() => presetOf(vehicle, props.preset ?? "hero"), [vehicle, props.preset]);
  const start = useMemo(() => {
    // The camera starts a little past the preset and settles into it: a short, quiet intro.
    const framed = framePreset(hero, 1.6);
    if (props.reducedMotion) return framed.position;
    const t = new THREE.Vector3(...framed.target);
    const p = new THREE.Vector3(...framed.position).sub(t);
    p.applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(22)).multiplyScalar(1.12).add(t);
    return [p.x, p.y + 0.3, p.z] as [number, number, number];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Canvas
      className="v3d-canvas"
      frameloop="demand"
      dpr={props.dpr ?? [1, 1.5]}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 80, position: start }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; gl.outputColorSpace = THREE.SRGBColorSpace; }}
      style={{ touchAction: "none" }}
    >
      <Studio />
      <Vehicle vehicle={vehicle} {...props} />
      <OrbitControlsRig vehicle={vehicle} preset={props.preset ?? "hero"} nonce={props.presetNonce ?? 0} interactive={props.interactive ?? true} reducedMotion={!!props.reducedMotion} onViewChange={props.onViewChange} />
    </Canvas>
  );
}

function presetOf(vehicle: VehicleModel, key: CameraPresetKey) {
  return vehicle.cameras.find((c) => c.key === key) ?? vehicle.cameras[0];
}

type Goal = { position: THREE.Vector3; target: THREE.Vector3; key: CameraPresetKey };

/** Environment, intensity and lights on the scene; returns the teardown. Plain three.js so React never sees the mutation. */
function mountStudio(scene: THREE.Scene, gl: THREE.WebGLRenderer): () => void {
  const env = studioEnvironment(gl);
  scene.environment = env;
  scene.environmentIntensity = 0.9;
  const lights = new THREE.Group(); lights.name = "studio-lights";
  addStudioLights(lights as unknown as THREE.Scene);
  scene.add(lights);
  return () => { scene.environment = null; env.dispose(); scene.remove(lights); };
}

function setCursor(gl: THREE.WebGLRenderer, cursor: string) { gl.domElement.style.cursor = cursor; }

function jumpTo(camera: THREE.Camera, controls: OrbitControlsImpl | null, goal: Goal) {
  camera.position.copy(goal.position);
  if (controls) { controls.target.copy(goal.target); controls.update(); }
}

/**
 * One damped step of camera and target towards the goal; true once it has
 * arrived. The camera moves on its orbit (radius, azimuth, elevation around
 * the target), never in a straight line, so a front to rear move swings
 * around the car instead of passing through it.
 */
const _sph = new THREE.Spherical(), _goalSph = new THREE.Spherical(), _off = new THREE.Vector3();
function stepTowards(camera: THREE.Camera, controls: OrbitControlsImpl, goal: Goal, dt: number): boolean {
  const lambda = 6;
  const t = controls.target;
  _sph.setFromVector3(_off.copy(camera.position).sub(t));
  _goalSph.setFromVector3(_off.copy(goal.position).sub(goal.target));
  // shortest way round in azimuth
  let dTheta = _goalSph.theta - _sph.theta;
  dTheta = Math.atan2(Math.sin(dTheta), Math.cos(dTheta));
  const theta = _sph.theta + (dTheta - THREE.MathUtils.damp(dTheta, 0, lambda, dt));
  const phi = THREE.MathUtils.damp(_sph.phi, _goalSph.phi, lambda, dt);
  const radius = THREE.MathUtils.damp(_sph.radius, _goalSph.radius, lambda, dt);
  t.set(THREE.MathUtils.damp(t.x, goal.target.x, lambda, dt), THREE.MathUtils.damp(t.y, goal.target.y, lambda, dt), THREE.MathUtils.damp(t.z, goal.target.z, lambda, dt));
  _sph.set(radius, phi, theta);
  camera.position.setFromSpherical(_sph).add(t);
  controls.update();
  const arrived = Math.abs(dTheta) < 0.002 && Math.abs(_goalSph.phi - phi) < 0.002 && Math.abs(_goalSph.radius - radius) < 0.01 && t.distanceTo(goal.target) < 0.01;
  if (arrived) { camera.position.copy(goal.position); t.copy(goal.target); controls.update(); }
  return arrived;
}

/** Room environment for reflections plus three directional lights so the paint reads as paint. */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const teardown = mountStudio(scene, gl);
    invalidate();
    return teardown;
  }, [gl, scene]);
  return null;
}

function Vehicle({ vehicle, paint, placement, selectedZone, selectableZones = "all", onSelectZone, reflection = true, showHighlight = true, hoverHighlight = true, onReady, onError, onArtworkError }: VehicleSceneProps & { vehicle: VehicleModel }) {
  const { gl } = useThree();
  const [loaded, setLoaded] = useState<LoadedVehicle | null>(null);
  const [hover, setHover] = useState<ZoneKey | null>(null);
  const [texture, setTexture] = useState<{ url: string; tex: THREE.Texture } | null>(null);
  const decals = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.Group | null>(null);
  const paintHex = paint ?? "#B9BCC1";

  // Load (or generate) the car into the vehicle frame.
  useEffect(() => {
    let alive = true;
    let current: LoadedVehicle | null = null;
    loadVehicle(vehicle, paintHex, gl).then((v) => {
      if (!alive) { v.dispose(); return; }
      current = v; setLoaded(v); invalidate();
      // Ready once the first frame with the car has been drawn.
      requestAnimationFrame(() => requestAnimationFrame(() => { if (alive) onReady?.(); }));
    }).catch((e) => { if (alive) onError?.(e instanceof Error ? e : new Error(String(e))); });
    return () => { alive = false; current?.dispose(); setLoaded(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, paintHex, gl]);

  // Artwork texture.
  const artworkUrl = placement?.artworkUrl ?? null;
  useEffect(() => {
    if (!artworkUrl) return;
    let alive = true;
    loadArtworkTexture(artworkUrl).then((tex) => { if (alive) { setTexture({ url: artworkUrl, tex }); invalidate(); } }).catch((e) => { if (alive) { setTexture(null); onArtworkError?.(e instanceof Error ? e : new Error("Could not load the artwork.")); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkUrl]);

  // Floor: shadow and reflection follow the loaded car.
  useEffect(() => {
    if (!loaded || !decals.current) return;
    const floor = buildFloor(loaded, vehicle.dims, reflection);
    floorRef.current = floor;
    decals.current.parent?.add(floor);
    invalidate();
    return () => { disposeFloor(floor); floorRef.current = null; };
  }, [loaded, vehicle, reflection]);

  // Highlights and artwork are rebuilt whenever what they depend on changes. Cheap: a decal is a few hundred triangles.
  const selectable = useMemo(() => zonesFor(vehicle, selectableZones), [vehicle, selectableZones]);
  useEffect(() => {
    const group = decals.current;
    if (!loaded || !group) return;
    const built: THREE.Object3D[] = [];
    const sel = vehicle.zones.find((z) => z.id === selectedZone) ?? null;
    if (sel && showHighlight) built.push(buildZoneHighlight(vehicle, loaded.root, sel, 1));
    const hov = hover && hover !== selectedZone ? vehicle.zones.find((z) => z.id === hover) ?? null : null;
    if (hov) built.push(buildZoneHighlight(vehicle, loaded.root, hov, 0.5));
    const artZone = placement ? vehicle.zones.find((z) => z.id === placement.zone) ?? null : null;
    if (placement && artZone && texture && texture.url === placement.artworkUrl) {
      const art = buildArtworkDecal(vehicle, loaded.root, artZone, placement, texture.tex);
      if (art) built.push(art);
    }
    built.forEach((o) => group.add(o));
    invalidate();
    return () => { built.forEach((o) => disposeObject(o)); };
  }, [loaded, vehicle, selectedZone, hover, placement, texture, showHighlight]);

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>): PlacementZone | null => {
    if (selectable.length === 0) return null;
    return zoneAtPoint(vehicle, e.point, selectable);
  };

  if (!loaded) return <group ref={decals} />;
  return (
    <>
      <primitive
        object={loaded.root}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (selectable.length === 0 || e.delta > 6) return;
          const z = pick(e);
          if (z) { e.stopPropagation(); onSelectZone?.(z.id); }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          if (!hoverHighlight || selectable.length === 0 || e.nativeEvent.pointerType === "touch") return;
          const z = pick(e);
          const next = z ? z.id : null;
          if (next !== hover) setHover(next);
          setCursor(gl, z ? "pointer" : "grab");
        }}
        onPointerOut={() => { if (hover) setHover(null); setCursor(gl, "grab"); }}
      />
      <group ref={decals} name="decals" />
    </>
  );
}

function zonesFor(vehicle: VehicleModel, which: readonly ZoneKey[] | "all" | "none"): PlacementZone[] {
  if (which === "none") return [];
  if (which === "all") return vehicle.zones;
  return vehicle.zones.filter((z) => which.includes(z.id));
}

/**
 * Orbit with damping, no pan, the camera kept above the floor and off the
 * paint. Presets tween the camera and the target; a drag cancels the tween.
 */
function OrbitControlsRig({ vehicle, preset, nonce, interactive, reducedMotion, onViewChange }: { vehicle: VehicleModel; preset: CameraPresetKey; nonce: number; interactive: boolean; reducedMotion: boolean; onViewChange?: (p: CameraPresetKey | null) => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const aspect = size.height > 0 ? size.width / size.height : 1.9;
  const fit = framePreset(presetOf(vehicle, "hero"), aspect).fit;
  const goal = useRef<Goal | null>(null);
  const settled = useRef<CameraPresetKey | null>(null);

  useEffect(() => {
    const p = presetOf(vehicle, preset);
    const framed = framePreset(p, aspect);
    goal.current = { position: new THREE.Vector3(...framed.position), target: new THREE.Vector3(...framed.target), key: p.key };
    if (reducedMotion) {
      jumpTo(camera, controls.current, goal.current);
      goal.current = null; settled.current = p.key; onViewChange?.(p.key);
    }
    invalidate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, preset, nonce, reducedMotion]);

  useFrame((_, delta) => {
    const g = goal.current, c = controls.current;
    if (!g || !c) return;
    if (stepTowards(camera, c, g, Math.min(delta, 1 / 8))) {
      settled.current = g.key; goal.current = null; onViewChange?.(g.key);
    }
    invalidate();
  });

  return (
    <OrbitControls
      ref={controls}
      enabled={interactive}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.6}
      minDistance={DIST.min * fit}
      maxDistance={DIST.max * fit}
      minPolarAngle={Math.PI / 5}
      maxPolarAngle={Math.PI / 2.06}
      target={presetOf(vehicle, "hero").target}
      onStart={() => { goal.current = null; if (settled.current) { settled.current = null; onViewChange?.(null); } }}
      makeDefault
    />
  );
}
