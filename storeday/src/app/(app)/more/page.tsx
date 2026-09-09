import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Bell, CalendarClock, ChevronRight, ClipboardCheck, Clock, LogOut, Newspaper, Radio, Receipt, Settings, Timer, User, Zap, Grid3x3, CalendarDays, Store, Users } from "lucide-react";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageHeader } from "@/components/ui/misc";

export const metadata: Metadata = { title: "More" };

interface Item { href: string; label: string; icon: LucideIcon; hint?: string; badge?: number }

/** Mobile "More" menu: everything that is not in the bottom nav. */
export default async function MorePage() {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", ctx.user.id).is("read_at", null);
  const unread = count ?? 0;

  const groups: Array<{ title: string; items: Item[] }> = ctx.isManager
    ? [
        { title: "Accounting", items: [
          { href: "/accounting/quick-close", label: "Quick Close", icon: Zap },
          { href: "/accounting/rapid-entry", label: "Rapid Entry", icon: Grid3x3 },
          { href: "/accounting/month", label: "Month View", icon: CalendarDays },
          { href: "/expenses", label: "Expenses", icon: Receipt },
          { href: "/reports", label: "Reports", icon: BarChart3 },
        ] },
        { title: "Operations", items: [
          { href: "/working", label: "Who's Working", icon: Radio },
          { href: "/schedule", label: "Schedule", icon: CalendarClock },
          { href: "/brief", label: "Daily Brief", icon: Newspaper },
          { href: "/store-check", label: "Store Check", icon: ClipboardCheck },
          { href: "/stores", label: "Stores", icon: Store },
          { href: "/employees", label: "Employees", icon: Users },
        ] },
        { title: "Me", items: [
          { href: "/clock", label: "My clock", icon: Timer },
          { href: "/my/hours", label: "My hours", icon: Clock },
          { href: "/my/schedule", label: "My schedule", icon: CalendarClock },
          { href: "/notifications", label: "Notifications", icon: Bell, badge: unread },
          { href: "/settings", label: "Settings", icon: Settings, hint: ctx.isOwner ? "Business, accounting, clock-in, members" : "Notification preferences" },
        ] },
      ]
    : [
        { title: "Me", items: [
          { href: "/clock", label: "Clock", icon: Timer },
          { href: "/my/schedule", label: "My schedule", icon: CalendarClock },
          { href: "/my/hours", label: "My hours", icon: Clock },
          { href: "/store-check", label: "Store Check", icon: ClipboardCheck },
          { href: "/my/profile", label: "Profile", icon: User },
          { href: "/notifications", label: "Notifications", icon: Bell, badge: unread },
        ] },
      ];

  return (
    <div className="max-w-xl">
      <PageHeader title="More" description={`${ctx.org.name} · signed in as ${ctx.user.email}`} />
      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-3 mb-1.5">{g.title}</h2>
            <ul className="card divide-y divide-border">
              {g.items.map((it) => (
                <li key={it.href + it.label}>
                  <Link href={it.href} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2/70 active:bg-surface-2">
                    <it.icon className="h-4.5 w-4.5 text-text-3 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[14px]">{it.label}</span>
                      {it.hint && <span className="block text-[12px] text-text-3 truncate">{it.hint}</span>}
                    </span>
                    {it.badge ? <span className="min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-[11px] font-semibold flex items-center justify-center">{it.badge > 99 ? "99+" : it.badge}</span> : null}
                    <ChevronRight className="h-4 w-4 text-text-3 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="card divide-y divide-border">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[14px]">Appearance</span>
            <ThemeToggle className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-[12.5px] text-text-2 hover:bg-surface-2" />
          </div>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-[14px] text-danger hover:bg-danger-soft/60">
              <LogOut className="h-4.5 w-4.5 shrink-0" /> Sign out
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
