import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  activityBucket, activityLabel, fmtDate, getActivity, getSavedOpportunities,
  type ActivityItem, type EarnKind, type Opportunity,
} from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { formatMoney } from "@/components/fs/parts";

export const metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

/**
 * Activity in Frame Shift: what needs me, what is being reviewed, what is
 * done, and what I saved. Four views of the same real records
 * (applications, submissions, direct requests, car bookings); no new
 * statuses. Each row leads with the next required action, then the
 * status word, the kind and business, the money and the source media.
 */
type Tab = "todo" | "review" | "history" | "saved";
const TABS: { key: Tab; label: string; bucket: "active" | "submitted" | "completed" | null }[] = [
  { key: "todo", label: "To do", bucket: "active" },
  { key: "review", label: "In review", bucket: "submitted" },
  { key: "history", label: "History", bucket: "completed" },
  { key: "saved", label: "Saved", bucket: null },
];
/** Old links keep working. */
const ALIAS: Record<string, Tab> = { active: "todo", submitted: "review", completed: "history" };

const EMPTY: Record<Tab, { title: string; body: string }> = {
  todo: { title: "Nothing needs you right now.", body: "Accepted work, revisions and direct requests land here." },
  review: { title: "Nothing in review.", body: "Work waiting on a business appears here after you send it." },
  history: { title: "No finished work yet.", body: "Approved, paid and closed work lands here." },
  saved: { title: "Nothing saved.", body: "Save work from Home to keep it here." },
};

const KIND: Record<EarnKind, string> = { recreate_reel: "Recreate Reel", instagram_story: "Story ad", car_ads: "Car ad" };
const BASIS: Record<EarnKind, string> = { recreate_reel: "per approved version", instagram_story: "after approval", car_ads: "per month" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const raw = params.tab ?? "todo";
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : ALIAS[raw] ?? "todo";
  const [items, saved] = await Promise.all([getActivity(ctx.user.id), getSavedOpportunities(ctx.user.id)]);
  const counts: Record<Tab, number> = {
    todo: items.filter((it) => activityBucket(it) === "active").length,
    review: items.filter((it) => activityBucket(it) === "submitted").length,
    history: items.filter((it) => activityBucket(it) === "completed").length,
    saved: saved.length,
  };
  const bucket = TABS.find((t) => t.key === tab)!.bucket;
  const rows = bucket ? items.filter((it) => activityBucket(it) === bucket) : [];
  // What needs the person comes before what waits on a business.
  if (tab === "todo") rows.sort((a, b) => Number(needsMe(b)) - Number(needsMe(a)));

  return (
    <main className="fs-phone-main fs-narrow" id="main">
      <h1 className="fs-t-page" style={{ marginTop: 12 }}>Activity</h1>
      <nav className="fs-filters is-work" aria-label="Activity views" style={{ marginTop: 12 }}>
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "todo" ? "/activity" : `/activity?tab=${t.key}`} aria-current={tab === t.key ? "page" : undefined}>
            {t.label}{counts[t.key] > 0 && <span className="fs-count" aria-label={`${counts[t.key]} items`}>{counts[t.key]}</span>}
          </Link>
        ))}
      </nav>

      {tab === "saved" ? (
        saved.length === 0 ? <Empty tab={tab} /> : (
          <ul className="fs-work-list" style={{ marginTop: 8 }}>
            {saved.map((card) => <li key={card.id}><SavedRow card={card} /></li>)}
          </ul>
        )
      ) : rows.length === 0 ? <Empty tab={tab} /> : (
        <ul className="fs-work-list" style={{ marginTop: 8 }}>
          {rows.map((it) => <li key={`${it.record}-${it.id}`}><WorkRow item={it} /></li>)}
        </ul>
      )}
    </main>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const e = EMPTY[tab];
  return (
    <div style={{ marginTop: 24, maxWidth: 480 }}>
      <p className="fs-t-task">{e.title}</p>
      <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>{e.body}</p>
      <Link href="/home" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Find paid work</Link>
    </div>
  );
}

/** True when the next move is the person's, not a business's. */
function needsMe(it: ActivityItem): boolean {
  if (it.record === "invite") return it.status === "sent" || it.status === "accepted";
  if (it.record === "submission") return it.status === "revision_requested";
  if (it.record === "application") return it.status === "accepted" && it.kind !== "car_ads";
  return it.status === "proof_required";
}

