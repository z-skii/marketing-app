import Link from "next/link";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/auth";
import {
  getLatestBrief, getProposalCounts, getProposals, getRuns, type AgentRun,
} from "@/lib/agents";
import { ProposalCard } from "./ProposalCard";

export const metadata = { title: "Agents", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const TABS = ["pending", "executed", "rejected", "runs"] as const;
type Tab = (typeof TABS)[number];

export default async function AgentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin/agents");
  if (user.role !== "admin") redirect("/");

  const params = await searchParams;
  const tab: Tab = TABS.includes(params.tab as Tab) ? (params.tab as Tab) : "pending";
  const counts = await getProposalCounts();

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-8 md:py-14">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-3xl leading-[0.92] font-800 tracking-[-0.045em] md:text-4xl">
            Agents
          </h1>
          <Link href="/admin/hq" className="font-mono text-xs underline">
            HQ
          </Link>
          <Link href="/admin" className="font-mono text-xs text-ink-faint underline">
            admin
          </Link>
        </div>

        <nav className="mt-6 flex gap-1 overflow-x-auto" aria-label="Proposal tabs">
          {TABS.map((name) => {
            const count =
              name === "pending" ? (counts.pending ?? 0) + (counts.failed ?? 0)
              : name === "runs" ? null
              : counts[name] ?? 0;
            return (
              <Link
                key={name}
                href={name === "pending" ? "/admin/agents" : `/admin/agents?tab=${name}`}
                className={`shrink-0 px-3 py-2 font-mono text-xs uppercase tracking-wider ${
                  tab === name ? "bg-ink text-paper" : "text-ink-faint hover:text-ink"
                }`}
                aria-current={tab === name ? "page" : undefined}
              >
                {name}
                {count !== null && count > 0 && <span className="tnum ml-1.5">{count}</span>}
              </Link>
            );
          })}
        </nav>

        {tab === "runs" ? <RunsTab /> : <ProposalsTab tab={tab} />}
      </main>
    </>
  );
}

async function ProposalsTab({ tab }: { tab: Exclude<Tab, "runs"> }) {
  const proposals = await getProposals(
    tab === "pending" ? ["pending", "failed", "approved"] : [tab],
  );
  const failed = proposals.filter((p) => p.status === "failed");
  const approved = proposals.filter((p) => p.status === "approved");
  const rest = proposals.filter((p) => p.status !== "failed" && p.status !== "approved");

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-8">
      {tab === "pending" && failed.length > 0 && (
        <section>
          <h2 className="eyebrow text-signal">Failed · needs attention</h2>
          <ul className="mt-3 flex flex-col gap-px bg-rule">
            {failed.map((p) => <ProposalCard key={p.id} proposal={p} />)}
          </ul>
        </section>
      )}

      <section>
        {tab === "pending" && <h2 className="eyebrow">Waiting for you</h2>}
        {rest.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ink-faint">
            {tab === "pending" ? "Nothing waiting. The agents will file proposals here." : "None yet."}
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-px bg-rule">
            {rest.map((p) => <ProposalCard key={p.id} proposal={p} />)}
          </ul>
        )}
      </section>

      {tab === "pending" && approved.length > 0 && (
        <section>
          <h2 className="eyebrow">Approved · executing shortly</h2>
          <ul className="mt-3 flex flex-col gap-1">
            {approved.map((p) => (
              <li key={p.id} className="font-mono text-xs text-ink-soft">
                {p.agent} · {p.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

async function RunsTab() {
  const [runs, brief] = await Promise.all([getRuns(), getLatestBrief()]);

  return (
    <div className="mt-6 flex max-w-2xl flex-col gap-8">
      {brief && (
        <section className="border border-ink p-4">
          <div className="flex items-baseline justify-between">
            <h2 className="eyebrow">Daily brief</h2>
            <span className="font-mono text-[0.625rem] text-ink-faint">
              {new Date(brief.started_at).toLocaleString("en-US", {
                weekday: "short", month: "short", day: "numeric",
              })}
            </span>
          </div>
          <div className="mt-3 text-sm whitespace-pre-wrap">{brief.summary}</div>
        </section>
      )}

      <section>
        <h2 className="eyebrow">Runs</h2>
        {runs.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ink-faint">No runs yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-px bg-rule">
            {runs.map((run) => <RunRow key={run.id} run={run} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

function RunRow({ run }: { run: AgentRun }) {
  const tokens = (run.input_tokens ?? 0) + (run.output_tokens ?? 0);
  return (
    <li className="bg-paper p-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-xs font-600 uppercase tracking-wider">{run.agent}</span>
        <span className="font-mono text-[0.625rem] text-ink-faint">
          {new Date(run.started_at).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
        </span>
        {run.model && <span className="font-mono text-[0.625rem] text-ink-faint">{run.model}</span>}
        {tokens > 0 && (
          <span className="tnum font-mono text-[0.625rem] text-ink-faint">{tokens.toLocaleString()} tok</span>
        )}
        {!run.finished_at && <span className="font-mono text-[0.625rem] text-amber-600">running…</span>}
      </div>
      {run.summary && (
        <details className="mt-1">
          <summary className="cursor-pointer text-sm text-ink-soft">
            {run.summary.length > 140 ? `${run.summary.slice(0, 140)}…` : run.summary}
          </summary>
          {run.summary.length > 140 && (
            <div className="mt-2 text-sm whitespace-pre-wrap text-ink-soft">{run.summary}</div>
          )}
        </details>
      )}
      {run.error && (
        <p className="mt-1 font-mono text-xs break-all text-signal">{run.error}</p>
      )}
    </li>
  );
}
