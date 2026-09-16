"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/(v2)/messages/[id]/actions";

/** One field and one button, pinned above the tab bar. Enter sends; Shift+Enter breaks a line. */
export function Composer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const send = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    start(async () => {
      setError(null);
      const r = await sendMessage(conversationId, text);
      if (!r.ok) { setError(r.error ?? "Could not send."); setBody(text); } else router.refresh();
    });
  };
  return (
    <form className="fs-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
      <div style={{ minWidth: 0 }}>
        {error && <p role="alert" className="fs-field-error" style={{ marginBottom: 4 }}>{error}</p>}
        <textarea className="fs-textarea" rows={1} maxLength={4000} value={body} placeholder="Message" aria-label="Message" onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
      </div>
      <button type="submit" disabled={pending || !body.trim()} className="fs-btn fs-btn-primary">Send</button>
    </form>
  );
}
