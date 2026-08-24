import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CreditPanel } from "./CreditPanel";
import { AccountSettings } from "./AccountSettings";
import { OwnedLinkRow } from "./OwnedLinkRow";
import { getCurrentUser } from "@/lib/auth";
import { getLedger, getOwnedLinks, getWallet } from "@/lib/dashboard";
import { settingInt } from "@/lib/settings";
import { formatCredit } from "@/lib/money";

export const metadata = { title: "Your links" };
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ topup?: string; live?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const { topup, live } = await searchParams;
  const [wallet, links, ledger, boardPrice, spotPrice, barPrice] = await Promise.all([
    getWallet(user.id), getOwnedLinks(user.id), getLedger(user.id, 12),
    settingInt("board_click_price_cents"),
    settingInt("spot_click_price_cents"),
    settingInt("bar_click_price_cents"),
  ]);

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow !normal-case !tracking-normal">
              {user.username}
              {user.role === "admin" && (
                <span className="ml-2 tracking-[0.14em] uppercase !text-signal">Admin</span>
              )}
            </p>
            <h1 className="mt-2 font-display text-4xl leading-[0.92] font-800 tracking-[-0.045em] md:text-5xl">
              Your links
            </h1>
          </div>
          <Link href="/add" className="btn btn-signal">+ Add Your Link</Link>
        </div>

        {topup === "success" && (
          <p role="status" className="mt-6 border border-rise/40 bg-surface p-4 font-mono text-xs text-rise">
            Payment received. Credit appears as soon as Stripe confirms it — usually within a second or two.
          </p>
        )}
        {live && (
          <p role="status" className="mt-6 border border-rule bg-surface p-4 font-mono text-xs text-ink-soft">
            Your link is live wherever you put credit behind it. Placements without credit stay off the screen until you add some.
          </p>
        )}

        <CreditPanel wallet={wallet} />

        <section className="mt-14">
          <h2 className="eyebrow">Links</h2>
          {links.length === 0 ? (
            <div className="rule mt-4 py-10">
              <p className="font-display text-xl text-ink-soft">Nothing here yet.</p>
              <Link href="/add" className="btn mt-5">Add your first link</Link>
            </div>
          ) : (
            <div className="mt-4">
              {links.map((link) => (
                <OwnedLinkRow
                  key={link.link_id}
                  link={link}
                  prices={{ board: boardPrice, spot: spotPrice, bar: barPrice }}
                />
              ))}
            </div>
          )}
        </section>

        {ledger.length > 0 && (
          <section className="mt-14">
            <h2 className="eyebrow">Credit history</h2>
            <table className="mt-4 w-full border-collapse text-left">
              <caption className="sr-only">Every movement of credit on your account.</caption>
              <thead className="sr-only">
                <tr><th scope="col">When</th><th scope="col">What</th><th scope="col">Amount</th><th scope="col">Balance</th></tr>
              </thead>
              <tbody>
                {ledger.map((row) => (
                  <tr key={row.id} className="border-t border-rule">
                    <td className="py-3 pr-3 font-mono text-xs whitespace-nowrap text-ink-faint">
                      {new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    <td className="py-3 pr-3 font-mono text-xs">
                      {row.transaction_type.replace(/_/g, " ")}
                    </td>
                    <td className={`tnum py-3 pr-3 text-right font-mono text-xs ${row.amount_cents < 0 ? "text-ink-faint" : "text-rise"}`}>
                      {row.amount_cents > 0 ? "+" : ""}{formatCredit(row.amount_cents)}
                    </td>
                    <td className="tnum py-3 text-right font-mono text-xs text-ink-faint">
                      {formatCredit(row.balance_after_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <AccountSettings username={user.username} />
      </main>
      <Footer />
    </>
  );
}
