import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { fmtDate } from "@/lib/v2/opportunities";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { formatMoney } from "@/components/fs/parts";
import { PayoutRequest } from "@/components/fs/work/PayoutRequest";

export const metadata = { title: "Earnings" };
export const dynamic = "force-dynamic";

/**
 * Earnings in Frame Shift: the clearest financial screen in TapMart.
 * Available first, then Pending and Lifetime as a plain record strip,
 * then every real earning and payout request. The five earning states and
 * the four payout states keep their own words. Real cents; nothing moves.
 */
type EarningRow = {
  id: string; amount_cents: number; fee_cents: number; source: string; status: string; created_at: string;
  campaign_id: string | null; campaign_title: string | null; campaign_kind: string | null; media: string | null; business: string | null;
};
type PayoutRow = { id: string; amount_cents: number; status: string; created_at: string; processed_at: string | null };

const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate Reel", instagram_story: "Story ad", car_ads: "Car ad" };
const EARNING: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  pending: { label: "Pending", tone: "waiting" },
  available: { label: "Available", tone: "confirmed" },
  requested: { label: "Requested", tone: "waiting" },
  paid: { label: "Paid", tone: "confirmed" },
  rejected: { label: "Rejected", tone: "problem" },
};
const PAYOUT: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  requested: { label: "Payout requested", tone: "waiting" },
  approved: { label: "Payout approved", tone: "waiting" },
  paid: { label: "Payout paid", tone: "confirmed" },
  rejected: { label: "Payout rejected", tone: "problem" },
};

