import Link from "next/link";
import { ArrowRight, CaretDown, MagnifyingGlass, ChatCircle, Bell } from "@phosphor-icons/react/dist/ssr";
import { InspectButton } from "../SourceInspector";
import { PhoneHeader, TabBar, USER_TABS } from "../parts";
import { maya, opportunities } from "../mock";
import { SaveToggle } from "../SaveToggle";
import { RecreateCommitment, StoryCommitment, CarCommitment } from "../work";

/**
 * Prototype 01: User Home on a phone, refined to the source-to-commitment
 * joint. Three earning kinds share one 12px handoff and never a card
 * template: the still reference steps down into a graphite task block and
 * a cobalt conditional-pay ledge; the supplied Story stands as an intact
 * sheet beside ink terms; the campaign scene ends in an inset white monthly
 * caption. Fixture data only; nothing here is the product.
 */
export function UserHomeScreen({ embed = false }: { embed?: boolean } = {}) {
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
      <main className="phone-main" id={embed ? undefined : "main"}>
        <h1 className="t-page" style={{ margin: "12px 0 0" }}>Find paid work</h1>

        <Link href="#submission" className="row-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44, marginTop: 12, padding: "0 4px 0 0" }}>
          <span className="t-label"><span className="status waiting">{maya.resume.title}</span></span>
          <ArrowRight size={20} aria-hidden style={{ color: "var(--tm-accent)", flexShrink: 0 }} />
        </Link>

        <div className="filters" role="radiogroup" aria-label="Ordering" style={{ marginTop: 8 }}>
          <button type="button" role="radio" aria-checked="true">For you</button>
          <button type="button" role="radio" aria-checked="false">Nearby</button>
          <button type="button" role="radio" aria-checked="false">Top pay</button>
          <button type="button" className="kind" aria-haspopup="dialog">Kind <CaretDown size={14} aria-hidden /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24, marginTop: 16 }}>
          {/* Recreate: the reference on one plane; the commitment begins 12px lower and ends 12px below it. */}
          <article aria-labelledby="op-recreate" id="recreate">
            <div className="op-recreate" style={{ display: "grid", alignItems: "start" }}>
              <div className="media" style={{ position: "relative", width: 160, height: 284, background: "var(--tm-stage)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={recreate.reference} alt="Reference still: a barista pouring a latte at the Loopday Coffee counter" width={160} height={284} style={{ objectFit: "contain" }} />
                <span className="t-meta" style={{ position: "absolute", top: 8, left: 8, color: "var(--tm-on-dark)", background: "#101820", padding: "0 6px", borderRadius: 4 }}>{recreate.referenceLabel}</span>
                <InspectButton src={recreate.reference} alt="Reference still: the latte pour at the Loopday Coffee counter, original ratio" label="Inspect reference" className="btn inspect-ref" style={{ position: "absolute", left: 4, right: 4, bottom: 4, minHeight: 44, background: "#101820", color: "#F6F8FB", borderRadius: 8, fontSize: 14, padding: "0 8px", justifyContent: "flex-start" }} />
              </div>
              <div style={{ marginTop: "var(--tm-shift-phone)" }}>
                <h2 id="op-recreate" className="sr">{recreate.title}</h2>
                <RecreateCommitment width={198} height={284} ledge={112} />
              </div>
            </div>
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{recreate.spots} spots · Apply by {recreate.deadline}</p>
            <ActionRow href="#recreate-work" />
          </article>

          {/* Story: the supplied sheet is the source; the commitment starts 12px lower beside it. */}
          <article aria-labelledby="op-story" id="story">
            <div className="op-story" style={{ display: "grid", gap: 16, alignItems: "start" }}>
              <div style={{ marginTop: "var(--tm-shift-phone)" }}>
                <h2 id="op-story" className="sr">{story.title}</h2>
                <StoryCommitment width={198} />
              </div>
              <div className="media" style={{ width: 144, height: 256, borderRadius: 0, boxShadow: "var(--tm-shadow-source)", background: "var(--tm-underlay)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={story.creative} alt="The supplied Story creative for Loopday Coffee: Take a coffee break." width={144} height={256} />
              </div>
            </div>
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{story.creativeLabel}</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{story.spots} spots · Apply by {story.deadline}</p>
            <ActionRow href="#story-work" />
          </article>

          {/* Car: the physical scene spans the field; the monthly caption is inset 12px. */}
          <article aria-labelledby="op-car" id="car">
            <div className="media" style={{ width: "100%", aspectRatio: "358 / 239" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={car.visual} alt="Campaign visual: a bike shop's delivery car parked outside the shop" />
            </div>
            <h2 id="op-car" className="sr">{car.title}</h2>
            <CarCommitment width={358} inset={12} />
            <p className="t-meta" style={{ margin: "12px 0 0" }}>{car.visualLabel}</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.zones} · {car.durationDays} days</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>Vehicle required</p>
            <p className="t-meta" style={{ margin: "4px 0 0" }}>{car.spots} spots · Apply by {car.deadline}</p>
            <ActionRow href="#car-work" />
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
      <Link href={href} className="btn btn-quiet" style={{ paddingLeft: 0 }}>View work <ArrowRight size={18} aria-hidden /></Link>
      <SaveToggle />
    </div>
  );
}
