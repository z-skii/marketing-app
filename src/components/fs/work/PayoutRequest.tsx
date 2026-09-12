"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "@/app/(v2)/earnings/actions";
import { formatMoney } from "@/components/fs/parts";

/**
 * One primary action for the available balance. Enabled only at or above
 * the minimum; a native dialog repeats the amount and the timing before
 * the request is sent. The database decides the amount. Money never moves
 * on screen.
 */
export function PayoutRequest({ availableCents, minCents, feePct }: { availableCents: number; minCents: number; feePct: number }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const enabled = availableCents >= minCents && availableCents > 0;
  const remaining = Math.max(minCents - availableCents, 0);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const close = () => { setOpen(false); opener.current?.focus(); };

  return (
    <div>
      <button ref={opener} type="button" disabled={!enabled || pending} className="fs-btn fs-btn-primary" style={{ width: "100%" }} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {pending ? "Requesting" : "Request payout"}
      </button>
      <p className="fs-t-meta" style={{ marginTop: 8 }}>
        {enabled
          ? `TapMart sends payouts by hand, usually within a few days. The ${feePct}% fee is already deducted.`
          : availableCents > 0
            ? `Payouts start at ${formatMoney(minCents)}. ${formatMoney(remaining)} more needed.`
            : `Payouts start at ${formatMoney(minCents)}. Approved work adds to this balance.`}
      </p>
      {message && <p role="alert" className={message.ok ? "fs-status is-confirmed" : "fs-field-error"} style={{ marginTop: 8 }}>{message.text}</p>}
      <dialog ref={dialog} className="fs-dialog" aria-labelledby="fs-payout-title" onClose={close} onClick={(e) => { if (e.target === dialog.current) close(); }}>
        <p id="fs-payout-title" className="fs-t-section">Request payout</p>
        <p className="fs-money" style={{ marginTop: 12 }}>{formatMoney(availableCents)}</p>
        <p className="fs-t-body" style={{ marginTop: 8 }}>The whole available balance is requested. TapMart sends it by hand, usually within a few days.</p>
        <p className="fs-t-meta" style={{ marginTop: 4 }}>{feePct}% fee already deducted.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button
            type="button" disabled={pending} className="fs-btn fs-btn-primary" style={{ flex: 1 }}
            onClick={() => startTransition(async () => {
              const result = await requestPayout();
              setOpen(false);
              setMessage(result.ok ? { ok: true, text: result.detail ?? "Payout requested." } : { ok: false, text: result.error ?? "Payout failed." });
              if (result.ok) router.refresh();
            })}
          >
            {pending ? "Requesting" : "Confirm request"}
          </button>
          <button type="button" className="fs-btn fs-btn-secondary" style={{ flex: 1 }} onClick={close}>Cancel</button>
        </div>
      </dialog>
    </div>
  );
}
