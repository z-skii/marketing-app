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

  type Tx = { id: string; when: string; title: string; sub: string; status: { label: string; tone: string }; amount: number; sign: "+" | ""; media: string | null; href: string | null; gross?: number; fee?: number };
  const tx: Tx[] = [
    ...rows.map((e): Tx => {
      const st = EARNING[e.status] ?? { label: e.status, tone: "neutral" as const };
      const title = e.source === "submission" ? `${e.campaign_kind ? KIND_NAME[e.campaign_kind] ?? "Work" : "Work"} approved`
        : e.source === "booking" ? "Car ad month paid" : "Adjustment";
      const gross = e.amount_cents + e.fee_cents;
      const sub = e.campaign_title ?? e.business ?? "";
      return { id: `e-${e.id}`, when: e.created_at, title, sub, status: st, amount: e.amount_cents, sign: "+", media: e.media, href: e.campaign_id ? `/o/${e.campaign_id}` : null, gross, fee: e.fee_cents };
    }),
    ...payouts.map((p): Tx => {
      const st = PAYOUT[p.status] ?? { label: p.status, tone: "neutral" as const };
      const sub = p.status === "paid" && p.processed_at ? `Sent ${fmtDate(p.processed_at)}` : p.status === "rejected" ? "See Messages" : "Usually a few days";
      return { id: `p-${p.id}`, when: p.created_at, title: "Payout", sub, status: st, amount: p.amount_cents, sign: "", media: null, href: null };
    }),
  ].sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

  return (
    <main className="fs-phone-main" id="main">
      <div className="ap-head"><div><h1>Earnings</h1></div></div>

      <div className="fs-earnings-grid" style={{ marginTop: 16 }}>
        <div>
          <section className="ap-balance" aria-labelledby="fs-available">
            <p className="ap-balance-big">{formatMoney(available)}</p>
            <p id="fs-available" className="t-meta" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 12, marginTop: 6 }}>Available</p>
            <div style={{ marginTop: 18 }}>
              {openPayout ? (
                <div className="ap-note is-warm" style={{ marginBottom: 12 }}>
                  <span className="ap-note-text"><span className={`badge is-${PAYOUT[openPayout.status]?.tone === "confirmed" ? "success" : PAYOUT[openPayout.status]?.tone === "problem" ? "alert" : "warning"}`}>{PAYOUT[openPayout.status]?.label ?? openPayout.status}</span> <b style={{ fontWeight: 600 }}>{formatMoney(openPayout.amount_cents)}</b><span className="t-meta" style={{ display: "block", marginTop: 4 }}>Requested {fmtDate(openPayout.created_at)} · usually a few days</span></span>
                </div>
              ) : null}
              <PayoutRequest availableCents={available} minCents={minPayout} feePct={feePct} />
            </div>
          </section>

          <div className="ap-metrics" style={{ ["--n" as string]: requested > 0 ? 3 : 2 }}>
            <div className="ap-metric"><b>{formatMoney(pending)}</b><span>Pending</span></div>
            {requested > 0 && <div className="ap-metric"><b>{formatMoney(requested)}</b><span>Requested</span></div>}
            <div className="ap-metric"><b>{formatMoney(lifetime)}</b><span>Lifetime</span></div>
          </div>
        </div>

        <section aria-labelledby="fs-tx" className="ap-section">
          <div className="ap-section-head"><h2 id="fs-tx">History</h2></div>
          {tx.length === 0 ? (
            <section className="card" style={{ padding: 20, maxWidth: 560 }}>
              <p className="t-h3">No earnings yet.</p>
              <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>Approved work lands here.</p>
              <Link href="/home" className="btn btn-signal" style={{ marginTop: 16 }}>Find work</Link>
            </section>
          ) : (
            <ul className="ap-tx" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {tx.map((t) => {
                const badge = t.status.tone === "confirmed" ? "success" : t.status.tone === "problem" ? "alert" : t.status.tone === "waiting" ? "warning" : "neutral";
                const inner = (
                  <>
                    <span className="ap-tx-thumb" aria-hidden>{t.media ? <MediaPreview src={t.media} alt="" sizes="44px" /> : <Wallet size={20} aria-hidden />}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600, fontSize: 15, lineHeight: "20px" }}>{t.title}</span>
                      <span className="t-meta" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}><span className={`badge is-${badge}`} style={{ minHeight: 22 }}>{t.status.label}</span>{fmtDate(t.when)}</span>
                      {t.sub && <span className="t-meta truncate" style={{ display: "block", marginTop: 2 }}>{t.sub}</span>}
                      {t.gross != null && t.fee != null && t.fee > 0 && (
                        <span className="ap-fee" aria-label={`Gross ${formatMoney(t.gross)}, fee ${formatMoney(t.fee)}, you keep ${formatMoney(t.amount)}`}>
                          <span><b>{formatMoney(t.gross)}</b><span>Gross</span></span>
                          <span><b>{formatMoney(t.fee)}</b><span>Fee ({feePct}%)</span></span>
                          <span><b>{formatMoney(t.amount)}</b><span>Yours</span></span>
                        </span>
                      )}
                    </span>
                    <span className="ap-tx-amount" style={{ color: t.status.tone === "problem" ? "var(--tm-muted)" : t.sign === "+" ? "var(--tm-success)" : undefined, textDecoration: t.status.tone === "problem" ? "line-through" : undefined }}>{t.sign}{formatMoney(t.amount)}</span>
                  </>
                );
                return (
                  <li key={t.id}>
                    {t.href ? <Link href={t.href} className="ap-tx-row" aria-label={`${t.title}, ${t.status.label}, ${formatMoney(t.amount)}`}>{inner}</Link> : <div className="ap-tx-row">{inner}</div>}
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
