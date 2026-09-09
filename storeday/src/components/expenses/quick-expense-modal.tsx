"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { Camera, Paperclip } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import { createExpenseAction, registerReceiptAction, PAYMENT_METHODS, type ExpenseRow } from "@/app/(app)/expenses/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface CategoryOption { id: string; name: string; bucket: string }

/**
 * "+ Add Detailed Expense" — a bottom sheet / dialog that never leaves the current page.
 * Amount · Category · Payment · Vendor · Receipt · Note → ADD
 */
export function QuickExpenseModal({ open, onClose, organizationId, locationId, date, categories, onAdded, locations }: {
  open: boolean; onClose: () => void; organizationId: string; locationId: string; date: string; categories: CategoryOption[];
  onAdded: (expense: ExpenseRow) => void; locations?: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState(createExpenseAction, null);
  const [amount, setAmount] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<ExpenseRow | null>(null);

  useEffect(() => {
    if (state?.ok && handled.current !== state.data) {
      handled.current = state.data;
      onAdded(state.data);
      setAmount(null); setReceipt(null); formRef.current?.reset();
      onClose();
    }
  }, [state, onAdded, onClose]);

  const upload = async (file: File | null) => {
    if (!file) return;
    setUploading(true); setUploadError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${organizationId}/${locationId}/${date}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (error) throw error;
      const r = await registerReceiptAction({ storage_path: path, content_type: file.type, bytes: file.size, original_filename: file.name, location_id: locationId });
      if (!r.ok) throw new Error(r.error);
      setReceipt({ id: r.data.id, name: file.name });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add detailed expense"
      footer={<><Button variant="secondary" onClick={onClose} type="button">Cancel</Button><Button type="submit" form="quick-expense-form" loading={pending} disabled={!amount}>Add</Button></>}>
      <form id="quick-expense-form" ref={formRef} action={action} className="space-y-3">
        <ErrorText>{state && !state.ok ? state.error : null}</ErrorText>
        <input type="hidden" name="business_date" value={date} />
        <input type="hidden" name="amount" value={amount ?? ""} />
        {receipt && <input type="hidden" name="receipt_id" value={receipt.id} />}
        {locations && locations.length > 1 ? (
          <Field label="Store"><Select name="location_id" defaultValue={locationId}>{locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
        ) : <input type="hidden" name="location_id" value={locationId} />}
        <Field label="Amount"><MoneyInput value={amount} onValueChange={setAmount} size="lg" autoFocus onEnter={() => document.querySelector<HTMLSelectElement>("#qe-category")?.focus()} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category"><Select id="qe-category" name="category_id" required defaultValue={categories[0]?.id}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
          <Field label="Payment"><Select name="payment_method" defaultValue="cash">{PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
        </div>
        <Field label="Vendor"><Input name="vendor" placeholder="e.g. Coca-Cola" /></Field>
        <Field label="Note"><Input name="description" placeholder="Optional" /></Field>
        <div className="flex items-center gap-2 text-[12.5px]">
          <label className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 cursor-pointer hover:bg-surface-2">
            <Camera className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Take photo"}
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
          </label>
          <label className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 cursor-pointer hover:bg-surface-2">
            <Paperclip className="h-3.5 w-3.5" />Upload receipt
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0] ?? null)} />
          </label>
          {receipt && <span className="text-success truncate">✓ {receipt.name}</span>}
          {uploadError && <span className="text-danger">{uploadError}</span>}
        </div>
      </form>
    </Modal>
  );
}
