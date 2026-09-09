import { BackButton } from "@/components/v2/BackButton";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { CalendarBoard } from "./CalendarBoard";

export const metadata = { title: "Content calendar" };
export const dynamic = "force-dynamic";

export type CalendarPost = {
  id: string; platform: string; status: string; title: string; copy: string | null;
  scheduled_for: string | null; created_at: string;
};

/** The content calendar: what's planned, what needs approval, what went out. */
export default async function CalendarPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const business = ctx.businesses[0];
  if (!business) redirect("/business/new");

  const posts = await sql<CalendarPost>(
    `select id, platform, status::text as status, title, copy, scheduled_for, created_at
       from calendar_posts where business_id = $1
      order by coalesce(scheduled_for, created_at) desc limit 200`,
    [business.id],
  );

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Content calendar</h1>
      <p className="mt-1.5 text-[0.9375rem] text-ink-soft">
        Plan posts, approve them, and mark them published. Auto-posting turns on
        once accounts are connected.
      </p>
      <CalendarBoard businessId={business.id} posts={posts} />
    </main>
  );
}
