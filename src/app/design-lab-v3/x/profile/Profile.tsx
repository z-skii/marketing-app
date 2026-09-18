"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretRight, Gear, X } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Outside } from "../../../design-lab-v2/Outside";
import { Wordmark } from "../../../design-lab-v2/parts";
import { profile, USER_SETTINGS } from "../../../design-lab-v2/fixtures";
import { M } from "../media";
import { LabStrip } from "../motion";

/**
 * V3 User Profile in the approved recomposition language: an identity a
 * person would share, tapmart.live/@username on the object itself. A
 * generous portrait, name, handle, city and the supported completion
 * fact; Maya's own work in a loose mixed proportion arrangement that
 * inspects inline; her real car as a quieter contact sheet. Private
 * earnings and administration are absent from the composition; one
 * Settings gear holds administration. ?view=public is the guest share
 * view with owner controls removed.
 */
const WORK = [
  { id: profile.work[0].id, src: M.mayaLatte(480), full: profile.work[0].media, w: 480, h: 600, ratio: "4 / 5", title: profile.work[0].title, business: profile.work[0].business, state: profile.work[0].state, alt: profile.work[0].alt, kind: "Recreate" },
  { id: profile.work[1].id, src: M.story(480), full: profile.work[1].media, w: 480, h: 853, ratio: "9 / 16", title: profile.work[1].title, business: profile.work[1].business, state: profile.work[1].state, alt: profile.work[1].alt, kind: "Story" },
  { id: profile.work[2].id, src: M.mayaPlacement(), full: profile.work[2].media, w: 720, h: 480, ratio: "3 / 2", title: profile.work[2].title, business: profile.work[2].business, state: profile.work[2].state, alt: profile.work[2].alt, kind: "Car" },
];
const PUBLIC_PATH = "/design-lab-v3/profile?view=public";

export function ProfilePage({ publicView }: { publicView: boolean }) {
  return (
    <div className={`x-profile${publicView ? " x-profile-public" : ""}`}>
      {publicView && (
        <header className="x-profile-head">
          <Link href="/design-lab-v3" className="x-wordmark-link" aria-label="TapMart"><Wordmark size={20} className="x-wordmark" /></Link>
          <span className="x-profile-head-r"><ShareSheet /></span>
        </header>
      )}
      <LabStrip />
      {/* Desktop keeps the sidebar, so the owner entrances (Share profile, one Settings gear) sit at the top of the composition. */}
      {!publicView && <div className="x-pf-owner"><ShareSheet /><SettingsSheet /></div>}
      <ProfileBody publicView={publicView} />
    </div>
  );
}

export function ProfileBody({ publicView }: { publicView: boolean }) {
  const [sel, setSel] = useState<number | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const p = profile;
  useEffect(() => { if (sel !== null) heading.current?.focus(); }, [sel]);
  // ?work=<id> opens inline inspection on arrival; browser Back closes it
  useEffect(() => {
    const read = () => { const w = new URLSearchParams(location.search).get("work"); const i = WORK.findIndex((x) => x.id === w); setSel(i >= 0 ? i : null); };
    const t = setTimeout(read, 0); window.addEventListener("popstate", read);
    return () => { clearTimeout(t); window.removeEventListener("popstate", read); };
  }, []);
  const openWork = (i: number, el: HTMLElement) => { opener.current = el; const u = new URL(location.href); u.searchParams.set("work", WORK[i].id); history.pushState(null, "", u); setSel(i); };
  const closeWork = () => { const u = new URL(location.href); if (u.searchParams.has("work")) history.back(); else setSel(null); requestAnimationFrame(() => opener.current?.focus()); };
  const step = (d: number) => { const n = ((sel ?? 0) + d + WORK.length) % WORK.length; const u = new URL(location.href); u.searchParams.set("work", WORK[n].id); history.replaceState(null, "", u); setSel(n); };
  const w = sel !== null ? WORK[sel] : null;
  const handle = `tapmart.live/${p.username}`;
  return (
    <div className="xs-stage xs-pf">
      {/* identity: the portrait as the focal plane, the name as the object's typography, the share handle, the supported facts */}
      <section className="xs-pf-identity" aria-label="Identity">
        <span className="xs-plane xs-pf-portrait" style={{ cursor: "default" }}><img src={M.portraitMaya(480)} srcSet={`${M.portraitMaya(480)} 480w, ${M.portraitMaya(720)} 720w`} sizes="(min-width: 1024px) 312px, 264px" alt={p.portraitAlt} width={480} height={600} fetchPriority="high" decoding="async" /></span>
        <div className="xs-pf-who">
          <h2 className="xs-pf-name">{p.name}</h2>
          <p className="t-fact xs-pf-handle">{handle}</p>
          <p className="t-fact">{p.city}<span aria-hidden> · </span><span className="t-fact-ink">{p.completed}</span> Completed</p>
          <p className="xs-pf-tags"><span className="x-tag">{p.instagram ? `Instagram ${p.instagram.handle}` : "Instagram not connected"}</span>{p.vehicle.listed && <span className="x-tag">Vehicle listed</span>}</p>
        </div>
      </section>
      {/* work: her own media as planes, each tagged with its product identity; selecting one inspects it in place */}
      <section className="xs-pf-workwrap" aria-labelledby="work-h">
        <div className="x-pf-work-head">
          <h3 id="work-h" ref={sel !== null ? heading : undefined} tabIndex={sel !== null ? -1 : undefined} className="x-pf-work-h" style={{ color: "#fff" }}>Work</h3>
          {w && (
            <span className="xs-pf-tools">
              <button type="button" className="link t-action" onClick={() => step(-1)}>Previous</button>
              <button type="button" className="link t-action" onClick={() => step(1)}>Next</button>
              <button type="button" className="link link-plain t-action preview-close" onClick={closeWork}><X size={18} aria-hidden />Close</button>
            </span>
          )}
        </div>
        {w ? (
          <div className="xs-pf-inspect x-open" key={w.id} role="region" aria-label={`Work: ${w.title}`}>
            <span className="xs-plane xs-pf-inspect-media" style={{ aspectRatio: w.ratio, cursor: "default" }}><img src={w.full} alt={w.alt} /></span>
            <div className="x-paper xs-sheet">
              <span className="t-fact">{w.kind}<span aria-hidden> · </span>{sel! + 1} of {WORK.length}</span>
              <span className="t-object">{w.title}</span>
              <span className="t-fact">{w.business}</span>
              <span className="t-fact-ink">{w.state}</span>
            </div>
          </div>
        ) : (
          <div className="xs-pf-work">
            {WORK.map((x, i) => (
              <button key={x.id} type="button" className={`xs-plane xs-pf-item-${i}`} onClick={(e) => openWork(i, e.currentTarget)} aria-label={`Open ${x.title}, ${x.business}`}><img src={x.src} alt="" width={x.w} height={x.h} decoding="async" loading={i === 0 ? "eager" : "lazy"} /><span className="x-tag xs-tag">{x.kind}</span></button>
            ))}
          </div>
        )}
      </section>
      {/* the vehicle: the Drive object, photograph plus zone, with its facts attached */}
      <section className="xs-obj xs-pf-vehicle" aria-labelledby="vehicle-h">
        <Sheet title={p.vehicle.title} variant="full" triggerClass="xs-plane" triggerLabel={`View ${p.vehicle.title}`} trigger={<><img src={M.vehicleMaya(800)} alt="" width={800} height={533} decoding="async" loading="lazy" /><span className="x-tag xs-tag">Car</span><span className="x-tag xs-tag xs-tag-br">Rear doors</span></>}>
          <VehicleTask />
        </Sheet>
        <div className="x-paper xs-sheet">
          <h3 id="vehicle-h" className="t-object">{p.vehicle.title}</h3>
          <span className="t-fact">{p.vehicle.listed ? "Listed for ads" : "Vehicle not ready"}<span aria-hidden> · </span>{p.city}</span>
          <Sheet title={p.vehicle.title} variant="full" triggerClass="link t-action" trigger="View"><VehicleTask /></Sheet>
        </div>
      </section>
      {!publicView && <span className="v2-sr">Earnings and account administration are in Earnings and Settings.</span>}
    </div>
  );
}

