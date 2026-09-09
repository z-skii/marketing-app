"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dismissIdea } from "./actions";

/** A marketing idea with one button: turn it into a campaign. */
export function IdeaCard({
  id, businessId, title, body,
}: { id: string; businessId: string; title: string; body: string }) {
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  if (gone) return null;
  return (
    <article className="card p-5">
      <h3 className="font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{title}</h3>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-4 flex items-center gap-2">
        <Link href={`/create?rec=${id}`} className="btn btn-signal btn-sm">
          Turn into a campaign
        </Link>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => { setGone(true); start(() => dismissIdea(id, businessId).then(() => {})); }}
        >
          Not for me
        </button>
      </div>
    </article>
  );
}
