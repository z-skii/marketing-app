"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowsOutSimple, X } from "@phosphor-icons/react";

/**
 * Source inspection: the one accessible way to see a source at its
 * original ratio. A native dialog holds the uncropped image or video;
 * Close and Escape return focus to the control that opened it. The same
 * file, larger; nothing else.
 */
export function InspectButton({ src, alt, label, className = "fs-btn fs-btn-quiet fs-link-ink", style, icon = true, children }: { src: string; alt: string; label: string; className?: string; style?: React.CSSProperties; icon?: boolean; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => { setOpen(false); opener.current?.focus(); };
  return (
    <>
      <button ref={opener} type="button" className={className} style={style} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {children ?? <>{icon && <ArrowsOutSimple size={20} aria-hidden />}{label}</>}
      </button>
      <dialog ref={dialog} className="fs-inspector" aria-label={label} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="fs-inspector-body">
          <div className="fs-inspector-bar">
            <span>{alt}</span>
            <button type="button" aria-label="Close" onClick={close}><X size={20} /></button>
          </div>
          {open && (isVideo ? (
            <video src={src} controls playsInline aria-label={alt} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} />
          ))}
        </div>
      </dialog>
    </>
  );
}
