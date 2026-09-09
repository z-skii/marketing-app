import { Badge } from "@/components/ui/badge";
import type { AccountState } from "@/app/(app)/employees/data";

export function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return <Badge tone="accent">Owner</Badge>;
  if (role === "manager") return <Badge tone="accent">Manager</Badge>;
  return <Badge tone="neutral">Employee</Badge>;
}

export function AccountBadge({ state }: { state: AccountState }) {
  switch (state) {
    case "joined": return <Badge tone="success">Joined</Badge>;
    case "invited": return <Badge tone="warn">Invited · pending</Badge>;
    case "not_invited": return <Badge tone="neutral">Not invited</Badge>;
    default: return <Badge tone="neutral">No email</Badge>;
  }
}

export function WorkingDot({ label = "Working now" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] text-success font-medium whitespace-nowrap">
      <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" /><span className="relative inline-flex h-2 w-2 rounded-full bg-success" /></span>
      {label}
    </span>
  );
}
