"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Copy, DownloadSimple, Printer } from "@phosphor-icons/react";
import { QR } from "../../../qr";
import { Logo } from "../../../wallet/Cards";
import { useLoyalty } from "../../../store";
import { useOrigin } from "../../../useOrigin";
import { LoyaltyCrumb } from "../LoyaltyCrumb";

function svgDownload(url: string, name: string) {
  const el = document.querySelector<SVGSVGElement>(".qr-download svg");
  if (!el) return;
  const blob = new Blob([`<?xml version="1.0"?>${el.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')}`], { type: "image/svg+xml" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
  void url;
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
  return (
    <div className="loy qr">
      <LoyaltyCrumb here="Counter QR" />
      <p className="t-fact-ink" style={{ marginTop: 4 }}>Scan to join {p.card.businessName}</p>
      <div className="qr-body">
        <div className="create-launch-qr obj qr-download">
          <QR value={url} size={220} label="Counter QR" ink="#18231D" paper="#FFFEF9" quiet={4} />
          <span className="t-note">Demo QR · Design Lab only</span>
          <span className="create-launch-link t-fact-ink">{url.replace(/^https?:\/\//, "")}</span>
        </div>
        <div className="qr-facts">
          <p className="t-body">{rule}</p>
          <p className="t-fact" style={{ marginTop: 4 }}>The counter QR is the code people scan to join. Member QRs on their cards are different codes.</p>
          <div className="create-launch-actions" style={{ marginTop: 16 }}>
            <button type="button" className="link t-action" onClick={() => { void navigator.clipboard?.writeText(url).catch(() => {}); setCopied(true); }}><Copy size={16} aria-hidden />{copied ? "Demo link copied." : "Copy demo link"}</button>
            <Link href="/design-lab-v3/business/loyalty/qr?view=print" className="link t-action"><Printer size={16} aria-hidden />Preview printout</Link>
            <button type="button" className="link t-action" onClick={() => svgDownload(url, "loopday-demo-qr.svg")}><DownloadSimple size={16} aria-hidden />Download demo QR</button>
            <Link href="/design-lab-v3/join/loopday-counter" className="link t-action">Open signup</Link>
          </div>
        </div>
      </div>
      <Link href="/design-lab-v3/business/loyalty" className="link t-action loy-back"><ArrowLeft size={16} aria-hidden />Back</Link>
    </div>
  );
}
