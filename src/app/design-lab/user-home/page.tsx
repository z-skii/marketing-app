import Link from "next/link";
import { ArrowRight, ArrowsOutSimple, CaretDown, MagnifyingGlass, ChatCircle, Bell } from "@phosphor-icons/react/dist/ssr";
import { PhoneHeader, TabBar, USER_TABS, Money } from "../parts";
import { maya, opportunities } from "../mock";
import { SaveToggle } from "../SaveToggle";

/**
 * Prototype 01: User Home on a phone, to the Frame Shift spec. Three
 * earning objects that are not the same component: the Recreate spread
 * (contained reference still joined to a graphite commitment region with
 * an opaque cobalt payment ledge), the Story poster and commitment (money
 * on a 3px cobalt rule beside the intact supplied creative), and the Car
 * landscape (3:2 campaign visual with an attached white monthly-pay
 * caption). Everything is fixture data; nothing here is the product.
 */
export default function UserHomeLab() {
  const { recreate, story, car } = opportunities;
  return (
    <div className="phone">
      <PhoneHeader name={maya.first} avatar={maya.portrait} mode="Personal · Demo" right={
        <>
          <button type="button" className="icon-btn" aria-label="Search"><MagnifyingGlass size={20} /></button>
          <button type="button" className="icon-btn" aria-label="Messages"><ChatCircle size={20} /></button>
          <button type="button" className="icon-btn" aria-label="Notifications"><Bell size={20} /></button>
        </>
      } />
      <main className="phone-main" id="main">
        <h1 className="t-page" style={{ margin: "12px 0 0" }}>Find paid work</h1>

        <Link href="#submission" className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44, marginTop: 12, padding: "0 4px 0 0" }}>
          <span className="t-label"><span className="status waiting">{maya.resume.title}</span> <span className="t-meta">· {maya.resume.business}</span></span>
          <ArrowRight size={20} aria-hidden style={{ color: "var(--tm-accent)", flexShrink: 0 }} />
        </Link>

        <div className="filters" role="radiogroup" aria-label="Ordering" style={{ marginTop: 8 }}>
          <button type="button" role="radio" aria-checked="true" aria-pressed="true">For you</button>
          <button type="button" role="radio" aria-checked="false" aria-pressed="false">Nearby</button>
          <button type="button" role="radio" aria-checked="false" aria-pressed="false">Top pay</button>
          <button type="button" className="kind" aria-haspopup="dialog">Kind <CaretDown size={14} aria-hidden /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          {/* Recreate: the frame holds the work, the edge holds the decision. */}
          <article aria-labelledby="op-recreate">
            <div className="on-dark op-recreate" style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr)", background: "var(--tm-graphite)", borderRadius: "var(--tm-radius-media)", overflow: "hidden" }}>
              <div style={{ position: "relative", width: 160, height: 284, background: "var(--tm-stage)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={recreate.reference} alt="Reference still: a barista pouring a latte at the Loopday Coffee counter" width={160} height={284} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                <span className="t-meta" style={{ position: "absolute", top: 8, left: 8, color: "var(--tm-on-dark)", background: "rgba(16,24,32,0.78)", padding: "0 6px", borderRadius: 4 }}>{recreate.referenceLabel}</span>
                <button type="button" className="icon-btn" aria-label="Inspect reference" style={{ position: "absolute", right: 4, bottom: 4, background: "rgba(16,24,32,0.78)" }}><ArrowsOutSimple size={20} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", minHeight: 284 }}>
                <div style={{ padding: 12, flex: 1 }}>
                  <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: 0 }}>Recreate Reel</p>
                  <h2 id="op-recreate" className="t-task" style={{ color: "var(--tm-on-dark)", margin: "4px 0 0" }}>{recreate.title}</h2>
                  <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: "4px 0 0" }}>{recreate.business}</p>
                  <p className="t-meta" style={{ color: "var(--tm-on-dark)", margin: "8px 0 0" }}>{recreate.instruction}</p>
                </div>
                <div style={{ background: "var(--tm-accent)", padding: 12, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <Money cents={recreate.payCents} per={recreate.basis} dark />
                </div>
              </div>
            </div>
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{recreate.spots} spots · Apply by {recreate.deadline}</p>
            <ActionRow href="#recreate" />
          </article>

          {/* Story: the creative is the object; the commitment sits beside it, money on a cobalt rule. */}
          <article aria-labelledby="op-story">
            <div style={{ display: "grid", gridTemplateColumns: "198px 144px", gap: 16 }}>
              <div style={{ borderLeft: "3px solid var(--tm-accent)", paddingLeft: 12, minHeight: 256, display: "flex", flexDirection: "column" }}>
                <p className="t-meta" style={{ margin: 0 }}>Instagram Story ad</p>
                <div style={{ marginTop: 8 }}><Money cents={story.payCents} per={story.basis} /></div>
                <h2 id="op-story" className="t-task" style={{ margin: "12px 0 0" }}>{story.title}</h2>
                <p className="t-meta" style={{ margin: "4px 0 0" }}>{story.business}</p>
                <p className="t-meta" style={{ margin: "4px 0 0" }}>{story.minFollowers.toLocaleString()}+ followers</p>
              </div>
              <div className="media" style={{ width: 144, height: 256, boxShadow: "var(--tm-shadow-source)", background: "var(--tm-underlay)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.creative} alt="The supplied Story creative for Loopday Coffee: Take a coffee break." width={144} height={256} />
              </div>
            </div>
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{story.creativeLabel}</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{story.spots} spots · Apply by {story.deadline}</p>
            <ActionRow href="#story" />
          </article>

          {/* Car: a landscape stage with an attached white caption band. */}
          <article aria-labelledby="op-car">
            <div className="media" style={{ width: "100%", aspectRatio: "358 / 239", borderRadius: "6px 6px 0 0" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={car.visual} alt="Campaign visual: a bike shop's delivery car parked outside the shop" />
            </div>
            <div style={{ background: "var(--tm-surface)", minHeight: 96, padding: 12, display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
              <Money cents={car.payCents} per={car.basis} />
              <div>
                <h2 id="op-car" className="t-task" style={{ margin: 0 }}>{car.title}</h2>
                <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.business}</p>
              </div>
            </div>
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{car.visualLabel}</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.zones} · {car.durationDays} days</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>Vehicle required · <span className="status confirmed">Your {car.business === "Spurroom Bikes" ? maya.vehicle.label : ""} fits</span></p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.spots} spots · Apply by {car.deadline}</p>
            <ActionRow href="#car" />
          </article>
        </div>
      </main>
      <TabBar tabs={USER_TABS} active="Home" label="Main" />
    </div>
  );
}

function ActionRow({ href }: { href: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
      <Link href={href} className="btn btn-quiet" style={{ paddingLeft: 0, marginLeft: -4 }}>View work <ArrowRight size={18} aria-hidden /></Link>
      <SaveToggle />
    </div>
  );
}
