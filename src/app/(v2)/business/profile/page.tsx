import Link from "next/link";
import { CaretRight, CheckCircle, Gear, GoogleLogo, Globe, InstagramLogo, Megaphone, Camera, CreditCard } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getNextShoot } from "@/lib/business/shoots";
import { getBrandKit } from "@/lib/business/brand";
import { PLAN_BY_KEY } from "@/config/plans";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar, SurfaceRow } from "@/components/v2/ui";

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
 * The Business tab: the business's own TapMart identity, in the same
 * language as the personal profile. Logo, name, category and city, three
 * figures, the brand on a media card, then the rows that show what is
 * true right now: Instagram, Google, campaigns, plan, next shoot, the
 * public page. Everything that edits the business is behind the gear.
 */
export default async function BusinessProfilePage() {
  const ctx = await requireBusinessContext("/business/profile");
  const business = ctx.activeBusiness;

  const [row, connections, counts, subscription, shoot, brand] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null; website: string | null; cover_url: string | null; logo_url: string | null; verification: string; description: string | null; slug: string }>(
      `select category, city, website, cover_url, logo_url, verification::text as verification, description, slug from businesses where id = $1`,
      [business.id],
    ),
    sql<{ provider: string; status: string; external_name: string | null }>(
      `select provider, status::text as status, external_name from connected_accounts where business_id = $1 and provider in ('instagram', 'google_business')`,
      [business.id],
    ),
    sqlOne<{ active: string; scheduled: string; delivered: string }>(
      `select (select count(*) from campaigns where business_id = $1 and status = 'open' and kind in ('recreate_reel', 'instagram_story', 'car_ads'))::text as active,
              (select count(*) from calendar_posts where business_id = $1 and status = 'scheduled' and scheduled_for >= now())::text as scheduled,
              (select count(*) from content_deliverables where business_id = $1)::text as delivered`,
      [business.id],
    ),
    getSubscription(business.id),
    getNextShoot(business.id).catch(() => null),
    getBrandKit(business.id).catch(() => null),
  ]);

  const n = (v: string | undefined) => Number(v ?? 0);
  const ig = connections.find((c) => c.provider === "instagram");
  const google = connections.find((c) => c.provider === "google_business");
  const igOn = ig?.status === "connected";
  const googleOn = google?.status === "connected";
  const cover = row?.cover_url ?? null;
  const website = hostOf(row?.website ?? null);
  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const shootWhen = shoot ? `${fmtDate(shoot.scheduled_for)}${shoot.starts_at ? ` · ${fmtTime(shoot.starts_at)}` : ""}` : null;
  const kit = brand?.kit;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));
  const brandStatus = hasKit ? (brand?.proposed ? "Improvements waiting" : "Approved") : null;
  const identityLine = [row?.category, row?.city].filter(Boolean).join("  ·  ");
  const publicHref = row?.slug ? `/b/${row.slug}` : null;
  const activeN = n(counts?.active);
  const scheduledN = n(counts?.scheduled);

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pt-3 pb-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-xl rail:grid rail:max-w-4xl rail:grid-cols-[minmax(0,1fr)_20rem] rail:gap-x-6">
        {/* ------------------------------------------------------ header */}
        <div className="flex items-start justify-between gap-3 rail:col-span-2">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar src={row?.logo_url ?? business.logo_url} name={business.name} size={88} />
            <div className="min-w-0">
              <h1 className="truncate font-display text-[1.625rem] leading-[1.15] font-700 tracking-[-0.02em]">
                {business.name}
                {row?.verification === "verified" && <CheckCircle size={20} weight="fill" className="ml-1.5 inline-block align-[-2px] text-signal" aria-label="Verified business" />}
              </h1>
              <p className="mt-0.5 truncate text-sm text-ink-soft">
                {identityLine || "Business"}
                {website && row?.website && (
                  <>
                    <span aria-hidden>  ·  </span>
                    <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 align-baseline"><Globe size={13} aria-hidden />{website}</a>
                  </>
                )}
              </p>
              <div className="mt-3 flex gap-6">
                <Figure value={String(activeN)} label={activeN === 1 ? "Campaign" : "Campaigns"} />
                <Figure value={String(scheduledN)} label="Scheduled" />
                <Figure value={String(n(counts?.delivered))} label="Content" />
              </div>
            </div>
          </div>
          <Link href="/business/settings" aria-label="Settings" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink rail:flex">
            <Gear size={22} aria-hidden />
          </Link>
        </div>

        {/* ------------------------------------------------- the brand */}
        <section className="row mt-6 overflow-hidden rail:col-start-1 rail:row-start-2" aria-label="Your brand">
          <Link href="/business/brand" className="flex items-center gap-3 px-4 pt-3.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[1rem] leading-[1.3] font-600 tracking-[-0.01em]">Your brand</span>
              <span className="mt-0.5 flex items-center gap-2 text-sm text-ink-soft">
                {brandStatus === "Approved" && <span aria-hidden className="status-dot" />}
                {brandStatus ? `Brand kit ${brandStatus.toLowerCase()}` : "Brand kit not built yet"}
              </span>
            </span>
            <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
          </Link>
          <div className="px-2 pt-2 pb-2">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[12px] bg-surface-2">
              {cover ? (
                <MediaPreview src={cover} className="absolute inset-0 h-full w-full object-cover" priority sizes="(min-width: 768px) 36rem, 100vw" />
              ) : (
                <Link href="/business/edit" className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-ink-soft">
                  <Camera size={28} weight="duotone" aria-hidden />
                  Add a cover photo
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- rows */}
        <ul className="mt-2.5 flex flex-col gap-2.5 rail:col-start-1" aria-label="Business setup">
          <li>
            <SurfaceRow
              href="/business/settings/connections" icon={<InstagramLogo size={22} aria-hidden />} iconTone="instagram"
              title="Instagram"
              sub={igOn ? (ig?.external_name ? `@${ig.external_name.replace(/^@/, "")}` : "Connected account") : ig?.status === "error" ? "Needs attention" : "For Story campaigns"}
              status={igOn ? "Connected" : undefined} statusTone="signal"
            />
          </li>
          {(googleOn || google?.status === "error") && (
            <li>
              <SurfaceRow
                href="/business/google" icon={<GoogleLogo size={22} weight="bold" aria-hidden />}
                title="Google Business Profile"
                sub={googleOn ? (google?.external_name ?? "Connected") : "Needs attention"}
                status={googleOn ? "Connected" : undefined} statusTone="signal"
              />
            </li>
          )}
        </ul>
        <ul className="mt-2.5 flex flex-col gap-2.5 rail:col-start-2 rail:row-start-2 rail:mt-6" aria-label="Right now">
          <li>
            <SurfaceRow
              href="/business/campaigns" icon={<Megaphone size={22} aria-hidden />} iconTone="warn"
              title="Campaigns"
              sub={activeN > 0 ? `${activeN} running` : "Nothing running yet"}
              status={activeN > 0 ? "Live" : undefined} statusTone="signal"
            />
          </li>
          <li>
            <SurfaceRow
              href="/business/plan" icon={<CreditCard size={22} aria-hidden />}
              title={plan ? `${plan.name} plan` : "Plan"}
              sub={plan
                ? (active?.status === "active" && active.current_period_end ? `Renews ${fmtDate(active.current_period_end)}` : active?.status && active.status !== "active" ? active.status.replaceAll("_", " ") : "Active")
                : "No plan yet"}
            />
          </li>
          <li>
            <SurfaceRow
              href="/business/content" icon={<Camera size={22} aria-hidden />}
              title={shootWhen ? "Next shoot" : "Content"}
              sub={shootWhen ?? (n(counts?.delivered) > 0 ? `${n(counts?.delivered)} delivered` : "Photos and videos shot for you")}
            />
          </li>
          {publicHref && (
            <li>
              <SurfaceRow href={publicHref} external icon={<Globe size={22} aria-hidden />} title="Public page" sub={`tapmart.live/b/${row?.slug}`} />
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="tnum font-display text-[1.25rem] leading-none font-600 tracking-[-0.02em]">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
    </div>
  );
}
