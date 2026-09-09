"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Database } from "@/types/database";

// NOTE: a "use server" file may only export async functions. PAYMENT_METHODS and the other
// option lists live in src/lib/expenses/constants.ts — import them from there.
export type { PaymentMethod } from "@/lib/expenses/constants";

type Tables = Database["public"]["Tables"];

const PAYMENT_ENUM = z.enum(["cash", "credit_card", "debit_card", "check", "ach", "other"]);
const BUCKET_ENUM = z.enum(["goods", "labor", "utilities", "other"]);
const FREQUENCY_ENUM = z.enum(["weekly", "biweekly", "monthly", "yearly"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateExpenses() {
  revalidatePath("/expenses"); revalidatePath("/accounting"); revalidatePath("/dashboard");
}

// ================================================================ expenses

const expenseSchema = z.object({
  location_id: z.string().uuid("Pick a store"),
  business_date: z.string().regex(ISO_DATE, "Pick a date"),
  amount: z.coerce.number().positive("Enter an amount"),
  category_id: z.string().uuid("Pick a category"),
  payment_method: PAYMENT_ENUM.default("cash"),
  vendor: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  receipt_id: z.string().uuid().optional().nullable().or(z.literal("")),
  status: z.enum(["paid", "expected"]).default("paid"),
});

export type ExpenseInput = z.input<typeof expenseSchema>;

function readExpense(fd: FormData) {
  const g = (k: string) => { const v = fd.get(k); return v == null ? undefined : String(v); };
  return expenseSchema.safeParse({
    location_id: g("location_id"), business_date: g("business_date"), amount: g("amount"), category_id: g("category_id"),
    payment_method: g("payment_method") || "cash", vendor: g("vendor") ?? "", description: g("description") ?? "",
    receipt_id: g("receipt_id") || null, status: g("status") || "paid",
  });
}

export type ExpenseRow = Tables["expenses"]["Row"] & { category_name: string; bucket: string };

export async function createExpenseAction(_prev: ActionResult<ExpenseRow> | null, formData: FormData): Promise<ActionResult<ExpenseRow>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager || !ctx.can("can_add_expenses")) return fail("You do not have permission to add expenses");
  const parsed = readExpense(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (!ctx.locations.some((l) => l.id === d.location_id)) return fail("You cannot add expenses to that store");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("expenses").insert({
    organization_id: ctx.org.id, location_id: d.location_id, business_date: d.business_date, amount: d.amount, category_id: d.category_id,
    payment_method: d.payment_method, vendor: d.vendor || null, description: d.description || null, receipt_id: d.receipt_id || null,
    status: d.status, paid_at: d.status === "paid" ? new Date().toISOString() : null, created_by: ctx.user.id,
  }).select("*, expense_categories(name, bucket)").single();
  if (error) return fail(error.message);
  revalidateExpenses();
  const { expense_categories: cat, ...row } = data;
  return ok({ ...row, amount: Number(row.amount), category_name: (cat as { name: string } | null)?.name ?? "", bucket: (cat as { bucket: string } | null)?.bucket ?? "other" });
}

export async function updateExpenseAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  const id = String(formData.get("id") ?? "");
  const parsed = readExpense(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (!ctx.locations.some((l) => l.id === d.location_id)) return fail("You cannot move expenses to that store");
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (!before) return fail("Expense not found");
  const { error } = await supabase.from("expenses").update({
    location_id: d.location_id, business_date: d.business_date, amount: d.amount, category_id: d.category_id, payment_method: d.payment_method,
    vendor: d.vendor || null, description: d.description || null, receipt_id: d.receipt_id || null, status: d.status,
    paid_at: d.status === "paid" ? (before.paid_at ?? new Date().toISOString()) : null,
  }).eq("id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: d.location_id, p_action: "expense.edited", p_entity_type: "expense", p_entity_id: id, p_before: before, p_after: { amount: d.amount, category_id: d.category_id, status: d.status } }).then(() => {}, () => {});
  revalidateExpenses(); revalidatePath(`/expenses/${id}`);
  return ok(undefined);
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("expenses").select("*").eq("id", id).single();
  if (!before) return fail("Expense not found");
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: before.location_id, p_action: "expense.deleted", p_entity_type: "expense", p_entity_id: id, p_before: before }).then(() => {}, () => {});
  revalidateExpenses();
  return ok(undefined);
}

