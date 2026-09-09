"use client";

import { useRef, useState } from "react";

/**
 * Media uploader: picks files, shows real progress, returns stored URLs.
 * Uses XHR so the progress bar reflects actual bytes, not a fake spinner.
 */

export function Uploader({
  folder, accept = "image/*,video/*", multiple = false, label = "Add media", onUploaded, id,
}: {
  folder: string;
  accept?: string;
  multiple?: boolean;
  label?: string;
  onUploaded: (urls: string[]) => void;
  /** Needed when several uploaders share a folder on one screen. */
  id?: string;
}) {
  const inputId = id ?? `upload-${folder}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadOne = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/v2/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && body.url) resolve(body.url);
          else reject(new Error(body.error ?? "Upload failed."));
        } catch {
          reject(new Error("Upload failed."));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);
      xhr.send(form);
    });

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setError(null);
    setProgress(0);
    const urls: string[] = [];
    try {
      for (const file of Array.from(list).slice(0, 10)) urls.push(await uploadOne(file));
      onUploaded(urls);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef} type="file" accept={accept} multiple={multiple} className="sr-only"
        id={inputId} onChange={(e) => handleFiles(e.target.files)}
      />
      <label htmlFor={inputId} className="btn btn-sm inline-flex cursor-pointer">
        {progress === null ? label : `Uploading… ${progress}%`}
      </label>
      {progress !== null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-1 rounded-full bg-signal transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-signal">{error}</p>}
    </div>
  );
}
