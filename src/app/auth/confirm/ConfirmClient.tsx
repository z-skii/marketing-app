"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { completeMagicLink } from "./actions";

/**
 * Landing pad for the email sign-in link. Supabase returns the tokens in the
 * URL fragment, which only the browser can read — so this page parses it,
 * hands the access token to the server to verify, and moves on. The fragment
 * is cleared immediately so tokens never sit in the address bar or history.
 */
export function ConfirmClient() {
  const [state, setState] = useState<"working" | "failed">("working");
  const [message, setMessage] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const errorDescription = fragment.get("error_description");

    window.history.replaceState(null, "", window.location.pathname);

    if (!accessToken) {
      // Deferred a tick so the state change is an async response to the URL
      // inspection rather than a synchronous render cascade.
      queueMicrotask(() => {
        setState("failed");
        setMessage(
          errorDescription ??
            "That link is missing its sign-in — it may have expired or already been used.",
        );
      });
      return;
    }

    completeMagicLink(accessToken).then((result) => {
      if (result.ok) {
        window.location.replace("/dashboard");
      } else {
        setState("failed");
        setMessage(result.error);
      }
    });
  }, []);

  if (state === "working") {
    return (
      <p className="mt-6 font-mono text-sm text-ink-soft" role="status">
        Signing you in…
      </p>
    );
  }

  return (
    <div className="mt-6">
      <p role="alert" className="font-mono text-sm text-signal">
        {message}
      </p>
      <Link href="/sign-in" className="btn mt-6">
        Try signing in again
      </Link>
    </div>
  );
}
