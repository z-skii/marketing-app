"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionLabel } from "@/components/ui/card";
import { QuickExpenseModal, type CategoryOption } from "@/components/expenses/quick-expense-modal";
import type { ExpenseRow } from "@/app/(app)/expenses/actions";
import { closeDayAction } from "@/app/(app)/accounting/actions";
import { computeDailyTotals, expectedClosingCash, groupDetailedExpenses, type AccountingBucket, type LaborSummary } from "@/lib/calc/accounting";
import { formatMoney } from "@/lib/utils/currency";
import { formatTime, fromISODate } from "@/lib/utils/time";
import { format } from "date-fns";
import { useQuickCloseDraft } from "./draft-saver";
import { StoreDateBar } from "./store-date-bar";
import { LaborPanel } from "./labor-panel";
import { SummaryBar } from "./summary-bar";
import { CloseConfirmModal } from "./close-confirm-modal";
import { AfterCloseView } from "./after-close-view";
import { CashCheckSection, ExpensesSection, GoodsSection, NotesSection, SalesSection } from "./quick-close-fields";
import type { AccountingSettings, AttentionItem, CloseoutRow, DailyReportRow, DetailedExpense, LaborRow, MoneyField, StoreOption } from "./types";

export interface QuickCloseProps {
  organizationId: string;
  location: StoreOption;
  locations: StoreOption[];
  date: string;
  today: string;
  settings: AccountingSettings;
  startingCash: number;
  requireClosingChecklist: boolean;
  requireCashCount: boolean;
  report: DailyReportRow | null;
  labor: LaborRow[];
  laborSummary: LaborSummary;
  expenses: DetailedExpense[];
  lastCloseout: CloseoutRow | null;
  categories: CategoryOption[];
  canEditClosed: boolean;
  canAddExpenses: boolean;
}

