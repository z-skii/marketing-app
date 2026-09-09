import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, SectionTitle } from "@/components/v2/ui";
import { MarkReadOnView } from "./MarkReadOnView";

export const metadata = { title: "Alerts" };
export const dynamic = "force-dynamic";

const CATEGORY_ICON: Record<string, string> = {
  opportunity: "$", submission: "✓", application: "→", car_offer: "⇄",
  car_booking: "▣", message: "✉", payout: "$", system: "•",
};

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

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <h1 className="font-display text-2xl font-900 tracking-[-0.03em]">Alerts</h1>
      <MarkReadOnView hasUnread={rows.some((r) => !r.read_at)} />

      <section className="mt-4">
        <SectionTitle count={rows.length}>Activity</SectionTitle>
        {rows.length === 0 && (
          <div className="mt-3">
            <EmptyState
              title="Nothing yet"
              body="Job matches, approvals, offers and payments show up here."
              actionHref="/home" actionLabel="Browse opportunities"
            />
          </div>
        )}
        <ul className="mt-3 flex flex-col">
          {rows.map((n) => {
            const inner = (
              <span className={`flex gap-3 border-b border-rule px-1 py-3 ${n.read_at ? "" : "bg-signal/5"}`}>
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center border border-ink font-mono text-sm font-600">
                  {CATEGORY_ICON[n.category] ?? "•"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read_at ? "" : "font-600"}`}>{n.title}</span>
                  {n.body && <span className="block text-xs text-ink-faint">{n.body}</span>}
                  <span className="mt-0.5 block font-mono text-[0.625rem] text-ink-faint">
                    {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </span>
                {!n.read_at && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />}
              </span>
            );
            return (
              <li key={n.id}>
                {n.href ? <Link href={n.href} className="block hover:bg-paper">{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
