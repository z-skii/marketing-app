"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VEHICLES, type CameraPresetKey } from "@/vehicle/catalog";
import { makePlacement, type Placement } from "@/vehicle/placement";
import { VehicleViewer } from "@/vehicle/VehicleViewer";
import { REFINEMENT_REPORT, SOURCE_CAMERAS, SEMANTIC_LEGEND, type SourceCamera } from "./report";

/**
 * BEFORE: the cleaned twin of the previous experiment (rule based regions).
 * REFINED: the same geometry after source image semantic projection, panel lines and premium paint.
 * SOURCE OVERLAY locks the camera to a registered source view and lays the photo over the render.
 * SEMANTIC MAP shows the actual per triangle classification, darker where the projection was uncertain.
 */
type Mode = "before" | "refined";
const TEST_CREATIVE = "/vehicles/tapmart-test-creative.svg";
const BEFORE_ID = "syn-g80-meshy-clean", REFINED_ID = "syn-g80-meshy-refined", SEMANTIC_ID = "syn-g80-meshy-semantic";
const PRESETS: CameraPresetKey[] = ["front", "driver", "rear", "passenger"];
/** The source view that best matches each preset, for the overlay's first pick. */
const VIEW_FOR_PRESET: Record<string, string> = { hero: "02", front: "01", driver: "04", rear: "07", passenger: "10" };

