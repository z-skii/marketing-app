import { cn } from "@/lib/utils/cn";

export function Card({ className, children, as: Tag = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "article" }) {
  return <Tag className={cn("card", className)}>{children}</Tag>;
}

export function CardHeader({ title, description, action, className }: { title: React.ReactNode; description?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-3.5 pb-2", className)}>
      <div className="min-w-0">
        <h3 className="text-[13px] font-semibold text-text leading-tight">{title}</h3>
        {description && <p className="text-[12.5px] text-text-3 mt-0.5">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-4 pb-4", className)}>{children}</div>;
}

/** Section header used inside forms: "SALES", "GOODS / INVENTORY". */
export function SectionLabel({ children, className, right }: { children: React.ReactNode; className?: string; right?: React.ReactNode }) {
  return (
    <div className={cn("flex items-center justify-between border-b border-border pb-1.5 mb-3", className)}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-text-3">{children}</h4>
      {right}
    </div>
  );
}
