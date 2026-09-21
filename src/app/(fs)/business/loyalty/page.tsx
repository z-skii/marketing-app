import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { getBrandKit } from "@/lib/business/brand";
import { sqlOne } from "@/lib/db";
import { LoyaltyPreview } from "./LoyaltyPreview";
import { UsersIcon, RefreshIcon, GiftIcon, HandshakeIcon, BellIcon, RobotIcon, PaletteIcon, ArrowRightIcon, QrIcon } from "@/ds/icons";

export const metadata = { title: "Loyalty" };
export const dynamic = "force-dynamic";

/**
 * Business Loyalty: the mini operating system it will be, shown in a
 * clearly disabled state. The card preview uses the business's real name,
 * brand colours and logo; the QR opens the business's real TapMart page;
 * every counter says "not running" instead of a number, because no
 * program, member, visit, reward or Wallet pass is stored today.
 */
export default async function BusinessLoyaltyPage() {
  const ctx = await requireBusinessContext("/business/loyalty");
  const business = ctx.activeBusiness;
  const [record, details] = await Promise.all([
    getBrandKit(business.id).catch(() => null),
    sqlOne<{ logo_url: string | null }>(`select logo_url from businesses where id = $1`, [business.id]),
  ]);
  const palette = record?.kit.palette ?? [];
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapmart.live").replace(/\/$/, "");
  const joinUrl = `${host}/b/${business.slug}`;
  const counters = [["Members", UsersIcon], ["Repeat visits", RefreshIcon], ["Rewards redeemed", GiftIcon], ["Referrals", HandshakeIcon]] as const;
  return (
    <main className="fs-phone-main" id="main">
      <div className="ap-head"><div><span className="badge is-ink">Coming soon</span><h1 style={{ marginTop: 10 }}>Loyalty</h1><p className="ap-sub">A Wallet stamp card for repeat customers. Not running yet.</p></div></div>

      <div className="ap-loyalty-grid">
        <section className="ap-loyalty-stage" aria-label="Card preview">
          <LoyaltyPreview businessName={business.name} palette={palette} logoUrl={details?.logo_url ?? record?.kit.logo_url ?? null} joinUrl={joinUrl} />
        </section>
        <div>
          <div className="ap-metrics" style={{ ["--n" as string]: 2, marginTop: 0 }}>
            {counters.map(([label, Icon]) => (
              <div key={label} className="ap-metric is-quiet"><span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 0, color: "var(--tm-text2)" }}><Icon size={16} aria-hidden />{label}</span><b style={{ fontSize: 16, marginTop: 8, color: "var(--tm-muted)" }}>Not running</b></div>
            ))}
          </div>
          <div className="ap-soon-steps" style={{ marginTop: 16 }} aria-label="What it will do">
            {[
              [QrIcon, "Join with one scan", "At the counter or from a creator's Story.", "Planned"],
              [GiftIcon, "One reward", "Visits or points, redeemed at the counter.", "Planned"],
              [HandshakeIcon, "Creator referrals", "Customers stay credited to the creator who sent them.", "Planned"],
              [BellIcon, "Member notifications", "Reward ready, new offer, card update.", "Planned"],
              [RobotIcon, "Automations", "Welcome, reminders and win-back, on your rules.", "Planned"],
            ].map(([Icon, t, b, tag]) => { const I = Icon as typeof QrIcon; return <div key={t as string} className="ap-planned"><span className="icon-square is-ice"><I size={20} aria-hidden /></span><span style={{ minWidth: 0 }}><strong>{t as string}</strong><span className="t-meta">{b as string}</span></span><span className="badge">{tag as string}</span></div>; })}
          </div>
          <div className="ap-note" style={{ marginTop: 16 }}>
            <PaletteIcon size={20} aria-hidden style={{ color: "var(--tm-info)" }} />
            <span className="ap-note-text"><b style={{ fontWeight: 600 }}>Customise your card</b><span className="t-meta" style={{ display: "block" }}>The preview follows your approved brand kit: logo and colours.</span></span>
            <Link href="/business/brand" className="btn btn-sm">Brand kit <ArrowRightIcon size={16} aria-hidden /></Link>
          </div>
          <p className="t-meta" style={{ marginTop: 14 }}>You will be told in Notifications when Loyalty opens for your business.</p>
        </div>
      </div>
    </main>
  );
}
