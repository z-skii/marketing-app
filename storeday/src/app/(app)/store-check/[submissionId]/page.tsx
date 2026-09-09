import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { namesForUsers, signChecklistPhotos } from "@/lib/data/store-check";
import { PageHeader } from "@/components/ui/misc";
import { ChecklistRunner, type RunnerItem } from "@/components/checklists/checklist-runner";

export const metadata = { title: "Checklist" };

export default async function RunChecklistPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const ctx = await requireOrgContext();
  const { submissionId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: sub } = await supabase.from("checklist_submissions").select("*").eq("id", submissionId).maybeSingle();
  if (!sub || sub.organization_id !== ctx.org.id) notFound();
  const location = ctx.locations.find((l) => l.id === sub.location_id);
  if (!location) notFound();

  const [{ data: template }, { data: items }, { data: rows }, names] = await Promise.all([
    supabase.from("checklist_templates").select("name, kind").eq("id", sub.template_id).maybeSingle(),
    supabase.from("checklist_items").select("*").eq("template_id", sub.template_id).order("sort_order").order("created_at"),
    supabase.from("checklist_submission_items").select("*").eq("submission_id", sub.id),
    namesForUsers(supabase, ctx.org.id, sub.submitted_by ? [sub.submitted_by] : []),
  ]);
  const byItem = new Map((rows ?? []).map((r) => [r.item_id, r]));
  const urls = await signChecklistPhotos(supabase, (rows ?? []).map((r) => r.photo_path).filter((p): p is string => !!p));

  const runnerItems: RunnerItem[] = (items ?? []).map((it) => {
    const r = byItem.get(it.id);
    return {
      id: it.id, label: it.label, requires_photo: it.requires_photo,
      checked: r?.checked ?? false, checked_at: r?.checked_at ?? null,
      photo_path: r?.photo_path ?? null, photo_url: r?.photo_path ? urls[r.photo_path] ?? null : null,
    };
  });

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={template?.name ?? "Checklist"} description={`${location.name} · ${sub.business_date}`} back={{ href: "/store-check", label: "Store Check" }} className="mb-3" />
      <ChecklistRunner
        submission={{ id: sub.id, status: sub.status, business_date: sub.business_date, completed_at: sub.completed_at, started_at: sub.started_at, submitted_by_name: sub.submitted_by ? names.get(sub.submitted_by) ?? (sub.submitted_by === ctx.user.id ? "you" : null) : null }}
        template={{ name: template?.name ?? "Checklist", kind: template?.kind ?? sub.kind }}
        location={{ id: location.id, name: location.name, timezone: location.timezone }}
        organizationId={ctx.org.id}
        items={runnerItems}
      />
    </div>
  );
}
