"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Img } from "../../../design-lab-v2/Img";
import { Money } from "../../../design-lab-v2/parts";
import { homeOpportunities, businessPeople } from "../../../design-lab-v2/fixtures";
import { M } from "../media";
import { useMotion } from "../motion";
import { Entry } from "./Shell";

/**
 * One brief, two viewpoints. The hero is a shared media stage: the matched
 * Loopday reference bound to the US$75 Recreate this Reel opportunity. A
 * two position audience control on the stage's foreground edge changes
 * the viewpoint: for the person it is incoming paid work (amount, basis,
 * business); for the business it becomes an outgoing Campaign reference
 * beside an unassigned candidate, Maya, with her own portrait and work.
 * ?audience=earn|business is native history; both stories stay in the
 * document below. Nothing implies Maya made the reference or accepted.
 */
export type Audience = "earn" | "business";
const ref = homeOpportunities[0];
const maya = businessPeople[0];

export function Hero({ initial }: { initial: Audience }) {
  const [aud, setAud] = useState<Audience>(initial);
  const { reduced } = useMotion();
  useEffect(() => {
    const onPop = () => setAud(new URLSearchParams(location.search).get("audience") === "business" ? "business" : "earn");
    window.addEventListener("popstate", onPop); return () => window.removeEventListener("popstate", onPop);
  }, []);
  const choose = (a: Audience) => {
    if (a === aud) return;
    const u = new URL(location.href); if (a === "earn") u.searchParams.delete("audience"); else u.searchParams.set("audience", a);
    history.pushState(null, "", u); setAud(a);
  };
  const business = aud === "business";
  return (
    <section className={`x-hero${business ? " x-hero-business x-dark" : ""}`} id="top" aria-label="TapMart" data-audience={aud} data-stage-dark={business ? "true" : undefined} data-reduced={reduced ? "true" : undefined}>
      <div className="x-inner x-hero-inner">
        <div className={`x-audience lens${business ? " lens-dark" : ""}`} role="tablist" aria-label="Audience">
          <button type="button" role="tab" aria-selected={!business} onClick={() => choose("earn")} className="x-audience-btn">Make money</button>
          <button type="button" role="tab" aria-selected={business} onClick={() => choose("business")} className="x-audience-btn">Grow your business</button>
        </div>
        <div className="x-hero-stage">
          {/* The shared reference: large in the earning lens, a labelled brief in the business lens. Same source, transform only. */}
          <div className="x-hero-ref" data-role={business ? "brief" : "opportunity"}>
            <Link href="/design-lab-v3/home?open=lab-recreate-loopday-pour" className="media x-hero-media" aria-label={business ? "Campaign reference, Loopday Coffee" : `Open preview: ${ref.title}, ${ref.business}`}>
              <img src={M.reference4x5(720)} srcSet={`${M.reference4x5(720)} 720w, ${M.reference4x5(1080)} 1080w`} sizes="(min-width: 1024px) 560px, 100vw" alt="" width={720} height={900} fetchPriority="high" decoding="async" />
            </Link>
            {business && <span className="x-hero-brieflabel x-reveal"><span className="t-fact">Campaign reference</span><span className="t-fact-ink">{ref.business}</span></span>}
          </div>
          {business ? (
            <div className="x-hero-candidate x-open" key="candidate">
              <Link href="/design-lab-v3/business?person=maya" className="media x-hero-portrait" aria-label="View person Maya Chen"><Img src={M.portraitMaya(480)} alt="" /></Link>
              <Link href="/design-lab-v3/business?person=maya&work=1" className="media x-hero-work" aria-label="Maya Chen, Counter pour still"><Img src={M.mayaPour(480)} alt="" /></Link>
            </div>
          ) : (
            <div className="x-hero-edge x-settle" key="edge">
              <span className="x-hero-edge-l"><span className="t-fact">Reference</span><span className="t-object">{ref.title}</span><span className="t-fact">{ref.business}</span></span>
              <span className="x-hero-edge-r"><Money cents={ref.netCents} basis="On approval" whole /></span>
              {/* the actions stay attached to the object they act on */}
              <span className="x-hero-actions x-hero-actions-earn">
                <a href="#recreate" className="btn btn-primary">Explore earning</a>
                <Link href="/design-lab-v3/home?open=lab-recreate-loopday-pour" className="link t-action">Open preview</Link>
              </span>
            </div>
          )}
        </div>
        {business && (
          <div className="x-hero-actions x-reveal" key="biz-actions">
            <span className="x-hero-who"><span className="t-fact">Find people</span><span className="t-object">{maya.name}</span></span>
            <span className="x-hero-actions-r">
              <Link href="/design-lab-v3/business?person=maya" className="link t-action">View person</Link>
              <Link href="/design-lab-v3/business?person=maya&request=1" className="btn btn-primary">Request</Link>
              <a href="#find-people" className="link t-action">Explore business</a>
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

export { Entry };
