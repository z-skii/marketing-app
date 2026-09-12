"use client";

import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

/**
 * Returns to the screen the person came from; falls back to the section
 * root on a fresh tab or a shared link. The label names the destination.
 */
export function BackLink({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="fs-btn fs-btn-quiet fs-link-ink"
      style={{ paddingLeft: 0, minHeight: 44 }}
      onClick={() => { if (window.history.length > 1) router.back(); else router.push(fallback); }}
    >
      <CaretLeft size={20} aria-hidden />{label}
    </button>
  );
}
