import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { fmtDate } from "@/lib/v2/opportunities";
import { Chip, Money, ScreenHeader } from "@/components/v2/ui";
import { PayoutButton } from "./PayoutButton";

export const metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

/**
 * Money I made. Three numbers, one button, then every earning with the work
 * it came from. Payouts are manual today and the screen says so.
 */

type EarningRow = {
  id: string;
  amount_cents: number;
  source: string;
  status: string;
  created_at: string;
  campaign_title: string | null;
  campaign_kind: string | null;
  booking_business: string | null;
};

const KIND_NAME: Record<string, string> = {
  recreate_reel: "Recreate Reel",
  instagram_story: "Instagram Story",
  car_ads: "Car campaign",
};

const EARNING_STATUS: Record<string, { label: string; tone: "ink" | "signal" | "faint" | "rise" }> = {
  available: { label: "Ready", tone: "rise" },
  requested: { label: "Processing", tone: "ink" },
  paid: { label: "Paid", tone: "rise" },
  pending: { label: "Pending", tone: "faint" },
  rejected: { label: "Failed", tone: "signal" },
};

const PAYOUT_STATUS: Record<string, { label: string; tone: "ink" | "signal" | "faint" | "rise" }> = {
  requested: { label: "Requested", tone: "ink" },
  approved: { label: "Approved", tone: "rise" },
  paid: { label: "Paid", tone: "rise" },
  rejected: { label: "Rejected", tone: "signal" },
};

export default async function EarningsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const [sums, rows, payouts, settings] = await Promise.all([
    sqlOne<{ available: string; pending: string; lifetime: string }>(
      `select
         coalesce(sum(amount_cents) filter (where status = 'available'), 0)::text as available,
         coalesce(sum(amount_cents) filter (where status in ('pending', 'requested')), 0)::text as pending,
         coalesce(sum(amount_cents) filter (where status <> 'rejected'), 0)::text as lifetime
       from earnings where profile_id = $1`,
      [ctx.user.id],
    ),
    sql<EarningRow>(
      `select e.id, e.amount_cents::int as amount_cents, e.source, e.status::text as status, e.created_at,
              c.title as campaign_title, c.kind::text as campaign_kind, bb.name as booking_business
         from earnings e
         left join submissions s on e.source = 'submission' and s.id = e.source_id
         left join campaigns c on c.id = s.campaign_id
         left join car_bookings k on e.source = 'booking' and k.id = e.source_id
         left join businesses bb on bb.id = k.business_id
        where e.profile_id = $1
        order by e.created_at desc limit 50`,
      [ctx.user.id],
    ),
    sql<{ id: string; amount_cents: number; status: string; created_at: string }>(
      `select id, amount_cents::int as amount_cents, status::text as status, created_at
         from payout_requests where creator_user_id = $1 order by created_at desc limit 10`,
      [ctx.user.id],
    ),
    getSettings(),
  ]);

  const available = Number(sums?.available ?? 0);
  const pending = Number(sums?.pending ?? 0);
  const lifetime = Number(sums?.lifetime ?? 0);
  const minPayout = Number(settings.minimum_payout_cents ?? "2500");
  const feePct = Number(settings.platform_fee_pct ?? "15");
  const canRequest = available >= minPayout;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} title="Earnings" showSearch={false} unread={ctx.unreadNotifications} />

      <section className="mt-6" aria-label="Your money">
        <p className="tnum font-display text-[3rem] leading-none font-800 tracking-[-0.04em] text-signal md:text-[3.5rem]">{formatCredit(available)}</p>
        <p className="mt-1.5 text-sm text-ink-soft">Available</p>
        <div className="mt-6 flex gap-10">
          <div>
            <p className="tnum font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">{formatCredit(pending)}</p>
            <p className="mt-1.5 text-sm text-ink-faint">Pending</p>
          </div>
          <div>
            <p className="tnum font-display text-[1.375rem] leading-none font-800 tracking-[-0.03em]">{formatCredit(lifetime)}</p>
            <p className="mt-1.5 text-sm text-ink-faint">Lifetime</p>
          </div>
        </div>
        <div className="mt-6">
          {canRequest ? (
            <PayoutButton availableCents={available} minCents={minPayout} />
          ) : (
            <p className="text-sm text-ink-soft">Payouts start at {formatCredit(minPayout)}.{available > 0 ? ` ${formatCredit(available)} so far.` : ""}</p>
          )}
          <p className="mt-2 text-xs text-ink-faint">Sent by TapMart within a few days. The {feePct}% fee is already out.</p>
        </div>
      </section>

      <section className="mt-9">
        <h2 className="eyebrow">History</h2>
        {rows.length === 0 && (
          <p className="mt-3 text-sm text-ink-soft">
            Approved versions, stories and car ad payments land here.{" "}
            <Link href="/home" className="font-display font-600 text-ink underline decoration-ink-faint underline-offset-4">Find something that pays</Link>
          </p>
        )}
        <ul className="mt-1 divide-y divide-rule">
          {rows.map((e) => {
            const { line, sub } = describe(e);
            const st = EARNING_STATUS[e.status] ?? { label: e.status, tone: "ink" as const };
            return (
              <li key={e.id} className="flex min-h-16 items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-[0.9375rem] font-700">{line}</span>
                  <span className="block truncate text-sm text-ink-faint">{sub}{st.label !== "Paid" ? `  ·  ${st.label}` : ""}</span>
                </span>
                <span className="flex items-baseline">
                  <span className="font-display text-base font-800 text-signal" aria-hidden>+</span>
                  <Money cents={e.amount_cents} size="sm" />
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {payouts.length > 0 && (
        <section className="mt-8">
          <h2 className="eyebrow">Payouts</h2>
          <ul className="mt-1 divide-y divide-rule">
            {payouts.map((p) => {
              const st = PAYOUT_STATUS[p.status] ?? { label: p.status, tone: "ink" as const };
              return (
                <li key={p.id} className="flex min-h-16 items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[0.9375rem] font-700">Payout request</span>
                    <span className="block text-sm text-ink-faint">
                      {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </span>
                  <Chip tone={st.tone}>{st.label}</Chip>
                  <Money cents={p.amount_cents} size="sm" tone="ink" />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}

/** One human line per earning: what it was for, and where it came from. */
function describe(e: EarningRow): { line: string; sub: string } {
  const when = fmtDate(e.created_at);
  if (e.source === "submission") {
    const kind = e.campaign_kind ? KIND_NAME[e.campaign_kind] : null;
    return {
      line: kind ? `${kind} approved` : "Approved work",
      sub: [e.campaign_title, when].filter(Boolean).join("  ·  "),
    };
  }
  if (e.source === "booking") {
    return { line: "Car advertising payment", sub: [e.booking_business, when].filter(Boolean).join("  ·  ") };
  }
  return { line: "Adjustment", sub: when };
}
