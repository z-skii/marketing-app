import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireV2 } from "@/lib/v2/core";
import { getNotificationPrefs, NOTIFICATION_KINDS } from "@/lib/v2/notification-prefs";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { NotificationSwitch } from "@/components/fs/settings/Switch";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Notification settings" };
export const dynamic = "force-dynamic";

/** Which notifications this account gets, in the app. Email and push do not exist yet, so they are not offered. */
export default async function NotificationSettingsPage() {
  const ctx = await requireV2("/business/settings/notifications");
  const prefs = await getNotificationPrefs(ctx.user.id);
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Notifications" lede="In the app, for this account across every identity. Email and push are not offered yet." back={<BackLink fallback="/business/settings" label="Settings" />} />
      <ul className="fs-settings-group" style={{ marginTop: 16 }} aria-label="Kinds of notification">
        {NOTIFICATION_KINDS.map((k) => <NotificationSwitch key={k.key} kind={k.key} label={k.label} sub={k.sub} initial={prefs[k.key] !== false} />)}
      </ul>
      <Link href="/alerts" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 16 }}>See all notifications{ctx.unreadNotifications > 0 ? ` · ${ctx.unreadNotifications} unread` : ""} <ArrowRight size={18} aria-hidden /></Link>
    </main>
  );
}
