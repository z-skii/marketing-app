"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import { todayIn } from "@/lib/utils/time";

const uuid = z.string().uuid();
const kindSchema = z.enum(["opening", "closing", "custom"]);

function revalidateStoreCheck(submissionId?: string) {
  revalidatePath("/store-check");
  revalidatePath("/dashboard");
  if (submissionId) revalidatePath(`/store-check/${submissionId}`);
}

// ------------------------------------------------------------------ running a checklist

/** Creates (or returns) today's submission for a template at a store, with one row per template item. */
export async function startChecklistAction(templateId: string, locationId: string): Promise<ActionResult<{ submissionId: string }>> {
  const ctx = await requireOrgContext();
  if (!uuid.safeParse(templateId).success || !uuid.safeParse(locationId).success) return fail("Invalid request");
  const location = ctx.locations.find((l) => l.id === locationId);
  if (!location) return fail("You do not have access to this store");
  const supabase = await createSupabaseServerClient();
  const { data: template } = await supabase.from("checklist_templates").select("id, kind, is_active, location_id, organization_id").eq("id", templateId).maybeSingle();
  if (!template || template.organization_id !== ctx.org.id) return fail("Checklist not found");
  if (!template.is_active) return fail("This checklist is no longer active");
  if (template.location_id && template.location_id !== locationId) return fail("This checklist belongs to another store");

  const businessDate = todayIn(location.timezone);
  const { data: existing } = await supabase
    .from("checklist_submissions").select("id").eq("template_id", templateId).eq("location_id", locationId).eq("business_date", businessDate).maybeSingle();
  let submissionId = existing?.id ?? null;
  if (!submissionId) {
    const { data: created, error } = await supabase.from("checklist_submissions").insert({
      organization_id: ctx.org.id, location_id: locationId, template_id: templateId, kind: template.kind, business_date: businessDate, created_by: ctx.user.id,
    }).select("id").single();
    if (error) {
      // Lost a race: someone else started it a moment ago.
      const { data: again } = await supabase
        .from("checklist_submissions").select("id").eq("template_id", templateId).eq("location_id", locationId).eq("business_date", businessDate).maybeSingle();
      if (!again) return fail(error.message);
      submissionId = again.id;
    } else submissionId = created.id;
  }
  const { data: items } = await supabase.from("checklist_items").select("id").eq("template_id", templateId);
  if (items && items.length) {
    const { error } = await supabase.from("checklist_submission_items")
      .upsert(items.map((it) => ({ organization_id: ctx.org.id, submission_id: submissionId!, item_id: it.id })), { onConflict: "submission_id,item_id", ignoreDuplicates: true });
    if (error) return fail(error.message);
  }
  revalidateStoreCheck(submissionId);
  return ok({ submissionId });
}

/** Saves one item of an in-progress submission. `photoPath` is the storage path in checklist-photos when the item needs a live photo. */
export async function toggleChecklistItemAction(submissionId: string, itemId: string, checked: boolean, photoPath?: string | null): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!uuid.safeParse(submissionId).success || !uuid.safeParse(itemId).success) return fail("Invalid request");
  const supabase = await createSupabaseServerClient();
  const { data: sub } = await supabase.from("checklist_submissions").select("id, status, organization_id, location_id, template_id").eq("id", submissionId).maybeSingle();
  if (!sub || sub.organization_id !== ctx.org.id) return fail("Checklist not found");
  if (sub.status === "completed") return fail("This checklist is already completed");
  const { data: item } = await supabase.from("checklist_items").select("id, requires_photo, template_id").eq("id", itemId).maybeSingle();
  if (!item || item.template_id !== sub.template_id) return fail("Item not found");
  const prefix = `${sub.organization_id}/${sub.location_id}/`;
  if (photoPath && !photoPath.startsWith(prefix)) return fail("Invalid photo path");
  if (checked && item.requires_photo && !photoPath) return fail("This item needs a live photo");
  const { error } = await supabase.from("checklist_submission_items").upsert({
    organization_id: sub.organization_id, submission_id: submissionId, item_id: itemId,
    checked, checked_at: checked ? new Date().toISOString() : null, checked_by: checked ? ctx.user.id : null,
    photo_path: checked ? photoPath ?? null : null,
  }, { onConflict: "submission_id,item_id" });
  if (error) return fail(error.message);
  revalidateStoreCheck(submissionId);
  return ok(undefined);
}

/** Marks the submission completed once every item is checked (and photographed where required). */
export async function completeChecklistAction(submissionId: string): Promise<ActionResult<{ completed_at: string }>> {
  const ctx = await requireOrgContext();
  if (!uuid.safeParse(submissionId).success) return fail("Invalid request");
  const supabase = await createSupabaseServerClient();
  const { data: sub } = await supabase.from("checklist_submissions").select("id, status, organization_id, template_id, location_id, kind").eq("id", submissionId).maybeSingle();
  if (!sub || sub.organization_id !== ctx.org.id) return fail("Checklist not found");
  if (sub.status === "completed") return fail("Already completed");
  const [{ data: items }, { data: rows }] = await Promise.all([
    supabase.from("checklist_items").select("id, label, requires_photo").eq("template_id", sub.template_id),
    supabase.from("checklist_submission_items").select("item_id, checked, photo_path").eq("submission_id", submissionId),
  ]);
  const byItem = new Map((rows ?? []).map((r) => [r.item_id, r]));
  for (const it of items ?? []) {
    const r = byItem.get(it.id);
    if (!r?.checked) return fail(`"${it.label}" is not checked yet`);
    if (it.requires_photo && !r.photo_path) return fail(`"${it.label}" needs a live photo`);
  }
  const completed_at = new Date().toISOString();
  const { error } = await supabase.from("checklist_submissions").update({ status: "completed", completed_at, submitted_by: ctx.user.id }).eq("id", submissionId);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", {
    p_org: ctx.org.id, p_loc: sub.location_id, p_action: `checklist.${sub.kind}.completed`, p_entity_type: "checklist_submission", p_entity_id: submissionId, p_after: { completed_at },
  }).then(() => {}, () => {});
  revalidateStoreCheck(submissionId);
  return ok({ completed_at });
}

