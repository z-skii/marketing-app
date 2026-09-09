"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Stat } from "@/components/ui/stat";
import { formatMinutes, formatTime } from "@/lib/utils/time";
import { LiveElapsed, useNow } from "./live-timer";
import { VerificationBadge } from "./verification-badge";

export interface WorkingStore {
  id: string; name: string; timezone: string;
  active: Array<{ id: string; employee_id: string; employee_name: string; clock_in_at: string; break_minutes: number; verification_status: string }>;
  completed: Array<{ id: string; employee_id: string; employee_name: string; clock_in_at: string; clock_out_at: string | null; worked_minutes: number | null; verification_status: string }>;
}

export function WhosWorking({ orgId, stores }: { orgId: string; stores: WorkingStore[] }) {
  const router = useRouter();
  const now = useNow(30000);

  // Realtime on shifts + a polling fallback (realtime can be blocked by proxies / sleeping tabs).
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel("shifts-" + orgId)
      .on("postgres_changes", { event: "*", schema: "public", table: "shifts", filter: `organization_id=eq.${orgId}` }, () => router.refresh())
      .subscribe();
    const poll = setInterval(() => router.refresh(), 60000);
    const onVisible = () => { if (document.visibilityState === "visible") router.refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { supabase.removeChannel(channel); clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); };
  }, [orgId, router]);

  const stats = useMemo(() => {
    let working = 0, open = 0, minutes = 0;
    for (const s of stores) {
      working += s.active.length;
      if (s.active.length) open++;
      for (const c of s.completed) minutes += c.worked_minutes ?? 0;
      for (const a of s.active) minutes += Math.max(0, Math.floor((now.getTime() - new Date(a.clock_in_at).getTime()) / 60000) - a.break_minutes);
    }
    return { working, open, minutes };
  }, [stores, now]);

  if (stores.length === 0) {
    return <EmptyState title="No stores yet" description="Add a store to see who's working." action={<Link href="/stores" className="text-accent text-[13px]">Go to Stores</Link>} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Working now" value={stats.working} sub={stats.working === 1 ? "employee" : "employees"} />
        <Stat label="Stores open" value={`${stats.open} / ${stores.length}`} sub="someone clocked in" />
        <Stat label="Hours today" value={<span suppressHydrationWarning>{formatMinutes(stats.minutes)}</span>} sub="completed + running" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {stores.map((s) => (
          <Card key={s.id}>
            <CardHeader
              title={<span className="flex items-center gap-2">{s.name}{s.active.length > 0 ? <Badge tone="success">Open</Badge> : <Badge>Nobody in</Badge>}</span>}
              description={s.active.length > 0 ? `${s.active.length} working` : "Nobody clocked in"}
            />
            <CardBody>
              {s.active.length === 0 ? (
                <div className="text-[13px] text-text-3 py-1">Nobody clocked in.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {s.active.map((a) => (
                    <li key={a.id}>
                      <Link href={`/shifts/${a.id}`} className="flex items-center gap-3 py-2 -mx-1 px-1 rounded hover:bg-surface-2">
                        <span className="h-2 w-2 rounded-full bg-success shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium truncate">{a.employee_name}</div>
                          <div className="text-[12px] text-text-3">Clocked in {formatTime(a.clock_in_at, s.timezone)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <LiveElapsed from={a.clock_in_at} breakMinutes={a.break_minutes} className="block text-[14px] font-semibold" />
                          <VerificationBadge status={a.verification_status} />
                        </div>
                        <ChevronRight className="h-4 w-4 text-text-3 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Today" description="Completed shifts, per store." />
        <CardBody>
          {stores.every((s) => s.completed.length === 0) ? (
            <div className="text-[13px] text-text-3">No completed shifts yet today.</div>
          ) : (
            <div className="space-y-3">
              {stores.filter((s) => s.completed.length > 0).map((s) => (
                <div key={s.id}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1">{s.name} · {formatMinutes(s.completed.reduce((a, c) => a + (c.worked_minutes ?? 0), 0))}</div>
                  <ul className="divide-y divide-border">
                    {s.completed.map((c) => (
                      <li key={c.id}>
                        <Link href={`/shifts/${c.id}`} className="flex items-center gap-3 py-1.5 text-[13px] hover:bg-surface-2 -mx-1 px-1 rounded">
                          <span className="flex-1 min-w-0 truncate font-medium">{c.employee_name}</span>
                          <span className="tnum text-text-2 whitespace-nowrap">{formatTime(c.clock_in_at, s.timezone)} – {formatTime(c.clock_out_at, s.timezone)}</span>
                          <span className="tnum font-semibold w-16 text-right">{formatMinutes(c.worked_minutes)}</span>
                          <VerificationBadge status={c.verification_status} className="hidden sm:inline-flex" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
