import Link from "next/link";
import { ArrowSquareOut, CaretRight, UserCircle, Bell, LockKey, Storefront, PlugsConnected, Palette, CreditCard, UsersThree, Globe } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getBrandKit } from "@/lib/business/brand";
import { PLAN_BY_KEY } from "@/config/plans";
import { BackButton } from "@/components/v2/BackButton";
import { IdentitySwitcher, type Identity } from "@/app/(v2)/me/IdentitySwitcher";
import { SignOutButton } from "@/app/(v2)/me/SignOutButton";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Business settings: eight sections, each a row that opens its own page.
 * This is where the complexity lives; the profile tab stays clean.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, brand, connections, prefs] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null }>(`select category, city from businesses where id = $1`, [business.id]),
    getSubscription(business.id),
    getBrandKit(business.id).catch(() => null),
    sqlOne<{ connected: string; attention: string }>(
      `select count(*) filter (where status = 'connected')::text as connected,
              count(*) filter (where status = 'error')::text as attention
         from connected_accounts where business_id = $1 and provider in ('instagram', 'google_business')`,
      [business.id],
    ),
    sqlOne<{ muted: string }>(
      `select coalesce((select count(*) from jsonb_each_text(prefs) where value = 'false'), 0)::text as muted from notification_prefs where profile_id = $1`,
      [ctx.user.id],
    ),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const connected = Number(connections?.connected ?? 0);
  const attention = Number(connections?.attention ?? 0);
  const muted = Number(prefs?.muted ?? 0);
  const kit = brand?.kit;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));

  const identities: Identity[] = [
    { id: "personal", name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl, active: false },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: b.id === business.id })),
  ];

  type Row = { href?: string; title: string; sub: string; tone?: "alert"; external?: boolean; icon: React.ReactNode };
  const groups: { title: string; rows: Row[]; logout?: boolean }[] = [
    {
      title: "Account",
      logout: true,
      rows: [
        { href: "/business/settings/account", icon: <UserCircle size={22} aria-hidden />, title: "Account", sub: ctx.user.email ?? "Email, name, username" },
        { href: "/business/settings/notifications", icon: <Bell size={22} aria-hidden />, title: "Notifications", sub: muted > 0 ? `${muted} ${muted === 1 ? "type" : "types"} muted` : "All on" },
        { href: "/business/settings/security", icon: <LockKey size={22} aria-hidden />, title: "Security", sub: "Password and sessions" },
      ],
    },
    {
      title: "Business",
      rows: [
        { href: "/business/edit", icon: <Storefront size={22} aria-hidden />, title: "Business details", sub: [details?.category, details?.city].filter(Boolean).join(" · ") || "Name, category, city, hours, website" },
        { href: "/business/settings/connections", icon: <PlugsConnected size={22} aria-hidden />, title: "Connections", sub: attention > 0 ? `${attention} ${attention === 1 ? "connection needs" : "connections need"} attention` : connected > 0 ? `${connected} connected` : "Instagram, Google Business Profile", tone: attention > 0 ? "alert" : undefined },
        { href: "/business/brand", icon: <Palette size={22} aria-hidden />, title: "Brand kit", sub: hasKit ? (brand?.proposed ? "Improvements waiting for review" : "Approved") : "Research your brand from real sources" },
        { href: "/business/plan", icon: <CreditCard size={22} aria-hidden />, title: "Plan and billing", sub: plan ? `${plan.name}${active && active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""}` : "No plan yet" },
        { icon: <UsersThree size={22} aria-hidden />, title: "Team", sub: "Coming later" },
        { href: `/b/${business.slug}`, icon: <Globe size={22} aria-hidden />, title: "Public page", sub: `tapmart.live/b/${business.slug}`, external: true },
      ],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/profile" />
      <h1 className="mt-3 font-display text-[1.375rem] font-600 tracking-[-0.02em] md:text-[1.5rem]">Settings</h1>
      <p className="mt-1 text-sm text-ink-soft">{business.name}</p>

      {groups.map((g) => (
        <section key={g.title} className="mt-7" aria-label={g.title}>
          <h2 className="eyebrow">{g.title}</h2>
          <ul className="card mt-2.5 divide-y divide-rule px-4">
            {g.rows.map((r) => (
              <li key={r.title}>
                {r.href ? (
                  r.external ? (
                    <a href={r.href} target="_blank" rel="noreferrer" className="flex min-h-[4.25rem] items-center gap-3 py-3">
                      <span className="icon-square">{r.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[1rem] font-600">{r.title}</span>
                        <span className="block truncate text-sm text-ink-soft">{r.sub}</span>
                      </span>
                      <ArrowSquareOut size={18} className="shrink-0 text-ink-faint" aria-hidden />
                    </a>
                  ) : (
                    <Link href={r.href} className="flex min-h-[4.25rem] items-center gap-3 py-3">
                      <span className="icon-square">{r.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[1rem] font-600">{r.title}</span>
                        <span className={`block truncate text-sm ${r.tone === "alert" ? "alert-text" : "text-ink-soft"}`}>{r.sub}</span>
                      </span>
                      <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                    </Link>
                  )
                ) : (
                  <span className="flex min-h-[4.25rem] items-center gap-3 py-3 text-ink-faint">
                    <span className="icon-square text-ink-faint">{r.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[1rem] font-600">{r.title}</span>
                      <span className="block truncate text-sm">{r.sub}</span>
                    </span>
                  </span>
                )}
              </li>
            ))}
            {g.logout && <li><SignOutButton row /></li>}
          </ul>
        </section>
      ))}

      <section className="mt-8" aria-label="Switch profile">
        <h2 className="eyebrow">Use TapMart as</h2>
        <div className="mt-2">
          <IdentitySwitcher identities={identities} canAddBusiness flat />
        </div>
      </section>
    </main>
  );
}
