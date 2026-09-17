"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, CaretDown, Check, MapPin, X } from "@phosphor-icons/react";
import { Sheet } from "../../../design-lab-v2/Sheet";
import { Money } from "../../../design-lab-v2/parts";
import { Plan } from "../Plan";
import { businessCar as v2Car, businessCities, businessPeople, money, type Person } from "../../../design-lab-v2/fixtures";
import { LoyaltyStrip } from "../../business/LoyaltyStrip";
import { M } from "../media";
import { LabStrip, useMotion, usePresentationTimer } from "../motion";

/**
 * V3 Business Home (docs/design-lab-v3/screens/x-business-home.md): WHO
 * OR WHAT CAN GROW MY BUSINESS. An open selection spread: Maya at human
 * scale through her portrait and two of her own work stills; Eli's car as
 * an independent photographic field with a precisely scoped asking rate;
 * the approved Loyalty strip after the completed lead spread; Nora and
 * Eli as finite independent people. Person and vehicle inspection are
 * object specific working surfaces (?person=, ?work=, ?request=,
 * ?vehicle=, ?zone=, ?offer= are native history). Nothing is sent.
 */
const businessCar = { ...v2Car, city: "Round Rock" };
type Tab = "for-you" | "people" | "cars" | "nearby";
const PORTRAIT: Record<string, string> = { maya: M.portraitMaya(480), nora: M.portraitNora(), eli: M.portraitEli() };
const STILLS: Record<string, [string, string]> = { maya: [M.mayaPour(480), M.mayaCup()], nora: [M.noraChain(), M.noraWheel()], eli: [M.eliBag(), M.eliCup()] };

function useQuery() {
  const [q, setQ] = useState<URLSearchParams | null>(null);
  useEffect(() => { const read = () => setQ(new URLSearchParams(location.search)); const t = setTimeout(read, 0); window.addEventListener("popstate", read); return () => { clearTimeout(t); window.removeEventListener("popstate", read); }; }, []);
  const set = (patch: Record<string, string | null>, push = true) => { const u = new URL(location.href); for (const [k, v] of Object.entries(patch)) { if (v === null) u.searchParams.delete(k); else u.searchParams.set(k, v); } if (push) history.pushState(null, "", u); else history.replaceState(null, "", u); setQ(new URLSearchParams(u.search)); };
  return { q, set };
}

function Empty({ text }: { text: string }) {
  return <div className="x-biz-empty"><p className="t-object">{text}</p><p className="t-fact">Choose another filter.</p></div>;
}

