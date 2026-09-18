"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Copy, DownloadSimple, Printer } from "@phosphor-icons/react";
import { QR } from "../../../qr";
import { Logo } from "../../../wallet/Cards";
import { useLoyalty } from "../../../store";
import { useOrigin } from "../../../useOrigin";
import { LoyaltyCrumb } from "../LoyaltyCrumb";
import { TaskHead } from "../TaskHead";

/** Local export of the acquisition code with its quiet zone: the rendered SVG, nothing fetched, nothing issued. */
function svgDownload(name: string) {
  const el = document.querySelector<SVGSVGElement>(".qr-download svg");
  if (!el) return;
  const blob = new Blob([`<?xml version="1.0"?>${el.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')}`], { type: "image/svg+xml" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

export function QRView({ print = false }: { print?: boolean }) {
  const { state } = useLoyalty();
  const p = state.program;
  const [copied, setCopied] = useState(false);
  const origin = useOrigin();
  const url = `${origin}/design-lab-v3/join/loopday-counter`;
  const points = p.kind === "points";
  const rule = `Collect ${p.requirement} ${points ? "points" : "visits"}. Your next coffee is free.`;
  if (print) {
    return (
      <div className="qr-print">
        <span className="qr-print-brand"><span className="loy-brand-mark" style={{ background: p.card.bg, color: p.card.fg }}><Logo design={p.card} size={28} /></span><span className="t-title">{p.card.businessName}</span></span>
        <span className="t-verb">{p.reward.name}</span>
        <span className="t-body">{rule}</span>
        <span className="qr-print-code qr-download"><QR value={url} size={260} label="Counter QR" ink="#18231D" paper="#FFFFFF" quiet={4} /></span>
        <span className="t-object">Scan to join</span>
        <span className="t-note">Demo QR · Design Lab only</span>
        <div className="qr-print-actions"><button type="button" className="btn btn-primary" onClick={() => window.print()}><Printer size={16} aria-hidden />Print demo</button><Link href="/design-lab-v3/business/loyalty/qr" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Back</Link></div>
      </div>
    );
  }
  if (p.status !== "live") return <div className="loy"><LoyaltyCrumb here="Counter QR" /><p className="t-fact-ink" style={{ marginTop: 24 }}>Demo QR · activates after launch.</p><Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link></div>;
  // A usable customer entry object: the reward rule, then a centered black on white code with its quiet zone; no raw address, no card, no second navigation.
  return (
    <div className="qr-task">
      <TaskHead title="Counter QR" />
      <div className="qr-body">
        <p className="t-object qr-rule">{rule}</p>
        <p className="t-fact">Scan to join {p.card.businessName}.</p>
        <div className="qr-code qr-download"><QR value={url} size={224} label="Counter QR" ink="#000000" paper="#FFFFFF" quiet={4} /></div>
        <span className="t-note">Demo QR · Design Lab only</span>
        <p className="t-fact">The counter QR is the code people scan to join. Member QRs on their cards are different codes.</p>
        <div className="qr-actions">
          <button type="button" className="link t-action" onClick={() => { void navigator.clipboard?.writeText(url).catch(() => {}); setCopied(true); }}><Copy size={16} aria-hidden />{copied ? "Demo link copied." : "Copy demo link"}</button>
          <Link href="/design-lab-v3/join/loopday-counter" className="link t-action">Open signup</Link>
          <button type="button" className="link t-action" onClick={() => svgDownload("loopday-demo-qr.svg")}><DownloadSimple size={16} aria-hidden />Download demo QR</button>
          <Link href="/design-lab-v3/business/loyalty/qr?view=print" className="link t-action"><Printer size={16} aria-hidden />Preview printout</Link>
        </div>
      </div>
    </div>
  );
}
