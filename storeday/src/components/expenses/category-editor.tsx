"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorText, Input, Select } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/modal";
import { TableWrap } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { BUCKETS, BUCKET_LABEL, BUCKET_TONE, type AccountingBucket } from "@/lib/expenses/constants";
import { createCategoryAction, deleteCategoryAction, moveCategoryAction, updateCategoryAction, type CategoryRow } from "@/app/(app)/expenses/actions";

export function CategoryEditor({ categories, isOwner }: { categories: CategoryRow[]; isOwner: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; bucket: AccountingBucket }>({ name: "", bucket: "other" });
  const [deleting, setDeleting] = useState<CategoryRow | null>(null);

  const run = (fn: () => Promise<{ ok: true; data: unknown } | { ok: false; error: string }>, okMessage?: (data: unknown) => string) => start(async () => {
    const r = await fn();
    if (r.ok) { if (okMessage) toast.push(okMessage(r.data), "success"); router.refresh(); } else toast.push(r.error, "danger");
  });

  const beginEdit = (c: CategoryRow) => { setEditingId(c.id); setDraft({ name: c.name, bucket: c.bucket }); };
  const saveEdit = (c: CategoryRow) => {
    const patch: { name?: string; bucket?: AccountingBucket } = {};
    if (draft.name.trim() !== c.name) patch.name = draft.name.trim();
    if (draft.bucket !== c.bucket) patch.bucket = draft.bucket;
    setEditingId(null);
    if (Object.keys(patch).length === 0) return;
    run(() => updateCategoryAction(c.id, patch), () => "Category updated");
  };
  const confirmDelete = () => {
    if (!deleting) return;
    const c = deleting; setDeleting(null);
    run(() => deleteCategoryAction(c.id), (d) => (d as { deleted: boolean }).deleted ? `"${c.name}" deleted` : `"${c.name}" is used by existing expenses, so it was deactivated instead`);
  };

  const bucketBadge = (b: string) => <Badge tone={BUCKET_TONE[b as AccountingBucket] ?? "neutral"}>{BUCKET_LABEL[b as AccountingBucket] ?? b}</Badge>;

  return (
    <>
      {isOwner && <InlineAdd />}
      <TableWrap>
        <table className="table">
          <thead>
            <tr>{isOwner && <th className="w-16">Order</th>}<th>Name</th><th>Bucket</th><th>Status</th>{isOwner && <th className="text-right">Actions</th>}</tr>
          </thead>
          <tbody>
            {categories.map((c, i) => {
              const editing = editingId === c.id;
              return (
                <tr key={c.id} className={cn(!c.is_active && "text-text-3")}>
                  {isOwner && (
                    <td>
                      <div className="flex items-center gap-0.5">
                        <button type="button" disabled={pending || i === 0} onClick={() => run(() => moveCategoryAction(c.id, "up"))} className="rounded p-0.5 text-text-3 hover:text-text hover:bg-surface-2 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" disabled={pending || i === categories.length - 1} onClick={() => run(() => moveCategoryAction(c.id, "down"))} className="rounded p-0.5 text-text-3 hover:text-text hover:bg-surface-2 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  )}
                  <td className="min-w-[180px]">
                    {editing ? (
                      <Input value={draft.name} autoFocus maxLength={60} className="py-1" onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(c); } if (e.key === "Escape") setEditingId(null); }} />
                    ) : (
                      <span className={cn("font-medium", c.is_active && "text-text")}>{c.name}{c.is_default && <span className="ml-1.5 text-[11px] font-normal text-text-3">default</span>}</span>
                    )}
                  </td>
                  <td>
                    {editing ? (
                      <Select value={draft.bucket} className="py-1 w-auto" onChange={(e) => setDraft({ ...draft, bucket: e.target.value as AccountingBucket })}>
                        {BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </Select>
                    ) : bucketBadge(c.bucket)}
                  </td>
                  <td><Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</Badge></td>
                  {isOwner && (
                    <td>
                      <div className="flex items-center justify-end gap-0.5">
                        {editing ? (
                          <>
                            <button type="button" onClick={() => saveEdit(c)} className="rounded p-1 text-success hover:bg-success-soft" title="Save"><Check className="h-3.5 w-3.5" /></button>
                            <button type="button" onClick={() => setEditingId(null)} className="rounded p-1 text-text-3 hover:text-text hover:bg-surface-2" title="Cancel"><X className="h-3.5 w-3.5" /></button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => beginEdit(c)} className="rounded p-1 text-text-3 hover:text-text hover:bg-surface-2" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                            <button type="button" disabled={pending} onClick={() => run(() => updateCategoryAction(c.id, { is_active: !c.is_active }), () => c.is_active ? "Category deactivated" : "Category reactivated")}
                              className="rounded px-1.5 py-0.5 text-[12px] text-text-2 hover:bg-surface-2 disabled:opacity-50">{c.is_active ? "Deactivate" : "Activate"}</button>
                            <button type="button" disabled={pending} onClick={() => setDeleting(c)} className="rounded p-1 text-text-3 hover:text-danger hover:bg-danger-soft" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {categories.length === 0 && <tr><td colSpan={isOwner ? 5 : 3} className="text-center text-text-3 py-6">No categories yet.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Delete category?" confirmLabel="Delete" tone="danger" loading={pending}>
        {deleting && <>Delete <strong>{deleting.name}</strong>? If any expense or recurring schedule uses it, it is deactivated instead so history stays intact.</>}
      </ConfirmDialog>
    </>
  );
}

function InlineAdd() {
  const [state, action, pending] = useActionState(createCategoryAction, null);
  const router = useRouter();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (state?.ok && handled.current !== state.data) {
      handled.current = state.data;
      toast.push(`"${state.data.name}" added`, "success");
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router, toast]);
  return (
    <form ref={formRef} action={action} className="card px-3 py-2.5 mb-3 flex flex-wrap items-end gap-2">
      <div className="min-w-[180px] flex-1">
        <label className="block text-[12px] font-medium text-text-2 mb-1">New category</label>
        <Input name="name" placeholder="e.g. Lottery payouts" required maxLength={60} className="py-1" />
      </div>
      <div>
        <label className="block text-[12px] font-medium text-text-2 mb-1">Bucket</label>
        <Select name="bucket" defaultValue="other" className="py-1 w-auto">{BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}</Select>
      </div>
      <Button type="submit" size="sm" loading={pending}><Plus className="h-3.5 w-3.5" />Add</Button>
      {state && !state.ok && <div className="basis-full"><ErrorText>{state.error}</ErrorText></div>}
    </form>
  );
}
