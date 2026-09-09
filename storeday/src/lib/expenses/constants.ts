import type { Database } from "@/types/database";

export type PaymentMethod = Database["public"]["Enums"]["payment_method"];
export type AccountingBucket = Database["public"]["Enums"]["accounting_bucket"];
export type RecurrenceFrequency = Database["public"]["Enums"]["recurrence_frequency"];
export type ExpenseStatus = Database["public"]["Enums"]["expense_status"];

/** Shared by the expense forms and the accounting pages. Not a server action file: plain constants are fine here. */
export const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Cash" }, { value: "credit_card", label: "Credit card" }, { value: "debit_card", label: "Debit card" },
  { value: "check", label: "Check" }, { value: "ach", label: "ACH" }, { value: "other", label: "Other" },
];

export const FREQUENCIES: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: "weekly", label: "Weekly" }, { value: "biweekly", label: "Every 2 weeks" }, { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" },
];

/** What each bucket does to the accounting. Mirrors computeDailyTotals() and the daily_accounting view. */
export const BUCKETS: Array<{ value: AccountingBucket; label: string; description: string }> = [
  { value: "goods", label: "Goods", description: "Added to Goods / inventory cost, next to the cash and check goods typed at close." },
  { value: "labor", label: "Labor", description: "Added to Labor cost on top of what verified shifts already produce." },
  { value: "utilities", label: "Utilities", description: "Added to the Utilities line of the day." },
  { value: "other", label: "Other", description: "Added to Other expenses. Rent, insurance, marketing, fees…" },
];

export const BUCKET_LABEL: Record<AccountingBucket, string> = { goods: "Goods", labor: "Labor", utilities: "Utilities", other: "Other" };
export const BUCKET_TONE: Record<AccountingBucket, "accent" | "warn" | "success" | "neutral"> = { goods: "accent", labor: "warn", utilities: "success", other: "neutral" };

export function paymentLabel(v: string | null | undefined): string {
  return PAYMENT_METHODS.find((p) => p.value === v)?.label ?? (v ?? "—");
}

export function frequencyLabel(v: string | null | undefined): string {
  return FREQUENCIES.find((f) => f.value === v)?.label ?? (v ?? "—");
}
