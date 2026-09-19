import Link from "next/link";
import { fmtDate, vehicleQualifies, type EarnKind, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { moneyWhole } from "@/v3/app/parts";
import { PlayIcon, InstagramIcon, CarIcon, VerifiedIcon, ArrowRightIcon } from "@/ds/icons";

/**
 * One opportunity as a marketplace object. The photograph is the card;
 * four answers are never buried: what do I do, how much do I make, how
 * long does it take, what does the business expect. Every value is the
 * real campaign record; Save is the real toggle; View opens /o/[id].
 */
export const KIND_LABEL: Record<EarnKind, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car" };
const KIND_ICON: Record<EarnKind, typeof PlayIcon> = { recreate_reel: PlayIcon, instagram_story: InstagramIcon, car_ads: CarIcon };

export function opportunityMedia(card: Opportunity): { src: string | null; poster: string | null; fallback: string } {
  if (card.kind === "recreate_reel") return { src: card.details.reference_media_url ?? card.reference_url ?? null, poster: card.business_cover, fallback: "Reference link only" };
  if (card.kind === "instagram_story") return { src: card.details.creative_url ?? null, poster: null, fallback: "No creative yet" };
  return { src: card.details.media_url ?? card.details.artwork_url ?? card.business_cover ?? null, poster: null, fallback: "No campaign visual" };
}

export function OpportunityCard({ card, vehicles, lead = false, priority = false }: { card: Opportunity; vehicles: VehicleSummary[]; lead?: boolean; priority?: boolean }) {
  const m = opportunityMedia(card);
  const Icon = KIND_ICON[card.kind];
  const placements = (card.details.placements ?? []).map(placementLabel);
  const basis = card.kind === "car_ads" ? "a month" : card.kind === "instagram_story" ? "per Story" : "per video";
  const what = card.kind === "recreate_reel" ? "Film your own version of the reference Reel" : card.kind === "instagram_story" ? "Post the supplied Story creative, as it is" : `Drive with the ad on ${placements.length ? placements.join(", ").toLowerCase() : "the agreed placement"}`;
  const howLong = card.kind === "instagram_story" ? `${card.details.live_hours ?? 24}h live, then approval` : card.kind === "car_ads" ? `${card.details.duration_days ?? 30} days, paid monthly` : card.deadline ? `Apply by ${fmtDate(card.deadline)}` : "On approval";
  const left = Math.max(card.slots - card.approved_count, 0);
  const spots = card.slots > 0 ? (left > 0 ? `${left} of ${card.slots} spots left` : "Spots filled") : null;
  const req = [
    ...(card.kind === "instagram_story" && card.details.min_followers ? [`${card.details.min_followers.toLocaleString()}+ followers`] : []),
    ...(card.kind === "car_ads" && placements.length ? placements : []),
    ...card.requirements,
  ].slice(0, 3);
  const match = card.kind === "car_ads" ? vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((x) => x.q.ok) : null;
  const status = card.kind === "car_ads" ? (vehicles.length === 0 ? { label: "Vehicle required", tone: "warning" } : match ? { label: "Your car qualifies", tone: "success" } : { label: "Check vehicle fit", tone: "warning" }) : null;

  return (
    <article className={`ap-card ${lead ? "is-lead" : ""} ${card.kind === "instagram_story" ? "is-story" : ""}`} aria-labelledby={`op-${card.id}-t`}>
      <div className="ap-card-media">
        {m.src ? <MediaPreview src={m.src} poster={m.poster ?? undefined} alt="" priority={priority} sizes={lead ? "(min-width: 1280px) 720px, 100vw" : "(min-width: 640px) 50vw, 100vw"} /> : <span className="ap-empty">{m.fallback}</span>}
        <span className="glass-tag ap-card-tag"><Icon size={13} weight={card.kind === "recreate_reel" ? "fill" : "regular"} aria-hidden />{KIND_LABEL[card.kind]}</span>
        <span className="ap-card-money"><b>{moneyWhole(card.pay_cents)}</b><span>{basis}</span></span>
        <span className="ap-card-save"><SaveToggle itemType="campaign" itemId={card.id} initialSaved={card.saved} compact /></span>
      </div>
      <div className="ap-card-body">
        <div className="ap-card-biz">
          {card.business_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={card.business_logo} alt="" className="ap-logo" loading="lazy" />
          ) : <span className="ap-logo-initial" aria-hidden>{card.business_name.trim()[0]?.toUpperCase()}</span>}
          <span className="truncate"><b>{card.business_name}</b>{card.city ? ` · ${card.city}` : ""}</span>
          {card.business_verified && <span className="ap-verified" title="Verified business"><VerifiedIcon size={14} weight="fill" aria-label="Verified business" /></span>}
        </div>
        <h2 id={`op-${card.id}-t`} className="ap-card-title"><Link href={`/o/${card.id}`}>{card.title}</Link></h2>
        <dl className="ap-card-facts">
          <div><dt>What you do</dt><dd>{what}</dd></div>
          <div><dt>How long</dt><dd>{howLong}</dd></div>
        </dl>
        {req.length > 0 && <div className="ap-card-req" aria-label="What the business expects">{req.map((r, i) => <span key={`${i}-${r}`}>{r}</span>)}</div>}
        <div className="ap-card-foot">
          <span className="truncate">{[spots, status ? null : (card.deadline && card.kind !== "recreate_reel" ? `Apply by ${fmtDate(card.deadline)}` : null)].filter(Boolean).join(" · ") || "Open"}{status && <> {spots ? "· " : ""}<span className={`badge is-${status.tone}`} style={{ minHeight: 22 }}>{status.label}</span></>}</span>
          <Link href={`/o/${card.id}`} className="btn btn-sm" aria-label={`View ${card.title}`}>View <ArrowRightIcon size={14} aria-hidden /></Link>
        </div>
      </div>
    </article>
  );
}
