import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import {
  deadlineLabel, vehicleQualifies,
  type Opportunity, type VehicleSummary,
} from "@/lib/v2/opportunities";
import { formatCredit } from "@/lib/money";
import { Avatar } from "./ui";
import { MediaPreview } from "./MediaPreview";

/**
 * The three earning types on Home, built to OpenAI's User Home design
 * (docs/design-specs/user-home.md). Each kind has its own composition:
 *
 *   Recreate  a 358x260 media card with the payout on the media and a
 *             business footer with the primary button
 *   Story     a split card: the 9:16 creative on the left as an object,
 *             payout, title, business and the button on the right
 *   Car ad    a 358x236 media card with the monthly payout on the media and
 *             a footer with placements, vehicle fit and the button
 *
 * The whole card opens the detail page; the button does the same.
 */

export type EarnCardProps = {
  card: Opportunity;
  vehicles?: VehicleSummary[];
  priority?: boolean;
  index?: number;
};

export function EarnCard(props: EarnCardProps) {
  switch (props.card.kind) {
    case "recreate_reel": return <RecreateCard {...props} />;
    case "instagram_story": return <StoryCard {...props} />;
    case "car_ads": return <CarCard {...props} />;
  }
}

const PLACEMENT_LABEL: Record<string, string> = {
  driver_door: "Driver door", passenger_door: "Passenger door", driver_rear_door: "Rear driver door",
  passenger_rear_door: "Rear passenger door", rear_window: "Rear window", rear_panel: "Rear panel",
  bumper: "Bumper", hood: "Hood", full_side: "Full side", partial_wrap: "Partial wrap", full_wrap: "Full wrap",
};
export function placementLabel(zone: string) {
  return PLACEMENT_LABEL[zone] ?? zone.replaceAll("_", " ");
}

const SIZES = "(min-width: 1024px) 22rem, 100vw";

function Verified() {
  return <CheckCircle size={16} weight="fill" className="ml-1 inline-block align-[-3px] text-signal" aria-label="Verified business" />;
}

/** Hero money: 27px/850 lime with its unit in 12px/700 secondary. */
function Payout({ cents, unit }: { cents: number; unit: string }) {
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="tnum font-display text-[27px] leading-[30px] font-[850] tracking-[-0.7px] text-signal">{formatCredit(cents)}</span>
      <span className="text-[12px] leading-[14px] font-700 text-ink-2">{unit}</span>
    </p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-1 line-clamp-2 font-display text-[20px] leading-[25px] font-[760] tracking-[-0.35px] text-ink">{children}</h3>;
}

function Meta({ parts }: { parts: (string | null | undefined | false)[] }) {
  const shown = parts.filter(Boolean) as string[];
  if (shown.length === 0) return null;
  return <p className="mt-1 truncate text-[13px] leading-[17px] font-600 text-ink-2">{shown.join("  ·  ")}</p>;
}

function TypeBadge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`glass-tag ${className}`}>{children}</span>;
}

function BusinessRow({ card }: { card: Opportunity }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar src={card.business_logo} name={card.business_name} size={32} />
      <div className="min-w-0">
        <p className="truncate font-display text-[14px] leading-[18px] font-700 text-ink">{card.business_name}{card.business_verified && <Verified />}</p>
        <p className="truncate text-[12px] leading-4 text-ink-soft">{card.city ?? deadlineLabel(card.deadline) ?? ""}</p>
      </div>
    </div>
  );
}

function Shell({ children, index = 0, className = "" }: { children: React.ReactNode; index?: number; className?: string }) {
  return (
    <article className={`card reveal group relative overflow-hidden ${className}`} style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
      {children}
    </article>
  );
}

function spots(card: Opportunity) {
  const left = Math.max(card.slots - card.approved_count, 0);
  return left > 0 ? `${left} spot${left === 1 ? "" : "s"} left` : "Spots filled";
}

function NoMedia() {
  return <div className="flex h-full w-full items-center justify-center bg-[#151b1e] text-[12px] leading-4 text-ink-soft">Media unavailable</div>;
}

// ------------------------------------------------------------------ Recreate

