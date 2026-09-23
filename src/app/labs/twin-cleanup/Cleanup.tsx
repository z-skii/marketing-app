"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { VEHICLES } from "@/vehicle/catalog";
import { makePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";
import { CLEANUP_REPORT } from "./report";

/**
 * RAW: the Meshy GLB as delivered (Draco and WebP copy, same vertices).
 * CLAY: the same geometry under one neutral material, so only the surfaces speak.
 * CLEAN TWIN: welded, hole repaired, Taubin smoothed, split into named regions with TapMart's PBR materials.
 * The driver front door decal is the same placement on every mode.
 */
type Mode = "raw" | "clay" | "clean";
const TEST_CREATIVE = "/vehicles/tapmart-test-creative.svg";
const RAW_ID = "syn-g80-meshy-lab", CLEAN_ID = "syn-g80-meshy-clean";

export function TwinCleanup() {
  const params = useSearchParams();
  const initialMode = (["raw", "clay", "clean"] as const).find((m) => m === params.get("mode")) ?? "clean";
  const view = params.get("view");
  const initial = (["hero", "front", "driver", "rear", "passenger"] as const).find((k) => k === view) ?? "hero";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [ad, setAd] = useState(false);
  const [facts, setFacts] = useState(false);
  const vehicle = VEHICLES[mode === "clean" ? CLEAN_ID : RAW_ID];
  const placement: Placement | null = ad ? { ...makePlacement("driver_door", TEST_CREATIVE), scale: 0.82 } : null;
  const r = CLEANUP_REPORT;

  return (
    <main className="twk">
      <section className="twk-stage" aria-label="Digital twin">
        <VehicleViewer
          key={mode}
          vehicleId={vehicle.id}
          paint="#2A2D31"
          placement={placement}
          selectedZone={ad ? "driver_door" : null}
          selectableZones="none"
          showHighlight={false}
          theme="dark"
          aspect="fill"
          eager
          presets
          presetKeys={["front", "driver", "rear", "passenger"]}
          presetStyle="subtle"
          followZone={false}
          initialPreset={initial}
          clay={mode === "clay"}
          studio="premium"
          hint={false}
        />
      </section>

      <div className="twk-modes" role="group" aria-label="Mode">
        {(["raw", "clay", "clean"] as const).map((m) => (
          <button key={m} type="button" className={`twk-mode ${mode === m ? "is-on" : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "clean" ? "Clean twin" : m}</button>
        ))}
      </div>

      <div className="twk-label">
        <span className="aig-tag"><i aria-hidden />Controlled synthetic capture test</span>
        <h1 className="twk-title">Raw reconstruction to clean digital twin</h1>
        <p className="twk-sub">{mode === "raw" ? "Meshy output as delivered, its own texture." : mode === "clay" ? "Same geometry, one neutral clay material: what the mesh really is." : "Cleaned geometry, seven regions, TapMart materials. No texture from the scan."}</p>
      </div>

      <div className="twk-tools">
        <button type="button" className={`aig-btn ${ad ? "is-on" : ""}`} aria-pressed={ad} onClick={() => setAd((a) => !a)}>{ad ? "Ad off" : "Ad on"}</button>
        <button type="button" className={`aig-btn ${facts ? "is-on" : ""}`} aria-pressed={facts} onClick={() => setFacts((f) => !f)}>{facts ? "Close" : "Facts"}</button>
      </div>

      {facts && (
        <aside className="twk-facts" aria-label="What was done">
          <h2>Raw to clean</h2>
          <dl>
            <dt>Source</dt><dd>{r.source}</dd>
            <dt>Cleanup</dt><dd><ul>{r.cleanup.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt>Triangles</dt><dd>{r.triangles}</dd>
            <dt>Score</dt><dd>{r.score}</dd>
            <dt>Regions</dt><dd>{r.regions}</dd>
            <dt>Rules</dt><dd><ul>{r.rules.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt>Decal</dt><dd>{r.decal}</dd>
            <dt>Left</dt><dd><ul>{r.remaining.map((s) => <li key={s}>{s}</li>)}</ul></dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
