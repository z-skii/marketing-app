"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { CopyButton, InviteLink } from "@/components/team/copy-button";
import { RoleBadge } from "@/components/team/team-badges";
import { reissueInvitationAction, revokeInvitationAction } from "@/app/(app)/employees/actions";
import type { PendingInvitation } from "@/app/(app)/employees/data";

function expiresLabel(iso: string, expired: boolean): string {
  const d = new Date(iso);
  const days = Math.round((d.getTime() - Date.now()) / 86400000);
  if (expired) return "Expired";
  if (days <= 0) return "Expires today";
  return `Expires in ${days}d`;
}

export function InvitationsList({ invitations }: { invitations: PendingInvitation[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<PendingInvitation | null>(null);
  const [fresh, setFresh] = useState<Record<string, { url: string; emailed: boolean }>>({});

  const resend = (inv: PendingInvitation) => { setBusyId(inv.id); start(async () => {
    const r = await reissueInvitationAction(inv.id);
    setBusyId(null);
    if (!r.ok) { toast.push(r.error, "danger"); return; }
    setFresh((f) => ({ ...f, [inv.id]: r.data }));
    toast.push(r.data.emailed ? "Invitation email sent" : "New invitation link ready", "success");
    router.refresh();
  }); };
  const revoke = () => { if (!revoking) return; const inv = revoking; setBusyId(inv.id); start(async () => {
    const r = await revokeInvitationAction(inv.id);
    setBusyId(null); setRevoking(null);
    if (!r.ok) { toast.push(r.error, "danger"); return; }
    toast.push("Invitation revoked", "success");
    router.refresh();
  }); };

  if (invitations.length === 0) return <EmptyState title="No pending invitations" description="Employees with an email get an invitation link when you add them. Resend from their profile if it expires." />;

  return (
    <>
      <div className="card divide-y divide-border">
        {invitations.map((inv) => {
          const live = fresh[inv.id];
          return (
            <div key={inv.id} className="px-3.5 py-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium truncate">{inv.employee_name ? (inv.employee_id ? <Link className="hover:underline" href={`/employees/${inv.employee_id}`}>{inv.employee_name}</Link> : inv.employee_name) : inv.email}</span>
                    <RoleBadge role={inv.role} />
                    <Badge tone={inv.expired ? "danger" : "warn"}>{expiresLabel(inv.expires_at, inv.expired)}</Badge>
                  </div>
                  {inv.employee_name && <div className="text-[12.5px] text-text-3 truncate">{inv.email}</div>}
                </div>
                <div className="flex items-center gap-1.5">
                  <CopyButton text={live?.url ?? inv.url} label="Copy link" />
                  <Button size="sm" variant="secondary" onClick={() => resend(inv)} loading={pending && busyId === inv.id}>Resend</Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => setRevoking(inv)} disabled={pending && busyId === inv.id}>Revoke</Button>
                </div>
              </div>
              {live && <InviteLink url={live.url} emailed={live.emailed} />}
            </div>
          );
        })}
      </div>
      <ConfirmDialog open={!!revoking} onClose={() => setRevoking(null)} onConfirm={revoke} title="Revoke invitation?" confirmLabel="Revoke" tone="danger" loading={pending}>
        The link sent to <b>{revoking?.email}</b> will stop working. You can send a new one later.
      </ConfirmDialog>
    </>
  );
}