// ------------------------------------------------------------------ templates (owner only)

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  kind: kindSchema,
  location_id: z.string().uuid().nullable(),
  is_active: z.boolean().optional(),
});
export type TemplateInput = z.infer<typeof templateSchema>;

const itemsSchema = z.array(z.object({
  id: z.string().uuid().nullable().optional(),
  label: z.string().trim().min(1, "Every item needs a label").max(200),
  requires_photo: z.boolean().default(false),
})).max(100);
export type TemplateItemInput = z.infer<typeof itemsSchema>[number];

export async function createTemplateAction(input: TemplateInput, items: TemplateItemInput[] = []): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can edit checklists");
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const parsedItems = itemsSchema.safeParse(items);
  if (!parsedItems.success) return fail(parsedItems.error.issues[0]?.message);
  if (parsed.data.location_id && !ctx.locations.some((l) => l.id === parsed.data.location_id)) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("checklist_templates").insert({
    organization_id: ctx.org.id, name: parsed.data.name, kind: parsed.data.kind, location_id: parsed.data.location_id, is_active: parsed.data.is_active ?? true, created_by: ctx.user.id,
  }).select("id").single();
  if (error) return fail(error.message);
  if (parsedItems.data.length) {
    const { error: e2 } = await supabase.from("checklist_items").insert(
      parsedItems.data.map((it, i) => ({ organization_id: ctx.org.id, template_id: data.id, label: it.label, requires_photo: it.requires_photo, sort_order: i + 1 })),
    );
    if (e2) return fail(e2.message);
  }
  revalidateStoreCheck();
  return ok({ id: data.id });
}

export async function updateTemplateAction(templateId: string, input: TemplateInput): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can edit checklists");
  if (!uuid.safeParse(templateId).success) return fail("Invalid request");
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  if (parsed.data.location_id && !ctx.locations.some((l) => l.id === parsed.data.location_id)) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("checklist_templates").update({
    name: parsed.data.name, kind: parsed.data.kind, location_id: parsed.data.location_id, ...(parsed.data.is_active != null ? { is_active: parsed.data.is_active } : {}),
  }).eq("id", templateId).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  revalidateStoreCheck();
  return ok(undefined);
}

/** Deletes a template; templates that already have submissions are deactivated instead so history stays intact. */
export async function deleteTemplateAction(templateId: string): Promise<ActionResult<{ deactivated: boolean }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can edit checklists");
  if (!uuid.safeParse(templateId).success) return fail("Invalid request");
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("checklist_submissions").select("id", { count: "exact", head: true }).eq("template_id", templateId);
  if ((count ?? 0) > 0) {
    const { error } = await supabase.from("checklist_templates").update({ is_active: false }).eq("id", templateId).eq("organization_id", ctx.org.id);
    if (error) return fail(error.message);
    revalidateStoreCheck();
    return ok({ deactivated: true });
  }
  const { error } = await supabase.from("checklist_templates").delete().eq("id", templateId).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  revalidateStoreCheck();
  return ok({ deactivated: false });
}

/**
 * Replaces the item list of a template: order = array order, existing ids are updated, new ones inserted,
 * missing ones deleted (their rows in past submissions cascade away).
 */
export async function upsertTemplateItemsAction(templateId: string, items: TemplateItemInput[]): Promise<ActionResult<{ ids: string[] }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can edit checklists");
  if (!uuid.safeParse(templateId).success) return fail("Invalid request");
  const parsed = itemsSchema.safeParse(items);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  if (parsed.data.length === 0) return fail("Add at least one item");
  const supabase = await createSupabaseServerClient();
  const { data: template } = await supabase.from("checklist_templates").select("id, organization_id").eq("id", templateId).maybeSingle();
  if (!template || template.organization_id !== ctx.org.id) return fail("Checklist not found");
  const { data: existing } = await supabase.from("checklist_items").select("id").eq("template_id", templateId);
  const existingIds = new Set((existing ?? []).map((e) => e.id));
  const keep = new Set<string>();
  const ids: string[] = [];
  for (let i = 0; i < parsed.data.length; i++) {
    const it = parsed.data[i];
    if (it.id && existingIds.has(it.id)) {
      const { error } = await supabase.from("checklist_items").update({ label: it.label, requires_photo: it.requires_photo, sort_order: i + 1 }).eq("id", it.id);
      if (error) return fail(error.message);
      keep.add(it.id);
      ids.push(it.id);
    } else {
      const { data, error } = await supabase.from("checklist_items").insert({ organization_id: ctx.org.id, template_id: templateId, label: it.label, requires_photo: it.requires_photo, sort_order: i + 1 }).select("id").single();
      if (error) return fail(error.message);
      keep.add(data.id);
      ids.push(data.id);
    }
  }
  const remove = Array.from(existingIds).filter((id) => !keep.has(id));
  if (remove.length) {
    const { error } = await supabase.from("checklist_items").delete().in("id", remove);
    if (error) return fail(error.message);
  }
  revalidateStoreCheck();
  return ok({ ids });
}
