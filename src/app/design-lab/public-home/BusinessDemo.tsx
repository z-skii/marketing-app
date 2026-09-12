"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { PersonAssembly } from "../business-home/PeopleRibbon";
import { PlacementDiagram } from "./PlacementDiagram";
import { ContentWorkspace } from "../business-content/ContentWorkspace";
import { people, cars, contentFiles, usd, type Person } from "../mock";
import { demoMutation } from "../adapter";

/**
 * One usable business demonstration instead of two screenshots. A 48px
 * toolbar switches between Campaigns (the real people gallery; View
 * person opens that person's portfolio-led detail with the named request
 * choices; Cars opens the offered-vehicle inspection) and Monthly content
 * (the real media field and inspector). Every action runs against the
 * isolated demo adapter: no request is sent, no file is published, no
 * money is created. Changes reset on reload.
 */
type Mode = "campaigns" | "content";
type View = { kind: "people" } | { kind: "person"; id: string } | { kind: "cars" };

export function BusinessDemo() {
  const [mode, setMode] = useState<Mode>("campaigns");
  const [view, setView] = useState<View>({ kind: "people" });
  return (
    <div className="pub-demo" data-shelf-root>
      <div className="pub-demo-bar" role="tablist" aria-label="Business demonstration">
        <button type="button" role="tab" aria-selected={mode === "campaigns"} className={mode === "campaigns" ? "is-on" : ""} onClick={() => setMode("campaigns")}>Campaigns</button>
        <button type="button" role="tab" aria-selected={mode === "content"} className={mode === "content" ? "is-on" : ""} onClick={() => setMode("content")}>Monthly content</button>
        <span className="t-meta" style={{ marginLeft: "auto" }}>Demo product · Changes reset · No real request is sent</span>
      </div>
      <p className="t-body pub-demo-line" style={{ margin: "12px 0 0", color: "var(--tm-muted)" }}>{mode === "campaigns" ? "Request people or car placements." : "Review delivered files and schedule posts."}</p>
      <div className="pub-demo-field" key={mode}>
        {mode === "campaigns" ? (
          view.kind === "people" ? <PeopleView onView={(id) => setView({ kind: "person", id })} onCars={() => setView({ kind: "cars" })} />
          : view.kind === "person" ? <PersonDetail person={people.find((p) => p.id === view.id)!} onBack={() => setView({ kind: "people" })} />
          : <CarsView onBack={() => setView({ kind: "people" })} />
        ) : (
          <ContentWorkspace files={contentFiles} shootLabel="Shoot 01 · May 7, 2026" uploader="Imani Cole" demo />
        )}
      </div>
    </div>
  );
}

function PeopleView({ onView, onCars }: { onView: (id: string) => void; onCars: () => void }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
        <div className="filters" role="radiogroup" aria-label="Discovery" style={{ flex: 1, borderBottom: 0 }}>
          <button type="button" role="radio" aria-checked="true" style={{ fontSize: 16 }}>People</button>
          <button type="button" role="radio" aria-checked="false" style={{ fontSize: 16 }} onClick={onCars}>Cars</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 376px)", gap: 24, marginTop: 12, paddingBottom: 0 }}>
        {people.slice(0, 3).map((p) => <PersonAssembly key={p.id} person={p} onView={onView} />)}
      </div>
      <p className="t-meta" style={{ margin: "16px 0 0" }}>3 of {people.length} people · <Link href="/design-lab/business-home" className="link-ink link-ul" style={{ fontWeight: 500 }}>See all people</Link></p>
    </div>
  );
}

