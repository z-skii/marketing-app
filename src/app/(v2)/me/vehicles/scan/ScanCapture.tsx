"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, VideoCamera } from "@phosphor-icons/react";
import { SCAN_ANGLES, SCAN_ANGLE_LABEL, type ScanAngle, type ScanCapture as Capture } from "@/lib/vehicles/types";
import { uploadWithProgress } from "@/lib/client/media-meta";
import { runScanNow, startScan } from "./actions";

/**
 * Guided vehicle scan. Eight markers around the car; tap one, take the
 * photo, move on. A walk-around video is optional. When at least six
 * markers are done the scan can start; all eight is what reconstruction
 * wants, and the status screen will ask for the rest if needed.
 */
type Shot = { file: File; preview: string };

export function ScanCapture({ vehicleId, devMode }: { vehicleId: string | null; devMode: boolean }) {
  const router = useRouter();
  const [shots, setShots] = useState<Partial<Record<ScanAngle, Shot>>>({});
  const [video, setVideo] = useState<File | null>(null);
  const [busy, setBusy] = useState<{ label: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const done = SCAN_ANGLES.filter((a) => shots[a]).length;
  const next = SCAN_ANGLES.find((a) => !shots[a]) ?? null;

  const take = (angle: ScanAngle, file: File | null) => {
    if (!file) return;
    setShots((s) => ({ ...s, [angle]: { file, preview: URL.createObjectURL(file) } }));
  };

  const start = async () => {
    setError(null);
    try {
      const photos: Capture["photos"] = [];
      const list = SCAN_ANGLES.filter((a) => shots[a]);
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        setBusy({ label: `Uploading ${SCAN_ANGLE_LABEL[a].toLowerCase()} (${i + 1} of ${list.length + (video ? 1 : 0)})`, pct: 0 });
        const url = await uploadWithProgress(shots[a]!.file, "vehicles", (pct) => setBusy({ label: `Uploading ${SCAN_ANGLE_LABEL[a].toLowerCase()}`, pct }));
        photos.push({ angle: a, url });
      }
      const video_urls: string[] = [];
      if (video) {
        setBusy({ label: "Uploading walk-around video", pct: 0 });
        video_urls.push(await uploadWithProgress(video, "vehicles", (pct) => setBusy({ label: "Uploading walk-around video", pct })));
      }
      setBusy({ label: "Starting your scan", pct: 100 });
      const r = await startScan({ vehicleId, capture: { photos, detail_photos: [], video_urls, device: { user_agent: navigator.userAgent } } });
      if (!r.ok) throw new Error(r.error);
      if (devMode) await runScanNow(r.scan.id);
      router.push(`/me/vehicles/scan/${r.scan.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the scan.");
      setBusy(null);
    }
  };

  return (
    <div>
      {/* Progress and the one instruction that matters right now. */}
      <div className="flex items-end justify-between">
        <p className="tnum font-display text-[1.5rem] leading-none font-700 tracking-[-0.02em]">
          {done}<span className="text-ink-faint">/{SCAN_ANGLES.length}</span>
        </p>
        <p className="text-right text-sm text-ink-soft">
          {next ? <>Next: <span className="font-display font-600 text-ink">{SCAN_ANGLE_LABEL[next]}</span></> : "All angles done"}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-signal transition-[width] duration-300" style={{ width: `${(done / SCAN_ANGLES.length) * 100}%` }} />
      </div>

      {/* The eight markers, laid out as a walk around the car. */}
      <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Angles">
        {SCAN_ANGLES.map((a) => {
          const shot = shots[a];
          const isNext = a === next;
          return (
            <li key={a}>
              <input id={`shot-${a}`} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => take(a, e.target.files?.[0] ?? null)} />
              <label
                htmlFor={`shot-${a}`}
                className={`relative flex aspect-[3/4] cursor-pointer flex-col items-center justify-end overflow-hidden rounded-[12px] p-1.5 text-center ${
                  shot ? "bg-surface" : isNext ? "bg-surface-2 ring-2 ring-signal" : "bg-surface-2"
                }`}
              >
                {shot ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={shot.preview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <Camera size={26} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isNext ? "text-signal" : "text-ink-faint"}`} aria-hidden />
                )}
                {shot && <CheckCircle size={20} weight="fill" className="absolute top-1.5 right-1.5 text-signal" aria-hidden />}
                <span className={`relative z-10 font-display text-[0.6875rem] font-600 leading-tight ${shot ? "glass-tag px-1.5 py-0.5 text-ink" : "text-ink-soft"}`}>{SCAN_ANGLE_LABEL[a]}</span>
              </label>
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm text-ink-faint">Keep the whole car in the frame. Daylight, no motion blur.</p>

      {/* Optional video. */}
      <div className="mt-5">
        <input id="walk-video" type="file" accept="video/*" capture="environment" className="sr-only" onChange={(e) => setVideo(e.target.files?.[0] ?? null)} />
        <label htmlFor="walk-video" className="link-row cursor-pointer">
          <VideoCamera size={20} aria-hidden />
          {video ? "Walk-around video added" : "Add a slow walk-around video (optional)"}
        </label>
      </div>

      {busy && (
        <div className="mt-5 rounded-[var(--radius-card)] bg-surface p-4">
          <p className="font-display text-[1.0625rem] font-600">{busy.label}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={busy.pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-signal transition-[width] duration-200" style={{ width: `${busy.pct}%` }} />
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm alert-text">{error}</p>}

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-30 mt-6 rail:static">
        <button type="button" className="btn btn-signal btn-lg w-full" disabled={done < 6 || !!busy} onClick={start}>
          {done < 6 ? `Take ${6 - done} more to start` : done < SCAN_ANGLES.length ? "Start scan with what I have" : "Start scan"}
        </button>
      </div>
    </div>
  );
}
