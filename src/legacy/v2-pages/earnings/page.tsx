import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { fmtDate } from "@/lib/v2/opportunities";
import { Wallet, Car, DeviceMobile, VideoCamera, CaretRight } from "@phosphor-icons/react/dist/ssr";
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
  campaign_id: string | null;
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
  available: { label: "Available", tone: "rise" },
  requested: { label: "Processing", tone: "ink" },
  paid: { label: "Paid", tone: "rise" },
  pending: { label: "Pending", tone: "faint" },
  rejected: { label: "Failed", tone: "signal" },
};

const TX_TONE: Record<string, string> = { available: "is-review", requested: "is-info", paid: "is-review", pending: "is-warning", rejected: "is-error" };
const PAYOUT_TONE: Record<string, string> = { requested: "is-info", approved: "", paid: "is-review", rejected: "is-error" };

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
              c.id as campaign_id, c.title as campaign_title, c.kind::text as campaign_kind, bb.name as booking_business
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

  const remaining = Math.max(minPayout - available, 0);
  const progress = minPayout > 0 ? Math.min(available / minPayout, 1) : 0;

  type Tx = { id: string; kind: "earning" | "payout"; when: string; title: string; source: string; status: { label: string; tone: string }; amount: number; icon: string | null; href: string | null };
  const tx: Tx[] = [
    ...rows.map((e) => {
      const { line, sub } = describe(e);
      const st = EARNING_STATUS[e.status] ?? { label: e.status, tone: "ink" as const };
      return { id: `e-${e.id}`, kind: "earning" as const, when: e.created_at, title: line, source: sub, status: { label: st.label, tone: TX_TONE[e.status] ?? "is-done" }, amount: e.amount_cents, icon: e.campaign_kind ?? (e.source === "booking" ? "car_ads" : null), href: e.campaign_id ? `/o/${e.campaign_id}` : null };
    }),
    ...payouts.map((p) => {
      const st = PAYOUT_STATUS[p.status] ?? { label: p.status, tone: "ink" as const };
      return { id: `p-${p.id}`, kind: "payout" as const, when: p.created_at, title: "Payout request", source: "To your account", status: { label: st.label, tone: PAYOUT_TONE[p.status] ?? "is-done" }, amount: p.amount_cents, icon: "payout", href: null };
    }),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  const summary = (
    <section aria-label="Your money">
      <p className="eyebrow">Available</p>
      <p className="tnum mt-[5px] font-display text-[46px] leading-[48px] font-[850] tracking-[-1.2px] text-signal">{formatCredit(available)}</p>
      <div className="mt-[18px] grid max-w-[358px] grid-cols-3 gap-[11px]">
        <Stat value={formatCredit(pending)} label="Pending" tone={pending > 0 ? "warning" : "ink"} />
        <Stat value={formatCredit(lifetime)} label="Lifetime" />
        <Stat value={formatCredit(minPayout)} label="Minimum" />
      </div>
    </section>
  );

  const payout = (
    <div>
      <PayoutButton availableCents={available} minCents={minPayout} feePct={feePct} />
      {canRequest ? (
        <p className="mt-2.5 text-[12px] leading-4 text-ink-soft">TapMart pays within a few days. {feePct}% fee already deducted.</p>
      ) : (
        <>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={minPayout} aria-valuenow={available} aria-label="Progress to the minimum payout">
            <div className="h-full rounded-full bg-signal/45" style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="mt-2.5 text-[12px] leading-4 text-ink-soft">Minimum payout is {formatCredit(minPayout)}. {formatCredit(remaining)} more needed. {feePct}% fee already deducted.</p>
        </>
      )}
    </div>
  );

  return (
    <main id="main" className="mx-auto w-full max-w-[1136px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      <div className="hidden rail:flex rail:h-16 rail:items-center">
        <h1 className="font-display text-[30px] leading-9 font-[820] tracking-[-0.8px]">Earnings</h1>
      </div>
      <h1 className="sr-only rail:hidden">Earnings</h1>

      <div className="rail:mt-6 rail:max-w-[860px]">
        {/* Phone: summary then the button. Desktop: summary left, a payout panel right. */}
        <div className="rail:grid rail:grid-cols-[404px_420px] rail:gap-9">
          {summary}
          <div className="mt-[18px] rail:mt-0">
            <div className="rail:rounded-[22px] rail:bg-[image:var(--tm-card-fill)] rail:p-[18px] rail:shadow-[var(--tm-shadow-card)]">
              <p className="hidden font-display text-[18px] leading-[22px] font-[780] rail:mb-3 rail:block">Payout</p>
              {payout}
            </div>
          </div>
        </div>

        <section className="mt-6 rail:mt-8" aria-labelledby="tx-title">
          <h2 id="tx-title" className="eyebrow mb-2.5">Transactions</h2>
          {tx.length === 0 ? (
            <div className="card max-w-[420px] p-[18px]">
              <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-surface-2 text-ink-2"><Wallet size={22} aria-hidden /></span>
              <p className="mt-4 font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">No earnings yet</p>
              <p className="mt-1.5 text-[14px] leading-5 text-ink-soft">Find a Recreate, Story, or Car opportunity to start earning.</p>
              <Link href="/home" className="btn btn-signal mt-[18px] w-full">Open Home</Link>
            </div>
          ) : (
            <ul className="overflow-hidden rounded-[16px] bg-surface py-1.5 rail:rounded-[20px]">
              {tx.map((t) => {
                const inner = (
                  <>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-surface-2 text-ink-2 rail:h-11 rail:w-11"><KindIcon kind={t.icon} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-[14px] leading-[18px] font-700">{t.title}</span>
                      <span className={`status-text ${t.status.tone} max-w-full !font-500 !text-ink-soft`}><span aria-hidden className="status-dot" /><span className="truncate">{t.status.label} · {fmtDate(t.when)} · {t.source}</span></span>
                    </span>
                    <span className={`tnum font-display text-[17px] leading-5 font-[800] tracking-[-0.2px] ${t.kind === "payout" ? "text-ink" : t.status.tone === "is-warning" ? "text-warn" : t.status.tone === "is-error" ? "text-alert" : t.status.tone === "is-info" ? "text-info" : "text-signal"}`}>{t.kind === "payout" ? "" : "+"}{formatCredit(t.amount)}</span>
                    {t.href && <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />}
                  </>
                );
                const cls = "flex min-h-[70px] items-center gap-3 px-[13px] py-2.5 rail:min-h-[72px] rail:px-4";
                return (
                  <li key={t.id} className="border-t border-rule first:border-t-0 [&>*]:ml-0">
                    {t.href ? <Link href={t.href} className={`${cls} transition-[background] active:bg-[color:var(--tm-pressed)] can-hover:hover:bg-surface-3`}>{inner}</Link> : <div className={cls}>{inner}</div>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Stat({ value, label, tone = "ink" }: { value: string; label: string; tone?: "ink" | "warning" }) {
  return (
    <div className="min-w-0">
      <p className={`tnum truncate font-display text-[18px] leading-5 font-[780] tracking-[-0.25px] ${tone === "warning" ? "text-warn" : "text-ink"}`}>{value}</p>
      <p className="mt-0.5 text-[10px] leading-3 font-[550] tracking-[0.1px] uppercase text-ink-soft">{label}</p>
    </div>
  );
}

function KindIcon({ kind }: { kind: string | null }) {
  if (kind === "car_ads") return <Car size={18} aria-hidden />;
  if (kind === "instagram_story") return <DeviceMobile size={18} aria-hidden />;
  if (kind === "recreate_reel") return <VideoCamera size={18} aria-hidden />;
  return <Wallet size={18} aria-hidden />;
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
