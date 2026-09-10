import type { ClientMediaMeta } from "@/lib/ai/types";

/**
 * Read what the browser can tell us about a video before it uploads:
 * duration, dimensions, size, and a few JPEG frames for the requirement
 * check. Runs entirely on the device; nothing here is a judgement.
 */
export async function readVideoMeta(file: File, frameCount = 3): Promise<ClientMediaMeta> {
  const meta: ClientMediaMeta = { durationSeconds: null, width: null, height: null, sizeBytes: file.size, frames: [] };
  if (!file.type.startsWith("video/")) return meta;

  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = url;
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read this video."));
      window.setTimeout(() => resolve(), 8000);
    });
    if (Number.isFinite(video.duration)) meta.durationSeconds = Math.round(video.duration * 10) / 10;
    meta.width = video.videoWidth || null;
    meta.height = video.videoHeight || null;

    if (meta.durationSeconds && meta.width && meta.height) {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 512 / Math.max(meta.width, meta.height));
      canvas.width = Math.round(meta.width * scale);
      canvas.height = Math.round(meta.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const points = Array.from({ length: frameCount }, (_, i) => ((i + 0.5) / frameCount) * meta.durationSeconds!);
        for (const t of points) {
          const ok = await seek(video, t);
          if (!ok) continue;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          meta.frames!.push(canvas.toDataURL("image/jpeg", 0.72));
        }
      }
    }
  } catch {
    // Leave what we have; the server treats missing numbers as unknown.
  } finally {
    URL.revokeObjectURL(url);
  }
  return meta;
}

function seek(video: HTMLVideoElement, t: number) {
  return new Promise<boolean>((resolve) => {
    const done = () => { video.onseeked = null; resolve(true); };
    video.onseeked = done;
    window.setTimeout(() => { video.onseeked = null; resolve(false); }, 4000);
    try { video.currentTime = t; } catch { resolve(false); }
  });
}

/** Upload one file with real progress. Resolves to the stored URL. */
export function uploadWithProgress(file: File, folder: string, onProgress: (pct: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/v2/upload");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && body.url) resolve(body.url);
        else reject(new Error(body.error ?? "Upload failed."));
      } catch { reject(new Error("Upload failed.")); }
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    xhr.send(form);
  });
}
