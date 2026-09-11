"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, CalendarBlank, Plus, Megaphone, Storefront, Bell, ChatCircle, MagnifyingGlass, Gear } from "@phosphor-icons/react";
import { BottomNav, Rail, TopBar, TopIcon, type ChromeNavItem } from "./Chrome";
import { BackButton } from "./BackButton";

/**
 * The Business shell: a marketing operating system for one business.
 *
 *   Home       browse people and cars to advertise through
 *   Content    what TapMart shot, delivered and scheduled for the business
 *   Create     Recreate / Story / Car public campaigns (the filled centre item)
 *   Campaigns  public campaigns and direct requests: active, review, completed
 *   Business   the business's own profile, with settings behind a gear
 *
 * Same chrome material as the User shell; different destinations.
 */

export type BusinessIdentity = { id: string; name: string; logo: string | null };

export type BusinessShellProps = {
  business: BusinessIdentity;
  unreadNotifications: number;
  unreadMessages: number;
  children: React.ReactNode;
};

const NAV: ChromeNavItem[] = [
  { href: "/business", label: "Home", icon: House, exact: true },
  { href: "/business/content", label: "Content", icon: CalendarBlank },
  { href: "/business/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/business/profile", label: "Business", icon: Storefront },
];

const CREATE: ChromeNavItem = { href: "/business/create", label: "Create", icon: Plus, create: true };
const MOBILE_ORDER: ChromeNavItem[] = [NAV[0], NAV[1], CREATE, NAV[2], NAV[3]];

export function BusinessShell({ business, unreadNotifications, unreadMessages, children }: BusinessShellProps) {
  const pathname = usePathname();
  // Settings is a detail route: back and a title in the top bar, no bottom bar under the utility rows.
  const detail = pathname === "/business/settings" ? { title: "Settings", back: "/business/profile" } : null;
  return (
    <div className="app-root min-h-dvh bg-paper rail:grid rail:grid-cols-[88px_minmax(0,1fr)]">
      <Rail
        homeHref="/business"
        items={NAV}
        create={{ href: CREATE.href, label: "Create campaign", icon: Plus }}
        extra={[
          { href: "/business/search", label: "Search", icon: MagnifyingGlass },
          { href: "/messages", label: "Messages", icon: ChatCircle, badge: unreadMessages },
          { href: "/alerts", label: "Alerts", icon: Bell, badge: unreadNotifications },
        ]}
        pathname={pathname}
        identity={
          <Link href="/business/settings" aria-label={`Acting as ${business.name}. Settings and switching.`} className="flex h-14 w-16 flex-col items-center justify-center gap-1 rounded-[16px] text-ink-soft can-hover:hover:bg-surface">
            <Mark business={business} size={32} />
          </Link>
        }
      />

      <div className="min-w-0">
        {detail ? (
          <TopBar homeHref="/business" title={detail.title} left={<BackButton fallback={detail.back} />} />
        ) : (
          <TopBar
            homeHref="/business"
            left={<TopIcon href="/messages" label="Messages" icon={ChatCircle} badge={unreadMessages} />}
            right={<><TopIcon href="/alerts" label="Notifications" icon={Bell} badge={unreadNotifications} /><TopIcon href="/business/settings" label="Settings" icon={Gear} /></>}
          />
        )}
        <div className={detail ? "" : "pb-24 rail:pb-0"}>{children}</div>
      </div>

      {!detail && <BottomNav items={MOBILE_ORDER} pathname={pathname} label="Business" />}
    </div>
  );
}

function Mark({ business, size }: { business: BusinessIdentity; size: number }) {
  if (business.logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={business.logo} alt="" width={size} height={size} className="shrink-0 rounded-[10px] object-cover ring-1 ring-white/10" style={{ width: size, height: size }} />;
  }
  return (
    <span aria-hidden className="flex shrink-0 items-center justify-center rounded-[10px] bg-surface-3 font-display font-600 ring-1 ring-white/10" style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {(business.name.trim()[0] ?? "?").toUpperCase()}
    </span>
  );
}
