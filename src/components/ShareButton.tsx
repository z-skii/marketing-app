"use client";

import { useState } from "react";
import { SITE_NAME } from "@/config/site";

/** Copies a shareable URL, using the native share sheet on touch devices. */
export function ShareButton({ path, label = "Share" }: { path: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    if (navigator.share) {
      try {
        await navigator.share({ url, text: `Found this on ${SITE_NAME}` });
        return;
      } catch {
        // The sheet was dismissed — fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className="btn btn-ghost">
      {copied ? "Copied" : label}
    </button>
  );
}
