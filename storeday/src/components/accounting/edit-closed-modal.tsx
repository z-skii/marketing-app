"use client";
import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Textarea } from "@/components/ui/form";
import { MoneyInput } from "@/components/ui/money-input";
import { formatMoney } from "@/lib/utils/currency";
import type { DailyInputs } from "@/lib/calc/accounting";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils/cn";
import { MONEY_FIELDS, MONEY_FIELD_LABELS, type DraftPatch, type MoneyField } from "./types";

/**
 * Edit a CLOSED day: every field shows original vs new, a reason is mandatory.
 * Pass `fields` to restrict to a subset (Month View inline edit) and `initialDraft` to prefill.
 */
export interface EditClosedModalProps {
  open: boolean; onClose: () => void; original: DailyInputs; initialDraft?: DraftPatch; fields?: MoneyField[]; currency: string;
  onSubmit: (patch: DraftPatch, reason: string) => Promise<ActionResult<unknown>>; onSaved?: (patch: DraftPatch) => void; title?: string;
}

/** Mounted only while open, so every opening starts from a fresh draft/reason. */
export function EditClosedModal(props: EditClosedModalProps) {
  if (!props.open) return null;
  return <EditClosedModalBody {...props} />;
}

function EditClosedModalBody({ open, onClose, original, initialDraft, fields, currency, onSubmit, onSaved, title }: EditClosedModalProps) {
  const [draft, setDraft] = React.useState<DailyInputs>(() => ({ ...original, ...(initialDraft ? Object.fromEntries(Object.entries(initialDraft).filter(([k]) => k !== "notes")) : {}) } as DailyInputs));
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);
  const list = fields ?? MONEY_FIELDS;

  const patch: DraftPatch = {};
  for (const k of list) if (draft[k] !== original[k]) patch[k] = draft[k];
  const changed = Object.keys(patch).length > 0;

  const submit = async () => {
    if (!changed) { setError("Nothing changed"); return; }
    if (!reason.trim()) { setError("A reason is required to edit a closed day"); return; }
    setPending(true); setError(null);
    const r = await onSubmit(patch, reason.trim());
    setPending(false);
    if (!r.ok) { setError(r.error); return; }
    onSaved?.(patch);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title ?? "Edit closed day"}
      footer={<>
        <Button variant="secondary" type="button" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button type="button" onClick={submit} loading={pending} disabled={!changed || !reason.trim()}>Save changes</Button>
      </>}>
      <ErrorText>{error}</ErrorText>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 gap-y-1 text-[13px]">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3">Field</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 text-right">Original</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-text-3 text-right">New</div>
        {list.map((k) => (
          <React.Fragment key={k}>
            <label htmlFor={`ec-${k}`} className="text-text-2">{MONEY_FIELD_LABELS[k]}</label>
            <div className={cn("tnum text-right text-text-3", draft[k] !== original[k] && "line-through")}>{original[k] == null ? "—" : formatMoney(original[k], { currency })}</div>
            <MoneyInput id={`ec-${k}`} value={draft[k]} onValueChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} currency={currency}
              className={cn("w-32", draft[k] !== original[k] && "border-accent")} autoFocus={initialDraft ? k in initialDraft : k === list[0]} />
          </React.Fragment>
        ))}
      </div>
      <Field label="Reason for the change" className="mt-3">
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Card batch total corrected from the processor report" rows={2} required />
      </Field>
    </Modal>
  );
}
