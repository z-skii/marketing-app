"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/ui/money-input";
import { formatMoney } from "@/lib/utils/currency";
import { fromISODate } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import { editClosedReportAction, saveDraftAction } from "@/app/(app)/accounting/actions";
import { EditClosedModal } from "./edit-closed-modal";
import { sumLines, type DayLine, type DayRow, type DaySums } from "./month-model";
import type { DraftPatch, MoneyField } from "./types";

type Col = { key: string; label: string; w: number; field?: MoneyField; sum?: keyof DaySums; align?: "left" | "right" };
const COLS: Col[] = [
  { key: "date", label: "Date", w: 64, align: "left" }, { key: "day", label: "Day", w: 44, align: "left" },
  { key: "cash", label: "Cash", w: 92, field: "cash_sales", sum: "cash" }, { key: "card", label: "Card", w: 92, field: "card_sales", sum: "card" },
  { key: "sales", label: "Sales", w: 96, sum: "sales" },
  { key: "cashGoods", label: "Cash goods", w: 92, field: "cash_goods", sum: "cashGoods" }, { key: "checkGoods", label: "Check goods", w: 92, field: "check_goods", sum: "checkGoods" },
  { key: "labor", label: "Labor", w: 88, sum: "labor" }, { key: "util", label: "Util", w: 84, field: "utilities", sum: "utilities" }, { key: "otherExp", label: "Other", w: 84, field: "other_expenses", sum: "otherExp" },
  { key: "expenses", label: "Expenses", w: 96, sum: "expenses" }, { key: "profit", label: "Profit", w: 96, sum: "profit" }, { key: "status", label: "Status", w: 96, align: "left" },
];
const WIDTH = COLS.reduce((a, c) => a + c.w, 0);

/**
 * Spreadsheet-style month table. Single store: rows link to Quick Close and numeric cells edit on double-click.
 * All stores: rows aggregate every store and expand inline to per-store lines. Totals row stays pinned at the bottom.
 */
