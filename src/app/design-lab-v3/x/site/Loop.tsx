"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Img } from "../../../design-lab-v2/Img";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { AppleCard, GoogleCard, Logo, PlatformLabel, type CardData } from "../../wallet/Cards";
import { Marks, Descent } from "../../Progress";
import { liveProgram, type Member } from "../../fixtures";
import { M } from "../media";
import { useMotion } from "../motion";
import { SeqControls, Ordered, useSequence, type Frame } from "../Stage";
import { Chapter, Entry } from "./Shell";

/**
 * The source never leaves: the third wow moment and the closing chapter.
 * Jasmine's source marker sits outside every customer and Wallet object
 * while the Story becomes a trusted campaign link, a historical signup, a
 * distinct zero progress member card, dated returns, the labelled
 * September 17 example continuation and, finally, the business's
 * attribution descent under the unchanged source heading. An independent
 * replay: nothing here mutates the working Loyalty store.
 */
const FR: Frame[] = [
  { key: "story", label: "Story", dur: 1000 },
  { key: "signup", label: "Signup", dur: 1550 },
  { key: "card", label: "Member card", dur: 650 },
  { key: "sep8", label: "September 8", dur: 800 },
  { key: "sep10", label: "September 10", dur: 530 },
  { key: "sep13", label: "September 13", dur: 530 },
  { key: "sep16", label: "September 16", dur: 540 },
  { key: "sep17", label: "Reward", dur: 1700 },
  { key: "attribution", label: "Attribution", dur: 2000 },
];
const ACT = (f: number) => (f === 0 ? "Attention" : f <= 2 ? "Customer" : f <= 7 ? "Return customer" : "Attribution");
const DATES: Record<number, { iso: string; label: string; n: number }> = {
  3: { iso: "2026-09-08", label: "First visit", n: 1 }, 4: { iso: "2026-09-10", label: "Came back", n: 2 }, 5: { iso: "2026-09-13", label: "3 of 5", n: 3 }, 6: { iso: "2026-09-16", label: "4 of 5", n: 4 }, 7: { iso: "2026-09-17", label: "Example continuation", n: 5 },
};
const SARA: Member = { id: "replay", memberId: "LD-001", firstName: "Sara", contactKind: "phone", contactNorm: "+12025550142", contactMasked: "••42", code: "LMQ-7K2P-SARA", joinedAt: "2026-09-08T08:50:00-05:00", agreedAt: "2026-09-08T08:50:00-05:00", source: { type: "STORY", creatorId: "jasmine", campaign: "Morning loop", label: "Jasmine", sub: "Morning loop · Story campaign", linkCode: "link-jasmine-story", confidence: "link" }, progress: 0, ready: 0, redeemed: 0, lifetime: 0, visitDays: [], lastCountedAt: null, lastAttemptAt: null, wallet: "apple", walletAt: null };
const fmt = (iso: string) => new Date(`${iso}T12:00:00-05:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "America/Chicago" });

function card(visits: number, ready: boolean): CardData {
  return { design: liveProgram.card, program: liveProgram, firstName: "Sara", memberId: "LD-001", code: "LMQ-7K2P-SARA", qr: "tapmart-demo-member:loopday:q7n4k9r2m6t8", progress: ready ? 5 : visits, ready: ready ? 1 : 0, state: ready ? "ready" : "collecting", publicSubset: true };
}

export function Loop() {
  const { reduced } = useMotion();
  const seq = useSequence(FR);
  const [platform, setPlatform] = useState<"apple" | "google">("apple");
  const f = seq.frame;
  useEffect(() => { const el = document.getElementById("loyalty"); if (!el) return; const io = new IntersectionObserver((es) => { if (!es[0].isIntersecting) seq.stop(); }, { threshold: 0 }); io.observe(el); return () => io.disconnect(); }, [seq]);

  const Source = (
    <div className="x-lp-source">
      <span className="t-fact">Joined from</span>
      <Sheet title="Jasmine" variant="menu" triggerClass="link link-plain t-object x-lp-source-name" trigger="Jasmine">
        <p className="t-body" style={{ marginTop: 8 }}>Morning loop · Story campaign.</p>
        <p className="t-fact" style={{ marginTop: 8 }}>Jasmine is a fictional source identity with no portrait. This replay keeps its own state and cannot change the business preview&rsquo;s counts.</p>
      </Sheet>
      <span className="t-fact">Morning loop · Story campaign</span>
    </div>
  );
  const Story = (tapped: boolean) => (
    <div className="x-lp-story">
      <span className="media x-lp-creative"><img src={M.story(480)} srcSet={`${M.story(480)} 480w, ${M.story(720)} 720w`} sizes="(min-width: 1024px) 248px, 176px" alt="Loopday Story creative, fixture media" width={480} height={853} decoding="async" loading="lazy" /></span>
      <span className="x-lp-link paper"><span className="t-fact">Story</span><span className={`t-action x-lp-join${tapped ? " is-tapped" : ""}`}>Join Loopday</span><span className="t-fact">Trusted campaign link</span></span>
    </div>
  );
  const Signup = (
    <div className="x-lp-signup paper x-open">
      <span className="t-fact">Signup replay<span aria-hidden> · </span>{fmt("2026-09-08")}</span>
      <span className="x-lp-brand"><span className="loy-brand-mark" style={{ width: 28, height: 28, color: "var(--v3-ink)" }}><Logo design={liveProgram.card} size={20} /></span><span className="t-object">Loopday Coffee</span></span>
      <span className="t-title">Free coffee</span>
      <span className="t-fact-ink">5 visits</span>
      <span className="seq-field"><span className="t-fact">First name</span><span className="t-body">Sara</span></span>
      <span className="seq-field"><span className="t-fact">Contact</span><span className="t-body">••42</span></span>
      <span className="t-fact">Agreed to the demo program terms and privacy notice.</span>
      <span className="btn btn-primary seq-btn" aria-hidden>Create my card</span>
    </div>
  );
  const Pass = (visits: number, ready: boolean, iso: string | null, label: string | null, arrive: boolean) => {
    const c = card(visits, ready);
    return (
      <div className={`x-lp-pass${arrive ? " x-arrive" : ""}`}>
        {iso && <span className="x-lp-date t-fact-ink"><time dateTime={iso}>{fmt(iso)}</time>{label && <span aria-hidden> · </span>}{label}</span>}
        <div className="wc-wrap">
          <PlatformLabel platform={platform} />
          {platform === "apple" ? <AppleCard d={c} width={375} className="wc-fit" /> : <GoogleCard d={c} width={375} className="wc-fit" />}
          <PlatformLabel platform={platform} above={false} />
        </div>
        {ready && <span className="x-lp-ready t-object x-reveal">Reward ready</span>}
      </div>
    );
  };
  const Attribution = (
    <div className="x-lp-attr x-settle">
      <Descent joined={4} returned={3} redeemed={1} max={4} size="l" />
      <span className="t-fact">Recorded aggregates<span aria-hidden> · </span>Unique members</span>
      <span className="x-lp-attr-actions"><Link href="/design-lab-v3/business/loyalty" className="btn btn-primary">Open loyalty preview</Link><Entry label="Get started" className="link t-action" business /></span>
    </div>
  );
  const WalletOptions = (
    <Sheet title="Wallet options" variant="menu" triggerClass="link link-plain t-action x-lp-wallet" trigger="Wallet options">
      <div className="tabs" role="tablist" aria-label="Platform" style={{ marginTop: 8 }}>
        <button type="button" role="tab" aria-selected={platform === "apple"} onClick={() => setPlatform("apple")}>Apple Wallet concept</button>
        <button type="button" role="tab" aria-selected={platform === "google"} onClick={() => setPlatform("google")}>Google Wallet concept</button>
      </div>
      <p className="t-fact" style={{ marginTop: 12 }}>No pass is issued. The source stays outside the pass.</p>
    </Sheet>
  );
  const render = (i: number) => {
    if (i === 0) return Story(false);
    if (i === 1) return Signup;
    if (i === 2) return Pass(0, false, "2026-09-08", "Joined", true);
    if (i >= 3 && i <= 6) { const d = DATES[i]; return Pass(d.n, false, d.iso, d.label, false); }
    if (i === 7) return Pass(5, true, "2026-09-17", "Example continuation", false);
    return Attribution;
  };
  const shared = <div className="x-lp-head"><span className="x-lp-act t-verb">{ACT(f)}</span>{Source}<span className="t-note x-lp-sim">Design Lab · Simulated sequence</span></div>;
  if (reduced) {
    return (
      <Chapter id="loyalty" verb="Loyalty">
        <div className="x-lp x-lp-reduced">
          <div className="x-lp-head">{Source}<span className="t-note x-lp-sim">Design Lab · Simulated sequence</span></div>
          <Ordered id="loyalty" frames={FR} render={(i) => <><span className="t-fact-ink">{ACT(i)}</span>{render(i)}</>} />
          <div className="x-controls">{WalletOptions}<Link href="/design-lab-v3/business/loyalty" className="link t-action">Open loyalty preview</Link></div>
        </div>
      </Chapter>
    );
  }
  return (
    <Chapter id="loyalty" verb="Loyalty">
      <div className="x-lp" data-frame={f} data-act={ACT(f)}>
        {shared}
        <div className="x-lp-object" aria-live="polite">{f === 0 && seq.playing ? Story(true) : render(f)}</div>
        <SeqControls seq={seq} frames={FR} playLabel="Play sequence">{WalletOptions}{f < 8 && <Link href="/design-lab-v3/business/loyalty" className="link t-action x-open-preview">Open loyalty preview</Link>}</SeqControls>
      </div>
    </Chapter>
  );
}

export { Img, Marks, SARA };
