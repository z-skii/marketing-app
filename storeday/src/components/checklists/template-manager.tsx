"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Camera, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorText, Field, Input, Select, Switch } from "@/components/ui/form";
import { ConfirmDialog, Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { createTemplateAction, deleteTemplateAction, updateTemplateAction, upsertTemplateItemsAction } from "@/app/(app)/store-check/actions";

export interface TemplateData {
  id: string;
  name: string;
  kind: "opening" | "closing" | "custom";
  location_id: string | null;
  is_active: boolean;
  items: Array<{ id: string; label: string; requires_photo: boolean }>;
}

type DraftItem = { key: string; id: string | null; label: string; requires_photo: boolean };
type Draft = { id: string | null; name: string; kind: TemplateData["kind"]; location_id: string | null; is_active: boolean; items: DraftItem[] };

const KIND_LABEL = { opening: "Opening", closing: "Closing", custom: "Custom" } as const;

function newKey() { return Math.random().toString(36).slice(2); }

function toDraft(t: TemplateData | null): Draft {
  if (!t) return { id: null, name: "", kind: "custom", location_id: null, is_active: true, items: [{ key: newKey(), id: null, label: "", requires_photo: false }] };
  return { id: t.id, name: t.name, kind: t.kind, location_id: t.location_id, is_active: t.is_active, items: t.items.map((i) => ({ key: newKey(), id: i.id, label: i.label, requires_photo: i.requires_photo })) };
}

/** Owner-only list + editor of checklist templates. */
export function TemplateManager({ templates, locations }: { templates: TemplateData[]; locations: Array<{ id: string; name: string }> }) {
  const [editing, setEditing] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<TemplateData | null>(null);
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const storeName = (id: string | null) => (id ? locations.find((l) => l.id === id)?.name ?? "Unknown store" : "All stores");

  const confirmDelete = () => {
    if (!deleting) return;
    start(async () => {
      const res = await deleteTemplateAction(deleting.id);
      if (!res.ok) { toast.push(res.error, "danger"); return; }
      toast.push(res.data.deactivated ? "Template deactivated (it has past submissions)" : "Template deleted", "success");
      setDeleting(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setEditing(toDraft(null))}><Plus className="h-3.5 w-3.5" />New template</Button>
      </div>
      {templates.length === 0 ? (
        <EmptyState title="No checklists yet" description="Create an opening or closing checklist and your team can run it every day." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Name</th><th>Kind</th><th>Store</th><th className="num">Items</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className={cn(!t.is_active && "opacity-60")}>
                  <td className="font-medium">
                    <button type="button" className="hover:underline text-left" onClick={() => setEditing(toDraft(t))}>{t.name}</button>
                  </td>
                  <td><Badge tone={t.kind === "opening" ? "success" : t.kind === "closing" ? "accent" : "neutral"}>{KIND_LABEL[t.kind]}</Badge></td>
                  <td className="text-text-2">{storeName(t.location_id)}</td>
                  <td className="num">{t.items.length}{t.items.some((i) => i.requires_photo) && <Camera className="inline h-3 w-3 ml-1 text-text-3" />}</td>
                  <td>{t.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(toDraft(t))}>Edit</Button>
                      <Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(t)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <TemplateEditor draft={editing} locations={locations} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); router.refresh(); }} />}
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete} title="Delete template?" confirmLabel="Delete" tone="danger" loading={pending}>
        {deleting?.name} will be removed. If it already has submissions it is deactivated instead, so history stays visible.
      </ConfirmDialog>
    </div>
  );
}

