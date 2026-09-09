"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Alert } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type CameraFailure = "unsupported" | "denied" | "unavailable";

export interface CameraCaptureProps {
  /** Title shown at the top: "Clock in" / "Clock out". */
  title: string;
  /** Called once with the captured JPEG. The panel keeps showing the frozen frame while `busy` is true. */
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  /** The parent is uploading; shows progress and disables controls. */
  busy?: boolean;
  /** Progress text shown while busy, e.g. "Uploading photo…". */
  busyLabel?: string;
  /** Rendered when the camera cannot be used (denied / no camera). Lets the parent offer a no-photo fallback. */
  renderFallback?: (failure: CameraFailure, retry: () => void) => React.ReactNode;
  /** Short line under the viewfinder. */
  hint?: React.ReactNode;
}

const MAX_WIDTH = 1280;
const JPEG_QUALITY = 0.8;

/**
 * Inline full-screen live camera. Uses getUserMedia only (no file input, so no gallery uploads).
 * One tap captures a frame → JPEG blob (≤1280px wide) and hands it to the parent.
 */
export function CameraCapture({ title, onCapture, onCancel, busy, busyLabel, renderFallback, hint }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [failure, setFailure] = useState<CameraFailure | null>(null);
  const [captured, setCaptured] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setFailure("unsupported");
        return;
      }
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        } catch {
          // Desktop / no rear camera: accept any camera.
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          try { await v.play(); } catch { /* autoplay is allowed for muted inline video; ignore */ }
        }
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        const name = (e as { name?: string } | null)?.name ?? "";
        setFailure(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      }
    })();
    return () => { cancelled = true; stop(); };
  }, [attempt, stop]);

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !ready || captured || busy) return;
    const vw = v.videoWidth || 1280, vh = v.videoHeight || 960;
    const scale = Math.min(1, MAX_WIDTH / vw);
    c.width = Math.round(vw * scale);
    c.height = Math.round(vh * scale);
    const g = c.getContext("2d");
    if (!g) return;
    g.drawImage(v, 0, 0, c.width, c.height);
    setCaptured(true);
    stop();
    c.toBlob((blob) => {
      if (!blob) { retry(); return; }
      onCapture(blob);
    }, "image/jpeg", JPEG_QUALITY);
  };

  /** Reset and re-open the camera (state resets live here, not in the effect). */
  const retry = () => {
    setReady(false);
    setFailure(null);
    setCaptured(false);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-2">
        <div className="text-[15px] font-semibold">{title}</div>
        <button type="button" onClick={() => { stop(); onCancel(); }} disabled={busy} className="p-2 -mr-2 rounded-full text-white/80 hover:bg-white/10 disabled:opacity-40" aria-label="Cancel">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        {failure && busy ? (
          <div className="flex flex-col items-center gap-2 text-[14px] font-medium"><Loader2 className="h-7 w-7 animate-spin" />{busyLabel ?? "Saving…"}</div>
        ) : failure ? (
          <div className="w-full max-w-sm px-5 space-y-3 text-[14px]">
            <Alert tone="warn" title={failure === "denied" ? "Camera access was blocked" : failure === "unsupported" ? "Camera not supported here" : "No camera found"}>
              {failure === "denied" && "Allow camera access for this site in your browser settings, then try again. On iPhone: Settings → Safari → Camera → Allow."}
              {failure === "unsupported" && "This browser can't open the camera. Open Storeday in Safari (iPhone) or Chrome (Android) — or add it to your home screen."}
              {failure === "unavailable" && "We couldn't start a camera on this device. Close other apps using the camera and try again."}
            </Alert>
            <Button type="button" variant="secondary" size="lg" block onClick={retry}><Camera className="h-4 w-4" />Try again</Button>
            {renderFallback?.(failure, retry)}
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay className={cn("absolute inset-0 h-full w-full object-cover", captured && "hidden")} />
            <canvas ref={canvasRef} className={cn("absolute inset-0 h-full w-full object-cover", !captured && "hidden")} />
            {!ready && !captured && (
              <div className="relative flex flex-col items-center gap-2 text-white/80 text-[13px]">
                <Loader2 className="h-6 w-6 animate-spin" />Starting camera…
              </div>
            )}
            {busy && (
              <div className="absolute inset-x-0 bottom-0 top-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-[14px] font-medium">
                <Loader2 className="h-7 w-7 animate-spin" />{busyLabel ?? "Saving…"}
              </div>
            )}
          </>
        )}
      </div>

      {!failure && (
        <div className="px-4 pt-3 pb-[max(env(safe-area-inset-bottom),16px)] flex flex-col items-center gap-2">
          {hint && <div className="text-[12.5px] text-white/70 text-center">{hint}</div>}
          <button
            type="button"
            onClick={capture}
            disabled={!ready || captured || !!busy}
            aria-label="Take photo"
            className="h-[76px] w-[76px] rounded-full border-4 border-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            <span className="h-[60px] w-[60px] rounded-full bg-white" />
          </button>
          <div className="text-[12px] text-white/60">Tap to take a live photo</div>
        </div>
      )}
    </div>
  );
}

/** Small device summary stored with each verification (no fingerprinting beyond what the browser already exposes). */
export function deviceInfo(): Record<string, unknown> {
  if (typeof navigator === "undefined") return {};
  const n = navigator as Navigator & { userAgentData?: { platform?: string; mobile?: boolean }; standalone?: boolean };
  return {
    userAgent: n.userAgent,
    platform: n.userAgentData?.platform ?? n.platform ?? null,
    mobile: n.userAgentData?.mobile ?? null,
    screen: typeof screen !== "undefined" ? `${screen.width}x${screen.height}` : null,
    dpr: typeof window !== "undefined" ? window.devicePixelRatio : null,
    language: n.language,
    standalone: (typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches) || n.standalone === true,
    tzOffsetMin: new Date().getTimezoneOffset(),
  };
}
