"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SkeletonViewer, type ColourMode } from "./SkeletonViewer";
import { ANGLES, LABEL_TEXT, STAGES, STATUS_COLOUR, STATUS_LABEL, VIEW_IDS, VIEW_NAMES, type CurveStatus, type ReferencePack, type Skeleton, type StageKey } from "./types";

/**
 * Engineering lab for the vehicle twin builder. Not a customer screen.
 * SOURCE: the 16 input views and the skeleton reprojected over each of them.
 * REFERENCE: the G80 reference pack the engine learned before fitting (Phase 1B).
 * SKELETON: the fitted 3D curve network, its cameras, its provenance and its diagnostics.
 * Later stages are listed but not built: each is gated on approval of the one before.
 */
const DATA_URL = "/labs/twin-builder/skeleton.json";
const PACK_URL = "/labs/twin-builder/reference-pack.json";
const SOURCE = (v: string) => `/captures/ai-g80-controlled/views/${v}.jpg`;
const THUMB = (v: string) => `/captures/ai-g80-controlled/thumbs/${v}.jpg`;
const OVERLAY = (v: string) => `/labs/twin-builder/overlays/${v}.jpg`;
const OVERLAY_THUMB = (v: string) => `/labs/twin-builder/thumbs/${v}.jpg`;
const STATUSES: CurveStatus[] = ["reference_confirmed", "measured", "partial", "uncertain", "prior"];