/** The next required action in the person's words, or what is being waited for. */
function nextAction(it: ActivityItem): { text: string; mine: boolean } {
  const k = it.kind;
  if (it.record === "invite") {
    if (it.status === "sent") return { text: "Accept or decline", mine: true };
    if (it.status === "accepted") return { text: k === "instagram_story" ? "Post the Story and send proof" : "Film and upload your version", mine: true };
  }
  if (it.record === "submission" && it.status === "revision_requested") {
    return { text: k === "instagram_story" ? "Send new proof" : "Upload a new version", mine: true };
  }
  if (it.record === "application") {
    if (it.status === "accepted") return { text: k === "instagram_story" ? "Post the Story and send proof" : k === "car_ads" ? "Artwork is being prepared" : "Film and upload your version", mine: k !== "car_ads" };
    if (it.status === "applied") return { text: "Waiting for the business", mine: false };
  }
  if (it.record === "booking") {
    if (it.status === "proof_required") return { text: "Upload a photo of the car", mine: true };
    // Waiting on the business: the row opens the booking; the literal state sits beneath.
    if (["creative_pending", "installation_pending", "active", "disputed"].includes(it.status)) return { text: "View booking", mine: false };
  }
  const { sub } = activityLabel(it);
  return { text: sub, mine: false };
}

function tone(it: ActivityItem): "confirmed" | "waiting" | "problem" | "neutral" {
  const s = it.status;
  if (it.record === "submission") return ["approved", "paid"].includes(s) ? "confirmed" : s === "rejected" ? "problem" : "waiting";
  if (it.record === "invite") return s === "sent" ? "waiting" : s === "accepted" ? "confirmed" : "neutral";
  if (it.record === "application") return s === "accepted" ? "confirmed" : s === "applied" ? "waiting" : "neutral";
  if (s === "active" || s === "completed") return "confirmed";
  if (s === "cancelled") return "neutral";
  if (s === "disputed") return "problem";
  return "waiting";
}

/** Literal booking states for the row's status line; the lib's labels stay for the rest. */
const BOOKING_STATE: Record<string, string> = { creative_pending: "Accepted · artwork being prepared", installation_pending: "Awaiting installation", active: "Running · paid monthly", disputed: "Under review by TapMart" };

function WorkRow({ item }: { item: ActivityItem }) {
  const label = item.record === "booking" && BOOKING_STATE[item.status] ? BOOKING_STATE[item.status] : activityLabel(item).label;
  const action = nextAction(item);
  const t = tone(item);
  const first = action.text || label;
  return (
    <Link href={`/o/${item.campaign_id}`} className="fs-work-row" aria-label={`${first}. ${label}. ${KIND[item.kind]} for ${item.business_name}: ${item.title}. ${formatMoney(item.pay_cents)} ${BASIS[item.kind]}`}>
      <span className="fs-media fs-contain fs-work-media">
        {item.cover ? <MediaPreview src={item.cover} alt="" className="fs-ref-media" sizes="56px" /> : null}
      </span>
      <span className="fs-work-info">
        <span className="fs-work-title">{first}</span>
        {first !== label && <span className={`fs-status is-${t}`} style={{ display: "block", marginTop: 4 }}>{label}</span>}
        <span className="fs-t-meta" style={{ display: "block", marginTop: 4 }}>{KIND[item.kind]} · {item.business_name} · {item.title}</span>
        <span className="fs-work-money-line"><span className="fs-work-money">{formatMoney(item.pay_cents)}</span> <span className="fs-t-meta">{BASIS[item.kind]}</span></span>
      </span>
    </Link>
  );
}

function SavedRow({ card }: { card: Opportunity }) {
  const media = card.details.reference_media_url ?? card.details.creative_url ?? card.details.media_url ?? card.business_cover;
  return (
    <Link href={`/o/${card.id}`} className="fs-work-row" aria-label={`${card.title}. Saved. ${KIND[card.kind]} for ${card.business_name}. ${formatMoney(card.pay_cents)} ${BASIS[card.kind]}`}>
      <span className="fs-media fs-contain fs-work-media">
        {media ? <MediaPreview src={media} alt="" className="fs-ref-media" sizes="56px" /> : null}
      </span>
      <span className="fs-work-info">
        <span className="fs-work-title">{card.title}</span>
        <span className="fs-status is-neutral" style={{ display: "block", marginTop: 4 }}>Saved{card.city ? ` · ${card.city}` : ""}</span>
        <span className="fs-t-meta" style={{ display: "block", marginTop: 4 }}>{KIND[card.kind]} · {card.business_name}</span>
        <span className="fs-work-money-line"><span className="fs-work-money">{formatMoney(card.pay_cents)}</span> <span className="fs-t-meta">{BASIS[card.kind]}</span></span>
      </span>
    </Link>
  );
}
