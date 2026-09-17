"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { LabStrip } from "./motion";

/**
 * Object continuity for V3: the media a person selected continues into an
 * opaque working task as one object. The source copy is hidden while the
 * task copy moves from the source bounds to its resting bounds in 440ms
 * (open easing, transform only, measured once); the reading surface is
 * available immediately. Phone: a full height opaque task with a compact
 * header; from 768px the media territory sits beside a 476px reading
 * pane. Close, Escape or browser Back returns in 280ms to the exact
 * scroll position and the control that opened it. ?open=<id> is native
 * history so the working preview can be entered from the public page.
 */
export type OpenFn = (e?: React.MouseEvent<HTMLElement> | null) => void;

export function Open({ id, title, media, mediaRatio, mediaAlt, mediaFit = "cover", mediaPosition, kind, content, children, query = "open", header }: {
  id: string; title: string; media: string | null; mediaRatio: string; mediaAlt: string; mediaFit?: "cover" | "contain"; mediaPosition?: string; kind: string;
  content: ReactNode; children: (open: OpenFn) => ReactNode; query?: string; header?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [landed, setLanded] = useState(false);
  const [from, setFrom] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const scrollY = useRef(0);
  const pushed = useRef(false);
  const srcSel = `[data-x-src="${id}"]`;
  const openerSel = `[data-x-opener="${id}"]`;

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) { d.showModal(); heading.current?.focus(); }
    if (!open && d.open) d.close();
  }, [open]);

  // arrival through ?open=<id>: open without a measured source, keep the URL
  useEffect(() => {
    const want = new URLSearchParams(location.search).get(query);
    if (want === id) { const t = setTimeout(() => { setFrom(null); setLanded(true); setOpen(true); }, 0); return () => clearTimeout(t); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // browser Back closes
  useEffect(() => {
    const onPop = () => { if (new URLSearchParams(location.search).get(query) !== id) { setOpen(false); setLanded(false); pushed.current = false; } };
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, [id, query]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = target.current;
    const src = document.querySelector<HTMLElement>(srcSel);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = el?.getBoundingClientRect();
    if (!el || !from || reduced || !t || !t.width || !t.height) { const k = setTimeout(() => setLanded(true), 0); return () => clearTimeout(k); }
    if (src) src.style.visibility = "hidden";
    el.style.transition = "none"; el.style.transformOrigin = "top left";
    el.style.transform = `translate(${from.left - t.left}px, ${from.top - t.top}px) scale(${from.width / t.width}, ${from.height / t.height})`;
    const raf = requestAnimationFrame(() => { el.style.transition = "transform 440ms cubic-bezier(0.16, 1, 0.3, 1)"; el.style.transform = "translate(0, 0) scale(1, 1)"; });
    const done = setTimeout(() => { setLanded(true); if (src) src.style.visibility = ""; }, 450);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); if (src) src.style.visibility = ""; };
  }, [open, from, srcSel]);

  const openFrom: OpenFn = (e) => {
    scrollY.current = window.scrollY;
    const host = e?.currentTarget as HTMLElement | undefined;
    if (host) {
      const img = (host.querySelector("img") ?? host.closest(".x-obj")?.querySelector("img") ?? null) as HTMLElement | null;
      for (const stale of document.querySelectorAll(`${srcSel}, ${openerSel}`)) { stale.removeAttribute("data-x-src"); stale.removeAttribute("data-x-opener"); }
      if (img) img.setAttribute("data-x-src", id);
      host.setAttribute("data-x-opener", id);
      const r = (img ?? host).getBoundingClientRect();
      setFrom({ left: r.left, top: r.top, width: r.width, height: r.height });
    } else setFrom(null);
    const u = new URL(location.href); if (u.searchParams.get(query) !== id) { u.searchParams.set(query, id); history.pushState(null, "", u); pushed.current = true; }
    setLanded(false); setOpen(true);
  };
  const close = () => {
    setOpen(false); setLanded(false);
    const u = new URL(location.href);
    if (u.searchParams.get(query) === id) { if (pushed.current) history.back(); else { u.searchParams.delete(query); history.replaceState(null, "", u); } }
    pushed.current = false;
    const opener = document.querySelector<HTMLElement>(openerSel);
    requestAnimationFrame(() => { window.scrollTo({ top: scrollY.current }); opener?.focus(); });
  };

  return (
    <>
      {children(openFrom)}
      <dialog ref={dialog} id={`open-${id}`} className="x-task" aria-label={title} onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <div className="x-task-body" data-landed={landed ? "true" : "false"} data-kind={kind}>
          <div className="x-task-head paper">
            <h2 ref={heading} tabIndex={-1} className="t-object x-task-title">{title}</h2>
            <button type="button" className="link link-plain t-action preview-close" onClick={close}><X size={18} aria-hidden />Close</button>
            <div className="x-task-strip">{header ?? <LabStrip />}</div>
          </div>
          <div className="x-task-stage">
            {open && (media ? (
              <div ref={target} className={`x-task-media x-task-media-${kind}`} style={{ aspectRatio: mediaRatio }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media} alt={mediaAlt} style={{ objectFit: mediaFit, objectPosition: mediaPosition }} />
              </div>
            ) : (
              <div className="x-task-media media-fallback" style={{ aspectRatio: mediaRatio }}>{mediaAlt}</div>
            ))}
          </div>
          <div className="x-task-pane">{open && <div className="x-task-content">{content}</div>}</div>
        </div>
      </dialog>
    </>
  );
}
