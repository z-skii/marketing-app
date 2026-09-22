"use client";

import Link from "next/link";
import { useState } from "react";
import { G80_DEMO, type ZoneKey } from "@/vehicle/catalog";
import { makePlacement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";
import { VehicleZoneOverlay } from "@/vehicle/VehicleZoneOverlay";
import { VehicleThumbnail } from "@/vehicle/VehicleThumbnail";
import { DEMO_CREATIVE } from "@/vehicle/VehiclePlacementEditor";

const PAINTS: { key: string; label: string; hex: string }[] = [
  { key: "isle", label: "Isle of Man green", hex: "#1E6E72" },
  { key: "black", label: "Black", hex: "#111316" },
  { key: "white", label: "White", hex: "#E9EAEA" },
  { key: "silver", label: "Silver", hex: "#B9BCC1" },
  { key: "red", label: "Red", hex: "#8E1B1B" },
];

export function VehicleLab() {
  const [zone, setZone] = useState<ZoneKey | null>("driver_door");
  const [artwork, setArtwork] = useState(true);
  const [paint, setPaint] = useState(PAINTS[0]);
  const placement = zone && artwork ? makePlacement(zone, DEMO_CREATIVE.url) : null;
  const v = G80_DEMO;

  return (
    <div className="v3d-lab">
      <div className="ap-head" style={{ flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <h1>3D vehicle lab</h1>
          <p className="ap-sub">The shared engine on its own: rotate, zoom, tap a panel, apply the demo creative.</p>
        </div>
        <Link href="/vehicle-lab/editor" className="v3d-btn is-primary" style={{ flexShrink: 0 }}>Placement editor</Link>
      </div>

      <div className="ap-section" style={{ marginTop: 16 }}>
        <VehicleViewer vehicleId={v.id} paint={paint.hex} placement={placement} selectedZone={zone} onSelectZone={setZone} badge="demo" caption={`${v.yearStart} ${v.make} ${v.model} (${v.generation})`} eager />
        <div style={{ marginTop: 12 }}>
          <VehicleZoneOverlay vehicleId={v.id} selected={zone} onSelect={setZone} compact />
        </div>
      </div>

      <div className="ap-section" style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <button type="button" className={`v3d-chip ${artwork ? "is-on" : ""}`} aria-pressed={artwork} onClick={() => setArtwork((a) => !a)}>{artwork ? "Creative on" : "Creative off"}</button>
        {PAINTS.map((p) => (
          <button key={p.key} type="button" className={`v3d-chip ${paint.key === p.key ? "is-on" : ""}`} aria-pressed={paint.key === p.key} onClick={() => setPaint(p)}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: 6, background: p.hex, marginRight: 8, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }} />{p.label}
          </button>
        ))}
      </div>

      <section className="ap-section">
        <div className="ap-section-head"><h2>Thumbnails from the same scene</h2></div>
        <p className="ap-sub" style={{ marginBottom: 12 }}>Rendered once each by one hidden renderer, then shown as images. This is what lists and cards use.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
          {v.cameras.map((c) => (
            <div key={c.key} style={{ borderRadius: 14, overflow: "hidden", boxShadow: "var(--tm-shadow-card)" }}>
              <VehicleThumbnail vehicleId={v.id} paint={paint.hex} placement={placement} preset={c.key} width={480} height={300} alt={`${c.label} view`} />
              <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--tm-muted)" }}>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="ap-section">
        <div className="ap-section-head"><h2>What this is</h2></div>
        <div className="ap-note is-warm" style={{ alignItems: "flex-start" }}>
          <div className="ap-note-text">
            <p><b>Real 3D, placeholder body.</b> The car is a mesh rendered with WebGL; the zones are boxes on that mesh and the creative is a decal clipped to its triangles, so it follows the panel and stays attached when you rotate or zoom.</p>
            <p style={{ marginTop: 8 }}>The body itself is TapMart&apos;s own placeholder sedan at the G80&apos;s dimensions ({v.dims.length} m long, {v.dims.width} m wide, {v.dims.height} m high). A licensed BMW M3 G80 model has not been added yet; see docs/vehicles-3d.md for the asset still needed and how it drops in.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
