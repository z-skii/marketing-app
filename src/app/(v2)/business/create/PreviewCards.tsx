"use client";

import { Avatar, Money } from "@/components/v2/ui";

/**
 * What people will see on Home, rendered from the wizard's answers before
 * anything is saved. These mirror the three anatomies in EarnCards.tsx;
 * that file sits behind a server-only import, so the wizards carry a
 * client-safe copy with the link and the save button left out.
 */

export type PreviewCardData = {
  kind: "recreate_reel" | "instagram_story" | "car_ads";
  pay_cents: number;
  slots: number;
  city: string | null;
  deadline: string | null;
  requirements: string[];
  details: {
    reference_media_url?: string | null;
    duration_seconds?: [number, number] | null;
    creative_url?: string | null;
    min_followers?: number | null;
    live_hours?: number | null;
    placements?: string[];
    duration_days?: number | null;
    vehicle_prefs?: { colors?: string[]; body_types?: string[] } | null;
    artwork_url?: string | null;
  };
  business: { name: string; logo: string | null; cover: string | null; verified: boolean };
};

const PLACEMENT_LABEL: Record<string, string> = {
  driver_door: "Driver door", passenger_door: "Passenger door", driver_rear_door: "Rear driver door",
  passenger_rear_door: "Rear passenger door", rear_window: "Rear window", rear_panel: "Rear panel",
  bumper: "Bumper", hood: "Hood", full_side: "Full side", partial_wrap: "Partial wrap", full_wrap: "Full wrap",
};
export function placementLabel(zone: string) {
  return PLACEMENT_LABEL[zone] ?? zone.replaceAll("_", " ");
}

export function isVideoUrl(url: string | null | undefined) {
  return Boolean(url && /\.(mp4|webm|mov)($|\?)/i.test(url));
}

function deadlineLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (days <= 0) return "Ends today";
  if (days === 1) return "Ends tomorrow";
  if (days < 7) return `Ends ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return `Ends ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function PreviewCard({ card }: { card: PreviewCardData }) {
  switch (card.kind) {
    case "recreate_reel": return <RecreatePreview card={card} />;
    case "instagram_story": return <StoryPreview card={card} />;
    case "car_ads": return <CarPreview card={card} />;
  }
}

function BusinessLine({ card, compact = false }: { card: PreviewCardData; compact?: boolean }) {
  return (
    <div className="mt-2 flex items-center gap-2.5">
      <Avatar src={card.business.logo} name={card.business.name} size={26} />
      <p className="min-w-0 truncate text-sm">
        <span className="font-600 text-ink">{card.business.name}</span>
        {card.business.verified && <span className="ml-1 text-signal" aria-label="Verified business">✓</span>}
        {card.city && !compact && <span className="text-ink-faint">{"  ·  "}{card.city}</span>}
      </p>
    </div>
  );
}

function ActionRow({ children, note }: { children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="mt-3.5 flex items-center justify-between gap-3">
      <div className="min-w-0 text-sm text-ink-faint">{note}</div>
      <span className="btn btn-signal shrink-0">{children}</span>
    </div>
  );
}

function NoPhoto({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
      <Avatar src={logo} name={name} size={72} />
    </div>
  );
}

function RecreatePreview({ card }: { card: PreviewCardData }) {
  const media = card.details.reference_media_url ?? card.business.cover;
  const range = card.details.duration_seconds;
  return (
    <article className="card relative overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
        {media ? (
          isVideoUrl(media) ? (
            <video src={media} muted playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={media} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <NoPhoto name={card.business.name} logo={card.business.logo} />
        )}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
        <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Recreate</span>
        <span className="glass-tag absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" className="ml-0.5 text-ink"><path d="M6 3.5v13l10-6.5z" /></svg>
        </span>
        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <Money cents={card.pay_cents} size="xl" />
          {card.slots > 0 && <span className="font-display text-sm font-700 text-ink">{card.slots} spot{card.slots === 1 ? "" : "s"} left</span>}
        </div>
      </div>
      <div className="p-4 pt-3.5">
        <h3 className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">Recreate this Reel</h3>
        <BusinessLine card={card} />
        <ActionRow note={[range ? `${range[0]} to ${range[1]} seconds` : card.requirements[0], deadlineLabel(card.deadline)].filter(Boolean).join("  ·  ")}>
          Recreate
        </ActionRow>
      </div>
    </article>
  );
}

function StoryPreview({ card }: { card: PreviewCardData }) {
  const creative = card.details.creative_url ?? card.business.cover;
  const minFollowers = card.details.min_followers ?? null;
  const liveHours = card.details.live_hours ?? 24;
  return (
    <article className="card relative overflow-hidden">
      <div className="flex">
        <div className="relative w-[42%] shrink-0 overflow-hidden bg-surface-2 md:w-[36%]">
          <div className="aspect-[9/16] w-full" aria-hidden />
          {creative ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={creative} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0"><NoPhoto name={card.business.name} logo={card.business.logo} /></div>
          )}
          <span className="glass-tag absolute bottom-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Story</span>
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
          <ActionRow note={card.slots > 0 ? `${card.slots} spot${card.slots === 1 ? "" : "s"} left` : "Spots filled"}>Story</ActionRow>
        </div>
      </div>
    </article>
  );
}

function CarPreview({ card }: { card: PreviewCardData }) {
  const art = card.details.artwork_url ?? null;
  const photo = card.business.cover;
  const duration = card.details.duration_days ?? 30;
  const prefs = card.details.vehicle_prefs ?? {};
  const prefLine = [
    prefs.colors?.length ? `${prefs.colors.join(" or ")} vehicles preferred` : null,
    prefs.body_types?.length ? `${prefs.body_types.join(" or ")} preferred` : null,
  ].filter(Boolean).join(", ");
  const placements = (card.details.placements ?? []).map(placementLabel).join(", ");
  const meta = [placements, prefLine].filter(Boolean);
  return (
    <article className="card relative overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2 md:aspect-[2/1]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <NoPhoto name={card.business.name} logo={card.business.logo} />
        )}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
        <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">Car ad</span>
        {art && (
          <span className="glass-tag absolute top-3 right-3 flex items-center gap-2 rounded-[8px] p-1 pr-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={art} alt="Campaign artwork" width={64} height={32} className="h-8 w-16 rounded-[5px] object-cover" />
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
        {meta.length > 0 && <p className="mt-2 text-sm text-ink-faint">{meta.join("  ·  ")}</p>}
        <ActionRow note="Open it to check your car">See if my car qualifies</ActionRow>
      </div>
    </article>
  );
}
