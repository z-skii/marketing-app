"use client";
import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { markAllReadAction, markReadAction } from "@/app/(app)/notifications/actions";
import { kindMeta, type NotificationItem } from "./kinds";

export function NotificationList({ today, timezone, unread, items, userId }: { today: string; timezone: string; unread: number; items: NotificationItem[]; userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  // "x min ago" only after hydration (server snapshot = 0 → hidden), refreshed every minute.
  const nowMinute = useSyncExternalStore(subscribeMinute, () => Math.floor(Date.now() / 60_000), () => 0);
  const now = nowMinute ? new Date(nowMinute * 60_000) : null;

  // Realtime: new notifications for me → refresh the server list.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, router]);

  const open = (n: NotificationItem) => {
    setBusyId(n.id);
    start(async () => {
      if (!n.read_at) await markReadAction(n.id);
      setBusyId(null);
      if (n.href) router.push(n.href); else router.refresh();
    });
  };

  const markAll = () => start(async () => {
    const r = await markAllReadAction();
    if (!r.ok) toast.push(r.error, "danger"); else toast.push(r.data.count ? `${r.data.count} marked as read` : "Nothing to mark", "success");
    router.refresh();
  });

  const dayOf = (ts: string) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ts));
  const sorted = [...items].sort((a, b) => (a.read_at ? 1 : 0) - (b.read_at ? 1 : 0) || b.created_at.localeCompare(a.created_at));
  const todayItems = sorted.filter((n) => dayOf(n.created_at) === today);
  const earlier = sorted.filter((n) => dayOf(n.created_at) !== today);

  if (items.length === 0) {
    return <EmptyState title="No notifications yet" description="Alerts about clock-ins, missing closeouts, cash shortages and large expenses show up here. Choose which ones you want in Settings → Notifications." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-[13px] text-text-2">{unread > 0 ? <><b className="text-text">{unread}</b> unread</> : "All caught up"}</div>
        <Button variant="secondary" size="sm" onClick={markAll} loading={pending && !busyId} disabled={unread === 0}><CheckCheck className="h-3.5 w-3.5" /> Mark all read</Button>
      </div>
      {todayItems.length > 0 && <Group title="Today" items={todayItems} onOpen={open} busyId={busyId} timezone={timezone} now={now} />}
      {earlier.length > 0 && <Group title="Earlier" items={earlier} onOpen={open} busyId={busyId} timezone={timezone} now={now} />}
    </div>
  );
}

function Group({ title, items, onOpen, busyId, timezone, now }: { title: string; items: NotificationItem[]; onOpen: (n: NotificationItem) => void; busyId: string | null; timezone: string; now: Date | null }) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1.5">{title}</h2>
      <ul className="card divide-y divide-border">
        {items.map((n) => {
          const meta = kindMeta(n.kind);
          const Icon = meta.icon;
          const unread = !n.read_at;
          return (
            <li key={n.id}>
              <button type="button" onClick={() => onOpen(n)} disabled={busyId === n.id}
                className={cn("w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-surface-2/70 disabled:opacity-60", unread && "bg-accent-soft/40")}>
                <span className={cn("mt-0.5 h-7 w-7 shrink-0 rounded-md flex items-center justify-center", unread ? "bg-accent-soft text-accent" : "bg-surface-2 text-text-3")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-[13.5px] truncate", unread ? "font-semibold text-text" : "text-text-2")}>{n.title}</span>
                    <Badge tone={meta.tone} className="hidden sm:inline-flex">{meta.label}</Badge>
                  </span>
                  {n.body && <span className="block text-[12.5px] text-text-3 truncate">{n.body}</span>}
                  <span className="block text-[11.5px] text-text-3 mt-0.5">{now ? `${timeAgo(n.created_at, now)} · ` : ""}{new Intl.DateTimeFormat("en-US", { timeZone: timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(n.created_at))}</span>
                </span>
                {unread && <span className="mt-2 h-2 w-2 rounded-full bg-accent shrink-0" aria-label="Unread" />}
                {n.href && <ChevronRight className="mt-1.5 h-4 w-4 text-text-3 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function subscribeMinute(cb: () => void) {
  const t = setInterval(cb, 60_000);
  return () => clearInterval(t);
}

export function timeAgo(ts: string, now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - new Date(ts).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return `${Math.floor(d / 30)}mo ago`;
}
