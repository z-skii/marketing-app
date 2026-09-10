import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretRight, CheckCircle, InstagramLogo, Star } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { compactCount, getPersonForBusiness } from "@/lib/v2/marketplace";
import { BackButton } from "@/components/v2/BackButton";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar, Chip } from "@/components/v2/ui";
import { placementLabel } from "@/components/v2/EarnCards";
import { VehicleStage } from "@/components/v2/vehicle/VehicleStage";
import { RequestSheets, type RequestKind } from "./RequestSheets";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

/**
 * One person, as a business sees them: the work, the facts that were
 * measured, and the two requests. Not a résumé.
 */
export default async function BusinessPersonPage({
  params, searchParams,
}: { params: Promise<{ username: string }>; searchParams: Promise<{ request?: string }> }) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const ctx = await requireBusinessContext(`/business/people/${username}`);
  const business = ctx.activeBusiness;

  const person = await getPersonForBusiness(username, business.id, ctx.city);
  if (!person || person.suspended) notFound();

  const creatives = await sql<{ id: string; title: string; url: string }>(
    `select id, title, details->>'creative_url' as url from campaigns
      where business_id = $1 and kind = 'instagram_story' and coalesce(details->>'creative_url', '') <> ''
      order by created_at desc limit 6`,
    [business.id],
  );

  const name = person.display_name ?? person.username;
  const isSelf = person.id === ctx.user.id;
  const hero = person.media[0] ?? person.instagram?.avatar_url ?? null;
  const ig = person.instagram;
  const initial: RequestKind | null = query.request === "story" || query.request === "reel" ? query.request : null;
  const work = [
    ...person.work.map((w) => ({ url: w.url, tall: w.kind === "recreate_reel" || w.kind === "instagram_story" || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(w.url) })),
    ...person.portfolio.filter((u) => !person.work.some((w) => w.url === u)).map((url) => ({ url, tall: /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) })),
  ].slice(0, 9);
  const vehicle = person.vehicles[0] ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business" label="Home" />

      <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-10">
        {/* ------------------------------------------------------- media */}
        <section className="min-w-0 lg:sticky lg:top-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] bg-surface-2 md:aspect-[4/3] lg:aspect-[4/5]">
            {hero ? (
              <MediaPreview src={hero} alt="" className="absolute inset-0 h-full w-full object-cover" priority sizes="(min-width: 1024px) 40rem, 100vw" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
                <Avatar src={person.avatar_url} name={name} size={160} />
              </div>
            )}
            {hero && (
              <span className="absolute bottom-3 left-3">
                <Avatar src={person.avatar_url} name={name} size={44} />
              </span>
            )}
          </div>
        </section>

        {/* ---------------------------------------------------- identity */}
        <section className="mt-5 min-w-0 lg:mt-0">
          <h1 className="font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">
            {name}
            {person.verification === "verified" && <CheckCircle size={24} weight="fill" className="ml-1.5 inline-block align-[-3px] text-signal" aria-label="Verified" />}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">@{person.username}{person.city ? `, ${person.city}` : ""}</p>

          <ul className="mt-4 flex flex-col gap-1.5 text-[0.9375rem]">
            <li className="flex items-center gap-2">
              <InstagramLogo size={18} className="shrink-0 text-ink-faint" aria-hidden />
              {ig?.status === "connected" ? (
                <span className="tnum">
                  Instagram connected<CheckCircle size={16} weight="fill" className="mx-1 inline-block align-[-2px] text-signal" aria-hidden />
                  {ig.followers != null && <span className="text-ink-soft">{compactCount(ig.followers)} followers</span>}
                </span>
              ) : ig?.status === "pending" && ig.handle ? (
                <span className="text-ink-soft">@{ig.handle}, not verified</span>
              ) : (
                <span className="text-ink-soft">Instagram not connected</span>
              )}
            </li>
            {person.rating_count > 0 && person.rating_avg != null && (
              <li className="tnum flex items-center gap-2">
                <Star size={18} weight="fill" className="shrink-0 text-signal" aria-hidden />
                <span>{person.rating_avg.toFixed(1)} <span className="text-ink-soft">({person.rating_count} {person.rating_count === 1 ? "review" : "reviews"})</span></span>
              </li>
            )}
            {person.completed_jobs > 0 && (
              <li className="tnum flex items-center gap-2">
                <CheckCircle size={18} className="shrink-0 text-ink-faint" aria-hidden />
                <span>{person.completed_jobs} completed TapMart {person.completed_jobs === 1 ? "campaign" : "campaigns"}</span>
              </li>
            )}
          </ul>

          <div className="mt-5">
            {isSelf ? (
              <p className="text-sm text-ink-soft">This is you. Requests go to other people.</p>
            ) : (
              <RequestSheets
                profileId={person.id} name={name} businessName={business.name} initial={initial}
                invites={person.invites.map((i) => ({ kind: i.kind, status: i.status, campaign_id: i.campaign_id }))}
                storyCreatives={creatives}
              />
            )}
          </div>

          {/* -------------------------------------------------------- work */}
          {work.length > 0 && (
            <section className="mt-8">
              <h2 className="eyebrow">Recent TapMart work</h2>
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {work.map((w, i) => (
                  <li key={w.url + i} className={`reveal overflow-hidden rounded-[10px] bg-surface-2 ${w.tall ? "aspect-[9/16]" : "aspect-square"}`} style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                    <MediaPreview src={w.url} alt="" className="h-full w-full object-cover" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* ----------------------------------------------------- vehicle */}
          {vehicle && (
            <section className="mt-8">
              <h2 className="eyebrow">Their car</h2>
              <div className="mt-3">
                <Link href={`/business/cars/${vehicle.id}`} className="block" aria-label={`View ${vehicle.year} ${vehicle.make} ${vehicle.model}`}>
                  <VehicleStage glbUrl={vehicle.stage.glbUrl} posterUrl={vehicle.stage.posterUrl} photos={vehicle.stage.photos} label={vehicle.stage.label} compact />
                </Link>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-[1.125rem] leading-none font-800 tracking-[-0.02em]">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                    <p className="mt-1.5 truncate text-sm text-ink-faint">
                      {[vehicle.city, vehicle.monthly_miles ? `~${vehicle.monthly_miles.toLocaleString()} mi/month` : null].filter(Boolean).join("  ·  ")}
                    </p>
                  </div>
                  <Link href={`/business/cars/${vehicle.id}`} className="btn btn-sm shrink-0">View car<CaretRight size={16} aria-hidden /></Link>
                </div>
                {vehicle.zones.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {vehicle.zones.slice(0, 3).map((z) => <Chip key={z.zone}>{placementLabel(z.zone)}</Chip>)}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ----------------------------------------------------- reviews */}
          {person.reviews.length > 0 && (
            <section className="mt-8">
              <h2 className="eyebrow">Reviews</h2>
              <ul className="mt-2 divide-y divide-rule">
                {person.reviews.map((r, i) => (
                  <li key={i} className="py-3">
                    <p className="flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, k) => <Star key={k} size={14} weight="fill" className={k < r.rating ? "text-signal" : "text-rule-strong"} aria-hidden />)}
                      </span>
                      <span className="min-w-0 truncate text-ink-soft">{r.business_name ?? "A business"}</span>
                      <span className="ml-auto shrink-0 text-xs text-ink-faint">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                    </p>
                    {r.body && <p className="mt-1 line-clamp-2 text-[0.9375rem] leading-snug text-ink-soft">{r.body}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}
