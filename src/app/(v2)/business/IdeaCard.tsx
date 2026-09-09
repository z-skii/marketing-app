"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dismissIdea } from "./actions";

const KIND_TARGET: Record<string, string> = {
  recreate_reel: "recreate", instagram_story: "story", car_ads: "car",
};

/**
 * A trend or an idea with one button: turn it into a campaign. A trend
 * carries a real reference and a sourced stat; an idea is a plain
 * suggestion. Neither says "AI".
 */
export function IdeaCard({
  id, businessId, title, body, stat, referenceUrl, kind, trend = false,
}: {
  id: string; businessId: string; title: string; body: string;
  stat?: string | null; referenceUrl?: string | null; kind?: string | null; trend?: boolean;
}) {
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  if (gone) return null;
  const target = KIND_TARGET[kind ?? ""] ?? "";
  return (
    <article className="card p-5">
      <h3 className="font-display text-[1.125rem] leading-tight font-800 tracking-[-0.02em]">{title}</h3>
      {stat && <p className="mt-1 font-display text-sm font-700 text-signal">{stat}</p>}
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/business/create/${target}?rec=${id}`} className="btn btn-signal btn-sm">
          {trend ? "Recreate this" : "Turn into a campaign"}
        </Link>
        {referenceUrl && (
          <a href={referenceUrl} target="_blank" rel="noreferrer" className="btn btn-sm">See the reference</a>
        )}
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
