"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adjustCreditById, setMemberSuspended } from "./actions";
import type { MemberRow } from "@/lib/admin";
import { formatCredit, parseDollarsToCents } from "@/lib/money";

/**
 * The member directory. Every account, in signup order, with the controls the
 * platform owner actually needs: freeze or restore an account, and correct a
 * wallet with a mandatory reason. Admin rows are marked and cannot be frozen.
 */
export function MembersPanel({ members }: { members: MemberRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [creditFor, setCreditFor] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, success: string) =>
    startTransition(async () => {
      const result = await fn();
      setMessage(result.ok ? { tone: "ok", text: success } : { tone: "bad", text: result.error ?? "Failed." });
      if (result.ok) {
        setCreditFor(null);
        setAmount("");
        setReason("");
        router.refresh();
      }
    });

  const submitCredit = (member: MemberRow) => {
    const cents = parseDollarsToCents(amount);
    if (cents === null || cents === 0) {
      setMessage({ tone: "bad", text: "Enter an amount like 25 or -10." });
      return;
    }
    run(
      () => adjustCreditById(member.id, cents, reason),
      `Wallet of #${pad(member.member_no)} adjusted by ${formatCredit(cents)}.`,
    );
  };

  if (members.length === 0) {
    return <p className="mt-3 font-mono text-xs text-ink-faint">No members yet.</p>;
  }

  return (
    <div className="mt-4">
      {message && (
        <p
          role="status"
          className={`mb-3 font-mono text-xs ${message.tone === "ok" ? "text-rise" : "text-signal"}`}
        >
          {message.text}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-rule">
              <th scope="col" className="eyebrow py-2 pr-3">#</th>
              <th scope="col" className="eyebrow py-2 pr-3">Member</th>
              <th scope="col" className="eyebrow py-2 pr-3 text-right">Wallet</th>
              <th scope="col" className="eyebrow py-2 pr-3 text-right">On placements</th>
              <th scope="col" className="eyebrow py-2 pr-3 text-right">Purchased</th>
              <th scope="col" className="eyebrow py-2 pr-3 text-right">Links</th>
              <th scope="col" className="eyebrow py-2 pr-3">Joined</th>
              <th scope="col" className="eyebrow py-2 text-right">Control</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <MemberRowView
                key={m.id}
                member={m}
                pending={pending}
                creditOpen={creditFor === m.id}
                onToggleCredit={() => {
                  setMessage(null);
                  setCreditFor(creditFor === m.id ? null : m.id);
                }}
                onSuspend={(suspend) =>
                  run(
                    () => setMemberSuspended(m.id, suspend),
                    suspend ? `#${pad(m.member_no)} frozen.` : `#${pad(m.member_no)} restored.`,
                  )
                }
                amount={amount}
                reason={reason}
                setAmount={setAmount}
                setReason={setReason}
                onSubmitCredit={() => submitCredit(m)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MemberRowView({
  member: m,
  pending,
  creditOpen,
  onToggleCredit,
  onSuspend,
  amount,
  reason,
  setAmount,
  setReason,
  onSubmitCredit,
}: {
  member: MemberRow;
  pending: boolean;
  creditOpen: boolean;
  onToggleCredit: () => void;
  onSuspend: (suspend: boolean) => void;
  amount: string;
  reason: string;
  setAmount: (v: string) => void;
  setReason: (v: string) => void;
  onSubmitCredit: () => void;
}) {
  return (
    <>
      <tr className={`border-b border-rule align-middle ${m.suspended ? "opacity-50" : ""}`}>
        <td className="tnum py-2.5 pr-3 font-mono text-sm font-600">
          {pad(m.member_no)}
          {m.role === "admin" && (
            <span className="ml-2 font-mono text-[0.5625rem] tracking-[0.14em] text-signal uppercase">
              Admin
            </span>
          )}
        </td>
        <td className="min-w-0 py-2.5 pr-3">
          <span className="block truncate font-display text-sm font-600">
            @{m.username ?? `member${m.member_no}`}
          </span>
          <span className="block truncate font-mono text-[0.6875rem] text-ink-faint">{m.email}</span>
        </td>
        <td className="tnum py-2.5 pr-3 text-right font-mono text-xs">
          {formatCredit(Number(m.available_credit_cents ?? 0))}
        </td>
        <td className="tnum py-2.5 pr-3 text-right font-mono text-xs text-ink-soft">
          {formatCredit(Number(m.reserved_cents))}
        </td>
        <td className="tnum py-2.5 pr-3 text-right font-mono text-xs text-ink-soft">
          {formatCredit(Number(m.lifetime_topup_cents))}
        </td>
        <td className="tnum py-2.5 pr-3 text-right font-mono text-xs">{m.links_count}</td>
        <td className="py-2.5 pr-3 font-mono text-xs whitespace-nowrap text-ink-faint">
          {new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </td>
        <td className="py-2.5 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={onToggleCredit}
            disabled={pending}
            className="btn btn-ghost !min-h-0 !px-2.5 !py-1.5 !text-[0.625rem]"
          >
            Credit
          </button>
          {m.role !== "admin" && (
            <button
              type="button"
              onClick={() => onSuspend(!m.suspended)}
              disabled={pending}
              className={`btn !min-h-0 ml-2 !px-2.5 !py-1.5 !text-[0.625rem] ${
                m.suspended ? "" : "btn-ghost"
              }`}
            >
              {m.suspended ? "Restore" : "Freeze"}
            </button>
          )}
        </td>
      </tr>
      {creditOpen && (
        <tr className="border-b border-rule bg-surface">
          <td colSpan={8} className="px-2 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Adjust #{pad(m.member_no)}</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount, e.g. 25 or -10"
                inputMode="decimal"
                className="field !min-h-0 max-w-[180px] !py-2 !text-sm"
              />
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required, kept on record)"
                className="field !min-h-0 max-w-[320px] flex-1 !py-2 !text-sm"
              />
              <button
                type="button"
                onClick={onSubmitCredit}
                disabled={pending}
                className="btn !min-h-0 !px-4 !py-2 !text-[0.6875rem]"
              >
                Apply
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function pad(no: string | number): string {
  return String(no).padStart(4, "0");
}
