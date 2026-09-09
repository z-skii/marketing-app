"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOrgContext } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/action-result";
import type { Database } from "@/types/database";

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" }, { value: "credit_card", label: "Credit card" }, { value: "debit_card", label: "Debit card" },
  { value: "check", label: "Check" }, { value: "ach", label: "ACH" }, { value: "other", label: "Other" },
];

const expenseSchema = z.object({
  location_id: z.string().uuid("Pick a store"),
  business_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  amount: z.coerce.number().positive("Enter an amount"),
  category_id: z.string().uuid("Pick a category"),
  payment_method: z.enum(["cash", "credit_card", "debit_card", "check", "ach", "other"]).default("cash"),
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

export type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"] & { category_name: string; bucket: string };

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
  revalidatePath("/expenses"); revalidatePath("/accounting"); revalidatePath("/dashboard");
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
  revalidatePath("/expenses"); revalidatePath("/accounting"); revalidatePath("/dashboard");
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
  revalidatePath("/expenses"); revalidatePath("/accounting"); revalidatePath("/dashboard");
  return ok(undefined);
}

export async function markExpensePaidAction(id: string): Promise<ActionResult> {
  const ctx = await requireOrgContext();
  if (!ctx.isManager) return fail("Not allowed");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("expenses").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/expenses"); revalidatePath("/accounting"); revalidatePath("/dashboard");
  return ok(undefined);
}

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
