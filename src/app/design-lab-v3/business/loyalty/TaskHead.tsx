"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, X } from "@phosphor-icons/react";
import { LabStrip } from "../../x/motion";

/**
 * The one head for every focused Loyalty task (the counter, program
 * creation, the counter QR): Back to the parent, the task title with an
 * optional step fact, Close, and the compact lab and motion strip beneath
 * so Pause motion stays reachable inside the task.
 */
export function TaskHead({ title, fact, backHref = "/design-lab-v3/business/loyalty", onBack, close, right }: { title: string; fact?: string; backHref?: string; onBack?: () => void; close?: ReactNode; right?: ReactNode }) {
  return (
    <header className="loy-taskhead">
      {onBack ? <button type="button" className="icon-btn loy-taskhead-back" aria-label="Back" onClick={onBack}><ArrowLeft size={20} aria-hidden /></button> : <Link href={backHref} className="icon-btn loy-taskhead-back" aria-label="Back to Loyalty"><ArrowLeft size={20} aria-hidden /></Link>}
      <span className="loy-taskhead-title"><span className="t-object">{title}</span>{fact && <span className="t-fact">{fact}</span>}</span>
      <span className="loy-taskhead-right">{right}{close ?? <Link href={backHref} className="link link-plain t-action preview-close" aria-label="Close"><X size={18} aria-hidden />Close</Link>}</span>
      <div className="loy-taskhead-strip"><LabStrip /></div>
    </header>
  );
}
