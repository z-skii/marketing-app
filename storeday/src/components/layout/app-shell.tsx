"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SITE_NAME } from "@/config/site";
import { ThemeToggle } from "./theme-toggle";
import { EMPLOYEE_MOBILE, EMPLOYEE_NAV, MANAGER_MOBILE, MANAGER_NAV, type NavItem } from "./nav-config";

export interface ShellProps {
  children: React.ReactNode;
  orgName: string;
  organizations: Array<{ id: string; name: string }>;
  userName: string;
  role: "owner" | "manager" | "employee";
  unreadCount: number;
  isEmployeeView?: boolean; // managers can also clock in; show employee nav when on /clock or /my
}

export function AppShell({ children, orgName, organizations, userName, role, unreadCount }: ShellProps) {
  const pathname = usePathname();
  const isManager = role === "owner" || role === "manager";
  const nav = isManager ? MANAGER_NAV : EMPLOYEE_NAV;
  const mobile = isManager ? MANAGER_MOBILE : EMPLOYEE_MOBILE;
  const isActive = (href: string) => pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/")) || (href === "/accounting" && pathname.startsWith("/accounting"));

  return (
    <div className="min-h-dvh flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface sticky top-0 h-dvh">
        <div className="px-4 h-14 flex items-center border-b border-border">
          <Link href={isManager ? "/dashboard" : "/clock"} className="font-semibold tracking-tight text-[15px]">{SITE_NAME}</Link>
        </div>
        <OrgSwitcher orgName={orgName} organizations={organizations} />
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {nav.map((item) => (
            <div key={item.href}>
              <NavLink item={item} active={isActive(item.href)} />
              {item.children && isActive(item.href) && (
                <div className="ml-6 mt-0.5 mb-1 space-y-0.5">
                  {item.children.map((c) => (
                    <Link key={c.href} href={c.href} className={cn("flex items-center gap-2 rounded-md px-2 py-1 text-[12.5px]", pathname.startsWith(c.href) ? "bg-accent-soft text-accent font-medium" : "text-text-2 hover:bg-surface-2 hover:text-text")}>
                      {c.icon && <c.icon className="h-3.5 w-3.5" />}{c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isManager && (
            <div className="pt-3 mt-3 border-t border-border">
              <div className="px-2 pb-1 text-[10.5px] uppercase tracking-wider text-text-3 font-semibold">Me</div>
              {EMPLOYEE_NAV.slice(0, 3).map((item) => <NavLink key={item.href} item={item} active={isActive(item.href)} />)}
            </div>
          )}
        </nav>
        <div className="border-t border-border p-2 flex items-center gap-1">
          <div className="flex-1 min-w-0 px-2">
            <div className="text-[12.5px] font-medium truncate">{userName}</div>
            <div className="text-[11px] text-text-3 capitalize">{role}</div>
          </div>
          <ThemeToggle className="p-1.5 rounded text-text-3 hover:text-text hover:bg-surface-2" />
          <form action="/auth/sign-out" method="post"><button className="p-1.5 rounded text-text-3 hover:text-text hover:bg-surface-2" title="Sign out"><LogOut className="h-4 w-4" /></button></form>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-12 md:h-14 flex items-center gap-2 px-3 md:px-6 border-b border-border bg-surface sticky top-0 z-30">
          <Link href={isManager ? "/dashboard" : "/clock"} className="md:hidden font-semibold text-[15px] tracking-tight">{SITE_NAME}</Link>
          <span className="md:hidden text-text-3 text-[12px] truncate">· {orgName}</span>
          <div className="flex-1" />
          <Link href="/notifications" className="relative p-2 rounded-md text-text-2 hover:bg-surface-2" aria-label="Notifications">
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center">{unreadCount > 99 ? "99+" : unreadCount}</span>}
          </Link>
          <ThemeToggle className="md:hidden p-2 rounded-md text-text-2 hover:bg-surface-2" />
        </header>
        <main className="flex-1 px-3 py-4 md:px-6 md:py-5 pb-20 md:pb-8 max-w-[1400px] w-full mx-auto">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-surface safe-bottom">
        <div className="grid grid-cols-5">
          {mobile.map((item, i) => {
            const active = isActive(item.href) && !(item.href === "/clock" && i === 0 && pathname !== "/clock");
            return (
              <Link key={item.href + i} href={item.href} className={cn("flex flex-col items-center justify-center gap-0.5 py-2 text-[10.5px]", active ? "text-accent" : "text-text-3")}>
                <item.icon className="h-5 w-5" />{item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link href={item.href} className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px]", active ? "bg-surface-2 text-text font-medium" : "text-text-2 hover:bg-surface-2 hover:text-text")}>
      <item.icon className={cn("h-4 w-4", active ? "text-accent" : "text-text-3")} />
      {item.label}
    </Link>
  );
}

function OrgSwitcher({ orgName, organizations }: { orgName: string; organizations: Array<{ id: string; name: string }> }) {
  if (organizations.length <= 1) {
    return <div className="px-4 py-2.5 border-b border-border text-[12.5px] text-text-2 truncate">{orgName}</div>;
  }
  return (
    <form action="/auth/switch-org" method="post" className="px-3 py-2 border-b border-border">
      <div className="relative">
        <select name="organization_id" defaultValue={organizations.find((o) => o.name === orgName)?.id} onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className="w-full appearance-none rounded-md border border-border bg-surface px-2 py-1.5 pr-7 text-[12.5px]">
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-text-3 pointer-events-none" />
      </div>
    </form>
  );
}
