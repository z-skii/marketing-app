import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import {
  activityBucket, activityLabel, getActivity, getSavedOpportunities,
  type ActivityItem, type EarnKind, type Opportunity,
} from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { formatMoney } from "@/components/fs/parts";
import { Badge } from "@/ds/ui";
import { ImageIcon, ArrowRightIcon } from "@/ds/icons";

export const metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

/**
 * Activity: the person's work as a visual timeline. What needs me, what
 * is being reviewed, what is done, and what I saved: four views of the
 * same real records (applications, submissions, direct requests, car
 * bookings); no new statuses. Each item shows the source media, the next
 * required action, the literal status, the money, and where the work is
 * on its rail: Accepted, Creating, Submitted, In review, Approved, Paid.
 */
type Tab = "todo" | "review" | "history" | "saved";
const TABS: { key: Tab; label: string; bucket: "active" | "submitted" | "completed" | null }[] = [
  { key: "todo", label: "To do", bucket: "active" },
  { key: "review", label: "In review", bucket: "submitted" },
  { key: "history", label: "History", bucket: "completed" },
  { key: "saved", label: "Saved", bucket: null },
];
const ALIAS: Record<string, Tab> = { active: "todo", submitted: "review", completed: "history" };

const EMPTY: Record<Tab, { title: string; body: string }> = {
  todo: { title: "Nothing to do.", body: "Accepted work and revisions land here." },
  review: { title: "Nothing in review.", body: "Work you sent shows here." },
  history: { title: "No finished work yet.", body: "Approved and paid work lands here." },
  saved: { title: "Nothing saved.", body: "Save work from Home." },
};

const KIND: Record<EarnKind, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car" };
const BASIS: Record<EarnKind, string> = { recreate_reel: "per video", instagram_story: "per Story", car_ads: "a month" };

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
  if (tab === "todo") rows.sort((a, b) => Number(needsMe(b)) - Number(needsMe(a)));

  return (
    <main className="fs-phone-main fs-narrow" id="main">
      <div className="ap-head"><div><h1>Activity</h1></div></div>
      <nav className="ap-chips" aria-label="Activity views">
        {TABS.map((t) => (
          <Link key={t.key} href={t.key === "todo" ? "/activity" : `/activity?tab=${t.key}`} className="pill" aria-current={tab === t.key ? "page" : undefined}>
            {t.label}{counts[t.key] > 0 && <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }} aria-label={`${counts[t.key]} items`}>{counts[t.key]}</span>}
          </Link>
        ))}
      </nav>

      {tab === "saved" ? (
        saved.length === 0 ? <Empty tab={tab} /> : <ul className="ap-work" aria-label="Saved">{saved.map((card) => <li key={card.id}><SavedRow card={card} /></li>)}</ul>
      ) : rows.length === 0 ? <Empty tab={tab} /> : (
        <ul className="ap-work" aria-label={TABS.find((t) => t.key === tab)!.label}>{rows.map((it) => <li key={`${it.record}-${it.id}`}><WorkRow item={it} /></li>)}</ul>
      )}
    </main>
  );
}

function Empty({ tab }: { tab: Tab }) {
  const e = EMPTY[tab];
  return (
    <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }}>
      <p className="t-h3">{e.title}</p>
      <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>{e.body}</p>
      <Link href="/home" className="btn btn-signal" style={{ marginTop: 16 }}>Find work <ArrowRightIcon size={16} aria-hidden /></Link>
    </section>
  );
}

function needsMe(it: ActivityItem): boolean {
  if (it.record === "invite") return it.status === "sent" || it.status === "accepted";
  if (it.record === "submission") return it.status === "revision_requested";
  if (it.record === "application") return it.status === "accepted" && it.kind !== "car_ads";
  return it.status === "proof_required";
}

function nextAction(it: ActivityItem): { text: string; mine: boolean } {
  const k = it.kind;
  if (it.record === "invite") {
    if (it.status === "sent") return { text: "Accept or decline", mine: true };
    if (it.status === "accepted") return { text: k === "instagram_story" ? "Post the Story" : "Film your version", mine: true };
  }
  if (it.record === "submission" && it.status === "revision_requested") return { text: k === "instagram_story" ? "Send new proof" : "Upload new version", mine: true };
  if (it.record === "application") {
    if (it.status === "accepted") return { text: k === "instagram_story" ? "Post the Story" : k === "car_ads" ? "Artwork in progress" : "Film your version", mine: k !== "car_ads" };
    if (it.status === "applied") return { text: "Waiting", mine: false };
  }
  if (it.record === "booking") {
    if (it.status === "proof_required") return { text: "Send car photo", mine: true };
    if (["creative_pending", "installation_pending", "active", "disputed"].includes(it.status)) return { text: "View booking", mine: false };
  }
  const { sub } = activityLabel(it);
  return { text: sub, mine: false };
}

