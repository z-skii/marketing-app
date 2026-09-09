import type { Json } from "@/types/database";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { formatDateTime } from "@/lib/utils/time";

export interface ActivityEntry {
  id: string;
  created_at: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  note: string | null;
  before_data: Json | null;
  after_data: Json | null;
  actor_name: string;
  location_name: string | null;
}

const TONES: Array<[RegExp, BadgeTone]> = [
  [/closed$|created$|added$|loaded$|accepted$/, "success"],
  [/reopened|edited|updated|changed|adjusted/, "warn"],
  [/deleted|removed|revoked|deactivated|terminated/, "danger"],
];

function toneFor(action: string): BadgeTone {
  for (const [re, tone] of TONES) if (re.test(action)) return tone;
  return "neutral";
}

function short(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : v.toFixed(2);
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "string") return v.length > 40 ? v.slice(0, 37) + "…" : v;
  if (Array.isArray(v)) return `${v.length} items`;
  return "…";
}

/** "cash_sales: 100 → 120, status: open → closed" from before/after JSON objects. */
export function summarizeChange(before: Json | null, after: Json | null): string[] {
  const b = (before && typeof before === "object" && !Array.isArray(before) ? before : {}) as Record<string, unknown>;
  const a = (after && typeof after === "object" && !Array.isArray(after) ? after : {}) as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(b), ...Object.keys(a)])).filter((k) => !/_id$|^id$|^updated_at$|^created_at$/.test(k));
  const out: string[] = [];
  for (const k of keys) {
    const bv = b[k], av = a[k];
    if (JSON.stringify(bv) === JSON.stringify(av)) continue;
    if (bv === undefined) out.push(`${k.replace(/_/g, " ")}: ${short(av)}`);
    else out.push(`${k.replace(/_/g, " ")}: ${short(bv)} → ${short(av)}`);
    if (out.length >= 6) break;
  }
  return out;
}

export function ActivityLog({ entries, timezone }: { entries: ActivityEntry[]; timezone: string }) {
  if (entries.length === 0) return <EmptyState title="Nothing logged yet" description="Closing and reopening days, edits to closed days, hour corrections and settings changes are recorded here." />;
  return (
    <ul className="card divide-y divide-border">
      {entries.map((e) => {
        const changes = summarizeChange(e.before_data, e.after_data);
        const hasJson = e.before_data != null || e.after_data != null;
        return (
          <li key={e.id} className="px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
              <span className="tnum text-text-3 w-[118px] shrink-0">{formatDateTime(e.created_at, timezone)}</span>
              <span className="font-medium">{e.actor_name}</span>
              <Badge tone={toneFor(e.action)}>{e.action.replace(/[._]/g, " ")}</Badge>
              {e.location_name && <span className="text-text-3">· {e.location_name}</span>}
              {e.note && <span className="text-text-2">— {e.note}</span>}
            </div>
            {changes.length > 0 && (
              <div className="mt-1 pl-0 md:pl-[126px] text-[12.5px] text-text-2 tnum flex flex-wrap gap-x-3 gap-y-0.5">{changes.map((c) => <span key={c}>{c}</span>)}</div>
            )}
            {hasJson && (
              <details className="mt-1 md:pl-[126px] text-[12px] text-text-3">
                <summary className="cursor-pointer hover:text-text">Details</summary>
                <div className="grid sm:grid-cols-2 gap-2 mt-1">
                  <pre className="rounded border border-border bg-surface-2 p-2 overflow-x-auto text-[11px] leading-snug">before: {JSON.stringify(e.before_data, null, 1) ?? "null"}</pre>
                  <pre className="rounded border border-border bg-surface-2 p-2 overflow-x-auto text-[11px] leading-snug">after: {JSON.stringify(e.after_data, null, 1) ?? "null"}</pre>
                </div>
              </details>
            )}
          </li>
        );
      })}
    </ul>
  );
}
