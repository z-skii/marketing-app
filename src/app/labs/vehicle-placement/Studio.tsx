"use client";

import { useCallback, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { G80_ATTRIBUTION, getVehicle, LAB_VEHICLE_ID, VEHICLES, type ZoneKey } from "@/vehicle/catalog";
import { makePlacement, normalizePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";

/**
 * The placement studio: the car is the interface. Drag to orbit, pinch or
 * scroll to zoom, tap a door to select it, and the creative is projected
 * onto that door as a decal that follows its curvature and stays attached
 * under rotation. Desktop: the car takes about three quarters of the
 * width with a quiet side panel. Phone: the car fills most of the first
 * screen and the few controls live in a bottom sheet.
 */
export const TEST_CREATIVE = { url: "/vehicles/tapmart-test-creative.svg", label: "Demo Coffee Co. door ad" };
const PAINT = "#2A2D31";

export function PlacementStudio() {
  const params = useSearchParams();
  const wanted = params.get("v");
  const vehicle = getVehicle(wanted && VEHICLES[wanted] ? wanted : LAB_VEHICLE_ID);
  const [zone, setZone] = useState<ZoneKey | null>(null);
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [creative, setCreative] = useState<{ url: string; label: string }>(TEST_CREATIVE);
  const [preview, setPreview] = useState(false);
  const [more, setMore] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const zoneMeta = zone ? vehicle.zones.find((z) => z.id === zone) ?? null : null;

  const select = useCallback((z: ZoneKey) => {
    setZone(z);
    setTouched(true);
    setDone(false);
    setPlacement((p) => (p && p.zone === z ? p : makePlacement(z, creative.url)));
  }, [creative.url]);

  const update = useCallback((patch: Partial<Placement>) => {
    setDone(false);
    setPlacement((p) => (p ? normalizePlacement({ ...p, ...patch }) : p));
  }, []);

  const onFile = (file: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCreative({ url, label: file.name });
    setPlacement((p) => (p ? { ...p, artworkUrl: url } : p));
    setDone(false);
  };

  const facts = vehicle.assetFacts;
  const isG80 = vehicle.make === "BMW" && vehicle.asset.kind === "glb";
  const credit = vehicle.license.attributionRequired;
  const shortcuts = vehicle.cameras.filter((c) => c.key !== "hero").map((c) => c.key);
  const scale = placement?.scale ?? 0.82;

  const controls = (
    <>
      <div className="lab-row">
        <div>
          <p className="lab-label">Selected</p>
          <p className={`lab-value ${zoneMeta ? "" : "is-empty"}`}>{zoneMeta ? zoneMeta.label : "Tap a door on the car"}</p>
        </div>
        <div className="lab-creative">
          <span className="lab-creative-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creative.url} alt="" />
          </span>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          <button type="button" className="lab-btn" onClick={() => fileRef.current?.click()}>Change</button>
        </div>
      </div>

      <div className={`lab-controls ${placement ? "" : "is-off"}`} aria-disabled={!placement}>
        <Range label="Size" value={scale} min={0.25} max={1} step={0.01} display={`${Math.round(scale * 100)}%`} onChange={(v) => update({ scale: v })} />
        <div className="lab-pair">
          <Range label="Across" value={placement?.offsetX ?? 0} min={-1} max={1} step={0.01} display={pos(placement?.offsetX ?? 0)} onChange={(v) => update({ offsetX: v })} />
          <Range label="Up and down" value={placement?.offsetY ?? 0} min={-1} max={1} step={0.01} display={pos(placement?.offsetY ?? 0)} onChange={(v) => update({ offsetY: v })} />
        </div>
        <p className="lab-hint">Or drag the artwork on the door. It cannot leave the door.</p>
      </div>
      {more && (
        <div className="lab-advanced">
          <div className={placement ? "" : "lab-controls is-off"} aria-disabled={!placement}>
            <Range label="Rotation" value={placement?.rotation ?? 0} min={-15} max={15} step={0.5} display={`${(placement?.rotation ?? 0) > 0 ? "+" : ""}${placement?.rotation ?? 0}\u00B0`} onChange={(v) => update({ rotation: v })} />
          </div>
          <label className="lab-row" style={{ minHeight: 0 }}>
            <span className="lab-hint">Door, if tapping is hard</span>
            <select className="lab-select" aria-label="Choose a door" value={zone ?? ""} onChange={(e) => { if (e.target.value) select(e.target.value as ZoneKey); }}>
              <option value="">Pick a door</option>
              {vehicle.zones.map((z) => <option key={z.id} value={z.id}>{z.label}</option>)}
            </select>
          </label>
          <div className="lab-more">
            <button type="button" className={`lab-btn is-quiet ${preview ? "is-on" : ""}`} aria-pressed={preview} onClick={() => setPreview((p) => !p)}>{preview ? "Show outline" : "Hide outline"}</button>
            <button type="button" className="lab-btn is-quiet" onClick={() => update({ scale: 0.82, offsetX: 0, offsetY: 0, rotation: 0 })}>Reset</button>
          </div>
        </div>
      )}

      <div className="lab-actions">
        <button type="button" className="lab-btn is-quiet" onClick={() => setMore((m) => !m)}>{more ? "Less" : "More"}</button>
        <button type="button" className="lab-btn is-primary" disabled={!placement} onClick={() => setDone(true)}>Continue</button>
      </div>
      {done && placement && zoneMeta && (
        <p className="lab-done"><b>Saved for this demo.</b> {zoneMeta.label}, {Math.round(placement.scale * 100)}% of the door, {pos(placement.offsetX).toLowerCase()} across, {pos(placement.offsetY).toLowerCase()} up and down.</p>
      )}
    </>
  );

  return (
    <div className={`lab ${sheet ? "is-sheet-open" : ""}`}>
      <header className="lab-top">
        <div>
          <p className="lab-kicker"><b>Car advertising</b> · Step 2 of 9</p>
          <h1 className="lab-title">Placement</h1>
        </div>
        <span className="lab-mark" aria-label="TapMart"><i aria-hidden />TapMart</span>
      </header>

      <div className="lab-grid">
        <section className="lab-stage" aria-label="3D vehicle">
          <VehicleViewer
            vehicleId={vehicle.id}
            paint={PAINT}
            placement={placement}
            selectedZone={zone}
            selectableZones="all"
            onSelectZone={select}
            onPlacementDrag={(x, y) => update({ offsetX: x, offsetY: y })}
            showHighlight={!preview}
            badge={isG80 ? "demo" : "preview"}
            caption={isG80 ? "BMW M3 (G80), prototype model" : "Temporary mesh, G80 file pending"}
            presets
            presetKeys={shortcuts}
            presetStyle="subtle"
            aspect="fill"
            eager
            followZone
            focusSelected
          />
          {!touched && <span className="lab-tip">Drag to look around. Tap a door to place the ad.</span>}
        </section>

        <aside className={`lab-panel ${sheet ? "is-open" : ""}`} aria-label="Placement">
          <button type="button" className="lab-sheet-handle" aria-expanded={sheet} onClick={() => setSheet((s) => !s)}>
            <span className="lab-sheet-grip" aria-hidden />
            <span>{sheet ? "Hide" : zoneMeta ? `${zoneMeta.label} · adjust` : "Adjust the ad"}</span>
          </button>
          <div className="lab-panel-body">{controls}</div>
        </aside>
      </div>

      {credit && (
        <p className="lab-credit">
          Model: <a href={G80_ATTRIBUTION.modelUrl} target="_blank" rel="noreferrer">{G80_ATTRIBUTION.text}</a>. Prototype only; not endorsed by BMW and not cleared for production use.
        </p>
      )}

      <footer className="lab-facts">
        <h2>What is on screen</h2>
        <dl>
          <dt>Rendering</dt><dd>WebGL through three.js and React Three Fiber. The car is triangle geometry in a GLB file, not an image.</dd>
          <dt>Model</dt><dd>{vehicle.asset.kind === "glb" ? vehicle.asset.url : "generated in code"} · {vehicle.make} {vehicle.model}</dd>
          <dt>Source</dt><dd>{vehicle.license.source}</dd>
          <dt>Licence</dt><dd>{vehicle.license.license}. {vehicle.license.notes}</dd>
          {facts && <><dt>Geometry</dt><dd>{facts.triangles.toLocaleString()} triangles in {facts.meshes} mesh{facts.meshes === 1 ? "" : "es"}, textures {facts.textures}, file {(facts.fileBytes / 1024 / 1024).toFixed(2)} MB.</dd></>}
          <dt>Artwork</dt><dd>{facts?.technique ?? "THREE.DecalGeometry projected onto the door triangles inside the selected zone box, so it follows the panel and never leaves it."}</dd>
          <dt>Highlight</dt><dd>The same decal technique: a fill and a shader outline clipped to the door geometry.</dd>
          {!isG80 && <><dt className="is-warn">Asset</dt><dd className="is-warn">The G80 file has not been supplied yet; this is the temporary engineering mesh.</dd></>}
        </dl>
      </footer>
    </div>
  );
}

function pos(v: number): string {
  const pct = Math.round(v * 100);
  return pct === 0 ? "Centred" : `${pct > 0 ? "+" : ""}${pct}`;
}

function Range({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  const id = `lab-range-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label className="v3d-range" htmlFor={id}>
      <span className="v3d-range-head"><span>{label}</span><output>{display}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
