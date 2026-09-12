import { Camera, Images, Palette, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { defaultTimezone } from "@/lib/ai/schedule";
import { getContentState } from "@/lib/business/content-state";
import { listDeliverables, type Deliverable } from "@/lib/business/deliverables";
import { getBrandKit } from "@/lib/business/brand";
import { SurfaceRow } from "@/components/v2/ui";
import { MadeForYou, DeliveredGrid } from "./MadeForYou";
import { ScheduledItem } from "./ScheduledList";
import { EmptyCard } from "./EmptyCard";
import { ShootCard } from "./ShootCard";
import { dayKeyOf, dayLabel, defaultScheduleSlot } from "@/app/(v2)/business/content/dates";
import type { ScheduledPost } from "@/app/(v2)/business/content/types";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

type PostRow = Omit<ScheduledPost, "when"> & { when: Date | string };

/**
 * Business Content, as OpenAI designed it (docs/design-specs/business-content.md):
 * the files waiting for a decision first, then this month's shoot, then
 * what exists now (delivered files, scheduled posts) and the brand kit.
 * Every block is real data or an honest empty card; nothing is staged.
 */
export default async function ContentPage() {
  const ctx = await requireBusinessContext("/business/content");
  const business = ctx.activeBusiness;
  const timeZone = defaultTimezone();
  const now = new Date();
  const todayKey = dayKeyOf(now, timeZone);

  const info = await getContentState(business.id, now);
  const subscribed = info.state !== "NOT_SUBSCRIBED";

  const [rows, queue, files, details, brand] = await Promise.all([
    sql<PostRow>(
      `select p.id, p.deliverable_id, p.platform, p.status::text as status, p.title, p.caption, p.format,
              d.kind, d.url, coalesce(p.thumbnail_url, d.thumbnail_url) as thumbnail_url,
              coalesce(p.published_at, p.scheduled_for) as "when"
         from calendar_posts p join content_deliverables d on d.id = p.deliverable_id
        where p.business_id = $1 and p.status in ('scheduled', 'published')
          and coalesce(p.published_at, p.scheduled_for) is not null
        order by (p.status = 'scheduled') desc, coalesce(p.published_at, p.scheduled_for) desc, p.created_at desc
        limit 40`,
      [business.id],
    ),
    listDeliverables(business.id, { status: ["new", "approved"] }),
    listDeliverables(business.id, { status: ["new", "approved", "scheduled", "published"], limit: 60 }),
    sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]),
    getBrandKit(business.id).catch(() => null),
  ]);

  const posts: ScheduledPost[] = rows.map((r) => ({ ...r, when: new Date(r.when).toISOString() }));
  // The queue: files the business has not decided on (new), or approved but not on the calendar yet.
  const pending = queue.filter((d) => d.status === "new" || (d.status === "approved" && !d.calendar_post_id));
  const newCount = pending.filter((d) => d.status === "new").length;
  // Delivered: the latest shoot's files, whatever the business did with them since.
  const latestShootId = files[0]?.shoot_id ?? null;
  const delivered: Deliverable[] = latestShootId ? files.filter((d) => d.shoot_id === latestShootId) : [];
  const deliveredDate = delivered[0]?.shoot_date ? dayLabel(delivered[0].shoot_date, { weekday: false }) : null;
  const uploader = pending.find((d) => d.uploader_name) ?? delivered.find((d) => d.uploader_name) ?? null;
  const zoneLabel = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  const slot = defaultScheduleSlot(todayKey);
  const uploaderInfo = uploader ? { name: uploader.uploader_name ?? "TapMart creator", verified: uploader.uploader_verified } : null;

  const kit = brand?.kit;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));
  const kitState = !hasKit ? { sub: "Not set up", text: "Not set", tone: "faint" as const }
    : brand?.proposed ? { sub: "Needs review", text: "Review", tone: "review" as const }
    : brand?.status === "approved" ? { sub: "Ready for content", text: "Ready", tone: "signal" as const }
    : { sub: "Needs review", text: "Pending", tone: "warning" as const };

  const location = [business.name, details?.city].filter(Boolean).join(" · ");
  const hasQueue = pending.length > 0;

  const queueBlock = hasQueue && (
    <section aria-labelledby="made-title">
      <div className="flex h-6 items-center justify-between">
        <h2 id="made-title" className="eyebrow">Made for you</h2>
        <span className="tnum inline-flex h-6 items-center rounded-full bg-signal/14 px-2.5 text-[11px] leading-[13px] font-700 text-signal">
          {newCount > 0 ? `${newCount} pending review` : `${pending.length} ready to schedule`}
        </span>
      </div>
      <div className="mt-2.5">
        <MadeForYou items={pending} uploader={uploaderInfo} defaultSlot={slot} timeZoneLabel={zoneLabel} />
      </div>
    </section>
  );

  const deliveredBlock = (
    <section aria-labelledby="delivered-title">
      <div className="flex h-6 items-center justify-between">
        <h2 id="delivered-title" className="eyebrow">Delivered</h2>
        {deliveredDate && <span className="text-[12px] leading-4 text-ink-faint">From the {deliveredDate} shoot</span>}
      </div>
      <div className="mt-2.5">
        {delivered.length === 0 ? (
          <EmptyCard icon={<Images size={22} aria-hidden />} title="No delivered files yet" copy="Photos and videos from completed shoots will appear here." />
        ) : (
          <DeliveredGrid items={delivered} defaultSlot={slot} timeZoneLabel={zoneLabel} />
        )}
      </div>
    </section>
  );

  const shootBlock = (
    <section aria-labelledby="shoot-title">
      <h2 id="shoot-title" className="eyebrow">Monthly shoot</h2>
      <div className="mt-2.5">
        <ShootCard shoot={info.nextShoot} subscribed={subscribed} location={location} primary={!hasQueue} />
      </div>
      <div className="mt-[9px]">
        <SurfaceRow href="/business/content/shoots" icon={<Camera size={20} aria-hidden />} title="All shoots" sub="Booked and past shoots" />
      </div>
    </section>
  );

  const scheduledBlock = (
    <section aria-labelledby="scheduled-title">
      <h2 id="scheduled-title" className="eyebrow">Scheduled</h2>
      <div className="mt-2.5">
        {posts.length === 0 ? (
          <EmptyCard icon={<CalendarBlank size={22} aria-hidden />} title="No scheduled posts" copy="Approved content appears here after it is scheduled." />
        ) : (
          <ul className="flex flex-col gap-[9px]">
            {posts.map((p, i) => <ScheduledItem key={p.id} post={p} timeZone={timeZone} index={i} />)}
          </ul>
        )}
      </div>
    </section>
  );

  const kitBlock = (
    <section aria-label="Brand kit">
      <SurfaceRow href="/business/brand" icon={<Palette size={20} aria-hidden />} title="Brand kit" sub={kitState.sub} status={kitState.text} statusTone={kitState.tone} />
    </section>
  );

  return (
    <main id="main" className="mx-auto w-full max-w-[390px] px-4 pt-[14px] pb-6 rail:max-w-none rail:px-8 rail:pt-0 rail:pb-10">
      <header className="reveal rail:flex rail:h-16 rail:items-center">
        <p className="eyebrow truncate rail:hidden">{business.name}</p>
        <h1 className="mt-1 font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px] rail:mt-0 rail:text-[30px] rail:leading-9 rail:font-[820] rail:tracking-[-0.8px]">Content</h1>
      </header>

      {/* Phone: one feed in the designed order. */}
      <div className="mt-6 flex flex-col gap-6 rail:hidden">
        {queueBlock}
        {shootBlock}
        {deliveredBlock}
        {scheduledBlock}
        {kitBlock}
      </div>

      {/* Desktop: 792px main column of decisions and files; 360px sticky side column of schedule and setup. */}
      <div className="hidden rail:mt-6 rail:grid rail:max-w-[1180px] rail:grid-cols-[792px_360px] rail:items-start rail:gap-7">
        <div className="flex flex-col gap-6">
          {queueBlock}
          {!hasQueue && delivered.length === 0 ? (
            <section aria-label="Delivered">
              <div className="max-w-[520px]">
                <EmptyCard icon={<Images size={22} aria-hidden />} title="No content delivered yet" copy="Photos and videos from completed shoots will appear here." />
              </div>
            </section>
          ) : deliveredBlock}
        </div>
        <aside className="sticky top-6 flex flex-col gap-6">
          {shootBlock}
          {scheduledBlock}
          {kitBlock}
        </aside>
      </div>
    </main>
  );
}
