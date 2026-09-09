"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/ui/money-input";
import { Modal } from "@/components/ui/modal";
import { KV } from "@/components/ui/stat";
import { ErrorText } from "@/components/ui/form";
import { computeDailyTotals, isReadyToClose, missingFields, sum, type DailyInputs, type DetailedExpenseTotals, type LaborSummary } from "@/lib/calc/accounting";
import { formatMoney } from "@/lib/utils/currency";
import { cn } from "@/lib/utils/cn";
import { closeManyAction, type CloseManyResult } from "@/app/(app)/accounting/actions";
import { useMultiDraft } from "./draft-saver";
import { useMediaQuery } from "./use-media-query";
import { SaveIndicator } from "./summary-bar";
import type { MoneyField, ReportStatus, StoreOption } from "./types";

export interface RapidRowData {
  location: StoreOption;
  /** Location-local today (stores can be in different timezones). */
  today: string;
  reportId: string | null;
  status: ReportStatus | null;
  inputs: DailyInputs;
  labor: LaborSummary;
  detailed: DetailedExpenseTotals;
}

const BASE_COLS: Array<{ key: MoneyField; label: string }> = [
  { key: "cash_sales", label: "Cash" }, { key: "card_sales", label: "Card" }, { key: "other_sales", label: "Other" },
  { key: "cash_goods", label: "Cash goods" }, { key: "check_goods", label: "Check goods" }, { key: "utilities", label: "Utilities" }, { key: "other_expenses", label: "Other exp" },
];

