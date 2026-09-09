import { Tabs } from "@/components/ui/misc";

export type SettingsTab = "business" | "accounting" | "clock-in" | "notifications" | "members" | "data" | "activity";

const OWNER_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "business", label: "Business" },
  { key: "accounting", label: "Accounting" },
  { key: "clock-in", label: "Clock-in" },
  { key: "notifications", label: "Notifications" },
  { key: "members", label: "Members" },
  { key: "data", label: "Data" },
  { key: "activity", label: "Activity log" },
];

const MANAGER_TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "notifications", label: "Notifications" },
  { key: "activity", label: "Activity log" },
];

export function SettingsTabs({ active, isOwner }: { active: SettingsTab; isOwner: boolean }) {
  const tabs = isOwner ? OWNER_TABS : MANAGER_TABS;
  return <Tabs items={tabs.map((t) => ({ href: `/settings/${t.key}`, label: t.label, active: t.key === active }))} />;
}
