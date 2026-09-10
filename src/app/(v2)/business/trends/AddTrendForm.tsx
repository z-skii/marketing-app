"use client";

import { useState, useTransition } from "react";
import { addTrendUrl } from "./actions";

/** Paste a link you found; it joins the list as a manual trend. */
export function AddTrendForm() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        setError(null);
        start(async () => {
          const r = await addTrendUrl(data);
          if (!r.ok) setError(r.error ?? "Could not add that link.");
          else { form.reset(); setDone(true); window.setTimeout(() => setDone(false), 2500); }
        });
      }}
    >
      <div className="min-w-0 flex-1">
        <input name="url" className="field" inputMode="url" placeholder="https://www.instagram.com/reel/..." aria-label="Link to the video" required />
        {error && <p role="alert" className="mt-1 text-sm alert-text">{error}</p>}
        {done && <p className="mt-1 text-sm text-rise">Added</p>}
      </div>
      <button type="submit" className="btn shrink-0" disabled={pending}>{pending ? "Adding" : "Add"}</button>
    </form>
  );
}
