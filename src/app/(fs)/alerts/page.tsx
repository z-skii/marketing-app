import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { MarkReadOnView } from "@/app/(v2)/alerts/MarkReadOnView";

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

/** The word for what a notification is about, from its stored category. Actionable kinds come first in the list. */
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
  const rest = rows.filter((r) => r.read_at);
  const ordered = [...unread.sort((a, b) => Number(KIND[b.category]?.actionable ?? false) - Number(KIND[a.category]?.actionable ?? false)), ...rest];

  return (
    <main className="fs-phone-main fs-utility" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Notifications</h1>
        {unread.length > 0 && <span className="fs-t-meta"><span className="fs-status is-waiting">{unread.length} new</span></span>}
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
