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
 *
 * `children` receives `open`; any media button or View action may call it.
 */
export type OpenPreview = (e: React.MouseEvent<HTMLElement>) => void;

export function Preview({ id, title, eyebrow = "Fictional preview", media, mediaRatio, mediaAlt, mediaFit = "cover", mediaPosition, content, actions, children }: {
  id: string; title: string; eyebrow?: string; media: string | null; mediaRatio: string; mediaAlt: string; mediaFit?: "cover" | "contain"; mediaPosition?: string;
  content: ReactNode; actions?: ReactNode; children: (open: OpenPreview) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<DOMRect | null>(null);
  const [opener, setOpener] = useState<HTMLElement | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const target = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // FLIP: from the tapped media bounds to the preview media bounds.
  useLayoutEffect(() => {
    if (!open || !from) return;
    const el = target.current; if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = el.getBoundingClientRect();
    if (!t.width || !t.height) return;
    el.style.transition = "none";
    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${from.left - t.left}px, ${from.top - t.top}px) scale(${from.width / t.width}, ${from.height / t.height})`;
    const raf = requestAnimationFrame(() => {
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translate(0, 0) scale(1, 1)";
    });
    return () => cancelAnimationFrame(raf);
  }, [open, from]);

  const openFrom: OpenPreview = (e) => {
    const host = e.currentTarget;
    const img = host.querySelector("img") ?? host.closest(".obj")?.querySelector("img") ?? host;
    setFrom(img.getBoundingClientRect());
    setOpener(host);
    setOpen(true);
  };
  const close = () => { setOpen(false); opener?.focus(); };

  return (
    <>
      {children(openFrom)}
      <dialog ref={dialog} id={`preview-${id}`} className="preview" aria-label={title} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="preview-body">
          <div className="preview-bar">
            <button type="button" className="icon-btn" aria-label="Close" onClick={close}><ArrowLeft size={20} /></button>
            <span className="t-note">{eyebrow}</span>
            <span style={{ width: 44 }} aria-hidden />
          </div>
          {open && (
            <>
              {media ? (
                <div ref={target} className="preview-media" style={{ aspectRatio: mediaRatio, maxHeight: "46svh" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media} alt={mediaAlt} style={{ objectFit: mediaFit, objectPosition: mediaPosition }} />
                </div>
              ) : (
                <div className="preview-media media-fallback" style={{ aspectRatio: mediaRatio, maxHeight: "46svh" }}>{mediaAlt}</div>
              )}
              <div className="preview-content">{content}</div>
              {actions && <div className="preview-actions">{actions}</div>}
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
