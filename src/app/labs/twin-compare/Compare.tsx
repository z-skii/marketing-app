"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getVehicle } from "@/vehicle/catalog";
import { makePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";
import { TWIN_COMPARE, type CompareModel } from "./data";

const TEST_CREATIVE = "/vehicles/tapmart-test-creative.svg";

/** Model A and Model B side by side, each its own studio, each with its measured score. Nothing is hidden. */
export function TwinCompare() {
  const params = useSearchParams();
  const view = params.get("view");
  const initial = (["hero", "front", "driver", "rear", "passenger"] as const).find((k) => k === view) ?? "hero";
  const c = TWIN_COMPARE;
  return (
    <main className="twc">
      <header className="twc-top">
        <div>
          <span className="aig-tag"><i aria-hidden />Prototype 2</span>
          <h1 className="twc-title">{c.title}</h1>
          <p className="twc-sub">{c.vehicle.identification}. Real dimensions {c.vehicle.dims.length_mm} x {c.vehicle.dims.width_mirrors_mm} (over mirrors) x {c.vehicle.dims.height_mm} mm, wheelbase {c.vehicle.dims.wheelbase_mm} mm ({c.vehicle.dimsSource}).</p>
        </div>
      </header>
      {c.status === "placeholder" && <p className="twc-banner">{c.vehicle.label}. The real capture replaces both models here once it is reconstructed.</p>}
      <div className="twc-grid">
        {c.models.map((m) => <Pane key={m.slot} model={m} winner={c.winner === m.slot} surface={c.winner === m.slot ? c.approvedSurface : null} initial={initial} />)}
      </div>
      <section className="twc-facts" aria-label="How this comparison was made">
        <h2>How this was made</h2>
        <dl>
          <dt>Capture</dt><dd>{c.capture}</dd>
          <dt>Providers</dt><dd>Each provider received the same photographs and nothing about the result of the other. Both raw outputs are kept unmodified; the files on screen are Draco and WebP copies with the same vertices.</dd>
          <dt>Normalisation</dt><dd>Longest horizontal axis turned to the nose axis, lowest point on the ground, centred, scaled uniformly to the real length. No axis was stretched, so the ratios below are what each provider produced.</dd>
          <dt>Score</dt><dd>Length to width (30 percent, 4 percent tolerance), length to height (25, 6), wheelbase to length (25, 3, from the two lowest vertex clusters), width to height (10, 6). Each ratio earns 1 at zero error and 0 at twice its tolerance. Symmetry is not measured yet and its weight is left out.</dd>
          <dt>Decision</dt><dd>{c.winnerReason}</dd>
          <dt>Approved surface</dt><dd>{c.approvedSurface ? "Driver front door on the better model, placed by hand, projected with THREE.DecalGeometry onto the reconstructed triangles." : "None yet."}</dd>
        </dl>
      </section>
    </main>
  );
}

function Pane({ model, winner, surface, initial }: { model: CompareModel; winner: boolean; surface: "driver_door" | null; initial: "hero" | "front" | "driver" | "rear" | "passenger" }) {
  const vehicle = getVehicle(model.vehicleId);
  const [ad, setAd] = useState(false);
  const zone = surface ? vehicle.zones.find((z) => z.id === surface) ?? null : null;
  const placement: Placement | null = ad && zone ? { ...makePlacement("driver_door", TEST_CREATIVE), scale: 0.82 } : null;
  const pct = Math.round(model.score * 100);
  return (
    <section className="twc-pane" aria-label={`Model ${model.slot}`}>
      <div className="twc-stage">
        <VehicleViewer vehicleId={vehicle.id} paint="#2A2D31" placement={placement} selectedZone={ad && zone ? "driver_door" : null} selectableZones="none" showHighlight={false} theme="dark" aspect="fill" eager presets presetKeys={["front", "driver", "rear", "passenger"]} presetStyle="subtle" followZone={false} initialPreset={initial} hint={false} />
        <div className="twc-slot"><b className={winner ? "is-winner" : ""}>Model {model.slot}{winner ? " · chosen" : ""}</b><span>{model.provider}</span></div>
        {zone && (
          <div className="twc-tools">
            <button type="button" className={`aig-btn ${ad ? "is-on" : ""}`} aria-pressed={ad} onClick={() => setAd((a) => !a)}>{ad ? "Hide test ad" : "Test ad on driver door"}</button>
          </div>
        )}
      </div>
      <div className="twc-card">
        <div className="twc-score"><b>{pct}%</b><span>geometry score against real dimensions</span></div>
        <dl className="twc-rows">
          {model.ratios.map((r) => (
            <RatioRow key={r.key} label={r.label} value={r.mesh == null ? "not measurable" : `${r.mesh.toFixed(2)} vs ${r.real.toFixed(2)}${r.errorPct == null ? "" : `, ${r.errorPct.toFixed(1)}% off`}`} verdict={r.verdict} />
          ))}
        </dl>
        <ul className="twc-meta">
          <li>At real length: {model.atRealLength.width_mm} mm wide over mirrors, {model.atRealLength.height_mm} mm tall{model.atRealLength.wheelbase_mm ? `, ${model.atRealLength.wheelbase_mm} mm wheelbase` : ""}.</li>
          <li>{model.inputs}. {model.credits} credits, about {model.minutes} minutes. {model.rawTriangles.toLocaleString()} triangles as generated, {(model.webBytes / 1024 / 1024).toFixed(2)} MB on the web.</li>
          {model.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </section>
  );
}

function RatioRow({ label, value, verdict }: { label: string; value: string; verdict: string }) {
  const cls = verdict === "PASS" ? "is-pass" : verdict === "REVIEW" ? "is-review" : verdict === "FAIL" ? "is-fail" : "";
  return <><dt>{label}</dt><dd>{value}</dd><dd className={cls}>{verdict}</dd></>;
}
