"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { confirmEmail } from "./actions";

/**
 * Landing pad for the email-verification link. The token arrives in the URL
 * fragment, which only the browser can read; it is verified server-side and
 * cleared from the address bar immediately. Verification proves the address —
 * signing in still takes the password.
 */
export function ConfirmClient() {
  const [state, setState] = useState<"working" | "verified" | "failed">("working");
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
      queueMicrotask(() => {
        setState("failed");
        setMessage(
          errorDescription ??
            "That verification link is invalid or has expired. Request a new one from the sign-up page.",
        );
      });
      return;
    }

    confirmEmail(accessToken).then((result) => {
      if (result.ok) {
        setState("verified");
      } else {
        setState("failed");
        setMessage(result.error);
      }
    });
  }, []);

  if (state === "working") {
    return (
      <p className="mt-6 font-mono text-sm text-ink-soft" role="status">
        Verifying…
      </p>
    );
  }

  if (state === "verified") {
    return (
      <div className="mt-6">
        <p role="status" className="font-mono text-sm text-rise">
          Your email is verified.
        </p>
        <p className="mt-3 max-w-md text-sm text-ink-soft">
          Your TapMart account is ready. Sign in with your email and password.
        </p>
        <Link href="/sign-in?verified=1" className="btn btn-signal mt-6">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p role="alert" className="font-mono text-sm text-signal">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/sign-up" className="btn">
          Create account
        </Link>
        <Link href="/sign-in" className="btn btn-ghost">
          Sign in
        </Link>
        <Link href="/reset" className="btn btn-ghost">
          Reset password
        </Link>
      </div>
    </div>
  );
}
