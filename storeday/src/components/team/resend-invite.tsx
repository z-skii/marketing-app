"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { InviteLink } from "@/components/team/copy-button";
import { resendInvitationAction } from "@/app/(app)/employees/actions";

/** Owner: (re)send an invitation for an employee that has an email but no account. Always shows the link. */
export function ResendInvite({ employeeId, existingUrl, label }: { employeeId: string; existingUrl: string | null; label: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ url: string; emailed: boolean } | null>(null);
  const router = useRouter();
  const toast = useToast();
  const send = () => start(async () => {
    const r = await resendInvitationAction(employeeId);
    if (!r.ok) { toast.push(r.error, "danger"); return; }
    setResult(r.data); router.refresh();
  });
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={send} loading={pending}><Send className="h-3.5 w-3.5" />{label}</Button>
        {existingUrl && !result && <span className="text-[12px] text-text-3">A pending link already exists — shown below.</span>}
      </div>
      {result ? <InviteLink url={result.url} emailed={result.emailed} /> : existingUrl ? <InviteLink url={existingUrl} emailed={false} note="Pending invitation link — share it with them:" /> : null}
    </div>
  );
}
