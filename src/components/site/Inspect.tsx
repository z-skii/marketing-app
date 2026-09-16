"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef } from "react";
import { ArrowsOutSimple, X } from "@phosphor-icons/react/dist/ssr";

/**
 * Opens a public-site capture at readable size. The page shows real
 * production screens reduced inside device frames; this is the way to read
 * them. A native dialog: Escape closes it, focus returns to the button, and
 * the image is not fetched until the dialog opens. Phone captures open at
 * their native 390px width, desktop captures at the viewer's width, and the
 * body scrolls in both directions so nothing is cropped.
 */
export function Inspect({ src, alt, label, size, width, height }: { src: string; alt: string; label: string; size: "phone" | "desktop" | "photo"; width: number; height: number }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="fs-btn fs-btn-secondary site-inspect" onClick={() => ref.current?.showModal()} aria-haspopup="dialog">
        <ArrowsOutSimple size={18} aria-hidden /> {label}
      </button>
      <dialog ref={ref} className={`site-viewer is-${size}`} aria-label={alt} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <div className="site-viewer-head">
          <p className="site-meta">{alt}</p>
          <button type="button" className="fs-icon-btn" onClick={() => ref.current?.close()} aria-label="Close"><X size={22} aria-hidden /></button>
        </div>
        <div className="site-viewer-body">
          <img src={src} alt="" width={width} height={height} loading="lazy" decoding="async" />
        </div>
      </dialog>
    </>
  );
}
