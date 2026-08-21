"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { addCredit } from "./actions";
import { LocalTime } from "@/components/LocalTime";
import { formatCredit, formatCount, parseDollarsToCents } from "@/lib/money";
import type { OwnedLink } from "@/lib/dashboard";

const PLACES = [
  { key: "board", label: "Board" },
  { key: "spot",  label: "Spot" },
  { key: "bar",   label: "Bar" },
] as const;

/**
 * One owned link, with its three placements side by side. Consumer-simple: the
 * only decision on offer is where to add more credit.
 */
export function OwnedLinkRow({
  link,
  prices,
}: {
  link: OwnedLink;
  prices: Record<"board" | "spot" | "bar", number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<null | "board" | "spot" | "bar">(null);
  const [amount, setAmount] = useState("25");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = {
    board: link.board_remaining_cents,
    spot: link.spot_remaining_cents,
    bar: link.bar_remaining_cents,
  };
  const statuses = {
    board: link.board_status, spot: link.spot_status, bar: link.bar_status,
  };

  function submit(type: "board" | "spot" | "bar") {
    const cents = parseDollarsToCents(amount);
    if (!cents) { setError("Enter an amount."); return; }
    setError(null);
    startTransition(async () => {
      const result = await addCredit(link.link_id, type, cents);
      if (result.ok && result.redirect) window.location.href = result.redirect;
      else if (result.ok) { setOpen(null); router.refresh(); }
      else setError(result.error);
    });
  }

  return (
    <article className="border-t border-rule py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {link.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.image_url} alt="" width={44} height={44} className="h-11 w-11 shrink-0 border border-rule object-cover" />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-700 tracking-[-0.03em]">
              {link.moderation_status === "approved" ? (
                <Link href={`/l/${link.slug}`} className="hover:text-signal">{link.display_name}</Link>
              ) : (
                link.display_name
              )}
            </h3>
            <p className="truncate font-mono text-[0.6875rem] text-ink-faint">{link.domain}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ModerationBadge status={link.moderation_status} />
          {link.board_rank != null && (
            <span className="tnum font-mono text-sm">
              <span className="text-ink-faint">#</span>{link.board_rank}
            </span>
          )}
          <span className="tnum font-mono text-xs text-ink-faint">
            {formatCount(link.opens_today)} today · {formatCount(link.total_opens)} total
          </span>
        </div>
      </div>

      <div className="mt-4 grid max-w-4xl gap-px bg-rule sm:grid-cols-3">
        {PLACES.map((place) => {
          const cents = remaining[place.key];
          const status = statuses[place.key];
          const live = status === "active" && (cents ?? 0) > 0;
          return (
            <div key={place.key} className="bg-paper p-3">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">{place.label}</span>
                <span className={`font-mono text-[0.625rem] tracking-[0.08em] uppercase ${live ? "text-rise" : "text-ink-faint"}`}>
                  {cents == null ? "—" : live ? "Live" : (cents === 0 ? "Out of credit" : status)}
                </span>
              </div>

              <div className="tnum mt-2 font-mono text-lg font-600">
                {cents == null ? <span className="text-ink-faint">—</span> : formatCredit(cents)}
              </div>

              {place.key === "board" && link.board_score_cents != null && (
                <div className="tnum mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                  {formatCredit(link.board_score_cents)} scored today
                </div>
              )}
              {place.key === "spot" && link.next_spot_at && (
                <div className="mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                  next <LocalTime iso={link.next_spot_at} />
                </div>
              )}
              {place.key === "bar" && link.bar_position != null && (
                <div className="tnum mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                  position {link.bar_position}
                </div>
              )}
              {cents != null && cents > 0 && (
                <div className="tnum mt-0.5 font-mono text-[0.6875rem] text-ink-faint">
                  ≈ {formatCount(Math.floor(cents / prices[place.key]))} opens left
                </div>
              )}

              {open === place.key ? (
                <div className="mt-3 flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-xs text-ink-faint">$</span>
                    <input
                      autoFocus name="add-credit-amount" inputMode="decimal" autoComplete="off" value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="field !min-h-0 !py-2 !pl-6 !text-sm" aria-label={`Credit to add to ${place.label}`}
                    />
                  </div>
                  <button type="button" className="btn !min-h-0 !px-3 !py-2 !text-[0.625rem]" disabled={pending} onClick={() => submit(place.key)}>
                    {pending ? "…" : "Add"}
                  </button>
                </div>
              ) : (
                <button
                  type="button" onClick={() => { setOpen(place.key); setError(null); }}
                  className="btn btn-ghost mt-3 !min-h-0 !px-3 !py-2 !text-[0.625rem]"
                >
                  Add credit
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <p role="alert" className="mt-2 font-mono text-xs text-signal">{error}</p>}
    </article>
  );
}

function ModerationBadge({ status }: { status: OwnedLink["moderation_status"] }) {
  if (status === "approved") return null;
  const tone = status === "pending" ? "text-ink-faint" : "text-signal";
  const label = status === "pending" ? "In review" : status;
  return (
    <span className={`font-mono text-[0.625rem] tracking-[0.08em] uppercase ${tone}`}>{label}</span>
  );
}
