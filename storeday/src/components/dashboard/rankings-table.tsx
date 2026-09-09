import Link from "next/link";
import { TableWrap } from "@/components/ui/misc";
import { ChangePill } from "@/components/ui/stat";
import { formatMoney, formatPct } from "@/lib/utils/currency";
import { pctChange } from "@/lib/calc/accounting";
import type { AccountingByLocation } from "@/lib/data/accounting";

export interface RankingRow {
  id: string;
  name: string;
  current: AccountingByLocation | null;
  previous: AccountingByLocation | null;
}

export function LocationRankings({ rows, currency }: { rows: RankingRow[]; currency: string }) {
  const ranked = [...rows].sort((a, b) => (b.current?.total_sales ?? 0) - (a.current?.total_sales ?? 0));
  return (
    <TableWrap>
      <table className="table">
        <thead>
          <tr>
            <th className="w-8">#</th><th>Store</th>
            <th className="num">Sales</th><th className="num">Profit</th><th className="num">Margin</th>
            <th className="num">Sales Δ</th><th className="num">Profit Δ</th><th className="num">Expenses Δ</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => {
            const c = r.current, p = r.previous;
            return (
              <tr key={r.id}>
                <td className="text-text-3 tnum">{i + 1}</td>
                <td><Link href={`/stores/${r.id}`} className="font-medium hover:underline">{r.name}</Link></td>
                <td className="num font-semibold">{formatMoney(c?.total_sales ?? 0, { currency })}</td>
                <td className={`num font-medium ${(c?.profit ?? 0) < 0 ? "text-danger" : ""}`}>{formatMoney(c?.profit ?? 0, { currency })}</td>
                <td className="num text-text-2">{formatPct(c?.margin_pct ?? null)}</td>
                <td className="num"><ChangePill value={pctChange(c?.total_sales ?? 0, p?.total_sales)} /></td>
                <td className="num"><ChangePill value={pctChange(c?.profit ?? 0, p?.profit)} /></td>
                <td className="num"><ChangePill value={pctChange(c?.total_expenses ?? 0, p?.total_expenses)} invert /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrap>
  );
}
