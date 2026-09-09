import type { Database } from "@/types/database";

export type OrgRole = Database["public"]["Enums"]["org_role"];

/** Manager permission flags stored in organization_members.permissions. Owners implicitly have all. */
export type PermissionKey = "can_edit_hours" | "can_manage_schedule" | "can_edit_closed_days" | "can_add_expenses" | "can_view_reports";

export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  can_edit_hours: "Correct employee hours",
  can_manage_schedule: "Manage schedules",
  can_edit_closed_days: "Reopen / edit closed days",
  can_add_expenses: "Add expenses",
  can_view_reports: "View reports",
};

export const DEFAULT_MANAGER_PERMISSIONS: Record<PermissionKey, boolean> = {
  can_edit_hours: true, can_manage_schedule: true, can_edit_closed_days: false, can_add_expenses: true, can_view_reports: true,
};

export interface Membership {
  role: OrgRole;
  permissions: Partial<Record<PermissionKey, boolean>>;
}

export function isOwner(m: Membership | null | undefined): boolean {
  return m?.role === "owner";
}

export function isManagerOrOwner(m: Membership | null | undefined): boolean {
  return m?.role === "owner" || m?.role === "manager";
}

export function hasPermission(m: Membership | null | undefined, key: PermissionKey): boolean {
  if (!m) return false;
  if (m.role === "owner") return true;
  if (m.role !== "manager") return false;
  return m.permissions[key] ?? DEFAULT_MANAGER_PERMISSIONS[key];
}

export function canViewAccounting(m: Membership | null | undefined, employeeCanView = false): boolean {
  return isManagerOrOwner(m) || (m?.role === "employee" && employeeCanView);
}
