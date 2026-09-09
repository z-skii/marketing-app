"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Dialog on desktop, bottom sheet on mobile. Closes on Escape and backdrop click.
 */
export function Modal({ open, onClose, title, children, footer, size = "md", className }: {
  open: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode;
  size?: "sm" | "md" | "lg"; className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!mounted || !open) return null;
  const width = size === "sm" ? "sm:max-w-sm" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-md";
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn("relative w-full bg-surface border border-border shadow-xl fade-in flex flex-col max-h-[92vh]", "rounded-t-xl sm:rounded-lg", width, className)}>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-[15px] font-semibold">{title}</h2>
            <button onClick={onClose} className="text-text-3 hover:text-text rounded p-1" aria-label="Close"><X className="h-4 w-4" /></button>
          </div>
        )}
        <div className="px-4 py-3 overflow-y-auto">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2 safe-bottom">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, children, confirmLabel = "Confirm", tone = "primary", loading }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: React.ReactNode; children?: React.ReactNode; confirmLabel?: string; tone?: "primary" | "danger"; loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm"
      footer={<>
        <button className="h-8.5 px-3 rounded-md border border-border text-[13.5px] hover:bg-surface-2" onClick={onClose}>Cancel</button>
        <button className={cn("h-8.5 px-3 rounded-md text-[13.5px] font-medium text-white", tone === "danger" ? "bg-danger" : "bg-accent")} onClick={onConfirm} disabled={loading}>{loading ? "…" : confirmLabel}</button>
      </>}>
      <div className="text-[13.5px] text-text-2">{children}</div>
    </Modal>
  );
}
