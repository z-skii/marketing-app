"use client";

import { Reveal, Stagger, Item, CountUp, Float, Parallax } from "@/ds/motion";
import { StatusBadge } from "@/ds/ui";
import { M } from "@/v3/media";
import { Laptop } from "./Devices";
import { Megaphone, Sparkle, Car, CalendarDots, ChartLineUp, Palette, Images, Users, CheckCircleIcon } from "./icons";
import { photo } from "@/ds/photos";

/**
 * BUSINESS: "You bring the business. TapMart builds the system around it."
 * An animated dashboard composition (real interface primitives, not
 * screenshots) and the eight things the system runs.
 */
export function Business() {
  return (
    <section id="business" className="lp-section lp-business" aria-labelledby="business-h">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-chapter-head">
            <p className="eyebrow lp-kicker"><span className="lp-num">5</span>For businesses</p>
            <h2 id="business-h" className="t-h1">You bring the business. TapMart builds the system around it.</h2>
            <p className="t-lead">Monthly professional content, campaigns with local creators and drivers, approvals, a calendar, loyalty and your brand, in one place that tells you what needs your attention.</p>
          </div>
        </Reveal>
        <Reveal y={40} amount={0.15}>
          <div className="lp-dash">
            <Parallax range={[16, -16]}>
              <Laptop>
                <div className="lp-mini">
                  <div className="lp-mini-top">
                    <div><div style={{ fontWeight: 600, fontSize: 15 }}>Loopday Coffee</div><div className="t-meta">Tuesday · what needs your attention</div></div>
                    <span className="btn btn-signal btn-sm" style={{ pointerEvents: "none", fontSize: 12, minHeight: 34 }}>Create campaign</span>
                  </div>
                  <div className="lp-mini-grid">
                    <div className="lp-mini-card"><div className="lp-mini-v"><CountUp value={3} /></div><div className="lp-mini-l">Needs approval</div></div>
                    <div className="lp-mini-card"><div className="lp-mini-v"><CountUp value={12} /></div><div className="lp-mini-l">Content ready</div></div>
                    <div className="lp-mini-card"><div className="lp-mini-v"><CountUp value={2} /></div><div className="lp-mini-l">Cars on the road</div></div>
                  </div>
                  <div className="lp-mini-grid" style={{ marginTop: 10, gridTemplateColumns: "1.4fr 1fr" }}>
                    <div className="lp-mini-card">
                      <div className="t-meta" style={{ marginBottom: 6 }}>Campaigns</div>
                      {[[M.mayaLatte(480), "Recreate: counter pour", "open"], [M.story(480), "Iced latte Story", "review"], [M.driveWagon(480), "Rear door · 2 cars", "active"]].map(([src, t, s]) => (
                        <div key={t} className="lp-mini-row"><span className="lp-mini-thumb"><img src={src} alt="" loading="lazy" /></span><span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{t}</span><StatusBadge status={s} /></div>
                      ))}
                    </div>
                    <div className="lp-mini-card">
                      <div className="t-meta" style={{ marginBottom: 6 }}>This week</div>
                      <div className="lp-mini-cal">
                        {[M.contentCounter(), null, M.contentPour(), M.contentPastry(), null, M.contentCups(), M.contentWindow()].map((src, i) => <div key={i}>{src && <img src={src} alt="" loading="lazy" />}{src && <i />}</div>)}
                      </div>
                      <div className="t-meta" style={{ marginTop: 8 }}>Next shoot · Thu 10:00</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>{["#18231D", "#B73E28", "#F7F4EB", "#C4CDBF"].map((c) => <span key={c} style={{ width: 18, height: 18, borderRadius: 6, background: c, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />)}<span className="t-meta" style={{ marginLeft: 4 }}>Brand kit</span></div>
                    </div>
                  </div>
                </div>
              </Laptop>
            </Parallax>
            <Float className="lp-dash-float lp-dash-a" amplitude={8} duration={7}>
              <div className="card" style={{ padding: 10, display: "grid", gap: 8 }}>
                <div className="media-frame is-sm" style={{ aspectRatio: "4 / 5" }}><img src={M.mayaPour(480)} alt="" loading="lazy" /></div>
                <div style={{ padding: "0 4px 2px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Maya's version</span><span className="badge is-info" style={{ minHeight: 22 }}>Review</span></div>
              </div>
            </Float>
            <Float className="lp-dash-float lp-dash-b" amplitude={6} duration={6} delay={0.6}>
              <div className="glass-panel lp-glass"><span className="lp-obj-label" style={{ color: "var(--tm-success)" }}><CheckCircleIcon size={16} weight="fill" aria-hidden />Approved</span><div style={{ marginTop: 6, fontWeight: 600 }}>Counter pour · Maya Chen</div><div className="t-meta">US$75 released from campaign credit</div></div>
            </Float>
          </div>
        </Reveal>
        <Stagger className="lp-features" gap={0.06}>
          {[
            [Images, "Monthly content", "A shoot every month; photos and video delivered to approve.", photo("food-plate")],
            [Megaphone, "Campaigns", "Recreate, Story and Car, set up one decision at a time.", photo("cafe-window")],
            [Users, "Creator submissions", "Watch, approve or ask for one revision.", photo("woman-portrait-2")],
            [Car, "Car placements", "Drivers near you, the placement you choose.", photo("car-side")],
            [Sparkle, "Loyalty", "A Wallet stamp card for repeat customers. Coming soon.", photo("wallet-phone")],
            [CalendarDots, "Calendar", "What is scheduled and what is published, by platform.", photo("cafe-cozy")],
            [ChartLineUp, "Results", "Campaign results, content performance, cost per result.", photo("restaurant-warm")],
            [Palette, "Brand identity", "Logo, colours, voice and photography style with a live preview.", photo("storefront")],
          ].map(([Icon, t, b, p]) => {
            const I = Icon as typeof Images; const set = p as ReturnType<typeof photo>;
            return (
              <Item key={t as string}>
                <div className="lp-feature">
                  <div className="media-frame"><picture><source type="image/avif" srcSet={set.srcSet} sizes="(min-width: 768px) 25vw, 50vw" /><img src={set.fallback} alt="" loading="lazy" /></picture></div>
                  <span className="icon-square" style={{ width: 36, height: 36, borderRadius: 10 }}><I size={18} aria-hidden /></span>
                  <strong>{t as string}</strong>
                  <span className="t-meta">{b as string}</span>
                </div>
              </Item>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
