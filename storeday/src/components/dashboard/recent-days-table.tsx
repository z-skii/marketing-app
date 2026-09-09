import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { TableWrap } from "@/components/ui/misc";
import { formatMoney } from "@/lib/utils/currency";
import { formatShortDate } from "@/lib/utils/time";
import type { DailyAccountingRow } from "@/lib/data/accounting";

export function RecentDaysTable({ rows, locationId, currency }: { rows: DailyAccountingRow[]; locationId: string; currency: string }) {
  if (rows.length === 0) return <p className="text-[13px] text-text-3 px-4 pb-4">No days recorded yet.</p>;
  return (
    <TableWrap className="border-0 rounded-none">
      <table className="table">
        <thead><tr><th>Date</th><th className="num">Sales</th><th className="num">Expenses</th><th className="num">Labor</th><th className="num">Profit</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.business_date}>
              <td><Link href={`/accounting/day/${locationId}/${r.business_date}`} className="font-medium hover:underline">{formatShortDate(r.business_date ?? "")}</Link></td>
              <td className="num font-semibold">{formatMoney(r.total_sales ?? 0, { currency })}</td>
              <td className="num text-text-2">{formatMoney(r.total_expenses ?? 0, { currency })}</td>
              <td className="num text-text-2">{formatMoney(r.labor_total ?? 0, { currency })}</td>
              <td className={`num font-medium ${(r.profit ?? 0) < 0 ? "text-danger" : ""}`}>{formatMoney(r.profit ?? 0, { currency })}</td>
              <td><StatusBadge kind="report" value={r.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}
