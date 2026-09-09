"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Loader2, Play, Sunrise, Sunset, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { startChecklistAction } from "@/app/(app)/store-check/actions";

export interface BoardRun {
  template: { id: string; name: string; kind: "opening" | "closing" | "custom" };
  required: boolean;
  submission: { id: string; status: "in_progress" | "completed"; completed_at: string | null; submitted_by_name: string | null } | null;
}
export interface BoardStore {
  id: string;
  name: string;
  timezone: string;
  date: string;
  runs: BoardRun[];
}

const KIND_ICON = { opening: Sunrise, closing: Sunset, custom: ListChecks } as const;

/** Today's Opening / Closing status for each store, with a button to run each checklist. */
export function StatusBoard({ stores, variant = "manager" }: { stores: BoardStore[]; variant?: "manager" | "employee" }) {
  const big = variant === "employee";
  return (
    <div className={cn("grid gap-3", big ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
      {stores.map((s) => (
        <div key={s.id} className="card">
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border">
            <div className="min-w-0">
              <div className={cn("font-semibold truncate", big ? "text-[16px]" : "text-[13.5px]")}>{s.name}</div>
              <div className="text-[11.5px] text-text-3">{s.date}</div>
            </div>
            <StoreSummary runs={s.runs} />
          </div>
          <div className={cn("divide-y divide-border", big ? "" : "")}>
            {s.runs.length === 0 && <div className="px-4 py-3 text-[13px] text-text-3">No active checklists for this store.</div>}
            {s.runs.map((r) => <RunRow key={r.template.id} store={s} run={r} big={big} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function StoreSummary({ runs }: { runs: BoardRun[] }) {
  const opening = runs.find((r) => r.template.kind === "opening")?.submission;
  const closing = runs.find((r) => r.template.kind === "closing")?.submission;
  if (closing?.status === "completed") return <Badge tone="neutral">Closed ✓</Badge>;
  if (opening?.status === "completed") return <Badge tone="success">Opened ✓</Badge>;
  if (opening?.status === "in_progress" || closing?.status === "in_progress") return <Badge tone="warn">In progress</Badge>;
  return <Badge tone="neutral">Not started</Badge>;
}

function RunRow({ store, run, big }: { store: BoardStore; run: BoardRun; big: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const Icon = KIND_ICON[run.template.kind];
  const sub = run.submission;
  const done = sub?.status === "completed";

  const begin = () => start(async () => {
    setError(null);
    const res = await startChecklistAction(run.template.id, store.id);
    if (!res.ok) { setError(res.error); toast.push(res.error, "danger"); return; }
    router.push(`/store-check/${res.data.submissionId}`);
  });

  return (
    <div className={cn("flex items-center gap-3 px-4", big ? "py-3.5" : "py-2.5")}>
      <span className={cn("shrink-0", done ? "text-success" : sub ? "text-warn" : "text-text-3")}>
        {done ? <CheckCircle2 className={big ? "h-6 w-6" : "h-4.5 w-4.5"} /> : <Circle className={big ? "h-6 w-6" : "h-4.5 w-4.5"} />}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-text-3 shrink-0" />
          <span className={cn("font-medium truncate", big ? "text-[15px]" : "text-[13px]")}>{run.template.name}</span>
          {run.required && <span className="text-[10.5px] uppercase tracking-wide text-text-3">required</span>}
        </div>
        <div className={cn("tnum", big ? "text-[13px]" : "text-[12px]", done ? "text-success" : sub ? "text-warn" : "text-text-3")}>
          {done
            ? <>Completed ✓ {formatTime(sub!.completed_at, store.timezone)}{sub!.submitted_by_name ? ` · ${sub!.submitted_by_name}` : ""}</>
            : sub ? "In progress" : "Not started"}
        </div>
        {error && <div className="text-[12px] text-danger">{error}</div>}
      </div>
      {sub ? (
        <Link href={`/store-check/${sub.id}`} className={cn("inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap",
          big ? "h-11 px-4 text-[14px]" : "h-7 px-2.5 text-[12.5px]",
          done ? "border-border bg-surface text-text hover:bg-surface-2" : "border-transparent bg-accent text-white hover:bg-accent-hover")}>
          {done ? "View" : "Continue"}
        </Link>
      ) : (
        <Button size={big ? "lg" : "sm"} variant={big ? "primary" : "secondary"} onClick={begin} disabled={pending} className={big ? "h-11 px-4" : ""}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          {big ? `Start ${run.template.kind === "custom" ? "" : run.template.kind}`.trim() : "Run"}
        </Button>
      )}
    </div>
  );
}