export function TwinBuilder() {
  const params = useSearchParams();
  const router = useRouter();
  const stageParam = STAGES.find((s) => s.key === params.get("stage"))?.key ?? "skeleton";
  const [stage, setStage] = useState<StageKey>(stageParam);
  const [angle, setAngle] = useState<string>(ANGLES[params.get("angle") ?? ""] ? (params.get("angle") as string) : "front34");
  const [lockView, setLockView] = useState<string | null>(params.get("view"));
  const [photo, setPhoto] = useState(params.get("photo") !== "0");
  const [mode, setMode] = useState<ColourMode>(params.get("colour") === "group" ? "group" : "status");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [overlays, setOverlays] = useState(params.get("overlay") !== "0");
  const [big, setBig] = useState<{ src: string; caption: string } | null>(null);
  const [panel, setPanel] = useState<"summary" | "curves" | "cameras" | "compare">("summary");
  const [data, setData] = useState<Skeleton | null>(null);
  const [pack, setPack] = useState<ReferencePack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(DATA_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))).then(setData).catch((e: Error) => setError(e.message));
    fetch(PACK_URL).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))).then(setPack).catch((e: Error) => setError(e.message));
  }, []);
  useEffect(() => {
    const q = new URLSearchParams();
    q.set("stage", stage);
    if (stage === "skeleton") { if (lockView) q.set("view", lockView); else q.set("angle", angle); if (mode === "group") q.set("colour", "group"); if (!photo) q.set("photo", "0"); }
    if ((stage === "source" || stage === "reference") && !overlays) q.set("overlay", "0");
    router.replace(`?${q.toString()}`, { scroll: false });
  }, [stage, lockView, angle, mode, photo, overlays, router]);

  const lock = data && lockView ? data.cameras[lockView] ?? null : null;
  const selectedCurve = useMemo(() => data?.curves.find((c) => c.name === selected) ?? null, [data, selected]);
  const stageInfo = STAGES.find((s) => s.key === stage)!;
  const cameraKeys = data ? Object.keys(data.cameras) : [];

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
            <div className="twb-frame" style={lock ? { aspectRatio: `${lock.size[0]} / ${lock.size[1]}`, width: `min(100%, calc((100dvh - 190px) * ${(lock.size[0] / lock.size[1]).toFixed(3)}))`, ...(photo ? { backgroundImage: `url(${lock.image})` } : {}) } : undefined}>
              {data ? <SkeletonViewer skeleton={data} angle={angle} lock={lock} mode={mode} hidden={hidden} selected={selected} onSelect={setSelected} transparent={!!lock && photo} /> : <p className="twb-loading">{error ? `Skeleton data failed to load (${error}).` : "Loading skeleton"}</p>}
              {lock && lock.kind === "ref" && photo && <p className="twb-credit">{lock.provenance.creator}, CC {String(lock.provenance.license).toUpperCase()} {lock.provenance.license_version} via {lock.provenance.source}</p>}
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
                  <optgroup label="Synthetic capture">
                    {cameraKeys.filter((k) => data!.cameras[k].kind === "syn").map((k) => <option key={k} value={k}>{k} {VIEW_NAMES[k] ?? ""}</option>)}
                  </optgroup>
                  <optgroup label="Reference photographs (CC licensed)">
                    {cameraKeys.filter((k) => data!.cameras[k].kind === "ref").map((k) => <option key={k} value={k}>{data!.cameras[k].label}</option>)}
                  </optgroup>
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
                  <i style={{ background: STATUS_COLOUR[s] }} />{s.replace("_", " ")}{data ? ` ${data.status_counts[s]}` : ""}
                </button>
              ))}
              <span><i style={{ background: "#ffd84a" }} />wheels</span>
            </div>
          </div>

          <aside className="twb-panel">
            <div className="twb-tabs" role="tablist">
              {(["summary", "curves", "cameras", "compare"] as const).map((t) => <button key={t} type="button" role="tab" aria-selected={panel === t} className={panel === t ? "is-on" : ""} onClick={() => setPanel(t)}>{t}</button>)}
            </div>
            {!data && <p className="twb-muted">{error ? "No data." : "Loading"}</p>}
            {data && panel === "summary" && <Summary data={data} />}
            {data && panel === "curves" && <CurveTable data={data} selected={selected} onSelect={setSelected} />}
            {data && panel === "cameras" && <Cameras data={data} />}
            {data && panel === "compare" && <Compare data={data} />}
            {selectedCurve && (
              <div className="twb-selected">
                <h3>{selectedCurve.name} <span style={{ color: STATUS_COLOUR[selectedCurve.status] }}>{selectedCurve.status.replace("_", " ")}</span> <em>confidence {Math.round(selectedCurve.confidence * 100)}%</em></h3>
                <p className="twb-labels">{selectedCurve.labels.map((l) => <span key={l} title={LABEL_TEXT[l]}>{l}</span>)}</p>
                <p>{selectedCurve.error_px != null ? `mean reprojection error ${selectedCurve.error_px} px (about ${selectedCurve.error_mm} mm); ${selectedCurve.ref_views} reference views${selectedCurve.ref_error_px != null ? ` at ${selectedCurve.ref_error_px} px` : ""}, ${selectedCurve.syn_views} capture views${selectedCurve.syn_error_px != null ? ` at ${selectedCurve.syn_error_px} px` : ""}` : "no image evidence in any view"}{selectedCurve.ai_agreement_mm != null ? `; AI hypothesis boundary ${selectedCurve.ai_agreement_mm} mm away` : ""}</p>
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
                <button type="button" onClick={() => setBig({ src: overlays ? OVERLAY(v) : SOURCE(v), caption: `${v} ${VIEW_NAMES[v]} ${overlays ? "with the skeleton reprojected through the fitted camera" : "source"}` })} aria-label={`Open view ${v}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={overlays ? OVERLAY_THUMB(v) : THUMB(v)} alt={`View ${v}, ${VIEW_NAMES[v]}`} loading="lazy" width={632} height={424} />
                </button>
                <figcaption><b>{v}</b> {VIEW_NAMES[v]}{data && overlays ? <span>{wheelErr(data, v)}</span> : null}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {stage === "reference" && (
        <section className="twb-ref">
          {!pack && <p className="twb-muted">{error ? "Reference pack failed to load." : "Loading reference pack"}</p>}
          {pack && <Reference pack={pack} data={data} overlays={overlays} setOverlays={setOverlays} onOpen={setBig} />}
        </section>
      )}

      {stage !== "skeleton" && stage !== "source" && stage !== "reference" && (
        <section className="twb-gate">
          <p className="twb-kicker">{stageInfo.phase}</p>
          <h2>{stageInfo.label}: not built</h2>
          <p>{stageInfo.note}</p>
          <p className="twb-muted">Gated on approval of the previous stage. Nothing here is generated or faked.</p>
        </section>
      )}

      {big && (
        <div className="twb-lightbox" role="dialog" aria-label="Enlarged image" onClick={() => setBig(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={big.src} alt={big.caption} />
          <p>{big.caption}. Click to close.</p>
        </div>
      )}
    </main>
  );
}

function azDiff(a: number, b: number) { return Math.abs(((a - b) % 360 + 540) % 360 - 180); }

function wheelErr(data: Skeleton, v: string) {
  const e = data.wheel_errors.filter((w) => w.view === v && w.centre_error_mm != null);
  if (!e.length) return "no wheel evidence used";
  return `wheel centres ${e.map((w) => `${w.centre_error_mm} mm`).join(", ")}`;
}

function Summary({ data }: { data: Skeleton }) {
  const groups = Object.entries(data.groups);
  const ws = data.wheel_summary;
  return (
    <div className="twb-summary">
      <h2>Residuals</h2>
      <p className="twb-muted">Data residual RMS: all views {data.residuals.data_rms_px_all} px, synthetic capture {data.residuals.data_rms_px_syn} px, references {data.residuals.data_rms_px_ref} px (native pixels; reference photographs vary in size).</p>
      <h2>Chassis and dimensions</h2>
      <table>
        <thead><tr><th>measure</th><th>fitted</th><th>spec</th><th>diff</th></tr></thead>
        <tbody>
          {Object.entries(data.dims).map(([k, d]) => <tr key={k}><td>{k.replace("_", " ")}</td><td>{d.fitted.toFixed(4)} m</td><td>{d.official.toFixed(4)} m</td><td className={Math.abs(d.error_mm) > 10 ? "is-bad" : ""}>{d.error_mm > 0 ? "+" : ""}{d.error_mm} mm</td></tr>)}
        </tbody>
      </table>
      <h2>Wheels</h2>
      <p className="twb-muted">Real G80 references: projected tyre face centre against the tyre face ellipse found in the photograph. Synthetic capture: tread aware cylinder outline against the outline found in the view; the capture disagrees with the trusted chassis, so its error measures that conflict.</p>
      <table>
        <tbody>
          <tr><td>references: centre error mean / median / max</td><td className={ws.ref.centre_error_mm_mean != null && ws.ref.centre_error_mm_mean > 10 ? "is-bad" : ""}>{ws.ref.centre_error_mm_mean} / {ws.ref.centre_error_mm_median} / {ws.ref.centre_error_mm_max} mm ({ws.ref.n} obs)</td></tr>
          <tr><td>capture: centre error mean / median / max</td><td className={ws.syn.centre_error_mm_mean != null && ws.syn.centre_error_mm_mean > 10 ? "is-bad" : ""}>{ws.syn.centre_error_mm_mean} / {ws.syn.centre_error_mm_median} / {ws.syn.centre_error_mm_max} mm ({ws.syn.n} obs)</td></tr>
          <tr><td>outline RMS mean</td><td>{ws.outline_rms_mm_mean} mm</td></tr>
          <tr><td>tyre radius ratio, references</td><td>{ws.radius_ratio_ref}</td></tr>
          <tr><td>tyre radius ratio, synthetic capture</td><td className={ws.radius_ratio_syn != null && Math.abs(ws.radius_ratio_syn - 1) > 0.02 ? "is-bad" : ""}>{ws.radius_ratio_syn}</td></tr>
        </tbody>
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
      <p className="twb-muted">Curve errors are compared at the 1264 px working width. Labels: {Object.entries(data.label_counts).map(([l, n]) => `${l} ${n}`).join(", ")}.</p>
    </div>
  );
}

function Compare({ data }: { data: Skeleton }) {
  const p1 = data.comparison.phase1;
  const rows: [string, string, string][] = [
    ["data residual RMS", `${p1.data_rms_px} px`, `${data.residuals.data_rms_px_syn} px (capture), ${data.residuals.data_rms_px_all} px (all)`],
    ["wheel centre error", `${p1.wheel_error_mm_mean} mm (raw ellipse centres, capture)`, `${data.wheel_summary.ref.centre_error_mm_mean} mm on real references, ${data.wheel_summary.syn.centre_error_mm_mean} mm on the capture (tread aware)`],
    ["uncertain curves", `${p1.status_counts.uncertain}`, `${data.phase1_status_counts.uncertain} (same rule), ${data.status_counts.uncertain} (new rule)`],
    ["partial curves", `${p1.status_counts.partial}`, `${data.phase1_status_counts.partial} (same rule), ${data.status_counts.partial} (new rule)`],
    ["prior only curves", `${p1.status_counts.prior}`, `${data.status_counts.prior}`],
    ["recovered / reference confirmed", `${p1.status_counts.recovered}`, `${data.phase1_status_counts.recovered} (same rule), ${data.status_counts.reference_confirmed} reference confirmed, ${data.status_counts.measured} measured`],
  ];
  const dimKeys = Object.keys(p1.dims);
  return (
    <div className="twb-summary">
      <h2>Phase 1 vs Phase 1B</h2>
      <table>
        <thead><tr><th>metric</th><th>Phase 1</th><th>Phase 1B</th></tr></thead>
        <tbody>{rows.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody>
      </table>
      <h2>Dimensions</h2>
      <table>
        <thead><tr><th>measure</th><th>Phase 1</th><th>Phase 1B</th></tr></thead>
        <tbody>{dimKeys.map((k) => <tr key={k}><td>{k.replace("_", " ")}</td><td>{p1.dims[k].error_mm} mm</td><td>{data.dims[k] ? `${data.dims[k].error_mm} mm` : ""}</td></tr>)}</tbody>
      </table>
      <h2>Worst remaining curves</h2>
      <table>
        <thead><tr><th>curve</th><th>Phase 1</th><th>Phase 1B</th><th>status</th></tr></thead>
        <tbody>
          {[...data.curves].filter((c) => c.error_px != null).sort((a, b) => (b.error_px ?? 0) - (a.error_px ?? 0)).slice(0, 10).map((c) => (
            <tr key={c.name}><td>{c.name}</td><td>{p1.curve_error_px[c.name] != null ? `${p1.curve_error_px[c.name]} px` : "prior"}</td><td>{c.error_px} px</td><td><i className="twb-dot" style={{ background: STATUS_COLOUR[c.status] }} />{c.status.replace("_", " ")}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CurveTable({ data, selected, onSelect }: { data: Skeleton; selected: string | null; onSelect: (n: string | null) => void }) {
  const [filter, setFilter] = useState<CurveStatus | "all">("all");
  const rows = data.curves.filter((c) => filter === "all" || c.status === filter);
  return (
    <div className="twb-curves">
      <div className="twb-modes">
        {(["all", ...STATUSES] as const).map((f) => <button key={f} type="button" className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>{f.replace("_", " ")}</button>)}
      </div>
      <table>
        <thead><tr><th>curve</th><th>status</th><th>conf</th><th>error</th><th>ref / cap</th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.name} className={selected === c.name ? "is-on" : ""} onClick={() => onSelect(selected === c.name ? null : c.name)}>
              <td>{c.name}</td><td><i className="twb-dot" style={{ background: STATUS_COLOUR[c.status] }} />{c.status.replace("_", " ")}</td><td>{Math.round(c.confidence * 100)}%</td><td>{c.error_px != null ? `${c.error_px} px` : ""}</td><td>{c.ref_views} / {c.syn_views}</td>
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
      <p className="twb-muted">Synthetic cameras start from the Phase 1 registration; reference cameras start from a silhouette registration of the Phase 1 skeleton with a free field of view. All are refined jointly with the curves. Degrees and metres.</p>
      <table>
        <thead><tr><th>view</th><th>az</th><th>el</th><th>dist</th><th>fov</th><th>moved</th></tr></thead>
        <tbody>
          {Object.entries(data.cameras).map(([v, c]) => (
            <Fragment key={v}>
              <tr><td>{v}</td><td>{c.az.toFixed(1)}</td><td>{c.el.toFixed(1)}</td><td>{c.dist.toFixed(2)}</td><td>{c.fov.toFixed(1)}</td><td>{azDiff(c.az, c.initial.az).toFixed(1)}° / {Math.abs(c.dist - c.initial.dist).toFixed(2)} m</td></tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Reference({ pack, data, overlays, setOverlays, onOpen }: { pack: ReferencePack; data: Skeleton | null; overlays: boolean; setOverlays: (b: boolean) => void; onOpen: (b: { src: string; caption: string }) => void }) {
  const [graph, setGraph] = useState(false);
  const cov = Object.entries(pack.coverage);
  return (
    <div className="twb-ref-body">
      <div className="twb-ref-grid">
        <section className="twb-card">
          <h2>Identity</h2>
          <dl>{Object.entries(pack.identity).map(([k, v]) => <Fragment key={k}><dt>{k.replace(/_/g, " ")}</dt><dd>{v}</dd></Fragment>)}</dl>
          <p className="twb-muted">{pack.label}. Pack {pack.approved ? "approved" : "awaiting approval"}, created {pack.created_at.slice(0, 10)}.</p>
        </section>
        <section className="twb-card">
          <h2>Trusted dimensions</h2>
          <table>
            <thead><tr><th>measure</th><th>value</th><th>source</th></tr></thead>
            <tbody>{Object.entries(pack.dimensions).map(([k, d]) => <tr key={k}><td>{k.replace(/_/g, " ")}</td><td>{d.value} {d.unit}</td><td>{d.source}</td></tr>)}</tbody>
          </table>
          <table>
            <thead><tr><th>years</th><th>trim</th><th>front</th><th>rear</th><th>tyre r</th></tr></thead>
            <tbody>{pack.wheels_tyres.map((w, i) => <tr key={i}><td>{w.years}</td><td>{w.trim}</td><td>{w.front}</td><td>{w.rear}</td><td>{w.tyre_r_front} / {w.tyre_r_rear} m</td></tr>)}</tbody>
          </table>
        </section>
        <section className="twb-card twb-card-wide">
          <h2>Reference coverage and confidence</h2>
          <p className="twb-muted">Per structural feature: how many licensed reference photographs and how many capture views carried evidence for it, the fitted status and the confidence after the joint fit.</p>
          <table className="twb-cov">
            <thead><tr><th>feature</th><th>ref</th><th>capture</th><th>error</th><th>confidence</th><th>status</th></tr></thead>
            <tbody>
              {cov.map(([f, c]) => (
                <tr key={f}><td>{f}</td><td>{c.ref_views}</td><td>{c.syn_views}</td><td>{c.error_px != null ? `${c.error_px} px` : ""}</td><td><span className="twb-bar"><i style={{ width: `${Math.round(c.confidence * 100)}%`, background: STATUS_COLOUR[c.status] }} /></span>{Math.round(c.confidence * 100)}%</td><td><i className="twb-dot" style={{ background: STATUS_COLOUR[c.status] }} />{c.status.replace("_", " ")}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="twb-card">
          <h2>What the engine learned</h2>
          <ul className="twb-learned">{pack.features_learned.map((f) => <li key={f.feature}><i className="twb-dot" style={{ background: STATUS_COLOUR[f.status] }} /><b>{f.feature}</b> {f.statement}</li>)}</ul>
        </section>
        <section className="twb-card">
          <h2>Generation versus variant</h2>
          <ul className="twb-learned">{pack.variants.map((v) => <li key={v.name}><b>{v.name}</b> affects {v.affects.join(", ")}. {v.note}</li>)}</ul>
          <h2>Conflicts: capture versus reference</h2>
          <ul className="twb-learned">{pack.conflicts.map((c) => <li key={c.topic}><b>{c.topic}</b> capture: {c.synthetic}; reference: {c.reference}. {c.resolution}</li>)}</ul>
        </section>
      </div>

      <div className="twb-source-bar">
        <p>Reference photographs used (class A, Creative Commons, attribution below each; overlays on CC BY SA photographs are shared under the same licence). Nothing from view only or commercial sources is shown or used.</p>
        <div className="twb-modes" role="group" aria-label="Image">
          <button type="button" className={!overlays ? "is-on" : ""} onClick={() => setOverlays(false)}>Photo</button>
          <button type="button" className={overlays ? "is-on" : ""} onClick={() => setOverlays(true)}>Skeleton overlay</button>
        </div>
      </div>
      <div className="twb-grid">
        {pack.references.map((r) => {
          const src = overlays && r.overlay ? r.overlay : r.image;
          return (
            <figure key={r.id}>
              <button type="button" onClick={() => onOpen({ src, caption: `${r.role} (${r.variant}) by ${r.creator}, CC ${r.license.toUpperCase()} ${r.license_version} via ${r.source}` })} aria-label={`Open reference ${r.index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Reference ${r.index}, ${r.role}`} width={r.width} height={r.height} />
              </button>
              <figcaption>
                <b>{r.role.replace(/_/g, " ")}</b> {r.variant !== "generation" ? `(${r.variant}) ` : ""}{r.used_for_fit && r.camera ? `az ${Math.round(r.camera.az)} el ${Math.round(r.camera.el)} fov ${Math.round(r.camera.fov)}` : "not fitted"}{r.iou != null ? `, silhouette IoU ${r.iou}` : ""}
                <span><a href={r.page_url} target="_blank" rel="noreferrer">{r.creator}</a>, CC {r.license.toUpperCase()} {r.license_version} via {r.source}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>

      <section className="twb-card twb-card-wide">
        <h2>Sources and rights</h2>
        <table>
          <thead><tr><th>source</th><th>kind</th><th>class</th><th>licence</th><th>used for</th></tr></thead>
          <tbody>{pack.sources.map((s) => <tr key={s.id}><td><a href={s.url} target="_blank" rel="noreferrer">{s.title}</a></td><td>{s.kind}</td><td>{s.rights_class}</td><td>{s.licence}</td><td>{s.used_for}</td></tr>)}</tbody>
        </table>
        <ul className="twb-learned">{pack.provenance_notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
        <button type="button" className="twb-toggle" onClick={() => setGraph((g) => !g)}>{graph ? "Hide" : "Show"} knowledge graph</button>
        {graph && <dl className="twb-graph">{Object.entries(pack.knowledge_graph).map(([k, items]) => <Fragment key={k}><dt>{k}</dt><dd>{items.map((it, i) => <span key={i}>{it}</span>)}</dd></Fragment>)}</dl>}
        {data && <p className="twb-muted">Skeleton data: {data.curves.length} curve instances, {Object.keys(data.cameras).length} cameras.</p>}
      </section>
    </div>
  );
}
