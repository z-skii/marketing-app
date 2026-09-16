import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { KIND_LABEL, isEarnKind } from "@/lib/v2/opportunities";
import { MarkReadOnView } from "@/components/fs/inbox/MarkReadOnView";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

/** "2m ago", "3h ago", "5d ago", then the date. */
function relativeTime(iso: string, now: number): string {
  const diff = Math.max(now - new Date(iso).getTime(), 0);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The word for what a notification is about, from its stored category. */
const KIND: Record<string, { word: string; actionable: boolean }> = {
  submission: { word: "Needs review", actionable: true },
  application: { word: "Applicant", actionable: true },
  direct_request: { word: "Request", actionable: true },
  car_offer: { word: "Car ad", actionable: true },
  car_booking: { word: "Car ad", actionable: true },
  content: { word: "Content", actionable: true },
  payout: { word: "Payout", actionable: false },
  message: { word: "Message", actionable: false },
  system: { word: "TapMart", actionable: false },
};

/** Something to do comes before something that happened. An answer to a request is an outcome, not a task. */
function actionable(category: string, title: string): boolean {
  const k = KIND[category];
  if (!k?.actionable) return false;
  if (category === "direct_request" && /accepted|declined|withdrawn|expired/i.test(title)) return false;
  return true;
}

const CAMPAIGN_HREF = /^\/(?:business\/campaigns|o|jobs)\/([0-9a-f-]{36})/i;

/**
 * Notifications: everything that happened, newest first, each row deep
 * linked to the thing itself. Unread is weight and a cobalt dot, never a
 * coloured row. Opening the screen clears the unread state after a moment.
 */
export default async function AlertsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const rows = await sql<{ id: string; category: string; title: string; body: string | null; href: string | null; read_at: string | null; created_at: string }>(
    `select id, category, title, body, href, read_at, created_at from notifications where profile_id = $1 order by created_at desc limit 100`,
    [ctx.user.id],
  );
  const now = new Date().getTime();
  const unread = rows.filter((r) => !r.read_at);
  const ordered = rows.map((r, i) => ({ r, i, act: actionable(r.category, r.title) })).sort((a, b) => Number(b.act) - Number(a.act) || a.i - b.i).map((x) => x.r);
  // The thing each notification points at, from the record itself, so two identical titles can be told apart.
  const campaignIds = Array.from(new Set(rows.map((r) => r.href?.match(CAMPAIGN_HREF)?.[1]).filter((id): id is string => Boolean(id))));
  const campaigns = campaignIds.length
    ? await sql<{ id: string; title: string; kind: string; audience: string; invitee: string | null }>(
        `select c.id, c.title, c.kind::text as kind, c.audience::text as audience,
                (select p.username from campaign_invites i join profiles p on p.id = i.profile_id where i.campaign_id = c.id order by i.created_at desc limit 1) as invitee
           from campaigns c where c.id = any($1::uuid[])`,
        [campaignIds],
      )
    : [];
  const about = (href: string | null): string | null => {
    const id = href?.match(CAMPAIGN_HREF)?.[1];
    const c = id ? campaigns.find((x) => x.id === id) : null;
    if (!c) return null;
    const kind = isEarnKind(c.kind) ? KIND_LABEL[c.kind] : "Campaign";
    return `${kind} · ${c.title}${c.audience === "direct" && c.invitee ? ` · @${c.invitee}` : ""}`;
  };

  return (
    <main className="fs-phone-main fs-utility" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Notifications</h1>
        {unread.length > 0 && <span className="fs-t-label" style={{ color: "var(--fs-muted)" }}>{unread.length} new</span>}
      </div>
      <MarkReadOnView hasUnread={unread.length > 0} />
      {rows.length === 0 ? (
        <div style={{ marginTop: 24, maxWidth: 480 }}>
          <p className="fs-t-task">Nothing yet.</p>
          <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Submissions to review, answers to requests, campaign events, shoot updates and payments appear here.</p>
          <Link href={ctx.mode === "business" ? "/business" : "/home"} className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>{ctx.mode === "business" ? "Find people and cars" : "Browse opportunities"}</Link>
        </div>
      ) : (
        <ul className="fs-notif-list" aria-label="Notifications">
          {ordered.map((n) => {
            const isUnread = !n.read_at;
            const kind = KIND[n.category] ?? { word: n.category.replaceAll("_", " "), actionable: false };
            const inner = (
              <>
                <span className="fs-notif-dot" aria-hidden />
                <span style={{ minWidth: 0 }}>
                  <span className="fs-t-meta" style={{ display: "block" }}>{kind.word}{isUnread ? " · New" : ""}</span>
                  <span className="fs-t-body fs-notif-title" style={{ display: "block" }}>{n.title}</span>
                  {n.body && <span className="fs-t-meta" style={{ display: "block", color: isUnread ? "var(--fs-ink)" : undefined }}>{n.body}</span>}
                  {!n.body && about(n.href) && <span className="fs-t-meta" style={{ display: "block", marginTop: 4 }}>{about(n.href)}</span>}
                </span>
                <span className="fs-t-meta fs-tnum" style={{ whiteSpace: "nowrap" }}>{relativeTime(n.created_at, now)}</span>
              </>
            );
            return <li key={n.id}>{n.href ? <Link href={n.href} className={`fs-notif${isUnread ? " is-unread" : ""}`} aria-label={`${kind.word}: ${n.title}${isUnread ? ", new" : ""}`}>{inner}</Link> : <div className={`fs-notif${isUnread ? " is-unread" : ""}`}>{inner}</div>}</li>;
          })}
        </ul>
      )}
    </main>
  );
}