export async function markExpensePaidAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(error.message);
  revalidateExpenses(); revalidatePath(`/expenses/${id}`);
  return ok(undefined);
}

// ================================================================ receipts

/** Uploads a receipt through the user's own session (storage RLS applies) and records it. */
export async function registerReceiptAction(input: { storage_path: string; content_type: string; bytes: number; original_filename: string; location_id?: string | null }): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  if (!input.storage_path.startsWith(`${ctx.org.id}/`)) return fail("Invalid path");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("receipts").insert({
    organization_id: ctx.org.id, location_id: input.location_id ?? null, storage_path: input.storage_path, content_type: input.content_type,
    bytes: input.bytes, original_filename: input.original_filename, created_by: ctx.user.id,
  }).select("id").single();
  if (error) return fail(error.message);
  return ok({ id: data.id });
}

/** 10-minute signed URL for a receipt file, under the user's session (storage RLS lets managers read their org's files). */
export async function receiptSignedUrlAction(receiptId: string): Promise<ActionResult<{ url: string; content_type: string | null; original_filename: string | null }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  const supabase = await createSupabaseServerClient();
  const { data: receipt } = await supabase.from("receipts").select("storage_bucket, storage_path, content_type, original_filename").eq("id", receiptId).eq("organization_id", ctx.org.id).maybeSingle();
  if (!receipt) return fail("Receipt not found");
  const { data, error } = await supabase.storage.from(receipt.storage_bucket || "receipts").createSignedUrl(receipt.storage_path, 600);
  if (error || !data?.signedUrl) return fail(error?.message ?? "Could not sign the receipt URL");
  return ok({ url: data.signedUrl, content_type: receipt.content_type, original_filename: receipt.original_filename });
}

// ================================================================ recurring expenses (owner only)

const recurringSchema = z.object({
  location_id: z.string().uuid("Pick a store"),
  category_id: z.string().uuid("Pick a category"),
  amount: z.coerce.number().positive("Enter an amount"),
  vendor: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  payment_method: PAYMENT_ENUM.default("other"),
  frequency: FREQUENCY_ENUM.default("monthly"),
  day_of_month: z.coerce.number().int().min(1).max(31).optional().nullable(),
  next_due_date: z.string().regex(ISO_DATE, "Pick the first due date"),
  auto_mark_paid: z.boolean().default(false),
});

function readRecurring(fd: FormData) {
  const g = (k: string) => { const v = fd.get(k); return v == null ? undefined : String(v); };
  const frequency = g("frequency") || "monthly";
  const dom = g("day_of_month");
  return recurringSchema.safeParse({
    location_id: g("location_id"), category_id: g("category_id"), amount: g("amount"), vendor: g("vendor") ?? "", description: g("description") ?? "",
    payment_method: g("payment_method") || "other", frequency,
    day_of_month: frequency === "monthly" && dom ? dom : null,
    next_due_date: g("next_due_date"), auto_mark_paid: g("auto_mark_paid") === "on" || g("auto_mark_paid") === "true",
  });
}

export type RecurringExpenseRow = Tables["recurring_expenses"]["Row"] & { category_name: string; bucket: string; location_name: string };

