import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { AdminNav } from "../AdminNav";
import { MarketAdminControls, FeeControl } from "./MarketAdminControls";

export const metadata = { title: "Market admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** V2 trust center: verifications, reports, payouts, platform fee. */
export default async function MarketAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin/market");
  if (user.role !== "admin") redirect("/");

  const [creatorQueue, vehicleQueue, reports, payouts, settings] = await Promise.all([
    sql<{ profile_id: string; username: string; categories: string[]; portfolio_url: string | null; portfolio_count: number }>(
      `select cp.profile_id, p.username, cp.categories, cp.portfolio_url,
              (select count(*) from portfolio_items pi where pi.profile_id = cp.profile_id)::int as portfolio_count
         from creator_profiles cp join profiles p on p.id = cp.profile_id
        where cp.verification = 'pending' order by cp.created_at limit 30`,
    ),
    sql<{ id: string; year: number; make: string; model: string; username: string; photos: number }>(
      `select v.id, v.year, v.make, v.model, p.username,
              (select count(*) from vehicle_photos vp where vp.vehicle_id = v.id)::int as photos
         from vehicles v join profiles p on p.id = v.owner_id
        where v.verification = 'pending' order by v.created_at limit 30`,
    ),
    sql<{ id: string; target_type: string; target_id: string; reason: string; detail: string | null; reporter: string; created_at: string }>(
      `select r.id, r.target_type, r.target_id, r.reason, r.detail, p.username as reporter, r.created_at
         from reports r join profiles p on p.id = r.reporter_id
        where r.status = 'open' order by r.created_at limit 30`,
    ),
    sql<{ id: string; username: string; amount_cents: number; created_at: string }>(
      `select pr.id, p.username, pr.amount_cents::int as amount_cents, pr.created_at
         from payout_requests pr join profiles p on p.id = pr.creator_user_id
        where pr.status = 'requested' order by pr.created_at limit 30`,
    ),
    getSettings(),
  ]);

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-14">
        <h1 className="font-display text-3xl leading-[0.92] font-800 tracking-[-0.045em] md:text-4xl">
          Market
        </h1>
        <div className="mt-5"><AdminNav /></div>

        <section className="mt-8">
          <h2 className="eyebrow">Platform fee</h2>
          <FeeControl current={Number(settings.platform_fee_pct ?? "15")} />
        </section>

        <section className="rule mt-8 pt-5">
          <h2 className="eyebrow">Creator verifications <span className="tnum text-ink-faint">{creatorQueue.length}</span></h2>
          {creatorQueue.length === 0 && <p className="mt-2 font-mono text-xs text-ink-faint">Queue is empty.</p>}
          <ul className="mt-2 flex flex-col gap-2">
            {creatorQueue.map((c) => (
              <li key={c.profile_id} className="border border-rule p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/u/${c.username}`} className="font-mono text-xs font-600 hover:text-signal">@{c.username}</Link>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {c.categories.join(", ")} · {c.portfolio_count} portfolio items
                  </span>
                  {c.portfolio_url && (
                    <a href={c.portfolio_url} target="_blank" rel="noopener noreferrer" className="font-mono text-[0.625rem] text-signal underline">
                      external portfolio ↗
                    </a>
                  )}
                </div>
                <MarketAdminControls kind="creator" id={c.profile_id} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rule mt-8 pt-5">
          <h2 className="eyebrow">Vehicle verifications <span className="tnum text-ink-faint">{vehicleQueue.length}</span></h2>
          {vehicleQueue.length === 0 && <p className="mt-2 font-mono text-xs text-ink-faint">Queue is empty.</p>}
          <ul className="mt-2 flex flex-col gap-2">
            {vehicleQueue.map((v) => (
              <li key={v.id} className="border border-rule p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/cars/${v.id}`} className="font-mono text-xs font-600 hover:text-signal">
                    {v.year} {v.make} {v.model}
                  </Link>
                  <span className="font-mono text-[0.625rem] text-ink-faint">@{v.username} · {v.photos} photos</span>
                </div>
                <MarketAdminControls kind="vehicle" id={v.id} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rule mt-8 pt-5">
          <h2 className="eyebrow">Payout requests <span className="tnum text-ink-faint">{payouts.length}</span></h2>
          {payouts.length === 0 && <p className="mt-2 font-mono text-xs text-ink-faint">Nothing requested.</p>}
          <ul className="mt-2 flex flex-col gap-2">
            {payouts.map((p) => (
              <li key={p.id} className="border border-rule p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-xs font-600">@{p.username}</span>
                  <span className="tnum font-display font-800 text-signal">{formatCredit(p.amount_cents)}</span>
                  <span className="font-mono text-[0.625rem] text-ink-faint">
                    {new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <MarketAdminControls kind="payout" id={p.id} />
              </li>
            ))}
          </ul>
        </section>

        <section className="rule mt-8 pt-5 pb-6">
          <h2 className="eyebrow">Open reports <span className="tnum text-ink-faint">{reports.length}</span></h2>
          {reports.length === 0 && <p className="mt-2 font-mono text-xs text-ink-faint">No open reports.</p>}
          <ul className="mt-2 flex flex-col gap-2">
            {reports.map((r) => (
              <li key={r.id} className="border border-rule p-3">
                <p className="text-sm">
                  <span className="font-mono text-[0.625rem] font-600 uppercase text-signal">{r.target_type}</span>
                  {" "}{r.reason}
                </p>
                {r.detail && <p className="mt-1 text-xs text-ink-faint">{r.detail}</p>}
                <p className="mt-1 font-mono text-[0.625rem] text-ink-faint">
                  by @{r.reporter} · {new Date(r.created_at).toLocaleDateString()}
                  {" · target "}<span className="select-all">{r.target_id}</span>
                </p>
                <MarketAdminControls kind="report" id={r.id} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
