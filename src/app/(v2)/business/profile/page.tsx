import Link from "next/link";
import { CaretRight, CheckCircle, Gear, GoogleLogo, Globe, InstagramLogo, MapPin } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getNextShoot } from "@/lib/business/shoots";
import { PLAN_BY_KEY } from "@/config/plans";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar } from "@/components/v2/ui";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(t: string | null | undefined) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: m ? "2-digit" : undefined }).replace(":00", "");
}
function hostOf(url: string | null) {
  if (!url) return null;
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

/**
 * The Business tab: the business's own TapMart profile. Cover, logo, name,
 * category, city, the connections that are really connected, two numbers,
 * the plan and the next shoot. Everything that manages the business is
 * behind the gear.
 */
export default async function BusinessProfilePage() {
  const ctx = await requireBusinessContext("/business/profile");
  const business = ctx.activeBusiness;

  const [row, connections, counts, subscription, shoot] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; website: string | null; cover_url: string | null; logo_url: string | null; verification: string; description: string | null }>(
      `select category, city, website, cover_url, logo_url, verification::text as verification, description from businesses where id = $1`,
      [business.id],
    ),
    sql<{ provider: string; external_name: string | null }>(
      `select provider, external_name from connected_accounts where business_id = $1 and status = 'connected' and provider in ('instagram', 'google_business')`,
      [business.id],
    ),
    sqlOne<{ active: string; scheduled: string }>(
      `select (select count(*) from campaigns where business_id = $1 and status = 'open' and kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as active,
              (select count(*) from calendar_posts where business_id = $1 and status = 'scheduled' and scheduled_for >= now())::text as scheduled`,
      [business.id],
    ),
    getSubscription(business.id),
    getNextShoot(business.id).catch(() => null),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const ig = connections.find((c) => c.provider === "instagram");
  const google = connections.find((c) => c.provider === "google_business");
  const cover = row?.cover_url ?? null;
  const website = hostOf(row?.website ?? null);
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const shootWhen = shoot ? `${fmtDate(shoot.scheduled_for)}${shoot.starts_at ? ` · ${fmtTime(shoot.starts_at)}` : ""}` : null;

  const rows: { title: string; value: string; sub?: string; href: string }[] = [];
  rows.push({
    title: "Plan",
    value: plan ? plan.name : "No plan yet",
    sub: plan ? (active?.status === "active" && active.current_period_end ? `Renews ${fmtDate(active.current_period_end)}` : active?.status && active.status !== "active" ? active.status.replace("_", " ") : undefined) : undefined,
    href: "/business/plan",
  });
  if (shootWhen) rows.push({ title: "Next shoot", value: shootWhen, href: "/business/content" });

  return (
    <main id="main" className="mx-auto w-full max-w-3xl pb-8">
      {/* Cover with the gear on it. */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-surface-2 sm:aspect-[16/9] md:mt-6 md:aspect-[21/9] md:rounded-[var(--radius-card)]">
        {cover ? <MediaPreview src={cover} className="absolute inset-0 h-full w-full object-cover" priority /> : null}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-1/2" aria-hidden />
        <Link href="/business/settings" aria-label="Settings" className="glass absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-ink md:top-4 md:right-4">
          <Gear size={22} aria-hidden />
        </Link>
        {!cover && <Link href="/business/edit" className="absolute bottom-4 left-4 text-sm text-ink-soft">Add a cover photo</Link>}
      </div>

      <div className="px-4 md:px-0">
        <div className="relative z-10 -mt-9">
          <span className="inline-flex rounded-full ring-4 ring-paper"><Avatar src={row?.logo_url ?? business.logo_url} name={business.name} size={72} /></span>
        </div>
        <h1 className="mt-3 flex items-center gap-1.5 font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2.125rem]">
          {business.name}
          {row?.verification === "verified" && <CheckCircle size={22} weight="fill" className="text-signal" aria-label="Verified business" />}
        </h1>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-ink-soft">
          {row?.category && <span>{row.category}</span>}
          {row?.city && <span className="flex items-center gap-1"><MapPin size={16} aria-hidden />{row.city}</span>}
          {website && row?.website && <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Globe size={16} aria-hidden />{website}</a>}
          {ig && <span className="flex items-center gap-1"><InstagramLogo size={17} aria-hidden />{ig.external_name ? `@${ig.external_name.replace(/^@/, "")}` : "Instagram"}</span>}
          {google && <span className="flex items-center gap-1"><GoogleLogo size={17} weight="bold" aria-hidden />Google</span>}
        </p>
        {row?.description && <p className="mt-3 line-clamp-1 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">{row.description}</p>}

        {/* Two numbers on the page. */}
        <div className="mt-7 grid grid-cols-2 gap-4 sm:max-w-sm">
          <Figure value={String(n(counts?.active))} label={n(counts?.active) === 1 ? "Active campaign" : "Active campaigns"} href="/business/campaigns" />
          <Figure value={String(n(counts?.scheduled))} label={n(counts?.scheduled) === 1 ? "Scheduled post" : "Scheduled posts"} href="/business/content" />
        </div>

        {/* What is true right now. */}
        <ul className="mt-6 divide-y divide-rule">
          {rows.map((r) => (
            <li key={r.title}>
              <Link href={r.href} className="flex min-h-14 items-center justify-between gap-3 py-3">
                <span className="text-[0.9375rem] text-ink-soft">{r.title}</span>
                <span className="flex min-w-0 items-center gap-1">
                  <span className="min-w-0 text-right">
                    <span className="block truncate font-display text-[1rem] font-700">{r.value}</span>
                    {r.sub && <span className="block truncate text-xs text-ink-faint">{r.sub}</span>}
                  </span>
                  <CaretRight size={16} className="shrink-0 text-ink-faint" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

      </div>
    </main>
  );
}

function Figure({ value, label, href }: { value: string; label: string; href: string }) {
  return (
    <Link href={href} className="min-w-0">
      <span className="tnum block font-display text-[2rem] leading-none font-800 tracking-[-0.03em]">{value}</span>
      <span className="mt-1.5 block text-sm text-ink-soft">{label}</span>
    </Link>
  );
}