export function Discovery() {
  const [tab, setTab] = useState<Tab>("for-you");
  const [city, setCity] = useState("Austin");
  const [more, setMore] = useState(false);
  const { q, set } = useQuery();
  const opener = useRef<HTMLElement | null>(null);
  const people = tab === "nearby" ? businessPeople.filter((p) => p.city === city) : businessPeople;
  const car = tab === "people" ? null : tab === "nearby" && businessCar.city !== city ? null : businessCar;
  const [maya, nora, eli] = businessPeople;
  const personId = q?.get("person") ?? null;
  const person = personId ? businessPeople.find((p) => p.id === personId) ?? null : null;
  const vehicle = q?.get("vehicle") === businessCar.id;
  const openPerson = (id: string, work: number, el?: HTMLElement) => { opener.current = el ?? null; set({ person: id, work: String(work) }); };
  const closeTask = () => { const hadQuery = q && (q.has("person") || q.has("vehicle")); if (hadQuery) history.back(); set({ person: null, work: null, request: null, vehicle: null, zone: null, offer: null }, false); requestAnimationFrame(() => opener.current?.focus()); };
  const lead = people[0] ?? null;
  const rest = people.slice(1);
  const phoneRest = tab === "for-you" || tab === "nearby" ? (more ? rest : rest.slice(0, 1)) : rest;
  return (
    <div className="x-biz">
      <LabStrip right={
        <Sheet title="Location" variant="menu" triggerClass="link link-plain t-action x-biz-city" triggerLabel={`Change city, ${city}`} trigger={<><MapPin size={18} aria-hidden />{city}<CaretDown size={14} aria-hidden /></>}>
          {businessCities.map((c) => <button key={c} type="button" className="sheet-row" aria-pressed={city === c} onClick={(e) => { setCity(c); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}><span>{c}</span>{city === c && <Check size={20} aria-hidden />}</button>)}
          <p className="t-fact" style={{ marginTop: 12 }}>Fixture cities only.</p>
        </Sheet>
      } />
      <div className="tabs x-biz-tabs" role="tablist" aria-label="Discovery">
        {(["for-you", "people", "cars", "nearby"] as Tab[]).map((k) => <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{k === "for-you" ? "For you" : k === "people" ? "People" : k === "cars" ? "Cars" : "Nearby"}</button>)}
      </div>
      <div className={`x-biz-spread x-biz-${tab}`} key={tab}>
        {tab === "cars" ? (car ? <CarObject onOpen={(el) => { opener.current = el; set({ vehicle: businessCar.id, zone: "rear-doors" }); }} /> : <Empty text="No matches" />) : (
          <>
            {lead ? <PersonObject p={lead} lead onOpen={(w, el) => openPerson(lead.id, w, el)} onRequest={(el) => { opener.current = el; set({ person: lead.id, work: "0", request: "1" }); }} /> : !car && <Empty text="No matches" />}
            {car && <CarObject onOpen={(el) => { opener.current = el; set({ vehicle: businessCar.id, zone: "rear-doors" }); }} />}
          </>
        )}
        <LoyaltyStrip />
        {tab !== "cars" && (
          <div className="x-biz-roster">
            <div className="x-biz-roster-phone">{phoneRest.map((p) => <PersonObject key={p.id} p={p} onOpen={(w, el) => openPerson(p.id, w, el)} onRequest={(el) => { opener.current = el; set({ person: p.id, work: "0", request: "1" }); }} />)}{!more && rest.length > 1 && (tab === "for-you" || tab === "nearby") && <button type="button" className="link t-action x-biz-more" onClick={() => setMore(true)}>More</button>}</div>
            <div className="x-biz-roster-desk">{rest.map((p) => <PersonObject key={p.id} p={p} onOpen={(w, el) => openPerson(p.id, w, el)} onRequest={(el) => { opener.current = el; set({ person: p.id, work: "0", request: "1" }); }} />)}</div>
          </div>
        )}
      </div>
      {person && <PersonTask p={person} work={Number(q?.get("work") ?? 0)} request={q?.get("request") === "1"} setWork={(w) => set({ work: String(w) }, false)} setRequest={(on) => set({ request: on ? "1" : null }, false)} onClose={closeTask} />}
      {vehicle && <VehicleTask offer={q?.get("offer") === "1"} setOffer={(on) => set({ offer: on ? "1" : null }, false)} onClose={closeTask} />}
    </div>
  );
}

function PersonObject({ p, lead = false, onOpen, onRequest }: { p: Person; lead?: boolean; onOpen: (work: number, el: HTMLElement) => void; onRequest: (el: HTMLElement) => void }) {
  const stills = STILLS[p.id];
  return (
    <article className={`x-obj x-person${lead ? " x-person-lead" : ""}`} aria-labelledby={`p-${p.id}`}>
      <div className="x-person-media">
        <button type="button" className="media x-person-portrait" onClick={(e) => onOpen(0, e.currentTarget)} aria-label={`View person ${p.name}`}><img src={PORTRAIT[p.id]} alt="" width={480} height={600} decoding="async" loading={lead ? "eager" : "lazy"} fetchPriority={lead ? "high" : undefined} /></button>
        <div className="x-person-work">
          {(lead ? stills : [stills[0]]).map((s, i) => <button key={s} type="button" className={`media x-person-still x-person-still-${i}`} onClick={(e) => onOpen(i, e.currentTarget)} aria-label={`${p.name}, ${p.project.title} still ${i + 1}`}><img src={s} alt="" width={480} height={600} decoding="async" loading={lead ? "eager" : "lazy"} /></button>)}
        </div>
      </div>
      <div className="x-person-id">
        <h2 id={`p-${p.id}`} className={lead ? "x-person-name-lead" : "t-object"}>{p.name}</h2>
        {p.city !== "Austin" && <span className="t-fact">{p.city}</span>}
      </div>
      <div className="x-person-actions">
        <button type="button" className="link t-action" onClick={(e) => onOpen(0, e.currentTarget)}>View person</button>
        <button type="button" className="btn btn-primary x-person-request" onClick={(e) => onRequest(e.currentTarget)}>Request</button>
      </div>
    </article>
  );
}

function CarObject({ onOpen }: { onOpen: (el: HTMLElement) => void }) {
  const c = businessCar;
  return (
    <article className="x-obj x-car" aria-labelledby={`c-${c.id}`}>
      <button type="button" className="media x-car-photo" onClick={(e) => onOpen(e.currentTarget)} aria-label={`View ${c.title}`}><img src={M.vehicleEli(800)} srcSet={`${M.vehicleEli(800)} 800w, ${M.vehicleEli(1200)} 1200w`} sizes="(min-width: 1024px) 376px, 100vw" alt="" width={800} height={533} decoding="async" /></button>
      <div className="x-car-band paper">
        <span className="x-car-rate"><Money cents={c.askCents} basis="/month" whole inline /><span className="t-fact-ink">Asking rate</span></span>
        <button type="button" className="btn btn-primary x-car-view" onClick={(e) => onOpen(e.currentTarget)} aria-label={`View ${c.title}`}>View</button>
        <span className="x-car-id"><h2 id={`c-${c.id}`} className="t-object">{c.title}</h2><button type="button" className="link t-action" onClick={(e) => onOpen(e.currentTarget)}>Rear doors</button></span>
      </div>
    </article>
  );
}

/** A full height opaque working surface (phone) or a large working paper (desktop) with Back and Close. */
function Task({ title, onClose, children, kind }: { title: string; onClose: () => void; children: ReactNode; kind: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { const d = ref.current; if (d && !d.open) { d.showModal(); heading.current?.focus(); } }, []);
  return (
    <dialog ref={ref} className="x-task x-task-wide" aria-label={title} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="x-task-body x-task-body-wide" data-landed="true" data-kind={kind}>
        <div className="x-task-head paper">
          <button type="button" className="icon-btn x-task-back" aria-label="Back" onClick={onClose}><ArrowLeft size={20} /></button>
          <h2 ref={heading} tabIndex={-1} className="t-object x-task-title">{title}</h2>
          <button type="button" className="link link-plain t-action preview-close" onClick={onClose}><X size={18} aria-hidden />Close</button>
          <div className="x-task-strip"><LabStrip /></div>
        </div>
        {children}
      </div>
    </dialog>
  );
}

function PersonTask({ p, work, request, setWork, setRequest, onClose }: { p: Person; work: number; request: boolean; setWork: (w: number) => void; setRequest: (on: boolean) => void; onClose: () => void }) {
  const stills = STILLS[p.id];
  const w = Math.max(0, Math.min(1, work));
  return (
    <Task title={p.name} onClose={onClose} kind="person">
      <div className="x-pt">
        <div className="x-pt-media">
          <span className="media x-pt-portrait"><img src={PORTRAIT[p.id]} alt={p.portraitAlt} width={480} height={600} /></span>
          <span className="media x-pt-work x-open" key={w}><img src={stills[w]} alt={p.project.stills[w].alt} width={480} height={600} /></span>
        </div>
        <div className="x-pt-ctx">
          <span className="t-fact">Work</span>
          <span className="t-object">{p.project.title}</span>
          <span className="t-fact">{p.project.business}<span aria-hidden> · </span>Approved {p.project.approved}</span>
          <span className="x-pt-nav"><button type="button" className="link t-action" onClick={() => setWork((w + 1) % 2)}>Previous</button><button type="button" className="link t-action" onClick={() => setWork((w + 1) % 2)}>Next</button></span>
          <dl className="facts" style={{ marginTop: 16 }}>
            <div><dt>Completed</dt><dd>{p.completed}</dd></div>
            {p.rating && <div><dt>Rating</dt><dd>{p.rating.value.toFixed(1)}</dd></div>}
            {p.instagram && <div><dt>Instagram</dt><dd>{p.instagram.handle}<span aria-hidden> · </span>{p.instagram.followers.toLocaleString("en-US")} followers</dd></div>}
            {p.verified && <div><dt>Verified creator</dt><dd>Yes</dd></div>}
          </dl>
          {p.rating && <p className="t-body" style={{ marginTop: 12 }}>“{p.rating.review.text}” <span className="t-fact">{p.rating.review.by}, {p.rating.review.date}</span></p>}
          <div className="preview-actions"><button type="button" className="btn btn-primary" onClick={() => setRequest(true)}>Request</button></div>
        </div>
      </div>
      {request && <RequestComposer p={p} onClose={() => setRequest(false)} />}
    </Task>
  );
}

/** The request composer: person fixed, exactly Recreate and Story, pay, deadline, deliverables, terms; Review request is the local endpoint. Nothing is sent. */
function RequestComposer({ p, onClose }: { p: Person; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<"recreate" | "story" | null>(null);
  const [pay, setPay] = useState(""); const [deadline, setDeadline] = useState(""); const [deliverables, setDeliverables] = useState(""); const [terms, setTerms] = useState(false);
  const [review, setReview] = useState(false); const [tried, setTried] = useState(false); const [discard, setDiscard] = useState(false);
  useEffect(() => { const t = setTimeout(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, 0); return () => clearTimeout(t); }, []);
  const dirty = type !== null || pay || deadline || deliverables || terms;
  const errors = { type: type === null ? "Choose a request type." : null, pay: !pay || Number(pay) <= 0 ? "Enter creator pay in US dollars." : null, deadline: !deadline ? "Enter a deadline." : null, deliverables: !deliverables.trim() ? "Describe the deliverables." : null, terms: !terms ? "Accept the standard creator terms." : null };
  const valid = !Object.values(errors).some(Boolean);
  const tryClose = () => { if (dirty && !review) setDiscard(true); else onClose(); };
  return (
    <dialog ref={ref} className="sheet" aria-label="Request" onClose={onClose} onClick={(e) => { if (e.target === ref.current) tryClose(); }}>
      <div className="sheet-body x-composer">
        <div className="sheet-bar"><button type="button" className="icon-btn" aria-label="Back" onClick={() => (review ? setReview(false) : tryClose())}><ArrowLeft size={20} /></button><span className="sheet-title">{review ? "Request preview" : "Request"}</span><button type="button" className="link link-plain t-action preview-close" onClick={tryClose}><X size={18} aria-hidden />Close</button></div>
        <p className="t-object">{p.name}</p>
        {discard ? (
          <div className="x-composer-discard paper">
            <p className="t-object">Discard this draft?</p>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}><button type="button" className="btn btn-primary" onClick={() => setDiscard(false)}>Keep editing</button><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={onClose}>Discard draft</button></div>
          </div>
        ) : review ? (
          <div className="x-composer-review">
            <dl className="facts" style={{ marginTop: 12 }}>
              <div><dt>Type</dt><dd>{type === "recreate" ? "Recreate a Reel" : "Instagram Story ads"}</dd></div>
              <div><dt>Pay</dt><dd>{money(Math.round(Number(pay) * 100), { cents: true })}</dd></div>
              <div><dt>Deadline</dt><dd>{deadline}</dd></div>
              <div><dt>Deliverables</dt><dd>{deliverables}</dd></div>
              <div><dt>Terms</dt><dd>Standard creator terms</dd></div>
            </dl>
            <p className="t-body" style={{ marginTop: 16 }}>Nothing will be sent.</p>
            <p className="t-fact" style={{ marginTop: 4 }}>Sending, acceptance and approval are outside this preview.</p>
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setReview(false)}>Keep editing</button></div>
          </div>
        ) : (
          <form className="x-composer-form" onSubmit={(e) => { e.preventDefault(); setTried(true); if (valid) setReview(true); }} noValidate>
            <fieldset className="x-composer-field"><legend className="t-fact">Type</legend>
              <div className="x-composer-types">
                <button type="button" className="sheet-row" aria-pressed={type === "recreate"} onClick={() => setType("recreate")}><span>Recreate a Reel</span>{type === "recreate" && <Check size={20} aria-hidden />}</button>
                <button type="button" className="sheet-row" aria-pressed={type === "story"} disabled={!p.instagram} onClick={() => setType("story")} style={{ opacity: p.instagram ? 1 : 0.5 }}><span>Instagram Story ads{!p.instagram && <span className="t-fact" style={{ display: "block" }}>Requires a connected Instagram account.</span>}</span>{type === "story" && <Check size={20} aria-hidden />}</button>
              </div>
              {tried && errors.type && <span className="join-error">{errors.type}</span>}
            </fieldset>
            <label className="x-composer-field"><span className="t-fact">Pay (US$)</span><input className="join-input" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} aria-invalid={tried && Boolean(errors.pay)} />{tried && errors.pay && <span className="join-error">{errors.pay}</span>}</label>
            <label className="x-composer-field"><span className="t-fact">Deadline</span><input className="join-input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} aria-invalid={tried && Boolean(errors.deadline)} />{tried && errors.deadline && <span className="join-error">{errors.deadline}</span>}</label>
            <label className="x-composer-field"><span className="t-fact">Deliverables</span><textarea className="join-input join-textarea" value={deliverables} onChange={(e) => setDeliverables(e.target.value)} aria-invalid={tried && Boolean(errors.deliverables)} />{tried && errors.deliverables && <span className="join-error">{errors.deliverables}</span>}</label>
            <label className="join-consent"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="t-body">Standard creator terms apply. Pay, deadline, deliverables and rights are shown before sending.</span></label>
            {tried && errors.terms && <span className="join-error">{errors.terms}</span>}
            <div className="preview-actions"><button type="submit" className="btn btn-primary">Review request</button><span className="t-fact">Nothing will be sent.</span></div>
          </form>
        )}
      </div>
    </dialog>
  );
}