export function QuickCloseForm(p: QuickCloseProps) {
  const router = useRouter();
  const { currency } = p.settings;
  const [snapshot, setSnapshot] = React.useState<CloseoutRow | null>(p.report?.status === "closed" ? p.lastCloseout : null);
  const closed = snapshot != null || p.report?.status === "closed";
  const closeout = snapshot ?? (p.report?.status === "closed" ? p.lastCloseout : null);
  const reportId = p.report?.id ?? closeout?.daily_report_id ?? null;
  const draft = useQuickCloseDraft({ locationId: p.location.id, date: p.date, report: p.report, enabled: !closed });
  const [expenses, setExpenses] = React.useState<DetailedExpense[]>(p.expenses);
  // Server props refreshed (close / reopen / edit / expense added): adopt the new expense list and closed state.
  const [seenExpenses, setSeenExpenses] = React.useState(p.expenses);
  if (p.expenses !== seenExpenses) { setSeenExpenses(p.expenses); setExpenses(p.expenses); }
  const [seenReportAt, setSeenReportAt] = React.useState(p.report?.updated_at ?? null);
  if ((p.report?.updated_at ?? null) !== seenReportAt) {
    setSeenReportAt(p.report?.updated_at ?? null);
    if (p.report?.status !== "closed") setSnapshot(null);
    else if (p.lastCloseout) setSnapshot(p.lastCloseout);
  }
  const [expenseOpen, setExpenseOpen] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const [closing, setClosing] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);
  // "Overridden" = the stored expected cash differs from what we would compute — i.e. someone typed it.
  const [expectedOverridden, setExpectedOverridden] = React.useState(() => p.report?.expected_cash != null
    && Number(p.report.expected_cash) !== expectedClosingCash({ startingCash: p.startingCash, cashSales: p.report.cash_sales == null ? null : Number(p.report.cash_sales), cashGoods: p.report.cash_goods == null ? null : Number(p.report.cash_goods) }));

  const { inputs, notes } = draft.state;
  const cashCheck = p.settings.cashCheckEnabled || p.requireCashCount;
  const detailed = React.useMemo(() => groupDetailedExpenses(expenses.map((e) => ({ amount: e.amount, bucket: e.bucket as AccountingBucket, status: e.status }))), [expenses]);
  const expectedComputed = expectedClosingCash({ startingCash: p.startingCash, cashSales: inputs.cash_sales, cashGoods: inputs.cash_goods });
  const totals = computeDailyTotals(inputs, p.laborSummary, detailed);

  /** Money changes; keeps the expected-cash prefill in sync until the user types their own. */
  const setMoney = React.useCallback((key: MoneyField, value: number | null) => {
    if (key === "expected_cash") { setExpectedOverridden(value != null); draft.setField("expected_cash", value); return; }
    const patch: Record<string, number | null> = { [key]: value };
    if (cashCheck && !expectedOverridden && (key === "cash_sales" || key === "cash_goods" || key === "actual_cash")) {
      const next = { ...draft.state.inputs, [key]: value };
      const actual = key === "actual_cash" ? value : draft.state.inputs.actual_cash;
      patch.expected_cash = actual != null || draft.state.inputs.expected_cash != null
        ? expectedClosingCash({ startingCash: p.startingCash, cashSales: next.cash_sales, cashGoods: next.cash_goods })
        : null;
    }
    draft.setMany(patch);
  }, [draft, expectedOverridden, cashCheck, p.startingCash]);

  const resetExpected = () => { setExpectedOverridden(false); draft.setField("expected_cash", expectedComputed); };

  const clientAttention: AttentionItem[] = React.useMemo(() => {
    const out: AttentionItem[] = [];
    for (const s of p.labor.filter((r) => r.status === "active")) {
      out.push({ kind: "still_clocked_in", severity: "warn", shift_id: s.shift_id, employee: s.employee_name, message: `${s.employee_name} is still clocked in (since ${formatTime(s.clock_in_at, p.location.timezone)})` });
    }
    const d = totals.cashDifference;
    if (d != null && d < 0) out.push({ kind: "cash_short", severity: "warn", amount: d, message: `Cash is ${formatMoney(Math.abs(d), { currency })} short` });
    if (d != null && d > 0) out.push({ kind: "cash_over", severity: "info", amount: d, message: `Cash is ${formatMoney(d, { currency })} over` });
    if (p.requireClosingChecklist) out.push({ kind: "closing_checklist", severity: "info", message: "A completed closing checklist is required to close this store" });
    for (const s of p.labor.filter((r) => ["location_issue", "missing_photo", "needs_review"].includes(r.verification_status))) {
      out.push({ kind: `shift_${s.verification_status}`, severity: "info", shift_id: s.shift_id, message: `${s.employee_name}: shift ${s.verification_status.replace("_", " ")}` });
    }
    return out;
  }, [p.labor, p.location.timezone, p.requireClosingChecklist, totals.cashDifference, currency]);

  const openConfirm = async () => {
    setCloseError(null);
    if (inputs.cash_sales == null && inputs.card_sales == null && inputs.other_sales == null) { setCloseError("Enter sales before closing"); return; }
    setConfirm(true);
  };

  const confirmClose = async () => {
    setClosing(true); setCloseError(null);
    const saved = await draft.flush();
    if (!saved) { setClosing(false); setCloseError("Changes could not be saved — fix and retry"); return; }
    const r = await closeDayAction(p.location.id, p.date);
    setClosing(false);
    if (!r.ok) { setCloseError(r.error); return; }
    draft.clearLocal();
    setConfirm(false);
    setSnapshot(r.data);
    router.refresh();
  };

  const onExpenseAdded = (e: ExpenseRow) => {
    setExpenses((list) => [...list, { id: e.id, amount: Number(e.amount), category_name: e.category_name, bucket: e.bucket, vendor: e.vendor, description: e.description, payment_method: e.payment_method, status: e.status }]);
    router.refresh();
  };

  const idx = p.locations.findIndex((l) => l.id === p.location.id);
  const nextStore = idx >= 0 && idx < p.locations.length - 1 ? p.locations[idx + 1] : null;
  const dateLabel = format(fromISODate(p.date), "MMMM d");

  return (
    <div>
      <StoreDateBar locations={p.locations} locationId={p.location.id} date={p.date} max={p.today} status={closed ? "closed" : p.report ? "open" : "none"} className="mb-4" />

      {closed && closeout && reportId ? (
        <AfterCloseView snapshot={closeout} reportId={reportId} inputs={inputs} live={totals} date={p.date} location={p.location} nextStore={nextStore}
          currency={currency} canEditClosed={p.canEditClosed} onReopened={() => { setSnapshot(null); router.refresh(); }} />
      ) : closed ? (
        <div className="card p-4 text-[13px] text-text-2">This day is closed but its closeout snapshot is missing.</div>
      ) : (
        <>
          <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
            <div className="space-y-5">
              <SalesSection inputs={inputs} onChange={setMoney} currency={currency} otherSalesEnabled={p.settings.otherSalesEnabled} totals={totals} />
              <GoodsSection inputs={inputs} onChange={setMoney} currency={currency} detailed={detailed} totals={totals} />
              <ExpensesSection inputs={inputs} onChange={setMoney} currency={currency} detailed={detailed} expenses={expenses} totals={totals} onAddExpense={() => setExpenseOpen(true)} canAdd={p.canAddExpenses} />
            </div>
            <div className="space-y-5">
              <section>
                <SectionLabel right={<span className="text-[11px] text-text-3">Automatic from clock-ins</span>}>Labor</SectionLabel>
                <LaborPanel rows={p.labor} summary={p.laborSummary} timezone={p.location.timezone} currency={currency} />
              </section>
              {cashCheck && (
                <CashCheckSection inputs={inputs} onChange={setMoney} currency={currency} expectedComputed={expectedComputed} totals={totals} onResetExpected={resetExpected} overridden={expectedOverridden} />
              )}
              <NotesSection value={notes} onChange={(v) => draft.setField("notes", v)} />
            </div>
          </div>
          {closeError && !confirm && <div className="mt-3 rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">{closeError}</div>}
          <SummaryBar totals={totals} currency={currency} status={draft.status} error={draft.error} onClose={openConfirm} closing={closing} />
          <CloseConfirmModal open={confirm} onClose={() => setConfirm(false)} onConfirm={confirmClose} loading={closing} error={closeError}
            dateLabel={dateLabel} storeName={p.location.name} currency={currency} totals={totals} inputs={inputs} attention={clientAttention} />
          <QuickExpenseModal open={expenseOpen} onClose={() => setExpenseOpen(false)} organizationId={p.organizationId} locationId={p.location.id} date={p.date}
            categories={p.categories} onAdded={onExpenseAdded} />
        </>
      )}
    </div>
  );
}
