"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, invalidate, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { CAMERA_FOV, framePreset, frameZone, getVehicle, type CameraPresetKey, type PlacementZone, type VehicleModel, type ZoneKey } from "./catalog";
import type { Placement } from "./placement";
import { addStudioLights, buildFloor, disposeFloor, loadVehicle, studioEnvironment, type LoadedVehicle } from "./engine/scene";
import { artworkBox, buildArtworkDecal, buildZoneHighlight, disposeObject, loadArtworkTexture, textureAspect, toZoneLocal, zoneAtPoint, zonePlane } from "./engine/decals";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

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
  /** Frame this zone instead of the preset's whole-car framing (the camera comes in on the panel). */
  focusZone?: ZoneKey | null;
  interactive?: boolean;
  reflection?: boolean;
  /** Draw the red highlight for the selected zone (off in "preview" mode). */
  showHighlight?: boolean;
  /** Hover highlight for selectable zones (pointer devices only). */
  hoverHighlight?: boolean;
  reducedMotion?: boolean;
  /** The renderer's device pixel ratio range. */
  dpr?: [number, number];
  /** Diagnostic: replace every material with a neutral clay so the geometry alone is visible. */
  clay?: boolean;
  /** Studio lighting: the default studio or the stronger configurator style key, fill and rim. */
  studio?: "default" | "premium";
  onReady?: () => void;
  onError?: (error: Error) => void;
  onArtworkError?: (error: Error) => void;
  /** Direct manipulation: dragging the artwork on its panel reports new offsets (fractions, -1 to 1). */
  onPlacementDrag?: (offsetX: number, offsetY: number) => void;
  onPlacementDragEnd?: () => void;
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
      <Studio premium={props.studio === "premium"} />
      <Vehicle vehicle={vehicle} {...props} />
      <OrbitControlsRig vehicle={vehicle} preset={props.preset ?? "hero"} nonce={props.presetNonce ?? 0} focusZone={props.focusZone ?? null} interactive={props.interactive ?? true} reducedMotion={!!props.reducedMotion} onViewChange={props.onViewChange} />
    </Canvas>
  );
}

function presetOf(vehicle: VehicleModel, key: CameraPresetKey) {
  return vehicle.cameras.find((c) => c.key === key) ?? vehicle.cameras[0];
}

type Goal = { position: THREE.Vector3; target: THREE.Vector3; key: CameraPresetKey };

/** Environment, intensity and lights on the scene; returns the teardown. Plain three.js so React never sees the mutation. */
function mountStudio(scene: THREE.Scene, gl: THREE.WebGLRenderer, premium = false): () => void {
  const env = studioEnvironment(gl);
  scene.environment = env;
  scene.environmentIntensity = premium ? 0.95 : 0.9;
  const lights = new THREE.Group(); lights.name = "studio-lights";
  if (premium) addPremiumLights(lights); else addStudioLights(lights as unknown as THREE.Scene);
  scene.add(lights);
  return () => { scene.environment = null; env.dispose(); scene.remove(lights); };
}

/** Configurator style lighting: a large soft key from above and the front quarter, a soft fill, a controlled rim, a little ambient. */
function addPremiumLights(group: THREE.Group) {
  const key = new THREE.DirectionalLight("#ffffff", 1.35); key.position.set(5, 8, 6);
  const fill = new THREE.DirectionalLight("#dfe6f2", 0.45); fill.position.set(-7, 4, -2);
  const rim = new THREE.DirectionalLight("#ffffff", 0.8); rim.position.set(-3, 5, 7);
  const rim2 = new THREE.DirectionalLight("#ffffff", 0.5); rim2.position.set(4, 3, -8);
  group.add(key, fill, rim, rim2, new THREE.AmbientLight("#ffffff", 0.14));
}

/** Diagnostic clay: the same geometry under one neutral, slightly rough material, so only the surfaces speak. */
function applyClay(root: THREE.Object3D) {
  const clay = new THREE.MeshStandardMaterial({ color: "#6C6C6A", roughness: 0.8, metalness: 0.0, envMapIntensity: 0.5 });
  root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.material = clay; } });
}

function setCursor(gl: THREE.WebGLRenderer, cursor: string) { gl.domElement.style.cursor = cursor; }

