"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Database, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Alert } from "@/components/ui/form";
import { loadDemoDataAction } from "@/app/(app)/settings/actions";

export function DataTools({ exportHref, isDemo }: { exportHref: string; isDemo: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const run = () => start(async () => {
    const r = await loadDemoDataAction();
    setResult(r.ok ? { ok: true, message: r.data.message } : { ok: false, message: r.error });
    setConfirm(false);
    if (r.ok) router.refresh();
  });
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="card p-4 space-y-2">
        <div className="text-[13px] font-semibold flex items-center gap-1.5"><Download className="h-4 w-4 text-text-3" /> Export all accounting</div>
        <p className="text-[12.5px] text-text-3">Every store-day of this year as CSV (daily report, all stores). Other exports are on each report page.</p>
        <a href={exportHref} download className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-surface text-[12.5px] font-medium hover:bg-surface-2">Download CSV</a>
      </div>
      <div className="card p-4 space-y-2">
        <div className="text-[13px] font-semibold flex items-center gap-1.5"><Database className="h-4 w-4 text-text-3" /> Demo data</div>
        <p className="text-[12.5px] text-text-3">Adds sample stores, employees, shifts, expenses and closed days to this business so you can explore reports. {isDemo && "This business is already marked as demo."}</p>
        <Button variant="secondary" size="sm" onClick={() => setConfirm(true)} loading={pending}>Load demo data</Button>
        {result && <Alert tone={result.ok ? "success" : "danger"}>{result.message}</Alert>}
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={run} title="Load demo data?" confirmLabel="Load demo data" loading={pending}>
        Sample records are added to <b>this</b> business and mixed with anything already here. Best used on a fresh business. This cannot be undone from the app.
      </ConfirmDialog>
    </div>
  );
}
