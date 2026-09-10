"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle, WarningCircle, Camera } from "@phosphor-icons/react";
import { SCAN_ANGLE_LABEL, type ScanAngle, type VehicleRecognition, type VehicleScan } from "@/lib/vehicles/types";
import { uploadWithProgress } from "@/lib/client/media-meta";
import { acceptRecognition, catalogMakesAction, catalogModelsAction, getScanStatus, retakeScan, runScanNow } from "../actions";

/**
 * Where the scan is. Polls while the pipeline runs, asks for retakes when
 * coverage is short, asks the person to confirm what the car is, and links
 * to the car when done. The reconstruction state is honest: without a
 * provider it says so and the car keeps its photos.
 */
const STAGES: { key: VehicleScan["status"][]; label: string }[] = [
  { key: ["queued", "validating"], label: "Checking coverage" },
  { key: ["needs_retake"], label: "More angles needed" },
  { key: ["recognizing"], label: "Identifying your car" },
  { key: ["reconstructing"], label: "Building your 3D car" },
  { key: ["waiting_provider"], label: "Photos saved" },
  { key: ["complete"], label: "Done" },
];

export function ScanStatus({ initial, devMode }: { initial: VehicleScan; devMode: boolean }) {
  const [scan, setScan] = useState(initial);
  const [confirmed, setConfirmed] = useState<{ vehicleId: string } | null>(initial.vehicle_id && initial.status === "complete" ? { vehicleId: initial.vehicle_id } : null);
  const running = ["queued", "validating", "recognizing", "reconstructing"].includes(scan.status);

  useEffect(() => {
    if (!running) return;
    const t = window.setInterval(async () => {
      const r = devMode ? await runScanNow(scan.id) : await getScanStatus(scan.id);
      if (r.ok) setScan(r.scan);
    }, 2500);
    return () => window.clearInterval(t);
  }, [running, scan.id, devMode]);

  const stageIndex = STAGES.findIndex((s) => s.key.includes(scan.status));

  return (
    <div>
      {/* Progress */}
      <div className="rounded-[var(--radius-card)] bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="font-display text-[1.125rem] font-800 tracking-[-0.02em]">
            {scan.status === "failed" ? "Scan failed" : STAGES[stageIndex]?.label ?? scan.stage ?? "Processing"}
          </p>
          <span className="tnum text-sm text-ink-faint">{scan.progress}%</span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={scan.progress} aria-valuemin={0} aria-valuemax={100}>
          <div className={`h-full rounded-full transition-[width] duration-500 ${scan.status === "failed" ? "bg-alert" : scan.status === "waiting_provider" ? "bg-ink-faint" : "bg-signal"}`} style={{ width: `${scan.progress}%` }} />
        </div>
        {scan.status === "waiting_provider"
          ? <p className="mt-2 text-sm text-ink-soft">3D reconstruction is not set up in this environment yet. Your photos are saved and will be used when it is.</p>
          : scan.stage && <p className="mt-2 text-sm text-ink-soft">{scan.stage}</p>}
        {running && <p className="mt-1 flex items-center gap-2 text-xs text-ink-faint"><span className="live-dot" aria-hidden />You can leave this page. We will notify you.</p>}
        {scan.error && <p role="alert" className="mt-2 text-sm alert-text">{scan.error}</p>}
      </div>

      {/* Coverage */}
      {scan.quality && (
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-[1.0625rem] font-700">{scan.quality.label}</p>
            <span className="tnum text-sm text-ink-faint">{scan.quality.coverage_pct}% coverage</span>
          </div>
          {scan.status === "needs_retake" && <Retake scan={scan} onUpdated={setScan} devMode={devMode} />}
        </div>
      )}

      {/* Recognition */}
      {(scan.status === "recognizing" || scan.status === "reconstructing" || scan.status === "waiting_provider" || scan.status === "complete") && !confirmed && (
        <Recognize scan={scan} onDone={(vehicleId, next) => { setConfirmed({ vehicleId }); setScan(next); }} />
      )}

      {/* Result */}
      {confirmed && (
        <div className="mt-4 rounded-[var(--radius-card)] bg-surface p-4">
          <p className="flex items-center gap-2 font-display text-[1.125rem] font-800 tracking-[-0.02em]">
            <CheckCircle size={22} weight="fill" className="text-signal" aria-hidden />
            {scan.model ? "Your 3D car is ready" : "Your car is on your profile"}
          </p>
          {!scan.model && (
            <p className="mt-1 text-sm text-ink-soft">
              {scan.status === "waiting_provider" ? "3D reconstruction is not set up in this environment yet. Your photos are saved and will be used when it is." : "Photos saved. The 3D model appears here when reconstruction finishes."}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <Link href={`/me/vehicles/${confirmed.vehicleId}`} className="btn btn-signal">See my car</Link>
            <Link href="/home?f=cars" className="btn">Car campaigns</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Retake({ scan, onUpdated, devMode }: { scan: VehicleScan; onUpdated: (s: VehicleScan) => void; devMode: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const missing = scan.quality?.issues.filter((i) => i.code === "missing_angle" && i.angle).map((i) => i.angle as ScanAngle) ?? [];
  const other = scan.quality?.issues.filter((i) => i.code !== "missing_angle") ?? [];

  const take = async (angle: ScanAngle, file: File | null) => {
    if (!file) return;
    setBusy(angle);
    try {
      const url = await uploadWithProgress(file, "vehicles", () => {});
      const r = await retakeScan(scan.id, [{ angle, url }]);
      if (r.ok) {
        if (devMode) { const n = await runScanNow(scan.id); if (n.ok) onUpdated(n.scan); else onUpdated(r.scan); }
        else onUpdated(r.scan);
      }
    } finally { setBusy(null); }
  };

  return (
    <div className="mt-3">
      {other.map((i) => (
        <p key={i.code} className="flex items-center gap-2 text-sm text-ink-soft"><WarningCircle size={18} className="text-alert" aria-hidden />{i.label}</p>
      ))}
      {missing.length > 0 && (
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {missing.map((a) => (
            <li key={a}>
              <input id={`retake-${a}`} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => take(a, e.target.files?.[0] ?? null)} />
              <label htmlFor={`retake-${a}`} className="btn w-full cursor-pointer justify-start">
                <Camera size={20} aria-hidden />
                {busy === a ? "Uploading" : `Rescan ${SCAN_ANGLE_LABEL[a].toLowerCase()}`}
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Recognize({ scan, onDone }: { scan: VehicleScan; onDone: (vehicleId: string, scan: VehicleScan) => void }) {
  const r = scan.recognition;
  const sure = !!r && r.confidence >= 0.6 && r.make && r.model;
  const [editing, setEditing] = useState(!sure);
  const [form, setForm] = useState<Partial<VehicleRecognition>>({
    year_min: r?.year_min ?? null, make: r?.make ?? "", model: r?.model ?? "", color: r?.color ?? "", body_type: r?.body_type ?? "",
  });
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!editing || !form.year_min) return;
    catalogMakesAction(form.year_min).then(setMakes).catch(() => setMakes([]));
  }, [editing, form.year_min]);
  useEffect(() => {
    if (!editing || !form.year_min || !form.make) return;
    catalogModelsAction(form.year_min, form.make).then(setModels).catch(() => setModels([]));
  }, [editing, form.year_min, form.make]);

  const accept = (correction?: Partial<VehicleRecognition>) => start(async () => {
    setError(null);
    const res = await acceptRecognition(scan.id, correction);
    if (!res.ok) { setError(res.error); return; }
    onDone(res.vehicleId, res.scan);
  });

  const yearLabel = r?.year_min && r?.year_max && r.year_min !== r.year_max ? `${r.year_min} to ${r.year_max}` : r?.year_min ?? "";

  return (
    <div className="mt-4 rounded-[var(--radius-card)] bg-surface p-4">
      {sure && !editing ? (
        <>
          <p className="text-sm text-ink-soft">We think this is</p>
          <p className="mt-1 font-display text-[1.5rem] leading-none font-800 tracking-[-0.03em]">{yearLabel} {r!.make} {r!.model}</p>
          {r!.color && <p className="mt-1.5 text-sm text-ink-faint">{r!.color}{r!.body_type ? ` · ${r!.body_type}` : ""}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" className="btn btn-signal flex-1" disabled={pending} onClick={() => accept()}>Correct</button>
            <button type="button" className="btn" onClick={() => setEditing(true)}>Change</button>
          </div>
        </>
      ) : (
        <>
          <p className="font-display text-[1.0625rem] font-700">{r ? "Check the details" : "Tell us what car this is"}</p>
          {!r && <p className="mt-1 text-sm text-ink-faint">We could not identify it from the photos.</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input className="field" inputMode="numeric" placeholder="Year" aria-label="Year" value={form.year_min ?? ""} onChange={(e) => setForm({ ...form, year_min: Number(e.target.value.replace(/\D/g, "")) || null })} />
            <input className="field" list="scan-makes" placeholder="Make" aria-label="Make" autoCapitalize="words" value={form.make ?? ""} onChange={(e) => setForm({ ...form, make: e.target.value })} />
            <input className="field" list="scan-models" placeholder="Model" aria-label="Model" autoCapitalize="words" value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })} />
            <input className="field" placeholder="Color" aria-label="Color" autoCapitalize="words" value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </div>
          <datalist id="scan-makes">{makes.map((m) => <option key={m} value={m} />)}</datalist>
          <datalist id="scan-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
          {error && <p role="alert" className="mt-2 text-sm alert-text">{error}</p>}
          <button
            type="button" className="btn btn-signal btn-lg mt-3 w-full"
            disabled={pending || !form.year_min || !form.make || !form.model}
            onClick={() => accept({ year_min: form.year_min ?? null, year_max: form.year_min ?? null, make: form.make ?? null, model: form.model ?? null, color: form.color || null, body_type: form.body_type || null, confidence: 1 })}
          >
            {pending ? "Saving" : "Save my car"}
          </button>
        </>
      )}
    </div>
  );
}
