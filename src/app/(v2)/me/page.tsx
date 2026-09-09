import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { getMyVehicles } from "@/lib/v2/opportunities";
import { sqlOne } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatCredit } from "@/lib/money";
import { Avatar, SectionTitle, Stat } from "@/components/v2/ui";
import { placementLabel } from "@/components/v2/EarnCards";
import { IdentitySwitcher, type Identity } from "./IdentitySwitcher";

export const metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

/**
 * Your TapMart earning identity: who you are, what you have earned, and the
 * three things that unlock work (Instagram, a vehicle, payouts). Switching
 * between yourself and your businesses lives here too. Settings sit behind
 * the gear so they never take a navigation tab.
 */
export default async function MePage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const [stats, vehicles, settings] = await Promise.all([
    sqlOne<{ rating: string | null; completed: string; lifetime: string; available: string; saved: string; active: string }>(
      `select cp.rating_avg::text as rating,
              (select count(*) from submissions s where s.creator_id = $1 and s.status in ('approved', 'paid'))::text as completed,
              (select coalesce(sum(amount_cents), 0) from earnings
                where profile_id = $1 and status in ('available', 'requested', 'paid'))::text as lifetime,
              (select coalesce(sum(amount_cents), 0) from earnings
                where profile_id = $1 and status = 'available')::text as available,
              (select count(*) from saved_items where profile_id = $1 and item_type = 'campaign')::text as saved,
              ((select count(*) from applications a where a.applicant_id = $1 and a.status in ('applied', 'accepted'))
               + (select count(*) from submissions s where s.creator_id = $1 and s.status in ('submitted', 'under_review', 'revision_requested'))
               + (select count(*) from car_bookings k join vehicles v on v.id = k.vehicle_id
                   where v.owner_id = $1 and k.status in ('creative_pending', 'installation_pending', 'active', 'proof_required')))::text as active
         from (select 1) one
         left join creator_profiles cp on cp.profile_id = $1`,
      [ctx.user.id],
    ),
    getMyVehicles(ctx.user.id),
    getSettings(),
  ]);

  const name = ctx.user.displayName ?? `@${ctx.user.username}`;
  const available = Number(stats?.available ?? 0);
  const minPayout = Number(settings.minimum_payout_cents ?? "2500");
  const ig = ctx.instagram;

  const identities: Identity[] = [
    { id: "personal", name, sub: "Personal", logo: ctx.avatarUrl, active: ctx.mode === "user" },
    ...ctx.businesses.map((b) => ({
      id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: ctx.activeBusiness?.id === b.id,
    })),
  ];

  const activityRows = [
    { href: "/activity?tab=submitted", title: "Submissions", sub: "Reels and story proofs waiting on review" },
    { href: "/activity", title: "Active campaigns", sub: `${stats?.active ?? 0} in progress` },
    { href: "/earnings", title: "Payments", sub: "Everything you have been paid" },
    { href: "/activity?tab=saved", title: "Saved", sub: `${stats?.saved ?? 0} saved` },
    { href: `/u/${ctx.user.username}`, title: "Reviews", sub: "What businesses said about your work" },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-10">
        <section className="min-w-0">
          {/* ------------------------------------------------------ header */}
          <div className="flex items-start gap-4">
            <Avatar src={ctx.avatarUrl} name={name} size={88} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">
                {name}
                {ctx.isVerified && <span className="ml-2 text-signal" aria-label="Verified">✓</span>}
              </h1>
              <p className="mt-0.5 text-sm text-ink-faint">
                @{ctx.user.username}{ctx.city ? `  ·  ${ctx.city}` : ""}
              </p>
              {ctx.bio && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{ctx.bio}</p>}
            </div>
            <Link href="/me/settings" aria-label="Settings" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink hover:bg-rule-strong">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
                <path d="M10 12.6a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M16.2 10a6.3 6.3 0 0 0-.1-1l1.5-1.2-1.5-2.6-1.8.7a6.2 6.2 0 0 0-1.7-1L12.3 3H7.7l-.3 1.9a6.2 6.2 0 0 0-1.7 1l-1.8-.7-1.5 2.6L3.9 9a6.3 6.3 0 0 0 0 2l-1.5 1.2 1.5 2.6 1.8-.7a6.2 6.2 0 0 0 1.7 1l.3 1.9h4.6l.3-1.9a6.2 6.2 0 0 0 1.7-1l1.8.7 1.5-2.6-1.5-1.2c.07-.33.1-.66.1-1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <div className="card mt-5 grid grid-cols-3 gap-4 p-4 md:p-5">
            <Stat tone="signal" value={formatCredit(Number(stats?.lifetime ?? 0))} label="Earned" />
            <Stat value={stats?.completed ?? 0} label="Completed" />
            <Stat value={stats?.rating ? Number(stats.rating).toFixed(1) : "New"} label="Rating" />
          </div>

          {/* ------------------------------------------------ earning setup */}
          <div className="mt-8">
            <SectionTitle>Earning setup</SectionTitle>
            <ul className="row-list mt-3">
              <li>
                <SetupRow
                  href="/me/instagram"
                  title="Instagram"
                  value={
                    ig.status === "connected" ? `@${ig.handle} · Connected`
                    : ig.status === "pending" ? `@${ig.handle} · Checking`
                    : "Not connected"
                  }
                  tone={ig.status === "connected" ? "signal" : "ink"}
                  sub={ig.status === "disconnected" ? "Needed for Story campaigns" : ig.followers ? `${ig.followers.toLocaleString()} followers` : undefined}
                />
              </li>
              <li>
                {vehicles.length === 0 ? (
                  <SetupRow href="/me/vehicles/new" title="Vehicle" value="Not added" sub="Needed for car campaigns" />
                ) : (
                  <SetupRow
                    href="/me/vehicles"
                    title="Vehicle"
                    value={`${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}${vehicles.length > 1 ? ` +${vehicles.length - 1}` : ""}`}
                    tone={vehicles[0].status === "listed" && vehicles[0].available ? "signal" : "ink"}
                    sub={vehicles[0].status === "listed" ? (vehicles[0].available ? "Available for ads" : "Not available right now") : "Not listed yet"}
                  />
                )}
              </li>
              <li>
                <SetupRow
                  href="/earnings"
                  title="Payout"
                  value={available >= minPayout ? "Ready" : available > 0 ? `${formatCredit(available)} available` : "Nothing to pay out yet"}
                  tone={available >= minPayout ? "signal" : "ink"}
                  sub={available >= minPayout ? "Request it from Earnings" : `Payouts start at ${formatCredit(minPayout)}`}
                />
              </li>
            </ul>
          </div>

          {/* --------------------------------------------------- my vehicle */}
          {vehicles.length > 0 && (
            <div className="mt-8">
              <SectionTitle action={vehicles.length > 1 ? { href: "/me/vehicles", label: "All vehicles" } : undefined}>
                {vehicles.length > 1 ? "My vehicles" : "My vehicle"}
              </SectionTitle>
              <ul className="mt-3 flex flex-col gap-3">
                {vehicles.slice(0, 2).map((v) => (
                  <li key={v.id} className="card overflow-hidden">
                    <Link href={`/me/vehicles/${v.id}`} className="block">
                      <div className="relative aspect-[16/9] w-full bg-surface-2">
                        {v.photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                        <div className="media-scrim absolute inset-x-0 bottom-0 h-2/3" aria-hidden />
                        <div className="absolute inset-x-4 bottom-3 flex items-end justify-between">
                          <span className="font-display text-[1.375rem] font-800 tracking-[-0.02em]">{v.year} {v.make} {v.model}</span>
                          {v.verification === "verified" && <span className="glass-tag px-2.5 py-1 font-display text-xs font-700 text-signal">Verified ✓</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <span className="min-w-0">
                          <span className={`block font-display text-sm font-700 ${v.status === "listed" && v.available ? "text-signal" : "text-ink-soft"}`}>
                            {v.status === "listed" ? (v.available ? "Available for ads" : "Unavailable") : "Not listed"}
                          </span>
                          <span className="block truncate text-sm text-ink-faint">
                            {v.zones.length > 0 ? v.zones.map(placementLabel).join(" · ") : "No placements marked available"}
                          </span>
                        </span>
                        <span className="btn btn-sm shrink-0">Manage</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/me/vehicles/new" className="mt-3 inline-block font-display text-sm font-600 text-ink-soft hover:text-ink">+ Add vehicle</Link>
            </div>
          )}

          {/* ---------------------------------------------------- activity */}
          <div className="mt-8">
            <SectionTitle>My activity</SectionTitle>
            <ul className="row-list mt-3">
              {activityRows.map((r) => (
                <li key={r.title}>
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
        </section>

        {/* ------------------------------------------------- identity rail */}
        <aside className="mt-10 lg:mt-0">
          <SectionTitle>Use TapMart as</SectionTitle>
          <div className="mt-3">
            <IdentitySwitcher identities={identities} canAddBusiness />
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            Business mode turns TapMart into your marketing command center. Personal mode is the earning marketplace.
          </p>
          <Link href={`/u/${ctx.user.username}`} className="mt-5 block font-display text-sm font-600 text-ink-soft hover:text-ink">
            See your public profile →
          </Link>
        </aside>
      </div>
    </main>
  );
}

function SetupRow({
  href, title, value, sub, tone = "ink",
}: { href: string; title: string; value: string; sub?: string; tone?: "ink" | "signal" }) {
  return (
    <Link href={href} className="card flex items-center justify-between gap-3 px-4 py-3.5">
      <span className="min-w-0">
        <span className="block text-sm text-ink-soft">{title}</span>
        <span className={`block truncate font-display text-[1.0625rem] font-800 tracking-[-0.01em] ${tone === "signal" ? "text-signal" : "text-ink"}`}>{value}</span>
        {sub && <span className="block truncate text-sm text-ink-faint">{sub}</span>}
      </span>
      <span aria-hidden className="text-ink-faint">→</span>
    </Link>
  );
}