function TemplateEditor({ draft: initial, locations, onClose, onSaved }: { draft: Draft; locations: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();

  const setItem = (key: string, patch: Partial<DraftItem>) => setD((x) => ({ ...x, items: x.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));
  const move = (idx: number, dir: -1 | 1) => setD((x) => {
    const items = [...x.items];
    const j = idx + dir;
    if (j < 0 || j >= items.length) return x;
    [items[idx], items[j]] = [items[j], items[idx]];
    return { ...x, items };
  });
  const remove = (key: string) => setD((x) => ({ ...x, items: x.items.filter((i) => i.key !== key) }));
  const add = () => setD((x) => ({ ...x, items: [...x.items, { key: newKey(), id: null, label: "", requires_photo: false }] }));

  const save = () => start(async () => {
    setError(null);
    const items = d.items.map((i) => ({ id: i.id, label: i.label.trim(), requires_photo: i.requires_photo })).filter((i) => i.label);
    if (!d.name.trim()) { setError("Name is required"); return; }
    if (items.length === 0) { setError("Add at least one item"); return; }
    const meta = { name: d.name.trim(), kind: d.kind, location_id: d.location_id, is_active: d.is_active };
    if (d.id) {
      const r1 = await updateTemplateAction(d.id, meta);
      if (!r1.ok) { setError(r1.error); return; }
      const r2 = await upsertTemplateItemsAction(d.id, items);
      if (!r2.ok) { setError(r2.error); return; }
    } else {
      const r = await createTemplateAction(meta, items);
      if (!r.ok) { setError(r.error); return; }
    }
    toast.push("Template saved", "success");
    onSaved();
  });

  return (
    <Modal open onClose={onClose} title={d.id ? "Edit checklist" : "New checklist"} size="lg"
      footer={<>
        <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
        <Button onClick={save} loading={pending} type="button">Save</Button>
      </>}>
      <div className="space-y-3">
        <ErrorText>{error}</ErrorText>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Name" className="sm:col-span-1"><Input value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Opening" autoFocus /></Field>
          <Field label="Kind">
            <Select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as Draft["kind"] })}>
              <option value="opening">Opening</option><option value="closing">Closing</option><option value="custom">Custom</option>
            </Select>
          </Field>
          <Field label="Store">
            <Select value={d.location_id ?? ""} onChange={(e) => setD({ ...d, location_id: e.target.value || null })}>
              <option value="">All stores</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
        </div>
        {d.id && <Switch checked={d.is_active} onChange={(v) => setD({ ...d, is_active: v })} label="Active" description="Inactive checklists cannot be started." />}
        <div>
          <div className="text-[12.5px] font-medium text-text-2 mb-1">Items <span className="font-normal text-text-3">({d.items.length})</span></div>
          <div className="space-y-1.5">
            {d.items.map((it, idx) => (
              <div key={it.key} className="flex items-center gap-1.5 rounded-md border border-border px-2 py-1.5">
                <span className="w-5 text-[11px] text-text-3 tnum text-right">{idx + 1}.</span>
                <Input value={it.label} onChange={(e) => setItem(it.key, { label: e.target.value })} placeholder="Item label" className="py-1" />
                <button type="button" title="Requires a live photo" aria-pressed={it.requires_photo} onClick={() => setItem(it.key, { requires_photo: !it.requires_photo })}
                  className={cn("shrink-0 inline-flex items-center gap-1 rounded-md border px-2 h-7.5 text-[12px]", it.requires_photo ? "border-accent bg-accent-soft text-accent" : "border-border text-text-3 hover:text-text")}>
                  <Camera className="h-3.5 w-3.5" /><span className="hidden sm:inline">Photo</span>
                </button>
                <button type="button" className="shrink-0 rounded p-1 text-text-3 hover:text-text disabled:opacity-30" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className="shrink-0 rounded p-1 text-text-3 hover:text-text disabled:opacity-30" onClick={() => move(idx, 1)} disabled={idx === d.items.length - 1} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" className="shrink-0 rounded p-1 text-text-3 hover:text-danger" onClick={() => remove(it.key)} aria-label="Remove"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
          <Button size="sm" variant="secondary" className="mt-2" type="button" onClick={add}><Plus className="h-3.5 w-3.5" />Add item</Button>
        </div>
      </div>
    </Modal>
  );
}
