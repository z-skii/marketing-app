"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ErrorText, Field, Textarea } from "@/components/ui/form";
import { ChangePill, KV, Stat } from "@/components/ui/stat";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { formatWeekdayDate, fromISODate } from "@/lib/utils/time";
import { format } from "date-fns";
import type { DailyInputs, DailyTotals } from "@/lib/calc/accounting";
import { Badge } from "@/components/ui/badge";
import { editClosedReportAction, reopenDayAction } from "@/app/(app)/accounting/actions";
import { AttentionList } from "./attention-list";
import { EditClosedModal } from "./edit-closed-modal";
import { parseAttention, parseComparisons, type CloseoutRow, type StoreOption } from "./types";

/** "SEPTEMBER 8 · CLOSED ✓" — the after-close summary with comparisons, attention and follow-up actions. */
export function AfterCloseView({ snapshot, reportId, inputs, live, date, location, nextStore, currency, canEditClosed, onReopened }: {
  snapshot: CloseoutRow; reportId: string; inputs: DailyInputs; live: DailyTotals; date: string; location: StoreOption; nextStore: StoreOption | null;
  currency: string; canEditClosed: boolean; onReopened: () => void;
}) {
  const router = useRouter();
  const [edit, setEdit] = React.useState(false);
  const [reopen, setReopen] = React.useState(false);
  const cmp = parseComparisons(snapshot.comparisons);
  const attention = parseAttention(snapshot.attention);
  const m = (v: number | null | undefined) => formatMoney(v ?? 0, { currency });
  const weekday = format(fromISODate(date), "EEEE");
  const lastWeekDay = format(fromISODate(date), "EEE");
  // Numbers edited after the close (audited edit, late expense) make the frozen snapshot differ from the live view.
  const drifted = Math.abs(live.totalSales - snapshot.total_sales) >= 0.005 || Math.abs(live.totalExpenses - snapshot.total_expenses) >= 0.005 || Math.abs(live.profit - snapshot.profit) >= 0.005;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-semibold uppercase tracking-wide">{format(fromISODate(date), "MMMM d")} · <span className="text-success">Closed ✓</span></h2>
          <span className="text-[12px] text-text-3">{location.name} · {formatWeekdayDate(date)}</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-text-3"><Badge tone="neutral">Snapshot at close</Badge>{drifted && <span>Edited since — live numbers below</span>}</div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Stat label="Sales" value={m(snapshot.total_sales)} size="sm" />
          <Stat label="Profit" value={m(snapshot.profit)} size="sm" tone={snapshot.profit < 0 ? "danger" : "success"} />
          <Stat label="Margin" value={formatPct(snapshot.margin)} size="sm" />
          <Stat label="Expenses" value={m(snapshot.total_expenses)} size="sm" />
          <Stat label="Labor" value={m(snapshot.labor_total)} size="sm" sub={`${snapshot.labor_employee_count} emp · ${(snapshot.labor_minutes / 60).toFixed(1)}h`} />
        </div>
        {drifted && (
          <div className="mt-2 rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-[12.5px] tnum">
            <b>Live now:</b> Sales {m(live.totalSales)} · Expenses {m(live.totalExpenses)} · Profit <span className={live.profit < 0 ? "text-danger" : "text-success"}>{m(live.profit)}</span> · Margin {formatPct(live.marginPct)}
          </div>
        )}
        <div className="mt-3 grid md:grid-cols-2 gap-x-8">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1">Sales comparisons</div>
            <div className="divide-y divide-border">
              <KV label="vs Yesterday" value={<span className="inline-flex items-center gap-2"><ChangePill value={cmp.vs_yesterday} />{cmp.yesterday_sales != null && <span className="text-text-3 text-[12px]">{m(cmp.yesterday_sales)}</span>}</span>} />
              <KV label={`vs Last ${lastWeekDay}`} value={<span className="inline-flex items-center gap-2"><ChangePill value={cmp.vs_last_week} />{cmp.last_week_sales != null && <span className="text-text-3 text-[12px]">{m(cmp.last_week_sales)}</span>}</span>} />
              <KV label="vs Daily average (30d)" value={<span className="inline-flex items-center gap-2"><ChangePill value={cmp.vs_average} />{cmp.average_sales != null && <span className="text-text-3 text-[12px]">{m(cmp.average_sales)}</span>}</span>} />
              <KV label="Profit vs Yesterday" value={<ChangePill value={cmp.profit_vs_yesterday} />} />
              {snapshot.cash_difference != null && <KV label="Cash difference" value={`${snapshot.cash_difference > 0 ? "+" : ""}${formatMoney(snapshot.cash_difference, { currency })}`} tone={snapshot.cash_difference < 0 ? "danger" : snapshot.cash_difference > 0 ? "warn" : "success"} />}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1">Attention</div>
            <AttentionList items={attention} emptyLabel={`Nothing needs attention for ${weekday}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {nextStore && <Button onClick={() => router.push(`/accounting/quick-close?location=${nextStore.id}&date=${date}`)}>Next store: {nextStore.name} →</Button>}
        <Link href={`/accounting/rapid-entry?date=${date}`} className="inline-flex h-8.5 items-center rounded-md border border-border bg-surface px-3 text-[13.5px] hover:bg-surface-2">Rapid Entry</Link>
        <Link href={`/accounting/day/${location.id}/${date}`} className="inline-flex h-8.5 items-center rounded-md border border-border bg-surface px-3 text-[13.5px] hover:bg-surface-2">Day record</Link>
        <span className="flex-1" />
        {canEditClosed && <Button variant="ghost" onClick={() => setEdit(true)}>Edit closed day</Button>}
        {canEditClosed && <Button variant="ghost" onClick={() => setReopen(true)}>Reopen day</Button>}
      </div>

      <EditClosedModal open={edit} onClose={() => setEdit(false)} original={inputs} currency={currency}
        onSubmit={(patch, reason) => editClosedReportAction(reportId, patch, reason)} onSaved={() => router.refresh()} />
      <ReopenModal open={reopen} onClose={() => setReopen(false)} reportId={reportId} onReopened={onReopened} />
    </div>
  );
}

export function ReopenModal({ open, onClose, reportId, onReopened }: { open: boolean; onClose: () => void; reportId: string; onReopened: () => void }) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const submit = async () => {
    if (!reason.trim()) { setError("A reason is required"); return; }
    setPending(true); setError(null);
    const r = await reopenDayAction(reportId, reason.trim());
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    setReason(""); onClose(); onReopened();
  };
  return (
    <Modal open={open} onClose={onClose} title="Reopen this day?" size="sm"
      footer={<><Button variant="secondary" type="button" onClick={onClose} disabled={pending}>Cancel</Button><Button variant="danger" type="button" onClick={submit} loading={pending} disabled={!reason.trim()}>Reopen day</Button></>}>
      <p className="text-[13px] text-text-2 mb-2">The day goes back to Open so numbers can be changed. This is recorded in the activity log.</p>
      <ErrorText>{error}</ErrorText>
      <Field label="Reason"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} autoFocus placeholder="e.g. Forgot to add the lottery payout" /></Field>
    </Modal>
  );
}
