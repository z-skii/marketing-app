"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/modal";
import { TableWrap } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { DEFAULT_MANAGER_PERMISSIONS, PERMISSION_LABELS, type PermissionKey } from "@/lib/permissions";
import { removeMemberAction, saveMemberPermissionsAction, setMemberRoleAction } from "@/app/(app)/settings/actions";

export interface MemberRow {
  id: string;
  user_id: string;
  role: "owner" | "manager" | "employee";
  status: "active" | "invited" | "inactive";
  permissions: Partial<Record<PermissionKey, boolean>>;
  name: string;
  email: string;
  employee_id: string | null;
  is_self: boolean;
  joined_at: string;
}

const KEYS = Object.keys(PERMISSION_LABELS) as PermissionKey[];

export function MembersTable({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [removing, setRemoving] = useState<MemberRow | null>(null);

  const toggle = (m: MemberRow, key: PermissionKey, value: boolean) => start(async () => {
    const r = await saveMemberPermissionsAction(m.id, { [key]: value });
    if (!r.ok) toast.push(r.error, "danger");
    router.refresh();
  });
  const setRole = (m: MemberRow, role: "manager" | "employee") => start(async () => {
    const r = await setMemberRoleAction(m.id, role);
    if (!r.ok) toast.push(r.error, "danger"); else toast.push(`${m.name || m.email} is now a ${role}`, "success");
    router.refresh();
  });
  const remove = () => {
    const m = removing; if (!m) return;
    start(async () => {
      const r = await removeMemberAction(m.id);
      if (!r.ok) toast.push(r.error, "danger"); else toast.push(`${m.name || m.email} removed`, "success");
      setRemoving(null);
      router.refresh();
    });
  };

  const roleTone = (r: MemberRow["role"]) => (r === "owner" ? "accent" : r === "manager" ? "success" : "neutral");
  const permValue = (m: MemberRow, k: PermissionKey) => (m.role === "owner" ? true : m.role === "manager" ? (m.permissions[k] ?? DEFAULT_MANAGER_PERMISSIONS[k]) : false);

  return (
    <>
      {/* Desktop */}
      <TableWrap className="hidden md:block">
        <table className="table">
          <thead>
            <tr>
              <th>Member</th><th>Role</th><th>Status</th>
              {KEYS.map((k) => <th key={k} className="text-center">{PERMISSION_LABELS[k]}</th>)}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="font-medium">{m.name || m.email}{m.is_self && <span className="text-text-3 font-normal"> (you)</span>}</div>
                  <div className="text-[12px] text-text-3">{m.email}{m.employee_id && <> · <Link href={`/employees/${m.employee_id}`} className="hover:underline">profile</Link></>}</div>
                </td>
                <td>
                  {m.role === "owner" ? <Badge tone="accent">Owner</Badge> : (
                    <select className="field w-auto py-1 text-[12.5px]" value={m.role} disabled={pending} onChange={(e) => setRole(m, e.target.value as "manager" | "employee")}>
                      <option value="manager">Manager</option>
                      <option value="employee">Employee</option>
                    </select>
                  )}
                </td>
                <td><Badge tone={m.status === "active" ? "success" : m.status === "invited" ? "warn" : "neutral"}>{m.status}</Badge></td>
                {KEYS.map((k) => (
                  <td key={k} className="text-center">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={permValue(m, k)} disabled={m.role !== "manager" || pending}
                      onChange={(e) => toggle(m, k, e.target.checked)} aria-label={`${PERMISSION_LABELS[k]} for ${m.name || m.email}`} />
                  </td>
                ))}
                <td className="text-right">
                  {!m.is_self && m.role !== "owner" && (
                    <button type="button" onClick={() => setRemoving(m)} className="p-1.5 rounded text-text-3 hover:text-danger hover:bg-danger-soft" title="Remove from business"><Trash2 className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {/* Mobile */}
      <div className="md:hidden space-y-2">
        {members.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.name || m.email}{m.is_self && <span className="text-text-3 font-normal"> (you)</span>}</div>
                <div className="text-[12px] text-text-3 truncate">{m.email}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge tone={roleTone(m.role)}>{m.role}</Badge>
                {!m.is_self && m.role !== "owner" && <button type="button" onClick={() => setRemoving(m)} className="p-1 rounded text-text-3 hover:text-danger" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
            {m.role !== "owner" && (
              <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                <span className="text-text-3">Role</span>
                <select className="field w-auto py-1 text-[12.5px]" value={m.role} disabled={pending} onChange={(e) => setRole(m, e.target.value as "manager" | "employee")}>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
            )}
            {m.role === "manager" && (
              <div className="mt-2 grid grid-cols-1 gap-1">
                {KEYS.map((k) => (
                  <label key={k} className={cn("flex items-center gap-2 text-[13px]", pending && "opacity-60")}>
                    <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={permValue(m, k)} disabled={pending} onChange={(e) => toggle(m, k, e.target.checked)} />
                    {PERMISSION_LABELS[k]}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!removing} onClose={() => setRemoving(null)} onConfirm={remove} title="Remove from business?" confirmLabel="Remove" tone="danger" loading={pending}>
        <b>{removing?.name || removing?.email}</b> will lose access to this business immediately. Their employee record, shifts and history are kept and their employee profile is marked inactive.
      </ConfirmDialog>
    </>
  );
}

export function InviteNote({ pending }: { pending: Array<{ id: string; email: string; role: string; expires_at: string; name: string | null }> }) {
  if (pending.length === 0) return <p className="text-[12.5px] text-text-3">No pending invitations. Invite people from <Link href="/employees" className="underline hover:text-text">Employees</Link>.</p>;
  return (
    <ul className="card divide-y divide-border">
      {pending.map((i) => (
        <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
          <span className="min-w-0 truncate">{i.name ? <><b>{i.name}</b> · </> : null}{i.email} <span className="text-text-3 capitalize">· {i.role}</span></span>
          <span className="text-[12px] text-text-3 shrink-0">expires {new Date(i.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </li>
      ))}
      <li className="px-3 py-2 text-[12.5px] text-text-3">Resend or revoke from <Link href="/employees" className="underline hover:text-text">Employees</Link>.</li>
    </ul>
  );
}

export function RoleLegend() {
  return (
    <div className="text-[12.5px] text-text-3 space-y-0.5">
      <div><Badge tone="accent">Owner</Badge> everything, including settings and billing.</div>
      <div><Badge tone="success">Manager</Badge> daily accounting for their stores; the checkboxes above limit what else they can do.</div>
      <div><Badge tone="neutral">Employee</Badge> clock in/out, own schedule and hours. Never sees accounting.</div>
    </div>
  );
}
