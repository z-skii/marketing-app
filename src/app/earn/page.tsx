import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ShareCard } from "./ShareCard";
import { PayoutButton } from "./PayoutButton";
import { getCurrentUser } from "@/lib/auth";
import { getCreatorSummary, getOrCreateReferral } from "@/lib/dashboard";
import { settingInt } from "@/lib/settings";
import { formatCredit, formatCount } from "@/lib/money";
import { SITE_URL } from "@/config/site";

export const metadata = { title: "Earn" };
export const dynamic = "force-dynamic";

export default async function EarnPage() {
  const user = await getCurrentUser();

  if (!user) {
    const commission = await settingInt("creator_commission_cents");
    return (
      <>
        <Header user={null} />
        <main id="main" className="shell py-14 md:py-24">
          <h1 className="max-w-[14ch] font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] md:text-6xl">
            Send people here. Earn when they open something.
          </h1>
          <p className="mt-5 max-w-lg text-ink-soft">
            Share the board. When someone you sent opens a live link, you get{" "}
            {formatCredit(commission)} of it. Views alone pay nothing.
          </p>
          <Link href="/sign-in?next=/earn" className="btn btn-signal mt-8 !px-6 !py-3.5">Start earning</Link>
        </main>
        <Footer />
      </>
    );
  }

  const [summary, code, minimum, hold] = await Promise.all([
    getCreatorSummary(user.id),
    getOrCreateReferral(user.id),
    settingInt("minimum_payout_cents"),
    settingInt("creator_fraud_hold_days"),
  ]);

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-14">
        <h1 className="font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] md:text-5xl">
          Earn
        </h1>

        <section className="mt-8">
          <h2 className="eyebrow">Today</h2>
          <div className="mt-4 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            <Figure label="Visitors referred" value={formatCount(summary.todayVisitors)} />
            <Figure label="Opens" value={formatCount(summary.todayOpens)} />
            <Figure label="Earned" value={formatCredit(summary.todayEarningsCents)} emphasis />
          </div>
        </section>

        <section className="rule mt-10 pt-6">
          <h2 className="eyebrow">This week</h2>
          <div className="mt-4 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            <Figure label="Opens" value={formatCount(summary.weekOpens)} />
            <Figure label="Earned" value={formatCredit(summary.weekEarningsCents)} />
          </div>
        </section>

        <section className="rule mt-10 pt-6">
          <h2 className="eyebrow">Balance</h2>
          <div className="mt-4 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-3">
            <Figure label={`Pending · ${hold}-day hold`} value={formatCredit(summary.pendingCents)} />
            <Figure label="Available" value={formatCredit(summary.availableCents)} emphasis />
            <Figure label="Paid" value={formatCredit(summary.paidCents)} />
          </div>
          <PayoutButton
            enabled={summary.availableCents >= minimum}
            minimumLabel={formatCredit(minimum)}
          />
        </section>

        <ShareCard code={code} origin={SITE_URL} />
      </main>
      <Footer />
    </>
  );
}

function Figure({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1.5 font-mono font-600 tracking-tight ${emphasis ? "text-3xl" : "text-2xl text-ink-soft"}`}>
        {value}
      </div>
    </div>
  );
}
