import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "../AdminNav";
import { ContentReview, type QueueRow } from "./ContentReview";

export const metadata = { title: "Content", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type RunRow = {
  id: string; started_at: string; finished_at: string | null;
  summary: string | null; error: string | null; cost_usd: string | null; output_count: number | null;
};

/**
 * The content review queue: what the agents drafted, with the rendered
 * creative, waiting for the owner's approve/reject and schedule.
 */
export default async function ContentAdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin/content");
  if (user.role !== "admin") redirect("/");

  const [rows, runs, settings] = await Promise.all([
    sql<QueueRow>(
      `select id, platform, format, copy, asset_url, asset_urls, ad_params, hashtags, status,
              scheduled_for, published_at, publish_result, created_at,
              case when status = 'published'
                   then (row_number() over (partition by platform, status order by published_at))::int
              end as post_number
         from content_queue
        where status <> 'rejected'
        order by case status
                   when 'draft' then 0 when 'ready' then 1 when 'approved' then 2
                   when 'failed' then 3 else 4 end,
                 created_at desc
        limit 300`,
    ),
    sql<RunRow>(
      `select id, started_at, finished_at, summary, error, cost_usd::text, output_count
         from agent_runs where agent = 'content'
        order by started_at desc limit 8`,
    ),
    getSettings(),
  ]);

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-14">
        <div className="flex flex-wrap items-baseline gap-4">
          <h1 className="font-display text-3xl leading-[0.92] font-800 tracking-[-0.045em] md:text-4xl">
            Content
          </h1>
          {settings.feature_agent_auto_publish === "true" && (
            <span className="eyebrow !text-signal">auto-publish on</span>
          )}
        </div>
        <div className="mt-5"><AdminNav /></div>

        <section className="mt-6">
          <ContentReview
            rows={rows}
            phase={rows.filter((r) => r.status === "published").length < 20 ? "launch" : "steady"}
          />
        </section>

        <section className="rule mt-10 pt-6 pb-4">
          <h2 className="eyebrow">Generation runs</h2>
          <ol className="mt-3 flex flex-col gap-1">
            {runs.length === 0 && (
              <li className="font-mono text-xs text-ink-faint">No runs yet.</li>
            )}
            {runs.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-3 font-mono text-xs">
                <span className="w-36 shrink-0 text-ink-faint">
                  {new Date(r.started_at).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </span>
                <span className="flex-1">{r.error ?? r.summary ?? "running…"}</span>
                {r.cost_usd != null && (
                  <span className="tnum text-ink-faint">${Number(r.cost_usd).toFixed(4)}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}
