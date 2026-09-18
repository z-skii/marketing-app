"use client";

import { useState } from "react";
import { Check, MagnifyingGlass } from "@phosphor-icons/react";
import { Sheet } from "../Sheet";
import { OpportunityObject } from "./Opportunity";
import { homeOpportunities, type Opportunity } from "../fixtures";

/**
 * User Home discovery: one Filter action instead of permanent tabs. For
 * you keeps the composed order; Nearby keeps records in the chosen city;
 * Top pay orders one-off rewards and keeps monthly rates separate.
 * Exactly three fixture records, no next cursor, so no More control.
 */
type Order = "for-you" | "nearby" | "top-pay";

export function Feed() {
  const [order, setOrder] = useState<Order>("for-you");
  const [pending, setPending] = useState<Order>("for-you");
  const list = arrange(homeOpportunities, order);
  return (
    <>
      <div className="home-utility">
        <span className="t-note">Fictional preview</span>
        <Sheet title="Filter" triggerClass="link t-action" triggerStyle={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} trigger="Filter">
          <div role="group" aria-label="Order">
            {(["for-you", "nearby", "top-pay"] as Order[]).map((k) => (
              <button key={k} type="button" className="sheet-row" aria-pressed={pending === k} onClick={() => setPending(k)}>
                <span>{k === "for-you" ? "For you" : k === "nearby" ? "Nearby" : "Top pay"}</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>{k === "nearby" && <span className="t-fact">Austin</span>}<Check size={20} aria-hidden className="pick" /></span>
              </button>
            ))}
          </div>
          {pending === "top-pay" && <p className="t-fact" style={{ marginTop: 12 }}>Top pay keeps monthly rates separate.</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button type="button" className="btn btn-primary" onClick={(e) => { setOrder(pending); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Show opportunities</button>
            {order !== "for-you" && <button type="button" className="link t-action" onClick={(e) => { setPending("for-you"); setOrder("for-you"); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>Clear filters</button>}
          </div>
        </Sheet>
      </div>
      {list.length === 0 ? (
        <div style={{ padding: "48px 0" }}><p className="t-object">No opportunities match.</p><button type="button" className="link t-action" style={{ marginTop: 8, minHeight: 44 }} onClick={() => { setOrder("for-you"); setPending("for-you"); }}>Clear filters</button></div>
      ) : (
        <div className={`home-spread order-${order}`}>
          {list.map((o) => <OpportunityObject key={o.id} o={o} />)}
        </div>
      )}
    </>
  );
}

function arrange(all: Opportunity[], order: Order): Opportunity[] {
  if (order === "nearby") return all.filter((o) => o.kind !== "car" || o.facts.includes("Austin"));
  if (order === "top-pay") {
    const oneOff = all.filter((o) => o.kind !== "car").sort((a, b) => b.netCents - a.netCents);
    return [...oneOff, ...all.filter((o) => o.kind === "car")];
  }
  return all;
}

/** Local search over the three fixture opportunities: titles and business names. Results scroll to the object and focus its View action. */
export function SearchSheet({ labelled = false }: { labelled?: boolean }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const hits = query ? homeOpportunities.filter((o) => `${o.title} ${o.business}`.toLowerCase().includes(query)) : [];
  return (
    <Sheet title="Search" triggerClass={labelled ? undefined : "icon-btn"} triggerLabel={labelled ? undefined : "Search"} trigger={labelled ? <><span aria-hidden><MagnifyingGlass size={20} /></span><span>Search</span></> : <MagnifyingGlass size={20} aria-hidden />}>
      <label className="t-action" htmlFor="v2-search" style={{ display: "block" }}>Search opportunities</label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input id="v2-search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" style={{ flex: 1, minHeight: 44, padding: "0 12px", border: "1px solid var(--v2-line)", borderRadius: 4, background: "var(--v2-surface)", font: "inherit", color: "inherit" }} />
        {q && <button type="button" className="link t-action" onClick={() => setQ("")}>Clear search</button>}
      </div>
      {query && hits.length === 0 && <div style={{ marginTop: 24 }}><p className="t-object">No matches</p><p className="t-fact" style={{ marginTop: 4 }}>Try a different search.</p></div>}
      {hits.length > 0 && (
        <ul style={{ marginTop: 16 }}>
          {hits.map((o) => (
            <li key={o.id}>
              <button type="button" className="sheet-row" onClick={(e) => {
                (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close();
                const view = document.querySelector<HTMLButtonElement>(`.op-${o.kind} .op-view`);
                view?.scrollIntoView({ block: "center" }); view?.focus();
              }}>
                <span>{o.title}<span className="t-fact" style={{ display: "block" }}>{o.business}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}
