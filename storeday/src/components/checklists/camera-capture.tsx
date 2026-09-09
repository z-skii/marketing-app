"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/misc";

/**
 * Full-screen live camera (rear camera when available). Produces a JPEG blob from the live stream —
 * there is no file picker on purpose: the photo must be taken right now.
 */
export function CameraCapture({ title, onCapture, onClose, uploading }: { title: string; onCapture: (blob: Blob) => Promise<void> | void; onClose: () => void; uploading?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setError("This device has no camera access. Open Storeday in Safari or Chrome."); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
        setReady(true);
      } catch (e) {
        setError(e instanceof DOMException && e.name === "NotAllowedError" ? "Camera permission was denied. Allow the camera to continue." : "Could not start the camera.");
      }
    })();
    return () => { cancelled = true; stop(); };
  }, [facing, stop]);

  const snap = async () => {
    const v = videoRef.current;
    if (!v || !ready) return;
    const w = v.videoWidth || 1280, h = v.videoHeight || 960;
    const scale = Math.min(1, 1280 / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
    const g = canvas.getContext("2d");
    if (!g) return;
    g.drawImage(v, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) { setError("Could not capture the photo. Try again."); return; }
    await onCapture(blob);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black text-white flex flex-col" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between px-4 h-12 shrink-0">
        <div className="text-[14px] font-medium truncate">{title}</div>
        <button type="button" onClick={() => { stop(); onClose(); }} className="p-2 -mr-2 rounded hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
      </div>
      <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center">
        <video ref={videoRef} playsInline muted autoPlay className="max-h-full max-w-full object-contain" />
        {!ready && !error && <div className="absolute inset-0 flex items-center justify-center"><Spinner className="h-6 w-6 border-white/30 border-t-white" /></div>}
        {error && <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-md bg-white/10 p-4 text-center text-[14px]">{error}</div>}
        {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[14px] gap-2"><Spinner className="border-white/30 border-t-white" />Uploading…</div>}
      </div>
      <div className="shrink-0 flex items-center justify-center gap-6 py-5 safe-bottom">
        <button type="button" onClick={() => { setReady(false); setError(null); setFacing((f) => (f === "environment" ? "user" : "environment")); }} className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center" aria-label="Switch camera" disabled={uploading}>
          <RefreshCw className="h-5 w-5" />
        </button>
        <Button type="button" onClick={snap} disabled={!ready || !!uploading} className="h-16 w-16 rounded-full bg-white text-black hover:bg-white/90 p-0" aria-label="Take photo">
          <Camera className="h-7 w-7" />
        </Button>
        <div className="h-12 w-12" />
      </div>
    </div>
  );
}