export async function createRecurringExpenseAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage recurring expenses");
  const parsed = readRecurring(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (!ctx.locations.some((l) => l.id === d.location_id)) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("recurring_expenses").insert({
    organization_id: ctx.org.id, location_id: d.location_id, category_id: d.category_id, amount: d.amount, vendor: d.vendor || null,
    description: d.description || null, payment_method: d.payment_method, frequency: d.frequency, day_of_month: d.day_of_month ?? null,
    next_due_date: d.next_due_date, auto_mark_paid: d.auto_mark_paid, is_active: true, created_by: ctx.user.id,
  }).select("id").single();
  if (error) return fail(error.message);
  // Generate any rows already due so the expense list reflects the new schedule immediately.
  await supabase.rpc("materialize_recurring_expenses", { p_org: ctx.org.id, p_until: ctx.today }).then(() => {}, () => {});
  revalidateExpenses(); revalidatePath("/expenses/recurring");
  return ok({ id: data.id });
}

export async function updateRecurringExpenseAction(_prev: ActionResult<{ id: string }> | null, formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage recurring expenses");
  const id = String(formData.get("id") ?? "");
  if (!id) return fail("Missing id");
  const parsed = readRecurring(formData);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message);
  const d = parsed.data;
  if (!ctx.locations.some((l) => l.id === d.location_id)) return fail("Unknown store");
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("recurring_expenses").select("*").eq("id", id).eq("organization_id", ctx.org.id).maybeSingle();
  if (!before) return fail("Recurring expense not found");
  const { error } = await supabase.from("recurring_expenses").update({
    location_id: d.location_id, category_id: d.category_id, amount: d.amount, vendor: d.vendor || null, description: d.description || null,
    payment_method: d.payment_method, frequency: d.frequency, day_of_month: d.day_of_month ?? null, next_due_date: d.next_due_date, auto_mark_paid: d.auto_mark_paid,
  }).eq("id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: d.location_id, p_action: "recurring_expense.edited", p_entity_type: "recurring_expense", p_entity_id: id, p_before: before, p_after: { amount: d.amount, frequency: d.frequency, next_due_date: d.next_due_date } }).then(() => {}, () => {});
  await supabase.rpc("materialize_recurring_expenses", { p_org: ctx.org.id, p_until: ctx.today }).then(() => {}, () => {});
  revalidateExpenses(); revalidatePath("/expenses/recurring");
  return ok({ id });
}

export async function toggleRecurringExpenseAction(id: string, isActive: boolean): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage recurring expenses");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("recurring_expenses").update({ is_active: isActive }).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  if (isActive) await supabase.rpc("materialize_recurring_expenses", { p_org: ctx.org.id, p_until: ctx.today }).then(() => {}, () => {});
  revalidateExpenses(); revalidatePath("/expenses/recurring");
  return ok(undefined);
}

/** Deletes the schedule. Already-generated expenses stay (their recurring_expense_id is set to null by the FK). */
export async function deleteRecurringExpenseAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage recurring expenses");
  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase.from("recurring_expenses").select("*").eq("id", id).eq("organization_id", ctx.org.id).maybeSingle();
  if (!before) return fail("Recurring expense not found");
  const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
  if (error) return fail(error.message);
  await supabase.rpc("log_activity_public", { p_org: ctx.org.id, p_loc: before.location_id, p_action: "recurring_expense.deleted", p_entity_type: "recurring_expense", p_entity_id: id, p_before: before }).then(() => {}, () => {});
  revalidateExpenses(); revalidatePath("/expenses/recurring");
  return ok(undefined);
}

// ================================================================ categories (owner only)

export type CategoryRow = Tables["expense_categories"]["Row"];

const categoryNameSchema = z.string().trim().min(1, "Enter a category name").max(60, "Keep the name under 60 characters");

export async function createCategoryAction(_prev: ActionResult<CategoryRow> | null, formData: FormData): Promise<ActionResult<CategoryRow>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage categories");
  const name = categoryNameSchema.safeParse(formData.get("name"));
  if (!name.success) return fail(name.error.issues[0]?.message);
  const bucket = BUCKET_ENUM.safeParse(formData.get("bucket") || "other");
  if (!bucket.success) return fail("Pick a bucket");
  const supabase = await createSupabaseServerClient();
  const { data: last } = await supabase.from("expense_categories").select("sort_order").eq("organization_id", ctx.org.id).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await supabase.from("expense_categories").insert({
    organization_id: ctx.org.id, name: name.data, bucket: bucket.data, sort_order: (last?.sort_order ?? 0) + 1, is_active: true, created_by: ctx.user.id,
  }).select("*").single();
  if (error) return fail(error.code === "23505" ? "A category with that name already exists" : error.message);
  revalidateExpenses(); revalidatePath("/expenses/categories"); revalidatePath("/settings");
  return ok(data);
}

