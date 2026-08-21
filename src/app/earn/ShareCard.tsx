"use client";

import { useState } from "react";

const TARGETS = [
  { key: "home",  label: "The homepage", hint: "Everything at once." },
  { key: "board", label: "The Board",    hint: "The live ranking." },
] as const;

/** Copy a tracked share link. Nothing here is paid per view. */
export function ShareCard({ code, origin }: { code: string; origin: string }) {
  const [copied, setCopied] = useState<string | null>(null);
  const url = `${origin}/s/${code}`;

  async function copy(target: string, value: string) {
    try {
      if (navigator.share) {
        await navigator.share({ url: value });
        return;
      }
      await navigator.clipboard.writeText(value);
      setCopied(target);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="rule-heavy mt-10 pt-6">
      <h2 className="eyebrow">Share something</h2>
      <div className="mt-4 flex flex-col gap-px bg-rule">
        {TARGETS.map((target) => {
          const value = target.key === "home" ? url : `${url}?to=board`;
          return (
            <div key={target.key} className="flex flex-wrap items-center justify-between gap-3 bg-paper p-4">
              <div className="min-w-0">
                <div className="font-display text-lg font-700 tracking-[-0.02em]">{target.label}</div>
                <div className="truncate font-mono text-xs text-ink-faint">{value}</div>
              </div>
              <button type="button" className="btn btn-ghost shrink-0" onClick={() => copy(target.key, value)}>
                {copied === target.key ? "Copied" : "Copy"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-mono text-xs text-ink-faint">
        You earn when someone you send here opens a link — not for the visit itself.
      </p>
    </section>
  );
}
