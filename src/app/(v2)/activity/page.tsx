import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  activityBucket, activityLabel, getActivity, getSavedOpportunities,
  type ActivityItem, type EarnKind,
} from "@/lib/v2/opportunities";
import { EarnCard } from "@/components/v2/EarnCards";
import { Avatar, EmptyState, Money, ScreenHeader } from "@/components/v2/ui";

export const metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

/**
 * Activity is what I am doing, never discovery: campaigns in progress,
 * things waiting on a business, what is finished, and what I saved for later.
 */

type Tab = "active" | "submitted" | "completed" | "saved";

const TABS: { key: Tab; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "submitted", label: "Submitted" },
  { key: "completed", label: "Completed" },
  { key: "saved", label: "Saved" },
];

const KIND_ROW_LABEL: Record<EarnKind, string> = {
  recreate_reel: "Recreate Reel",
  instagram_story: "Instagram Story",
  car_ads: "Car campaign",
};

const EMPTY: Record<Tab, { title: string; body: string; action: string }> = {
  active: { title: "Nothing in progress", body: "Take something on Home and it shows up here while you work on it.", action: "Find something to do" },
  submitted: { title: "Nothing waiting for approval", body: "Versions and proofs you send sit here until a business approves them.", action: "See what pays" },
  completed: { title: "Nothing completed yet", body: "Approved work and finished campaigns land here.", action: "Start with one" },
  saved: { title: "Nothing saved", body: "Tap the bookmark on any opportunity and it waits for you here.", action: "Browse Home" },
};

export default async function ActivityPage({
  searchParams,
}: { searchParams: Promise<{ tab?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "active";
  const [items, saved] = await Promise.all([
    tab === "saved" ? Promise.resolve([]) : getActivity(ctx.user.id),
    tab === "saved" ? getSavedOpportunities(ctx.user.id) : Promise.resolve([]),
  ]);
  const rows = items.filter((it) => activityBucket(it) === tab);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} title="Activity" showSearch={false} unread={ctx.unreadNotifications} />

      <nav className="pill-row mt-4" aria-label="Activity tabs">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "active" ? "/activity" : `/activity?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className="pill"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "saved" ? (
        <div className="mt-4 flex flex-col gap-4">
          {saved.map((card, i) => <EarnCard key={card.id} card={card} priority={i === 0} />)}
          {saved.length === 0 && <Empty tab={tab} />}
        </div>
      ) : (
        <div className="mt-4">
          {rows.length === 0 ? (
            <Empty tab={tab} />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {rows.map((it, i) => <ActivityRow key={`${it.record}-${it.id}`} item={it} index={i} />)}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const e = EMPTY[tab];
  return <EmptyState title={e.title} body={e.body} actionHref="/home" actionLabel={e.action} />;
}

function ActivityRow({ item, index = 0 }: { item: ActivityItem; index?: number }) {
  const { label, sub } = activityLabel(item);
  const hot = item.record === "invite" && item.status === "sent";
  return (
    <li className="reveal" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <Link href={`/o/${item.campaign_id}`} className="row flex min-h-[4.5rem] items-center gap-3.5 px-3.5 py-3">
        {item.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover} alt="" className="h-12 w-12 shrink-0 rounded-[12px] object-cover" loading="lazy" />
        ) : (
          <Avatar src={item.business_logo} name={item.business_name} size={48} />
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[1rem] leading-[1.3] font-600 tracking-[-0.01em]">{KIND_ROW_LABEL[item.kind]}</span>
          <span className="mt-0.5 block truncate text-sm text-ink-soft">{item.business_name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-sm text-ink-soft">
            {hot && <span aria-hidden className="status-dot" />}
            <span className="truncate">{label}</span>
          </span>
        </span>
        <Money cents={item.pay_cents} size="md" suffix={item.kind === "car_ads" ? "/mo" : undefined} />
        <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
      </Link>
    </li>
  );
}
