import Link from "next/link";
import { Camera, CaretRight, HourglassMedium } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { defaultTimezone } from "@/lib/ai/schedule";
import { getContentState, atLeast } from "@/lib/business/content-state";
import { listDeliverables } from "@/lib/business/deliverables";
import type { ContentShoot } from "@/lib/business/shoots";
import { ScreenHeader, SurfaceRow } from "@/components/v2/ui";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { MadeForYou } from "./MadeForYou";
import { ScheduledItem } from "./ScheduledList";
import { dayKeyOf, daysBetween, defaultScheduleSlot, groupLabel, longDayLabel, shootTimeLabel, shootWhenLabel, timeOf } from "./dates";
import type { ScheduledPost } from "./types";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

type PostRow = Omit<ScheduledPost, "when"> & { when: Date | string };

/**
 * The Content tab shows only content that exists for this business: the
 * next booked shoot, the files a verified creator delivered, and the posts
 * made from those files. No ideas, no templates, no placeholders.
 */
export default async function ContentPage() {
  const ctx = await requireBusinessContext("/business/content");
  const business = ctx.activeBusiness;
  const timeZone = defaultTimezone();
  const now = new Date();
  const todayKey = dayKeyOf(now, timeZone);

  const info = await getContentState(business.id, now);
  const delivered = atLeast(info.state, "CONTENT_DELIVERED");

  const [rows, rail, media] = await Promise.all([
    delivered
      ? sql<PostRow>(
          `select p.id, p.deliverable_id, p.platform, p.status::text as status, p.title, p.caption, p.format,
                  d.kind, d.url, coalesce(p.thumbnail_url, d.thumbnail_url) as thumbnail_url,
                  coalesce(p.published_at, p.scheduled_for) as "when"
             from calendar_posts p join content_deliverables d on d.id = p.deliverable_id
            where p.business_id = $1 and p.status in ('scheduled', 'published')
              and coalesce(p.published_at, p.scheduled_for) is not null
            order by coalesce(p.published_at, p.scheduled_for) desc, p.created_at desc
            limit 60`,
          [business.id],
        )
      : Promise.resolve([] as PostRow[]),
    delivered ? listDeliverables(business.id, { status: ["new", "approved"] }) : Promise.resolve([]),
    sqlOne<{ cover_url: string | null; logo_url: string | null }>(`select cover_url, logo_url from businesses where id = $1`, [business.id]),
  ]);

  const posts: ScheduledPost[] = rows.map((r) => ({ ...r, when: new Date(r.when).toISOString() }));
  const upcoming = posts.filter((p) => p.status === "scheduled" && dayKeyOf(p.when, timeZone) >= todayKey)
    .sort((a, b) => a.when.localeCompare(b.when));
  const past = posts.filter((p) => !upcoming.includes(p));
  const groups = groupByDay([...upcoming, ...past], timeZone);
  const uploader = rail.find((d) => d.uploader_name);
  const zoneLabel = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? timeZone;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader bell={false} kicker={business.name} title="Content" unread={ctx.unreadNotifications} showSearch={false} />

      {(info.state === "NOT_SUBSCRIBED" || info.state === "SUBSCRIBED_NO_SHOOT") && (
        <WillAppear subscribed={info.state === "SUBSCRIBED_NO_SHOOT"} />
      )}

      {info.state === "SHOOT_SCHEDULED" && info.nextShoot && (
        <NextShoot shoot={info.nextShoot} todayKey={todayKey} picture={media?.cover_url ?? media?.logo_url ?? business.logo_url} />
      )}

      {(info.state === "SHOOT_COMPLETED" || info.state === "CONTENT_PROCESSING") && (
        <Preparing shoot={info.deliveringShoot ?? info.lastShoot} />
      )}

      {delivered && (
        <>
          <section className="mt-8" aria-labelledby="scheduled-title">
            <h2 id="scheduled-title" className="eyebrow">What&apos;s scheduled</h2>
            {groups.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Nothing on the calendar yet. Pick a file below and schedule it.</p>
            ) : (
              groups.map((g) => (
                <div key={g.key} className="mt-4">
                  <p className="font-display text-[1.0625rem] font-700 tracking-[-0.02em] uppercase">{groupLabel(g.key, todayKey)}</p>
                  <ul className="divide-y divide-rule">
                    {g.posts.map((p, i) => <ScheduledItem key={p.id} post={p} time={timeOf(p.when, timeZone)} index={i} />)}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="mt-9" aria-labelledby="made-title">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="made-title" className="eyebrow">Made for you</h2>
              {rail.length > 0 && <span className="tnum text-sm text-ink-faint">{rail.length}</span>}
            </div>
            {rail.length === 0 ? (
              <p className="mt-2 text-sm text-ink-soft">Everything delivered so far is on the calendar.</p>
            ) : (
              <MadeForYou
                items={rail}
                uploader={uploader ? { name: uploader.uploader_name ?? "TapMart creator", verified: uploader.uploader_verified } : null}
                defaultSlot={defaultScheduleSlot(todayKey)}
                timeZoneLabel={zoneLabel}
              />
            )}
          </section>

          <ShootsRow next={info.nextShoot} last={info.lastShoot} />
        </>
      )}
    </main>
  );
}

function groupByDay(posts: ScheduledPost[], timeZone: string): { key: string; posts: ScheduledPost[] }[] {
  const out: { key: string; posts: ScheduledPost[] }[] = [];
  for (const p of posts) {
    const key = dayKeyOf(p.when, timeZone);
    const last = out[out.length - 1];
    if (last && last.key === key) last.posts.push(p);
    else out.push({ key, posts: [p] });
  }
  return out;
}

/** Before any content exists: what will land here, and how. */
function WillAppear({ subscribed }: { subscribed: boolean }) {
  return (
    <section className="mt-10 py-6" aria-labelledby="empty-title">
      <Camera size={44} weight="duotone" className="text-ink-soft" aria-hidden />
      <p className="mt-4 eyebrow">Your content will appear here</p>
      <h2 id="empty-title" className="mt-2 max-w-sm font-display text-[1.5rem] leading-[1.02] font-700 tracking-[-0.02em] md:text-[1.5rem]">
        {subscribed ? "Your first shoot is being scheduled." : "Real photos and videos, shot for you."}
      </h2>
      <p className="mt-3 max-w-md text-sm text-ink-soft">
        After your TapMart content shoot, your approved photos and videos will appear here and be scheduled for your business.
      </p>
      {!subscribed && <Link href="/business/plan" className="btn btn-signal mt-5">View plans</Link>}
    </section>
  );
}

/** A booked shoot: one media object. The date, what is coming and who is coming sit on the picture with the one action. */
function NextShoot({ shoot, todayKey, picture }: { shoot: ContentShoot; todayKey: string; picture: string | null }) {
  const days = shoot.scheduled_for ? daysBetween(todayKey, shoot.scheduled_for) : null;
  const soon = days === 0 ? "Today" : days === 1 ? "Tomorrow" : days != null && days > 1 ? `In ${days} days` : null;
  const time = shootTimeLabel(shoot.starts_at);

  return (
    <section className="mt-6" aria-labelledby="shoot-title">
      <h2 id="shoot-title" className="eyebrow">Next shoot</h2>
      <div className="card relative mt-3 aspect-[4/3] w-full overflow-hidden md:aspect-video">
        {picture ? (
          <MediaPreview src={picture} alt="" className="h-full w-full object-cover" sizes="(min-width: 768px) 672px, 100vw" priority />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_30%_20%,_var(--color-surface-2),_var(--color-surface)_70%)]">
            <Camera size={48} weight="duotone" className="text-ink-soft" aria-hidden />
          </div>
        )}
        <div className="media-scrim absolute inset-x-0 bottom-0 h-3/4" aria-hidden />
        {soon && <span className="glass-tag absolute top-3 left-3 px-2.5 py-1 font-display text-xs font-600 text-ink">{soon}</span>}
        <div className="absolute inset-x-4 bottom-4">
          <p className="font-display text-[1.5rem] leading-[1.05] font-700 tracking-[-0.02em] text-ink md:text-[1.5rem]">
            {shoot.scheduled_for ? longDayLabel(shoot.scheduled_for) : "Date to be set"}
            {time && <span className="text-ink-soft"> · {time}</span>}
          </p>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <p className="tnum min-w-0 truncate text-[0.9375rem] text-ink-soft">
              {shoot.photos_planned} photos · {shoot.videos_planned} videos
            </p>
            <Link href={`/business/content/shoots/${shoot.id}`} className="btn btn-signal btn-sm shrink-0">View shoot</Link>
          </div>
        </div>
      </div>
      <div className="mt-2">
        <SurfaceRow href="/business/content/shoots" icon={<Camera size={22} aria-hidden />} title="All shoots" sub="Booked and past shoots" />
      </div>
    </section>
  );
}

