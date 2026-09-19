import Link from "next/link";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { SharePass } from "./SharePass";
import { QrIcon, UsersIcon, StampIcon, RefreshIcon, GiftIcon, ArrowRightIcon } from "@/ds/icons";

export const metadata = { title: "Share and earn" };
export const dynamic = "force-dynamic";

/**
 * Share and earn: a planned feature. A person will share a business's
 * loyalty card; customers who join through them stay attributed and the
 * person earns from each one. No referral link, program or earning
 * exists today, and this page says so. Nothing here is a real record.
 */
export default async function SharePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  if (ctx.mode === "business") redirect("/business/loyalty");
  return (
    <main className="fs-phone-main fs-narrow" id="main">
      <div className="ap-head"><div><span className="badge is-ink">Coming soon</span><h1 style={{ marginTop: 10 }}>Share and earn</h1><p className="ap-sub">Bring customers to a business&rsquo;s loyalty card and earn from every one who joins. Not available yet; there is no referral link to share today.</p></div></div>
      <div className="ap-soon">
        <div className="ap-soon-visual"><SharePass /></div>
        <div className="ap-soon-steps" aria-label="How it will work">
          {[
            [QrIcon, "You share a business's card", "A link or a QR code in your Story, your bio or at the counter."],
            [UsersIcon, "A customer joins", "One tap adds the business's loyalty card to their Wallet."],
            [StampIcon, "Visits are recorded", "Every qualifying purchase stamps the card."],
            [RefreshIcon, "They come back", "The reward unlocks; the card updates in their Wallet."],
            [GiftIcon, "You are credited", "Customers who joined through you stay attributed to you, and each one earns you a referral amount the business sets."],
          ].map(([Icon, t, b]) => { const I = Icon as typeof QrIcon; return <div key={t as string} className="ap-soon-step"><span className="icon-square is-ice"><I size={20} aria-hidden /></span><span><strong>{t as string}</strong><span>{b as string}</span></span></div>; })}
          <Link href="/home" className="btn" style={{ marginTop: 6, alignSelf: "flex-start" }}>Find paid work today <ArrowRightIcon size={16} aria-hidden /></Link>
        </div>
      </div>
    </main>
  );
}
