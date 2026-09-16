import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { deadlineLabel, isVideoUrl, vehicleQualifies, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Money } from "./parts";
import { SaveToggle } from "./SaveToggle";
import { InspectButton } from "./SourceInspector";

/**
 * The three earning kinds on User Home, built to the approved Frame Shift
 * Lab: three compositions sharing one 12px source-to-commitment joint and
 * never a card template. Everything shown is the real campaign record.
 *
 *   Recreate  the reference (still or video) on one plane; a graphite task
 *             block starts 12px lower and ends in the cobalt conditional
 *             pay ledge 12px below the reference
 *   Story     the supplied creative as an intact sheet on the right; the
 *             commitment on the canvas to its left, starting 12px lower
 *   Car       the campaign scene across the field; a white monthly caption
 *             inset 12px
 */
export function EarnObject(props: { card: Opportunity; vehicles: VehicleSummary[]; priority?: boolean }) {
  switch (props.card.kind) {
    case "recreate_reel": return <RecreateObject {...props} />;
    case "instagram_story": return <StoryObject {...props} />;
    case "car_ads": return <CarObject {...props} />;
  }
}

function spots(card: Opportunity): string {
  const left = Math.max(card.slots - card.approved_count, 0);
  return left > 0 ? `${left} spot${left === 1 ? "" : "s"}` : "Spots filled";
}

