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
      <div className="ap-head"><div><span className="badge is-ink">Coming soon</span><h1 style={{ marginTop: 10 }}>Share and earn</h1><p className="ap-sub">Share a loyalty card, earn per customer. Not live yet.</p></div></div>
      <div className="ap-soon">
        <div className="ap-soon-visual"><SharePass /></div>
        <div className="ap-soon-steps" aria-label="How it will work">
          {[
            [QrIcon, "Share the card", "A link or QR code in your Story or bio."],
            [UsersIcon, "A customer joins", "One tap adds it to their Wallet."],
            [StampIcon, "Visits stamp the card", "Every qualifying purchase counts."],
            [RefreshIcon, "They come back", "The reward unlocks."],
            [GiftIcon, "You get paid", "A referral amount the business sets, per customer."],
          ].map(([Icon, t, b]) => { const I = Icon as typeof QrIcon; return <div key={t as string} className="ap-soon-step"><span className="icon-square is-ice"><I size={20} aria-hidden /></span><span><strong>{t as string}</strong><span>{b as string}</span></span></div>; })}
          <Link href="/home" className="btn" style={{ marginTop: 6, alignSelf: "flex-start" }}>Find work <ArrowRightIcon size={16} aria-hidden /></Link>
        </div>
      </div>
    </main>
  );
}
