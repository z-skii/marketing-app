"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moderateLink } from "./actions";
import { formatCredit } from "@/lib/money";
import type { ModerationLink } from "@/lib/admin";

/**
 * Moderation. The destination is shown as text and never fetched or previewed
 * by the server — an admin decides by looking, not by us loading the page.
 */
export function ModerationQueue({
  links,
  emptyMessage,
  showActions = false,
}: {
  links: ModerationLink[];
  emptyMessage: string;
  showActions?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  if (links.length === 0) {
    return <p className="mt-3 font-mono text-xs text-ink-faint">{emptyMessage}</p>;
  }

  function act(id: string, status: "approved" | "rejected" | "suspended") {
    setBusy(id);
    startTransition(async () => {
      await moderateLink(id, status);
      setBusy(null);
      router.refresh();
    });
  }

  return (
    <ul className="mt-4 flex flex-col gap-px bg-rule">
      {links.map((link) => (
        <li key={link.id} className="flex flex-wrap items-center gap-4 bg-paper p-3">
          {link.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={link.image_url} alt="" width={40} height={40} className="h-10 w-10 shrink-0 border border-rule object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-base font-700 tracking-[-0.02em]">
              {link.display_name}
            </div>
            <div className="truncate font-mono text-[0.6875rem] text-ink-faint">
              {link.destination_url}
            </div>
            {link.short_description && (
              <div className="truncate text-xs text-ink-soft">{link.short_description}</div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="tnum font-mono text-xs">{formatCredit(link.reserved_cents)}</div>
            <div className="font-mono text-[0.625rem] text-ink-faint">{link.owner_email}</div>
          </div>

          {showActions ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button" className="btn !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                disabled={pending && busy === link.id} onClick={() => act(link.id, "approved")}
              >
                Approve
              </button>
              <button
                type="button" className="btn btn-ghost !min-h-0 !px-3 !py-1.5 !text-[0.625rem]"
                disabled={pending && busy === link.id} onClick={() => act(link.id, "rejected")}
              >
                Reject
              </button>
            </div>
          ) : (
            link.moderation_status === "approved" && (
              <button
                type="button" className="btn btn-ghost !min-h-0 shrink-0 !px-3 !py-1.5 !text-[0.625rem]"
                disabled={pending && busy === link.id} onClick={() => act(link.id, "suspended")}
              >
                Suspend
              </button>
            )
          )}
        </li>
      ))}
    </ul>
  );
}