function Conditions({ card }: { card: Opportunity }) {
  const parts = [spots(card), deadlineLabel(card.deadline) ? `Apply by ${new Date(card.deadline as string).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : null].filter(Boolean);
  return <p className="fs-t-meta" style={{ marginTop: 12 }}>{parts.join(" · ")}</p>;
}

function Actions({ card, label }: { card: Opportunity; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
      <Link href={`/o/${card.id}`} className="fs-btn fs-btn-quiet" style={{ paddingLeft: 0 }}>{label} <ArrowRight size={18} aria-hidden /></Link>
      <SaveToggle itemType="campaign" itemId={card.id} initialSaved={card.saved} />
    </div>
  );
}

function NoMedia({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", padding: 12, color: "var(--fs-muted-dark)", fontSize: 14, lineHeight: "20px", textAlign: "center" }}>{children}</div>;
}

// ----------------------------------------------------------------- Recreate

function RecreateObject({ card, priority }: { card: Opportunity; priority?: boolean }) {
  const media = card.details.reference_media_url ?? card.reference_url ?? null;
  const video = isVideoUrl(media);
  return (
    <article aria-labelledby={`op-${card.id}`} className="fs-reveal">
      <div className="fs-op-recreate">
        <div className="fs-media fs-contain" style={{ width: 160, height: 284 }}>
          {media ? (
            <MediaPreview src={media} poster={card.business_cover} alt="" className="fs-ref-media" priority={priority} sizes="160px" />
          ) : <NoMedia>Reference not available</NoMedia>}
          <span className="fs-media-caption">{video ? "Reference · Reel" : "Reference · still"}</span>
          {media && (
            <InspectButton src={media} alt={`Reference for ${card.title}, at its original ratio`} label="Inspect reference" className="fs-btn" style={{ position: "absolute", left: 4, right: 4, bottom: 4, minHeight: 44, background: "#101820", color: "#F6F8FB", borderRadius: 8, fontSize: 14, padding: "0 8px", justifyContent: "flex-start" }} />
          )}
        </div>
        <div className="fs-joint fs-recreate-commitment">
          <div className="fs-on-dark" style={{ minHeight: 284, display: "flex", flexDirection: "column", color: "var(--fs-on-dark)" }}>
            <div style={{ padding: 12, flex: 1, background: "var(--fs-graphite)" }}>
              <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)" }}>Recreate Reel</p>
              <h2 id={`op-${card.id}`} className="fs-t-task" style={{ color: "var(--fs-on-dark)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{card.title}</h2>
              <p className="fs-t-meta" style={{ color: "var(--fs-muted-dark)", marginTop: 4 }}>{card.business_name}</p>
              <p className="fs-t-meta" style={{ color: "var(--fs-on-dark)", marginTop: 8 }}>Film your version.</p>
            </div>
            <div style={{ background: "var(--fs-accent)", padding: 12, minHeight: 112, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <Money cents={card.pay_cents} per="per approved version" dark />
            </div>
          </div>
        </div>
      </div>
      <Conditions card={card} />
      <Actions card={card} label="View work" />
    </article>
  );
}

// -------------------------------------------------------------------- Story

function StoryObject({ card, priority }: { card: Opportunity; priority?: boolean }) {
  const creative = card.details.creative_url ?? null;
  const liveHours = card.details.live_hours ?? 24;
  const minFollowers = card.details.min_followers ?? null;
  return (
    <article aria-labelledby={`op-${card.id}`} className="fs-reveal">
      <div className="fs-op-story">
        <div className="fs-joint fs-story-commitment" style={{ display: "flex", flexDirection: "column" }}>
          <p className="fs-t-meta">Instagram Story ad</p>
          <div style={{ marginTop: 8, borderLeft: "3px solid var(--fs-accent)", paddingLeft: 12, minHeight: 64, display: "flex", alignItems: "center" }}>
            <Money cents={card.pay_cents} per={`after ${liveHours}h live and approval`} />
          </div>
          <h2 id={`op-${card.id}`} className="fs-t-task" style={{ marginTop: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{card.title}</h2>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{card.business_name}</p>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{minFollowers ? `${minFollowers.toLocaleString()}+ followers · ` : ""}{liveHours}h live</p>
        </div>
        <div className="fs-media fs-sheet-source fs-story-sheet" style={{ width: 144, height: 256 }}>
          {creative ? (
            <MediaPreview src={creative} alt={`The supplied Story creative for ${card.business_name}`} className="fs-story-media" priority={priority} sizes="144px" />
          ) : <NoMedia>Creative not uploaded yet</NoMedia>}
        </div>
      </div>
      <p className="fs-t-meta" style={{ marginTop: 12 }}>Supplied creative{creative ? "" : " · not uploaded yet"}</p>
      <Conditions card={card} />
      <Actions card={card} label="View work" />
    </article>
  );
}

// ---------------------------------------------------------------------- Car

function CarObject({ card, vehicles, priority }: { card: Opportunity; vehicles: VehicleSummary[]; priority?: boolean }) {
  const photo = card.details.media_url ?? card.business_cover ?? null;
  const duration = card.details.duration_days ?? 30;
  const placements = (card.details.placements ?? []).map(placementLabel);
  const match = vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((m) => m.q.ok);
  return (
    <article aria-labelledby={`op-${card.id}`} className="fs-reveal">
      <div className="fs-media" style={{ width: "100%", aspectRatio: "358 / 239" }}>
        {photo ? (
          <MediaPreview src={photo} alt={`Campaign visual for ${card.title}`} className="fs-car-media" priority={priority} sizes="(min-width: 1024px) 358px, 100vw" />
        ) : <NoMedia>Campaign visual not uploaded yet</NoMedia>}
      </div>
      <div className="fs-car-caption">
        <Money cents={card.pay_cents} per="per month" />
        <div>
          <h2 id={`op-${card.id}`} className="fs-t-task fs-car-title">{card.title}</h2>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{card.business_name}</p>
        </div>
      </div>
      <p className="fs-t-meta" style={{ marginTop: 12 }}>Campaign visual{card.details.artwork_url ? " · Artwork supplied" : ""}</p>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>{[placements.length ? placements.join(", ") : null, `${duration} days`].filter(Boolean).join(" · ")}</p>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>
        {vehicles.length === 0 ? <>Vehicle required · <Link href="/me/vehicles/new" className="fs-link-ink fs-link-ul">Add your car</Link></>
          : match ? <span className="fs-status is-confirmed">Your {match.v.year} {match.v.make} {match.v.model} qualifies</span>
          : <span className="fs-status is-waiting">Check vehicle fit</span>}
      </p>
      <Conditions card={card} />
      <Actions card={card} label="View work" />
    </article>
  );
}
