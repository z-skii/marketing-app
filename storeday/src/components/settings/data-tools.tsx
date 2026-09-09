"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Alert } from "@/components/ui/form";
import { deleteDemoOrganizationAction, loadDemoDataAction } from "@/app/(app)/settings/actions";

export function DataTools({ exportHref, isDemo, orgName }: { exportHref: string; isDemo: boolean; orgName: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<"load" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = () => start(async () => {
    const r = await loadDemoDataAction();
    setConfirm(null);
    if (!r.ok) { setError(r.error); return; }
    router.push("/dashboard?welcome=1");
    router.refresh();
  });
  const remove = () => start(async () => {
    const r = await deleteDemoOrganizationAction();
    setConfirm(null);
    if (!r.ok) { setError(r.error); return; }
    router.push("/dashboard");
    router.refresh();
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="card p-4 space-y-2">
        <div className="text-[13px] font-semibold flex items-center gap-1.5"><Download className="h-4 w-4 text-text-3" /> Export all accounting</div>
        <p className="text-[12.5px] text-text-3">Every store-day of this year as CSV (daily report, all stores). Other exports are on each report page.</p>
        <a href={exportHref} download className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-[12.5px] font-medium hover:bg-surface-2">Download CSV</a>
      </div>
      <div className="card p-4 space-y-2">
        <div className="text-[13px] font-semibold flex items-center gap-1.5"><Database className="h-4 w-4 text-text-3" /> Demo business</div>
        <p className="text-[12.5px] text-text-3">Creates a separate “Storeday Demo” business with 3 stores, 10 employees and 30 days of closed days, shifts and expenses, then switches you to it. Your real data is untouched.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirm("load")} loading={pending && confirm === "load"}>Create demo business</Button>
          {isDemo && <Button variant="danger" size="sm" onClick={() => setConfirm("delete")} loading={pending && confirm === "delete"}><Trash2 className="h-3.5 w-3.5" /> Delete this demo business</Button>}
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
      <ConfirmDialog open={confirm === "load"} onClose={() => setConfirm(null)} onConfirm={load} title="Create a demo business?" confirmLabel="Create demo" loading={pending}>
        A new business named “Storeday Demo” is added to your account and opened. Switch back to <b>{orgName}</b> any time with the selector in the sidebar; delete the demo from its Settings → Data tab.
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "delete"} onClose={() => setConfirm(null)} onConfirm={remove} title="Delete this demo business?" confirmLabel="Delete demo" tone="danger" loading={pending}>
        <b>{orgName}</b> and everything in it (stores, employees, shifts, accounting) will be permanently deleted. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
