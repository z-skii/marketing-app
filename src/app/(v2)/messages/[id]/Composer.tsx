"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "./actions";

export function Composer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const send = () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    startTransition(async () => {
      setError(null);
      const result = await sendMessage(conversationId, text);
      if (!result.ok) {
        setError(result.error ?? "Couldn't send.");
        setBody(text);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="border-t border-rule pt-3 pb-[env(safe-area-inset-bottom)]">
      {error && <p role="alert" className="mb-2 font-mono text-xs text-signal">{error}</p>}
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); send(); }}
      >
        <textarea
          className="field max-h-32 min-h-11 flex-1 resize-none !py-2.5"
          rows={1} maxLength={4000} value={body} placeholder="Message…"
          aria-label="Message"
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
          }}
        />
        <button type="submit" disabled={pending || !body.trim()} className="btn btn-signal !px-4 !py-2.5">
          Send
        </button>
      </form>
    </div>
  );
}
