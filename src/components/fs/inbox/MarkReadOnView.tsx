"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsRead } from "@/app/(v2)/actions";

/**
 * Opening Notifications clears the unread state after a moment, like any
 * inbox. The guard is set when the request is actually sent, not when the
 * timer is armed, so a cancelled first effect (development double-invoke)
 * does not swallow the only chance to mark them read.
 */
export function MarkReadOnView({ hasUnread }: { hasUnread: boolean }) {
  const router = useRouter();
  const sent = useRef(false);
  useEffect(() => {
    if (!hasUnread || sent.current) return;
    const timer = setTimeout(() => {
      if (sent.current) return;
      sent.current = true;
      markNotificationsRead().then(() => router.refresh()).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [hasUnread, router]);
  return null;
}
