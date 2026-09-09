import Link from "next/link";
import type { FeedCard } from "@/lib/v2/feed";
import { Avatar, Chip, MetaLine, Money } from "./ui";
import { SaveButton } from "./SaveButton";

const KIND_LABEL: Record<string, string> = {
  ugc: "UGC", photography: "Photos", videography: "Video",
  content: "Content", car_ads: "Car ads", general: "Job",
};

/** One opportunity in the feed: who, what, pay, where — one obvious action. */
export function OpportunityCard({ card }: { card: FeedCard }) {
  const spotsLeft = Math.max(card.slots - card.approved_count, 0);
  return (
    <article className="border border-rule bg-paper">
      <div className="flex items-center gap-3 px-4 pt-3.5">
        <Link href={`/b/${card.business_slug}`} className="flex min-w-0 items-center gap-2.5">
          <Avatar src={card.business_logo} name={card.business_name} size={34} />
          <span className="truncate font-mono text-xs font-600">{card.business_name}</span>
        </Link>
        <span className="ml-auto flex items-center gap-2">
          <Chip tone="faint">{KIND_LABEL[card.kind] ?? card.kind}</Chip>
          <SaveButton itemType="campaign" itemId={card.id} initialSaved={card.saved} />
        </span>
      </div>

      <Link href={`/jobs/${card.id}`} className="block px-4 pb-4">
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg leading-tight font-800 tracking-[-0.02em]">
            {card.title}
          </h3>
          <Money cents={card.pay_cents} />
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-faint">{card.brief}</p>
        <MetaLine
          parts={[
            card.city,
            card.deadline &&
              `due ${new Date(card.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "spots filled",
            card.verified_only ? "verified only" : null,
          ]}
        />
      </Link>
    </article>
  );
}
