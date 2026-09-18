"use client";

import { ArrowsOutSimple, Gear, ShareNetwork, X } from "@phosphor-icons/react";
import { useState } from "react";
import { Preview } from "../Preview";
import { Viewer } from "../Viewer";
import { Sheet } from "../Sheet";
import { Outside } from "../Outside";
import { Edge, Money } from "../parts";
import { Img } from "../Img";
import { money, profile, USER_SETTINGS } from "../fixtures";

/**
 * V2 User Profile: identity, not settings. The person, what she has earned
 * here, her completed work on one finished-work cut, and her listed car.
 * One Settings entrance behind the gear. `publicView` renders the public
 * safe projection used by Share: identity, work and the vehicle only.
 */
export function ProfileBody({ publicView = false }: { publicView?: boolean }) {
  const p = profile;
  return (
    <div className={`profile${publicView ? " profile-public" : ""}`}>
      <section className="profile-identity" aria-label="Identity">
        <div className="profile-portrait media" style={{ aspectRatio: "4 / 5" }}><Img src={p.portrait} alt={p.portraitAlt} /></div>
        <div className="profile-who">
          <h1 className="t-name">{p.name}</h1>
          <p className="t-fact profile-handle">{p.username}<span aria-hidden> · </span>{p.city}</p>
          {publicView && <p className="t-fact profile-public-count">{p.completed} completed</p>}
          {!publicView && (
            <p className="t-fact profile-signals">
              <span>{p.instagram ? "Instagram connected" : "Instagram not connected"}</span>
              <span>{p.payoutReady ? "Payout ready" : "Payout setup needed"}</span>
            </p>
          )}
        </div>
        {!publicView && (
          <div className="profile-metrics">
            <div><Money cents={p.earnedCents} size="money-metric" /><span className="t-fact">Earned</span></div>
            <div><span className="money-metric" style={{ display: "block" }}>{p.completed}</span><span className="t-fact">Completed</span></div>
            {p.reviews === 0 ? <p className="t-fact profile-reviews">No reviews yet</p> : null}
          </div>
        )}
      </section>

      <section className="profile-work" aria-labelledby="work-h">
        <h2 id="work-h" className="t-object">Work</h2>
        {p.work.length === 0 ? (
          <div style={{ padding: "24px 0" }}><p className="t-object">No work yet</p><p className="t-fact">Completed work appears here.</p></div>
        ) : (
          <div className="work-deck">
            {p.work.map((w) => (
              <Preview key={w.id} id={w.id} title={w.title} eyebrow="Fictional profile" media={w.media} mediaRatio={w.ratio} mediaAlt={w.alt} content={<WorkDetail w={w} publicView={publicView} />}>
                {(open) => (
                  <button type="button" className={`obj work work-${w.kind}`} onClick={open} aria-label={`Open ${w.title}`}>
                    <span className="media" style={{ aspectRatio: w.ratio }}><Img src={w.media} alt="" /></span>
                  </button>
                )}
              </Preview>
            ))}
            <Edge style={{ gridArea: "edge" }} />
            <span className="edge edge-2" aria-hidden style={{ gridArea: "edge2", display: "block" }} />
          </div>
        )}
      </section>

      <section className="profile-vehicle obj" aria-labelledby="vehicle-h">
        <Preview id="vehicle" title={p.vehicle.title} eyebrow="Fictional profile" media={p.vehicle.photo} mediaRatio="3 / 2" mediaAlt={p.vehicle.alt} mediaFit="contain" content={<VehicleDetail />}>
          {(open) => (
            <>
              <button type="button" className="vehicle-photo media" style={{ aspectRatio: "3 / 2" }} onClick={open} aria-label={`View ${p.vehicle.title}`}><Img src={p.vehicle.photo} alt="" /></button>
              <div className="vehicle-facts">
                <h3 id="vehicle-h" className="t-object">{p.vehicle.title}</h3>
                <p className="t-fact" style={{ marginTop: 4 }}>{p.vehicle.listed ? "Listed for ads" : "Vehicle not ready"}</p>
                <button type="button" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", marginTop: 8 }} onClick={open} aria-label={`View ${p.vehicle.title}`}>View</button>
              </div>
              <Edge style={{ gridArea: "edge" }} />
            </>
          )}
        </Preview>
      </section>
    </div>
  );
}

type Work = (typeof profile.work)[number];

const plain = (cents: number) => (cents / 100).toFixed(2);

