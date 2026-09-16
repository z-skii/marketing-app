"use client";

import { useState } from "react";
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
                {k === "nearby" && <span className="t-fact">Austin</span>}
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
