import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireV2 } from "@/lib/v2/core";
import { getNotificationPrefs, NOTIFICATION_KINDS } from "@/lib/v2/notification-prefs";
import { BackButton } from "@/components/v2/BackButton";
import { NotificationToggle } from "./Toggle";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

/** Which notifications this account gets, in the app. Email and push do not exist yet, so they are not offered. */
export default async function NotificationSettingsPage() {
  const ctx = await requireV2("/business/settings/notifications");
  const prefs = await getNotificationPrefs(ctx.user.id);

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Settings" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Notifications</h1>
      <p className="mt-1 text-sm text-ink-soft">In the app, for this account across every identity.</p>

      <ul className="mt-4 divide-y divide-rule">
        {NOTIFICATION_KINDS.map((k) => (
          <li key={k.key}><NotificationToggle kind={k.key} label={k.label} sub={k.sub} initial={prefs[k.key] !== false} /></li>
        ))}
      </ul>

      <Link href="/alerts" className="link-row mt-6 text-sm">See all notifications{ctx.unreadNotifications > 0 ? ` (${ctx.unreadNotifications} unread)` : ""}<CaretRight size={14} aria-hidden /></Link>
    </main>
  );
}
