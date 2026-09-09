import Link from "next/link";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayIn } from "@/lib/utils/time";
import { listTemplates, submissionsForDates, templatesForStore } from "@/lib/data/store-check";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { StatusBoard, type BoardStore } from "@/components/checklists/status-board";
import { TemplateManager } from "@/components/checklists/template-manager";
import { ChecklistRealtimeRefresh } from "@/components/checklists/realtime-refresh";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Store Check" };

export default async function StoreCheckPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireOrgContext();
  const sp = await searchParams;
  const tab = ctx.isOwner && sp.tab === "templates" ? "templates" : "today";
  const supabase = await createSupabaseServerClient();

  const dates: Record<string, string> = Object.fromEntries(ctx.locations.map((l) => [l.id, todayIn(l.timezone)]));
  const [templates, submissions, { data: settings }] = await Promise.all([
    listTemplates(supabase, ctx.org.id, { includeInactive: ctx.isOwner }),
    submissionsForDates(supabase, ctx.org.id, dates),
    ctx.locations.length
      ? supabase.from("location_settings").select("location_id, require_opening_checklist, require_closing_checklist").in("location_id", ctx.locations.map((l) => l.id))
      : Promise.resolve({ data: [] as Array<{ location_id: string; require_opening_checklist: boolean; require_closing_checklist: boolean }> }),
  ]);
  const settingsByLoc = new Map((settings ?? []).map((s) => [s.location_id, s]));

  const stores: BoardStore[] = ctx.locations.map((l) => {
    const ls = settingsByLoc.get(l.id);
    return {
      id: l.id, name: l.name, timezone: l.timezone, date: dates[l.id],
      runs: templatesForStore(templates, l.id).map((t) => {
        const sub = submissions.find((s) => s.location_id === l.id && s.template_id === t.id) ?? null;
        return {
          template: { id: t.id, name: t.name, kind: t.kind },
          required: (t.kind === "opening" && !!ls?.require_opening_checklist) || (t.kind === "closing" && !!ls?.require_closing_checklist),
          submission: sub ? { id: sub.id, status: sub.status, completed_at: sub.completed_at, submitted_by_name: sub.submitted_by_name } : null,
        };
      }),
    };
  });

  const tabs = ctx.isOwner
    ? [{ href: "/store-check", label: "Today", active: tab === "today" }, { href: "/store-check?tab=templates", label: "Templates", active: tab === "templates", count: templates.length }]
    : [];

  return (
    <div className="max-w-6xl">
      <ChecklistRealtimeRefresh orgId={ctx.org.id} />
      <PageHeader
        title="Store Check"
        description={ctx.isManager ? "Opening and closing checklists for every store, today." : "Run the opening and closing checklist for your store."}
      />
      {tabs.length > 0 && (
        <div className="flex gap-1 overflow-x-auto border-b border-border mb-4 -mx-1 px-1">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={cn("px-3 py-2 text-[13px] whitespace-nowrap border-b-2 -mb-px", t.active ? "border-accent text-text font-medium" : "border-transparent text-text-3 hover:text-text")}>
              {t.label}{t.count != null && <span className="ml-1.5 text-[11px] text-text-3">{t.count}</span>}
            </Link>
          ))}
        </div>
      )}
      {tab === "templates" ? (
        <TemplateManager
          templates={templates.map((t) => ({ id: t.id, name: t.name, kind: t.kind, location_id: t.location_id, is_active: t.is_active, items: t.items.map((i) => ({ id: i.id, label: i.label, requires_photo: i.requires_photo })) }))}
          locations={ctx.locations.map((l) => ({ id: l.id, name: l.name }))}
        />
      ) : stores.length === 0 ? (
        <EmptyState title="No stores" description={ctx.isOwner ? "Add a store first, then run checklists here." : "You are not assigned to a store yet. Ask your manager."} />
      ) : (
        <StatusBoard stores={stores} variant={ctx.isManager ? "manager" : "employee"} />
      )}
    </div>
  );
}
