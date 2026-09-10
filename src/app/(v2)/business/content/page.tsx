import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { defaultTimezone } from "@/lib/ai/schedule";
import { ensureMonthlyShoots, getNextShoot } from "@/lib/business/shoots";
import { publishProviderStatus } from "@/lib/business/publishing";
import { getBrandKit } from "@/lib/business/brand";
import { Avatar, ScreenHeader, StatusChip } from "@/components/v2/ui";
import { CalendarBoard } from "./CalendarBoard";
import { dayKeyOf, dayLabel, daysBetween } from "./dates";
import type { CalendarPost } from "./types";

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
 * The Content tab: the next shoot, this month's calendar, the posts in it,
 * and the brand they follow. Posting for the business needs a connected
 * account, and the page says so until one exists.
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

  const [shoot, rows, instagram, brand] = await Promise.all([
    ensureMonthlyShoots(business.id, now).then(async (r) => ({ plan: r.plan, next: r.plan ? await getNextShoot(business.id) : null })),
    sql<PostRow>(
      `select id, platform, status::text as status, title, copy, caption, format, source, thumbnail_url,
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
  ]);
  const posts: CalendarPost[] = rows.map((r) => ({
    ...r,
    scheduled_for: iso(r.scheduled_for),
    recommended_time: iso(r.recommended_time),
    published_at: iso(r.published_at),
    created_at: iso(r.created_at) ?? new Date().toISOString(),
  }));
  const canApprove = ["owner", "manager"].includes(business.member_role) || ctx.user.role === "admin";

  const kit = brand.kit;
  const palette = kit.palette.slice(0, 3);
  const typeNames = [kit.type.display, kit.type.body].filter(Boolean) as string[];
  const hasBrand = Boolean(kit.logo_url || palette.length || typeNames.length);
  const shootDays = shoot.next?.scheduled_for ? daysBetween(todayKey, shoot.next.scheduled_for) : null;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="Content" unread={ctx.unreadNotifications} showSearch={false} />

      {/* ------------------------------------------------ next shoot */}
      <section className="mt-7" aria-labelledby="shoot-title">
        <h2 id="shoot-title" className="eyebrow">Next content shoot</h2>
        {!shoot.plan ? (
          <div className="mt-2">
            <p className="text-sm text-ink-soft">Photo and video shoots come with a plan.</p>
            <Link href="/business/plan" className="link-row">See plans<CaretRight size={16} aria-hidden /></Link>
          </div>
        ) : (
          <div className="mt-3 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="font-display text-[1.75rem] leading-none font-800 tracking-[-0.03em]">
                {shoot.next?.scheduled_for ? dayLabel(shoot.next.scheduled_for) : "Not booked yet"}
              </p>
              {shoot.next ? (
                <>
                  <p className="mt-1.5 text-sm text-ink-soft">
                    {shootDays === 0 ? "Today" : shootDays === 1 ? "Tomorrow" : shootDays != null && shootDays > 1 ? `In ${shootDays} days` : null}
                    {shootDays != null && shootDays >= 0 ? " · " : ""}
                    {shoot.next.photos_planned} photos · {shoot.next.videos_planned} short videos
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusChip status={shoot.next.status} />
                    {shoot.next.assigned_label && <span className="truncate text-sm text-ink-faint">with {shoot.next.assigned_label}</span>}
                  </div>
                </>
              ) : (
                <p className="mt-1.5 text-sm text-ink-soft">This month&apos;s shoots are done.</p>
              )}
            </div>
            <Link href="/business/content/shoots" className="link-row shrink-0">All shoots<CaretRight size={16} aria-hidden /></Link>
          </div>
        )}
      </section>

      {/* ------------------------------------------------- this month */}
      <section className="mt-9" aria-labelledby="month-title">
        <h2 id="month-title" className="eyebrow">This month</h2>
        <CalendarBoard
          businessId={business.id}
          month={month}
          timeZone={timeZone}
          todayKey={todayKey}
          initialDay={initialDay}
          posts={posts}
          canAutoPost={instagram.canAutoPublish}
          canApprove={canApprove}
        />
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
