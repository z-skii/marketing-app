import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { hasPermission, isManagerOrOwner, isOwner, type Membership, type PermissionKey } from "@/lib/permissions";
import { todayIn } from "@/lib/utils/time";

type Tables = Database["public"]["Tables"];
export type Organization = Tables["organizations"]["Row"];
export type OrganizationSettings = Tables["organization_settings"]["Row"];
export type Location = Tables["locations"]["Row"];
export type Profile = Tables["profiles"]["Row"];
export type Employee = Tables["employees"]["Row"];

export interface AppUser {
  id: string;
  email: string;
  profile: Profile | null;
}

export interface OrgContext {
  user: AppUser;
  org: Organization;
  settings: OrganizationSettings;
  membership: Membership;
  /** Locations the user may access (owner: all active; others: assigned). Sorted. */
  locations: Location[];
  /** The user's own employee record in this org, if any (managers and employees). */
  employee: Employee | null;
  /** Every organization the user belongs to (for the switcher). */
  organizations: Array<{ id: string; name: string; role: string }>;
  today: string;
  isOwner: boolean;
  isManager: boolean;
  can: (key: PermissionKey) => boolean;
}

export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? profile?.email ?? "", profile: profile ?? null };
});

export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/**
 * Resolves the active organization for the signed-in user. Redirects to onboarding when
 * they have none. The active org is profile.active_organization_id, falling back to the first membership.
 */
export const getOrgContext = cache(async (): Promise<OrgContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createSupabaseServerClient();
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, role, permissions, organizations!inner(id, name)")
    .eq("user_id", user.id)
    .eq("status", "active");
  if (!memberships || memberships.length === 0) return null;

  const activeId = user.profile?.active_organization_id;
  const active = memberships.find((m) => m.organization_id === activeId) ?? memberships[0];
  const [{ data: org }, { data: settings }, { data: locations }, { data: employee }] = await Promise.all([
    supabase.from("organizations").select("*").eq("id", active.organization_id).single(),
    supabase.from("organization_settings").select("*").eq("organization_id", active.organization_id).maybeSingle(),
    supabase.from("locations").select("*").eq("organization_id", active.organization_id).eq("is_active", true).order("sort_order").order("name"),
    supabase.from("employees").select("*").eq("organization_id", active.organization_id).eq("user_id", user.id).maybeSingle(),
  ]);
  if (!org || !settings) return null;
  const membership: Membership = { role: active.role, permissions: (active.permissions as Membership["permissions"]) ?? {} };
  return {
    user, org, settings, membership,
    locations: locations ?? [],
    employee: employee ?? null,
    organizations: memberships.map((m) => ({ id: m.organization_id, name: (m.organizations as { name: string }).name, role: m.role })),
    today: todayIn(org.timezone),
    isOwner: isOwner(membership),
    isManager: isManagerOrOwner(membership),
    can: (key) => hasPermission(membership, key),
  };
});

/** Org context or redirect: to sign-in when logged out, to onboarding when no business yet. */
export async function requireOrgContext(): Promise<OrgContext> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const ctx = await getOrgContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

/** Managers and owners only. Employees land on their clock screen. */
export async function requireManagerContext(): Promise<OrgContext> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) redirect("/clock");
  return ctx;
}

export async function requireOwnerContext(): Promise<OrgContext> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) redirect("/dashboard");
  return ctx;
}

/** Location from the context, or the first one. Throws when the id is not accessible. */
export function pickLocation(ctx: OrgContext, locationId?: string | null): Location | null {
  if (!ctx.locations.length) return null;
  if (!locationId) return ctx.locations[0];
  return ctx.locations.find((l) => l.id === locationId) ?? null;
}

export function fullName(p: { first_name: string; last_name: string | null } | null | undefined): string {
  if (!p) return "";
  return `${p.first_name} ${p.last_name ?? ""}`.trim();
}
