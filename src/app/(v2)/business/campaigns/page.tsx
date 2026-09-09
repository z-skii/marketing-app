import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { EmptyState, Money, ScreenHeader, StatusChip } from "@/components/v2/ui";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };
const EARN_KINDS = ["recreate_reel", "instagram_story", "car_ads"];

type Row = {
  id: string; kind: string; title: string; status: string; pay_cents: number; slots: number;
  approved: number; cars_active: number; waiting: number; artwork: number; created_at: string;
};

type Filter = "all" | "needs" | "running" | "drafts" | "done";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "needs", label: "Needs you" },
  { key: "running", label: "Running" },
  { key: "drafts", label: "Drafts" },
  { key: "done", label: "Done" },
];

/**
 * Every campaign the business runs, one row each. The three campaign types
 * only; older kinds show up under Done once they are closed, never as
 * something to run again.
 */
export default async function CampaignsPage({
  searchParams,
}: { searchParams: Promise<{ f?: string; needs?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/campaigns"), searchParams]);
  const business = ctx.activeBusiness;
  const needs = params.needs === "review" || params.needs === "drivers" || params.needs === "artwork" ? params.needs : null;
  const filter: Filter = needs ? "needs" : (FILTERS.find((f) => f.key === params.f)?.key ?? "all");

  const rows = await sql<Row>(
    `select c.id, c.kind::text as kind, c.title, c.status::text as status, c.pay_cents::int as pay_cents, c.slots, c.created_at,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status in ('active', 'completed'))::int as cars_active,
            (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('submitted', 'under_review'))::int
              + (select count(*) from applications a where a.campaign_id = c.id and a.status = 'applied' and c.kind = 'car_ads')::int as waiting,
            (select count(*) from car_bookings k where k.campaign_id = c.id and k.status = 'creative_pending')::int as artwork
       from campaigns c
      where c.business_id = $1
      order by (c.status in ('open', 'paused')) desc, c.created_at desc`,
    [business.id],
  );

  const isDone = (r: Row) => ["closed", "completed"].includes(r.status);
  const legacy = (r: Row) => !EARN_KINDS.includes(r.kind);
  // Older campaign kinds are quarantined: they only appear under Done, once closed.
  const visible = rows.filter((r) => !legacy(r) || isDone(r));
  const needsYou = (r: Row) =>
    needs === "review" ? r.kind !== "car_ads" && r.waiting > 0
    : needs === "drivers" ? r.kind === "car_ads" && r.waiting > 0
    : needs === "artwork" ? r.artwork > 0
    : r.waiting > 0 || r.artwork > 0;
  const shown = visible.filter((r) =>
    filter === "needs" ? needsYou(r)
    : filter === "running" ? ["open", "paused"].includes(r.status)
    : filter === "drafts" ? r.status === "draft"
    : filter === "done" ? isDone(r)
    : !legacy(r));

  const needsLine =
    needs === "review" ? "Campaigns with submissions to review."
    : needs === "drivers" ? "Car campaigns with drivers waiting."
    : needs === "artwork" ? "Accepted drivers waiting on artwork."
    : null;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader
        kicker={business.name} title="Campaigns" unread={ctx.unreadNotifications} showSearch={false}
        right={<Link href="/business/create" className="btn btn-signal shrink-0">+ New</Link>}
      />

      <nav className="pill-row mt-5" aria-label="Filter campaigns">
        {FILTERS.map((f) => (
          <Link key={f.key} href={f.key === "all" ? "/business/campaigns" : `/business/campaigns?f=${f.key}`} aria-current={filter === f.key ? "page" : undefined} className="pill">
            {f.label}
          </Link>
        ))}
      </nav>
      {needsLine && <p className="mt-3 text-sm text-ink-soft">{needsLine}</p>}

      {shown.length === 0 ? (
        <div className="mt-5">
          {filter === "all" ? (
            <EmptyState title="Nothing running yet" body="Start with a Reel, a Story or a car. A few questions and real people get to work." actionHref="/business/create" actionLabel="Create a campaign" />
          ) : filter === "needs" ? (
            <EmptyState title="Nothing is waiting on you" body="Submissions and driver applications land here the moment they arrive." />
          ) : (
            <EmptyState title={filter === "drafts" ? "No drafts" : filter === "running" ? "Nothing running" : "Nothing finished yet"} />
          )}
        </div>
      ) : (
        <ul className="row-list mt-5">
          {shown.map((c) => {
            const car = c.kind === "car_ads";
            const done = car ? c.cars_active : c.approved;
            const pct = c.slots > 0 ? Math.min(100, Math.round((done / c.slots) * 100)) : 0;
            return (
              <li key={c.id}>
                <Link href={`/business/campaigns/${c.id}`} className="card block p-4 md:p-5">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-xs font-700 text-ink-faint">{KIND_LABEL[c.kind] ?? c.kind.replaceAll("_", " ")}</span>
                      <span className="mt-0.5 block font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{c.title}</span>
                    </span>
                    <Money cents={c.pay_cents} size="md" suffix={car ? "/ mo" : undefined} />
                  </span>
                  <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span className="block h-full rounded-full bg-signal" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="mt-2 flex items-center justify-between gap-2 text-sm text-ink-faint">
                    <span className="tnum">
                      {done} of {c.slots} {car ? (c.slots === 1 ? "car" : "cars") : "approved"}
                      {c.waiting > 0 && <span className="font-display font-700 text-signal">{"  ·  "}{c.waiting} waiting</span>}
                      {c.artwork > 0 && <span className="font-display font-700 text-signal">{"  ·  "}{c.artwork} need{c.artwork === 1 ? "s" : ""} artwork</span>}
                    </span>
                    <StatusChip status={c.status} />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