function RecreateCard({ card, priority, index }: EarnCardProps) {
  const media = card.details.reference_media_url ?? card.business_cover;
  return (
    <Shell index={index}>
      <Link href={`/o/${card.id}`} className="block" aria-label={`${card.title}, ${formatCredit(card.pay_cents)} per version`}>
        <div className="relative h-[260px] w-full overflow-hidden bg-[#151b1e] lg:h-[252px]">
          {media ? (
            <MediaPreview src={media} poster={card.business_cover} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : <NoMedia />}
          <div className="absolute inset-x-0 top-0 h-16 bg-[image:var(--tm-scrim-top)]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-[154px] bg-[image:var(--tm-scrim)]" aria-hidden />
          <TypeBadge className="absolute top-[14px] left-[14px]">Recreate</TypeBadge>
          <div className="absolute inset-x-[14px] bottom-[14px]">
            <Payout cents={card.pay_cents} unit="per version" />
            <Title>Recreate this Reel</Title>
            <Meta parts={[card.city, spots(card), deadlineLabel(card.deadline)]} />
          </div>
        </div>
        <div className="flex h-[92px] items-center justify-between gap-3 px-[14px]">
          <BusinessRow card={card} />
          <span className="btn btn-signal shrink-0 shadow-none">View Reel</span>
        </div>
      </Link>
    </Shell>
  );
}

// --------------------------------------------------------------------- Story

function StoryCard({ card, priority, index }: EarnCardProps) {
  const creative = card.details.creative_url ?? card.business_cover;
  const minFollowers = card.details.min_followers ?? null;
  const liveHours = card.details.live_hours ?? 24;
  const followers = minFollowers ? `${minFollowers >= 1000 ? `${Math.round(minFollowers / 1000)}K` : minFollowers}+ followers` : null;

  return (
    <Shell index={index}>
      <Link href={`/o/${card.id}`} className="flex gap-[14px] p-[14px]" aria-label={`${card.title}, ${formatCredit(card.pay_cents)} per post`}>
        <div className="w-[140px] shrink-0">
          <div className="relative h-[249px] w-[140px] overflow-hidden rounded-[16px] bg-[#090c0e]">
            {creative ? (
              <MediaPreview src={creative} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes="140px" />
            ) : <NoMedia />}
            <TypeBadge className="absolute top-[10px] left-[10px]">Story</TypeBadge>
          </div>
          {card.slots > 0 && <div className="mt-[12px]"><MetaBadge>{spots(card)}</MetaBadge></div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="tnum font-display text-[27px] leading-[30px] font-[850] tracking-[-0.7px] text-signal">{formatCredit(card.pay_cents)}</p>
          <p className="text-[12px] leading-[14px] font-700 text-ink-2">per post</p>
          <Title>Post for {liveHours} hours</Title>
          <p className="mt-3 truncate font-display text-[14px] leading-[18px] font-700 text-ink">{card.business_name}{card.business_verified && <Verified />}</p>
          {card.city && <p className="truncate text-[12px] leading-4 text-ink-soft">{card.city}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {followers && <MetaBadge>{followers}</MetaBadge>}
            {deadlineLabel(card.deadline) && <MetaBadge>{deadlineLabel(card.deadline)}</MetaBadge>}
          </div>
          <span className="btn btn-signal mt-auto w-full shadow-none">View Story</span>
        </div>
      </Link>
    </Shell>
  );
}

function MetaBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-6 items-center rounded-full bg-white/7 px-2 text-[11px] leading-[13px] font-[650] text-ink-soft">{children}</span>;
}

// -------------------------------------------------------------------- Car ad

function CarCard({ card, vehicles = [], priority, index }: EarnCardProps) {
  const photo = card.details.media_url ?? card.business_cover;
  const duration = card.details.duration_days ?? 30;
  const placements = (card.details.placements ?? []).map(placementLabel);
  const placementLine = placements.length > 2 ? `${placements.slice(0, 2).join(", ")} +${placements.length - 2}` : placements.join(", ");
  const match = vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((m) => m.q.ok);

  return (
    <Shell index={index}>
      <Link href={`/o/${card.id}`} className="block" aria-label={`${card.title}, ${formatCredit(card.pay_cents)} a month`}>
        <div className="relative h-[236px] w-full overflow-hidden bg-[#151b1e] lg:h-[238px]">
          {photo ? (
            <MediaPreview src={photo} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : <NoMedia />}
          <div className="absolute inset-x-0 top-0 h-16 bg-[image:var(--tm-scrim-top)]" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-[144px] bg-[image:var(--tm-scrim)]" aria-hidden />
          <TypeBadge className="absolute top-[14px] left-[14px]">Car ad</TypeBadge>
          <div className="absolute inset-x-[14px] bottom-[14px]">
            <Payout cents={card.pay_cents} unit="/mo" />
            <Title>Drive with this campaign</Title>
            <Meta parts={[card.city, `${duration} days`]} />
          </div>
        </div>
        <div className="flex h-[96px] items-center justify-between gap-3 px-[14px]">
          <div className="min-w-0">
            {placementLine && <p className="truncate text-[13px] leading-[17px] font-600 text-ink-2">{placementLine}</p>}
            {vehicles.length > 0 ? (
              match
                ? <p className="status-text mt-1"><span aria-hidden className="status-dot" />Your vehicle qualifies</p>
                : <p className="status-text is-warning mt-1"><span aria-hidden className="status-dot" />Check vehicle fit</p>
            ) : (
              <p className="mt-1 text-[12px] leading-4 text-ink-soft">Add your car to apply</p>
            )}
          </div>
          <span className="btn btn-signal shrink-0 shadow-none">View Ad</span>
        </div>
      </Link>
    </Shell>
  );
}

/** A business without media yet: a quiet graphite panel with its mark. */
export function NoPhoto({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
      <Avatar src={logo} name={name} size={72} />
    </div>
  );
}
