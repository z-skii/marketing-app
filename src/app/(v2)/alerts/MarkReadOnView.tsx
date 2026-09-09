"use client";

import { useEffect, useRef } from "react";
import { markNotificationsRead } from "../actions";

/** Opening the alerts screen clears the unread state, like any social app. */
export function MarkReadOnView({ hasUnread }: { hasUnread: boolean }) {
  const done = useRef(false);
  useEffect(() => {
    if (!hasUnread || done.current) return;
    done.current = true;
    const timer = setTimeout(() => { markNotificationsRead().catch(() => {}); }, 800);
    return () => clearTimeout(timer);
  }, [hasUnread]);
  return null;
}
