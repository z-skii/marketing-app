"use client";

import { useState } from "react";
import { Check, ArrowsOutSimple } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Viewer } from "../../../design-lab-v2/Viewer";
import { Money } from "../../../design-lab-v2/parts";
import { homeOpportunities, money, type Opportunity } from "../../../design-lab-v2/fixtures";
import { M } from "../media";
import { LabStrip } from "../motion";
import { Open } from "../Open";

/**
 * V3 User Home (docs/design-lab-v3/screens/x-user-home.md): WHAT CAN I
 * EARN FROM RIGHT NOW. Three physically different opportunities and one
 * Filter. Recreate is an open reference with an attached reading edge;
 * Story a freestanding tall creative beside an opposing rail; Car a full
 * bleed photographic field with a plain monthly band. Facts stay on
 * opaque surfaces; the phone navigation is the only lens. Opening
 * continues the same media into the real requirements and the financial
 * boundary; returning restores the exact place.
 */
type Order = "for-you" | "nearby" | "top-pay";
type KindFilter = "all" | Opportunity["kind"];
const KIND_LABEL: Record<Exclude<KindFilter, "all">, string> = { recreate: "Recreate a Reel", story: "Instagram Story ads", car: "Car advertising" };
const MEDIA: Record<string, { src: string; srcSet?: string; sizes?: string; w: number; h: number }> = {
  "lab-recreate-loopday-pour": { src: M.reference4x5(720), srcSet: `${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`, sizes: "(min-width: 1024px) 432px, 100vw", w: 720, h: 900 },
  "lab-story-loopday-24h": { src: M.story(480), srcSet: `${M.story(480)} 480w, ${M.story(720)} 720w`, sizes: "(min-width: 1024px) 248px, 238px", w: 480, h: 853 },
  "lab-car-spurroom-rear-doors": { src: M.vehicleEli(800), srcSet: `${M.vehicleEli(800)} 800w, ${M.vehicleEli(1200)} 1200w`, sizes: "(min-width: 1024px) 376px, 100vw", w: 800, h: 533 },
};
const shortDate = (s: string) => s.replace(/, 2026.*$/, "");

export function Feed() {
  const [order, setOrder] = useState<Order>("for-you");
  const [kind, setKind] = useState<KindFilter>("all");
  const [pending, setPending] = useState<{ order: Order; kind: KindFilter; city: string | null }>({ order: "for-you", kind: "all", city: null });
  const [city, setCity] = useState<string | null>(null);
  const list = arrange(homeOpportunities, order, kind, city);
  const applied = order !== "for-you" || kind !== "all";
  return (
    <div className="x-home">
      <LabStrip />
      <div className="x-home-util">
        <Sheet title="Filter" triggerClass="link link-plain t-action x-filter" trigger="Filter">
          <div role="radiogroup" aria-label="Order" style={{ marginTop: 8 }}>
            {(["for-you", "nearby", "top-pay"] as Order[]).map((k) => (
              <button key={k} type="button" role="radio" className="sheet-row" aria-checked={pending.order === k} onClick={() => setPending((p) => ({ ...p, order: k }))}>
                <span>{k === "for-you" ? "For you" : k === "nearby" ? "Nearby" : "Top pay"}</span>{pending.order === k && <Check size={20} aria-hidden />}
              </button>
            ))}
          </div>
          {pending.order === "nearby" && (
            <div className="x-filter-city">
              <label className="t-fact" htmlFor="filter-city">City</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input id="filter-city" className="join-input" placeholder="Austin" value={pending.city ?? ""} onChange={(e) => setPending((p) => ({ ...p, city: e.target.value }))} />
                <button type="button" className="btn btn-line" onClick={() => setPending((p) => ({ ...p, city: "Austin" }))}>Use city</button>
              </div>
            </div>
          )}
          <details className="disclosure" style={{ marginTop: 12 }}>
            <summary className="t-action">Opportunity type</summary>
            <div role="radiogroup" aria-label="Opportunity type">
              {(["all", "recreate", "story", "car"] as KindFilter[]).map((k) => (
                <button key={k} type="button" role="radio" className="sheet-row" aria-checked={pending.kind === k} onClick={() => setPending((p) => ({ ...p, kind: k }))}>
                  <span>{k === "all" ? "All types" : KIND_LABEL[k]}</span>{pending.kind === k && <Check size={20} aria-hidden />}
                </button>
              ))}
            </div>
          </details>
          <div style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "center" }}>
            <button type="button" className="btn btn-primary" onClick={(e) => { setOrder(pending.order); setKind(pending.kind); setCity(pending.order === "nearby" ? (pending.city?.trim() || null) : null); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Apply filters</button>
            {(applied || pending.order !== "for-you" || pending.kind !== "all") && <button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={(e) => { setPending({ order: "for-you", kind: "all", city: null }); setOrder("for-you"); setKind("all"); setCity(null); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Clear filters</button>}
          </div>
        </Sheet>
      </div>
      {order === "nearby" && !city ? (
        <div className="x-home-empty"><p className="t-object">Nearby needs a city.</p><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => { setCity("Austin"); setPending((p) => ({ ...p, city: "Austin" })); }}>Use city</button></div>
      ) : list.length === 0 ? (
        <div className="x-home-empty"><p className="t-object">No matching opportunities</p><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => { setOrder("for-you"); setKind("all"); setCity(null); setPending({ order: "for-you", kind: "all", city: null }); }}>Clear filters</button></div>
      ) : (
        <div className="x-feed" data-order={order}>
          {list.map((o) => <OpportunityObject key={o.id} o={o} />)}
        </div>
      )}
    </div>
  );
}

