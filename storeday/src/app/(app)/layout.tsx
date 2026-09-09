import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext();
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", ctx.user.id).is("read_at", null);
  return (
    <AppShell
      orgName={ctx.org.name}
      organizations={ctx.organizations}
      userName={ctx.user.profile?.full_name || ctx.employee ? `${ctx.employee?.first_name ?? ctx.user.profile?.full_name ?? ""} ${ctx.employee?.last_name ?? ""}`.trim() || ctx.user.email : ctx.user.email}
      role={ctx.membership.role}
      unreadCount={count ?? 0}
    >
      {children}
    </AppShell>
  );
}
