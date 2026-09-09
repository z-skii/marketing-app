import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/misc";
import { NotificationList } from "@/components/notifications/notification-list";
import { notificationHref, type NotificationItem } from "@/components/notifications/kinds";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, kind, title, body, data, created_at, read_at, location_id")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(200);
  const items: NotificationItem[] = (data ?? []).map((n) => ({
    id: n.id, kind: n.kind, title: n.title, body: n.body, created_at: n.created_at, read_at: n.read_at, location_id: n.location_id,
    href: notificationHref(n),
  }));
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Notifications"
        description="Unread first. Tap one to open what it is about."
        actions={ctx.isManager && <Link href="/settings/notifications" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-[12.5px] font-medium hover:bg-surface-2"><Settings className="h-3.5 w-3.5" /> Preferences</Link>}
      />
      <NotificationList today={ctx.today} timezone={ctx.org.timezone} unread={unread} items={items} userId={ctx.user.id} />
    </div>
  );
}
