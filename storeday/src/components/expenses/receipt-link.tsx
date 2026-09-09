"use client";
import { useState, useTransition } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useToast } from "@/components/ui/toast";
import { receiptSignedUrlAction } from "@/app/(app)/expenses/actions";

/**
 * Opens a receipt in a new tab through a short-lived signed URL fetched on click.
 * The tab is opened synchronously (so popup blockers allow it) and navigated once the URL arrives.
 */
export function ReceiptLink({ receiptId, contentType, label, className }: { receiptId: string; contentType?: string | null; label?: string; className?: string }) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const toast = useToast();
  const isPdf = (contentType ?? "").includes("pdf");
  const Icon = isPdf ? FileText : ImageIcon;

  const open = () => {
    const win = window.open("", "_blank", "noopener");
    start(async () => {
      const r = await receiptSignedUrlAction(receiptId);
      if (!r.ok) { win?.close(); setFailed(true); toast.push(r.error, "danger"); return; }
      if (win) win.location.href = r.data.url; else window.open(r.data.url, "_blank", "noopener");
    });
  };

  return (
    <button type="button" onClick={open} disabled={pending} title={label ?? (isPdf ? "Open receipt (PDF)" : "Open receipt")}
      className={cn("inline-flex items-center gap-1 rounded px-1 py-0.5 text-[12.5px] text-accent hover:bg-accent-soft disabled:opacity-50", failed && "text-danger", className)}>
      <Icon className="h-3.5 w-3.5" />{label}
    </button>
  );
}
