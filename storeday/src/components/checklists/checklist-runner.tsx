"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Camera, Check, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/time";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ErrorText } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { CameraCapture } from "./camera-capture";
import { completeChecklistAction, toggleChecklistItemAction } from "@/app/(app)/store-check/actions";

export interface RunnerItem {
  id: string;
  label: string;
  requires_photo: boolean;
  checked: boolean;
  checked_at: string | null;
  photo_path: string | null;
  photo_url: string | null; // signed (server-side) when a photo exists
}
export interface RunnerProps {
  submission: { id: string; status: "in_progress" | "completed"; business_date: string; completed_at: string | null; submitted_by_name: string | null; started_at: string };
  template: { name: string; kind: "opening" | "closing" | "custom" };
  location: { id: string; name: string; timezone: string };
  organizationId: string;
  items: RunnerItem[];
}

export function ChecklistRunner({ submission, template, location, organizationId, items: initial }: RunnerProps) {
  const router = useRouter();
  const toast = useToast();
  const [items, setItems] = useState<RunnerItem[]>(initial);
  // Server re-renders (after each saved toggle / refresh) are the source of truth: adopt new props during render.
  const [seen, setSeen] = useState(initial);
  if (seen !== initial) { setSeen(initial); setItems(initial); }
  const [busy, setBusy] = useState<string | null>(null);
  const [camera, setCamera] = useState<RunnerItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completing, startComplete] = useTransition();
  const readOnly = submission.status === "completed";

  const done = useMemo(() => items.filter((i) => i.checked && (!i.requires_photo || i.photo_path)).length, [items]);
  const allDone = items.length > 0 && done === items.length;

  const patch = (id: string, p: Partial<RunnerItem>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const toggle = async (it: RunnerItem) => {
    if (readOnly || busy) return;
    if (!it.checked && it.requires_photo) { setCamera(it); return; }
    setError(null); setBusy(it.id);
    const next = !it.checked;
    patch(it.id, { checked: next, checked_at: next ? new Date().toISOString() : null, ...(next ? {} : { photo_path: null, photo_url: null }) });
    const res = await toggleChecklistItemAction(submission.id, it.id, next, next ? it.photo_path : null);
    if (!res.ok) { patch(it.id, { checked: it.checked, checked_at: it.checked_at, photo_path: it.photo_path, photo_url: it.photo_url }); setError(res.error); }
    setBusy(null);
  };

  const capture = async (blob: Blob) => {
    if (!camera) return;
    const it = camera;
    setUploading(true); setError(null);
    try {
      const path = `${organizationId}/${location.id}/${submission.business_date}/${submission.id}/${it.id}.jpg`;
      const { error: upErr } = await getSupabaseBrowserClient().storage.from("checklist-photos").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (upErr) throw new Error(upErr.message);
      const res = await toggleChecklistItemAction(submission.id, it.id, true, path);
      if (!res.ok) throw new Error(res.error);
      patch(it.id, { checked: true, checked_at: new Date().toISOString(), photo_path: path, photo_url: URL.createObjectURL(blob) });
      setCamera(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      toast.push(e instanceof Error ? e.message : "Upload failed", "danger");
    } finally {
      setUploading(false);
    }
  };

  const complete = () => startComplete(async () => {
    setError(null);
    const res = await completeChecklistAction(submission.id);
    if (!res.ok) { setError(res.error); return; }
    toast.push(`${template.name} completed`, "success");
    router.refresh();
  });

  return (
    <div className="space-y-4">
      <div className="card px-4 py-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] text-text-3">{location.name} · {submission.business_date}</div>
          <div className="text-[18px] font-semibold leading-tight truncate">{template.name}</div>
        </div>
        <div className="text-right shrink-0">
          {readOnly ? (
            <Badge tone="success">Completed ✓</Badge>
          ) : (
            <div className="tnum text-[22px] font-semibold leading-none">{done} <span className="text-text-3 text-[14px] font-normal">/ {items.length}</span></div>
          )}
          {readOnly && (
            <div className="text-[12px] text-text-2 mt-1 tnum">{formatTime(submission.completed_at, location.timezone)}{submission.submitted_by_name ? ` · ${submission.submitted_by_name}` : ""}</div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-success transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} /></div>
      )}

      <ErrorText>{error}</ErrorText>

      <div className="space-y-2">
        {items.map((it) => {
          const complete = it.checked && (!it.requires_photo || !!it.photo_path);
          return (
            <div key={it.id} className={cn("card flex items-stretch overflow-hidden", complete && "border-success/40")}>
              <button type="button" onClick={() => toggle(it)} disabled={readOnly || busy === it.id}
                className={cn("flex flex-1 items-center gap-4 px-4 py-4 text-left min-h-[64px] select-none", !readOnly && "active:bg-surface-2", readOnly && "cursor-default")}
                aria-pressed={complete}>
                <span className={cn("h-8 w-8 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors", complete ? "bg-success border-success text-white" : "border-border-strong bg-surface")}>
                  {busy === it.id ? <Loader2 className="h-4 w-4 animate-spin text-text-3" /> : complete ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[16px] font-medium leading-snug", complete && "text-text-2")}>{it.label}</span>
                  <span className="block text-[12px] text-text-3 mt-0.5">
                    {it.requires_photo && <span className="inline-flex items-center gap-1 mr-2"><Camera className="h-3 w-3" />Live photo required</span>}
                    {complete && it.checked_at && <span className="tnum">{formatTime(it.checked_at, location.timezone)}</span>}
                  </span>
                </span>
              </button>
              {it.requires_photo && (
                <div className="shrink-0 flex items-center pr-3">
                  {it.photo_url ? (
                    <a href={it.photo_url} target="_blank" rel="noreferrer" className="block h-14 w-14 rounded-md overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                      {/* Signed, short-lived storage URL: next/image cannot optimize it. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.photo_url} alt={it.label} className="h-full w-full object-cover" />
                    </a>
                  ) : it.photo_path && !readOnly ? (
                    <span className="h-14 w-14 rounded-md bg-surface-2 border border-border flex items-center justify-center text-text-3"><Camera className="h-5 w-5" /></span>
                  ) : !readOnly ? (
                    <button type="button" onClick={() => setCamera(it)} className="h-14 w-14 rounded-md border border-dashed border-border-strong flex items-center justify-center text-text-3 hover:text-text hover:border-text-3" aria-label={`Take photo for ${it.label}`}>
                      <Camera className="h-6 w-6" />
                    </button>
                  ) : (
                    <span className="text-[12px] text-text-3">No photo</span>
                  )}
                  {it.photo_url && !readOnly && (
                    <button type="button" onClick={() => setCamera(it)} className="ml-2 text-[12px] text-text-3 hover:text-text underline">Retake</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div className="card px-4 py-6 text-center text-[13.5px] text-text-3">This checklist has no items. Ask the owner to add some.</div>}
      </div>

      {!readOnly && (
        <div className="sticky bottom-16 sm:bottom-2 pt-2">
          <Button size="xl" block variant="success" onClick={complete} disabled={!allDone} loading={completing}>
            <CheckCircle2 className="h-5 w-5" />COMPLETE CHECKLIST
          </Button>
          {!allDone && <p className="text-center text-[12px] text-text-3 mt-2">Check every item{items.some((i) => i.requires_photo) ? " and take the required photos" : ""} to finish.</p>}
        </div>
      )}

      {camera && <CameraCapture title={camera.label} onCapture={capture} onClose={() => !uploading && setCamera(null)} uploading={uploading} />}
    </div>
  );
}