/** The shoot happened; the files are on their way. */
function Preparing({ shoot }: { shoot: ContentShoot | null }) {
  return (
    <section className="mt-10 py-6" aria-labelledby="prep-title">
      <HourglassMedium size={44} weight="duotone" className="text-ink-soft" aria-hidden />
      <h2 id="prep-title" className="mt-4 font-display text-[1.5rem] leading-[1.02] font-700 tracking-[-0.02em] md:text-[1.5rem]">Content is being prepared.</h2>
      <p className="mt-3 text-sm text-ink-soft">
        {shoot?.scheduled_for ? `From the ${shootWhenLabel(shoot.scheduled_for, shoot.starts_at)} shoot. ` : ""}
        Your photos and videos appear here as soon as they are delivered.
      </p>
      {shoot && <Link href={`/business/content/shoots/${shoot.id}`} className="link-row mt-2">View shoot<CaretRight size={16} aria-hidden /></Link>}
    </section>
  );
}

/** One quiet row to the shoots list: the next booked one, or the last one that happened. */
function ShootsRow({ next, last }: { next: ContentShoot | null; last: ContentShoot | null }) {
  const booked = next && next.status === "scheduled" && next.scheduled_for ? next : null;
  const shown = booked ?? last;
  const label = booked ? `Next shoot · ${shootWhenLabel(booked.scheduled_for, booked.starts_at)}`
    : last?.scheduled_for ? `Last shoot · ${shootWhenLabel(last.scheduled_for, last.starts_at)}`
    : "Shoots";
  return (
    <section className="mt-9" aria-label="Shoots">
      <h2 className="eyebrow">Shoots</h2>
      <ul className="mt-1 divide-y divide-rule">
        <li>
          <Link href={shown ? `/business/content/shoots/${shown.id}` : "/business/content/shoots"} className="flex min-h-14 items-center justify-between gap-3 py-3">
            <span className="font-display text-[1.0625rem] font-600">{label}</span>
            <CaretRight size={18} className="text-ink-faint" aria-hidden />
          </Link>
        </li>
        <li>
          <Link href="/business/content/shoots" className="flex min-h-14 items-center justify-between gap-3 py-3">
            <span className="font-display text-[1.0625rem] font-600 text-ink-soft">All shoots</span>
            <CaretRight size={18} className="text-ink-faint" aria-hidden />
          </Link>
        </li>
      </ul>
    </section>
  );
}
