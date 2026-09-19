import type { ComponentType } from "react";
import { HomeIcon, ActivityIcon, WalletIcon, UserIcon, CalendarIcon, PlusIcon, MegaphoneIcon, StorefrontIcon, SearchIcon, MessagesIcon, BellIcon } from "@/ds/icons";

/**
 * Destinations for the two identities. Same URLs and the same "which tab
 * is current" rules as the previous shells, in one place.
 */
export type NavItem = { href: string; label: string; icon: ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string; "aria-hidden"?: boolean }>; create?: boolean; isActive: (pathname: string) => boolean };
export type Utility = { href: string; label: string; icon: NavItem["icon"]; badge: number };

const under = (href: string, p: string) => p === href || p.startsWith(href + "/");

export const PERSONAL_NAV: NavItem[] = [
  { href: "/home", label: "Home", icon: HomeIcon, isActive: (p) => under("/home", p) || p.startsWith("/o/") },
  { href: "/activity", label: "Activity", icon: ActivityIcon, isActive: (p) => under("/activity", p) },
  { href: "/earnings", label: "Earnings", icon: WalletIcon, isActive: (p) => under("/earnings", p) },
  { href: "/me", label: "Profile", icon: UserIcon, isActive: (p) => under("/me", p) },
];

export const BUSINESS_NAV: NavItem[] = [
  { href: "/business", label: "Home", icon: HomeIcon, isActive: (p) => p === "/business" || p.startsWith("/business/people") || p.startsWith("/business/cars") },
  { href: "/business/content", label: "Content", icon: CalendarIcon, isActive: (p) => under("/business/content", p) },
  { href: "/business/create", label: "Create", icon: PlusIcon, create: true, isActive: (p) => under("/business/create", p) },
  { href: "/business/campaigns", label: "Campaigns", icon: MegaphoneIcon, isActive: (p) => under("/business/campaigns", p) },
  { href: "/business/profile", label: "Business", icon: StorefrontIcon, isActive: (p) => under("/business/profile", p) || /^\/business\/(settings|edit|brand|google|plan|billing|team|loyalty|social|trends)(\/|$)/.test(p) || /^\/(messages|alerts|business\/search)(\/|$)/.test(p) },
];

export function utilities(mode: "personal" | "business", unreadMessages: number, unreadNotifications: number): Utility[] {
  return [
    { href: mode === "business" ? "/business/search" : "/search", label: "Search", icon: SearchIcon, badge: 0 },
    { href: "/messages", label: "Messages", icon: MessagesIcon, badge: unreadMessages },
    { href: "/alerts", label: "Notifications", icon: BellIcon, badge: unreadNotifications },
  ];
}
