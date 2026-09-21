import Link from "next/link";
import { fmtDate, vehicleQualifies, type EarnKind, type Opportunity, type VehicleSummary } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { SaveToggle } from "@/components/fs/SaveToggle";
import { moneyWhole } from "@/v3/app/parts";
import { PlayIcon, InstagramIcon, CarIcon, VerifiedIcon, ArrowRightIcon } from "@/ds/icons";

/**
 * One opportunity as a marketplace object: the photograph, the kind, the
 * pay, the title, one line of facts (how long, spots), at most two
 * requirement chips, a status chip and View. Every value is the real
 * campaign record; Save is the real toggle; View opens /o/[id].
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
  const howLong = card.kind === "instagram_story" ? `${card.details.live_hours ?? 24}h live` : card.kind === "car_ads" ? `${card.details.duration_days ?? 30} days` : card.deadline ? `By ${fmtDate(card.deadline)}` : "On approval";
  const left = Math.max(card.slots - card.approved_count, 0);
  const spots = card.slots > 0 ? (left > 0 ? `${left} spot${left === 1 ? "" : "s"} left` : null) : null;
  const full = card.slots > 0 && left === 0;
  const req = [
    ...(card.kind === "instagram_story" && card.details.min_followers ? [`${card.details.min_followers.toLocaleString()}+ followers`] : []),
    ...(card.kind === "car_ads" && placements.length ? placements : []),
    ...card.requirements,
  ].slice(0, 2);
  const match = card.kind === "car_ads" ? vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((x) => x.q.ok) : null;
  const status = full
    ? { label: "Full", tone: "neutral" }
    : card.kind === "car_ads"
      ? (vehicles.length === 0 ? { label: "Car needed", tone: "warning" } : match ? { label: "Your car fits", tone: "success" } : { label: "Check fit", tone: "warning" })
      : { label: "Open", tone: "success" };

  return (
    <article className={`ap-card ${lead ? "is-lead" : ""} ${card.kind === "instagram_story" ? "is-story" : ""}`} aria-labelledby={`op-${card.id}-t`}>
      <div className="ap-card-media">
        {m.src ? <MediaPreview src={m.src} poster={m.poster ?? undefined} alt="" priority={priority} sizes={lead ? "(min-width: 1280px) 720px, 100vw" : "(min-width: 640px) 50vw, 100vw"} /> : <span className="ap-empty">{m.fallback}</span>}
        <span className="glass-tag ap-card-tag"><Icon size={16} weight={card.kind === "recreate_reel" ? "fill" : "regular"} aria-hidden />{KIND_LABEL[card.kind]}</span>
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
          {card.business_verified && <span className="ap-verified" title="Verified business"><VerifiedIcon size={16} weight="fill" aria-label="Verified business" /></span>}
        </div>
        <h2 id={`op-${card.id}-t`} className="ap-card-title"><Link href={`/o/${card.id}`}>{card.title}</Link></h2>
        <p className="ap-card-meta">{[howLong, spots].filter(Boolean).join(" · ")}</p>
        {req.length > 0 && <div className="ap-card-req" aria-label="Requirements">{req.map((r, i) => <span key={`${i}-${r}`}>{r}</span>)}</div>}
        <div className="ap-card-foot">
          <span className={`badge is-${status.tone}`}>{status.label}</span>
          <Link href={`/o/${card.id}`} className="btn btn-sm" aria-label={`View ${card.title}`}>View <ArrowRightIcon size={16} aria-hidden /></Link>
        </div>
      </div>
    </article>
  );
}
