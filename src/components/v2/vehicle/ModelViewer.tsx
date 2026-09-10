"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows, Bounds } from "@react-three/drei";
import type { Group } from "three";

/**
 * The interactive 3D car. Loads a web-optimized GLB (built by the scan
 * pipeline), frames it, and lets people drag to rotate and pinch to zoom.
 * It makes one slow partial turn when it first appears, then rests.
 */
function Car({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const group = useRef<Group>(null);
  const turned = useRef(0);
  useFrame((_, delta) => {
    if (!group.current || turned.current >= Math.PI / 5) return;
    const step = Math.min(delta * 0.35, Math.PI / 5 - turned.current);
    group.current.rotation.y += step;
    turned.current += step;
  });
  return <primitive ref={group} object={scene} />;
}

export default function ModelViewer({ url, interactive = true }: { url: string; interactive?: boolean }) {
  useEffect(() => { useGLTF.preload(url); }, [url]);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [3.2, 1.4, 4], fov: 38 }}
      gl={{ antialias: true, powerPreference: "low-power" }}
      className="h-full w-full"
      frameloop="demand"
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.6} />
      <directionalLight position={[-4, 3, -3]} intensity={0.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.1}>
          <Car url={url} />
        </Bounds>
        <ContactShadows position={[0, -0.01, 0]} opacity={0.5} scale={8} blur={2.2} far={2} />
      </Suspense>
      <OrbitControls
        enabled={interactive}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minPolarAngle={Math.PI / 3.2}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2.5}
        maxDistance={7}
        makeDefault
      />
    </Canvas>
  );
}
