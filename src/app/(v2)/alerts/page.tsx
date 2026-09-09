import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, ScreenHeader } from "@/components/v2/ui";
import { MarkReadOnView } from "./MarkReadOnView";

export const metadata = { title: "Alerts" };
export const dynamic = "force-dynamic";

/** "2m", "3h", "5d", then the date. Short enough to sit at the end of a row. */
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

/** The activity feed: everything that happened, newest first, deep-linked. */
export default async function AlertsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const rows = await sql<{
    id: string; category: string; title: string; body: string | null;
    href: string | null; read_at: string | null; created_at: string;
  }>(
    `select id, category, title, body, href, read_at, created_at
       from notifications where profile_id = $1
      order by created_at desc limit 100`,
    [ctx.user.id],
  );
  const now = new Date().getTime();
  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        title="Notifications"
        kicker={unread > 0 ? `${unread} new` : rows.length > 0 ? "You're all caught up" : undefined}
        unread={ctx.unreadNotifications}
        showSearch={false}
      />
      <MarkReadOnView hasUnread={unread > 0} />

      {rows.length === 0 && (
        <div className="mt-6">
          <EmptyState
            title="Nothing yet"
            body="Job matches, approvals, offers and payments show up here."
            actionHref="/home" actionLabel="Browse opportunities"
          />
        </div>
      )}

      <ul className="row-list mt-5">
        {rows.map((n) => {
          const isUnread = !n.read_at;
          const inner = (
            <>
              <span className="min-w-0 flex-1">
                <span className={`block font-display text-[0.9375rem] leading-snug ${isUnread ? "font-700 text-ink" : "font-600 text-ink-soft"}`}>
                  {n.title}
                </span>
                {n.body && <span className={`mt-0.5 block text-sm ${isUnread ? "text-ink-soft" : "text-ink-faint"}`}>{n.body}</span>}
              </span>
              <span className="shrink-0 text-sm text-ink-faint">{relativeTime(n.created_at, now)}</span>
            </>
          );
          return (
            <li key={n.id}>
              {n.href ? (
                <Link href={n.href} className="card flex items-start gap-3 p-4">{inner}</Link>
              ) : (
                <div className="card flex items-start gap-3 p-4">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
