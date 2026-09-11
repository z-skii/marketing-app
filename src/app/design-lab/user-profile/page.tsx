import Link from "next/link";
import { ArrowRight, MagnifyingGlass, ChatCircle, Bell, CaretRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { TabBar, USER_TABS, Avatar } from "../parts";
import { maya, usd } from "../mock";

/**
 * Prototype 02: User Profile on a phone. A full-width graphite working
 * identity masthead, an unboxed record strip on the light canvas,
 * Instagram and verification as literal states, one modest photo-led
 * vehicle slot, real recent work, the private money route to Earnings,
 * then the secondary destinations. Fixture data only.
 */
export default function UserProfileLab() {
  return (
    <div className="phone">
      {/* Masthead: the root header and identity share one graphite plane. */}
      <div className="on-dark" style={{ background: "var(--tm-graphite)", color: "var(--tm-on-dark)", margin: "0 -0px" }}>
        <header className="phone-header" style={{ minHeight: 64 }}>
          <button type="button" aria-label={`Acting as ${maya.first}, Personal, demo. Switch.`} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}>
            <Avatar src={maya.portrait} name={maya.name} size={28} />
            <span style={{ textAlign: "left" }}>
              <span className="t-meta" style={{ display: "block", lineHeight: "16px", color: "var(--tm-muted-dark)" }}>Personal · Demo</span>
              <span style={{ display: "block", fontWeight: 600, fontSize: 16, lineHeight: "20px" }}>{maya.first}</span>
            </span>
            <CaretDown size={16} aria-hidden style={{ color: "var(--tm-muted-dark)" }} />
          </button>
          <span style={{ display: "flex", gap: 4 }}>
            <button type="button" className="icon-btn" aria-label="Search"><MagnifyingGlass size={20} /></button>
            <button type="button" className="icon-btn" aria-label="Messages"><ChatCircle size={20} /></button>
            <button type="button" className="icon-btn" aria-label="Notifications"><Bell size={20} /></button>
          </span>
        </header>
        <div style={{ padding: "12px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 36 }}>
            <h1 className="t-page" style={{ margin: 0 }}>Profile</h1>
            <Link href="#edit" className="btn btn-quiet" style={{ color: "var(--tm-focus-dark)", minHeight: 44, margin: "-4px 0" }}>Edit profile</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "96px minmax(0, 1fr)", gap: 16, alignItems: "center", marginTop: 24 }}>
            <Avatar src={maya.portrait} name={maya.name} size={96} />
            <div>
              <p className="t-identity" style={{ margin: 0 }}>{maya.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 16, lineHeight: "24px", color: "var(--tm-muted-dark)" }}>@{maya.handle}</p>
              <p className="t-meta" style={{ margin: "2px 0 0", color: "var(--tm-muted-dark)" }}>{maya.city}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="phone-main" id="main">
        {/* Record strip: three unboxed facts on the canvas. */}
        <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(96px, 1fr))", gap: 12, margin: "24px 0 0", minHeight: 56 }}>
          <Fact value={usd(maya.stats.lifetimeEarnedCents)} label="Earned" />
          <Fact value={String(maya.stats.completed)} label="Completed" />
          <Fact value={maya.stats.rating.toFixed(1)} label={`Rating · ${maya.stats.reviews} reviews`} />
        </dl>

        {/* Capability: literal states, no coloured icon containers. */}
        <section aria-label="Instagram and verification" style={{ marginTop: 16 }}>
          <Link href="#instagram" className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64, gap: 12 }}>
            <span>
              <span className="t-body" style={{ display: "block", fontWeight: 500 }}>Instagram</span>
              <span className="t-meta" style={{ display: "block" }}>@{maya.instagram.handle} · Manual · {maya.instagram.followers.toLocaleString()} followers</span>
            </span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--tm-muted)" }} />
          </Link>
          <hr className="divider" />
          <Link href="#verification" className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 48, gap: 12 }}>
            <span className="t-body">Creator verification <span className="status neutral" style={{ fontWeight: 500 }}>· Not verified</span></span>
            <CaretRight size={20} aria-hidden style={{ color: "var(--tm-muted)" }} />
          </Link>
        </section>

        {/* Vehicle: one modest, photo-led slot. */}
        <section aria-labelledby="vehicles-title" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 44 }}>
            <h2 id="vehicles-title" className="t-section" style={{ margin: 0 }}>Vehicles</h2>
            <Link href="#add-vehicle" className="btn btn-quiet">Add vehicle</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "176px minmax(0, 1fr)", gap: 16, marginTop: 8, alignItems: "start" }}>
            <div className="media contain" style={{ width: 168, height: 112, background: "var(--tm-underlay)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={maya.vehicle.photo} alt="Maya's blue 2020 Toyota Corolla hatchback, photographed on her street" width={168} height={112} />
            </div>
            <div>
              <p className="t-task" style={{ margin: 0 }}>{maya.vehicle.label}</p>
              <p className="t-meta" style={{ margin: "4px 0 0" }}>{maya.vehicle.year} · {maya.vehicle.body}</p>
              <p className="t-meta" style={{ margin: "2px 0 0" }}>{maya.vehicle.color} · {maya.vehicle.city}</p>
              <Link href="#vehicle" className="btn btn-quiet" style={{ paddingLeft: 0, marginTop: 4, minHeight: 44 }}>View vehicle <ArrowRight size={18} aria-hidden /></Link>
              <p className="t-meta" style={{ margin: 0 }}>Photos available</p>
            </div>
          </div>
        </section>

        {/* Recent work: real fixture media with source and state. */}
        <section aria-labelledby="work-title" style={{ marginTop: 32 }}>
          <h2 id="work-title" className="t-section" style={{ margin: 0 }}>Recent work</h2>
          <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, 104px)", gap: 12, listStyle: "none", padding: 0, margin: "12px 0 0" }}>
            {maya.recentWork.map((w) => (
              <li key={w.id}>
                <Link href={`#${w.id}`} style={{ display: "block" }}>
                  <span className="media contain" style={{ display: "block", width: 104, height: 139, background: "var(--tm-underlay)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={w.src} alt={`${w.title}: ${w.kind}, ${w.state}`} width={104} height={139} />
                  </span>
                  <span className="t-meta" style={{ display: "block", marginTop: 8, color: "var(--tm-ink)" }}>{w.kind}</span>
                  <span className={`status ${w.state === "Approved" ? "confirmed" : "waiting"}`} style={{ display: "block" }}>{w.state}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="#activity" className="btn btn-quiet" style={{ paddingLeft: 0, marginTop: 8 }}>View Activity <ArrowRight size={18} aria-hidden /></Link>
        </section>

        {/* Private earnings: ordinary ink, a route to Earnings, no duplicated payout form. */}
        <section aria-labelledby="earn-title" style={{ marginTop: 24 }}>
          <h2 id="earn-title" className="t-section" style={{ margin: 0 }}>Earnings</h2>
          <p className="t-task" style={{ margin: "12px 0 0" }}>Available {usd(maya.money.availableCents)}</p>
          <p className="t-meta" style={{ margin: "2px 0 0" }}>From approved work · Demo money</p>
          <p className="t-body" style={{ margin: "8px 0 0" }}>Payout requested · {usd(maya.money.payoutRequestedCents)}</p>
          <p className="t-meta" style={{ margin: 0 }}>{maya.money.payoutRequestedAt}</p>
          <Link href="#earnings" className="btn btn-secondary" style={{ marginTop: 16, width: "100%" }}>Open Earnings</Link>
        </section>

        <section aria-label="More" style={{ marginTop: 32 }}>
          {[["Portfolio", "#portfolio"], ["Public profile and reviews", "#public"], ["Settings", "#settings"]].map(([label, href], i) => (
            <div key={label}>
              {i > 0 && <hr className="divider" />}
              <Link href={href} className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minHeight: 64 }}>
                <span className="t-body">{label}</span>
                <CaretRight size={20} aria-hidden style={{ color: "var(--tm-muted)" }} />
              </Link>
            </div>
          ))}
        </section>
      </main>
      <TabBar tabs={USER_TABS} active="Profile" label="Main" />
    </div>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dd className="money-record" style={{ margin: 0 }}>{value}</dd>
      <dt className="t-meta" style={{ marginTop: 2 }}>{label}</dt>
    </div>
  );
}
