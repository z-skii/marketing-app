"use client";

import { useState, type ReactNode } from "react";

/** Share a profile: the native share sheet where there is one, otherwise the link is copied. */
export function CopyLink({ url, label, className = "btn btn-sm", children }: { url: string; label: string; className?: string; children: ReactNode }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ url }); return; }
      await navigator.clipboard.writeText(url);
      setDone(true); setTimeout(() => setDone(false), 1800);
    } catch { /* cancelled */ }
  };
  return <button type="button" className={className} onClick={share} aria-label={label} data-tip={label}>{done ? "Copied" : children}</button>;
}