export async function updateCategoryAction(id: string, patch: { name?: string; bucket?: "goods" | "labor" | "utilities" | "other"; is_active?: boolean; sort_order?: number }): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage categories");
  const update: Tables["expense_categories"]["Update"] = {};
  if (patch.name !== undefined) {
    const name = categoryNameSchema.safeParse(patch.name);
    if (!name.success) return fail(name.error.issues[0]?.message);
    update.name = name.data;
  }
  if (patch.bucket !== undefined) {
    const bucket = BUCKET_ENUM.safeParse(patch.bucket);
    if (!bucket.success) return fail("Pick a bucket");
    update.bucket = bucket.data;
  }
  if (patch.is_active !== undefined) update.is_active = Boolean(patch.is_active);
  if (patch.sort_order !== undefined) {
    if (!Number.isInteger(patch.sort_order)) return fail("Invalid order");
    update.sort_order = patch.sort_order;
  }
  if (Object.keys(update).length === 0) return ok(undefined);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expense_categories").update(update).eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return fail(error.code === "23505" ? "A category with that name already exists" : error.message);
  revalidateExpenses(); revalidatePath("/expenses/categories"); revalidatePath("/settings");
  return ok(undefined);
}

/** Swaps sort_order with the neighbour above/below (in the org's current order). */
export async function moveCategoryAction(id: string, direction: "up" | "down"): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage categories");
  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase.from("expense_categories").select("id, sort_order").eq("organization_id", ctx.org.id).order("sort_order").order("name");
  if (error) return fail(error.message);
  const list = rows ?? [];
  const i = list.findIndex((r) => r.id === id);
  if (i < 0) return fail("Category not found");
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return ok(undefined);
  // Normalise to 1..n so swapping is always meaningful even when several rows share a sort_order.
  const ordered = list.map((r, idx) => ({ id: r.id, sort_order: idx + 1 }));
  [ordered[i].sort_order, ordered[j].sort_order] = [ordered[j].sort_order, ordered[i].sort_order];
  const changed = ordered.filter((r, idx) => r.sort_order !== list[idx].sort_order);
  for (const r of changed) {
    const { error: e } = await supabase.from("expense_categories").update({ sort_order: r.sort_order }).eq("id", r.id);
    if (e) return fail(e.message);
  }
  revalidateExpenses(); revalidatePath("/expenses/categories"); revalidatePath("/settings");
  return ok(undefined);
}

/** Deletes a category when nothing references it; otherwise deactivates it and says so. */
export async function deleteCategoryAction(id: string): Promise<ActionResult<{ deleted: boolean }>> {
  const ctx = await requireOrgContext();
  if (!ctx.isOwner) return fail("Only the owner can manage categories");
  const supabase = await createSupabaseServerClient();
  const [{ count: used }, { count: recurring }] = await Promise.all([
    supabase.from("expenses").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("recurring_expenses").select("id", { count: "exact", head: true }).eq("category_id", id),
  ]);
  if ((used ?? 0) > 0 || (recurring ?? 0) > 0) {
    const { error } = await supabase.from("expense_categories").update({ is_active: false }).eq("id", id).eq("organization_id", ctx.org.id);
    if (error) return fail(error.message);
    revalidateExpenses(); revalidatePath("/expenses/categories"); revalidatePath("/settings");
    return ok({ deleted: false });
  }
  const { error } = await supabase.from("expense_categories").delete().eq("id", id).eq("organization_id", ctx.org.id);
  if (error) return fail(error.message);
  revalidateExpenses(); revalidatePath("/expenses/categories"); revalidatePath("/settings");
  return ok({ deleted: true });
}
