import Link from "next/link";
import { ArrowSquareOut, CaretRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getBrandKit } from "@/lib/business/brand";
import { getLastGoogleHealth } from "@/lib/google/business";
import { PLAN_BY_KEY, type PlanShoots } from "@/config/plans";
import { Avatar, ScreenHeader } from "@/components/v2/ui";
import { SwitchToPersonalButton } from "./SwitchButton";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

/** "1 shoot a month, 10 photos, 3 videos": fits one row on a phone. */
function shootsShort(s: PlanShoots): string {
  return `${s.perMonth} shoot${s.perMonth === 1 ? "" : "s"} a month, ${s.photos} photos, ${s.videos} videos`;
}

/**
 * The Business tab: who you are acting as, and the rows that manage it.
 * Every sub line is a real state from its own table, never a guess.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, brand, google, connections] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; verification: string }>(
      `select category, city, verification::text as verification from businesses where id = $1`,
      [business.id],
    ),
    getSubscription(business.id),
    getBrandKit(business.id),
    getLastGoogleHealth(business.id),
    sqlOne<{ connected: string; pending: string }>(
      `select count(*) filter (where status = 'connected')::text as connected,
              count(*) filter (where status = 'pending')::text as pending
         from connected_accounts where business_id = $1`,
      [business.id],
    ),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const connected = Number(connections?.connected ?? 0);
  const pendingConn = Number(connections?.pending ?? 0);
  const kitApproved = brand.status === "approved" && (brand.kit.palette.length > 0 || Boolean(brand.kit.logo_url));

  const brandSub = brand.proposed
    ? `Proposal waiting, ${brand.proposed_source === "ai" ? "by AI" : "by template"}`
    : kitApproved ? `Approved, ${brand.kit.palette.length} colours` : "No kit yet";

  const rows: { href?: string; title: string; sub: string; external?: boolean }[] = [
    { href: "/business/edit", title: "Profile", sub: [details?.category, details?.city].filter(Boolean).join(", ") || "Name, category, city" },
    { href: "/business/brand", title: "Brand", sub: brandSub },
    { href: "/business/plan", title: "Plan", sub: plan ? `${plan.name}${active && active.status !== "active" ? `, ${active.status.replace("_", " ")}` : ""} · ${shootsShort(plan.shoots)}` : "No plan yet" },
    { href: "/business/billing", title: "Billing and credit", sub: "Campaign credit and receipts" },
    { href: "/business/connections", title: "Connected accounts", sub: connected > 0 ? `${connected} connected` : pendingConn > 0 ? `${pendingConn} requested` : "None connected yet" },
    { href: "/business/health", title: "Google and growth", sub: google ? `Google ${google.score} / 100` : "Google not checked yet" },
    { href: "/business/cars", title: "Cars", sub: "Browse scanned vehicles" },
    { href: `/b/${business.slug}`, title: "Public page", sub: `/b/${business.slug}`, external: true },
    { title: "Team", sub: "Coming later" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="Business" unread={ctx.unreadNotifications} showSearch={false} />

      <div className="mt-6 flex items-center gap-4">
        <Avatar src={business.logo_url} name={business.name} size={64} />
        <div className="min-w-0">
          <p className="truncate font-display text-[1.375rem] leading-tight font-800 tracking-[-0.02em]">
            {business.name}
            {details?.verification === "verified" && <CheckCircle size={20} weight="fill" className="ml-1.5 inline-block align-[-3px] text-signal" aria-label="Verified business" />}
          </p>
          <p className="mt-1 truncate text-sm text-ink-soft">{[details?.category, details?.city].filter(Boolean).join(" · ") || "Add a category and city"}</p>
        </div>
      </div>

      <ul className="mt-6 divide-y divide-rule">
        {rows.map((r, i) => (
          <li key={r.title} className="reveal" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
            {r.href ? (
              <Link href={r.href} className="flex min-h-14 items-center justify-between gap-3 py-3" {...(r.external ? { target: "_blank", rel: "noreferrer" } : {})}>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.0625rem] font-700">{r.title}</span>
                  <span className="block truncate text-sm text-ink-faint">{r.sub}</span>
                </span>
                {r.external
                  ? <ArrowSquareOut size={18} className="shrink-0 text-ink-faint" aria-hidden />
                  : <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />}
              </Link>
            ) : (
              <div className="flex min-h-14 items-center justify-between gap-3 py-3 text-ink-faint" aria-disabled="true">
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[1.0625rem] font-700">{r.title}</span>
                  <span className="block text-sm">{r.sub}</span>
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
