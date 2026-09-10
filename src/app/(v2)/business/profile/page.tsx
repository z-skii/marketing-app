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
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pt-[18px] pb-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-[398px] rail:grid rail:max-w-4xl rail:grid-cols-[minmax(0,1fr)_20rem] rail:gap-x-6">
        {/* ------------------------------------------ profile head (blueprint .profile-head) */}
        <div className="grid grid-cols-[92px_1fr] items-center gap-4 px-0.5 pt-0.5 pb-1.5 rail:col-span-2">
          <Avatar src={row?.logo_url ?? business.logo_url} name={business.name} size={92} ring />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate font-display text-[23px] leading-[1.15] font-[800] tracking-[-0.8px]">
              <span className="truncate">{business.name}</span>
              {row?.verification === "verified" && <CheckCircle size={16} weight="fill" className="shrink-0 text-signal" aria-label="Verified business" />}
              <Link href="/business/settings" aria-label="Settings" className="ml-auto hidden h-9 w-9 shrink-0 items-center justify-center text-ink rail:flex"><Gear size={20} aria-hidden /></Link>
            </h1>
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">
              {identityLine || "Business"}
              {website && row?.website && (
                <>
                  <span aria-hidden> · </span>
                  <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 align-baseline"><Globe size={12} aria-hidden />{website}</a>
                </>
              )}
            </p>
            <div className="mt-[13px] grid max-w-[300px] grid-cols-3 gap-2">
              <Figure value={String(activeN)} label={activeN === 1 ? "Campaign" : "Campaigns"} />
              <Figure value={String(scheduledN)} label="Scheduled" />
              <Figure value={String(n(counts?.delivered))} label="Content" />
            </div>
          </div>
        </div>

        {/* ------------------------------------------ the brand (blueprint .vehicle-card) */}
        <section className="vehicle-card mt-4 rail:col-start-1 rail:row-start-2" aria-label="Your brand">
          <Link href="/business/brand" className="flex items-center justify-between gap-3 px-[14px] pt-[13px] pb-[5px]">
            <span className="min-w-0">
              <span className="block truncate font-display text-[14px] font-[750]">Your brand</span>
              {brandStatus === "Approved"
                ? <span className="status-text mt-0.5"><span aria-hidden className="status-dot" />Brand kit approved</span>
                : <span className="mt-0.5 block text-[10px] text-ink-soft">{brandStatus ? `Brand kit: ${brandStatus.toLowerCase()}` : "Brand kit not built yet"}</span>}
            </span>
            <CaretRight size={22} className="shrink-0 text-ink-faint" aria-hidden />
          </Link>
          <div className="car-stage">
            {cover ? (
              <MediaPreview src={cover} className="absolute inset-0 h-full w-full object-cover" priority sizes="(min-width: 768px) 36rem, 100vw" />
            ) : (
              <Link href="/business/edit" className="flex h-full w-full flex-col items-center justify-center gap-2 text-[12px] text-ink-soft">
                <Camera size={26} weight="duotone" aria-hidden />
                Add a cover photo
              </Link>
            )}
          </div>
        </section>

        <h2 className="eyebrow mx-0.5 mt-6 mb-2.5 rail:col-span-2">Your business</h2>
        {/* --------------------------------------------------------- rows */}
        <ul className="flex flex-col gap-[9px] rail:col-start-1" aria-label="Business setup">
          <li>
            <SurfaceRow
              href="/business/settings/connections" icon={<InstagramLogo size={22} aria-hidden />}
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
        <ul className="mt-[9px] flex flex-col gap-[9px] rail:col-start-2 rail:row-start-2 rail:mt-6" aria-label="Right now">
          <li>
            <SurfaceRow
              href="/business/campaigns" icon={<Megaphone size={22} aria-hidden />}
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
      <p className="tnum truncate font-display text-[18px] leading-none font-[780]">{value}</p>
      <p className="mt-0.5 text-[10px] text-ink-soft">{label}</p>
    </div>
  );
}
