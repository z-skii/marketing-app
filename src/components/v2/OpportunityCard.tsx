import Link from "next/link";
import type { FeedCard } from "@/lib/v2/feed";
import { Avatar, Money } from "./ui";
import { SaveButton } from "./SaveButton";

const KIND_LABEL: Record<string, string> = {
  ugc: "UGC", photography: "Photo shoot", videography: "Video shoot",
  content: "Content", car_ads: "Car ad", general: "Job",
};
const PER_JOB = new Set(["photography", "videography", "general"]);

/**
 * One opportunity in the feed. The business's photography carries the card,
 * the money is the biggest thing on it, and the whole thing is one tap to
 * the job. Save lives on the photo so it never competes with the title.
 */
export function OpportunityCard({ card, priority = false }: { card: FeedCard; priority?: boolean }) {
  const spotsLeft = Math.max(card.slots - card.approved_count, 0);
  const due = card.deadline
    ? new Date(card.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const city = card.city ?? card.business_city;

  return (
    <article className="card relative overflow-hidden">
      <Link href={`/jobs/${card.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-2 md:aspect-[16/9]">
          {card.business_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.business_cover}
              alt=""
              className="h-full w-full object-cover"
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
            />
          ) : (
            <NoPhoto name={card.business_name} logo={card.business_logo} />
          )}
          <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
          <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-700 text-ink">
            {KIND_LABEL[card.kind] ?? card.kind}
          </span>
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
            <Money cents={card.pay_cents} size="xl" suffix={PER_JOB.has(card.kind) ? "for the job" : "each"} />
            {spotsLeft > 0 && spotsLeft <= 3 && (
              <span className="font-display text-sm font-700 text-ink">{spotsLeft} left</span>
            )}
          </div>
        </div>

        <div className="p-4 pt-3.5">
          <h3 className="font-display text-[1.25rem] leading-[1.15] font-800 tracking-[-0.02em] text-ink">
            {card.title}
          </h3>
          <div className="mt-2.5 flex items-center gap-2.5">
            <Avatar src={card.business_logo} name={card.business_name} size={26} />
            <p className="min-w-0 truncate text-sm text-ink-soft">
              <span className="font-600 text-ink">{card.business_name}</span>
              {city && <span className="text-ink-faint">{"  ·  "}{city}</span>}
            </p>
          </div>
          <p className="mt-2 text-sm text-ink-faint">
            {[
              spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} open` : "Spots filled",
              due && `Due ${due}`,
              card.verified_only && "Verified creators",
            ].filter(Boolean).join("  ·  ")}
          </p>
        </div>
      </Link>

      <span className="glass-tag absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full">
        <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} />
      </span>
    </article>
  );
}

/** A business without photography yet: a quiet graphite panel with its mark. */
function NoPhoto({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
      <Avatar src={logo} name={name} size={72} />
    </div>
  );
}
