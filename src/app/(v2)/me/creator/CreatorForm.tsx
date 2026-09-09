"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestCreatorVerification, updateCreatorProfile } from "../actions";

/**
 * Verification: a link to where your work lives (optional) and one button.
 * An admin checks the account and the mark appears on your profile.
 */
export function CreatorForm({ initial }: { initial: { portfolioUrl: string; verification: string } }) {
  const router = useRouter();
  const [portfolioUrl, setPortfolioUrl] = useState(initial.portfolioUrl);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const canRequest = ["unverified", "rejected"].includes(initial.verification);

  return (
    <div className="card mt-5 flex flex-col gap-4 p-4 md:p-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-ink-soft">Where can we see your work? <span className="text-ink-faint">(optional)</span></span>
        <input className="field" maxLength={300} value={portfolioUrl} inputMode="url"
          onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://instagram.com/you" />
      </label>

      {message && <p role="alert" className={`text-sm ${message.ok ? "text-rise" : "text-signal"}`}>{message.text}</p>}

      {canRequest ? (
        <button
          type="button" disabled={pending} className="btn btn-signal btn-lg w-full"
          onClick={() =>
            startTransition(async () => {
              const saved = await updateCreatorProfile({ categories: [], portfolioUrl, equipment: "", pricingNote: "" });
              if (!saved.ok) { setMessage({ ok: false, text: saved.error ?? "Failed." }); return; }
              const result = await requestCreatorVerification();
              setMessage(result.ok
                ? { ok: true, text: "Requested. TapMart checks your account, usually within a day." }
                : { ok: false, text: result.error ?? "Failed." });
              if (result.ok) router.refresh();
            })}
        >
          {pending ? "Sending" : "Request verification"}
        </button>
      ) : (
        <button
          type="button" disabled={pending} className="btn btn-lg w-full"
          onClick={() =>
            startTransition(async () => {
              const saved = await updateCreatorProfile({ categories: [], portfolioUrl, equipment: "", pricingNote: "" });
              setMessage(saved.ok ? { ok: true, text: "Saved." } : { ok: false, text: saved.error ?? "Failed." });
            })}
        >
          {pending ? "Saving" : "Save"}
        </button>
      )}
    </div>
  );
}
