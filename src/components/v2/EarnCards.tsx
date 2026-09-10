import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import {
  deadlineLabel, vehicleQualifies,
  type Opportunity, type VehicleSummary,
} from "@/lib/v2/opportunities";
import { Avatar, Money } from "./ui";
import { SaveButton } from "./SaveButton";
import { MediaPreview } from "./MediaPreview";

/**
 * The three earning types on Home. The media IS the card: money and the
 * one-line title sit on the picture, and only a business line, one meta
 * row and the button live underneath. Nothing explains what Recreate means
 * here; the detail screen does that.
 *
 *   Recreate  the reference video, 9:16 on phones
 *   Story     the Story creative, 9:16
 *   Car ad    the campaign artwork or the business photo, 4:3
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
  return <CheckCircle size={14} weight="fill" className="ml-1 inline-block align-[-2px] text-ink-faint" aria-label="Verified business" />;
}

function BusinessLine({ card }: { card: Opportunity }) {
  return (
    <p className="min-w-0 truncate text-[0.9375rem] text-ink-soft">
      {card.business_name}
      {card.business_verified && <Verified />}
    </p>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return <p className="mt-0.5 truncate text-sm text-ink-faint">{children}</p>;
}

/** Under the media, on the page: the business, one meta row, one small action. */
function Foot({ card, meta, action }: { card: Opportunity; meta: React.ReactNode; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-0.5 pt-3">
      <div className="min-w-0">
        <BusinessLine card={card} />
        <Meta>{meta}</Meta>
      </div>
      <span className="btn btn-signal btn-sm shrink-0">{action}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">{children}</span>;
}

function Shell({ children, index = 0, wide = false }: { children: React.ReactNode; index?: number; wide?: boolean }) {
  return (
    <article className={`reveal group relative ${wide ? "lg:col-span-2" : ""}`} style={{ animationDelay: `${Math.min(index, 6) * 70}ms` }}>
      {children}
    </article>
  );
}

const FRAME = "relative w-full overflow-hidden rounded-[16px] bg-surface-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] can-hover:group-hover:-translate-y-1";

function OnMedia({ money, suffix, title, right }: { money: number; suffix?: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="absolute inset-x-4 bottom-4">
      <div className="flex items-end justify-between gap-3">
        <Money cents={money} size="xl" suffix={suffix} />
        {right && <span className="shrink-0 text-sm text-ink-soft">{right}</span>}
      </div>
      <h3 className="mt-1 line-clamp-1 font-display text-[1.25rem] leading-[1.1] font-800 tracking-[-0.02em] text-ink">{title}</h3>
    </div>
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
        <div className={`${FRAME} aspect-[9/16] lg:aspect-[4/5]`}>
          {media ? (
            <MediaPreview src={media} poster={card.business_cover} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <Tag>Recreate</Tag>
          <OnMedia money={card.pay_cents} title="Recreate this Reel" />
        </div>
        <Foot card={card} meta={[spots(card), deadlineLabel(card.deadline)].filter(Boolean).join(" · ")} action="Recreate" />
      </Link>
      <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} className="absolute top-3 right-3 opacity-80" />
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
        <div className={`${FRAME} aspect-[9/16] lg:aspect-[4/5]`}>
          {creative ? (
            <MediaPreview src={creative} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <Tag>Story</Tag>
          <OnMedia money={card.pay_cents} title={`Post for ${liveHours} hours`} />
        </div>
        <Foot card={card} meta={[followers, spots(card)].filter(Boolean).join(" · ")} action="Post" />
      </Link>
      <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} className="absolute top-3 right-3 opacity-80" />
    </Shell>
  );
}

// -------------------------------------------------------------------- Car ad

function CarCard({ card, vehicles = [], priority, index }: EarnCardProps) {
  const art = card.details.artwork_url ?? null;
  const photo = card.business_cover;
  const duration = card.details.duration_days ?? 30;
  const match = vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((m) => m.q.ok);
  const action = match ? "Apply" : "Check my car";

  return (
    <Shell index={index} wide>
      <Link href={`/o/${card.id}`} className="block">
        <div className={`${FRAME} aspect-[4/3] lg:aspect-[16/9]`}>
          {photo ? (
            <MediaPreview src={photo} className="absolute inset-0 h-full w-full object-cover" priority={priority} sizes={SIZES} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <Tag>Car ad</Tag>
          {art && (
            <span className="glass-tag absolute top-3 left-1/2 flex -translate-x-1/2 items-center rounded-[8px] p-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="Campaign artwork" width={72} height={36} className="h-9 w-[4.5rem] rounded-[5px] object-cover" loading="lazy" decoding="async" />
            </span>
          )}
          <OnMedia money={card.pay_cents} suffix="/ mo" title="Drive with this campaign" />
        </div>
        <Foot
          card={card}
          meta={[card.city, `${duration} days`].filter(Boolean).join("  ·  ")}
          action={action}
        />
      </Link>
      <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} className="absolute top-3 right-3 opacity-80" />
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
