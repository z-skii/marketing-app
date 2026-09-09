import { formatMoney } from "@/lib/utils/currency";
import { shortRangeLabel, weeksInRange } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import { sumDays, type DayRow } from "./month-model";

/** WEEKLY SUMMARY: the month split by the org's week start, clipped to the month so weeks add up to the month. */
export function WeeklyTable({ days, range, weekStartsOn, currency }: { days: DayRow[]; range: { from: string; to: string }; weekStartsOn: number; currency: string }) {
  const weeks = weeksInRange(range, weekStartsOn).map((w) => ({ ...w, sums: sumDays(days.filter((d) => d.date >= w.from && d.date <= w.to)) }));
  const total = sumDays(days);
  const m = (v: number, tone?: boolean) => <span className={cn("tnum", tone && (v < 0 ? "text-danger" : "text-success"))}>{formatMoney(v, { currency })}</span>;
  const laborCell = (s: { labor: number; laborMinutes: number }) => <span className="tnum">{(s.laborMinutes / 60).toFixed(1)}h · {formatMoney(s.labor, { currency })}</span>;
  return (
    <div className="card overflow-x-auto scrollbar-thin">
      <table className="table min-w-[900px]">
        <thead>
          <tr><th>Week</th><th>Dates</th><th className="text-right">Cash</th><th className="text-right">Card</th><th className="text-right">Sales</th><th className="text-right">Labor</th><th className="text-right">Goods</th><th className="text-right">Utilities</th><th className="text-right">Other</th><th className="text-right">Total expenses</th><th className="text-right">Profit</th></tr>
        </thead>
        <tbody>
          {weeks.map((w) => (
            <tr key={w.index} className={cn(!w.sums.hasData && "text-text-3")}>
              <td className="font-medium">{w.label}</td>
              <td className="text-text-2">{shortRangeLabel(w)}</td>
              <td className="num">{m(w.sums.cash)}</td><td className="num">{m(w.sums.card)}</td><td className="num font-medium">{m(w.sums.sales)}</td>
              <td className="num">{laborCell(w.sums)}</td><td className="num">{m(w.sums.goods)}</td><td className="num">{m(w.sums.utilities)}</td><td className="num">{m(w.sums.otherExp)}</td>
              <td className="num">{m(w.sums.expenses)}</td><td className="num font-semibold">{m(w.sums.profit, true)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>Month</td>
            <td className="num">{m(total.cash)}</td><td className="num">{m(total.card)}</td><td className="num">{m(total.sales)}</td>
            <td className="num">{laborCell(total)}</td><td className="num">{m(total.goods)}</td><td className="num">{m(total.utilities)}</td><td className="num">{m(total.otherExp)}</td>
            <td className="num">{m(total.expenses)}</td><td className="num">{m(total.profit, true)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
