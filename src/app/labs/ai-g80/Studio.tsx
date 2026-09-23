"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AI_G80, AI_G80_REPORT, VEHICLES } from "@/vehicle/catalog";
import { makePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";

/**
 * AI 3D TEST. A dark studio and the reconstructed car, nearly edge to
 * edge. Drag to orbit, pinch or scroll to zoom, four view chips. One test
 * ad on the driver front door when the geometry earned it, and a facts
 * sheet that says exactly what made this mesh and what is wrong with it.
 */
const TEST_CREATIVE = "/vehicles/tapmart-test-creative.svg";

export function AiG80Studio() {
  const params = useSearchParams();
  const wanted = params.get("v");
  const view = params.get("view");
  const initial = (["hero", "front", "driver", "rear", "passenger"] as const).find((k) => k === view) ?? "hero";
  const vehicle = wanted && VEHICLES[wanted] ? VEHICLES[wanted] : AI_G80;
  const [ad, setAd] = useState(false);
  const [facts, setFacts] = useState(false);
  const door = vehicle.zones.find((z) => z.id === "driver_door") ?? null;
  const placement: Placement | null = ad && door ? { ...makePlacement("driver_door", TEST_CREATIVE), scale: 0.82 } : null;
  const r = AI_G80_REPORT;

  return (
    <main className="aig">
      <section className="aig-stage" aria-label="AI reconstructed 3D vehicle">
        <VehicleViewer
          vehicleId={vehicle.id}
          paint="#2A2D31"
          placement={placement}
          selectedZone={ad && door ? "driver_door" : null}
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
          hint
        />
      </section>

      <div className="aig-label">
        <span className="aig-tag"><i aria-hidden />AI 3D test</span>
        <h1 className="aig-title">BMW M3 Competition G80 reference reconstruction</h1>
        <p className="aig-sub">{vehicle.license.creator}. Not a licensed BMW model; an experiment.</p>
      </div>

      <div className="aig-tools">
        {door ? (
          <button type="button" className={`aig-btn ${ad ? "is-on" : ""}`} aria-pressed={ad} onClick={() => setAd((a) => !a)}>{ad ? "Hide test ad" : "Test ad on driver door"}</button>
        ) : (
          <button type="button" className="aig-btn" disabled title="The generated door surface is not clean enough for a decal test">No door test</button>
        )}
        <button type="button" className={`aig-btn ${facts ? "is-on" : ""}`} aria-pressed={facts} onClick={() => setFacts((f) => !f)}>{facts ? "Close" : "Facts"}</button>
      </div>

      {facts && (
        <aside className="aig-facts" aria-label="What made this model">
          <h2>What is on screen</h2>
          <dl>
            <dt>Geometry</dt><dd>{r.geometry}</dd>
            <dt>Made by</dt><dd>{r.provider}</dd>
            <dt>Inputs</dt><dd>{r.inputs}</dd>
            <dt>Time and cost</dt><dd>{r.timeAndCost}</dd>
            <dt>File</dt><dd>{r.file}</dd>
            <dt>Textures</dt><dd>{r.textures}</dd>
            <dt>Size</dt><dd>{r.dimensions}</dd>
            <dt>Test ad</dt><dd>{r.decal}</dd>
            <dt>Accurate</dt><dd><ul>{r.accurate.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt className="is-warn">Wrong or invented</dt><dd className="is-warn"><ul>{r.wrong.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt>References</dt><dd>{r.references.map((s, i) => <span key={s.url}>{i > 0 ? ", " : ""}<a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}. {r.referenceLicense}</dd>
            <dt>Rights</dt><dd>{r.rights}</dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