/** Excel-like multi-store entry for one date. Keyboard: Enter ↓, Tab →, arrows move when the caret is at an edge. */
export function RapidEntryGrid({ rows: initialRows, date, currency, otherSalesEnabled }: { rows: RapidRowData[]; date: string; currency: string; otherSalesEnabled: boolean }) {
  const router = useRouter();
  const cols = React.useMemo(() => BASE_COLS.filter((c) => otherSalesEnabled || c.key !== "other_sales"), [otherSalesEnabled]);
  const { rows, status, setField, flush } = useMultiDraft(date, Object.fromEntries(initialRows.map((r) => [r.location.id, r.inputs])));
  const closedFromProps = React.useMemo(() => new Set(initialRows.filter((r) => r.status === "closed").map((r) => r.location.id)), [initialRows]);
  const [closedIds, setClosedIds] = React.useState<Set<string>>(closedFromProps);
  const [seenClosed, setSeenClosed] = React.useState(closedFromProps);
  if (closedFromProps !== seenClosed) { setSeenClosed(closedFromProps); setClosedIds(closedFromProps); } // server refreshed
  const desktop = useMediaQuery("(min-width: 768px)");
  const [confirm, setConfirm] = React.useState<{ ids: string[] } | null>(null);
  const [closing, setClosing] = React.useState(false);
  const [results, setResults] = React.useState<CloseManyResult[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const refs = React.useRef<Map<string, HTMLInputElement | null>>(new Map());

  const editable = initialRows.filter((r) => !closedIds.has(r.location.id) && date <= r.today);
  const computed = initialRows.map((r) => {
    const inputs = rows[r.location.id] ?? r.inputs;
    const totals = computeDailyTotals(inputs, r.labor, r.detailed);
    const closed = closedIds.has(r.location.id);
    const future = date > r.today; // this store's day hasn't started yet
    const locked = closed || future;
    const missing = locked ? [] : missingFields(inputs);
    return { ...r, inputs, totals, closed, future, locked, missing, ready: !locked && isReadyToClose(inputs) };
  });
  const grand = {
    sales: sum(...computed.map((r) => r.totals.totalSales)), labor: sum(...computed.map((r) => r.totals.laborTotal)),
    expenses: sum(...computed.map((r) => r.totals.totalExpenses)), profit: sum(...computed.map((r) => r.totals.profit)),
  };
  const readyIds = computed.filter((r) => r.ready).map((r) => r.location.id);

  const focusCell = (rowIdx: number, colIdx: number) => {
    const row = editable[rowIdx]; const col = cols[colIdx];
    if (!row || !col) return;
    const el = refs.current.get(`${row.location.id}:${col.key}`);
    if (el) { el.focus(); requestAnimationFrame(() => el.select()); }
  };
  /** Returns false when the target is outside the grid so the browser's default (e.g. Tab out) can proceed. */
  const move = (locationId: string, key: MoneyField, dr: number, dc: number): boolean => {
    const r = editable.findIndex((x) => x.location.id === locationId); const c = cols.findIndex((x) => x.key === key);
    let nr = r + dr, nc = c + dc;
    if (dr !== 0 && dc === 0) { // vertical: wrap to next/prev column at the edges
      if (nr >= editable.length) { nr = 0; nc = c + 1; }
      if (nr < 0) { nr = editable.length - 1; nc = c - 1; }
    }
    if (dc !== 0 && dr === 0) { // horizontal: wrap to next/prev row at the edges
      if (nc >= cols.length) { nc = 0; nr = r + 1; }
      if (nc < 0) { nc = cols.length - 1; nr = r - 1; }
    }
    if (nr < 0 || nr >= editable.length || nc < 0 || nc >= cols.length) return false;
    focusCell(nr, nc);
    return true;
  };
  const onKeyDown = (locationId: string, key: MoneyField) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const atStart = (el.selectionStart ?? 0) === 0;
    const atEnd = (el.selectionEnd ?? 0) === el.value.length;
    let moved = false;
    if (e.key === "Tab") moved = move(locationId, key, 0, e.shiftKey ? -1 : 1);
    else if (e.key === "ArrowDown") moved = move(locationId, key, 1, 0);
    else if (e.key === "ArrowUp") moved = move(locationId, key, -1, 0);
    else if (e.key === "ArrowLeft" && atStart) moved = move(locationId, key, 0, -1);
    else if (e.key === "ArrowRight" && atEnd) moved = move(locationId, key, 0, 1);
    if (moved) e.preventDefault();
  };

  const doClose = async () => {
    if (!confirm) return;
    setClosing(true); setError(null);
    const saved = await flush(confirm.ids);
    if (!saved) { setClosing(false); setError("Changes could not be saved — fix and retry"); return; }
    const r = await closeManyAction(confirm.ids.map((locationId) => ({ locationId, date })));
    setClosing(false);
    if (!r.ok) { setError(r.error); return; }
    setResults(r.data);
    setClosedIds((s) => { const n = new Set(s); r.data.forEach((x) => { if (x.ok) n.add(x.locationId); }); return n; });
    setConfirm(null);
    router.refresh();
  };

  /** Desktop grid cell: bare input wired into the refs matrix. Mobile: a regular large field (natural Enter/Tab order). */
  const cell = (r: (typeof computed)[number], col: (typeof cols)[number], editableIdx: number, mobile = false) => {
    if (r.locked) return <span className={cn("tnum block px-2 text-right text-text-3", mobile && "px-0")}>{formatMoney(r.inputs[col.key], { currency })}</span>;
    if (mobile) {
      return <MoneyInput size="lg" value={r.inputs[col.key]} currency={currency} onValueChange={(v) => setField(r.location.id, col.key, v)}
        className={cn("w-36", r.missing.includes(col.key) && "border-warn/60")} aria-label={`${r.location.name} ${col.label}`} />;
    }
    return (
      <MoneyInput bare ref={(el) => { refs.current.set(`${r.location.id}:${col.key}`, el); }} value={r.inputs[col.key]} currency={currency}
        onValueChange={(v) => setField(r.location.id, col.key, v)} onEnter={() => move(r.location.id, col.key, 1, 0)} onKeyDown={onKeyDown(r.location.id, col.key)}
        autoFocus={editableIdx === 0 && col.key === "cash_sales"} aria-label={`${r.location.name} ${col.label}`} />
    );
  };
  const statusBadge = (r: (typeof computed)[number]) => r.closed
    ? <Badge tone="success">Closed ✓</Badge> : r.future ? <Badge tone="neutral">Not yet</Badge> : r.ready ? <Badge tone="accent">Ready</Badge> : <Badge tone="warn">Missing data</Badge>;
  const money = (v: number, tone?: boolean) => <span className={cn("tnum", tone && (v < 0 ? "text-danger" : "text-success"))}>{formatMoney(v, { currency })}</span>;

  return (
    <div className="space-y-3">
      {results && <ResultsBanner results={results} stores={initialRows.map((r) => r.location)} onDismiss={() => setResults(null)} />}
      <ErrorText>{error}</ErrorText>

      {/* Only one entry surface is mounted at a time so there is a single set of inputs (and one autofocus). */}
      {desktop && <div className="card overflow-x-auto scrollbar-thin">
        <table className="table min-w-[1100px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface-2 z-10">Store</th>
              {cols.map((c) => <th key={c.key} className="text-right w-[118px]">{c.label}</th>)}
              <th className="text-right border-l border-border">Sales</th><th className="text-right">Labor</th><th className="text-right">Expenses</th><th className="text-right">Profit</th><th>Status</th><th />
            </tr>
          </thead>
          <tbody>
            {computed.map((r) => (
              <tr key={r.location.id} className={cn(r.locked && "opacity-60 bg-surface-2/40")}>
                <td className="sticky left-0 bg-surface z-10 font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/accounting/quick-close?location=${r.location.id}&date=${date}`} className="hover:underline" title="Open in Quick Close (cash count, notes, expenses)">{r.location.name}</Link>
                    <span className="text-[11px] font-normal"><SaveIndicator status={status[r.location.id]?.s ?? "idle"} error={status[r.location.id]?.error} /></span>
                  </div>
                </td>
                {cols.map((c) => <td key={c.key} className={cn("!p-0", r.missing.includes(c.key) && "!bg-warn-soft/50")}>{cell(r, c, editable.findIndex((e) => e.location.id === r.location.id))}</td>)}
                <td className="num font-medium border-l border-border">{money(r.totals.totalSales)}</td>
                <td className="num text-text-2" title={`${r.labor.employeeCount} employees · ${(r.labor.minutes / 60).toFixed(1)}h`}>{money(r.totals.laborTotal)}</td>
                <td className="num">{money(r.totals.totalExpenses)}</td>
                <td className="num font-semibold">{money(r.totals.profit, true)}</td>
                <td>{statusBadge(r)}</td>
                <td className="text-right">
                  {r.closed ? <Link href={`/accounting/day/${r.location.id}/${date}`} className="text-[12.5px] text-accent hover:underline">View</Link>
                    : r.future ? null : <Button size="sm" variant="secondary" tabIndex={-1} disabled={!r.ready} onClick={() => setConfirm({ ids: [r.location.id] })}>Close</Button>}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="sticky left-0 bg-surface-2 z-10">Total · {computed.length} stores</td>
              {cols.map((c) => <td key={c.key} className="num">{money(sum(...computed.map((r) => r.inputs[c.key])))}</td>)}
              <td className="num border-l border-border">{money(grand.sales)}</td><td className="num">{money(grand.labor)}</td><td className="num">{money(grand.expenses)}</td><td className="num">{money(grand.profit, true)}</td>
              <td colSpan={2} className="text-[12px] font-normal text-text-3">{closedIds.size}/{computed.length} closed</td>
            </tr>
          </tfoot>
        </table>
      </div>}

      {!desktop && <div className="space-y-3">
        {computed.map((r) => (
          <div key={r.location.id} className={cn("card p-3", r.locked && "opacity-70")}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link href={`/accounting/quick-close?location=${r.location.id}&date=${date}`} className="font-medium hover:underline">{r.location.name}</Link>
              <div className="flex items-center gap-2">{statusBadge(r)}<SaveIndicator status={status[r.location.id]?.s ?? "idle"} error={status[r.location.id]?.error} /></div>
            </div>
            <div className="space-y-1">
              {cols.map((c) => (
                <label key={c.key} className="flex items-center justify-between gap-2 text-[13px] text-text-2">{c.label}<span className="w-36 text-right">{cell(r, c, -1, true)}</span></label>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-[12px] border-t border-border pt-2">
              <div><div className="text-text-3 uppercase text-[10px]">Sales</div>{money(r.totals.totalSales)}</div>
              <div><div className="text-text-3 uppercase text-[10px]">Labor</div>{money(r.totals.laborTotal)}</div>
              <div><div className="text-text-3 uppercase text-[10px]">Expenses</div>{money(r.totals.totalExpenses)}</div>
              <div><div className="text-text-3 uppercase text-[10px]">Profit</div>{money(r.totals.profit, true)}</div>
            </div>
            {!r.locked && <Button size="sm" variant="secondary" block className="mt-2" disabled={!r.ready} onClick={() => setConfirm({ ids: [r.location.id] })}>Close {r.location.name}</Button>}
          </div>
        ))}
        <div className="card p-3 grid grid-cols-4 gap-2 text-[12px]">
          <div><div className="text-text-3 uppercase text-[10px]">Sales</div>{money(grand.sales)}</div>
          <div><div className="text-text-3 uppercase text-[10px]">Labor</div>{money(grand.labor)}</div>
          <div><div className="text-text-3 uppercase text-[10px]">Expenses</div>{money(grand.expenses)}</div>
          <div><div className="text-text-3 uppercase text-[10px]">Profit</div>{money(grand.profit, true)}</div>
        </div>
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-text-3">Enter ↓ next store · Tab → next column · arrows move between cells. Cash count and notes live in Quick Close (click a store name).</p>
        <Button size="lg" disabled={readyIds.length === 0} onClick={() => setConfirm({ ids: readyIds })}>Close ready stores ({readyIds.length})</Button>
      </div>

      <Modal open={confirm != null} onClose={() => !closing && setConfirm(null)} title={confirm && confirm.ids.length === 1 ? `Close ${computed.find((r) => r.location.id === confirm.ids[0])?.location.name}?` : `Close ${confirm?.ids.length ?? 0} stores?`}
        footer={<><Button variant="secondary" onClick={() => setConfirm(null)} disabled={closing}>Back</Button><Button onClick={doClose} loading={closing} autoFocus>Confirm &amp; close</Button></>}>
        <ErrorText>{error}</ErrorText>
        <div className="divide-y divide-border">
          {confirm?.ids.map((id) => { const r = computed.find((x) => x.location.id === id)!; return (
            <div key={id} className="py-2">
              <div className="font-medium text-[13.5px]">{r.location.name}</div>
              <div className="grid grid-cols-3 gap-2">
                <KV label="Sales" value={money(r.totals.totalSales)} /><KV label="Expenses" value={money(r.totals.totalExpenses)} /><KV label="Profit" value={money(r.totals.profit, true)} />
              </div>
            </div>
          ); })}
        </div>
      </Modal>
    </div>
  );
}

function ResultsBanner({ results, stores, onDismiss }: { results: CloseManyResult[]; stores: StoreOption[]; onDismiss: () => void }) {
  const name = (id: string) => stores.find((s) => s.id === id)?.name ?? id;
  const okCount = results.filter((r) => r.ok).length;
  return (
    <div className="card p-3 text-[13px]">
      <div className="flex items-center justify-between"><b>{okCount}/{results.length} closed</b><button onClick={onDismiss} className="text-text-3 hover:text-text text-[12px]">Dismiss</button></div>
      <ul className="mt-1 space-y-0.5">
        {results.map((r) => (
          <li key={r.locationId} className={cn(r.ok ? "text-success" : "text-danger")}>{r.ok ? "✓" : "✕"} {name(r.locationId)}{r.ok ? "" : ` — ${r.error}`}</li>
        ))}
      </ul>
    </div>
  );
}
