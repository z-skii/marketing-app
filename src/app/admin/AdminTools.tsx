"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustCredit, blockDomain, resolvePayout } from "./actions";
import { formatCredit, parseDollarsToCents } from "@/lib/money";

type Payout = { id: string; amount_cents: string; status: string; created_at: string; email: string };

export function AdminTools({ payouts }: { payouts: Payout[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const [domain, setDomain] = useState("");
  const [domainReason, setDomainReason] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? { tone: "ok", text: success } : { tone: "bad", text: result.error ?? "Failed." });
      if (result.ok) router.refresh();
    });

  return (
    <>
      <section className="rule mt-9 pt-6">
        <h2 className="eyebrow">Payout requests</h2>
        {payouts.length === 0 ? (
          <p className="mt-3 font-mono text-xs text-ink-faint">Nothing requested.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-px bg-rule">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 bg-paper p-3 font-mono text-xs">
                <span className="flex-1 truncate">{p.email}</span>
                <span className="tnum font-600">{formatCredit(Number(p.amount_cents))}</span>
                <span className="text-ink-faint">{p.status}</span>
                {p.status === "requested" && (
                  <span className="flex gap-2">
                    <button
                      type="button" className="btn !min-h-0 !px-2.5 !py-1.5 !text-[0.625rem]" disabled={pending}
                      onClick={() => run(() => resolvePayout(p.id, "paid"), "Marked paid.")}
                    >
                      Mark paid
                    </button>
                    <button
                      type="button" className="btn btn-ghost !min-h-0 !px-2.5 !py-1.5 !text-[0.625rem]" disabled={pending}
                      onClick={() => run(() => resolvePayout(p.id, "rejected"), "Rejected.")}
                    >
                      Reject
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 font-mono text-xs text-ink-faint">
          Payouts are recorded here only — no money rail is connected.
        </p>
      </section>

      <section className="rule mt-9 pt-6">
        <h2 className="eyebrow">Tools</h2>

        <div className="mt-4 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-xs font-600">Block a domain</h3>
            <div className="mt-2 flex flex-col gap-2">
              <input value={domain} onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com" className="field !min-h-0 !py-2 !text-sm" aria-label="Domain to block" />
              <input value={domainReason} onChange={(e) => setDomainReason(e.target.value)}
                placeholder="Reason" className="field !min-h-0 !py-2 !text-sm" aria-label="Reason" />
              <button type="button" className="btn self-start" disabled={pending || !domain}
                onClick={() => run(() => blockDomain(domain, domainReason), "Domain blocked.")}>
                Block
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-mono text-xs font-600">Adjust credit</h3>
            <p className="mt-1 font-mono text-[0.6875rem] text-ink-faint">
              Writes a ledger entry and an audit record. A reason is required.
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <input value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="account@example.com" className="field !min-h-0 !py-2 !text-sm" aria-label="Account email" />
              <input value={amount} onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount, e.g. 25 or -10" className="field !min-h-0 !py-2 !text-sm" aria-label="Amount in dollars" />
              <input value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required)" className="field !min-h-0 !py-2 !text-sm" aria-label="Reason" />
              <button
                type="button" className="btn self-start" disabled={pending || !email || !reason}
                onClick={() => {
                  const negative = amount.trim().startsWith("-");
                  const cents = parseDollarsToCents(amount.replace("-", ""));
                  if (!cents) { setMessage({ tone: "bad", text: "Enter a valid amount." }); return; }
                  run(() => adjustCredit(email, negative ? -cents : cents, reason), "Adjustment recorded.");
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {message && (
          <p role="alert" className={`mt-4 font-mono text-xs ${message.tone === "ok" ? "text-rise" : "text-signal"}`}>
            {message.text}
          </p>
        )}
      </section>
    </>
  );
}
