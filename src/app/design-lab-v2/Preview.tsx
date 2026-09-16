"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";

/**
 * Card becomes detail. The media a person tapped continues into the object
 * preview as one shared object: the source copy is hidden while the
 * preview copy moves from the source bounds to its resting bounds (320ms,
 * cubic-bezier(0.22, 1, 0.36, 1)); the rest of the preview fades in once
 * the media has landed. On phone the preview is full height; from 768px
 * the media expands into the region left of a 560px requirements pane.
 * Closing (240ms) returns to the same scroll position and the element that
 * opened it. The first phase opens a read-only preview only.
 *
 * `children` receives `open`; any media button or View action may call it.
 */
export type OpenPreview = (e: React.MouseEvent<HTMLElement>) => void;

export function Preview({ id, title, eyebrow = "Fictional preview", media, mediaRatio, mediaAlt, mediaFit = "cover", mediaPosition, content, children }: {
  id: string; title: string; eyebrow?: string; media: string | null; mediaRatio: string; mediaAlt: string; mediaFit?: "cover" | "contain"; mediaPosition?: string;
  content: ReactNode; children: (open: OpenPreview) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(false);
  const [from, setFrom] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const srcSel = `[data-v2-src="${id}"]`;
  const openerSel = `[data-v2-opener="${id}"]`;

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // FLIP: the preview media starts at the tapped media bounds; the source copy stays hidden until the move ends.
  useLayoutEffect(() => {
    if (!open) return;
    const el = target.current;
    const src = document.querySelector<HTMLElement>(srcSel);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = el?.getBoundingClientRect();
    if (!el || !from || reduced || !t || !t.width || !t.height) { const id = setTimeout(() => setLanded(true), 0); return () => clearTimeout(id); }
    if (src) src.style.visibility = "hidden";
    el.style.transition = "none";
    el.style.transformOrigin = "top left";
    el.style.transform = `translate(${from.left - t.left}px, ${from.top - t.top}px) scale(${from.width / t.width}, ${from.height / t.height})`;
    const raf = requestAnimationFrame(() => {
      el.style.transition = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)";
      el.style.transform = "translate(0, 0) scale(1, 1)";
    });
    const done = setTimeout(() => { setLanded(true); if (src) src.style.visibility = ""; }, 330);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); if (src) src.style.visibility = ""; };
  }, [open, from, srcSel]);

  const openFrom: OpenPreview = (e) => {
    const host = e.currentTarget;
    const img = (host.querySelector("img") ?? host.closest(".obj")?.querySelector("img") ?? null) as HTMLElement | null;
    for (const stale of document.querySelectorAll(`${srcSel}, ${openerSel}`)) { stale.removeAttribute("data-v2-src"); stale.removeAttribute("data-v2-opener"); }
    if (img) img.setAttribute("data-v2-src", id);
    host.setAttribute("data-v2-opener", id);
    const r = (img ?? host).getBoundingClientRect();
    setFrom({ left: r.left, top: r.top, width: r.width, height: r.height });
    setLanded(false);
    setOpen(true);
  };
  const close = () => { setOpen(false); setLanded(false); document.querySelector<HTMLElement>(openerSel)?.focus(); };

  return (
    <>
      {children(openFrom)}
      <dialog ref={dialog} id={`preview-${id}`} className="preview" aria-label={title} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="preview-body" data-landed={landed ? "true" : "false"}>
          <div className="preview-stage">
            {open && (media ? (
              <div ref={target} className="preview-media" style={{ aspectRatio: mediaRatio }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media} alt={mediaAlt} style={{ objectFit: "contain", objectPosition: mediaPosition }} data-fit={mediaFit} />
              </div>
            ) : (
              <div className="preview-media media-fallback" style={{ aspectRatio: mediaRatio }}>{mediaAlt}</div>
            ))}
          </div>
          <div className="preview-pane">
            <div className="preview-bar">
              <button type="button" className="link link-plain t-action preview-close" onClick={close}><X size={18} aria-hidden />Close</button>
              <span className="t-note">{eyebrow}</span>
              <span style={{ width: 72 }} aria-hidden />
            </div>
            {open && <div className="preview-content">{content}</div>}
          </div>
        </div>
      </dialog>
    </>
  );
}
