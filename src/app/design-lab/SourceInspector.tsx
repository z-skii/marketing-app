"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowsOutSimple, X } from "@phosphor-icons/react";

/**
 * Source inspection: the one accessible way to see a source at its
 * original ratio. A native dialog holds the uncropped image, Close and
 * Escape return focus to the control that opened it. No playback, no
 * zoom theatre: the same file, larger. Used for reference stills, supplied
 * creatives, placement concepts, work samples and illustrations.
 */
export function InspectButton({ src, alt, label, className = "btn btn-quiet link-ink", style, icon = true, children }: { src: string; alt: string; label: string; className?: string; style?: React.CSSProperties; icon?: boolean; children?: ReactNode }) {
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
      <button ref={opener} type="button" className={className} style={style} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {children ?? <>{icon && <ArrowsOutSimple size={18} aria-hidden />}{label}</>}
      </button>
      <dialog ref={dialog} className="lab-inspector" aria-label={label} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="lab-inspector-body">
          <div className="lab-inspector-bar">
            <span className="t-meta" style={{ color: "var(--tm-muted-dark)" }}>{alt}</span>
            <button type="button" className="icon-btn" aria-label="Close" onClick={close} style={{ color: "var(--tm-on-dark)" }}><X size={20} /></button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {open && <img src={src} alt={alt} />}
        </div>
      </dialog>
    </>
  );
}