function arrange(all: Opportunity[], order: Order, kind: KindFilter, city: string | null): Opportunity[] {
  let list = kind === "all" ? all : all.filter((o) => o.kind === kind);
  if (order === "nearby") list = list.filter((o) => o.kind !== "car" || (city && o.facts.some((f) => f.toLowerCase() === city.toLowerCase())));
  if (order === "top-pay") { const oneOff = list.filter((o) => o.kind !== "car").sort((a, b) => b.netCents - a.netCents); list = [...oneOff, ...list.filter((o) => o.kind === "car")]; }
  return list;
}

function OpportunityObject({ o }: { o: Opportunity }) {
  const m = MEDIA[o.id];
  const label = `View ${o.title}, ${o.business}`;
  const facts = o.kind === "recreate" ? `${o.facts[0]} · ${o.facts[1]}` : o.kind === "story" ? o.facts[0] : `${o.facts[0]} · ${o.facts[1]}`;
  return (
    <Open id={o.id} title={o.title} kind={o.kind} media={o.media} mediaRatio={o.mediaRatio} mediaAlt={o.mediaAlt} mediaFit={o.kind === "story" ? "contain" : "cover"} mediaPosition={o.mediaPosition} content={<Detail o={o} />}>
      {(open) => (
        <article className={`x-obj x-op x-op-${o.kind}`} aria-labelledby={`${o.id}-t`}>
          <button type="button" className={`media x-op-media x-op-media-${o.kind}`} onClick={open} aria-label={label} style={{ aspectRatio: o.mediaRatio }}>
            <img src={m.src} srcSet={m.srcSet} sizes={m.sizes} alt="" width={m.w} height={m.h} decoding="async" loading={o.kind === "recreate" ? "eager" : "lazy"} fetchPriority={o.kind === "recreate" ? "high" : undefined} style={{ objectPosition: o.mediaPosition }} />
            {o.mediaCaption && <span className="t-note x-op-caption">{o.mediaCaption}</span>}
          </button>
          <div className="x-op-band paper">
            <div className="x-op-money"><Money cents={o.netCents} basis={o.kind === "car" ? "/month" : "On approval"} whole inline={o.kind === "car"} />{o.kind === "car" && <span className="t-fact-ink x-op-basis2">Monthly approval</span>}</div>
            <button type="button" className="btn btn-primary x-op-view" onClick={open} aria-label={label}>View</button>
            <h2 id={`${o.id}-t`} className="t-object x-op-title">{o.title}</h2>
            <p className="t-fact x-op-business">{o.business}</p>
            <p className="t-fact x-op-facts">{facts}</p>
          </div>
        </article>
      )}
    </Open>
  );
}