export default async function EarningsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business");

  const [sums, rows, payouts, settings] = await Promise.all([
    sqlOne<{ available: string; pending: string; requested: string; lifetime: string }>(
      `select coalesce(sum(amount_cents) filter (where status = 'available'), 0)::text as available,
              coalesce(sum(amount_cents) filter (where status = 'pending'), 0)::text as pending,
              coalesce(sum(amount_cents) filter (where status = 'requested'), 0)::text as requested,
              coalesce(sum(amount_cents) filter (where status in ('available', 'requested', 'paid')), 0)::text as lifetime
         from earnings where profile_id = $1`,
      [ctx.user.id],
    ),
    sql<EarningRow>(
      `select e.id, e.amount_cents::int as amount_cents, e.fee_cents::int as fee_cents, e.source, e.status::text as status, e.created_at,
              c.id as campaign_id, c.title as campaign_title, c.kind::text as campaign_kind,
              coalesce(c.details->>'reference_media_url', c.details->>'creative_url', c.details->>'media_url') as media,
              coalesce(b.name, bb.name) as business
         from earnings e
         left join submissions s on e.source = 'submission' and s.id = e.source_id
         left join car_bookings k on e.source = 'booking' and k.id = e.source_id
         left join campaigns c on c.id = coalesce(s.campaign_id, k.campaign_id)
         left join businesses b on b.id = c.business_id
         left join businesses bb on bb.id = k.business_id
        where e.profile_id = $1
        order by e.created_at desc limit 50`,
      [ctx.user.id],
    ),
    sql<PayoutRow>(
      `select id, amount_cents::int as amount_cents, status::text as status, created_at, processed_at
         from payout_requests where creator_user_id = $1 order by created_at desc limit 20`,
      [ctx.user.id],
    ),
    getSettings(),
  ]);

  const available = Number(sums?.available ?? 0);
  const pending = Number(sums?.pending ?? 0);
  const requested = Number(sums?.requested ?? 0);
  const lifetime = Number(sums?.lifetime ?? 0);
  const minPayout = Number(settings.minimum_payout_cents ?? "2500");
  const feePct = Number(settings.platform_fee_pct ?? "15");
  const openPayout = payouts.find((p) => p.status === "requested" || p.status === "approved") ?? null;

  type Tx = { id: string; when: string; title: string; sub: string; status: { label: string; tone: string }; amount: number; sign: "+" | ""; media: string | null; href: string | null };
  const tx: Tx[] = [
    ...rows.map((e): Tx => {
      const st = EARNING[e.status] ?? { label: e.status, tone: "neutral" as const };
      const title = e.source === "submission" ? `${e.campaign_kind ? KIND_NAME[e.campaign_kind] ?? "Work" : "Work"} approved`
        : e.source === "booking" ? "Car ad month paid" : "Adjustment";
      const gross = e.amount_cents + e.fee_cents;
      const sub = [e.campaign_title ?? e.business, e.fee_cents > 0 ? `${formatMoney(gross)} less ${formatMoney(e.fee_cents)} fee` : null].filter(Boolean).join(" · ");
      return { id: `e-${e.id}`, when: e.created_at, title, sub, status: st, amount: e.amount_cents, sign: "+", media: e.media, href: e.campaign_id ? `/o/${e.campaign_id}` : null };
    }),
    ...payouts.map((p): Tx => {
      const st = PAYOUT[p.status] ?? { label: p.status, tone: "neutral" as const };
      const sub = p.status === "paid" && p.processed_at ? `Sent ${fmtDate(p.processed_at)}` : p.status === "rejected" ? "See the note from TapMart in Messages" : "Sent by hand, usually within a few days";
      return { id: `p-${p.id}`, when: p.created_at, title: "Payout to you", sub, status: st, amount: p.amount_cents, sign: "", media: null, href: null };
    }),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <main className="fs-phone-main" id="main">
      <h1 className="fs-t-page" style={{ marginTop: 12 }}>Earnings</h1>

      <div className="fs-earnings-grid">
        <div>
          <section aria-labelledby="fs-available" style={{ marginTop: 16 }}>
            <p id="fs-available" className="fs-t-label" style={{ color: "var(--fs-muted)" }}>Available</p>
            <p className="fs-money-balance" style={{ marginTop: 4 }}>{formatMoney(available)}</p>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>From approved work, after the {feePct}% TapMart fee</p>
            <div style={{ marginTop: 16, maxWidth: 448 }}>
              {openPayout ? (
                <div className="fs-plane">
                  <p className="fs-t-label"><span className={`fs-status is-${PAYOUT[openPayout.status]?.tone ?? "waiting"}`}>{PAYOUT[openPayout.status]?.label ?? openPayout.status}</span> · {formatMoney(openPayout.amount_cents)}</p>
                  <p className="fs-t-meta" style={{ marginTop: 4 }}>Requested {fmtDate(openPayout.created_at)}. TapMart sends it by hand, usually within a few days.</p>
                </div>
              ) : null}
              <div style={{ marginTop: openPayout ? 12 : 0 }}>
                <PayoutRequest availableCents={available} minCents={minPayout} feePct={feePct} />
              </div>
            </div>
          </section>

          <dl className="fs-record-strip" style={{ marginTop: 24 }}>
            <div><dd className="fs-money-record">{formatMoney(pending)}</dd><dt className="fs-t-meta">Pending · not yet released</dt></div>
            {requested > 0 && <div><dd className="fs-money-record">{formatMoney(requested)}</dd><dt className="fs-t-meta">Requested · in a payout</dt></div>}
            <div><dd className="fs-money-record">{formatMoney(lifetime)}</dd><dt className="fs-t-meta">Lifetime · earned on TapMart</dt></div>
          </dl>
        </div>

        <section aria-labelledby="fs-tx" style={{ marginTop: 32 }}>
          <h2 id="fs-tx" className="fs-t-section">Transactions</h2>
          {tx.length === 0 ? (
            <div style={{ marginTop: 8, maxWidth: 480 }}>
              <p className="fs-t-task">No earnings yet.</p>
              <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>Approved Recreate, Story and Car work lands here with its fee shown.</p>
              <Link href="/home" className="fs-btn fs-btn-secondary" style={{ marginTop: 16 }}>Find paid work</Link>
            </div>
          ) : (
            <ul className="fs-tx-list" style={{ marginTop: 4 }}>
              {tx.map((t) => {
                const inner = (
                  <>
                    <span className="fs-media fs-contain fs-tx-media" aria-hidden>
                      {t.media ? <MediaPreview src={t.media} alt="" className="fs-ref-media" sizes="40px" /> : <Wallet size={20} aria-hidden />}
                    </span>
                    <span style={{ minWidth: 0 }}>
                      <span className="fs-t-label" style={{ display: "block" }}>{t.title}</span>
                      <span className="fs-t-meta" style={{ display: "block" }}><span className={`fs-status is-${t.status.tone}`}>{t.status.label}</span> · {fmtDate(t.when)}</span>
                      {t.sub && <span className="fs-t-meta" style={{ display: "block" }}>{t.sub}</span>}
                    </span>
                    <span className="fs-work-money" style={{ color: t.status.tone === "problem" ? "var(--fs-muted)" : undefined, textDecoration: t.status.tone === "problem" ? "line-through" : undefined }}>{t.sign}{formatMoney(t.amount)}</span>
                  </>
                );
                return (
                  <li key={t.id}>
                    {t.href ? <Link href={t.href} className="fs-tx-row" aria-label={`${t.title}, ${t.status.label}, ${formatMoney(t.amount)}`}>{inner}</Link> : <div className="fs-tx-row">{inner}</div>}
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
