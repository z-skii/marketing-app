import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { ScreenHeader } from "@/components/v2/ui";
import { CalendarBoard } from "./CalendarBoard";
import type { CalendarPost } from "./types";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

/**
 * The Content tab: plan posts, approve them, mark them published. Posting
 * for you needs a connected account, and the page says so until one is.
 */
export default async function ContentPage() {
  const ctx = await requireBusinessContext("/business/content");
  const business = ctx.activeBusiness;

  const [posts, connected] = await Promise.all([
    sql<CalendarPost>(
      `select id, platform, status::text as status, title, copy, scheduled_for, published_at, created_at
         from calendar_posts where business_id = $1
        order by coalesce(scheduled_for, created_at) desc limit 200`,
      [business.id],
    ),
    sqlOne<{ n: string }>(
      `select count(*)::text as n from connected_accounts where business_id = $1 and status = 'connected'`,
      [business.id],
    ),
  ]);
  const canAutoPost = Number(connected?.n ?? 0) > 0;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <ScreenHeader kicker={business.name} title="Content" unread={ctx.unreadNotifications} showSearch={false} />
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">Plan, approve and publish.</p>
      {!canAutoPost && (
        <p className="mt-3 text-sm text-ink-faint">
          Auto-posting turns on once an account is connected. Until then, mark posts published yourself.
        </p>
      )}
      <CalendarBoard businessId={business.id} posts={posts} canAutoPost={canAutoPost} />
    </main>
  );
}