type Tone = "success" | "warning" | "alert" | "neutral" | "info";
function tone(it: ActivityItem): Tone {
  const s = it.status;
  if (it.record === "submission") return ["approved", "paid"].includes(s) ? "success" : s === "rejected" ? "alert" : s === "revision_requested" ? "warning" : "info";
  if (it.record === "invite") return s === "sent" ? "warning" : s === "accepted" ? "success" : "neutral";
  if (it.record === "application") return s === "accepted" ? "success" : s === "applied" ? "info" : "neutral";
  if (s === "active" || s === "completed") return "success";
  if (s === "cancelled") return "neutral";
  if (s === "disputed") return "alert";
  return "warning";
}

/** Where the work stands on its rail. `now` is the current stage, `done` the stages behind it; `warn` marks a stage that needs fixing. */
function rail(it: ActivityItem): { stages: string[]; now: number; warn: boolean } | null {
  const s = it.status;
  if (it.record === "booking") {
    const stages = ["Accepted", "Installation", "Proof", "Running", "Paid"];
    const now = s === "creative_pending" ? 0 : s === "installation_pending" ? 1 : s === "proof_required" ? 2 : s === "active" || s === "disputed" ? 3 : s === "completed" ? 5 : -1;
    return now < 0 ? null : { stages, now, warn: s === "proof_required" || s === "disputed" };
  }
  const stages = ["Accepted", "Creating", "Submitted", "In review", "Approved", "Paid"];
  if (it.record === "submission") {
    const now = s === "revision_requested" ? 2 : s === "submitted" || s === "under_review" ? 3 : s === "approved" ? 4 : s === "paid" ? 6 : -1;
    return now < 0 ? null : { stages, now, warn: s === "revision_requested" };
  }
  if (it.record === "invite") return s === "accepted" ? { stages, now: 1, warn: false } : s === "sent" ? { stages, now: 0, warn: false } : null;
  if (it.record === "application") return s === "accepted" ? { stages, now: 1, warn: false } : s === "applied" ? { stages, now: 0, warn: false } : null;
  return null;
}

const BOOKING_STATE: Record<string, string> = { creative_pending: "Artwork", installation_pending: "Install", active: "Running", disputed: "Disputed" };

function Thumb({ src }: { src: string | null }) {
  return <span className="ap-work-thumb" aria-hidden>{src ? <MediaPreview src={src} alt="" sizes="88px" /> : <ImageIcon size={24} aria-hidden />}</span>;
}

function Rail({ r }: { r: NonNullable<ReturnType<typeof rail>> }) {
  return (
    <div aria-label={`Stage ${Math.min(r.now + 1, r.stages.length)} of ${r.stages.length}: ${r.stages[Math.min(r.now, r.stages.length - 1)]}`}>
      <div className="ap-rail" aria-hidden>
        {r.stages.map((s, i) => <span key={s} className={i < r.now ? "is-done" : i === r.now ? (r.warn ? "is-warn" : "is-now") : ""} />)}
      </div>
      <div className="ap-rail-labels" aria-hidden><span>{r.stages[0]}</span><span>{r.stages[r.stages.length - 1]}</span></div>
    </div>
  );
}

function WorkRow({ item }: { item: ActivityItem }) {
  const label = item.record === "booking" && BOOKING_STATE[item.status] ? BOOKING_STATE[item.status] : activityLabel(item).label;
  const action = nextAction(item);
  const first = action.text || label;
  const r = rail(item);
  return (
    <article className="ap-work-item" aria-label={`${first}. ${label}. ${KIND[item.kind]} for ${item.business_name}: ${item.title}. ${formatMoney(item.pay_cents)} ${BASIS[item.kind]}`}>
      <Thumb src={item.cover} />
      <div className="ap-work-main">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={tone(item)} dot>{label}</Badge>
          {action.mine && <Badge tone="red">Your move</Badge>}
        </div>
        <h2 className="ap-work-title"><Link href={`/o/${item.campaign_id}`}>{first}</Link></h2>
        <p className="ap-work-meta">{item.business_name} · {item.title}</p>
        {r && <Rail r={r} />}
      </div>
      <span className="ap-work-money">{formatMoney(item.pay_cents)}<span className="ap-work-meta" style={{ display: "block", fontWeight: 400 }}>{BASIS[item.kind]}</span></span>
    </article>
  );
}

function SavedRow({ card }: { card: Opportunity }) {
  const media = card.details.reference_media_url ?? card.details.creative_url ?? card.details.media_url ?? card.business_cover;
  return (
    <article className="ap-work-item" aria-label={`${card.title}. Saved. ${KIND[card.kind]} for ${card.business_name}. ${formatMoney(card.pay_cents)} ${BASIS[card.kind]}`}>
      <Thumb src={media} />
      <div className="ap-work-main">
        <div><Badge tone="neutral" dot>Saved{card.city ? ` · ${card.city}` : ""}</Badge></div>
        <h2 className="ap-work-title"><Link href={`/o/${card.id}`}>{card.title}</Link></h2>
        <p className="ap-work-meta">{KIND[card.kind]} · {card.business_name}</p>
      </div>
      <span className="ap-work-money">{formatMoney(card.pay_cents)}<span className="ap-work-meta" style={{ display: "block", fontWeight: 400 }}>{BASIS[card.kind]}</span></span>
    </article>
  );
}
