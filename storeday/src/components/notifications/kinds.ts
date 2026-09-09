import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Bell, CalendarClock, Clock, DoorClosed, DoorOpen, LogIn, LogOut, MailPlus, MapPinOff, Receipt, Wallet } from "lucide-react";
import type { Database } from "@/types/database";
import type { BadgeTone } from "@/components/ui/badge";

export type NotificationKind = Database["public"]["Enums"]["notification_kind"];

export interface KindMeta { kind: NotificationKind; label: string; description: string; icon: LucideIcon; tone: BadgeTone; defaultOn: boolean }

/** Order and copy shared by the notifications page and the preferences form. defaultOn mirrors app.notify_managers(). */
export const NOTIFICATION_KINDS: KindMeta[] = [
  { kind: "employee_clock_in", label: "Clock-in", description: "Someone clocks in.", icon: LogIn, tone: "accent", defaultOn: false },
  { kind: "employee_clock_out", label: "Clock-out", description: "Someone clocks out.", icon: LogOut, tone: "neutral", defaultOn: false },
  { kind: "employee_late", label: "Late employee", description: "A scheduled shift started 15+ minutes ago with no clock-in.", icon: CalendarClock, tone: "warn", defaultOn: true },
  { kind: "store_not_opened", label: "Store not opened", description: "No clock-in or opening checklist 45 minutes after opening time.", icon: DoorOpen, tone: "danger", defaultOn: true },
  { kind: "store_not_closed", label: "Store not closed", description: "Closing checklist not completed 90 minutes after closing time.", icon: DoorClosed, tone: "warn", defaultOn: true },
  { kind: "missing_closeout", label: "Missing closeout", description: "Yesterday was not closed out in Quick Close.", icon: AlertTriangle, tone: "warn", defaultOn: true },
  { kind: "cash_shortage", label: "Cash shortage", description: "Actual drawer cash is below expected.", icon: Wallet, tone: "danger", defaultOn: true },
  { kind: "large_expense", label: "Large expense", description: "A detailed expense above your threshold.", icon: Receipt, tone: "warn", defaultOn: true },
  { kind: "outside_radius", label: "Outside radius", description: "A clock-in from outside the store's GPS radius.", icon: MapPinOff, tone: "warn", defaultOn: true },
  { kind: "forgot_clock_out", label: "Forgot to clock out", description: "A shift has been active for more than 14 hours.", icon: Clock, tone: "warn", defaultOn: true },
];

const EXTRA: Record<"invitation" | "general", Omit<KindMeta, "kind" | "defaultOn">> = {
  invitation: { label: "Invitation", description: "", icon: MailPlus, tone: "accent" },
  general: { label: "Notice", description: "", icon: Bell, tone: "neutral" },
};

export function kindMeta(kind: NotificationKind): Omit<KindMeta, "kind" | "defaultOn"> {
  return NOTIFICATION_KINDS.find((k) => k.kind === kind) ?? EXTRA[kind as "invitation" | "general"] ?? EXTRA.general;
}

/** Plain shape passed from the server page to the client list. */
export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
  location_id: string | null;
  href: string | null;
}

/** Where a notification leads, derived from its data payload. */
export function notificationHref(n: { kind: NotificationKind; location_id: string | null; data: unknown }): string | null {
  const d = (n.data && typeof n.data === "object" ? n.data : {}) as Record<string, unknown>;
  const s = (k: string) => (typeof d[k] === "string" && d[k] ? (d[k] as string) : null);
  if (s("shift_id")) return `/shifts/${s("shift_id")}`;
  if (s("expense_id")) return `/expenses/${s("expense_id")}`;
  const loc = s("location_id") ?? n.location_id;
  const date = s("date") ?? s("business_date");
  if (s("daily_report_id") || (loc && date)) {
    const q = new URLSearchParams();
    if (loc) q.set("location", loc);
    if (date) q.set("date", date);
    return `/accounting/quick-close?${q.toString()}`;
  }
  if (s("schedule_id")) return "/schedule";
  if (n.kind === "invitation") return "/employees";
  if (n.kind === "store_not_opened" || n.kind === "store_not_closed") return "/working";
  return null;
}
