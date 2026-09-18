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
import { Plan } from "../Plan";

/**
 * V3 User Home: WHAT CAN I EARN FROM RIGHT NOW, in the approved
 * recomposition language. Three physically different opportunities as
 * valuable planes on one dark stage, each with its terms attached as
 * opaque paper, and one Filter. Recreate is an open reference with an attached reading edge;
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
  "lab-recreate-loopday-pour": { src: M.reference4x5(720), srcSet: `${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`, sizes: "(min-width: 1024px) 360px, 358px", w: 720, h: 900 },
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
        <section className="xs-stage xs-home" data-order={order} aria-label="Opportunities">
          {list.map((o) => <OpportunityObject key={o.id} o={o} />)}
        </section>
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
  // The accessible name carries any visible caption inside the button, so the name matches what a person reads.
  const label = o.mediaCaption ? `${o.mediaCaption}. View ${o.title}, ${o.business}` : `View ${o.title}, ${o.business}`;
  const tag = o.kind === "recreate" ? "Recreate" : o.kind === "story" ? "Story" : o.mediaCaption ?? "Car";
  return (
    <Open id={o.id} title={o.title} kind={o.kind} media={o.media} mediaRatio={o.mediaRatio} mediaAlt={o.mediaAlt} mediaFit={o.kind === "car" ? "cover" : "contain"} mediaPosition={o.mediaPosition} content={<Detail o={o} />}>
      {(open) => (
        <article className={`xs-obj xs-op xs-op-${o.kind}`} aria-labelledby={`${o.id}-t`}>
          {/* the object: one photographic plane on the stage, the product identity tagged on it; the whole plane opens */}
          <button type="button" className="xs-plane" onClick={open} aria-label={label}>
            <img src={m.src} srcSet={m.srcSet} sizes={m.sizes} alt="" width={m.w} height={m.h} decoding="async" loading={o.kind === "recreate" ? "eager" : "lazy"} fetchPriority={o.kind === "recreate" ? "high" : undefined} style={{ objectPosition: o.mediaPosition }} />
            <span className="x-tag xs-tag">{tag}</span>
            {o.kind === "car" && <span className="x-tag xs-tag xs-tag-br">Rear doors</span>}
          </button>
          {/* the attached terms: money as the object's conclusion, on opaque paper in contact with the plane */}
          <div className="x-paper xs-sheet">
            <span className="t-fact">{o.business}</span>
            <span className="xs-money"><span className="x-money-hero">{money(o.netCents)}</span><span className="t-fact-ink">{o.kind === "car" ? "/month" : "On approval"}</span></span>
            {o.kind === "car" && <span className="t-fact-ink">Monthly approval</span>}
            <span className="xs-sheet-row"><h2 id={`${o.id}-t`} className="t-object">{o.title}</h2><button type="button" className="link t-action" onClick={open} aria-label={`View ${o.title}, ${o.business}`}>View</button></span>
          </div>
        </article>
      )}
    </Open>
  );
}

/** V3 eligibility truth: Maya's default state has no connected Instagram, so the Story shows the real boundary rather than a connected identity. */
type Eligibility = { label: string; state: "ok" | "bad" | "due"; note?: string }[];
const V3_ELIGIBILITY: Record<string, Eligibility> = {
  "lab-story-loopday-24h": [{ label: "Instagram not connected", state: "due", note: "Connect in Settings before posting." }, { label: "500+ followers required", state: "due", note: "Checked after connecting." }],
};

function Detail({ o }: { o: Opportunity }) {
  const [saved, setSaved] = useState(false);
  const eligibility: Eligibility | undefined = o.id in V3_ELIGIBILITY ? V3_ELIGIBILITY[o.id] : o.eligibility;
  return (
    <div className="x-detail">
      <div className="x-detail-top">
        <div><Money cents={o.netCents} basis={o.kind === "car" ? "/month · Monthly approval" : "On approval"} whole inline={o.kind === "car"} /><p className="t-fact" style={{ marginTop: 4 }}>{o.business}</p>{o.mediaCaption && <p className="t-fact" style={{ marginTop: 4 }}>{o.mediaCaption}: not your listed vehicle.</p>}</div>
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
      {eligibility && (
        <ul className="reqs" style={{ marginTop: 24 }} aria-label="Eligibility">
          {eligibility.map((e) => <li key={e.label}><span className={`state ${e.state}`}>{e.label}</span>{e.note && <span className="t-fact">{e.note}</span>}</li>)}
        </ul>
      )}
      <h3 className="t-action" style={{ marginTop: 24 }}>Requirements</h3>
      <ol className="steps" style={{ marginTop: 8 }}>{o.requirements.map((r) => <li key={r}>{r}</li>)}</ol>
      {o.kind === "car" && (
        <div className="x-detail-plan paper">
          <span className="t-fact">Placement preview</span>
          <span className="x-plan-img" role="img" aria-label="Placement plan: the rear doors of a car"><Plan selected /></span>
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
