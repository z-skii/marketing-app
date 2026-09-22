"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVehicle, type CameraPresetKey, type ZoneKey } from "./catalog";
import type { VehicleSceneProps } from "./VehicleScene";

const VehicleScene = dynamic(() => import("./VehicleScene"), { ssr: false, loading: () => null });

/**
 * The vehicle on stage: the 3D scene with everything a person needs
 * around it and nothing they do not. Mounts WebGL only once it is on
 * screen, shows a quiet loading state, falls back honestly when the
 * browser has no WebGL, and never labels the demo car as someone's own.
 *
 *   badge "demo":      TapMart's demonstration vehicle.
 *   badge "preview":   a 3D preview standing in for a real car (My Cars).
 *   badge "confirmed": the person's confirmed vehicle model.
 */
export type VehicleBadge = "demo" | "preview" | "confirmed" | null;

/** Extra viewer options live on VehicleViewerProps below. */
export type VehicleViewerProps = Omit<VehicleSceneProps, "onReady" | "onError" | "preset" | "presetNonce" | "reducedMotion" | "onViewChange"> & {
  badge?: VehicleBadge;
  /** Text under the badge, e.g. "2023 BMW M3 Competition". */
  caption?: string | null;
  /** Show the camera preset chips. */
  presets?: boolean;
  /** Which presets to offer and how loudly ("subtle": small, bottom right, no Hero). */
  presetKeys?: CameraPresetKey[];
  presetStyle?: "chips" | "subtle";
  /** Initial camera preset. */
  initialPreset?: CameraPresetKey;
  /** Fired when a person chooses a preset chip or a zone moves the camera. */
  aspect?: "hero" | "wide" | "square" | "fill";
  className?: string;
  /** Rendered above the scene, bottom left (e.g. the zone overlay). */
  children?: React.ReactNode;
  /** Load as soon as mounted instead of when scrolled into view. */
  eager?: boolean;
  /** Turn the camera to the zone's preset whenever selectedZone changes. */
  followZone?: boolean;
  /** Bring the camera in on the selected zone when its preset is used. */
  focusSelected?: boolean;
  /** The stage behind the car: light studio (default) or the dark hero stage. */
  theme?: "light" | "dark";
  /** Show the "Drag to rotate" hint. */
  hint?: boolean;
};

const PRESET_ORDER: CameraPresetKey[] = ["hero", "front", "driver", "rear", "passenger"];

export function VehicleViewer({ badge = null, caption = null, presets = true, presetKeys, presetStyle = "chips", initialPreset = "hero", aspect = "hero", className = "", children, eager = false, followZone = true, theme = "light", hint = true, focusSelected = false, selectedZone, onSelectZone, ...scene }: VehicleViewerProps) {
  const vehicle = getVehicle(scene.vehicleId);
  const host = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(eager);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [preset, setPreset] = useState<CameraPresetKey>(initialPreset);
  const [nonce, setNonce] = useState(0);
  const [view, setView] = useState<CameraPresetKey | null>(null);
  const [artworkError, setArtworkError] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => { const id = window.setTimeout(() => setWebgl(hasWebGL()), 0); return () => window.clearTimeout(id); }, []);

  useEffect(() => {
    if (mounted) return;
    const el = host.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { const id = window.setTimeout(() => setMounted(true), 0); return () => window.clearTimeout(id); }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setMounted(true); io.disconnect(); } }, { rootMargin: "200px 0px", threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  // Pause when scrolled far away: unmounting would lose the person's angle, so the scene simply stops being invalidated (demand loop). Nothing to do here.

  const go = useCallback((key: CameraPresetKey) => { setPreset(key); setNonce((n) => n + 1); }, []);

  useEffect(() => {
    if (!followZone || !selectedZone) return;
    const z = vehicle.zones.find((x) => x.id === selectedZone);
    if (!z) return;
    const id = window.setTimeout(() => go(z.camera), 0);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, followZone]);

  const chips = useMemo(() => (presetKeys ?? PRESET_ORDER).map((k) => vehicle.cameras.find((c) => c.key === k)).filter(Boolean) as typeof vehicle.cameras, [vehicle, presetKeys]);
  const badgeText = badge === "demo" ? "Demo vehicle" : badge === "preview" ? "3D preview" : badge === "confirmed" ? "Your car" : null;

  return (
    <div ref={host} className={`v3d-stage is-${aspect} is-${theme} ${ready ? "is-ready" : ""} ${className}`} data-vehicle={vehicle.id}>
      {webgl === false ? (
        <Fallback title="3D preview unavailable" text="This browser cannot show 3D. The car, the placement and the size are still saved." />
      ) : error ? (
        <Fallback title="Could not load the 3D vehicle" text={error} />
      ) : mounted ? (
        <VehicleScene
          {...scene}
          selectedZone={selectedZone}
          onSelectZone={onSelectZone}
          preset={preset}
          presetNonce={nonce}
          focusZone={focusSelected ? selectedZone ?? null : null}
          reducedMotion={reducedMotion}
          onReady={() => setReady(true)}
          onError={(e) => setError(e.message)}
          onArtworkError={() => setArtworkError(true)}
          onViewChange={setView}
        />
      ) : null}

      {!ready && webgl !== false && !error && (
        <div className="v3d-loading" aria-live="polite">
          <span className="v3d-loading-car" aria-hidden />
          <span>Loading 3D vehicle</span>
        </div>
      )}

      {(badgeText || caption) && (
        <div className="v3d-badge">
          {badgeText && <span className={`v3d-badge-tag is-${badge}`}>{badgeText}</span>}
          {caption && <span className="v3d-badge-caption">{caption}</span>}
        </div>
      )}

      {artworkError && <span className="v3d-toast" role="status">The creative could not be shown on the car.</span>}

      {children && <div className="v3d-overlay">{children}</div>}

      {ready && hint && scene.interactive !== false && (
        <span className="v3d-hint" aria-hidden>Drag to rotate</span>
      )}

      {presets && ready && (
        <div className={`v3d-presets is-${presetStyle}`} role="group" aria-label="Camera angle">
          {chips.map((c) => (
            <button key={c.key} type="button" className={`v3d-chip ${view === c.key ? "is-on" : ""}`} aria-pressed={view === c.key} onClick={() => go(c.key)}>{c.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A named export so call sites can write Vehicle3D as the spec does. */
export const Vehicle3D = VehicleViewer;

function Fallback({ title, text }: { title: string; text: string }) {
  return (
    <div className="v3d-fallback" role="status">
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export type { ZoneKey };
