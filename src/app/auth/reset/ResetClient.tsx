"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/PasswordField";
import { completePasswordReset } from "./actions";

type Stage =
  | { kind: "loading" }
  | { kind: "ready"; accessToken: string; refreshToken: string }
  | { kind: "failed"; message: string };

/**
 * Landing pad for the password-reset email. The tokens live in the URL
 * fragment, which only the browser can read; they are captured once, cleared
 * from the address bar, and handed to the server only when the visitor
 * submits their new password.
 */
export function ResetClient() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>({ kind: "loading" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    const errorDescription = fragment.get("error_description");
    window.history.replaceState(null, "", window.location.pathname);

    queueMicrotask(() => {
      if (accessToken && refreshToken) {
        setStage({ kind: "ready", accessToken, refreshToken });
      } else {
        setStage({
          kind: "failed",
          message: errorDescription ?? "That reset link is invalid or has expired. Request a new one.",
        });
      }
    });
  }, []);

  if (stage.kind === "loading") {
    return (
      <p className="mt-6 font-mono text-sm text-ink-soft" role="status">
        One moment…
      </p>
    );
  }

  if (stage.kind === "failed") {
    return (
      <div className="mt-6">
        <p role="alert" className="font-mono text-sm text-signal">{stage.message}</p>
        <Link href="/reset" className="btn mt-6">
          Request a new link
        </Link>
      </div>
    );
  }

  const submit = async (formData: FormData) => {
    setSaving(true);
    setError(null);
    const result = await completePasswordReset(
      stage.accessToken,
      stage.refreshToken,
      String(formData.get("password") ?? ""),
      String(formData.get("confirm") ?? ""),
    );
    setSaving(false);
    if (result.ok) {
      router.replace("/sign-in?reset=done");
    } else {
      setError(result.error);
    }
  };

  return (
    <form action={submit} className="mt-8 flex max-w-md flex-col gap-4">
      <PasswordField
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        placeholder="Same password again"
      />
      {error && (
        <p role="alert" className="font-mono text-xs text-signal">{error}</p>
      )}
      <button type="submit" className="btn btn-signal mt-1" disabled={saving}>
        {saving ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
