import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/utils/currency";
import type { BriefItem, StoreStatusRow } from "@/lib/brief/types";
import { AttentionBadges, CloseoutBadge, OpenStatusBadge } from "./attention";

export interface LocationCardData {
  id: string;
  name: string;
  address?: string | null;
  sales: number;
  profit: number;
  status: StoreStatusRow | null;
  items: BriefItem[];
  employeesAssigned?: number;
}

/** One store, readable in two seconds: name, money, who's there, closeout, attention. */
export function LocationCard({ store, currency, rangeLabel }: { store: LocationCardData; currency: string; rangeLabel?: string }) {
  const st = store.status;
  const working = st?.working_count ?? 0;
  return (
    <Link href={`/stores/${store.id}`} className="card px-3.5 py-3 flex flex-col gap-2 hover:border-border-strong transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold truncate">{store.name}</div>
          {store.address && <div className="text-[12px] text-text-3 truncate">{store.address}</div>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <OpenStatusBadge openedAt={st?.opened_at ?? null} closedAt={st?.closed_at ?? null} working={working} />
          <ChevronRight className="h-4 w-4 text-text-3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3">
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-3">Sales{rangeLabel ? ` · ${rangeLabel}` : ""}</div>
          <div className="tnum text-[18px] font-semibold leading-tight">{formatMoney(store.sales, { currency })}</div>
        </div>
        <div>
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-text-3">Profit</div>
          <div className={`tnum text-[18px] font-semibold leading-tight ${store.profit < 0 ? "text-danger" : ""}`}>{formatMoney(store.profit, { currency })}</div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-text-2">
        <span className={working > 0 ? "text-accent font-medium" : ""}>{working} working</span>
        {store.employeesAssigned != null && <span>{store.employeesAssigned} assigned</span>}
        <span className="inline-flex items-center gap-1">Closeout: <CloseoutBadge status={st?.closeout_status ?? null} /></span>
      </div>
      <AttentionBadges items={store.items} />
    </Link>
  );
}
