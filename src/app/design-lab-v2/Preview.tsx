"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft } from "@phosphor-icons/react";

/**
 * Card becomes detail. The media a person tapped expands into the object
 * preview: on phone the same media bounds grow to the full width of the
 * screen (320ms, cubic-bezier(0.22, 1, 0.36, 1)); from 768px a 560px pane
 * enters from the right while the media keeps its identity. The source
 * image is never stretched: the expansion is a FLIP transform of the
 * media box, then the layout takes over. Closing returns to the same
 * scroll position and the element that opened it. The first phase opens
 * a read-only preview, never a fabricated complete workflow.
 */
export function Preview({ id, title, media, mediaRatio, mediaAlt, trigger, triggerClass, triggerStyle, triggerLabel, children, actions }: {
  id: string; title: string; media: string; mediaRatio: string; mediaAlt: string;
  trigger: ReactNode; triggerClass?: string; triggerStyle?: React.CSSProperties; triggerLabel?: string;
  children: ReactNode; actions?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const from = useRef<DOMRect | null>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // FLIP: measure the tapped media, then play from its bounds to the preview media's bounds.
  useLayoutEffect(() => {
    if (!open) return;
    const el = target.current; const f = from.current; if (!el || !f) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const t = el.getBoundingClientRect();
    const sx = f.width / t.width, sy = f.height / t.height;
    el.style.transition = "none";
    el.style.transform = `translate(${f.left - t.left}px, ${f.top - t.top}px) scale(${sx}, ${sy})`;
    el.style.transformOrigin = "top left";
    requestAnimationFrame(() => {
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translate(0, 0) scale(1, 1)";
    });
  }, [open]);

  const openFrom = (e: React.MouseEvent<HTMLButtonElement>) => {
    const img = (e.currentTarget.querySelector("img") ?? e.currentTarget) as HTMLElement;
    from.current = img.getBoundingClientRect();
    setOpen(true);
  };
  const close = () => { setOpen(false); opener.current?.focus(); };

  return (
    <>
      <button ref={opener} type="button" className={triggerClass} style={triggerStyle} aria-label={triggerLabel} aria-haspopup="dialog" aria-controls={`preview-${id}`} onClick={openFrom}>{trigger}</button>
      <dialog ref={dialog} id={`preview-${id}`} className="preview" aria-label={title} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="preview-body">
          <div className="preview-bar">
            <button type="button" className="icon-btn" aria-label="Back" onClick={close}><ArrowLeft size={20} /></button>
            <span className="t-fact-ink">{title}</span>
            <span style={{ width: 44 }} aria-hidden />
          </div>
          {open && (
            <>
              <div ref={target} className="preview-media" style={{ aspectRatio: mediaRatio, maxHeight: "62dvh" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media} alt={mediaAlt} />
              </div>
              <div className="preview-content">{children}</div>
              {actions && <div className="preview-actions" style={{ margin: "0 var(--v2-pad)" }}>{actions}</div>}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
