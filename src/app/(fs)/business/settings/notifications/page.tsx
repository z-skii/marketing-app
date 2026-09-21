import Link from "next/link";
import { ArrowRight, Envelope, PaperPlaneTilt, Camera, Car, Bell } from "@phosphor-icons/react/dist/ssr";
import { requireV2 } from "@/lib/v2/core";
import { getNotificationPrefs, NOTIFICATION_KINDS } from "@/lib/v2/notification-prefs";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { NotificationSwitch } from "@/components/fs/settings/Switch";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Notification settings" };
export const dynamic = "force-dynamic";

/** Which notifications this account gets, in the app. Email and push do not exist yet, so they are not offered. */
const LABEL: Record<string, string> = { submission: "Submissions", direct_request: "Requests", content: "Content", car_offer: "Car offers", system: "TapMart" };
const ICON: Record<string, React.ReactNode> = {
  submission: <Envelope size={20} aria-hidden />, direct_request: <PaperPlaneTilt size={20} aria-hidden />, content: <Camera size={20} aria-hidden />,
  car_offer: <Car size={20} aria-hidden />, system: <Bell size={20} aria-hidden />,
};
export default async function NotificationSettingsPage() {
  const ctx = await requireV2("/business/settings/notifications");
  const prefs = await getNotificationPrefs(ctx.user.id);
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Notifications" back={<BackLink fallback={ctx.mode === "business" ? "/business/settings" : "/me/settings"} label="Settings" />} />
      <h2 className="fs-settings-title" style={{ marginTop: 16 }}>In the app</h2>
      <ul className="fs-settings-group" aria-label="Kinds of notification">
        {NOTIFICATION_KINDS.map((k) => <NotificationSwitch key={k.key} kind={k.key} label={LABEL[k.key] ?? k.label} icon={ICON[k.key]} initial={prefs[k.key] !== false} />)}
      </ul>
      <p className="fs-t-meta" style={{ marginTop: 12, marginLeft: 16 }}>Email and push are not offered yet.</p>
      <Link href="/alerts" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>Alerts{ctx.unreadNotifications > 0 ? ` · ${ctx.unreadNotifications} unread` : ""} <ArrowRight size={20} aria-hidden /></Link>
    </main>
  );
}
