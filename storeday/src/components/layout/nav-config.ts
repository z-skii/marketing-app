import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, Calculator, Zap, Grid3x3, CalendarDays, Store, Users, Radio, Receipt, BarChart3,
  Newspaper, Settings, Clock, ClipboardCheck, User, CalendarClock, Home, MoreHorizontal, Timer,
} from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; children?: Array<{ href: string; label: string; icon?: LucideIcon }>; ownerOnly?: boolean }

export const MANAGER_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounting", label: "Accounting", icon: Calculator, children: [
    { href: "/accounting/quick-close", label: "Quick Close", icon: Zap },
    { href: "/accounting/rapid-entry", label: "Rapid Entry", icon: Grid3x3 },
    { href: "/accounting/month", label: "Month View", icon: CalendarDays },
  ] },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/working", label: "Who's Working", icon: Radio },
  { href: "/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/brief", label: "Daily Brief", icon: Newspaper },
  { href: "/store-check", label: "Store Check", icon: ClipboardCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const MANAGER_MOBILE: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/accounting", label: "Accounting", icon: Calculator },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/employees", label: "Team", icon: Users },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export const EMPLOYEE_NAV: NavItem[] = [
  { href: "/clock", label: "Clock", icon: Timer },
  { href: "/my/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/my/hours", label: "Hours", icon: Clock },
  { href: "/store-check", label: "Store Check", icon: ClipboardCheck },
  { href: "/my/profile", label: "Profile", icon: User },
];

export const EMPLOYEE_MOBILE: NavItem[] = [
  { href: "/clock", label: "Home", icon: Home },
  { href: "/my/schedule", label: "Schedule", icon: CalendarClock },
  { href: "/clock", label: "Clock", icon: Timer },
  { href: "/my/hours", label: "Hours", icon: Clock },
  { href: "/my/profile", label: "Profile", icon: User },
];
