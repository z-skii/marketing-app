import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import {
  deadlineLabel, vehicleQualifies,
  type Opportunity, type VehicleSummary,
} from "@/lib/v2/opportunities";
import { Avatar, Money } from "./ui";
import { MediaPreview } from "./MediaPreview";

/**
 * The three earning types on Home, drawn as the blueprint's .hero-card:
 * the whole card is the tap target, and the type pill, the money, the
 * one-line title and one meta line sit on the media over the scrim.
 *
 *   Recreate  the reference video, the 260px hero card
 *   Story     the Story creative, the 215px small card
 *   Car ad    the business photo, the 215px small card
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

const SIZES = "(min-width: 1024px) 28rem, 100vw";

function Verified() {
  return <CheckCircle size={12} weight="fill" className="ml-1 inline-block align-[-1px] text-ink-faint" aria-label="Verified business" />;
}


function Tag({ children }: { children: React.ReactNode }) {
  return <span className="glass-tag">{children}</span>;
}

function Shell({ children, index = 0 }: { children: React.ReactNode; index?: number }) {
  return (
    <article className="card reveal group relative overflow-hidden" style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
      {children}
    </article>
  );
}

/* Blueprint .hero-card img: 260px tall, 215px for the small variant. */
const FRAME = "relative w-full overflow-hidden bg-surface-2";
const HERO = "h-[260px] lg:h-[320px]";
const SMALL = "h-[215px] lg:h-[280px]";

/** Blueprint .hero-copy: the type pill, the money, the title, one meta line, all on the media. */
function OnMedia({ tag, money, suffix, title, meta }: { tag: string; money: number; suffix?: string; title: string; meta: React.ReactNode }) {
  return (
    <div className="absolute inset-x-4 bottom-[15px] z-[2]">
      <Tag>{tag}</Tag>
      <div className="mt-[9px] mb-px"><Money cents={money} size="lg" suffix={suffix} /></div>
      <h3 className="mb-1 line-clamp-1 font-display text-[20px] leading-[1.15] font-[760] tracking-[-0.6px] text-ink">{title}</h3>
      <p className="truncate text-[13px] text-meta">{meta}</p>
    </div>
  );
}

function MetaLine({ card, parts }: { card: Opportunity; parts: (string | null | undefined | false)[] }) {
  return (
    <>
      {card.business_name}{card.business_verified && <Verified />}
      {parts.filter(Boolean).map((p) => <span key={String(p)}> · {p}</span>)}
    </>
  );
}

function spots(card: Opportunity) {
  const left = Math.max(card.slots - card.approved_count, 0);
  return left > 0 ? `${left} spot${left === 1 ? "" : "s"}` : "Spots filled";
}

// ------------------------------------------------------------------ Recreate

function RecreateCard({ card, priority, index }: EarnCardProps) {
  const media = card.details.reference_media_url ?? card.business_cover;
  return (
    <Shell index={index}>
      <Link href={`/o/${card.id}`} className="block">
        <div className={`${FRAME} ${HERO}`}>
          {media ? (
            <MediaPreview src={media} poster={card.business_cover} className="hero-media absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-0" aria-hidden />
          <OnMedia tag="Recreate" money={card.pay_cents} title="Recreate this Reel" meta={<MetaLine card={card} parts={[spots(card), deadlineLabel(card.deadline)]} />} />
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
      <Link href={`/o/${card.id}`} className="block">
        <div className={`${FRAME} ${SMALL}`}>
          {creative ? (
            <MediaPreview src={creative} className="hero-media absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-0" aria-hidden />
          <OnMedia tag="Story" money={card.pay_cents} title={`Post for ${liveHours} hours`} meta={<MetaLine card={card} parts={[followers, spots(card)]} />} />
        </div>
      </Link>
    </Shell>
  );
}

// -------------------------------------------------------------------- Car ad

function CarCard({ card, vehicles = [], priority, index }: EarnCardProps) {
  const photo = card.business_cover;
  const duration = card.details.duration_days ?? 30;
  const match = vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((m) => m.q.ok);

  return (
    <Shell index={index}>
      <Link href={`/o/${card.id}`} className="block">
        <div className={`${FRAME} ${SMALL}`}>
          {photo ? (
            <MediaPreview src={photo} className="hero-media absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-0" aria-hidden />
          <OnMedia tag="Car ad" money={card.pay_cents} suffix="/mo" title="Drive with this campaign" meta={<MetaLine card={card} parts={[card.city, `${duration} days`, match ? `${match.v.make} ${match.v.model} qualifies` : null]} />} />
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
