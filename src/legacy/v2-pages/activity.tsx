import Link from "next/link";
import { CaretRight, Pulse, PaperPlaneTilt, CheckCircle, BookmarkSimple } from "@phosphor-icons/react/dist/ssr";
import { formatCredit } from "@/lib/money";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  activityBucket, activityLabel, fmtDate, getActivity, getSavedOpportunities,
  type ActivityItem, type EarnKind, type Opportunity,
} from "@/lib/v2/opportunities";
import { Avatar } from "@/components/v2/ui";

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

const SECTION: Record<Tab, string> = { active: "In progress", submitted: "Waiting on business", completed: "Completed", saved: "Saved" };

const EMPTY: Record<Tab, { title: string; body: string }> = {
  active: { title: "No active work", body: "Accepted work and requests that need your answer will appear here." },
  submitted: { title: "Nothing submitted", body: "Work waiting on a business will appear here after you upload it." },
  completed: { title: "No completed work yet", body: "Approved, paid and finished work will land here." },
  saved: { title: "No saved opportunities", body: "Save opportunities from Home to keep them here." },
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
    <main id="main" className="mx-auto w-full max-w-[1136px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      <div className="rail:flex rail:h-16 rail:items-center">
        <h1 className="font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:text-[30px] rail:leading-9 rail:font-[820] rail:tracking-[-0.8px]">Activity</h1>
      </div>

      <div className="rail:mt-6 rail:grid rail:grid-cols-[248px_768px] rail:gap-6">
        {/* Phone: chips. Desktop: a vertical tab panel. */}
        <nav className="pill-row mt-[14px] rail:hidden" aria-label="Activity tabs">
          {TABS.map((t) => (
            <Link key={t.key} href={t.key === "active" ? "/activity" : `/activity?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined} className="pill">{t.label}</Link>
          ))}
        </nav>
        <nav className="hidden h-fit rounded-[22px] bg-surface p-2.5 rail:block" aria-label="Activity tabs">
          {TABS.map((t) => {
            const on = tab === t.key;
            const n = t.key === "saved" ? saved.length : items.filter((it) => activityBucket(it) === t.key).length;
            return (
              <Link key={t.key} href={t.key === "active" ? "/activity" : `/activity?tab=${t.key}`} aria-current={on ? "page" : undefined}
                className={`mb-1.5 flex h-[52px] items-center gap-2.5 rounded-[16px] px-3.5 font-display text-[14px] font-700 last:mb-0 ${on ? "bg-surface-3 text-signal" : "text-ink-2 can-hover:hover:bg-surface-2"}`}>
                {on && <span aria-hidden className="status-dot is-review !bg-signal !shadow-none" />}
                {t.label}
                {n > 0 && <span className="tnum ml-auto inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/7 px-2 text-[12px] font-700 text-ink-2">{n}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0">
          {tab === "saved" ? (
            saved.length === 0 ? <Empty tab={tab} /> : (
              <>
                <h2 className="eyebrow mt-6 mb-2.5 rail:mt-0">Saved</h2>
                <ul className="flex flex-col gap-[9px]">
                  {saved.map((card, i) => <SavedRow key={card.id} card={card} index={i} />)}
                </ul>
              </>
            )
          ) : rows.length === 0 ? (
            <Empty tab={tab} />
          ) : (
            <>
              <h2 className="eyebrow mt-6 mb-2.5 rail:mt-0">{SECTION[tab]}</h2>
              <ul className="flex flex-col gap-[9px]">
                {rows.map((it, i) => <ActivityRow key={`${it.record}-${it.id}`} item={it} index={i} />)}
              </ul>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const e = EMPTY[tab];
  const Icon = tab === "active" ? Pulse : tab === "submitted" ? PaperPlaneTilt : tab === "completed" ? CheckCircle : BookmarkSimple;
  return (
    <div className="card mt-6 max-w-[420px] p-[18px] rail:mt-0">
      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-surface-2 text-ink-2"><Icon size={22} aria-hidden /></span>
      <p className="mt-4 font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">{e.title}</p>
      <p className="mt-1.5 text-[14px] leading-5 text-ink-soft">{e.body}</p>
      <Link href="/home" className="btn btn-signal mt-[18px] w-full">Open Home</Link>
    </div>
  );
}

const KIND_SHORT: Record<EarnKind, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car" };
const UNIT: Record<EarnKind, string> = { recreate_reel: "per version", instagram_story: "per post", car_ads: "/mo" };

/** Status colour by the label the product already uses. */
function statusTone(label: string): { cls: string; hot: boolean } {
  const l = label.toLowerCase();
  if (/request for you|changes requested|proof needed/.test(l)) return { cls: "is-review", hot: true };
  if (/paid/.test(l)) return { cls: "is-review", hot: false };
  if (/accepted|approved|active|running|posted|live/.test(l)) return { cls: "", hot: false };
  if (/submitted|proof sent|applied|under review/.test(l)) return { cls: "is-info", hot: false };
  if (/pending|installation|waiting/.test(l)) return { cls: "is-warning", hot: false };
  if (/not approved|failed|blocked|disputed/.test(l)) return { cls: "is-error", hot: false };
  return { cls: "is-done", hot: false };
}

function Thumb({ src, kind, logo, name }: { src: string | null; kind: EarnKind; logo: string | null; name: string }) {
  const tall = kind !== "car_ads";
  return (
    <span className="relative flex h-16 w-14 shrink-0 items-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className={`rounded-[12px] bg-[#151b1e] object-cover ${tall ? "h-16 w-12" : "h-12 w-14"}`} loading="lazy" />
      ) : (
        <span className={`flex items-center justify-center rounded-[12px] bg-[#151b1e] ${tall ? "h-16 w-12" : "h-12 w-14"}`}><Avatar src={logo} name={name} size={32} /></span>
      )}
      {src && logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="absolute -right-0.5 -bottom-0.5 h-5 w-5 rounded-full border-2 border-paper object-cover" loading="lazy" />
      )}
    </span>
  );
}

function ActivityRow({ item, index = 0 }: { item: ActivityItem; index?: number }) {
  const { label, sub } = activityLabel(item);
  const tone = statusTone(label);
  const date = fmtDate(item.created_at);
  return (
    <li className="reveal" style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
      <Link href={`/o/${item.campaign_id}`} className={`row flex min-h-[84px] items-center gap-3 rounded-[18px] px-3 py-2.5 transition-[background,transform] duration-100 active:scale-[0.985] ${tone.hot ? "!bg-surface-2" : ""}`} aria-label={`${KIND_SHORT[item.kind]} for ${item.business_name}: ${item.title}. ${label}. ${formatCredit(item.pay_cents)} ${UNIT[item.kind]}`}>
        <Thumb src={item.cover} kind={item.kind} logo={item.business_logo} name={item.business_name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[14px] leading-[18px] font-700 tracking-[-0.1px]">{KIND_SHORT[item.kind]} · {item.business_name}</span>
          <span className="block truncate text-[12px] leading-4 text-ink-soft">{item.title}</span>
          <span className={`status-text ${tone.cls} mt-0.5 max-w-full`}><span aria-hidden className="status-dot" /><span className="truncate">{label}{sub ? <span className="font-500 text-ink-faint"> · {sub}</span> : <span className="font-500 text-ink-faint"> · {date}</span>}</span></span>
        </span>
        <span className="flex w-[62px] shrink-0 flex-col items-end">
          <span className="tnum font-display text-[17px] leading-5 font-[800] tracking-[-0.2px] text-signal">{formatCredit(item.pay_cents)}</span>
          <span className="text-[10px] leading-3 font-[650] text-ink-faint">{UNIT[item.kind]}</span>
        </span>
        <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
      </Link>
    </li>
  );
}

/** Saved opportunities use the same row shell: media, kind and business, title, money. */
function SavedRow({ card, index = 0 }: { card: Opportunity; index?: number }) {
  const media = card.details.reference_media_url ?? card.details.creative_url ?? card.details.media_url ?? card.business_cover;
  return (
    <li className="reveal" style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}>
      <Link href={`/o/${card.id}`} className="row flex min-h-[84px] items-center gap-3 rounded-[18px] px-3 py-2.5 transition-[background,transform] duration-100 active:scale-[0.985]">
        <Thumb src={media} kind={card.kind} logo={card.business_logo} name={card.business_name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[14px] leading-[18px] font-700 tracking-[-0.1px]">{KIND_SHORT[card.kind]} · {card.business_name}</span>
          <span className="block truncate text-[12px] leading-4 text-ink-soft">{card.title}</span>
          <span className="status-text is-done mt-0.5"><span aria-hidden className="status-dot" />Saved{card.city ? <span className="font-500 text-ink-faint"> · {card.city}</span> : null}</span>
        </span>
        <span className="flex w-[62px] shrink-0 flex-col items-end">
          <span className="tnum font-display text-[17px] leading-5 font-[800] tracking-[-0.2px] text-signal">{formatCredit(card.pay_cents)}</span>
          <span className="text-[10px] leading-3 font-[650] text-ink-faint">{UNIT[card.kind]}</span>
        </span>
        <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
      </Link>
    </li>
  );
}
