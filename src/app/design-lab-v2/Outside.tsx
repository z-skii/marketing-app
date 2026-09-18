"use client";

import { useRef, type ReactNode } from "react";

/**
 * Off-scope navigation. The first phase builds four experiences; every
 * other destination keeps its label and meaning but opens this notice
 * instead of a fabricated screen. Nothing here touches production.
 */
export function Outside({ label, className, children, style }: { label: string; className?: string; children: ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} style={style} onClick={() => ref.current?.showModal()} aria-haspopup="dialog">{children}</button>
      <dialog ref={ref} className="notice" aria-label={`${label}: outside this preview`} onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}>
        <div className="notice-body">
          <p className="t-object" style={{ marginBottom: 8 }}>{label}</p>
          <p className="t-body muted" style={{ marginBottom: 16 }}>Outside this preview. The V2 Lab builds four screens first.</p>
          <button type="button" className="btn btn-primary" onClick={() => ref.current?.close()}>Back</button>
        </div>
      </dialog>
    </>
  );
}
