import Link from "next/link";
import { CaretRight, Plus } from "@phosphor-icons/react/dist/ssr";
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
 * Business settings: everything that manages the business, grouped, each
 * group a short row that opens its own page. This is where the complexity
 * is allowed to live; the profile tab stays clean.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, brand, connections] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; website: string | null }>(`select category, city, website from businesses where id = $1`, [business.id]),
    getSubscription(business.id),
    getBrandKit(business.id).catch(() => null),
    sqlOne<{ connected: string; attention: string }>(
      `select count(*) filter (where status = 'connected')::text as connected,
              count(*) filter (where status = 'error')::text as attention
         from connected_accounts where business_id = $1 and provider in ('instagram', 'google_business')`,
      [business.id],
    ),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const connected = Number(connections?.connected ?? 0);
  const attention = Number(connections?.attention ?? 0);
  const kit = brand?.kit;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));

  const identities: Identity[] = [
    { id: "personal", name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl, active: false },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: b.id === business.id })),
  ];

  type Row = { href?: string; title: string; sub: string; tone?: "alert" };
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: "Account",
      rows: [
        { href: "/business/settings/account", title: "Account and security", sub: ctx.user.email ?? "Email, name, password, log out" },
        { href: "/alerts", title: "Notifications", sub: ctx.unreadNotifications > 0 ? `${ctx.unreadNotifications} unread` : "All caught up" },
      ],
    },
    {
      title: "Business",
      rows: [
        { href: "/business/edit", title: "Business details", sub: [details?.category, details?.city, details?.website].filter(Boolean).join(" · ") || "Name, category, city, hours, website" },
        { href: "/business/settings/connections", title: "Connections", sub: attention > 0 ? `${attention} ${attention === 1 ? "connection needs" : "connections need"} attention` : connected > 0 ? `${connected} connected` : "Instagram, Google Business Profile", tone: attention > 0 ? "alert" : undefined },
        { href: "/business/brand", title: "Brand kit", sub: hasKit ? (brand?.proposed ? "Improvements waiting for your review" : "Approved") : "Research your brand from Instagram, Google and your website" },
        { href: "/business/plan", title: "Plan and billing", sub: plan ? `${plan.name}${active && active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""}` : "No plan yet" },
        { title: "Team", sub: "Coming later" },
      ],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/profile" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Settings</h1>
      <p className="mt-1 text-sm text-ink-soft">{business.name}</p>

      {groups.map((group) => (
        <section key={group.title} className="mt-7" aria-label={group.title}>
          <h2 className="eyebrow">{group.title}</h2>
          <ul className="mt-1 divide-y divide-rule">
            {group.rows.map((r) => (
              <li key={r.title}>
                {r.href ? (
                  <Link href={r.href} className="flex min-h-14 items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block font-display text-[1rem] font-700">{r.title}</span>
                      <span className={`block truncate text-sm ${r.tone === "alert" ? "alert-text" : "text-ink-soft"}`}>{r.sub}</span>
                    </span>
                    <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                ) : (
                  <span className="flex min-h-14 items-center justify-between gap-3 py-3 text-ink-faint">
                    <span className="min-w-0">
                      <span className="block font-display text-[1rem] font-700">{r.title}</span>
                      <span className="block truncate text-sm">{r.sub}</span>
                    </span>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="mt-7" aria-label="Switch profile">
        <h2 className="eyebrow">Use TapMart as</h2>
        <div className="mt-2">
          <IdentitySwitcher identities={identities} canAddBusiness={false} />
        </div>
        <Link href="/business/new" className="link-row mt-2 text-sm"><Plus size={16} weight="bold" aria-hidden />Add a business</Link>
      </section>

      <div className="mt-8"><SignOutButton /></div>
    </main>
  );
}
