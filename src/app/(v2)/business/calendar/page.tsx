import Link from "next/link";
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
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <Link href="/business" className="font-mono text-xs text-ink-faint hover:text-ink">← Business</Link>
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Content calendar</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Plan posts, approve them, and mark them published. Auto-posting turns on
        once accounts are connected.
      </p>
      <CalendarBoard businessId={business.id} posts={posts} />
    </main>
  );
}
