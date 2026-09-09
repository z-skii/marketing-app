import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function PageHeader({ title, description, actions, className, back }: { title: React.ReactNode; description?: React.ReactNode; actions?: React.ReactNode; className?: string; back?: { href: string; label: string } }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3 mb-4", className)}>
      <div className="min-w-0">
        {back && <Link href={back.href} className="text-[12px] text-text-3 hover:text-text">← {back.label}</Link>}
        <h1 className="text-[20px] font-semibold leading-tight tracking-tight">{title}</h1>
        {description && <p className="text-[13px] text-text-3 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card border-dashed px-6 py-10 text-center", className)}>
      <div className="text-[14px] font-medium">{title}</div>
      {description && <p className="text-[13px] text-text-3 mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Tabs({ items, className }: { items: Array<{ href: string; label: string; active?: boolean; count?: number }>; className?: string }) {
  return (
    <div className={cn("flex gap-1 overflow-x-auto border-b border-border mb-4 -mx-1 px-1", className)}>
      {items.map((it) => (
        <Link key={it.href} href={it.href}
          className={cn("px-3 py-2 text-[13px] whitespace-nowrap border-b-2 -mb-px", it.active ? "border-accent text-text font-medium" : "border-transparent text-text-3 hover:text-text")}>
          {it.label}{it.count != null && <span className="ml-1.5 text-[11px] text-text-3">{it.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function Segmented({ items, className }: { items: Array<{ href: string; label: string; active?: boolean }>; className?: string }) {
  return (
    <div className={cn("inline-flex rounded-md border border-border bg-surface p-0.5 overflow-x-auto max-w-full", className)}>
      {items.map((it) => (
        <Link key={it.href} href={it.href} scroll={false}
          className={cn("px-2.5 py-1 text-[12.5px] rounded whitespace-nowrap", it.active ? "bg-accent text-white font-medium" : "text-text-2 hover:bg-surface-2")}>
          {it.label}
        </Link>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-border-strong border-t-accent", className)} />;
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-border my-4", className)} />;
}

export function TableWrap({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card overflow-x-auto scrollbar-thin", className)}>{children}</div>;
}