/** Pause or resume orbiting while the artwork is being dragged. Plain three.js so React never sees the mutation. */
function setControlsEnabled(controls: unknown, enabled: boolean) { const c = controls as OrbitControlsImpl | null; if (c) c.enabled = enabled; }

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
function Studio({ premium = false }: { premium?: boolean }) {
  const { gl, scene } = useThree();
  useEffect(() => {
    const teardown = mountStudio(scene, gl, premium);
    invalidate();
    return teardown;
  }, [gl, scene, premium]);
  return null;
}

function Vehicle({ vehicle, paint, placement, selectedZone, selectableZones = "all", onSelectZone, reflection = true, showHighlight = true, hoverHighlight = true, onReady, onError, onArtworkError, onPlacementDrag, onPlacementDragEnd, clay = false }: VehicleSceneProps & { vehicle: VehicleModel }) {
  const { gl, controls } = useThree();
  const [loaded, setLoaded] = useState<LoadedVehicle | null>(null);
  const [hover, setHover] = useState<ZoneKey | null>(null);
  const [texture, setTexture] = useState<{ url: string; tex: THREE.Texture } | null>(null);
  const decals = useRef<THREE.Group>(null);
  const dragRef = useRef<{ zone: PlacementZone; plane: THREE.Plane; startX: number; startY: number; startOffX: number; startOffY: number; roomX: number; roomY: number } | null>(null);
  const paintHex = paint ?? "#B9BCC1";

  // Load (or generate) the car into the vehicle frame.
  useEffect(() => {
    let alive = true;
    let current: LoadedVehicle | null = null;
    loadVehicle(vehicle, paintHex, gl).then((v) => {
      if (!alive) { v.dispose(); return; }
      if (clay) applyClay(v.root);
      current = v; setLoaded(v); invalidate();
      // Ready once the first frame with the car has been drawn.
      requestAnimationFrame(() => requestAnimationFrame(() => { if (alive) onReady?.(); }));
    }).catch((e) => { if (alive) onError?.(e instanceof Error ? e : new Error(String(e))); });
    return () => { alive = false; current?.dispose(); setLoaded(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, paintHex, gl, clay]);

  // Artwork texture.
  const artworkUrl = placement?.artworkUrl ?? null;
  useEffect(() => {
    if (!artworkUrl) return;
    let alive = true;
    loadArtworkTexture(artworkUrl).then((tex) => { if (alive) { setTexture({ url: artworkUrl, tex }); invalidate(); } }).catch((e) => { if (alive) { setTexture(null); onArtworkError?.(e instanceof Error ? e : new Error("Could not load the artwork.")); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artworkUrl]);

  // Everything below works on the loaded model: zones in metres, dims as measured.
  const model = loaded?.model ?? vehicle;

  // Floor: shadow and reflection follow the loaded car.
  useEffect(() => {
    if (!loaded || !decals.current) return;
    const floor = buildFloor(loaded, loaded.model.dims, reflection);
    decals.current.parent?.add(floor);
    invalidate();
    return () => { disposeFloor(floor); };
  }, [loaded, reflection]);

  // Highlights and artwork are rebuilt whenever what they depend on changes. Cheap: a decal is a few hundred triangles.
  const selectable = useMemo(() => zonesFor(model, selectableZones), [model, selectableZones]);
  const artTexture = texture && placement && texture.url === placement.artworkUrl ? texture.tex : null;
  useEffect(() => {
    const group = decals.current;
    if (!loaded || !group) return;
    const built: THREE.Object3D[] = [];
    const sel = model.zones.find((z) => z.id === selectedZone) ?? null;
    if (sel && showHighlight) built.push(buildZoneHighlight(model, loaded.root, sel, "selected"));
    const hov = hover && hover !== selectedZone ? model.zones.find((z) => z.id === hover) ?? null : null;
    if (hov) built.push(buildZoneHighlight(model, loaded.root, hov, "hover"));
    const artZone = placement ? model.zones.find((z) => z.id === placement.zone) ?? null : null;
    if (placement && artZone && artTexture) {
      const art = buildArtworkDecal(model, loaded.root, artZone, placement, artTexture);
      if (art) built.push(art);
    }
    built.forEach((o) => group.add(o));
    invalidate();
    return () => { built.forEach((o) => disposeObject(o)); };
  }, [loaded, model, selectedZone, hover, placement, artTexture, showHighlight]);

  const pick = (e: ThreeEvent<PointerEvent | MouseEvent>): PlacementZone | null => {
    if (selectable.length === 0) return null;
    return zoneAtPoint(model, e.point, selectable);
  };

  /** Is this world point on the artwork itself (so a drag moves the artwork rather than the camera)? */
  const onArtwork = (point: THREE.Vector3): PlacementZone | null => {
    if (!placement || !artTexture || !onPlacementDrag) return null;
    const zone = model.zones.find((z) => z.id === placement.zone);
    if (!zone) return null;
    const l = toZoneLocal(zone, point);
    if (Math.abs(l.z) > zone.size[2] / 2) return null;
    const box = artworkBox(zone, placement, textureAspect(artTexture));
    return Math.abs(l.x - box.dx) <= box.hw && Math.abs(l.y - box.dy) <= box.hh ? zone : null;
  };


  if (!loaded) return <group ref={decals} />;
  return (
    <>
      <primitive
        object={loaded.root}
        onPointerDown={(e: ThreeEvent<PointerEvent>) => {
          const zone = onArtwork(e.point);
          if (!zone || !placement || !artTexture) return;
          e.stopPropagation();
          const l = toZoneLocal(zone, e.point);
          const box = artworkBox(zone, placement, textureAspect(artTexture));
          dragRef.current = { zone, plane: zonePlane(zone), startX: l.x, startY: l.y, startOffX: placement.offsetX, startOffY: placement.offsetY, roomX: Math.max(0, zone.size[0] / 2 - box.hw), roomY: Math.max(0, zone.size[1] / 2 - box.hh) };
          setControlsEnabled(controls, false);
          (e.target as Element | undefined)?.setPointerCapture?.(e.pointerId);
          setCursor(gl, "grabbing");
        }}
        onPointerUp={(e: ThreeEvent<PointerEvent>) => {
          if (!dragRef.current) return;
          dragRef.current = null;
          setControlsEnabled(controls, true);
          (e.target as Element | undefined)?.releasePointerCapture?.(e.pointerId);
          setCursor(gl, "grab");
          onPlacementDragEnd?.();
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (selectable.length === 0 || e.delta > 6) return;
          const z = pick(e);
          if (z) { e.stopPropagation(); onSelectZone?.(z.id); }
        }}
        onPointerMove={(e: ThreeEvent<PointerEvent>) => {
          const d = dragRef.current;
          if (d) {
            const hit = new THREE.Vector3();
            if (!e.ray.intersectPlane(d.plane, hit)) return;
            const l = toZoneLocal(d.zone, hit);
            const nx = d.roomX > 0 ? THREE.MathUtils.clamp(d.startOffX + (l.x - d.startX) / d.roomX, -1, 1) : 0;
            const ny = d.roomY > 0 ? THREE.MathUtils.clamp(d.startOffY + (l.y - d.startY) / d.roomY, -1, 1) : 0;
            onPlacementDrag?.(nx, ny);
            return;
          }
          if (e.nativeEvent.pointerType === "touch") return;
          if (onArtwork(e.point)) { if (hover) setHover(null); setCursor(gl, "move"); return; }
          if (!hoverHighlight || selectable.length === 0) return;
          const z = pick(e);
          const next = z ? z.id : null;
          if (next !== hover) setHover(next);
          setCursor(gl, z ? "pointer" : "grab");
        }}
        onPointerOut={() => { if (hover) setHover(null); if (!dragRef.current) setCursor(gl, "grab"); }}
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
function OrbitControlsRig({ vehicle, preset, nonce, focusZone, interactive, reducedMotion, onViewChange }: { vehicle: VehicleModel; preset: CameraPresetKey; nonce: number; focusZone: ZoneKey | null; interactive: boolean; reducedMotion: boolean; onViewChange?: (p: CameraPresetKey | null) => void }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const aspect = size.height > 0 ? size.width / size.height : 1.9;
  const fit = framePreset(presetOf(vehicle, "hero"), aspect).fit;
  const goal = useRef<Goal | null>(null);
  const settled = useRef<CameraPresetKey | null>(null);

  useEffect(() => {
    const p = presetOf(vehicle, preset);
    const fz = focusZone ? vehicle.zones.find((z) => z.id === focusZone) : null;
    const framed = fz && fz.camera === p.key ? frameZone(vehicle, fz, aspect) : framePreset(p, aspect);
    goal.current = { position: new THREE.Vector3(...framed.position), target: new THREE.Vector3(...framed.target), key: p.key };
    if (reducedMotion) {
      jumpTo(camera, controls.current, goal.current);
      goal.current = null; settled.current = p.key; onViewChange?.(p.key);
    }
    invalidate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, preset, nonce, focusZone, reducedMotion]);

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
