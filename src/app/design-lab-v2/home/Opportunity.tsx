"use client";

import { ArrowsOutSimple } from "@phosphor-icons/react";
import { Preview } from "../Preview";
import { Viewer } from "../Viewer";
import { Edge, Money } from "../parts";
import { money, type Opportunity } from "../fixtures";

/**
 * One opportunity in the Open Cut composition. Three silhouettes, one
 * earning edge: Recreate is a wide 4:5 reference, Story an intact 9:16
 * creative beside a narrow information rail (phone) or above its band
 * (desktop), Car a grounded 3:2 photograph under a small Vehicle example
 * caption. Media and the one View action open the same read-only preview.
 */
export function OpportunityObject({ o }: { o: Opportunity }) {
  const viewLabel = `View ${o.title}, ${o.business}`;
  return (
    <Preview id={o.id} title={o.title} media={o.media} mediaRatio={o.mediaRatio} mediaAlt={o.media ? o.mediaAlt : fallbackLabel(o)} mediaPosition={o.mediaPosition} content={<Detail o={o} />} actions={<Actions o={o} />}>
      {(open) => (
        <article className={`obj op op-${o.kind}`} aria-labelledby={`${o.id}-title`}>
          <button type="button" className="media-btn" onClick={open} aria-label={viewLabel}>
            {o.mediaCaption && <span className="t-note op-caption">{o.mediaCaption}</span>}
            <span className="media op-media" style={{ aspectRatio: o.mediaRatio }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {o.media ? <img src={o.media} alt="" style={{ objectFit: o.mediaFit ?? "cover", objectPosition: o.mediaPosition }} /> : <span className="media-fallback" style={{ position: "absolute", inset: 0 }}>{fallbackLabel(o)}</span>}
            </span>
          </button>
          <Edge />
          <div className="op-band">
            <div className="op-money"><Money cents={o.netCents} basis={o.basis} whole /></div>
            <button type="button" className="btn btn-primary op-view" onClick={open} aria-label={viewLabel}>View</button>
          </div>
          <h2 id={`${o.id}-title`} className="t-object op-title">{o.title}</h2>
          <p className="t-fact op-business">{o.business}</p>
          <p className="t-fact op-facts">{o.facts.map((f, i) => <span key={f}>{i > 0 && <span aria-hidden> · </span>}{f}</span>)}</p>
        </article>
      )}
    </Preview>
  );
}

function fallbackLabel(o: Opportunity): string {
  return o.kind === "recreate" ? "Reference unavailable" : o.kind === "story" ? "Creative unavailable" : "Photo unavailable";
}

function Detail({ o }: { o: Opportunity }) {
  return (
    <div className="op-detail">
      <div className="op-band" style={{ marginTop: 16 }}>
        <div><Money cents={o.netCents} basis={o.basis} whole /></div>
        {o.media && <Viewer src={o.media} alt={o.mediaAlt} label="Expand media" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Expand media</Viewer>}
      </div>
      <h2 className="t-object" style={{ marginTop: 12 }}>{o.title}</h2>
      <p className="t-fact" style={{ marginTop: 4 }}>{o.business}{o.kind === "recreate" && <span> · Reference still</span>}</p>
      <dl className="facts" style={{ marginTop: 24 }}>
        <div><dt>Apply by</dt><dd>{o.applyBy}</dd></div>
        {o.submitBy && <div><dt>Submit by</dt><dd>{o.submitBy}</dd></div>}
        {o.extra?.map((x) => <div key={x.label}><dt>{x.label}</dt><dd>{x.value}</dd></div>)}
      </dl>
      {o.eligibility && (
        <ul className="reqs" style={{ marginTop: 24 }} aria-label="Eligibility">
          {o.eligibility.map((e) => <li key={e.label}><span className={`state ${e.state}`} style={{ minWidth: 0 }}>{e.label}</span>{e.note && <span className="t-fact">{e.note}</span>}</li>)}
        </ul>
      )}
      <h3 className="t-action" style={{ marginTop: 24 }}>Requirements</h3>
      <ul className="reqs" style={{ marginTop: 8 }}>
        {o.requirements.map((r) => <li key={r}>{r}</li>)}
      </ul>
      {o.kind === "car" && (
        <div style={{ marginTop: 16, maxWidth: 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/design-lab/placement-rear-doors.svg" alt="Placement diagram: the rear doors of a car" style={{ width: "100%", height: "auto" }} />
        </div>
      )}
      {o.usage && <p className="t-body" style={{ marginTop: 16 }}>{o.usage}</p>}
      {o.blockers?.map((b) => <p key={b} className="state bad" style={{ marginTop: 16, fontSize: 16, lineHeight: "24px" }}>{b}</p>)}
      <details className="disclosure" style={{ marginTop: 24 }}>
        <summary className="t-action">Money details</summary>
        <dl className="facts" style={{ marginTop: 12 }}>
          <div><dt>Gross</dt><dd>{money(o.grossCents, { cents: true })}</dd></div>
          <div><dt>Fee</dt><dd>{money(o.feeCents, { cents: true })}</dd></div>
          <div><dt>You receive</dt><dd>{money(o.netCents, { cents: true })}{o.kind === "car" ? " per approved month" : ""}</dd></div>
        </dl>
      </details>
      <details className="disclosure" style={{ marginTop: 8 }}>
        <summary className="t-action">Terms</summary>
        <p className="t-body" style={{ marginTop: 8 }}>Terms unavailable.</p>
      </details>
      <p className="t-body" style={{ marginTop: 24 }}>Approval credits earnings; payout is separate.</p>
    </div>
  );
}

function Actions({ o }: { o: Opportunity }) {
  const id = `${o.id}-apply-note`;
  return (
    <>
      <button type="button" className="btn btn-primary" disabled aria-describedby={id} style={{ opacity: 0.5 }}>Apply</button>
      <span id={id} className="t-fact">Applications are outside this preview.</span>
    </>
  );
}
