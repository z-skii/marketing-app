"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCredit } from "@/lib/money";
import { requestPayout } from "@/app/(v2)/earnings/actions";

/**
 * One full width primary button. Enabled only when the available balance
 * reaches the minimum; tapping it opens a confirmation sheet that repeats
 * the amount, the timing and the fee note before the request is sent.
 */
export function PayoutButton({ availableCents, minCents, feePct }: { availableCents: number; minCents: number; feePct: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const enabled = availableCents >= minCents && availableCents > 0;

  return (
    <div>
      <button type="button" disabled={!enabled || pending} className="btn btn-signal w-full" onClick={() => setOpen(true)}>
        {pending ? "Requesting" : "Request payout"}
      </button>
      {message && (
        <p role="alert" className={`mt-3 text-[13px] leading-[17px] ${message.ok ? "text-rise" : "alert-text"}`}>{message.text}</p>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/58 rail:items-center" role="dialog" aria-modal="true" aria-labelledby="payout-title" onClick={() => setOpen(false)}>
          <div className="w-full max-w-[420px] rounded-t-[22px] border-t border-white/10 bg-surface px-4 pt-[18px] pb-[calc(18px+env(safe-area-inset-bottom))] rail:rounded-[22px] rail:border rail:p-[18px]" onClick={(e) => e.stopPropagation()}>
            <p id="payout-title" className="font-display text-[18px] leading-[22px] font-[780] tracking-[-0.25px]">Request payout</p>
            <p className="tnum mt-3 font-display text-[27px] leading-[30px] font-[850] tracking-[-0.7px] text-signal">{formatCredit(availableCents)}</p>
            <p className="mt-2 text-[14px] leading-5 text-ink-2">TapMart pays within a few days.</p>
            <p className="mt-1 text-[12px] leading-4 text-ink-soft">{feePct}% fee already deducted.</p>
            <button
              type="button"
              disabled={pending}
              className="btn btn-signal mt-[18px] w-full"
              onClick={() =>
                startTransition(async () => {
                  const result = await requestPayout();
                  setOpen(false);
                  setMessage(result.ok ? { ok: true, text: result.detail ?? "Payout requested." } : { ok: false, text: result.error ?? "Failed." });
                  if (result.ok) router.refresh();
                })}
            >
              {pending ? "Requesting" : "Confirm request"}
            </button>
            <button type="button" className="btn btn-ghost mt-2 w-full" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
