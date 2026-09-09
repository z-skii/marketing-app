import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { Avatar, Chip, Money, SectionTitle } from "@/components/v2/ui";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/** The person's hub: identity, capabilities, money, and the way into each. */
export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const stats = await sqlOne<{
    verification: string | null; completed: number | null; rating: string | null;
    followers: string; earnings: string; vehicles: string; portfolio: string;
  }>(
    `select cp.verification::text as verification, cp.completed_jobs as completed,
            cp.rating_avg::text as rating,
            (select count(*) from follows where followed_id = $1)::text as followers,
            (select coalesce(sum(amount_cents), 0) from earnings
              where profile_id = $1 and status in ('available', 'requested'))::text as earnings,
            (select count(*) from vehicles where owner_id = $1)::text as vehicles,
            (select count(*) from portfolio_items where profile_id = $1)::text as portfolio
       from (select 1) one
       left join creator_profiles cp on cp.profile_id = $1`,
    [ctx.user.id],
  );

  const rows: { href: string; title: string; sub: string }[] = [
    { href: "/me/edit", title: "Edit profile", sub: "Name, photo, bio, city" },
    { href: "/me/creator", title: "Creator profile",
      sub: stats?.verification === "verified" ? "Verified ✓" : stats?.verification === "pending" ? "Verification pending" : "Set up skills & get verified" },
    { href: "/me/portfolio", title: "Portfolio", sub: `${stats?.portfolio ?? 0} items` },
    { href: "/cars?tab=mine", title: "My cars", sub: `${stats?.vehicles ?? 0} listed` },
    { href: "/wallet", title: "Wallet", sub: "Earnings, credit, payouts" },
    ...(ctx.businesses.length > 0
      ? [{ href: "/business", title: "Business tools", sub: ctx.businesses[0].name }]
      : ctx.wantsBusiness
        ? [{ href: "/business/new", title: "Add your business", sub: "Get marketing done" }]
        : []),
    { href: "/dashboard", title: "Account & links", sub: "The classic TapMart board tools" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <header className="flex items-center gap-4">
        <Avatar src={null} name={ctx.user.displayName ?? ctx.user.username} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-2xl font-900 tracking-[-0.03em]">
            {ctx.user.displayName ?? `@${ctx.user.username}`}
          </h1>
          <p className="font-mono text-[0.6875rem] text-ink-faint">
            @{ctx.user.username}{ctx.city ? ` · ${ctx.city}` : ""}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {stats?.verification === "verified" && <Chip tone="rise">verified creator</Chip>}
            {ctx.businesses.length > 0 && <Chip tone="ink">business</Chip>}
            {Number(stats?.vehicles ?? 0) > 0 && <Chip tone="ink">driver</Chip>}
          </div>
        </div>
        <Link href={`/u/${ctx.user.username}`} className="font-mono text-[0.625rem] text-ink-faint hover:text-ink">
          public ↗
        </Link>
      </header>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="border border-rule p-3">
          <p className="tnum font-display text-lg font-800">{stats?.completed ?? 0}</p>
          <p className="font-mono text-[0.5625rem] text-ink-faint uppercase">jobs done</p>
        </div>
        <div className="border border-rule p-3">
          <p className="tnum font-display text-lg font-800">{stats?.followers ?? 0}</p>
          <p className="font-mono text-[0.5625rem] text-ink-faint uppercase">followers</p>
        </div>
        <div className="border border-rule p-3">
          <p className="font-display text-lg font-800"><Money cents={Number(stats?.earnings ?? 0)} /></p>
          <p className="font-mono text-[0.5625rem] text-ink-faint uppercase">to pay out</p>
        </div>
      </div>

      <section className="mt-5">
        <SectionTitle>Your TapMart</SectionTitle>
        <ul className="mt-2 flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.href + r.title}>
              <Link href={r.href} className="flex items-center justify-between border border-rule px-4 py-3 hover:border-ink">
                <span>
                  <span className="block font-display text-sm font-800">{r.title}</span>
                  <span className="text-xs text-ink-faint">{r.sub}</span>
                </span>
                <span aria-hidden className="font-mono text-ink-faint">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