export function TwinRefinement() {
  const params = useSearchParams();
  const initialMode: Mode = params.get("mode") === "before" ? "before" : "refined";
  const view = params.get("view");
  const initial = (["hero", "front", "driver", "rear", "passenger"] as const).find((k) => k === view) ?? "hero";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [ad, setAd] = useState(params.get("ad") === "1");
  const [semantic, setSemantic] = useState(params.get("semantic") === "1");
  const [overlay, setOverlay] = useState(params.get("overlay") != null);
  const [source, setSource] = useState<string>(params.get("overlay") && SOURCE_CAMERAS[params.get("overlay") as string] ? (params.get("overlay") as string) : VIEW_FOR_PRESET[initial] ?? "02");
  const [opacity, setOpacity] = useState(0.55);
  const [diag, setDiag] = useState(false);
  const [current, setCurrent] = useState<CameraPresetKey | null>(initial);

  const vehicle = VEHICLES[semantic ? SEMANTIC_ID : mode === "refined" ? REFINED_ID : BEFORE_ID];
  const placement: Placement | null = ad && !semantic ? { ...makePlacement("driver_door", TEST_CREATIVE), scale: 0.82 } : null;
  const cam: SourceCamera | null = overlay ? SOURCE_CAMERAS[source] ?? null : null;
  const lock = useMemo(() => (cam ? { position: cam.position, target: cam.target, fov: cam.fov } : null), [cam]);
  const r = REFINEMENT_REPORT;

  return (
    <main className={`twr ${overlay ? "is-overlay" : ""}`}>
      <section className="twr-stage" aria-label="Digital twin">
        <div className="twr-frame">
          <VehicleViewer
            key={vehicle.id}
            vehicleId={vehicle.id}
            paint="#2A2D31"
            placement={placement}
            selectedZone={ad && !semantic ? "driver_door" : null}
            selectableZones="none"
            showHighlight={false}
            theme="dark"
            aspect="fill"
            eager
            presets={!overlay}
            presetKeys={PRESETS}
            presetStyle="subtle"
            followZone={false}
            initialPreset={initial}
            studio="premium"
            refined={mode === "refined" && !semantic}
            cameraLock={lock}
            hint={false}
            onView={setCurrent}
          />
          {cam && <img className="twr-overlay" src={cam.image} alt="" style={{ opacity }} draggable={false} />}
        </div>
      </section>

      <div className="twr-modes" role="group" aria-label="Mode">
        {(["before", "refined"] as const).map((m) => (
          <button key={m} type="button" className={`twr-mode ${mode === m && !semantic ? "is-on" : ""}`} aria-pressed={mode === m && !semantic} onClick={() => { setMode(m); setSemantic(false); }}>{m}</button>
        ))}
      </div>

      <div className="twr-label">
        <span className="aig-tag"><i aria-hidden />Controlled synthetic capture test</span>
        <h1 className="twr-title">{semantic ? "Semantic surface map" : mode === "refined" ? "Refined digital twin" : "Cleaned twin, before refinement"}</h1>
        <p className="twr-sub">{semantic ? "Actual per triangle classes from the source view projection; darker means less agreement between views." : mode === "refined" ? "Same geometry. Regions from the sixteen source views, panel lines in the shader, premium graphite paint." : "Rule based regions from the cleanup experiment. Nothing from the source images."}</p>
      </div>

      <div className="twr-tools">
        <button type="button" className={`aig-btn ${ad ? "is-on" : ""}`} aria-pressed={ad} disabled={semantic} onClick={() => setAd((a) => !a)}>{ad ? "Ad on" : "Ad off"}</button>
        <button type="button" className={`aig-btn ${overlay ? "is-on" : ""}`} aria-pressed={overlay} onClick={() => { const next = !overlay; setOverlay(next); if (next) setSource(VIEW_FOR_PRESET[current ?? "hero"] ?? "02"); }}>Source overlay</button>
        <button type="button" className={`aig-btn ${semantic ? "is-on" : ""}`} aria-pressed={semantic} onClick={() => setSemantic((s) => !s)}>Semantic map</button>
        <button type="button" className={`aig-btn ${diag ? "is-on" : ""}`} aria-pressed={diag} onClick={() => setDiag((d) => !d)}>{diag ? "Close" : "Diagnostics"}</button>
      </div>

      {overlay && (
        <div className="twr-source" role="group" aria-label="Source view">
          <div className="twr-source-list">
            {Object.values(SOURCE_CAMERAS).map((c) => (
              <button key={c.id} type="button" className={`twr-thumb ${source === c.id ? "is-on" : ""}`} aria-pressed={source === c.id} onClick={() => setSource(c.id)} title={c.label}>
                <img src={c.thumb} alt={c.label} loading="lazy" />
                <span>{c.id}</span>
              </button>
            ))}
          </div>
          <label className="twr-opacity">Photo <input type="range" min={0} max={1} step={0.05} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} /> {Math.round(opacity * 100)}%</label>
          {cam && <p className="twr-source-note">{cam.label}: outline error {cam.chamferPx} px at 632 px wide, silhouette IoU {cam.iou}. Camera azimuth {cam.az}, elevation {cam.el}, distance {cam.dist} m, fov {cam.fov}.</p>}
        </div>
      )}

      {semantic && (
        <ul className="twr-legend" aria-label="Classes">
          {SEMANTIC_LEGEND.map((c) => <li key={c.name}><i style={{ background: c.color }} aria-hidden />{c.name} <span>{c.triangles} tris, {Math.round(c.confidence * 100)}%</span></li>)}
        </ul>
      )}

      {diag && (
        <aside className="twr-diag" aria-label="Diagnostics">
          <h2>Refinement diagnostics</h2>
          <dl>
            <dt>Input</dt><dd>{r.input}</dd>
            <dt>Segmentation</dt><dd>{r.segmentation}</dd>
            <dt>Registration</dt><dd>{r.registration}</dd>
            <dt>Projection</dt><dd>{r.projection}</dd>
            <dt>Smoothing</dt><dd>{r.smoothing}</dd>
            <dt>Panel lines</dt><dd>{r.panelLines}</dd>
            <dt>Score</dt><dd>{r.score}</dd>
            <dt>Dimensions</dt><dd>{r.dimensions}</dd>
            <dt>Triangles</dt><dd>{r.triangles}</dd>
            <dt>Regions</dt><dd><ul>{r.regions.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt>Coverage</dt><dd>{r.coverage}</dd>
            <dt>Views</dt><dd><ul>{r.views.map((s) => <li key={s}>{s}</li>)}</ul></dd>
            <dt>Decal</dt><dd>{r.decal}</dd>
            <dt>Left</dt><dd><ul>{r.remaining.map((s) => <li key={s}>{s}</li>)}</ul></dd>
          </dl>
        </aside>
      )}
    </main>
  );
}
