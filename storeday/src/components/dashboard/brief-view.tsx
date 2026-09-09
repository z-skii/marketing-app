import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TableWrap } from "@/components/ui/misc";
import { ChangePill, Stat } from "@/components/ui/stat";
import { formatMoney } from "@/lib/utils/currency";
import { formatWeekdayDate } from "@/lib/utils/time";
import type { DailyBrief } from "@/lib/brief/types";
import { AttentionList } from "./attention";

function StoreStatus({ status, working }: { status: DailyBrief["stores"][number]["status"]; working: number }) {
  if (status === "closed") return <Badge tone="success">Closed ✓</Badge>;
  if (status === "open") return <Badge tone="warn">Open</Badge>;
  if (working > 0) return <Badge tone="accent">{working} working</Badge>;
  return <Badge tone="neutral">No data</Badge>;
}

/** Renders a DailyBrief. Pure presentation — no data fetching. */
export function BriefView({ brief, currency, isToday }: { brief: DailyBrief; currency: string; isToday: boolean }) {
  const s = brief.stats;
  const reportedTone = s.storesReported === s.storesTotal ? "success" : isToday ? "default" : "warn";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <Stat label="Stores reported" value={<>{s.storesReported} <span className="text-text-3 font-normal">/ {s.storesTotal}</span></>} tone={reportedTone} />
        <Stat label="Total sales" value={formatMoney(s.totalSales, { currency })} />
        <Stat label="Profit" value={formatMoney(s.profit, { currency })} tone={s.profit < 0 ? "danger" : "default"} />
        <Stat label="Employees" value={s.employees} sub="worked" />
        <Stat label="Labor" value={formatMoney(s.labor, { currency })} />
      </div>

      <Card>
        <CardHeader title="Attention" description={`${brief.attention.filter((a) => a.severity === "warn").length} need action`} />
        <CardBody><AttentionList items={brief.attention} emptyText={isToday ? "Nothing needs your attention so far today." : "Nothing needed your attention."} /></CardBody>
      </Card>

      <TableWrap>
        <table className="table">
          <thead>
            <tr><th>Store</th><th className="num">Sales</th><th className="num">Profit</th><th className="num">Labor</th><th>Status</th><th className="num">vs last week</th></tr>
          </thead>
          <tbody>
            {brief.stores.map((st) => (
              <tr key={st.id}>
                <td><Link href={`/stores/${st.id}`} className="font-medium hover:underline">{st.name}</Link></td>
                <td className="num font-semibold">{formatMoney(st.sales, { currency })}</td>
                <td className={`num ${st.profit < 0 ? "text-danger" : ""}`}>{formatMoney(st.profit, { currency })}</td>
                <td className="num text-text-2">{formatMoney(st.labor, { currency })}</td>
                <td><StoreStatus status={st.status} working={st.working} /></td>
                <td className="num"><ChangePill value={st.vsLastWeek} /></td>
              </tr>
            ))}
            {brief.stores.length === 0 && <tr><td colSpan={6} className="text-text-3 text-center py-6">No stores.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <p className="text-[11.5px] text-text-3">{formatWeekdayDate(brief.date)} · generated from your closeouts, shifts and checklists.</p>
    </div>
  );
}
