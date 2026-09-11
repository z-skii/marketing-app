import Link from "next/link";
import { CaretRight, CheckCircle, Gear, GoogleLogo, Globe, InstagramLogo, Megaphone, Camera, CreditCard, Palette, Images, PlugsConnected } from "@phosphor-icons/react/dist/ssr";
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

  const deliveredN = n(counts?.delivered);
  const kitState: "approved" | "proposed" | "none" = hasKit ? (brand?.proposed ? "proposed" : "approved") : "none";
  const kitCover = hasKit ? (kit?.logo_url ?? null) : null;
  const connLabel = igOn && googleOn ? "Instagram · Google" : igOn ? "Instagram" : googleOn ? "Google Business Profile" : "No services connected";
  const connState = (ig?.status === "error" || google?.status === "error") ? { text: "Needs attention", tone: "warning" as const } : (igOn || googleOn) ? { text: "Connected", tone: "signal" as const } : { text: "Not connected", tone: "faint" as const };

  return (
    <main id="main" className="mx-auto w-full max-w-[1136px] px-4 pt-[14px] pb-6 rail:px-8 rail:pt-0">
      <div className="hidden rail:flex rail:h-16 rail:items-center rail:justify-between">
        <h1 className="font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px]">Business</h1>
        <Link href="/business/settings" aria-label="Settings" className="iconbtn"><Gear size={22} aria-hidden /></Link>
      </div>
      <h1 className="sr-only rail:hidden">Business</h1>

      <div className="rail:mt-6 rail:grid rail:grid-cols-[720px_360px] rail:gap-7">
        <div className="min-w-0">
          {/* ------------------------------------------ identity card */}
          <section className="card overflow-hidden rail:rounded-[24px]" aria-label="Business identity">
            <div className="relative h-[156px] w-full bg-[#151b1e] rail:h-[320px]">
              {cover ? (
                <MediaPreview src={cover} className="absolute inset-0 h-full w-full object-cover" priority sizes="(min-width: 1024px) 720px, 100vw" />
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(43,55,58,0.38),rgba(21,27,30,0)_220px)]" aria-hidden />
                  <span className="absolute bottom-3 left-[14px] text-[12px] leading-4 text-ink-faint">No cover photo</span>
                </>
              )}
            </div>
            <div className="px-[14px] pb-4 rail:px-[22px] rail:pb-[22px]">
              <div className="-mt-7 rail:-mt-12">
                <Avatar src={row?.logo_url ?? business.logo_url} name={business.name} size={72} ring />
              </div>
              <h2 className="mt-3 line-clamp-2 font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:text-[30px] rail:leading-9 rail:font-[820]">
                {business.name}
                {row?.verification === "verified" && <CheckCircle size={16} weight="fill" className="ml-[7px] inline-block align-[-2px] text-signal" aria-label="Verified business" />}
              </h2>
              {identityLine && <p className="mt-1.5 truncate text-[13px] leading-[17px] font-600 text-ink-soft">{identityLine}</p>}
              {website && row?.website && (
                <a href={row.website.startsWith("http") ? row.website : `https://${row.website}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1.5 text-[13px] leading-[17px] font-600 text-ink-2"><Globe size={14} className="text-ink-soft" aria-hidden /><span className="truncate">{website}</span></a>
              )}
              {(igOn || googleOn) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {igOn && <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-white/8 px-2.5 text-[12px] leading-[14px] font-700 text-ink-2"><InstagramLogo size={14} aria-hidden />{ig?.external_name ? `@${ig.external_name.replace(/^@/, "")}` : "Instagram"}</span>}
                  {googleOn && <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-white/8 px-2.5 text-[12px] leading-[14px] font-700 text-ink-2"><GoogleLogo size={14} weight="bold" aria-hidden />Google</span>}
                </div>
              )}
              <div className="mt-[18px] hidden max-w-[430px] grid-cols-3 gap-2.5 rail:grid">
                <Figure value={String(activeN)} label="Active" />
                <Figure value={String(scheduledN)} label="Scheduled" />
                <Figure value={String(deliveredN)} label="Delivered" />
              </div>
            </div>
          </section>

          {/* ------------------------------------------ bare stat strip (phone) */}
          <div className="mt-[18px] grid grid-cols-3 gap-2.5 px-0.5 rail:hidden">
            <Figure value={String(activeN)} label="Active" />
            <Figure value={String(scheduledN)} label="Scheduled" />
            <Figure value={String(deliveredN)} label="Delivered" />
          </div>

          {/* ------------------------------------------ brand kit */}
          <h2 className="eyebrow mt-6 mb-2.5 hidden rail:block">Brand kit</h2>
          {kitState !== "none" && kitCover ? (
            <Link href="/business/brand" className="card relative mt-6 block h-[188px] overflow-hidden rail:mt-0 rail:h-[248px] rail:rounded-[22px]" aria-label={`Brand kit, ${kitState === "approved" ? "approved" : "review"}`}>
              <MediaPreview src={kitCover} className="absolute inset-0 h-full w-full object-cover" sizes="(min-width: 1024px) 720px, 100vw" />
              <div className="absolute inset-0 bg-[image:var(--tm-scrim)]" aria-hidden />
              <span className={`status-text ${kitState === "approved" ? "" : "is-review"} absolute top-[14px] left-[14px] h-[30px] rounded-full px-2.5 ${kitState === "approved" ? "bg-[color:var(--tm-success-tint)]" : "bg-[color:var(--tm-lime-tint)]"}`}><span aria-hidden className="status-dot" />{kitState === "approved" ? "Approved" : "Review"}</span>
              <span className="absolute inset-x-[14px] bottom-[14px] flex items-end justify-between gap-3">
                <span>
                  <span className="block font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px] text-ink">Brand kit</span>
                  <span className="mt-1 block text-[12px] leading-4 text-ink-2">{kitState === "approved" ? "Ready for campaigns" : "Tap to review"}</span>
                </span>
                <CaretRight size={18} className="shrink-0 text-ink-2" aria-hidden />
              </span>
            </Link>
          ) : (
            <Link href="/business/brand" className="card mt-6 flex min-h-[132px] items-center gap-3 p-[14px] rail:mt-0" aria-label="Brand kit">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-surface-2 text-ink-2"><Palette size={20} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2"><span className="font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">Brand kit</span><span className={`status-text ${kitState === "approved" ? "" : kitState === "proposed" ? "is-review" : "is-done"}`}><span aria-hidden className="status-dot" />{kitState === "approved" ? "Approved" : kitState === "proposed" ? "Review" : "Not built"}</span></span>
                <span className="mt-1 block text-[12px] leading-4 text-ink-2">{kitState === "approved" ? "Ready for campaigns" : kitState === "proposed" ? "Tap to review" : "No approved kit yet"}</span>
              </span>
              <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />
            </Link>
          )}
        </div>

        {/* ------------------------------------------ overview rows */}
        <div className="min-w-0">
          <h2 className="eyebrow mt-6 mb-2.5 rail:mt-0">Overview</h2>
          <ul className="flex flex-col gap-[9px]" aria-label="Overview">
            <li>
              <SurfaceRow href="/business/plan" icon={<CreditCard size={20} aria-hidden />}
                title={plan ? plan.name : "No plan"}
                sub={plan ? (active?.status === "active" && active.current_period_end ? `Renews ${fmtDate(active.current_period_end)}` : active?.status && active.status !== "active" ? active.status.replaceAll("_", " ") : "Active") : "Subscription content is off"}
                status={plan ? "Active" : undefined} statusTone="signal" />
            </li>
            <li>
              <SurfaceRow href={shoot ? `/business/content/shoots/${shoot.id}` : "/business/content"} icon={shootWhen ? <Camera size={20} aria-hidden /> : <Images size={20} aria-hidden />}
                title={shootWhen ? "Next shoot" : "Content"}
                sub={shootWhen ?? (scheduledN + deliveredN > 0 ? `${scheduledN} scheduled · ${deliveredN} delivered` : "No shoot booked")} />
            </li>
            <li>
              <SurfaceRow href="/business/campaigns" icon={<Megaphone size={20} aria-hidden />}
                title="Campaigns" sub={activeN > 0 ? `${activeN} running` : "No campaigns running"}
                status={activeN > 0 ? "Active" : undefined} statusTone="signal" />
            </li>
            <li>
              <SurfaceRow href="/business/settings/connections" icon={<PlugsConnected size={20} aria-hidden />}
                title="Connections" sub={connLabel} status={connState.text} statusTone={connState.tone} />
            </li>
            <li>
              {publicHref
                ? <SurfaceRow href={publicHref} external icon={<Globe size={20} aria-hidden />} title="Public page" sub={`tapmart.live/b/${row?.slug}`} />
                : <div className="row flex min-h-[72px] items-center gap-3 px-[13px] py-3 text-ink-faint"><span className="icon-square text-ink-faint"><Globe size={20} aria-hidden /></span><span className="min-w-0 flex-1"><span className="block font-display text-[14px] leading-[18px] font-700">Public page</span><span className="block text-[12px] leading-4">Public page not available</span></span></div>}
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="tnum truncate font-display text-[18px] leading-5 font-[780] tracking-[-0.25px]">{value}</p>
      <p className="mt-0.5 text-[10px] leading-3 font-[550] tracking-[0.1px] uppercase text-ink-faint">{label}</p>
    </div>
  );
}
