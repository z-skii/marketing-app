"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/**
 * The working sheet: a temporary task inside the current context. Phone:
 * a bottom sheet entering from 24px below. From 768px: a 480px right
 * drawer entering from 32px to the right, or an anchored 320px menu
 * (variant "menu"). Native dialog: focus is trapped, Escape closes, focus
 * returns to the trigger.
 */
export function Sheet({ title, trigger, triggerClass, triggerStyle, triggerLabel, variant = "sheet", children }: { title: string; trigger: ReactNode; triggerClass?: string; triggerStyle?: React.CSSProperties; triggerLabel?: string; variant?: "sheet" | "full" | "menu"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const close = useCallback(() => { setOpen(false); opener.current?.focus(); }, []);
  return (
    <>
      <button ref={opener} type="button" className={triggerClass} style={triggerStyle} aria-label={triggerLabel} aria-haspopup="dialog" onClick={() => setOpen(true)}>{trigger}</button>
      <dialog ref={dialog} className={`sheet${variant === "full" ? " sheet-full" : ""}${variant === "menu" ? " sheet-menu" : ""}`} aria-label={title} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="sheet-body">
          <div className="sheet-bar">
            <span className="sheet-title">{title}</span>
            <button type="button" className="link link-plain t-action preview-close" onClick={close}><X size={18} aria-hidden />Close</button>
          </div>
          {open && children}
        </div>
      </dialog>
    </>
  );
}
