import Link from "next/link";
import { CaretRight, CheckCircle, Gear, GoogleLogo, Globe, InstagramLogo, MapPin } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getGrowthSummary } from "@/lib/social/insights";
import { getNextShoot } from "@/lib/business/shoots";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar } from "@/components/v2/ui";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

function compact(n: number | null) {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
function fmtDate(d: string | null) {
  if (!d) return "";
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function hostOf(url: string | null) {
  if (!url) return null;
  try { return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

/**
 * The Business tab: the business's own TapMart identity. Cover, logo,
 * name, category and city, the two connection marks, three numbers for the
 * month, and the one thing that is next. Everything that manages the
 * business is behind the gear.
 */
export default async function BusinessProfilePage() {
  const ctx = await requireBusinessContext("/business/profile");
  const business = ctx.activeBusiness;

  const [row, connections, month, growth, shoot, next] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; website: string | null; cover_url: string | null; logo_url: string | null; verification: string; description: string | null }>(
      `select category, city, website, cover_url, logo_url, verification::text as verification, description from businesses where id = $1`,
      [business.id],
    ),
    sql<{ provider: string; status: string; external_name: string | null }>(
      `select provider, status::text as status, external_name from connected_accounts where business_id = $1 and status = 'connected'`,
      [business.id],
    ),
    sqlOne<{ active: string; scheduled: string }>(
      `select (select count(*) from campaigns where business_id = $1 and status = 'open' and kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as active,
              (select count(*) from calendar_posts where business_id = $1 and status = 'scheduled' and scheduled_for >= date_trunc('month', now()))::text as scheduled`,
      [business.id],
    ),
    getGrowthSummary(business.id).catch(() => null),
    getNextShoot(business.id).catch(() => null),
    sqlOne<{ submissions: string; applications: string; invites: string; deliverables: string }>(
      `select (select count(*) from submissions s join campaigns c on c.id = s.campaign_id where c.business_id = $1 and s.status in ('submitted', 'under_review'))::text as submissions,
              (select count(*) from applications a join campaigns c on c.id = a.campaign_id where c.business_id = $1 and a.status = 'applied')::text as applications,
              (select count(*) from campaign_invites i where i.business_id = $1 and i.status = 'sent')::text as invites,
              (select count(*) from content_deliverables d where d.business_id = $1 and d.status = 'new')::text as deliverables`,
      [business.id],
    ),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const ig = connections.find((c) => c.provider === "instagram");
  const google = connections.find((c) => c.provider === "google_business");
  const views = growth && growth.source !== "unavailable" ? growth.metrics.views : null;
  const cover = row?.cover_url ?? null;
  const website = hostOf(row?.website ?? null);

  const waiting = n(next?.submissions) + n(next?.applications);
  const nextItems: { title: string; sub: string; href: string }[] = [];
  if (n(next?.deliverables) > 0) nextItems.push({ title: `${n(next?.deliverables)} new ${n(next?.deliverables) === 1 ? "photo or video" : "photos and videos"}`, sub: "Delivered from your shoot, ready to approve", href: "/business/content" });
  if (waiting > 0) nextItems.push({ title: `${waiting} ${waiting === 1 ? "submission" : "submissions"} waiting`, sub: "Review to pay the people who did the work", href: "/business/campaigns?tab=review" });
  if (shoot) nextItems.push({ title: "Next shoot", sub: `${fmtDate(shoot.scheduled_for)}${shoot.assigned_label ? ` · ${shoot.assigned_label}` : ""}`, href: "/business/content/shoots" });
  if (n(next?.invites) > 0) nextItems.push({ title: `${n(next?.invites)} ${n(next?.invites) === 1 ? "request" : "requests"} sent`, sub: "Waiting for an answer", href: "/business/campaigns" });

  return (
    <main id="main" className="mx-auto w-full max-w-3xl pb-8">
      {/* Cover */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2 sm:aspect-[21/9] md:mt-6 md:rounded-[var(--radius-card)]">
        {cover ? <MediaPreview src={cover} className="absolute inset-0 h-full w-full object-cover" priority /> : null}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-1/2" aria-hidden />
        <Link href="/business/settings" aria-label="Settings" className="glass absolute top-3 right-3 flex h-11 w-11 items-center justify-center rounded-full text-ink">
          <Gear size={22} aria-hidden />
        </Link>
        {!cover && (
          <Link href="/business/edit" className="absolute bottom-3 left-4 text-sm text-ink-soft">Add a cover photo</Link>
        )}
      </div>

      <div className="px-4 md:px-0">
        <div className="relative z-10 -mt-9 flex items-end gap-4">
          <span className="rounded-[16px] ring-4 ring-paper"><Avatar src={row?.logo_url ?? business.logo_url} name={business.name} size={80} /></span>
        </div>
        <h1 className="mt-3 flex items-center gap-1.5 font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em] md:text-[2rem]">
          {business.name}
          {row?.verification === "verified" && <CheckCircle size={22} weight="fill" className="text-signal" aria-label="Verified business" />}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem] text-ink-soft">
          {row?.category && <span>{row.category}</span>}
          {row?.city && <span className="flex items-center gap-1"><MapPin size={16} aria-hidden />{row.city}</span>}
          {website && row?.website && <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="flex items-center gap-1"><Globe size={16} aria-hidden />{website}</a>}
        </p>
        {(ig || google) && (
          <p className="mt-2 flex items-center gap-3 text-sm text-ink-soft">
            {ig && <span className="flex items-center gap-1"><InstagramLogo size={18} aria-hidden />{ig.external_name ? `@${ig.external_name.replace(/^@/, "")}` : "Instagram"}</span>}
            {google && <span className="flex items-center gap-1"><GoogleLogo size={18} weight="bold" aria-hidden />Google</span>}
          </p>
        )}
        {row?.description && <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-ink-soft">{row.description}</p>}

        {/* This month: three numbers, nothing else. */}
        <section className="mt-7" aria-label="This month">
          <h2 className="eyebrow">This month</h2>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <Figure value={compact(views)} label="Views" tone="signal" href="/business/social" />
            <Figure value={String(n(month?.active))} label={n(month?.active) === 1 ? "Active campaign" : "Active campaigns"} href="/business/campaigns" />
            <Figure value={String(n(month?.scheduled))} label={n(month?.scheduled) === 1 ? "Scheduled post" : "Scheduled posts"} href="/business/content" />
          </div>
        </section>

        {/* Next: only what is true right now. */}
        {nextItems.length > 0 && (
          <section className="mt-7" aria-label="Next">
            <h2 className="eyebrow">Next</h2>
            <ul className="mt-1 divide-y divide-rule">
              {nextItems.slice(0, 3).map((it) => (
                <li key={it.title}>
                  <Link href={it.href} className="flex min-h-16 items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block font-display text-[1.0625rem] font-800 tracking-[-0.02em]">{it.title}</span>
                      <span className="block truncate text-sm text-ink-soft">{it.sub}</span>
                    </span>
                    <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-7 flex gap-2">
          <a href={`/b/${business.slug}`} target="_blank" rel="noreferrer" className="btn flex-1">View public page</a>
          <Link href="/business/settings" className="btn flex-1"><Gear size={18} aria-hidden />Settings</Link>
        </div>
      </div>
    </main>
  );
}

function Figure({ value, label, tone = "ink", href }: { value: string | null; label: string; tone?: "ink" | "signal"; href: string }) {
  const faint = value == null;
  return (
    <Link href={href} className="min-w-0">
      <span className={`tnum block truncate font-display leading-none font-800 tracking-[-0.03em] ${faint ? "text-[1.125rem] text-ink-faint" : `text-[1.875rem] ${tone === "signal" ? "text-signal" : "text-ink"}`}`}>{value ?? "No data"}</span>
      <span className="mt-1.5 block text-sm text-ink-soft">{label}</span>
    </Link>
  );
}