function VehicleTask() {
  const v = profile.vehicle;
  return (
    <div className="x-pf-vehicle-task">
      <LabStrip />
      <span className="media x-pf-vehicle-large"><img src={M.vehicleMaya(1200)} alt={v.alt} width={1200} height={800} decoding="async" /></span>
      <p className="t-fact" style={{ marginTop: 12 }}>{v.listed ? "Listed for ads" : "Vehicle not ready"}<span aria-hidden> · </span>{profile.city}</p>
    </div>
  );
}

/** Share profile: the isolated public preview link, copied only on the person's action and reported truthfully. */
export function ShareSheet() {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const [url, setUrl] = useState(PUBLIC_PATH);
  useEffect(() => { const t = setTimeout(() => setUrl(`${location.origin}${PUBLIC_PATH}`), 0); return () => clearTimeout(t); }, []);
  return (
    <Sheet title="Share profile" triggerClass="link link-plain t-action x-share" trigger="Share profile">
      <p className="t-fact" style={{ marginTop: 8 }}>Design Lab link</p>
      <p className="t-body" style={{ marginTop: 4 }}>A fictional Design Lab profile, not a live public profile.</p>
      {state === "failed" && <><p className="state bad" style={{ marginTop: 12, fontSize: 16, lineHeight: "24px" }}>Couldn’t copy link.</p><input readOnly value={url} aria-label="Public preview link" onFocus={(e) => e.currentTarget.select()} className="join-input" style={{ marginTop: 8 }} /></>}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-primary" onClick={async () => { try { await navigator.clipboard.writeText(url); setState("copied"); } catch { setState("failed"); } }}>{state === "copied" ? "Link copied" : "Copy link"}</button>
        <a href={PUBLIC_PATH} className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Open public preview</a>
      </div>
    </Sheet>
  );
}

/** The single administrative entrance. Rows open the explicit lab notice; Log out previews its confirmation and never signs out. */
export function SettingsSheet() {
  return (
    <Sheet title="Settings" variant="full" triggerClass="icon-btn" triggerLabel="Settings" trigger={<Gear size={20} aria-hidden />}>
      <div style={{ marginTop: 4 }}><LabStrip /></div>
      <ul style={{ marginTop: 8 }}>
        {USER_SETTINGS.map((row) => row === "Log out" ? (
          <li key={row}><Sheet title="Log out" triggerClass="sheet-row" trigger={<span>{row}</span>}><p className="t-body" style={{ marginTop: 8 }}>This preview cannot sign out your account.</p><button type="button" className="btn btn-primary" disabled style={{ marginTop: 16, opacity: 0.5 }}>Log out</button></Sheet></li>
        ) : (
          <li key={row}><Outside label={row} className="sheet-row"><span>{row === "Instagram and Connections" ? "Instagram and connections" : row}{row === "Instagram and Connections" && <span className="t-fact" style={{ display: "block" }}>Not connected</span>}</span><CaretRight size={16} aria-hidden /></Outside></li>
        ))}
      </ul>
    </Sheet>
  );
}
