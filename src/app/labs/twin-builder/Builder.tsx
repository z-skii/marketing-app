"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkeletonViewer, type ColourMode } from "./SkeletonViewer";
import { ANGLES, STAGES, STATUS_COLOUR, STATUS_LABEL, VIEW_IDS, VIEW_NAMES, type CurveStatus, type Skeleton, type StageKey } from "./types";

/**
 * Engineering lab for the vehicle twin builder. Not a customer screen.
 * SOURCE: the 16 input views and the skeleton reprojected over each of them.
 * SKELETON: the fitted 3D curve network, its cameras and its diagnostics.
 * Later stages are listed but not built: each is gated on approval of the one before.
 */
const DATA_URL = "/labs/twin-builder/skeleton.json";
const SOURCE = (v: string) => `/captures/ai-g80-controlled/views/${v}.jpg`;
const THUMB = (v: string) => `/captures/ai-g80-controlled/thumbs/${v}.jpg`;
const OVERLAY = (v: string) => `/labs/twin-builder/overlays/${v}.jpg`;
const OVERLAY_THUMB = (v: string) => `/labs/twin-builder/thumbs/${v}.jpg`;
const STATUSES: CurveStatus[] = ["recovered", "partial", "uncertain", "prior"];

export function TwinBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const stageParam = STAGES.find((s) => s.key === params.get("stage"))?.key ?? "skeleton";
  const [stage, setStage] = useState<StageKey>(stageParam);
  const [angle, setAngle] = useState<string>(ANGLES[params.get("angle") ?? ""] ? (params.get("angle") as string) : "front34");
  const [lockView, setLockView] = useState<string | null>(VIEW_IDS.includes(params.get("view") as never) ? (params.get("view") as string) : null);
  const [photo, setPhoto] = useState(params.get("photo") !== "0");
  const [mode, setMode] = useState<ColourMode>(params.get("colour") === "group" ? "group" : "status");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [overlays, setOverlays] = useState(params.get("overlay") !== "0");
  const [big, setBig] = useState<string | null>(null);
  const [panel, setPanel] = useState<"summary" | "curves" | "cameras">("summary");
  const [data, setData] = useState<Skeleton | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))).then(setData).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    q.set("stage", stage);
    if (stage === "skeleton") { if (lockView) q.set("view", lockView); else q.set("angle", angle); if (mode === "group") q.set("colour", "group"); if (!photo) q.set("photo", "0"); }
    if (stage === "source" && !overlays) q.set("overlay", "0");
    router.replace(`?${q.toString()}`, { scroll: false });
  }, [stage, lockView, angle, mode, photo, overlays, router]);

  const lock = data && lockView ? data.cameras[lockView] : null;
  const selectedCurve = useMemo(() => data?.curves.find((c) => c.name === selected) ?? null, [data, selected]);
  const stageInfo = STAGES.find((s) => s.key === stage)!;

  return (
    <main className="twb">
      <header className="twb-top">
        <div className="twb-title">
          <p className="twb-kicker">TapMart vehicle twin engine, builder lab</p>
          <h1>G80 builder <span>CONTROLLED SYNTHETIC CAPTURE TEST</span></h1>
        </div>
        <nav className="twb-stages" aria-label="Development stage">
          {STAGES.map((s) => (
            <button key={s.key} type="button" className={`twb-stage ${stage === s.key ? "is-on" : ""} ${s.built ? "" : "is-off"}`} aria-pressed={stage === s.key} onClick={() => setStage(s.key)}>
              <b>{s.label}</b><small>{s.built ? s.phase : "not built"}</small>
            </button>
          ))}
        </nav>
      </header>

      {stage === "skeleton" && (
        <section className="twb-skel">
          <div className={`twb-stage-3d ${lock ? "is-locked" : ""}`}>
            <div className="twb-frame" style={lock && photo ? { backgroundImage: `url(${SOURCE(lockView!)})` } : undefined}>
              {data ? <SkeletonViewer skeleton={data} angle={angle} lock={lock} mode={mode} hidden={hidden} selected={selected} onSelect={setSelected} transparent={!!lock && photo} /> : <p className="twb-loading">{error ? `Skeleton data failed to load (${error}).` : "Loading skeleton"}</p>}
            </div>
            <div className="twb-toolbar">
              <div className="twb-angles" role="group" aria-label="Standard angle">
                {Object.entries(ANGLES).map(([k, a]) => (
                  <button key={k} type="button" className={!lockView && angle === k ? "is-on" : ""} onClick={() => { setLockView(null); setAngle(k); }}>{a.label}</button>
                ))}
              </div>
              <label className="twb-select">
                <span>Source view</span>
                <select value={lockView ?? ""} onChange={(e) => setLockView(e.target.value || null)}>
                  <option value="">free camera</option>
                  {VIEW_IDS.map((v) => <option key={v} value={v}>{v} {VIEW_NAMES[v]}</option>)}
                </select>
              </label>
              {lockView && <button type="button" className={photo ? "is-on" : ""} onClick={() => setPhoto((p) => !p)}>{photo ? "Photo behind" : "Photo off"}</button>}
              <div className="twb-modes" role="group" aria-label="Colour">
                <button type="button" className={mode === "status" ? "is-on" : ""} onClick={() => setMode("status")}>By status</button>
                <button type="button" className={mode === "group" ? "is-on" : ""} onClick={() => setMode("group")}>By group</button>
              </div>
            </div>
            <div className="twb-legend" aria-label="Legend">
              {STATUSES.map((s) => (
                <button key={s} type="button" className={hidden.has(s) ? "is-hidden" : ""} onClick={() => setHidden((h) => { const n = new Set(h); if (n.has(s)) n.delete(s); else n.add(s); return n; })} title={STATUS_LABEL[s]}>
                  <i style={{ background: STATUS_COLOUR[s] }} />{s}{data ? ` ${data.status_counts[s]}` : ""}
                </button>
              ))}
              <span><i style={{ background: "#ffd84a" }} />wheels</span>
            </div>
          </div>

          <aside className="twb-panel">
            <div className="twb-tabs" role="tablist">
              {(["summary", "curves", "cameras"] as const).map((t) => <button key={t} type="button" role="tab" aria-selected={panel === t} className={panel === t ? "is-on" : ""} onClick={() => setPanel(t)}>{t}</button>)}
            </div>
            {!data && <p className="twb-muted">{error ? "No data." : "Loading"}</p>}
            {data && panel === "summary" && <Summary data={data} />}
            {data && panel === "curves" && <CurveTable data={data} selected={selected} onSelect={setSelected} />}
            {data && panel === "cameras" && <Cameras data={data} />}
            {selectedCurve && (
              <div className="twb-selected">
                <h3>{selectedCurve.name} <span style={{ color: STATUS_COLOUR[selectedCurve.status] }}>{selectedCurve.status}</span></h3>
                <p>{selectedCurve.error_px != null ? `mean reprojection error ${selectedCurve.error_px} px (about ${selectedCurve.error_mm} mm) over ${selectedCurve.views} views, coverage ${Math.round((selectedCurve.coverage ?? 0) * 100)}%` : "no image evidence: shape comes from the prior"}</p>
                {Object.keys(selectedCurve.detail).length > 0 && (
                  <table><tbody>{Object.entries(selectedCurve.detail).map(([v, d]) => <tr key={v}><td>{v}</td><td>{d.error_px} px</td><td>{Math.round(d.coverage * 100)}%</td><td>{d.polygons.join(", ")}</td></tr>)}</tbody></table>
                )}
              </div>
            )}
          </aside>
        </section>
      )}

      {stage === "source" && (
        <section className="twb-source">
          <div className="twb-source-bar">
            <p>{stageInfo.note}</p>
            <div className="twb-modes" role="group" aria-label="Image">
              <button type="button" className={!overlays ? "is-on" : ""} onClick={() => setOverlays(false)}>Source</button>
              <button type="button" className={overlays ? "is-on" : ""} onClick={() => setOverlays(true)}>Skeleton overlay</button>
            </div>
          </div>
          <div className="twb-grid">
            {VIEW_IDS.map((v) => (
              <figure key={v}>
                <button type="button" onClick={() => setBig(v)} aria-label={`Open view ${v}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={overlays ? OVERLAY_THUMB(v) : THUMB(v)} alt={`View ${v}, ${VIEW_NAMES[v]}`} loading="lazy" width={632} height={424} />
                </button>
                <figcaption><b>{v}</b> {VIEW_NAMES[v]}{data && overlays ? <span>{wheelErr(data, v)}</span> : null}</figcaption>
              </figure>
            ))}
          </div>
          {big && (
            <div className="twb-lightbox" role="dialog" aria-label={`View ${big}`} onClick={() => setBig(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={overlays ? OVERLAY(big) : SOURCE(big)} alt={`View ${big}, ${VIEW_NAMES[big]}`} />
              <p>{big} {VIEW_NAMES[big]} {overlays ? "with the skeleton reprojected through the fitted camera" : "source"}. Click to close.</p>
            </div>
          )}
        </section>
      )}

      {stage !== "skeleton" && stage !== "source" && (
        <section className="twb-gate">
          <p className="twb-kicker">{stageInfo.phase}</p>
          <h2>{stageInfo.label}: not built</h2>
          <p>{stageInfo.note}</p>
          <p className="twb-muted">Gated on approval of the previous stage. Nothing here is generated or faked.</p>
        </section>
      )}
    </main>
  );
}

function azDiff(a: number, b: number) { const d = Math.abs(((a - b) % 360 + 540) % 360 - 180); return d; }

function wheelErr(data: Skeleton, v: string) {
  const e = data.wheel_errors.filter((w) => w.view === v);
  if (!e.length) return "no wheel evidence";
  return `wheel centres ${e.map((w) => `${w.error_px} px`).join(", ")}`;
}

function Summary({ data }: { data: Skeleton }) {
  const groups = Object.entries(data.groups);
  return (
    <div className="twb-summary">
      <h2>Dimensions</h2>
      <table>
        <thead><tr><th>measure</th><th>fitted</th><th>spec</th><th>diff</th></tr></thead>
        <tbody>
          {Object.entries(data.dims).map(([k, d]) => <tr key={k}><td>{k.replace("_", " ")}</td><td>{d.fitted.toFixed(3)} m</td><td>{d.official.toFixed(3)} m</td><td className={Math.abs(d.error_mm) > 30 ? "is-bad" : ""}>{d.error_mm > 0 ? "+" : ""}{d.error_mm} mm</td></tr>)}
        </tbody>
      </table>
      <h2>Wheel centres</h2>
      <p className="twb-muted">Projected fitted centre against the ellipse centre found in each image.</p>
      <table>
        <thead><tr><th>view</th><th>wheel</th><th>error</th></tr></thead>
        <tbody>{data.wheel_errors.map((w, i) => <tr key={i}><td>{w.view}</td><td>{w.wheel.replace("_", " ")}</td><td className={w.error_px > 15 ? "is-bad" : ""}>{w.error_px} px / {w.error_mm} mm</td></tr>)}</tbody>
      </table>
      <h2>Skeleton elements</h2>
      <table>
        <thead><tr><th>element</th><th>mean error</th><th>status</th></tr></thead>
        <tbody>
          {groups.map(([g, v]) => (
            <tr key={g}><td>{g}</td><td>{v.error_px != null ? `${v.error_px} px` : "prior"}</td><td className="twb-dots">{v.statuses.map((s, i) => <i key={i} style={{ background: STATUS_COLOUR[s] }} title={s} />)}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="twb-muted">Pixel errors are measured on the 1264 x 848 working images. One pixel is about {Math.round(data.metres_per_px_mean * 1000)} mm on the car.</p>
    </div>
  );
}

function CurveTable({ data, selected, onSelect }: { data: Skeleton; selected: string | null; onSelect: (n: string | null) => void }) {
  const [filter, setFilter] = useState<CurveStatus | "all">("all");
  const rows = data.curves.filter((c) => filter === "all" || c.status === filter);
  return (
    <div className="twb-curves">
      <div className="twb-modes">
        {(["all", ...STATUSES] as const).map((f) => <button key={f} type="button" className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>{f}</button>)}
      </div>
      <table>
        <thead><tr><th>curve</th><th>status</th><th>error</th><th>views</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name} className={selected === c.name ? "is-on" : ""} onClick={() => onSelect(selected === c.name ? null : c.name)}>
              <td>{c.name}</td><td><i className="twb-dot" style={{ background: STATUS_COLOUR[c.status] }} />{c.status}</td><td>{c.error_px != null ? `${c.error_px} px` : ""}</td><td>{c.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cameras({ data }: { data: Skeleton }) {
  return (
    <div className="twb-cams">
      <p className="twb-muted">Cameras initialised from the registration of the previous experiment and refined jointly with the curves. Azimuth, elevation in degrees, distance in metres, vertical field of view.</p>
      <table>
        <thead><tr><th>view</th><th>az</th><th>el</th><th>dist</th><th>fov</th><th>moved</th></tr></thead>
        <tbody>
          {Object.entries(data.cameras).map(([v, c]) => (
            <Fragment key={v}>
              <tr><td>{v}</td><td>{c.az.toFixed(1)}</td><td>{c.el.toFixed(1)}</td><td>{c.dist.toFixed(2)}</td><td>{c.fov}</td><td>{azDiff(c.az, c.initial.az).toFixed(1)}° / {Math.abs(c.dist - c.initial.dist).toFixed(2)} m</td></tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
