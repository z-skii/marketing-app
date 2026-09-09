"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label({ className, children, hint, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: React.ReactNode }) {
  return (
    <label className={cn("block text-[12.5px] font-medium text-text-2 mb-1", className)} {...props}>
      {children}
      {hint && <span className="ml-1 font-normal text-text-3">{hint}</span>}
    </label>
  );
}

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn("field", className)} {...props} />;
});

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn("field min-h-[72px] resize-y", className)} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn("field appearance-none pr-8 bg-no-repeat bg-[right_0.5rem_center] bg-[length:14px_14px]", className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%238a93a1'%3E%3Cpath fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd'/%3E%3C/svg%3E\")" }}
      {...props}>
      {children}
    </select>
  );
});

export function Field({ label, hint, error, children, className }: { label?: React.ReactNode; hint?: React.ReactNode; error?: string | null; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      {label && <Label hint={hint}>{label}</Label>}
      {children}
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}

export function Checkbox({ label, description, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode; description?: React.ReactNode }) {
  return (
    <label className={cn("flex items-start gap-2.5 cursor-pointer select-none", className)}>
      <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-border-strong accent-[var(--accent)]" {...props} />
      <span className="text-[13.5px]">
        <span className="text-text">{label}</span>
        {description && <span className="block text-[12px] text-text-3">{description}</span>}
      </span>
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: React.ReactNode; description?: React.ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("flex items-center justify-between gap-4 py-2", disabled && "opacity-60")}>
      <span className="text-[13.5px]">
        <span className="text-text">{label}</span>
        {description && <span className="block text-[12px] text-text-3">{description}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-border-strong")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", checked ? "translate-x-4.5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-[13px] text-danger">{children}</p>;
}

export function Alert({ tone = "warn", title, children, className }: { tone?: "warn" | "danger" | "success" | "info"; title?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  const cls = {
    warn: "border-warn/30 bg-warn-soft text-warn",
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
    info: "border-accent/30 bg-accent-soft text-accent",
  }[tone];
  return (
    <div className={cn("rounded-md border px-3 py-2 text-[13px]", cls, className)}>
      {title && <div className="font-semibold">{title}</div>}
      {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
    </div>
  );
}