/** One part of a real car, working version: intact photograph, the separate plan, the selected zone and its asking rate, then Offer. */
function VehicleTask({ offer, setOffer, onClose }: { offer: boolean; setOffer: (on: boolean) => void; onClose: () => void }) {
  const c = businessCar;
  const { reduced } = useMotion();
  const [zone, setZone] = useState(reduced);
  usePresentationTimer(!reduced && !zone, 680, () => setZone(true), "vehicle");
  const on = reduced || zone;
  return (
    <Task title={c.title} onClose={onClose} kind="vehicle">
      <div className={`x-vt${on ? " is-on" : ""}`}>
        <span className="media x-vt-photo x-open"><img src={M.vehicleEli(1200)} alt={c.alt} width={1200} height={800} /></span>
        <div className="x-vt-plan paper">
          <span className="t-fact">Placement plan</span>
          <span className="x-fc-diagram"><Plan selected={on} /></span>
          <span className="x-vt-zone"><span className={`t-object${on ? " x-reveal" : ""}`}>Rear doors</span><span className="t-fact">Supported zone</span></span>
        </div>
        <div className="x-vt-rate paper">
          <span className={`x-vt-rate-line${on ? " x-rate-align" : ""}`}><Money cents={c.askCents} basis="/month" whole inline /><span className="t-fact-ink">Asking rate<span aria-hidden> · </span>Rear doors</span></span>
          <span className="t-fact">{c.city}<span aria-hidden> · </span>Eli Moss</span>
          <p className="t-body" style={{ marginTop: 8 }}>Asking rate; fees and final terms are not yet quoted.</p>
          <div className="preview-actions"><button type="button" className="btn btn-primary" onClick={() => setOffer(true)}>Offer</button></div>
        </div>
      </div>
      {offer && <OfferComposer onClose={() => setOffer(false)} />}
    </Task>
  );
}

