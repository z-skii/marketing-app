"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dismissIdea } from "./actions";

/** A marketing idea with the magic button: turn it into a campaign. */
export function IdeaCard({
  id, businessId, title, body,
}: { id: string; businessId: string; title: string; body: string }) {
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  if (gone) return null;
  return (
    <article className="border border-rule p-4">
      <h3 className="font-display text-base font-800">{title}</h3>
      <p className="mt-1 text-sm text-ink-faint">{body}</p>
      <div className="mt-3 flex items-center gap-2">
        <Link href={`/create?rec=${id}`} className="btn btn-signal !min-h-0 !px-3 !py-2 !text-[0.6875rem]">
          Turn this into a campaign
        </Link>
        <button
          type="button"
          className="btn btn-ghost !min-h-0 !px-3 !py-2 !text-[0.6875rem]"
          onClick={() => { setGone(true); start(() => dismissIdea(id, businessId).then(() => {})); }}
        >
          Dismiss
        </button>
      </div>
    </article>
  );
}
