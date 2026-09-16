"use client";

import { useState, type ReactNode } from "react";
import { ArrowsOutSimple, CaretDown, Check, InstagramLogo, MapPin } from "@phosphor-icons/react";
import { Preview } from "../Preview";
import { Viewer } from "../Viewer";
import { Sheet } from "../Sheet";
import { Edge, Money } from "../parts";
import { Img } from "../Img";
import { businessCar, businessCities, businessPeople, money, type Person } from "../fixtures";

/**
 * Business Home discovery: WHO OR WHAT CAN MARKET MY BUSINESS. A person is
 * a face plus authored work meeting one earning edge that ends at Request;
 * a car is a grounded photograph whose edge ends at its monthly asking
 * rate. Four local tabs filter one marketplace. Phone shows Maya, the car
 * and Nora, then More reveals Eli; desktop shows all four.
 */
type Tab = "for-you" | "people" | "cars" | "nearby";

export function Discovery() {
  const [tab, setTab] = useState<Tab>("for-you");
  const [city, setCity] = useState("Austin");
  const [more, setMore] = useState(false);
  const people = tab === "nearby" ? businessPeople.filter((p) => p.city === city) : businessPeople;
  const car = tab === "people" ? null : tab === "nearby" && businessCar.city !== city ? null : businessCar;
  const showPeople = tab !== "cars";
  const [maya, nora, eli] = businessPeople;
  const phoneList: ReactNode[] = [];
  if (tab === "for-you") {
    phoneList.push(<PersonObject key="maya" p={maya} />, car && <CarObject key="car" />, <PersonObject key="nora" p={nora} />, more ? <PersonObject key="eli" p={eli} /> : <button key="more" type="button" className="link t-action biz-more" onClick={() => setMore(true)}>More</button>);
  } else if (tab === "cars") {
    phoneList.push(car ? <CarObject key="car" /> : <Empty key="e" text="No cars match this view." />);
  } else {
    if (!people.length && !car) phoneList.push(<Empty key="e" text={tab === "people" ? "No people match this view." : "No people or cars here yet."} />);
    people.forEach((p) => phoneList.push(<PersonObject key={p.id} p={p} />));
    if (car) phoneList.splice(1, 0, <CarObject key="car" />);
  }
  return (
    <>
      <div className="biz-context">
        <span className="t-note">Fictional preview</span>
        <Sheet title="Location" variant="menu" triggerClass="link link-plain t-action biz-city" triggerLabel={`Change city, ${city}`} trigger={<><MapPin size={20} aria-hidden />{city}<CaretDown size={16} aria-hidden /></>}>
          {businessCities.map((c) => (
            <button key={c} type="button" className="sheet-row" aria-pressed={city === c} onClick={(e) => { setCity(c); (e.currentTarget.closest("dialog") as HTMLDialogElement | null)?.close(); }}>
              <span>{c}</span>{city === c && <Check size={20} aria-hidden />}
            </button>
          ))}
          <p className="t-fact" style={{ marginTop: 12 }}>Fixture cities only.</p>
        </Sheet>
      </div>
      <div className="tabs" role="tablist" aria-label="Discovery">
        {(["for-you", "people", "cars", "nearby"] as Tab[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{k === "for-you" ? "For you" : k === "people" ? "People" : k === "cars" ? "Cars" : "Nearby"}</button>
        ))}
      </div>
      <div className={`biz-spread biz-${tab}`} data-more={more ? "true" : "false"}>
        <div className="biz-phone">{phoneList}</div>
        <div className="biz-desk">
          {tab === "cars" ? (car ? <CarObject /> : <Empty text="No cars match this view." />) : (
            <>
              {showPeople && people[0] && <PersonObject p={people[0]} featured />}
              {car && <CarObject />}
              {showPeople && people.slice(1).map((p) => <PersonObject key={p.id} p={p} />)}
              {!people.length && !car && <Empty text={tab === "people" ? "No people match this view." : "No people or cars here yet."} />}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="biz-empty"><p className="t-object">{text}</p></div>;
}

function PersonObject({ p, featured = false }: { p: Person; featured?: boolean }) {
  return (
    <Preview id={`person-${p.id}${featured ? "-f" : ""}`} kind="person" title={p.name} media={p.portrait} mediaRatio="4 / 5" mediaAlt={p.portraitAlt} content={<PersonDetail p={p} />}>
      {(open) => (
        <article className={`obj person${featured ? " person-featured" : ""}`} aria-labelledby={`p-${p.id}${featured ? "f" : ""}`}>
          <div className="person-media">
            <button type="button" className="media person-portrait" style={{ aspectRatio: "4 / 5" }} onClick={open} aria-label={`View person ${p.name}`}><Img src={p.portrait} alt="" /></button>
            <div className="person-work">
              {p.project.stills.map((w, i) => (
                <button key={i} type="button" className="media person-still" style={{ aspectRatio: "4 / 5" }} onClick={open} aria-label={`${p.name}, ${p.project.title} still ${i + 1}`}><Img src={w.src} alt="" fallback="Work unavailable" /></button>
              ))}
            </div>
          </div>
          <Edge />
          <div className="person-band">
            <div className="person-id">
              <h2 id={`p-${p.id}${featured ? "f" : ""}`} className="t-object">{p.name}</h2>
              <span className="t-fact">{p.city}</span>
              {p.instagram && <span className="t-fact person-ig"><InstagramLogo size={16} aria-hidden /><span className="v2-sr">Instagram connected </span>{p.instagram.handle}</span>}
            </div>
            <div className="person-actions">
              <button type="button" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }} onClick={open}>View person</button>
              <RequestSheet p={p} />
            </div>
          </div>
        </article>
      )}
    </Preview>
  );
}

function PersonDetail({ p }: { p: Person }) {
  return (
    <div>
      <div className="op-band" style={{ marginTop: 16, alignItems: "center" }}>
        <div><h2 className="t-object">{p.name}</h2><p className="t-fact" style={{ marginTop: 4 }}>{p.city}{p.instagram && <><span aria-hidden> · </span>{p.instagram.handle}</>}</p></div>
        <RequestSheet p={p} />
      </div>
      <h3 className="t-action" style={{ marginTop: 24 }}>Work</h3>
      <p className="t-fact" style={{ marginTop: 4 }}>{p.project.title}<span aria-hidden> · </span>{p.project.business}<span aria-hidden> · </span>Recreate still<span aria-hidden> · </span>Approved {p.project.approved}</p>
      <div className="person-detail-work">
        {p.project.stills.map((w, i) => (
          <Viewer key={i} src={w.src} alt={w.alt} label={`Inspect ${p.project.title} still ${i + 1}`} className="media" style={{ aspectRatio: "4 / 5", display: "block", width: "100%" }}><Img src={w.src} alt="" fallback="Work unavailable" /></Viewer>
        ))}
      </div>
      <dl className="facts" style={{ marginTop: 24 }}>
        <div><dt>Completed</dt><dd>{p.completed}</dd></div>
        {p.rating && <div><dt>Rating</dt><dd>{p.rating.value.toFixed(1)}</dd></div>}
        {p.instagram && <div><dt>Followers</dt><dd>{p.instagram.followers.toLocaleString("en-US")}</dd></div>}
        {p.verified && <div><dt>Verified creator</dt><dd className="v2-sr">Yes</dd></div>}
      </dl>
      {p.rating && (
        <details className="disclosure" style={{ marginTop: 8 }}>
          <summary className="t-action">Reviews</summary>
          <p className="t-body" style={{ marginTop: 8 }}>{p.rating.review.text}</p>
          <p className="t-fact" style={{ marginTop: 4 }}>{p.rating.review.by}<span aria-hidden> · </span>{p.rating.review.date}</p>
        </details>
      )}
      <div style={{ marginTop: 24 }}>
        <Viewer src={p.portrait} alt={p.portraitAlt} label="Inspect" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Inspect</Viewer>
      </div>
    </div>
  );
}

/** Quick request: Story or Recreate, chosen in context. Nothing is sent from this preview. */
function RequestSheet({ p }: { p: Person }) {
  const [choice, setChoice] = useState<"Story" | "Recreate" | null>(null);
  return (
    <Sheet title="Request" triggerClass="btn btn-primary" triggerStyle={{ width: 112 }} trigger="Request">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <span className="media" style={{ width: 64, height: 80, position: "relative" }}><Img src={p.portrait} alt="" /></span>
        <span className="t-object">{p.name}</span>
      </div>
      {choice === null ? (
        <>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="sheet-row" disabled={!p.instagram} onClick={() => setChoice("Story")} aria-describedby={!p.instagram ? `story-why-${p.id}` : undefined} style={{ opacity: p.instagram ? 1 : 0.5 }}><span>Story</span></button>
            {!p.instagram && <p id={`story-why-${p.id}`} className="t-fact" style={{ margin: "4px 0 8px" }}>Story requires a connected Instagram account.</p>}
            <button type="button" className="sheet-row" onClick={() => setChoice("Recreate")}><span>Recreate</span></button>
          </div>
          <p className="t-fact" style={{ marginTop: 16 }}>Nothing is sent from this preview.</p>
        </>
      ) : (
        <div style={{ marginTop: 16 }}>
          <p className="t-object">{choice}</p>
          <p className="t-body" style={{ marginTop: 12 }}>Outside this preview</p>
          <p className="t-fact" style={{ marginTop: 4 }}>Creator pay, deadline, deliverables and terms are required before sending.</p>
          <p className="t-fact" style={{ marginTop: 12 }}>Nothing is sent from this preview.</p>
          <button type="button" className="link t-action" style={{ marginTop: 16, minHeight: 44 }} onClick={() => setChoice(null)}>Back</button>
        </div>
      )}
    </Sheet>
  );
}

function CarObject() {
  const c = businessCar;
  return (
    <Preview id={c.id} title={c.title} media={c.photo} mediaRatio="3 / 2" mediaAlt={c.alt} content={<CarDetail />}>
      {(open) => (
        <article className="obj car" aria-labelledby={`c-${c.id}`}>
          <button type="button" className="media car-photo" style={{ aspectRatio: "3 / 2" }} onClick={open} aria-label={`View ${c.title}`}><Img src={c.photo} alt="" /></button>
          <Edge />
          <div className="op-band">
            <div className="op-money"><Money cents={c.askCents} basis="/month" whole inline /></div>
            <button type="button" className="btn btn-primary" style={{ width: 88 }} onClick={open} aria-label={`View ${c.title}`}>View</button>
          </div>
          <div className="car-id"><h2 id={`c-${c.id}`} className="t-object">{c.title}</h2><span className="t-fact">{c.city}</span></div>
          <p className="t-fact" style={{ marginTop: 4 }}>{c.zone}<span aria-hidden> · </span>Asking rate</p>
        </article>
      )}
    </Preview>
  );
}

/** The car preview: photograph, asking rate, the supported placement diagram with a real selection, and the offer boundary. */
function CarDetail() {
  const c = businessCar;
  const [selected, setSelected] = useState(false);
  const [offer, setOffer] = useState(false);
  return (
    <div>
      <div className="op-band" style={{ marginTop: 16 }}>
        <div><Money cents={c.askCents} basis="/month" whole inline /><span className="t-fact-ink" style={{ display: "block", marginTop: 4 }}>Asking rate</span></div>
        <Viewer src={c.photo} alt={c.alt} label="Inspect" className="link t-action" style={{ display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44 }}><ArrowsOutSimple size={18} aria-hidden />Inspect</Viewer>
      </div>
      <h2 className="t-object" style={{ marginTop: 12 }}>{c.title}</h2>
      <p className="t-fact" style={{ marginTop: 4 }}>{c.city}</p>
      <h3 className="t-action" style={{ marginTop: 24 }}>Placements</h3>
      <p className="t-fact" style={{ marginTop: 4 }}>Placement diagram</p>
      <button type="button" className={`placement${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => setSelected((v) => !v)} aria-label={`Rear doors${selected ? ", selected" : ""}`}>
        <PlacementDiagram selected={selected} />
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <button type="button" className={`btn ${selected ? "btn-primary" : "btn-line"}`} aria-pressed={selected} onClick={() => setSelected((v) => !v)}>{selected && <Check size={16} aria-hidden />}Rear doors</button>
        <span className="t-fact">{selected ? "Selected" : "Select placement"}</span>
      </div>
      <p className="t-body" style={{ marginTop: 24 }}>Asking rate; fees and final terms are not yet quoted.</p>
      <div className="preview-actions">
        {offer ? (
          <div>
            <p className="t-body">Outside this preview</p>
            <p className="t-fact" style={{ marginTop: 4 }}>Nothing is sent from this preview.</p>
            <p className="t-fact" style={{ marginTop: 4 }}>Dates, installation, costs, proof and cancellation terms are required before sending.</p>
            <button type="button" className="link t-action" style={{ marginTop: 12, minHeight: 44 }} onClick={() => setOffer(false)}>Back</button>
          </div>
        ) : (
          <button type="button" className="btn btn-primary" disabled={!selected} style={{ opacity: selected ? 1 : 0.5 }} onClick={() => setOffer(true)}>Offer</button>
        )}
      </div>
      <p className="v2-sr">{money(c.askCents)} per month, asking rate, rear doors</p>
    </div>
  );
}

/** The supported rear-door zone on a simple side elevation. A diagram, never a reconstruction of the photographed car. */
function PlacementDiagram({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 1200 800" width="100%" height="auto" aria-hidden style={{ display: "block" }}>
      <line x1="80" y1="620" x2="1120" y2="620" stroke="var(--v2-line)" strokeWidth="4" />
      <g fill="none" stroke="var(--v2-ink)" strokeWidth="8" strokeLinejoin="round">
        <path d="M150 560 L150 430 Q160 330 260 320 L330 320 L420 200 Q440 170 480 170 L780 170 Q820 170 840 200 L930 320 L1020 335 Q1060 345 1060 400 L1060 560 Z" />
        <path d="M350 320 L430 205 L580 205 L580 320 Z M615 320 L615 205 L770 205 L830 320 Z" strokeWidth="6" />
        <line x1="597" y1="205" x2="597" y2="560" strokeWidth="6" /><line x1="330" y1="320" x2="330" y2="560" strokeWidth="6" /><line x1="860" y1="320" x2="860" y2="560" strokeWidth="6" />
        <circle cx="330" cy="580" r="70" fill="var(--v2-surface)" /><circle cx="880" cy="580" r="70" fill="var(--v2-surface)" />
        <circle cx="330" cy="580" r="28" strokeWidth="6" /><circle cx="880" cy="580" r="28" strokeWidth="6" />
      </g>
      <rect x="615" y="345" width="235" height="200" fill={selected ? "var(--v2-ink)" : "var(--v2-soft)"} stroke="var(--v2-ink)" strokeWidth="8" />
    </svg>
  );
}
