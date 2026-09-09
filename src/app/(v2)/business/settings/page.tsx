import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getBusinessHealth } from "@/lib/v2/health";
import { PLAN_BY_KEY } from "@/config/plans";
import { Avatar, ScreenHeader } from "@/components/v2/ui";
import { SwitchToPersonalButton } from "./SwitchButton";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

/**
 * The Business tab: who you are acting as, and the rows that manage it.
 * Nothing here is a number the product invented; the health line is the
 * real score from the signals page.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, health, connections] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; verification: string }>(
      `select category, city, verification::text as verification from businesses where id = $1`,
      [business.id],
    ),
    getSubscription(business.id),
    getBusinessHealth(business.id),
    sqlOne<{ connected: string; pending: string }>(
      `select count(*) filter (where status = 'connected')::text as connected,
              count(*) filter (where status = 'pending')::text as pending
         from connected_accounts where business_id = $1`,
      [business.id],
    ),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const connected = Number(connections?.connected ?? 0);
  const pendingConn = Number(connections?.pending ?? 0);

  const rows: { href?: string; title: string; sub: string; external?: boolean }[] = [
    { href: "/business/edit", title: "Business profile and brand kit", sub: "Name, photos, links, colours" },
    { href: "/business/plan", title: "Plan", sub: active ? `${PLAN_BY_KEY[active.plan].name}${active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""}` : "No plan yet" },
    { href: "/business/billing", title: "Billing and campaign credit", sub: "Add credit, see what campaigns paid out" },
    { href: "/business/connections", title: "Connected accounts", sub: connected > 0 ? `${connected} connected` : pendingConn > 0 ? `${pendingConn} requested` : "None connected yet" },
    { href: "/business/health", title: "Business health", sub: `${health.score} / 100, ${health.label}` },
    { href: `/b/${business.slug}`, title: "Public page", sub: `/b/${business.slug}`, external: true },
    { title: "Team", sub: "Coming later" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="Business" unread={ctx.unreadNotifications} showSearch={false} />

      <header className="card mt-5 flex items-center gap-4 p-4 md:p-5">
        <Avatar src={business.logo_url} name={business.name} size={64} />
        <div className="min-w-0">
          <p className="truncate font-display text-[1.25rem] leading-tight font-800 tracking-[-0.02em]">
            {business.name}
            {details?.verification === "verified" && <span className="ml-1.5 text-signal" aria-label="Verified business">✓</span>}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{[details?.category, details?.city].filter(Boolean).join("  ·  ") || "Add a category and city"}</p>
          <p className="text-xs text-ink-faint">You are {business.member_role === "owner" ? "the owner" : `a ${business.member_role}`}</p>
        </div>
      </header>

      <ul className="row-list mt-4">
        {rows.map((r) => (
          <li key={r.title}>
            {r.href ? (
              <Link href={r.href} className="card flex items-center gap-3 px-4 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{r.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-ink-faint">{r.sub}</span>
                </span>
                <span aria-hidden className="text-ink-faint">{r.external ? "↗" : "→"}</span>
              </Link>
            ) : (
              <div className="card-2 flex items-center gap-3 px-4 py-3.5 text-ink-faint">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{r.title}</span>
                  <span className="mt-0.5 block text-sm">{r.sub}</span>
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-2">
        <SwitchToPersonalButton />
        <Link href="/business/new" className="btn btn-ghost w-full">Add another business</Link>
      </div>
    </main>
  );
}
