import Link from "next/link";
import { AdminNav } from "../AdminNav";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { LiveRefresh } from "@/components/live/LiveRefresh";
import { getCurrentUser } from "@/lib/auth";
import {
  getActivityFeed, getAgentRoster, getHqStats, getLatestBrief, getSchedules,
  type AgentStatus, type FeedItem,
} from "@/lib/agents";
import { formatCredit, formatCount } from "@/lib/money";

export const metadata = { title: "HQ", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Mission control: every agent's live status, a feed of what they are doing
 * right now, and today's numbers — refreshed every 20 seconds while open.
 */
export default async function HqPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin/hq");
  if (user.role !== "admin") redirect("/");

  const [roster, feed, stats, schedules, brief] = await Promise.all([
    getAgentRoster(), getActivityFeed(), getHqStats(), getSchedules(), getLatestBrief(),
  ]);

  return (
    <>
      <Header user={user} />
      <LiveRefresh seconds={20} />
      <main id="main" className="shell py-8 md:py-14">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h1 className="font-display text-3xl leading-[0.92] font-800 tracking-[-0.045em] md:text-4xl">
            HQ
          </h1>
          <span className="font-mono text-[0.625rem] text-ink-faint">refreshes every 20s</span>
          {stats.pending_total > 0 && (
            <Link className="ml-auto font-mono text-xs underline" href="/admin/agents">
              approvals<span className="tnum ml-1 font-600">{stats.pending_total}</span>
            </Link>
          )}
        </div>
        <div className="mt-5"><AdminNav /></div>

        <section className="mt-7">
          <h2 className="eyebrow">Today</h2>
          <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4 lg:grid-cols-8">
            <Stat label="Opens" value={formatCount(stats.qualified_today)} />
            <Stat label="Rejected" value={formatCount(stats.rejected_today)} />
            <Stat label="Click revenue" value={formatCredit(stats.revenue_cents_today)} emphasis />
            <Stat label="Top-ups" value={formatCredit(stats.topups_cents_today)} />
            <Stat label="Signups" value={formatCount(stats.signups_today)} />
            <Stat label="Visitors (1h)" value={formatCount(stats.visitors_hour)} />
            <Stat label="Live placements" value={formatCount(stats.active_placements)} />
            <Stat label="Awaiting you" value={formatCount(stats.pending_total)} emphasis={stats.pending_total > 0} />
          </div>
        </section>

        <section className="rule mt-8 pt-6">
          <h2 className="eyebrow">Agents</h2>
          <ul className="mt-3 grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-5">
            {roster.map((agent) => (
              <AgentCard key={agent.agent} status={agent} cadence={schedules[agent.agent] ?? "—"} />
            ))}
          </ul>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr]">
          <section className="rule pt-6">
            <h2 className="eyebrow">Live activity</h2>
            {feed.length === 0 ? (
              <p className="mt-3 font-mono text-xs text-ink-faint">Nothing yet.</p>
            ) : (
              <ol className="mt-3 flex flex-col gap-px bg-rule">
                {feed.map((item) => <FeedRow key={`${item.type}-${item.id}`} item={item} />)}
              </ol>
            )}
          </section>

          <section className="rule pt-6">
            <h2 className="eyebrow">Latest brief</h2>
            {brief ? (
              <div className="mt-3 border border-ink p-4">
                <div className="font-mono text-[0.625rem] text-ink-faint">
                  {new Date(brief.started_at).toLocaleString("en-US", {
                    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                  })}
                </div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{brief.summary}</div>
              </div>
            ) : (
              <p className="mt-3 font-mono text-xs text-ink-faint">
                The first daily brief lands on the 8am ET ops run.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

const TONES: Record<string, string> = {
  ops: "bg-ink text-paper",
  admin: "bg-signal text-white",
  creative: "bg-amber-600 text-white",
  ads: "bg-emerald-700 text-white",
  social: "bg-sky-700 text-white",
};

function AgentCard({ status, cadence }: { status: AgentStatus; cadence: string }) {
  const running = status.last_started !== null && status.last_finished === null;
  const dormant = status.last_started === null;
  const failing = !running && status.last_error !== null;
  const state = running ? "working…" : dormant ? "dormant" : failing ? "error" : "idle";
  const tone = running ? "text-emerald-700" : dormant ? "text-ink-faint" : failing ? "text-signal" : "text-ink-soft";

  return (
    <li className="flex flex-col gap-2 bg-paper p-4">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 font-mono text-[0.625rem] font-600 uppercase tracking-wider ${TONES[status.agent]}`}>
          {status.agent}
        </span>
        <span className={`font-mono text-[0.6875rem] font-600 ${tone}`}>
          {running && <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-600" aria-hidden />}
          {state}
        </span>
      </div>
      <div className="font-mono text-[0.625rem] text-ink-faint">
        {cadence}
        {status.last_started && (
          <> · last {new Date(status.last_started).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>
        )}
      </div>
      <div className="tnum font-mono text-[0.625rem] text-ink-faint">
        {status.runs_today} run{status.runs_today === 1 ? "" : "s"} today
        {status.tokens_today > 0 && <> · {status.tokens_today.toLocaleString()} tok</>}
        {status.pending_proposals > 0 && (
          <span className="text-ink font-600"> · {status.pending_proposals} waiting</span>
        )}
      </div>
      {(status.last_summary || status.last_error) && (
        <p className={`line-clamp-3 text-xs ${failing ? "text-signal" : "text-ink-soft"}`}>
          {status.last_error ?? status.last_summary}
        </p>
      )}
      {dormant && (
        <p className="text-xs text-ink-faint">Waiting for its API keys.</p>
      )}
    </li>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  const icon = item.type === "action" ? "⚙" : item.type === "proposal" ? "▲" : "●";
  return (
    <li className="flex items-baseline gap-3 bg-paper px-3 py-2">
      <span className="w-14 shrink-0 font-mono text-[0.625rem] text-ink-faint">
        {new Date(item.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
      </span>
      <span aria-hidden className="shrink-0 font-mono text-[0.625rem] text-ink-faint">{icon}</span>
      <span className="shrink-0 font-mono text-[0.6875rem] font-600 uppercase tracking-wider">{item.agent}</span>
      <span className="min-w-0 flex-1">
        <span className="font-mono text-xs">{item.text.replace(/_/g, " ")}</span>
        {item.detail && (
          <span className="ml-2 truncate text-xs text-ink-faint">{item.detail.slice(0, 120)}</span>
        )}
      </span>
    </li>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1 font-mono font-600 ${emphasis ? "text-xl" : "text-lg text-ink-soft"}`}>
        {value}
      </div>
    </div>
  );
}
