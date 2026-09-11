import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { Rail } from "../parts";
import { ShelfButton } from "./ShelfButton";
import { loopday, people, cars, attention, usd } from "../mock";

/**
 * Prototype 03: Business Home on desktop. A people-first comparison
 * gallery (narrow portrait beside larger real work, open on the canvas,
 * no cards) followed by a landscape vehicle shelf with named asking
 * prices. The graphite rail is the anchor; the marketplace field is the
 * full 1176px. Fixture data only.
 */
export default function BusinessHomeLab() {
  return (
    <div className="desk">
      <Rail mode="Business" active="Home" business={{ name: loopday.name, logo: loopday.logo, initials: loopday.initials }} />
      <main className="desk-main" id="main" style={{ paddingTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 48 }}>
          <h1 className="t-page" style={{ margin: 0 }}>Find people and cars</h1>
          <button type="button" className="btn btn-secondary"><MapPin size={18} aria-hidden />{loopday.city}</button>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center", minHeight: 44, marginTop: 8 }} aria-label="Needs your decision">
          {attention.map((a) => (
            <Link key={a.id} href={a.href} className="btn btn-quiet" style={{ paddingLeft: 0 }}>{a.text} <ArrowRight size={18} aria-hidden /></Link>
          ))}
        </div>

        <div className="filters" role="group" aria-label="Discovery" style={{ marginTop: 8 }}>
          {["For you", "People", "Cars", "Nearby"].map((v, i) => <button key={v} type="button" aria-pressed={i === 0} style={{ fontSize: 16 }}>{v}</button>)}
        </div>

        <section aria-labelledby="people-title" style={{ marginTop: 16 }}>
          <h2 id="people-title" className="sr">People</h2>
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, 376px)", columnGap: 24, rowGap: 24, listStyle: "none", padding: 0, margin: 0 }}>
            {people.map((p) => (
              <li key={p.id}>
                <div style={{ display: "grid", gridTemplateColumns: "96px 268px", gap: 12, height: 168, alignItems: "center" }}>
                  <span className="media" style={{ width: 96, height: 144, background: "var(--tm-underlay)", display: "grid", placeItems: "center" }}>
                    {p.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.portrait} alt={`${p.name}`} width={96} height={144} />
                    ) : (
                      <span aria-hidden className="t-display" style={{ fontWeight: 700, fontSize: 28, color: "var(--tm-ink)" }}>{p.initials}</span>
                    )}
                  </span>
                  {p.sample ? (
                    <span className="media contain" style={{ width: 268, height: 168, background: "var(--tm-underlay)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.sample.src} alt={`Work sample by ${p.name}`} width={268} height={168} />
                    </span>
                  ) : (
                    <span className="t-meta" style={{ alignSelf: "center" }}>No work samples shared.</span>
                  )}
                </div>
                <div style={{ height: 48, marginTop: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, height: 24 }}>
                    <span className="t-task" style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
                    <Link href={`#${p.id}`} className="btn btn-quiet" style={{ whiteSpace: "nowrap", minHeight: 44, margin: "-10px -8px -10px 0" }}>View person <ArrowRight size={18} aria-hidden /></Link>
                  </div>
                  <span className="t-meta" style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.city}{p.completed != null ? ` · ${p.completed} completed` : ""}{p.rating ? ` · ${p.rating.value.toFixed(1)} (${p.rating.count} reviews)` : ""}</span>
                </div>
                {p.qualification && <p className="t-meta" style={{ margin: "4px 0 0", height: 20 }}>{p.qualification}</p>}
              </li>
            ))}
          </ul>
          <Link href="#people" className="btn btn-quiet" style={{ paddingLeft: 0, marginTop: 16 }}>See all people <ArrowRight size={18} aria-hidden /></Link>
        </section>

        <section aria-labelledby="cars-title" style={{ marginTop: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
            <h2 id="cars-title" className="t-section" style={{ margin: 0 }}>Available cars</h2>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="#cars" className="btn btn-quiet">See all cars</Link>
              <ShelfButton dir={-1} />
              <ShelfButton dir={1} />
            </span>
          </div>
          <ul id="car-shelf" style={{ display: "flex", gap: 24, overflowX: "auto", listStyle: "none", padding: "0 0 8px", margin: "12px 0 0", scrollSnapType: "x proximity", scrollBehavior: "smooth" }}>
            {cars.map((c) => (
              <li key={c.id} style={{ flex: "0 0 336px", scrollSnapAlign: "start" }}>
                <Link href={`#${c.id}`} style={{ display: "block" }}>
                  <span className="media" style={{ display: "block", width: 336, height: 224 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photo} alt={`${c.owner}'s ${c.label}`} width={336} height={224} />
                  </span>
                  <span className="t-task" style={{ display: "block", marginTop: 8 }}>{c.label}</span>
                  <span className="t-meta" style={{ display: "block" }}>{c.city} · {c.zone}</span>
                  <span className="t-body" style={{ display: "block", fontVariantNumeric: "tabular-nums" }}>Asking price · {c.zone} · {usd(c.askingCents)} per month</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="t-meta" style={{ marginTop: 24 }}>Demo marketplace · fictional people and vehicles</p>
      </main>
    </div>
  );
}
