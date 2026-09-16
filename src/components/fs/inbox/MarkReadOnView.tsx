"use client";

import { useEffect, useRef } from "react";
import { markNotificationsSeen } from "@/components/fs/inbox/actions";

/**
 * Opening Notifications clears the unread state after a moment, like any
 * inbox. The view is not re-rendered: what was new stays marked until the
 * next visit, so the person can see what arrived. The guard is set when
 * the request is actually sent, not when the timer is armed, so a cancelled
 * first effect (development double-invoke) cannot swallow the only send.
 */
export function MarkReadOnView({ hasUnread }: { hasUnread: boolean }) {
  const sent = useRef(false);
  useEffect(() => {
    if (!hasUnread || sent.current) return;
    const timer = setTimeout(() => {
      if (sent.current) return;
      sent.current = true;
      markNotificationsSeen().catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [hasUnread]);
  return null;
}