function OfferComposer({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const c = businessCar;
  const [start, setStart] = useState(""); const [months, setMonths] = useState("3"); const [pay, setPay] = useState(""); const [terms, setTerms] = useState(false);
  const [review, setReview] = useState(false); const [tried, setTried] = useState(false); const [discard, setDiscard] = useState(false);
  useEffect(() => { const t = setTimeout(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, 0); return () => clearTimeout(t); }, []);
  const dirty = start || pay || terms || months !== "3";
  const errors = { start: !start ? "Enter a start date." : null, months: !months || Number(months) < 1 ? "Enter the number of months." : null, pay: !pay || Number(pay) <= 0 ? "Enter monthly pay in US dollars." : null, terms: !terms ? "Accept the placement terms." : null };
  const valid = !Object.values(errors).some(Boolean);
  const tryClose = () => { if (dirty && !review) setDiscard(true); else onClose(); };
  return (
    <dialog ref={ref} className="sheet" aria-label="Offer" onClose={onClose} onClick={(e) => { if (e.target === ref.current) tryClose(); }}>
      <div className="sheet-body x-composer">
        <div className="sheet-bar"><button type="button" className="icon-btn" aria-label="Back" onClick={() => (review ? setReview(false) : tryClose())}><ArrowLeft size={20} /></button><span className="sheet-title">{review ? "Offer preview" : "Offer"}</span><button type="button" className="link link-plain t-action preview-close" onClick={tryClose}><X size={18} aria-hidden />Close</button></div>
        <p className="t-object">{c.title}<span className="t-fact" style={{ display: "block" }}>Placement<span aria-hidden> · </span>Rear doors</span></p>
        {discard ? (
          <div className="x-composer-discard paper"><p className="t-object">Discard this draft?</p><div style={{ display: "flex", gap: 16, marginTop: 12 }}><button type="button" className="btn btn-primary" onClick={() => setDiscard(false)}>Keep editing</button><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={onClose}>Discard draft</button></div></div>
        ) : review ? (
          <div className="x-composer-review">
            <dl className="facts" style={{ marginTop: 12 }}>
              <div><dt>Placement</dt><dd>Rear doors</dd></div><div><dt>Dates</dt><dd>{start}, {months} months</dd></div>
              <div><dt>Monthly pay</dt><dd>{money(Math.round(Number(pay) * 100), { cents: true })}</dd></div><div><dt>Asking rate</dt><dd>{money(c.askCents)} /month</dd></div>
              <div><dt>Terms</dt><dd>Installation, proof and removal terms</dd></div>
            </dl>
            <p className="t-body" style={{ marginTop: 16 }}>Nothing will be sent.</p>
            <p className="t-fact" style={{ marginTop: 4 }}>Dates, installation, costs, proof and cancellation terms are required before sending.</p>
            <div style={{ display: "flex", gap: 16, marginTop: 16 }}><button type="button" className="link t-action" style={{ minHeight: 44 }} onClick={() => setReview(false)}>Keep editing</button></div>
          </div>
        ) : (
          <form className="x-composer-form" onSubmit={(e) => { e.preventDefault(); setTried(true); if (valid) setReview(true); }} noValidate>
            <label className="x-composer-field"><span className="t-fact">Start date</span><input className="join-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} aria-invalid={tried && Boolean(errors.start)} />{tried && errors.start && <span className="join-error">{errors.start}</span>}</label>
            <label className="x-composer-field"><span className="t-fact">Months</span><input className="join-input" inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} aria-invalid={tried && Boolean(errors.months)} />{tried && errors.months && <span className="join-error">{errors.months}</span>}</label>
            <label className="x-composer-field"><span className="t-fact">Monthly pay (US$)</span><input className="join-input" inputMode="decimal" value={pay} onChange={(e) => setPay(e.target.value)} aria-invalid={tried && Boolean(errors.pay)} /><span className="t-fact">Asking rate {money(c.askCents)} /month</span>{tried && errors.pay && <span className="join-error">{errors.pay}</span>}</label>
            <label className="join-consent"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="t-body">Installation is arranged after acceptance. Monthly payment requires approved proof. Removal at the end of the campaign.</span></label>
            {tried && errors.terms && <span className="join-error">{errors.terms}</span>}
            <div className="preview-actions"><button type="submit" className="btn btn-primary">Review offer</button><span className="t-fact">Nothing will be sent.</span></div>
          </form>
        )}
      </div>
    </dialog>
  );
}
