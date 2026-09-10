import Link from "next/link";
import { Camera, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { defaultTimezone } from "@/lib/ai/schedule";
import { ensureMonthlyShoots, getNextShoot, type ContentShoot } from "@/lib/business/shoots";
import { publishProviderStatus } from "@/lib/business/publishing";
import { getBrandKit } from "@/lib/business/brand";
import { Avatar, Chip, ScreenHeader } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { CalendarBoard } from "./CalendarBoard";
import { LibraryGrid } from "./LibraryGrid";
import { latestShootDeliverable, listLibrary } from "./library";
import { dayKeyOf, daysBetween, longDayLabel } from "./dates";
import { shootStatusLabel, shootStatusTone, type CalendarPost } from "./types";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

type PostRow = Omit<CalendarPost, "scheduled_for" | "recommended_time" | "published_at" | "created_at"> & {
  scheduled_for: Date | string | null;
  recommended_time: Date | string | null;
  published_at: Date | string | null;
  created_at: Date | string;
};

function iso(value: Date | string | null): string | null {
  return value == null ? null : new Date(value).toISOString();
}

/**
 * The Content tab is the month's marketing workspace: the plan and its one
 * action, the calendar, the next shoot, the posts, everything in the
 * library, and the brand it all follows. Posting for the business needs a
 * connected account, and the page says so until one exists.
 */
export default async function ContentPage({
  searchParams,
}: { searchParams: Promise<{ day?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/content"), searchParams]);
  const business = ctx.activeBusiness;
  const timeZone = defaultTimezone();
  const now = new Date();
  const todayKey = dayKeyOf(now, timeZone);
  const month = todayKey.slice(0, 7);
  const initialDay = params.day && params.day.startsWith(`${month}-`) && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : null;

  const [shoot, rows, instagram, brand, media, shootPicture] = await Promise.all([
    ensureMonthlyShoots(business.id, now).then(async (r) => ({ plan: r.plan, next: r.plan ? await getNextShoot(business.id) : null })),
    sql<PostRow>(
      `select id, platform, status::text as status, title, copy, caption, format, source, thumbnail_url, media_urls,
              scheduled_for, recommended_time, published_at, created_at
         from calendar_posts
        where business_id = $1
          and ((coalesce(scheduled_for, recommended_time) >= $2::date
                and coalesce(scheduled_for, recommended_time) < ($2::date + interval '1 month'))
               or (scheduled_for is null and recommended_time is null))
        order by coalesce(scheduled_for, recommended_time) nulls last, created_at`,
      [business.id, `${month}-01`],
    ),
    publishProviderStatus("instagram", business.id),
    getBrandKit(business.id),
    sqlOne<{ cover_url: string | null; logo_url: string | null }>(
      `select cover_url, logo_url from businesses where id = $1`,
      [business.id],
    ),
    latestShootDeliverable(business.id),
  ]);
  const posts: CalendarPost[] = rows.map((r) => ({
    ...r,
    media_urls: Array.isArray(r.media_urls) ? r.media_urls : [],
    scheduled_for: iso(r.scheduled_for),
    recommended_time: iso(r.recommended_time),
    published_at: iso(r.published_at),
    created_at: iso(r.created_at) ?? new Date().toISOString(),
  }));
  const canApprove = ["owner", "manager"].includes(business.member_role) || ctx.user.role === "admin";
  const kit = brand.kit;
  const cover = media?.cover_url ?? null;
  const library = await listLibrary(business.id, posts, {
    cover_url: cover,
    logo_url: kit.logo_url ?? media?.logo_url ?? null,
  });

  const palette = kit.palette.slice(0, 3);
  const typeNames = [kit.type.display, kit.type.body].filter(Boolean) as string[];
  const hasBrand = Boolean(kit.logo_url || palette.length || typeNames.length);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker={business.name} title="Content" unread={ctx.unreadNotifications} showSearch={false} />

      <div className="mt-7">
        <CalendarBoard
          businessId={business.id}
          month={month}
          timeZone={timeZone}
          todayKey={todayKey}
          initialDay={initialDay}
          posts={posts}
          canAutoPost={instagram.canAutoPublish}
          canApprove={canApprove}
          between={<NextShoot plan={shoot.plan} next={shoot.next} todayKey={todayKey} picture={shootPicture ?? cover} />}
        />
      </div>

      {/* ------------------------------------------------------ library */}
      <section className="mt-9" aria-labelledby="library-title">
        <h2 id="library-title" className="eyebrow">Library</h2>
        <LibraryGrid items={library} />
      </section>

      {/* -------------------------------------------------- your brand */}
      <section className="mt-9" aria-labelledby="brand-title">
        <h2 id="brand-title" className="eyebrow">Your brand</h2>
        <Link href="/business/brand" className="mt-1 flex min-h-16 items-center gap-3 py-3">
          <Avatar src={kit.logo_url ?? business.logo_url} name={business.name} size={44} />
          {palette.length > 0 && (
            <span className="flex shrink-0 -space-x-2" aria-label={`Colours ${palette.join(", ")}`}>
              {palette.map((c) => (
                <span key={c} className="h-7 w-7 rounded-full ring-2 ring-paper" style={{ background: c }} />
              ))}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate font-display text-[1.0625rem] font-700">
            {hasBrand ? (typeNames.join(" / ") || business.name) : "No brand kit yet"}
          </span>
          <span className="link-row shrink-0">Brand<CaretRight size={16} aria-hidden /></span>
        </Link>
      </section>
    </main>
  );
}

/**
 * The next shoot as a picture: the latest deliverable or the brand cover
 * with the date on it, then what is planned and who is coming.
 */
function NextShoot({
  plan, next, todayKey, picture,
}: { plan: string | null; next: ContentShoot | null; todayKey: string; picture: string | null }) {
  const days = next?.scheduled_for ? daysBetween(todayKey, next.scheduled_for) : null;
  const soon = days === 0 ? "Today" : days === 1 ? "Tomorrow" : days != null && days > 1 ? `In ${days} days` : null;

  return (
    <section className="mt-9" aria-labelledby="shoot-title">
      <h2 id="shoot-title" className="eyebrow">Next content shoot</h2>
      {!plan ? (
        <div className="mt-2">
          <p className="text-sm text-ink-soft">Photo and video shoots come with a plan.</p>
          <Link href="/business/plan" className="link-row">See plans<CaretRight size={16} aria-hidden /></Link>
        </div>
      ) : !next ? (
        <div className="mt-2">
          <p className="text-sm text-ink-soft">This month&apos;s shoots are done.</p>
          <Link href="/business/content/shoots" className="link-row">All shoots<CaretRight size={16} aria-hidden /></Link>
        </div>
      ) : (
        <div className="mt-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-[14px] bg-surface-2">
            {picture ? (
              <MediaPreview src={picture} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 672px, 100vw" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
                <Camera size={48} weight="duotone" className="text-ink-soft" aria-hidden />
              </div>
            )}
            <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
            {soon && <span className="glass-tag absolute top-3 left-3 px-2 py-1 font-display text-xs font-700 text-white">{soon}</span>}
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <p className="font-display text-[2rem] leading-none font-800 tracking-[-0.03em] md:text-[2.5rem]">
                {next.scheduled_for ? longDayLabel(next.scheduled_for) : "Date to be set"}
              </p>
              <p className="mt-1.5 text-sm text-white/80">{next.photos_planned} photos · {next.videos_planned} short videos</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-display text-[1.0625rem] font-700">{next.assigned_label ?? "TapMart team"}</span>
              <Chip tone={shootStatusTone(next.status)}>{shootStatusLabel(next.status)}</Chip>
            </div>
            <Link href={`/business/content/shoots/${next.id}`} className="btn shrink-0">View shoot</Link>
          </div>
        </div>
      )}
    </section>
  );
}
