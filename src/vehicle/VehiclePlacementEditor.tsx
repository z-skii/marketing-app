"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getVehicle, paintFor, type PlacementZone, type ZoneKey } from "./catalog";
import { DEFAULT_PLACEMENT, makePlacement, normalizePlacement, readPlacement, type Placement } from "./placement";
import { VehicleViewer } from "./VehicleViewer";
import { shortLabel } from "./VehicleZoneOverlay";
import { FsUploader } from "@/components/fs/work/Uploader";

/**
 * The placement editor: the 3D car with the creative on the real panel,
 * and the few controls a business needs. Desktop: the car large on the
 * left, controls on the right. Phone: the car on top, the controls in a
 * sheet at the bottom that can be pulled up or tucked away. Every change
 * redraws the decal on the mesh immediately.
 */
export const DEMO_CREATIVE = { url: "/vehicles/tapmart-demo-ad.svg", label: "TapMart demo creative" };

export type Creative = { url: string; label?: string };

export type VehiclePlacementEditorProps = {
  vehicleId?: string;
  /** A colour name ("black") or hex. */
  color?: string | null;
  initial?: unknown;
  /** Creatives to offer; the demo creative is always available. */
  creatives?: Creative[];
  allowedZones?: readonly ZoneKey[] | "all";
  /** Persist to the server; the editor also keeps a local copy under storageKey. */
  onSave?: (placement: Placement) => Promise<void> | void;
  onChange?: (placement: Placement) => void;
  storageKey?: string;
  allowUpload?: boolean;
  uploadFolder?: string;
  saveLabel?: string;
  badge?: "demo" | "preview" | "confirmed" | null;
  caption?: string | null;
};

