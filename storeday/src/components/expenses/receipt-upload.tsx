"use client";
import { useCallback, useState } from "react";
import { Camera, Paperclip, X } from "lucide-react";
import { registerReceiptAction } from "@/app/(app)/expenses/actions";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ReceiptRef { id: string; name: string }

/**
 * Uploads a receipt straight from the browser to the private `receipts` bucket (storage RLS applies),
 * then records it in `receipts` through a server action. Shared by the quick and full expense forms.
 */
export function useReceiptUpload(organizationId: string, initial: ReceiptRef | null = null) {
  const [receipt, setReceipt] = useState<ReceiptRef | null>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (file: File | null, target: { locationId: string; date: string }) => {
    if (!file) return;
    if (!target.locationId) { setError("Pick a store first"); return; }
    setUploading(true); setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${organizationId}/${target.locationId}/${target.date}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("receipts").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) throw upErr;
      const r = await registerReceiptAction({ storage_path: path, content_type: file.type, bytes: file.size, original_filename: file.name, location_id: target.locationId });
      if (!r.ok) throw new Error(r.error);
      setReceipt({ id: r.data.id, name: file.name });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }, [organizationId]);

  const clear = useCallback(() => { setReceipt(null); setError(null); }, []);
  return { receipt, setReceipt, uploading, error, upload, clear };
}

/** "Take photo" / "Upload receipt" controls + the attached file name. */
export function ReceiptUploadControls({ receipt, uploading, error, onFile, onClear }: {
  receipt: ReceiptRef | null; uploading: boolean; error: string | null; onFile: (file: File | null) => void; onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
      <label className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 cursor-pointer hover:bg-surface-2">
        <Camera className="h-3.5 w-3.5" />{uploading ? "Uploading…" : "Take photo"}
        <input type="file" accept="image/*" capture="environment" className="hidden" disabled={uploading} onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </label>
      <label className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 cursor-pointer hover:bg-surface-2">
        <Paperclip className="h-3.5 w-3.5" />Upload receipt
        <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading} onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
      </label>
      {receipt && (
        <span className="inline-flex items-center gap-1 text-success min-w-0">
          <span className="truncate max-w-[180px]">✓ {receipt.name}</span>
          <button type="button" onClick={onClear} className="text-text-3 hover:text-danger rounded p-0.5" aria-label="Remove receipt"><X className="h-3.5 w-3.5" /></button>
        </span>
      )}
      {error && <span className="text-danger">{error}</span>}
    </div>
  );
}