function PersonDetail({ person, onBack }: { person: Person; onBack: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const request = async (kind: string) => {
    if (pending) return; setPending(true);
    const r = await demoMutation(); setPending(false);
    if (r.ok) setDraft(kind);
  };
  return (
    <div className="pub-person" style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 448px) minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
      <div>
        <button type="button" className="btn btn-quiet link-ink" style={{ paddingLeft: 0, minHeight: 44 }} onClick={onBack}><ArrowLeft size={18} aria-hidden /> People</button>
        <div className="media" style={{ width: 160, height: 200, marginTop: 8, background: "var(--tm-underlay)", display: "grid", placeItems: "center" }}>
          {person.portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.portrait} alt={person.name} width={160} height={200} />
          ) : <span aria-hidden className="t-display" style={{ fontWeight: 700, fontSize: 28 }}>{person.initials}</span>}
        </div>
      </div>
      <div style={{ paddingTop: 52 }}>
        {person.sample ? (
          <div className="media contain" style={{ width: 448, height: 336, background: "var(--tm-underlay)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={person.sample.src} alt={`Work by ${person.name}`} width={448} height={336} />
          </div>
        ) : <p className="t-meta" style={{ margin: 0 }}>No work samples shared.</p>}
        <p className="t-meta" style={{ margin: "8px 0 0" }}>Portfolio · {person.sample ? "1 of 1 shared sample" : "nothing shared"}</p>
      </div>
      <div style={{ paddingTop: 52 }}>
        <p className="t-identity" style={{ margin: 0, fontSize: 26, lineHeight: "30px" }}>{person.name}</p>
        <p className="t-meta" style={{ margin: "4px 0 0" }}>{person.city}{person.completed != null ? ` · ${person.completed} completed` : ""}{person.rating ? ` · ${person.rating.value.toFixed(1)} (${person.rating.count} reviews)` : ""}</p>
        <p className="t-meta" style={{ margin: 0 }}>{person.qualification || "Not verified"}</p>
        <p className="t-body" style={{ margin: "12px 0 0" }}>{person.sample ? `${person.sample.title} · ${person.sample.kind}` : "No work samples shared"}</p>
        <p className="t-label" style={{ margin: "24px 0 0" }}>Request work from {person.name.split(" ")[0]}</p>
        <p className="t-meta" style={{ margin: "2px 0 0" }}>Demo only · No real request is sent</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, maxWidth: 280 }}>
          <button type="button" className="btn btn-secondary" disabled={pending || !person.sample} onClick={() => request("Recreate Reel")}>Request a Reel</button>
          <button type="button" className="btn btn-secondary" disabled={pending || !person.sample} onClick={() => request("Instagram Story")}>Request a Story</button>
        </div>
        <p className="t-meta" style={{ margin: "12px 0 0" }}>{draft ? <><span className="status waiting">Draft saved</span> · {draft} request · Not sent</> : "Nothing sent until you confirm in Campaigns."}</p>
      </div>
    </div>
  );
}

function CarsView({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState(cars[0].id);
  const [offer, setOffer] = useState(false);
  const [pending, setPending] = useState(false);
  const car = cars.find((c) => c.id === selected)!;
  const sendOffer = async () => { if (pending) return; setPending(true); const r = await demoMutation(); setPending(false); if (r.ok) setOffer(true); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
        <div className="filters" role="radiogroup" aria-label="Discovery" style={{ flex: 1, borderBottom: 0 }}>
          <button type="button" role="radio" aria-checked="false" style={{ fontSize: 16 }} onClick={onBack}>People</button>
          <button type="button" role="radio" aria-checked="true" style={{ fontSize: 16 }}>Cars</button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "640px minmax(0, 1fr)", gap: 24, marginTop: 12, alignItems: "start" }}>
        <div>
          <div className="media" style={{ width: 640, height: 427 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={car.id} src={car.photo} alt={`${car.owner}'s ${car.label}`} width={640} height={427} />
          </div>
          <ul style={{ display: "flex", gap: 12, listStyle: "none", padding: 0, margin: "12px 0 0" }}>
            {cars.map((c) => (
              <li key={c.id}>
                <button type="button" aria-pressed={c.id === selected} onClick={() => { setSelected(c.id); setOffer(false); }} className="media" style={{ width: 96, height: 64, outline: c.id === selected ? "3px solid var(--tm-accent)" : "none", outlineOffset: 2 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.photo} alt={c.label} width={96} height={64} />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{ marginTop: "var(--tm-shift-desktop)" }}>
          <p className="t-task" style={{ margin: 0 }}>{car.label}</p>
          <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.city} · {car.zone} · Owned by {car.owner}</p>
          <p className="t-body" style={{ margin: "8px 0 0", fontVariantNumeric: "tabular-nums" }}>Asking price · {usd(car.askingCents)} per month</p>
          <div style={{ marginTop: 16 }}><PlacementDiagram width={208} zone={car.zone} /><p className="t-meta" style={{ margin: "4px 0 0" }}>Placement concept: {car.zone.toLowerCase()}. Not installed.</p></div>
          <p className="t-meta" style={{ margin: "12px 0 0" }}>Smart Vehicle · Photos only · No 3D model available</p>
          <button type="button" className="btn btn-secondary" style={{ marginTop: 16 }} disabled={pending} onClick={sendOffer}>Send offer <ArrowRight size={18} aria-hidden /></button>
          <p className="t-meta" style={{ margin: "8px 0 0" }}>{offer ? <><span className="status waiting">Offer drafted</span> · Not sent · Amount is set in the offer step</> : "Opens the offer step with the named zone. Nothing is sent here."}</p>
        </div>
      </div>
      <p className="t-meta" style={{ margin: "12px 0 0" }}><Link href="/design-lab/business-home" style={{ color: "var(--tm-accent)" }}>Open the full marketplace</Link></p>
    </div>
  );
}
