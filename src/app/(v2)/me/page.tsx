import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { formatCredit } from "@/lib/money";
import { Avatar, Chip, EmptyState, SectionTitle, Stat } from "@/components/v2/ui";
import { SignOutButton } from "./SignOutButton";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * Your profile, shown the way others see it: photo, bio, badges, stats and
 * your work, with settings as a side rail on desktop and a section below on
 * phones (the gear up top jumps straight to it).
 */
export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const [stats, portfolio, avatar] = await Promise.all([
    sqlOne<{
      verification: string | null; completed: number | null; rating: string | null;
      followers: string; following: string; earnings: string; vehicles: string;
    }>(
      `select cp.verification::text as verification, cp.completed_jobs as completed,
              cp.rating_avg::text as rating,
              (select count(*) from follows where followed_id = $1)::text as followers,
              (select count(*) from follows where follower_id = $1)::text as following,
              (select coalesce(sum(amount_cents), 0) from earnings
                where profile_id = $1 and status in ('available', 'requested'))::text as earnings,
              (select count(*) from vehicles where owner_id = $1)::text as vehicles
         from (select 1) one
         left join creator_profiles cp on cp.profile_id = $1`,
      [ctx.user.id],
    ),
    sql<{ media_url: string; caption: string | null }>(
      `select media_url, caption from portfolio_items
        where profile_id = $1 order by sort, created_at desc limit 6`,
      [ctx.user.id],
    ),
    sqlOne<{ avatar_url: string | null }>(
      `select avatar_url from profiles where id = $1`, [ctx.user.id],
    ),
  ]);

  const settingsGroups: { title: string; rows: { href: string; title: string; sub: string }[] }[] = [
    {
      title: "You",
      rows: [
        { href: "/me/edit", title: "Edit profile", sub: "Name, photo, bio, city" },
        { href: "/me/creator", title: "Creator profile",
          sub: stats?.verification === "verified" ? "Verified ✓"
            : stats?.verification === "pending" ? "Verification pending"
            : "Skills and verification" },
        { href: "/me/portfolio", title: "Portfolio", sub: "Show your best work" },
      ],
    },
    {
      title: "Earning",
      rows: [
        { href: "/wallet", title: "Wallet", sub: "Earnings, credit, payouts" },
        { href: "/cars?tab=mine", title: "My cars", sub: `${stats?.vehicles ?? 0} listed` },
        { href: "/jobs?tab=mine", title: "My work", sub: "Applications and submissions" },
      ],
    },
    {
      title: "More",
      rows: [
        ...(ctx.businesses.length > 0
          ? [{ href: "/business", title: "Business tools", sub: ctx.businesses[0].name }]
          : [{ href: "/business/new", title: "Add a business", sub: "Get marketing done" }]),
        { href: "/board", title: "The live board", sub: "TapMart's classic link board" },
        { href: "/dashboard", title: "My board links", sub: "Manage links on the board" },
        { href: "/earn", title: "Share links and earn", sub: "Earn per open on shared links" },
        ...(ctx.user.role === "admin"
          ? [{ href: "/admin", title: "Admin", sub: "Site controls" }]
          : []),
      ],
    },
  ];

  const name = ctx.user.displayName ?? ctx.user.username;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <div className="md:grid md:grid-cols-[minmax(0,1fr)_17rem] md:gap-10">
        {/* -------------------------------------------- the actual profile */}
        <section className="min-w-0">
          <div className="flex items-start gap-4">
            <Avatar src={avatar?.avatar_url} name={name} size={88} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">
                {ctx.user.displayName ?? `@${ctx.user.username}`}
              </h1>
              <p className="mt-0.5 text-sm text-ink-faint">
                @{ctx.user.username}{ctx.city ? `  ·  ${ctx.city}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {stats?.verification === "verified" && <Chip tone="rise">Verified creator</Chip>}
                {ctx.businesses.length > 0 && <Chip tone="ink">Business</Chip>}
                {Number(stats?.vehicles ?? 0) > 0 && <Chip tone="ink">Driver</Chip>}
              </div>
            </div>
            {/* Gear: on phones it jumps to settings; on desktop they're beside you */}
            <a href="#settings" aria-label="Settings" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-rule-strong md:hidden">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16.2 10a6.3 6.3 0 0 0-.1-1l1.5-1.2-1.5-2.6-1.8.7a6.2 6.2 0 0 0-1.7-1L12.3 3H7.7l-.3 1.9a6.2 6.2 0 0 0-1.7 1l-1.8-.7-1.5 2.6L3.9 9a6.3 6.3 0 0 0 0 2l-1.5 1.2 1.5 2.6 1.8-.7a6.2 6.2 0 0 0 1.7 1l.3 1.9h4.6l.3-1.9a6.2 6.2 0 0 0 1.7-1l1.8.7 1.5-2.6-1.5-1.2c.07-.33.1-.66.1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {ctx.bio && <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">{ctx.bio}</p>}

          <div className="card mt-5 grid grid-cols-3 gap-4 p-4 md:grid-cols-5 md:p-5">
            <Stat value={stats?.completed ?? 0} label="Jobs done" />
            <Stat value={stats?.followers ?? 0} label="Followers" />
            <Stat value={stats?.following ?? 0} label="Following" />
            {stats?.rating && <Stat value={`★ ${Number(stats.rating).toFixed(1)}`} label="Rating" />}
            <Stat tone="signal" value={formatCredit(Number(stats?.earnings ?? 0))} label="To pay out" />
          </div>

          <p className="mt-3">
            <Link href={`/u/${ctx.user.username}`} className="font-display text-sm font-600 text-ink-soft hover:text-ink">
              See your public profile →
            </Link>
          </p>

          <div className="mt-8">
            <SectionTitle count={portfolio.length} action={{ href: "/me/portfolio", label: "Manage" }}>Your work</SectionTitle>
            {portfolio.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="Nothing here yet"
                  body="Show businesses what you can do. Photos and videos of your work go here."
                  actionHref="/me/portfolio" actionLabel="Add work"
                />
              </div>
            ) : (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {portfolio.map((item, i) => (
                  <li key={i} className="overflow-hidden rounded-[10px] bg-surface-2">
                    {/\.(mp4|webm|mov)($|\?)/i.test(item.media_url) ? (
                      <video src={item.media_url} playsInline muted className="aspect-square w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.media_url} alt={item.caption ?? "Work sample"} className="aspect-square w-full object-cover" loading="lazy" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ------------------------------------------------- settings rail */}
        <aside id="settings" className="mt-10 md:mt-0">
          <h2 className="font-display text-lg font-800 tracking-[-0.02em]">Settings</h2>
          {settingsGroups.map((group) => (
            <div key={group.title} className="mt-4">
              <p className="text-sm text-ink-faint">{group.title}</p>
              <ul className="row-list mt-2">
                {group.rows.map((r) => (
                  <li key={r.href + r.title}>
                    <Link href={r.href} className="card flex items-center justify-between gap-3 px-4 py-3">
                      <span className="min-w-0">
                        <span className="block truncate font-display text-[0.9375rem] font-700">{r.title}</span>
                        <span className="block truncate text-sm text-ink-faint">{r.sub}</span>
                      </span>
                      <span aria-hidden className="text-ink-faint">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="mt-5">
            <SignOutButton />
          </div>
        </aside>
      </div>
    </main>
  );
}