function Detail({ o }: { o: Opportunity }) {
  const [saved, setSaved] = useState(false);
  return (
    <div className="x-detail">
      <div className="x-detail-top">
        <div><Money cents={o.netCents} basis={o.kind === "car" ? "/month · Monthly approval" : "On approval"} whole inline={o.kind === "car"} /><p className="t-fact" style={{ marginTop: 4 }}>{o.business}</p></div>
        <div className="x-detail-top-actions">
          {o.media && <Viewer src={o.media} alt={o.mediaAlt} label="View image" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />View image</Viewer>}
          <button type="button" className="link t-action" aria-pressed={saved} style={{ minHeight: 44 }} onClick={() => setSaved((v) => !v)}>{saved ? "Saved" : "Save"}</button>
        </div>
      </div>
      <dl className="facts" style={{ marginTop: 24 }}>
        <div><dt>Apply by</dt><dd>{o.applyBy}</dd></div>
        {o.submitBy && <div><dt>Submit by</dt><dd>{o.submitBy}</dd></div>}
        {o.extra?.map((x) => <div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></div>)}
      </dl>
      {o.eligibility && (
        <ul className="reqs" style={{ marginTop: 24 }} aria-label="Eligibility">
          {o.eligibility.map((e) => <li key={e.label}><span className={`state ${e.state}`}>{e.label}</span>{e.note && <span className="t-fact">{e.note}</span>}</li>)}
        </ul>
      )}
      <h3 className="t-action" style={{ marginTop: 24 }}>Requirements</h3>
      <ol className="steps" style={{ marginTop: 8 }}>{o.requirements.map((r) => <li key={r}>{r}</li>)}</ol>
      {o.kind === "car" && (
        <div className="x-detail-plan paper">
          <span className="t-fact">Placement preview</span>
          <img src={M.plan} alt="Placement plan: the rear doors of a car" width={1200} height={800} className="x-plan-img" />
          <span className="t-fact-ink">Rear doors</span>
        </div>
      )}
      <h3 className="t-action" style={{ marginTop: 24 }}>Payment</h3>
      <dl className="facts" style={{ marginTop: 8 }}>
        <div><dt>Gross</dt><dd>{money(o.grossCents, { cents: true })}</dd></div>
        <div><dt>Fee</dt><dd>{money(o.feeCents, { cents: true })}</dd></div>
        <div><dt>You receive</dt><dd>{money(o.netCents, { cents: true })}{o.kind === "car" ? " per approved month" : " on approval"}</dd></div>
      </dl>
      {o.usage && <><h3 className="t-action" style={{ marginTop: 24 }}>Usage rights</h3><p className="t-body" style={{ marginTop: 8 }}>{o.usage}</p></>}
      {o.blockers?.map((b) => <p key={b} className="state bad" style={{ marginTop: 16, fontSize: 16, lineHeight: "24px" }}>{b}</p>)}
      <details className="disclosure" style={{ marginTop: 16 }}><summary className="t-action">Full terms</summary><p className="t-body" style={{ marginTop: 8 }}>Terms unavailable in this preview.</p></details>
      <p className="t-body" style={{ marginTop: 24 }}>Approval credits earnings. Payout is separate.</p>
      <div className="preview-actions">
        <button type="button" className="btn btn-primary" disabled aria-describedby={`${o.id}-note`} style={{ opacity: 0.5 }}>{o.kind === "story" ? "Post" : "Apply"}</button>
        <span id={`${o.id}-note`} className="t-fact">{o.kind === "story" ? "Posting is outside this preview." : "Applications are outside this preview."}</span>
      </div>
    </div>
  );
}

export { shortDate };
