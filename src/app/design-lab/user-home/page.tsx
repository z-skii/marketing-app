import Link from "next/link";
import { BookmarkSimple, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { PhoneHeader, TabBar, USER_TABS, Money } from "../parts";
import { mock, ASSET } from "../mock";
import { RecreatePreview } from "./RecreatePreview";

/**
 * Prototype 01: User Home on a phone. Three earning objects that are not
 * the same component: the Recreate spread (portrait reference joined to a
 * graphite information region with an opaque cobalt payment ledge), the
 * Story poster and commitment (intact creative beside its terms, money on
 * a cobalt structural rule), and the Car landscape (3:2 stage with an
 * attached white caption band). Mock data; nothing here is the product.
 */
export default function UserHomeLab() {
  const { recreate, story, car } = mock.opportunities;
  return (
    <div className="phone">
      <PhoneHeader name={mock.person.name} avatar={ASSET("portrait-maya")} mode="Personal" />
      <main className="phone-main" id="main">
        <h1 className="t-page" style={{ margin: "12px 0" }}>Find paid work</h1>

        {/* Resume line: one real unanswered item, when present. */}
        <Link href="#activity" className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44, padding: "8px 0", borderTop: "1px solid var(--tm-divider)", borderBottom: "1px solid var(--tm-divider)" }}>
          <span className="t-label"><span className="status waiting">Waiting on you</span> · PureBloom asked you to post a Story</span>
          <span className="t-label" style={{ color: "var(--tm-accent)", whiteSpace: "nowrap", marginLeft: 12 }}>Answer</span>
        </Link>

        <div className="filters" style={{ marginTop: 8 }} role="group" aria-label="Ordering">
          <button type="button" aria-pressed="true">For you</button>
          <button type="button" aria-pressed="false">Nearby</button>
          <button type="button" aria-pressed="false">Top pay</button>
          <button type="button" className="kind" aria-haspopup="listbox">All kinds <CaretDown size={14} aria-hidden /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          {/* Recreate: the frame holds the work, the edge holds the decision. */}
          <article className="reveal" aria-labelledby="op-recreate">
            <div style={{ display: "grid", gridTemplateColumns: "160px minmax(0, 1fr)", background: "var(--tm-graphite)", borderRadius: "var(--tm-radius-media)", overflow: "hidden" }} className="on-dark">
              <RecreatePreview poster={ASSET("reel-cafe-poster")} src={null} />
              <div style={{ display: "flex", flexDirection: "column", minHeight: 284 }}>
                <div style={{ padding: "12px 12px 8px", flex: 1 }}>
                  <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: 0 }}>Recreate this Reel</p>
                  <h2 id="op-recreate" className="t-task" style={{ color: "var(--tm-on-dark)", margin: "4px 0 0" }}>{recreate.title}</h2>
                  <p className="t-meta" style={{ color: "var(--tm-muted-dark)", margin: "6px 0 0" }}>{recreate.business} · {recreate.city}</p>
                </div>
                <div style={{ background: "var(--tm-accent)", padding: 12, minHeight: 96, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <Money cents={recreate.pay * 100} per="on approval" dark />
                </div>
              </div>
            </div>
            <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 12 }}>
              <span className="t-meta">{recreate.spots} spots · by {recreate.deadline}</span>
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button type="button" className="icon-btn" aria-label="Save"><BookmarkSimple size={20} /></button>
                <Link href="#recreate" className="btn btn-primary btn-sm">View work</Link>
              </span>
            </footer>
          </article>

          {/* Story: the creative is the object; the commitment sits beside it, money on a cobalt rule. */}
          <article className="reveal" aria-labelledby="op-story" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 144px", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", minHeight: 256 }}>
              <p className="t-meta" style={{ margin: 0 }}>Post this Story</p>
              <h2 id="op-story" className="t-task" style={{ margin: "4px 0 0" }}>{story.business}</h2>
              <p className="t-meta" style={{ margin: "6px 0 0" }}>{story.city} · live {story.hours} hours</p>
              <div style={{ marginTop: "auto", paddingLeft: 12, borderLeft: "3px solid var(--tm-accent)" }}>
                <Money cents={story.pay * 100} per="on verified post" />
              </div>
              <p className="t-meta" style={{ margin: "12px 0 0" }}>Needs {story.minFollowers.toLocaleString()} followers · <span className="status confirmed">You qualify</span></p>
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 12 }}>
                <Link href="#story" className="btn btn-primary btn-sm">View work</Link>
                <button type="button" className="icon-btn" aria-label="Save"><BookmarkSimple size={20} /></button>
              </div>
            </div>
            <div className="media" style={{ width: 144, height: 256, alignSelf: "start", boxShadow: "var(--tm-shadow-source)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET("story-purebloom")} alt="The supplied Story creative for PureBloom Skincare" width={144} height={256} />
            </div>
          </article>

          {/* Car: a landscape stage with an attached white caption band. */}
          <article className="reveal" aria-labelledby="op-car">
            <div className="media" style={{ aspectRatio: "3 / 2", borderRadius: "6px 6px 0 0" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET("car-campaign-plumbing")} alt="The campaign visual: a wrapped sedan for Blue Ridge Plumbing" />
            </div>
            <div style={{ background: "var(--tm-surface)", minHeight: 80, padding: 12, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "end", borderRadius: "0 0 6px 6px" }}>
              <div>
                <p className="t-meta" style={{ margin: 0 }}>Drive with this campaign</p>
                <h2 id="op-car" className="t-task" style={{ margin: "4px 0 0" }}>{car.business}</h2>
                <p className="t-meta" style={{ margin: "6px 0 0" }}>{car.zones.join(", ")} · {car.durationDays} days · {car.city}</p>
              </div>
              <Money cents={car.payPerMonth * 100} per="per month, on proof" />
            </div>
            <footer style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, paddingTop: 12 }}>
              <span className="t-meta">Your {mock.person.vehicle.label} fits</span>
              <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button type="button" className="icon-btn" aria-label="Save"><BookmarkSimple size={20} /></button>
                <Link href="#car" className="btn btn-primary btn-sm">View work</Link>
              </span>
            </footer>
          </article>

          <Link href="#more" className="btn btn-secondary" style={{ alignSelf: "stretch" }}>More work near {mock.person.city.split(",")[0]}</Link>
        </div>
      </main>
      <TabBar tabs={USER_TABS} active="Home" label="Main" />
    </div>
  );
}