export function MonthTable({ days, singleLocationId, currency, canEditClosed, today }: {
  days: DayRow[]; singleLocationId: string | null; currency: string; canEditClosed: boolean; today: string;
}) {
  const router = useRouter();
  const [overrides, setOverrides] = React.useState<Record<string, DayLine>>({});
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [editing, setEditingState] = React.useState<{ date: string; locationId: string; field: MoneyField } | null>(null);
  const editingRef = React.useRef<typeof editing>(null); // guards against blur firing after Enter already committed
  const editValue = React.useRef<number | null>(null);
  const setEditing = (e: typeof editing, value: number | null = null) => { editingRef.current = e; editValue.current = value; setEditingState(e); };
  const [closedEdit, setClosedEdit] = React.useState<{ line: DayLine; date: string; field: MoneyField; value: number | null } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const mainRef = React.useRef<HTMLDivElement>(null);
  const footRef = React.useRef<HTMLDivElement>(null);

  const resolved = days.map((d) => ({ date: d.date, lines: d.lines.map((l) => overrides[`${d.date}:${l.locationId}`] ?? l) }));
  // A single-store day without a row yet still needs an editable line.
  const single = singleLocationId != null;
  const rowsWithLines = resolved.map((d) => {
    if (single && d.lines.length === 0 && d.date <= today) {
      const l = overrides[`${d.date}:${singleLocationId}`];
      return { ...d, lines: l ? [l] : [] };
    }
    return d;
  });
  const total = sumLines(rowsWithLines.flatMap((d) => d.lines));
  const money = (v: number | null | undefined, opts?: { tone?: boolean; muted?: boolean }) => v == null
    ? <span className="text-text-3">—</span>
    : <span className={cn("tnum", opts?.tone && (v < 0 ? "text-danger" : "text-success"), opts?.muted && "text-text-3")}>{formatMoney(v, { currency })}</span>;

  const applyLocal = (date: string, line: DayLine, patch: DraftPatch, extra?: Partial<DayLine>) => {
    const inputs = { ...line.inputs };
    for (const [k, v] of Object.entries(patch)) if (k !== "notes") inputs[k as MoneyField] = v as number | null;
    setOverrides((o) => ({ ...o, [`${date}:${line.locationId}`]: { ...line, ...extra, inputs } }));
  };

  const commit = async (date: string, line: DayLine, field: MoneyField) => {
    if (!editingRef.current) return;
    const value = editValue.current;
    setEditing(null);
    if (value === line.inputs[field]) return;
    if (line.status === "closed") { setClosedEdit({ line, date, field, value }); return; }
    applyLocal(date, line, { [field]: value }, { status: "open" });
    const r = await saveDraftAction(line.locationId, date, { [field]: value });
    if (!r.ok) { setError(r.error); applyLocal(date, line, { [field]: line.inputs[field] }); return; }
    setError(null);
    applyLocal(date, { ...line, inputs: { ...line.inputs, [field]: value } }, {}, { reportId: r.data.id, status: r.data.status });
    router.refresh();
  };

  React.useEffect(() => {
    const a = mainRef.current, b = footRef.current;
    if (!a || !b) return;
    const sync = () => { b.scrollLeft = a.scrollLeft; };
    a.addEventListener("scroll", sync, { passive: true });
    return () => a.removeEventListener("scroll", sync);
  }, []);

  const cell = (date: string, line: DayLine | null, col: Col, editable: boolean) => {
    if (!col.field) return null;
    const value = line?.inputs[col.field] ?? null;
    const isEditing = editing && line && editing.date === date && editing.locationId === line.locationId && editing.field === col.field;
    if (isEditing && line) {
      return <MoneyInput bare autoFocus value={value} currency={currency} onValueChange={(v) => { editValue.current = v; }} className="bg-accent-soft"
        onEnter={() => commit(date, line, col.field!)} onBlur={() => commit(date, line, col.field!)}
        onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setEditing(null); } }} />;
    }
    return (
      <span className={cn("block px-2.5 py-1.5 text-right", editable && "cursor-cell hover:bg-accent-soft/60 rounded")}
        onDoubleClick={editable ? (e) => { e.stopPropagation(); setEditing({ date, locationId: line?.locationId ?? singleLocationId!, field: col.field! }, value); } : undefined}
        title={editable ? "Double-click to edit" : undefined}>{money(value)}</span>
    );
  };

  const renderLine = (date: string, line: DayLine | null, sums: DaySums, opts: { sub?: boolean; editable: boolean; status: React.ReactNode; dateCell: React.ReactNode; dayCell: React.ReactNode; onClick?: () => void; href?: string }) => (
    <tr key={`${date}:${line?.locationId ?? "all"}`} className={cn(opts.sub && "bg-surface-2/40 text-[12.5px]", !sums.hasData && !opts.sub && "text-text-3", opts.onClick && "cursor-pointer")} onClick={opts.onClick}>
      <td className={cn("!px-2.5", opts.sub && "!pl-6")}>{opts.href ? <Link href={opts.href} className="hover:underline" onClick={(e) => e.stopPropagation()}>{opts.dateCell}</Link> : opts.dateCell}</td>
      <td className="text-text-3">{opts.dayCell}</td>
      {COLS.slice(2).map((c) => {
        if (c.key === "status") return <td key={c.key}>{opts.status}</td>;
        if (c.field) return <td key={c.key} className="!p-0 num">{cell(date, line, c, opts.editable)}</td>;
        const v = sums[c.sum!] as number;
        return <td key={c.key} className={cn("num", c.key === "sales" || c.key === "profit" ? "font-medium" : "text-text-2")}>{sums.hasData ? money(v, { tone: c.key === "profit" }) : money(null)}</td>;
      })}
    </tr>
  );

  return (
    <div className="relative">
      {error && <div className="mb-2 rounded-md border border-danger/30 bg-danger-soft px-3 py-1.5 text-[12.5px] text-danger">{error}</div>}
      <div ref={mainRef} className="card overflow-x-auto scrollbar-thin rounded-b-none">
        <table className="table" style={{ width: WIDTH, tableLayout: "fixed" }}>
          <colgroup>{COLS.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
          <thead><tr>{COLS.map((c) => <th key={c.key} className={cn(c.align !== "left" && "text-right")}>{c.label}</th>)}</tr></thead>
          <tbody>
            {rowsWithLines.map((d) => {
              const sums = sumLines(d.lines);
              const dt = fromISODate(d.date);
              const isFuture = d.date > today;
              const dateCell = <span className={cn("tnum", d.date === today && "font-semibold text-accent")}>{format(dt, "MMM d")}</span>;
              const dayCell = format(dt, "EEE");
              if (single) {
                const line = d.lines[0] ?? null;
                const status = line?.status === "closed" ? <Badge tone="success">Closed ✓</Badge> : line?.reportId ? <Badge tone="warn">Open</Badge> : isFuture ? null : <span className="text-[11px] text-text-3">No data</span>;
                const editable = !isFuture && (line?.status !== "closed" || canEditClosed);
                const stub: DayLine | null = line ?? (isFuture ? null : { locationId: singleLocationId!, locationName: "", reportId: null, status: null, inputs: { cash_sales: null, card_sales: null, other_sales: null, cash_goods: null, check_goods: null, utilities: null, other_expenses: null, expected_cash: null, actual_cash: null }, labor: { employeeCount: 0, minutes: 0, cost: 0 }, detailed: { goods: 0, labor: 0, utilities: 0, other: 0 } });
                return renderLine(d.date, stub, sums, { editable, status, dateCell, dayCell, href: isFuture ? undefined : `/accounting/quick-close?location=${singleLocationId}&date=${d.date}` });
              }
              const open = expanded.has(d.date);
              const status = sums.hasData ? <span className={cn("text-[11.5px]", sums.closed === d.lines.length ? "text-success" : "text-warn")}>{sums.closed}/{d.lines.length} closed</span> : isFuture ? null : <span className="text-[11px] text-text-3">No data</span>;
              return (
                <React.Fragment key={d.date}>
                  {renderLine(d.date, null, sums, { editable: false, status, dateCell: <span className="inline-flex items-center gap-1">{sums.hasData && <span className="text-text-3 text-[10px]">{open ? "▾" : "▸"}</span>}{dateCell}</span>, dayCell,
                    onClick: sums.hasData ? () => setExpanded((s) => { const n = new Set(s); if (n.has(d.date)) n.delete(d.date); else n.add(d.date); return n; }) : undefined })}
                  {open && d.lines.map((l) => renderLine(d.date, l, sumLines([l]), {
                    sub: true, editable: false,
                    status: l.status === "closed" ? <Badge tone="success">Closed ✓</Badge> : l.reportId ? <Badge tone="warn">Open</Badge> : <span className="text-[11px] text-text-3">No report</span>,
                    dateCell: <span className="text-text-2">{l.locationName}</span>, dayCell: "", href: `/accounting/quick-close?location=${l.locationId}&date=${d.date}`,
                  }))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div ref={footRef} className="sticky bottom-[calc(3.25rem+env(safe-area-inset-bottom))] md:bottom-0 z-10 overflow-hidden card rounded-t-none border-t-0">
        <table className="table" style={{ width: WIDTH, tableLayout: "fixed" }}>
          <colgroup>{COLS.map((c) => <col key={c.key} style={{ width: c.w }} />)}</colgroup>
          <tfoot>
            <tr>
              <td colSpan={2}>Total</td>
              {COLS.slice(2).map((c) => c.key === "status"
                ? <td key={c.key} className="text-[11.5px] font-normal text-text-3">{total.closed}/{total.reports} closed</td>
                : <td key={c.key} className="num">{money(total[c.sum!] as number, { tone: c.key === "profit" })}</td>)}
            </tr>
          </tfoot>
        </table>
      </div>
      {closedEdit && (
        <EditClosedModal open onClose={() => setClosedEdit(null)} original={closedEdit.line.inputs} fields={[closedEdit.field]} initialDraft={{ [closedEdit.field]: closedEdit.value }} currency={currency}
          title={`Edit closed day · ${format(fromISODate(closedEdit.date), "MMM d")}`}
          onSubmit={(patch, reason) => editClosedReportAction(closedEdit.line.reportId!, patch, reason)}
          onSaved={(patch) => { applyLocal(closedEdit.date, closedEdit.line, patch); router.refresh(); }} />
      )}
    </div>
  );
}

/** Compact per-day cards for phones (days with data only). */
export function MonthCards({ days, singleLocationId, currency }: { days: DayRow[]; singleLocationId: string | null; currency: string }) {
  const withData = days.filter((d) => d.lines.length > 0);
  if (withData.length === 0) return <div className="card p-4 text-[13px] text-text-3">No data this month yet.</div>;
  return (
    <div className="space-y-2">
      {withData.map((d) => {
        const s = sumLines(d.lines);
        const href = singleLocationId ? `/accounting/quick-close?location=${singleLocationId}&date=${d.date}` : `/accounting/rapid-entry?date=${d.date}`;
        return (
          <Link key={d.date} href={href} className="card block p-3">
            <div className="flex items-center justify-between text-[13px]">
              <span className="font-medium">{format(fromISODate(d.date), "EEE, MMM d")}</span>
              <span className={cn("text-[11.5px]", s.closed === d.lines.length ? "text-success" : "text-warn")}>{s.closed}/{d.lines.length} closed</span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-2 text-[12px]">
              <div><div className="text-[10px] uppercase text-text-3">Sales</div><span className="tnum font-medium">{formatMoney(s.sales, { currency })}</span></div>
              <div><div className="text-[10px] uppercase text-text-3">Expenses</div><span className="tnum">{formatMoney(s.expenses, { currency })}</span></div>
              <div><div className="text-[10px] uppercase text-text-3">Profit</div><span className={cn("tnum font-medium", s.profit < 0 ? "text-danger" : "text-success")}>{formatMoney(s.profit, { currency })}</span></div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