function WorkDetail({ w, publicView = false }: { w: Work; publicView?: boolean }) {
  const kind = w.kind === "recreate" ? "Recreate" : w.kind === "story" ? "Story" : "Car";
  return (
    <div>
      <div className="op-band" style={{ marginTop: 16 }}>
        <div>{publicView ? <h2 className="t-object">{w.title}</h2> : <Money cents={w.netCents} basis="Credited" />}</div>
        {w.media && <Viewer src={w.media} alt={w.alt} label="Expand media" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Expand media</Viewer>}
      </div>
      {!publicView && <h2 className="t-object" style={{ marginTop: 12 }}>{w.title}</h2>}
      <p className="t-fact" style={{ marginTop: 4 }}>{kind}<span aria-hidden> · </span>{w.business}<span aria-hidden> · </span>{w.mediaNote}</p>
      <p className="state ok" style={{ marginTop: 12, fontSize: 16, lineHeight: "24px" }}>{w.state}</p>
      <dl className="facts" style={{ marginTop: 16 }}>
        {w.facts.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
      </dl>
      {!publicView && (
        <details className="disclosure" style={{ marginTop: 24 }}>
          <summary className="t-action">Payment details</summary>
          <dl className="facts" style={{ marginTop: 12 }}>
            <div><dt>Gross</dt><dd>{plain(w.grossCents)} USD</dd></div>
            <div><dt>Platform fee</dt><dd>{plain(w.feeCents)} USD</dd></div>
            <div><dt>Credited</dt><dd>{plain(w.netCents)} USD, {w.creditedOn}</dd></div>
          </dl>
          <p className="t-body" style={{ marginTop: 12 }}>Credited earnings are not a bank payout.</p>
        </details>
      )}
    </div>
  );
}

function VehicleDetail() {
  const v = profile.vehicle;
  return (
    <div>
      <div className="op-band" style={{ marginTop: 16 }}>
        <div><h2 className="t-object">{v.title}</h2><p className="t-fact" style={{ marginTop: 4 }}>{profile.city}<span aria-hidden> · </span>{v.listed ? "Listed for ads" : "Vehicle not ready"}</p></div>
        <Viewer src={v.photo} alt={v.alt} label="Expand media" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Expand media</Viewer>
      </div>
      <p className="t-body" style={{ marginTop: 16 }}>{v.rate === null ? "Rate not listed" : money(v.rate)}</p>
    </div>
  );
}

/** Share profile: a public preview link, copied only on the person's action, reported truthfully. */
export function ShareSheet() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const path = "/design-lab-v2/profile?public=1";
  return (
    <Sheet title="Share profile" triggerClass="icon-btn" triggerLabel="Share profile" trigger={<ShareNetwork size={20} aria-hidden />}>
      <a href={path} className="link t-action" style={{ display: "inline-flex", alignItems: "center", minHeight: 44 }} target="_blank" rel="noreferrer">Public preview</a>
      <p className="t-body" style={{ marginTop: 16 }}>This link opens a fictional Design Lab profile, not a live public profile.</p>
      <input readOnly value={path} aria-label="Preview link" onFocus={(e) => e.currentTarget.select()} style={{ width: "100%", marginTop: 12, minHeight: 44, padding: "0 12px", border: "1px solid var(--v2-line)", borderRadius: 4, background: "var(--v2-surface)", font: "inherit", color: "inherit" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button type="button" className="btn btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(`${location.origin}${path}`); setState("copied"); } catch { setState("failed"); } }}>Copy preview link</button>
        <span className="t-fact" role="status">{state === "copied" ? "Copied" : state === "failed" ? "Copy failed. Select the link instead." : ""}</span>
      </div>
    </Sheet>
  );
}

/** The single administrative entrance. Categories open the scope notice in this phase; Log out previews its confirmation and never signs out. */
export function SettingsSheet() {
  return (
    <Sheet title="Settings" variant="full" triggerClass="icon-btn" triggerLabel="Settings" trigger={<Gear size={20} aria-hidden />}>
      {USER_SETTINGS.map((row) => row === "Log out" ? (
        <Sheet key={row} title="Log out" triggerClass="sheet-row" trigger={<span>{row}</span>}>
          <p className="t-body" style={{ marginTop: 8 }}>This preview cannot sign out your account.</p>
          <button type="button" className="btn btn-primary" disabled style={{ marginTop: 16, opacity: 0.5 }}>Log out</button>
        </Sheet>
      ) : (
        <Outside key={row} label={row} className="sheet-row"><span>{row}</span><span aria-hidden><X size={0} /></span></Outside>
      ))}
    </Sheet>
  );
}
