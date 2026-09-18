"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/**
 * Media inspection: the reference, finished creative or vehicle photo,
 * contained on ink, independent of the surrounding task. 260ms entry,
 * controls fade in over 100ms, Escape, Back and Close return to the same
 * scroll position and the source element. No zoom theatre.
 */
export function Viewer({ src, alt, label, className, style, children }: { src: string; alt: string; label: string; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => { setOpen(false); opener.current?.focus(); };
  return (
    <>
      <button ref={opener} type="button" className={className} style={style} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label={label}>{children}</button>
      <dialog ref={dialog} className="viewer on-ink" aria-label={label} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="viewer-bar">
          <span className="t-fact" style={{ color: "var(--v2-inverse-muted)" }}>{alt}</span>
          <button type="button" className="icon-btn" aria-label="Close" onClick={close}><X size={20} /></button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {open && <img src={src} alt={alt} />}
      </dialog>
    </>
  );
}