export function VehiclePlacementEditor({
  vehicleId, color, initial, creatives = [], allowedZones = "all", onSave, onChange, storageKey, allowUpload = true, uploadFolder = "car-artwork", saveLabel = "Save placement", badge = "demo", caption = null,
}: VehiclePlacementEditorProps) {
  const vehicle = getVehicle(vehicleId);
  const zones: PlacementZone[] = useMemo(() => allowedZones === "all" ? vehicle.zones : vehicle.zones.filter((z) => allowedZones.includes(z.id)), [vehicle, allowedZones]);
  const firstZone = zones[0]?.id ?? vehicle.zones[0].id;
  const paint = color && color.startsWith("#") ? color : paintFor(color);

  const [placement, setPlacement] = useState<Placement>(() => readPlacement(initial, firstZone, DEMO_CREATIVE.url, vehicle.id) ?? makePlacement(firstZone, DEMO_CREATIVE.url));
  const [library, setLibrary] = useState<Creative[]>(() => dedupe([DEMO_CREATIVE, ...creatives]));
  const [preview, setPreview] = useState(false);
  const [sheet, setSheet] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);

  // Phones start with the sheet tucked away so the car is seen first; opening it scrolls the car to the top so both fit.
  useEffect(() => {
    const id = window.setTimeout(() => { if (window.matchMedia("(max-width: 1023px)").matches) setSheet(false); }, 0);
    return () => window.clearTimeout(id);
  }, []);
  const toggleSheet = () => {
    setSheet((open) => {
      const next = !open;
      if (next && window.matchMedia("(max-width: 1023px)").matches) {
        window.requestAnimationFrame(() => {
          const el = stageRef.current; if (!el) return;
          const r = el.getBoundingClientRect();
          const sheetTop = window.innerHeight - 84 - Math.min(window.innerHeight * 0.42, 420);
          if (r.top < 0 || r.bottom > sheetTop) el.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        });
      }
      return next;
    });
  };
  const [saving, setSaving] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // A local copy so a reload keeps the work in progress.
  useEffect(() => {
    if (!storageKey || initial) return;
    const id = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { placement?: unknown; library?: Creative[] };
        const p = readPlacement(parsed.placement, firstZone, DEMO_CREATIVE.url, vehicle.id);
        if (p && zones.some((z) => z.id === p.zone)) setPlacement(p);
        if (Array.isArray(parsed.library)) setLibrary((l) => dedupe([...l, ...parsed.library!.filter((c) => typeof c?.url === "string")]));
      } catch { /* storage may be unavailable */ }
    }, 0);
    return () => window.clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const update = useCallback((patch: Partial<Placement>) => {
    setPlacement((p) => { const next = normalizePlacement({ ...p, ...patch }); onChange?.(next); return next; });
    setSaving("idle");
  }, [onChange]);

  const selectZone = useCallback((zone: ZoneKey) => { if (zones.some((z) => z.id === zone)) update({ zone }); }, [zones, update]);

  const reset = () => update({ ...DEFAULT_PLACEMENT });

  const save = async () => {
    setSaving("saving"); setSaveError(null);
    try {
      if (storageKey) { try { window.localStorage.setItem(storageKey, JSON.stringify({ placement, library: library.filter((c) => c.url !== DEMO_CREATIVE.url) })); } catch { /* ignore */ } }
      await onSave?.(placement);
      setSaving("saved");
    } catch (e) {
      setSaving("error"); setSaveError(e instanceof Error ? e.message : "Could not save.");
    }
  };

  const zone = vehicle.zones.find((z) => z.id === placement.zone) ?? null;
  const sides = useMemo(() => groupBySide(zones), [zones]);

  return (
    <div className={`v3d-editor ${preview ? "is-preview" : ""} ${sheet ? "is-sheet-open" : ""}`}>
      <div className="v3d-editor-stage" ref={stageRef}>
        <VehicleViewer
          vehicleId={vehicle.id}
          paint={paint}
          placement={placement.artworkUrl ? placement : null}
          selectedZone={placement.zone}
          selectableZones={zones.map((z) => z.id)}
          onSelectZone={selectZone}
          showHighlight={!preview}
          badge={badge}
          caption={caption}
          aspect="fill"
          eager
        >
          <div className="v3d-editor-mode">
            <button type="button" className={`v3d-chip ${!preview ? "is-on" : ""}`} aria-pressed={!preview} onClick={() => setPreview(false)}>Edit</button>
            <button type="button" className={`v3d-chip ${preview ? "is-on" : ""}`} aria-pressed={preview} onClick={() => setPreview(true)}>Preview</button>
          </div>
        </VehicleViewer>
      </div>

      <aside className="v3d-editor-panel" aria-label="Placement controls">
        <button type="button" className="v3d-sheet-handle" aria-expanded={sheet} onClick={toggleSheet}>
          <span className="v3d-sheet-grip" aria-hidden />
          <span>{sheet ? "Hide controls" : "Adjust placement"}</span>
        </button>

        <div className="v3d-panel-body">
          <section className="v3d-panel-group">
            <h3 className="v3d-panel-title">Creative</h3>
            <div className="v3d-creatives">
              {library.map((c) => (
                <button key={c.url} type="button" className={`v3d-creative ${placement.artworkUrl === c.url ? "is-on" : ""}`} aria-pressed={placement.artworkUrl === c.url} onClick={() => update({ artworkUrl: c.url })} title={c.label ?? "Creative"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.url} alt={c.label ?? "Creative"} />
                </button>
              ))}
              {allowUpload && (
                <div className="v3d-creative is-upload">
                  <FsUploader folder={uploadFolder} label="Upload" id={`v3d-upload-${storageKey ?? "editor"}`} onUploaded={(urls) => { const added = urls.map((url) => ({ url, label: "Uploaded creative" })); setLibrary((l) => dedupe([...l, ...added])); if (urls[0]) update({ artworkUrl: urls[0] }); }} />
                </div>
              )}
            </div>
            <p className="v3d-panel-note">PNG, JPG or SVG. It is printed as vinyl and follows the panel.</p>
          </section>

          <section className="v3d-panel-group">
            <h3 className="v3d-panel-title">Placement</h3>
            {sides.map(([side, list]) => (
              <div key={side} className="v3d-side">
                <span className="v3d-side-label">{sideLabel(side)}</span>
                <div className="v3d-zones is-compact">
                  {list.map((z) => (
                    <button key={z.id} type="button" role="radio" aria-checked={placement.zone === z.id} className={`v3d-zone ${placement.zone === z.id ? "is-on" : ""}`} onClick={() => selectZone(z.id)}>
                      <span className="v3d-zone-dot" aria-hidden />{shortLabel(z)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="v3d-panel-note">Or tap the panel on the car.</p>
          </section>

          <section className="v3d-panel-group">
            <h3 className="v3d-panel-title">Adjust{zone ? <span className="v3d-panel-sub">{zone.label}</span> : null}</h3>
            <Range label="Size" value={placement.scale} min={0.25} max={1} step={0.01} display={`${Math.round(placement.scale * 100)}%`} onChange={(v) => update({ scale: v })} />
            <Range label="Horizontal" value={placement.offsetX} min={-1} max={1} step={0.01} display={signed(placement.offsetX)} onChange={(v) => update({ offsetX: v })} />
            <Range label="Vertical" value={placement.offsetY} min={-1} max={1} step={0.01} display={signed(placement.offsetY)} onChange={(v) => update({ offsetY: v })} />
            <Range label="Rotation" value={placement.rotation} min={-15} max={15} step={0.5} display={`${placement.rotation > 0 ? "+" : ""}${placement.rotation}°`} onChange={(v) => update({ rotation: v })} />
          </section>
        </div>

        <div className="v3d-panel-actions">
          <button type="button" className="v3d-btn" onClick={reset}>Reset</button>
          <button type="button" className={`v3d-btn ${preview ? "is-on" : ""}`} aria-pressed={preview} onClick={() => setPreview((p) => !p)}>{preview ? "Editing off" : "Preview"}</button>
          <button type="button" className="v3d-btn is-primary" onClick={save} disabled={saving === "saving"}>
            {saving === "saving" ? "Saving" : saving === "saved" ? "Saved" : saveLabel}
          </button>
        </div>
        {saveError && <p className="v3d-panel-error" role="alert">{saveError}</p>}
      </aside>
    </div>
  );
}

function Range({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }) {
  const id = `v3d-range-${label.toLowerCase()}`;
  return (
    <label className="v3d-range" htmlFor={id}>
      <span className="v3d-range-head"><span>{label}</span><output>{display}</output></span>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

function signed(v: number): string {
  const pct = Math.round(v * 100);
  return pct === 0 ? "Centre" : `${pct > 0 ? "+" : ""}${pct}`;
}

function dedupe(list: Creative[]): Creative[] {
  const seen = new Set<string>();
  return list.filter((c) => { if (!c.url || seen.has(c.url)) return false; seen.add(c.url); return true; });
}

function groupBySide(zones: PlacementZone[]): [PlacementZone["side"], PlacementZone[]][] {
  const order: PlacementZone["side"][] = ["driver", "passenger", "rear", "top", "front"];
  return order.map((s) => [s, zones.filter((z) => z.side === s)] as [PlacementZone["side"], PlacementZone[]]).filter(([, l]) => l.length > 0);
}

function sideLabel(side: PlacementZone["side"]): string {
  return side === "driver" ? "Driver side" : side === "passenger" ? "Passenger side" : side === "rear" ? "Rear" : side === "top" ? "Hood" : "Front";
}
