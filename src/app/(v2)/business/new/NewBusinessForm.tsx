"use client";

import { useState, useTransition } from "react";
import { createBusiness } from "../actions";

export function NewBusinessForm({ defaultCity }: { defaultCity: string }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-5 flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createBusiness({ name, category, city });
          if (result && !result.ok) setError(result.error ?? "Something went wrong.");
        });
      }}
    >
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Business name</span>
        <input className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cloud Coffee" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">Category <span className="text-ink-faint">(optional)</span></span>
        <input className="field" maxLength={60} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Coffee shop" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="eyebrow">City</span>
        <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
      </label>
      {error && <p role="alert" className="font-mono text-xs text-signal">{error}</p>}
      <button type="submit" disabled={pending || name.trim().length < 2} className="btn btn-signal mt-2 !py-3">
        {pending ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}
