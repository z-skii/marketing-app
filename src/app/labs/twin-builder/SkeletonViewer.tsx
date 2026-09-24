"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, invalidate, useThree } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ANGLES, STATUS_COLOUR, type Skeleton, type SkeletonCamera } from "./types";

/**
 * Interactive 3D view of the fitted curve network. Lines only: this stage has no surfaces by design.
 * Colour by fit status or by structural group. A source view lock puts the camera exactly where the fitter
 * placed it for that image, so the live skeleton can be compared with the photo behind the canvas.
 */
const TARGET: [number, number, number] = [0, 0.65, 0];
const TYRE_HALF = 0.135;
const GROUP_COLOURS = ["#5ee08a", "#ffb347", "#3d9bff", "#ff5a5a", "#e879f9", "#22d3ee", "#facc15", "#a3e635", "#fb923c", "#c084fc", "#f472b6", "#34d399", "#60a5fa", "#f87171", "#fbbf24", "#2dd4bf", "#a78bfa", "#fda4af"];

export type ColourMode = "status" | "group";

function anglePosition(az: number, el: number, dist: number): [number, number, number] {
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  return [TARGET[0] + Math.cos(e) * Math.cos(a) * dist, TARGET[1] + Math.sin(e) * dist, TARGET[2] + Math.cos(e) * Math.sin(a) * dist];
}

function groupOf(skeleton: Skeleton, name: string): number {
  const keys = Object.keys(skeleton.groups);
  for (let i = 0; i < keys.length; i++) if (skeleton.groups[keys[i]].curves.includes(name)) return i;
  return keys.length;
}

/** Puts a perspective camera at a pose (outside the component so the mutation is explicit, as VehicleScene does). */
function placeCamera(camera: THREE.Camera, position: number[], fov: number) {
  const cam = camera as THREE.PerspectiveCamera;
  cam.position.set(position[0], position[1], position[2]);
  if (cam.isPerspectiveCamera) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

function Rig({ angle, lock }: { angle: string; lock: SkeletonCamera | null }) {
  const get = useThree((s) => s.get);
  const size = useThree((s) => s.size);
  const controls = useRef<OrbitControlsImpl | null>(null);
  useEffect(() => {
    const camera = get().camera;
    if (lock) {
      placeCamera(camera, lock.position, lock.fov);
      controls.current?.target.set(lock.target[0], lock.target[1], lock.target[2]);
    } else {
      const a = ANGLES[angle] ?? ANGLES.front34;
      placeCamera(camera, anglePosition(a.az, a.el, a.dist), 27);
      controls.current?.target.set(TARGET[0], TARGET[1], TARGET[2]);
    }
    controls.current?.update();
    invalidate();
  }, [angle, lock, get, size.width, size.height]);
  return <OrbitControls ref={controls} enabled={!lock} enableDamping={false} minDistance={2} maxDistance={20} makeDefault onChange={() => invalidate()} />;
}

function Curves({ skeleton, mode, hidden, selected, onSelect }: { skeleton: Skeleton; mode: ColourMode; hidden: Set<string>; selected: string | null; onSelect: (n: string | null) => void }) {
  const items = useMemo(() => skeleton.curves.map((c) => {
    const pts = c.samples.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    if (c.closed && pts.length) pts.push(pts[0].clone());
    return { c, pts };
  }), [skeleton]);
  return (
    <group>
      {items.map(({ c, pts }) => {
        if (hidden.has(c.status)) return null;
        const colour = mode === "status" ? STATUS_COLOUR[c.status] : GROUP_COLOURS[groupOf(skeleton, c.name) % GROUP_COLOURS.length];
        const isSel = selected === c.name;
        return (
          <Line
            key={c.name}
            points={pts}
            color={isSel ? "#ffffff" : colour}
            lineWidth={isSel ? 3 : c.status === "prior" ? 1.2 : 1.8}
            dashed={c.status === "prior"}
            dashSize={0.05}
            gapSize={0.03}
            onClick={(e) => { e.stopPropagation(); onSelect(isSel ? null : c.name); }}
          />
        );
      })}
    </group>
  );
}

function Wheels({ skeleton }: { skeleton: Skeleton }) {
  const rings = useMemo(() => {
    const out: { pts: THREE.Vector3[]; colour: string; width: number }[] = [];
    for (const [key, w] of Object.entries(skeleton.wheels)) {
      const side = key.endsWith("left") ? 1 : -1;
      for (const [r, colour, width] of [[w.tyre_r, "#ffd84a", 1.6], [w.rim_r, "#a9adb5", 1]] as const) {
        for (const off of [TYRE_HALF, -TYRE_HALF]) {
          const pts: THREE.Vector3[] = [];
          for (let i = 0; i <= 48; i++) { const t = (i / 48) * Math.PI * 2; pts.push(new THREE.Vector3(w.centre[0] + r * Math.cos(t), w.centre[1] + r * Math.sin(t), w.centre[2] + side * off)); }
          out.push({ pts, colour, width });
        }
      }
      out.push({ pts: [new THREE.Vector3(w.centre[0], w.centre[1], w.centre[2] + side * TYRE_HALF), new THREE.Vector3(w.centre[0], w.centre[1], w.centre[2] - side * TYRE_HALF)], colour: "#ffd84a", width: 1 });
    }
    return out;
  }, [skeleton]);
  return <group>{rings.map((r, i) => <Line key={i} points={r.pts} color={r.colour} lineWidth={r.width} />)}</group>;
}

function Ground() {
  return (
    <group>
      <gridHelper args={[10, 20, "#2a2e34", "#1c1f24"]} position={[0, 0, 0]} />
      <Line points={[[-2.6, 0.002, 0], [2.6, 0.002, 0]]} color="#3a3f47" lineWidth={1} />
      <Line points={[[2.4, 0.002, 0], [2.25, 0.002, 0.1], [2.25, 0.002, -0.1], [2.4, 0.002, 0]]} color="#6b7280" lineWidth={1} />
    </group>
  );
}

export function SkeletonViewer({ skeleton, angle, lock, mode, hidden, selected, onSelect, transparent }: {
  skeleton: Skeleton; angle: string; lock: SkeletonCamera | null; mode: ColourMode; hidden: Set<string>; selected: string | null; onSelect: (n: string | null) => void; transparent: boolean;
}) {
  const [ready, setReady] = useState(false);
  return (
    <Canvas
      className={`twb-canvas ${ready ? "is-ready" : ""}`}
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ fov: 27, near: 0.1, far: 80, position: anglePosition(40, 10, 8.6) }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl }) => { gl.setClearColor(0x000000, transparent ? 0 : 1); setReady(true); }}
      onPointerMissed={() => onSelect(null)}
    >
      {!transparent && <color attach="background" args={["#0f1113"]} />}
      <Rig angle={angle} lock={lock} />
      {!lock && <Ground />}
      <Curves skeleton={skeleton} mode={mode} hidden={hidden} selected={selected} onSelect={onSelect} />
      <Wheels skeleton={skeleton} />
    </Canvas>
  );
}
