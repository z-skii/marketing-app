"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AgentProposal } from "@/lib/agents";
import {
  approveProposal, editAndApproveProposal, rejectProposal, retryFailedProposal,
} from "./actions";

const AGENT_TONES: Record<string, string> = {
  ops: "bg-ink text-paper",
  admin: "bg-signal text-white",
  creative: "bg-amber-600 text-white",
  ads: "bg-emerald-700 text-white",
  social: "bg-sky-700 text-white",
};

function isImage(url: string) {
  return /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);
}
function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

/**
 * One proposal awaiting a decision. Edit opens the payload as a form for the
 * common kinds and raw JSON for the rest; saving approves the edited payload.
 */
export function ProposalCard({ proposal }: { proposal: AgentProposal }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => JSON.stringify(proposal.payload, null, 2));
  const [error, setError] = useState<string | null>(null);

  const cost = Number(proposal.estimated_cost_usd);
  const failed = proposal.status === "failed";

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Something went wrong.");
      else router.refresh();
    });
  }

  function patchDraft(mutate: (payload: Record<string, unknown>) => void) {
    try {
      const payload = JSON.parse(draft) as Record<string, unknown>;
      mutate(payload);
      setDraft(JSON.stringify(payload, null, 2));
    } catch {
      /* raw JSON is the source of truth; the form fields just help */
    }
  }

  return (
    <li className="flex flex-col gap-3 bg-paper p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`px-2 py-0.5 font-mono text-[0.625rem] font-600 uppercase tracking-wider ${AGENT_TONES[proposal.agent] ?? "bg-ink text-paper"}`}>
          {proposal.agent}
        </span>
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-faint">
          {proposal.kind.replace(/_/g, " ")}
        </span>
        {cost > 0 && (
          <span className="tnum ml-auto font-mono text-xs font-600">≈ ${cost.toFixed(2)}</span>
        )}
      </div>

      <div>
        <div className="font-display text-lg leading-tight font-700 tracking-[-0.02em]">
          {proposal.title}
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap text-ink-soft">{proposal.rationale}</p>
      </div>

      {proposal.assets && proposal.assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {proposal.assets.map((url) =>
            isImage(url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="proposed creative" className="h-24 w-24 border border-rule object-cover" />
            ) : isVideo(url) ? (
              <video key={url} src={url} controls className="h-24 border border-rule" />
            ) : (
              <a key={url} href={url} className="font-mono text-xs underline" target="_blank" rel="noreferrer">
                {url.split("/").pop()}
              </a>
            ),
          )}
        </div>
      )}

      {failed && proposal.execution_result && (
        <p className="border border-signal p-2 font-mono text-xs text-signal">
          Execution failed: {String((proposal.execution_result as { error?: string }).error ?? "unknown")}
        </p>
      )}

      {editing ? (
        <div className="flex flex-col gap-2">
          <EditFields kind={proposal.kind} draft={draft} patch={patchDraft} />
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={Math.min(14, draft.split("\n").length + 1)}
            spellCheck={false}
            className="w-full border border-rule bg-transparent p-2 font-mono text-xs"
            aria-label="Proposal payload JSON"
          />
        </div>
      ) : (
        <details>
          <summary className="cursor-pointer font-mono text-[0.6875rem] text-ink-faint">
            payload
          </summary>
          <pre className="mt-2 overflow-x-auto border border-rule p-2 font-mono text-xs">
            {JSON.stringify(proposal.payload, null, 2)}
          </pre>
        </details>
      )}

      {error && <p className="font-mono text-xs text-signal">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {failed ? (
          <button type="button" className="btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                  onClick={() => run(() => retryFailedProposal(proposal.id))}>
            File again
          </button>
        ) : editing ? (
          <>
            <button type="button" className="btn-signal btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                    onClick={() => run(() => editAndApproveProposal(proposal.id, draft))}>
              Save &amp; approve
            </button>
            <button type="button" className="btn-ghost btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                    onClick={() => { setEditing(false); setDraft(JSON.stringify(proposal.payload, null, 2)); }}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn-signal btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                    onClick={() => run(() => approveProposal(proposal.id))}>
              Approve
            </button>
            <button type="button" className="btn-ghost btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                    onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className="btn-ghost btn !min-h-0 !px-4 !py-2 !text-xs" disabled={pending}
                    onClick={() => run(() => rejectProposal(proposal.id))}>
              Reject
            </button>
          </>
        )}
        <span className="ml-auto self-center font-mono text-[0.625rem] text-ink-faint">
          {new Date(proposal.created_at).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
        </span>
      </div>
    </li>
  );
}

/** Friendly inputs for the common kinds; they rewrite the JSON draft below. */
function EditFields({
  kind, draft, patch,
}: {
  kind: string;
  draft: string;
  patch: (mutate: (payload: Record<string, unknown>) => void) => void;
}) {
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(draft) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (kind === "price_change") {
    const changes = (payload.changes ?? {}) as Record<string, number>;
    return (
      <div className="flex flex-wrap gap-3">
        {Object.entries(changes).map(([key, value]) => (
          <label key={key} className="flex flex-col gap-1 font-mono text-[0.625rem] text-ink-faint">
            {key.replace(/_/g, " ")}
            <input
              type="number" min={1} defaultValue={value}
              className="w-28 border border-rule bg-transparent p-2 font-mono text-sm"
              onChange={(event) => patch((p) => {
                (p.changes as Record<string, number>)[key] = Number(event.target.value);
              })}
            />
          </label>
        ))}
      </div>
    );
  }

  if (kind === "budget_change" || kind === "ad_campaign") {
    return (
      <label className="flex flex-col gap-1 font-mono text-[0.625rem] text-ink-faint">
        daily budget (cents)
        <input
          type="number" min={100} defaultValue={Number(payload.daily_budget_cents ?? 0)}
          className="w-32 border border-rule bg-transparent p-2 font-mono text-sm"
          onChange={(event) => patch((p) => { p.daily_budget_cents = Number(event.target.value); })}
        />
      </label>
    );
  }

  if (kind === "social_post") {
    return (
      <label className="flex flex-col gap-1 font-mono text-[0.625rem] text-ink-faint">
        post text
        <textarea
          defaultValue={String(payload.text ?? "")} rows={4}
          className="w-full border border-rule bg-transparent p-2 text-sm"
          onChange={(event) => patch((p) => { p.text = event.target.value; })}
        />
      </label>
    );
  }

  if (kind === "email" || kind === "outreach_email") {
    return (
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 font-mono text-[0.625rem] text-ink-faint">
          subject
          <input
            defaultValue={String(payload.subject ?? "")}
            className="w-full border border-rule bg-transparent p-2 text-sm"
            onChange={(event) => patch((p) => { p.subject = event.target.value; })}
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-[0.625rem] text-ink-faint">
          body
          <textarea
            defaultValue={String(payload.body ?? "")} rows={6}
            className="w-full border border-rule bg-transparent p-2 text-sm"
            onChange={(event) => patch((p) => { p.body = event.target.value; })}
          />
        </label>
      </div>
    );
  }

  return null;
}
