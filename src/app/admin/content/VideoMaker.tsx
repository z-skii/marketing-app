"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Turns a set of rendered slides into a real video file, entirely in the
 * browser: the slides play on a canvas with a slow zoom and crossfades, the
 * canvas stream records via MediaRecorder, and the result downloads as
 * mp4/webm — ready to post on TikTok or Instagram with music added in-app.
 */

const SLIDE_MS = 3000;
const FADE_MS = 450;
const FPS = 30;

function pickMime(): string {
  const candidates = ["video/mp4", "video/webm;codecs=vp9", "video/webm"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (/^https?:\/\//.test(url)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

/** Cover-fit draw with a slow push-in. */
function drawSlide(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  progress: number,
  alpha: number,
) {
  const zoom = 1.04 + progress * 0.08;
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  ctx.globalAlpha = 1;
}

export function VideoMaker({ urls, onClose }: { urls: string[]; onClose: () => void }) {
  const [status, setStatus] = useState<"making" | "done" | "error">("making");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [ext, setExt] = useState("webm");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The effect is restartable (React strict mode mounts twice in dev): each
  // run is independently cancellable and the cleanup cancels the old one.
  useEffect(() => {
    let cancelled = false;
    let recorderRef: MediaRecorder | null = null;
    (async () => {
      try {
        const mime = pickMime();
        if (!mime) throw new Error("This browser can't record video — try Chrome or Safari.");
        setExt(mime.startsWith("video/mp4") ? "mp4" : "webm");

        const images = await Promise.all(urls.map(loadImage));
        if (cancelled) return;
        const first = images[0];
        const w = 1080;
        const h = Math.round((first.height / first.width) * 1080);
        const canvas = canvasRef.current!;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;

        const stream = canvas.captureStream(FPS);
        const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
        recorderRef = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
        const stopped = new Promise<void>((resolve) => {
          recorder.onstop = () => resolve();
        });
        recorder.start(250);

        const total = images.length * SLIDE_MS;
        const t0 = performance.now();
        await new Promise<void>((resolve) => {
          const frame = (now: number) => {
            const t = now - t0;
            if (cancelled) return resolve();
            if (t >= total) return resolve();
            const i = Math.min(images.length - 1, Math.floor(t / SLIDE_MS));
            const tIn = t - i * SLIDE_MS;
            ctx.fillStyle = "#0b0b0c";
            ctx.fillRect(0, 0, w, h);
            drawSlide(ctx, images[i], w, h, tIn / SLIDE_MS, 1);
            // Crossfade the next slide in over the last FADE_MS.
            if (i < images.length - 1 && tIn > SLIDE_MS - FADE_MS) {
              const a = (tIn - (SLIDE_MS - FADE_MS)) / FADE_MS;
              drawSlide(ctx, images[i + 1], w, h, 0, a);
            }
            setProgress(Math.round((t / total) * 100));
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });

        recorder.stop();
        await stopped;
        if (cancelled) return;
        const blob = new Blob(chunks, { type: mime });
        setBlobUrl(URL.createObjectURL(blob));
        setStatus("done");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Video creation failed.");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (recorderRef && recorderRef.state !== "inactive") recorderRef.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [urls]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-label="Make video"
    >
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-ink/50" />
      <div className="relative w-full max-w-sm border-[1.5px] border-ink bg-paper p-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow !text-signal">Video</p>
          <button type="button" onClick={onClose} aria-label="Close" className="font-mono text-sm text-ink-faint hover:text-ink">
            ✕
          </button>
        </div>

        {/* The canvas doubles as the live preview while recording. */}
        <canvas ref={canvasRef} className="mt-3 w-full border border-ink bg-ink" />

        {status === "making" && (
          <p className="tnum mt-3 font-mono text-xs text-ink-faint">making your video… {progress}%</p>
        )}
        {status === "error" && (
          <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>
        )}
        {status === "done" && blobUrl && (
          <div className="mt-3 flex flex-col gap-2">
            <p className="font-mono text-xs text-rise">Final video ready — check it, then save.</p>
            <video src={blobUrl} controls playsInline className="w-full border border-ink" />
            <a href={blobUrl} download={`tapmart-video.${ext}`} className="btn btn-signal !py-2.5 text-center">
              Save final video
            </a>
            <p className="font-mono text-[0.625rem] text-ink-faint">
              This is the finished file — post it in TikTok or Instagram and add trending audio there.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
