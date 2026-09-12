import Link from "next/link";
import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import { Rail } from "../parts";
import { ShelfButton } from "./ShelfButton";
import { PersonSpread, spreads } from "./PeopleRibbon";
import { loopday, people, cars, attention, usd } from "../mock";

/**
 * Prototype 03: Business Home on desktop, refined from a directory into
 * marketing opportunities. An open, source-ratio people ribbon (portrait
 * beside actual work, one fit line, View person and a named Request)
 * followed immediately by physical monthly advertising inventory with
 * asking prices in the first viewport. Same six people, four vehicles,
 * discovery views and flows. Fixture data only.
 */
export function BusinessHomeScreen({ embed = false }: { embed?: boolean } = {}) {
  return (
    <div className="desk" data-shelf-root>
      <Rail mode="Business" active="Home" business={{ name: loopday.name, logo: loopday.logo, initials: loopday.initials }} />
      <main className="desk-main" id={embed ? undefined : "main"} style={{ paddingTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 48 }}>
          <h1 className="t-page" style={{ margin: 0 }}>Find people and cars</h1>
          <button type="button" className="btn btn-secondary"><MapPin size={18} aria-hidden />{loopday.city}</button>
        </div>

        <div style={{ display: "flex", gap: 32, alignItems: "center", minHeight: 44, marginTop: 8 }} aria-label="Needs your decision">
          {attention.map((a) => (
            <Link key={a.id} href={a.href} className="btn btn-quiet" style={{ paddingLeft: 0 }}>{a.text} <ArrowRight size={18} aria-hidden /></Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
          <div className="filters" role="group" aria-label="Discovery" style={{ flex: 1, borderBottom: 0 }}>
            {["For you", "People", "Cars", "Nearby"].map((v, i) => <button key={v} type="button" aria-pressed={i === 0} style={{ fontSize: 16 }}>{v}</button>)}
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="#people" className="btn btn-quiet link-ink" style={{ minHeight: 44 }}>See all people</Link>
            <ShelfButton dir={-1} target="people-ribbon" step={384} label="people" />
            <ShelfButton dir={1} target="people-ribbon" step={384} label="people" />
          </span>
        </div>
        <hr className="divider" style={{ margin: 0 }} />

        <section aria-labelledby="people-title" style={{ marginTop: 12 }}>
          <h2 id="people-title" className="sr">People</h2>
          <div data-shelf="people-ribbon" style={{ display: "flex", gap: 24, overflowX: "auto", scrollSnapType: "x proximity", scrollbarWidth: "none" }}>
            {spreads(people).map((s) => <PersonSpread key={s.person.id} s={s} />)}
          </div>
        </section>

        <section aria-labelledby="cars-title" style={{ marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
            <h2 id="cars-title" className="t-section" style={{ margin: 0 }}>Available cars</h2>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="#cars" className="btn btn-quiet link-ink">See all cars</Link>
              <ShelfButton dir={-1} />
              <ShelfButton dir={1} />
            </span>
          </div>
          <ul data-shelf="car-shelf" style={{ display: "flex", gap: 24, overflowX: "auto", listStyle: "none", padding: "0 0 8px", margin: "12px 0 0", scrollSnapType: "x proximity", scrollbarWidth: "none" }}>
            {cars.map((c) => (
              <li key={c.id} style={{ flex: "0 0 336px", scrollSnapAlign: "start" }}>
                <Link href={`#${c.id}`} style={{ display: "block" }}>
                  <span className="media" style={{ display: "block", width: 336, height: 224 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.photo} alt={`${c.owner}'s ${c.label}`} width={336} height={224} />
                  </span>
                  <span style={{ display: "block", marginLeft: 12 }}>
                    <span className="t-task" style={{ display: "block", marginTop: 8 }}>{c.label}</span>
                    <span className="t-meta" style={{ display: "block" }}>{c.city} · {c.zone}</span>
                    <span className="t-body" style={{ display: "block", fontVariantNumeric: "tabular-nums" }}>Asking price · {usd(c.askingCents)} per month</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <p className="t-meta" style={{ marginTop: 16 }}>Demo marketplace · fictional people and vehicles</p>
      </main>
    </div>
  );
}
