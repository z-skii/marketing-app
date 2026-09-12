import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { Money } from "./parts";
import { maya, opportunities } from "./mock";

/**
 * Shared work excerpts: the real commitment HTML the app shows for each
 * earning kind, reused at phone width in User Home and at 448px in the
 * public chapters. Same formatters, same state labels, same permitted
 * actions; never redrawn marketing UI. In detail mode the decision sits
 * inside the payment ledge, after the amount and its condition, so the
 * action is read with its conditional pay. Every amount is a fixture.
 */

/** Recreate: graphite task block stepping down into the cobalt conditional-pay ledge. */
export function RecreateCommitment({ width = 198, height = 284, ledge = 112, ledgeInset = 0, detail = false, href = "/design-lab/user-home#recreate" }: { width?: number; height?: number; ledge?: number; ledgeInset?: number; detail?: boolean; href?: string }) {
  const r = opportunities.recreate;
  return (
    <div className="on-dark" style={{ width, minHeight: height, display: "flex", flexDirection: "column", color: "var(--tm-on-dark)" }}>
      <div style={{ padding: detail ? "16px 20px 24px" : 12, flex: 1, background: "var(--tm-graphite)", display: "flex", flexDirection: "column" }}>
        {detail && <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: "0 0 8px" }}>Demo opportunity · <span className="status" style={{ color: "var(--tm-on-dark)" }}>Open</span></p>}
        <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: 0 }}>Recreate Reel</p>
        <p className="t-task" style={{ color: "var(--tm-on-dark)", margin: "4px 0 0" }}>{r.title}</p>
        <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: "4px 0 0" }}>{r.business}</p>
        <p className="t-meta" style={{ color: "var(--tm-on-dark)", margin: "8px 0 0" }}>{r.instruction}</p>
        {detail && <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: "auto 0 0", paddingTop: 12 }}>{r.spots} spots · Apply by {r.deadline}</p>}
      </div>
      <div style={{ background: "var(--tm-accent)", padding: detail ? "16px 20px" : 12, minHeight: ledge, marginLeft: ledgeInset, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16 }}>
        <Money cents={r.payCents} per={r.basis} dark />
        {detail && <Link href={href} className="btn btn-secondary ledge-action">View work <ArrowRight size={18} aria-hidden /></Link>}
      </div>
    </div>
  );
}

/** Story: the commitment beside the intact supplied creative. In the feed a 3x64 cobalt edge sits beside the amount only; in detail it is a square white commitment region. */
export function StoryCommitment({ width = 198, detail = false, href = "/design-lab/user-home#story" }: { width?: number; detail?: boolean; href?: string }) {
  const s = opportunities.story;
  return (
    <div style={{ width, display: "flex", flexDirection: "column", ...(detail ? { background: "var(--tm-surface)", padding: 20 } : {}) }}>
      {detail && <p className="t-meta" style={{ margin: "0 0 8px" }}>Demo opportunity · <span className="status" style={{ color: "var(--tm-ink)" }}>Open</span></p>}
      <p className="t-meta" style={{ margin: 0 }}>Instagram Story ad</p>
      <div style={{ marginTop: 8, ...(detail ? {} : { borderLeft: "3px solid var(--tm-accent)", paddingLeft: 12, minHeight: 64, display: "flex", alignItems: "center" }) }}><Money cents={s.payCents} per={s.basis} /></div>
      <p className="t-task" style={{ margin: "12px 0 0" }}>{s.title}</p>
      <p className="t-meta" style={{ margin: "4px 0 0" }}>{s.business}</p>
      <p className="t-meta" style={{ margin: "4px 0 0" }}>{s.minFollowers.toLocaleString()}+ followers · {s.liveHours}h live</p>
      {detail && (
        <>
          <p className="t-meta" style={{ margin: "12px 0 0" }}>{s.spots} spots · Apply by {s.deadline}</p>
          <Link href={href} className="btn btn-secondary" style={{ marginTop: 16, alignSelf: "flex-start" }}>View work <ArrowRight size={18} aria-hidden /></Link>
        </>
      )}
    </div>
  );
}

/** The eligibility excerpt for the Story: literal Instagram provenance and the returned demo result. Ordinary HTML, no Instagram imitation. */
export function StoryEligibility({ width = 288 }: { width?: number }) {
  const ig = maya.instagram; const s = opportunities.story;
  const eligible = ig.followers >= s.minFollowers;
  return (
    <dl style={{ width, margin: 0, display: "grid", gap: 8 }}>
      <div><dt className="t-meta" style={{ margin: 0 }}>Instagram</dt><dd className="t-body" style={{ margin: 0 }}>@{ig.handle} · Manual</dd></div>
      <div><dt className="t-meta" style={{ margin: 0 }}>Followers</dt><dd className="t-body" style={{ margin: 0 }}>{ig.followers.toLocaleString()} · {s.minFollowers.toLocaleString()} required</dd></div>
      <div><dt className="t-meta" style={{ margin: 0 }}>Eligibility · Demo result</dt><dd className="t-body" style={{ margin: 0 }}><span className={`status ${eligible ? "confirmed" : "problem"}`} style={{ fontSize: 16 }}>{eligible ? "Eligible" : "Not eligible"}</span> · {s.liveHours}h live required</dd></div>
    </dl>
  );
}

/** Car: the monthly campaign commitment in ink, attached below the physical scene. Stacked on narrow widths. */
export function CarCommitment({ width = 358, inset = 12, detail = false, stacked = false, href = "/design-lab/user-home#car" }: { width?: number; inset?: number; detail?: boolean; stacked?: boolean; href?: string }) {
  const c = opportunities.car;
  return (
    <div style={{ width: width - inset, marginLeft: inset, background: "var(--tm-surface)", minHeight: 96, padding: detail ? 20 : 12, display: "grid", gridTemplateColumns: stacked ? "1fr" : "128px minmax(0, 1fr)", gap: 12, alignItems: "start" }}>
      {detail && <p className="t-meta" style={{ margin: 0, gridColumn: "1 / -1" }}>Demo opportunity · <span className="status" style={{ color: "var(--tm-ink)" }}>Open</span></p>}
      <Money cents={c.payCents} per={c.basis} />
      <div>
        <p className="t-task" style={{ margin: 0 }}>{c.title}</p>
        <p className="t-meta" style={{ margin: "4px 0 0" }}>{c.business}</p>
        {detail && (
          <>
            <p className="t-meta" style={{ margin: "8px 0 0" }}>{c.zones} · {c.durationDays} days · Vehicle required</p>
            <p className="t-meta" style={{ margin: 0 }}>{c.spots} spots · Apply by {c.deadline}</p>
            <Link href={href} className="btn btn-secondary" style={{ marginTop: 16 }}>View work <ArrowRight size={18} aria-hidden /></Link>
          </>
        )}
      </div>
    </div>
  );
}
