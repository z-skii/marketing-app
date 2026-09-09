import Link from "next/link";
import {
  deadlineLabel, isVideoUrl, vehicleQualifies,
  type Opportunity, type VehicleSummary,
} from "@/lib/v2/opportunities";
import { Avatar, Money } from "./ui";
import { SaveButton } from "./SaveButton";

/**
 * The three earning types get three card anatomies. They share type, colour,
 * spacing and the one lime action; what leads differs:
 *
 *   Recreate  the reference video, the pay, spots and deadline
 *   Story     the 9:16 creative, the pay, follower and 24-hour requirements
 *   Car ad    the artwork, the monthly pay, city, duration, vehicle preferences
 *
 * Every card is one tap to the opportunity. Save sits in a glass circle so it
 * never competes with the money.
 */

export type EarnCardProps = {
  card: Opportunity;
  vehicles?: VehicleSummary[];
  priority?: boolean;
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

function BusinessLine({ card, compact = false }: { card: Opportunity; compact?: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-2.5">
      <Avatar src={card.business_logo} name={card.business_name} size={26} />
      <p className="min-w-0 truncate text-sm">
        <span className="font-600 text-ink">{card.business_name}</span>
        {card.business_verified && <span className="ml-1 text-signal" aria-label="Verified business">✓</span>}
        {card.city && !compact && <span className="text-ink-faint">{"  ·  "}{card.city}</span>}
      </p>
    </div>
  );
}

function Save({ card }: { card: Opportunity }) {
  return (
    <span className="glass-tag absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full">
      <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} />
    </span>
  );
}

function Meta({ parts }: { parts: (string | null | false | undefined)[] }) {
  const shown = parts.filter(Boolean) as string[];
  if (shown.length === 0) return null;
  return <p className="mt-2 text-sm text-ink-faint">{shown.join("  ·  ")}</p>;
}

/** Meta on the left, the one lime action on the right. */
function ActionRow({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0 text-sm text-ink-faint">{note}</div>
      <span className="btn btn-signal shrink-0">{children}</span>
    </div>
  );
}

// ------------------------------------------------------------------ Recreate

function RecreateCard({ card, priority }: EarnCardProps) {
  const spotsLeft = Math.max(card.slots - card.approved_count, 0);
  const media = card.details.reference_media_url ?? card.business_cover;
  const range = card.details.duration_seconds;

  return (
    <article className="card relative overflow-hidden">
      <Link href={`/o/${card.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
          {media ? (
            isVideoUrl(media) ? (
              <video src={media} muted playsInline preload="metadata" className="h-full w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={media} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
            )
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Recreate</span>
          <span className="glass-tag absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" className="ml-0.5 text-ink"><path d="M6 3.5v13l10-6.5z" /></svg>
          </span>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <Money cents={card.pay_cents} size="xl" />
            {spotsLeft > 0 && (
              <span className="font-display text-sm font-700 text-ink">{spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left</span>
            )}
          </div>
        </div>
        <div className="p-4 pt-3.5">
          <h3 className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">Recreate this Reel</h3>
          <BusinessLine card={card} />
          <ActionRow note={[range ? `${range[0]} to ${range[1]} seconds` : card.requirements[0], deadlineLabel(card.deadline)].filter(Boolean).join("  ·  ")}>
            Recreate
          </ActionRow>
        </div>
      </Link>
      <Save card={card} />
    </article>
  );
}

// --------------------------------------------------------------------- Story

function StoryCard({ card, priority }: EarnCardProps) {
  const spotsLeft = Math.max(card.slots - card.approved_count, 0);
  const creative = card.details.creative_url ?? card.business_cover;
  const minFollowers = card.details.min_followers ?? null;
  const liveHours = card.details.live_hours ?? 24;

  return (
    <article className="card relative overflow-hidden">
      <Link href={`/o/${card.id}`} className="flex">
        <div className="relative w-[42%] shrink-0 overflow-hidden bg-surface-2 md:w-[36%]">
          <div className="relative aspect-[9/16] w-full">
            {creative ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creative} alt="" className="absolute inset-0 h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
            ) : (
              <NoPhoto name={card.business_name} logo={card.business_logo} />
            )}
            <span className="glass-tag absolute bottom-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Story</span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
          <p className="text-sm text-ink-soft">Earn</p>
          <Money cents={card.pay_cents} size="xl" />
          <h3 className="mt-2 font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">Post this to your Story</h3>
          <BusinessLine card={card} compact />
          <ul className="mt-3 flex flex-col gap-1 text-sm text-ink-soft">
            <li>Keep it live {liveHours} hours</li>
            {minFollowers ? <li>{minFollowers.toLocaleString()}+ followers</li> : null}
          </ul>
          <ActionRow note={spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Spots filled"}>Story</ActionRow>
        </div>
      </Link>
      <Save card={card} />
    </article>
  );
}

// -------------------------------------------------------------------- Car ad

function CarCard({ card, vehicles = [], priority }: EarnCardProps) {
  const art = card.details.artwork_url ?? null;
  const photo = card.business_cover;
  const duration = card.details.duration_days ?? 30;
  const prefs = card.details.vehicle_prefs ?? {};
  const prefLine = [
    prefs.colors?.length ? `${prefs.colors.join(" or ")} vehicles preferred` : null,
    prefs.body_types?.length ? `${prefs.body_types.join(" or ")} preferred` : null,
  ].filter(Boolean).join(", ");
  const placements = (card.details.placements ?? []).map(placementLabel).join(", ");
  const match = vehicles.map((v) => ({ v, q: vehicleQualifies(v, card) })).find((m) => m.q.ok);

  return (
    <article className="card relative overflow-hidden">
      <Link href={`/o/${card.id}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2 md:aspect-[2/1]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Car ad</span>
          {art && (
            <span className="glass-tag absolute top-3 right-14 flex items-center gap-2 rounded-[8px] p-1 pr-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art} alt="Campaign artwork" width={64} height={32} className="h-8 w-16 rounded-[5px] object-cover" loading="lazy" />
              <span className="font-display text-xs font-700 text-ink">Artwork</span>
            </span>
          )}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <Money cents={card.pay_cents} size="xl" suffix="/ month" />
            <span className="font-display text-sm font-700 text-ink">{duration} days</span>
          </div>
        </div>
        <div className="p-4 pt-3.5">
          <h3 className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">Drivers wanted for this campaign</h3>
          <BusinessLine card={card} />
          <Meta parts={[placements, prefLine]} />
          {match ? (
            <ActionRow note={<span className="font-display font-700 text-signal">Your {match.v.make} {match.v.model} qualifies ✓</span>}>Apply</ActionRow>
          ) : vehicles.length > 0 ? (
            <ActionRow note="Open it to check your car">See if my car qualifies</ActionRow>
          ) : (
            <ActionRow note="Add your car to apply">Add my car</ActionRow>
          )}
        </div>
      </Link>
      <Save card={card} />
    </article>
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
