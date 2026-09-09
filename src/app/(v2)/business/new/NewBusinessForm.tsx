"use client";

import { useState, useTransition } from "react";
import { createBusiness } from "../actions";

const LABEL = "text-sm text-ink-soft";

export function NewBusinessForm({ defaultCity }: { defaultCity: string }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="card mt-6 flex flex-col gap-3 p-4 md:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createBusiness({ name, category, city });
          if (result && !result.ok) setError(result.error ?? "Something went wrong.");
        });
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Business name</span>
        <input className="field" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cloud Coffee" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>Category <span className="text-ink-faint">(optional)</span></span>
        <input className="field" maxLength={60} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Coffee shop" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL}>City</span>
        <input className="field" maxLength={60} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Raleigh, NC" />
      </label>
      {error && <p role="alert" className="text-sm text-signal">{error}</p>}
      <button type="submit" disabled={pending || name.trim().length < 2} className="btn btn-signal btn-lg mt-2 w-full">
        {pending ? "Creating…" : "Create business"}
      </button>
    </form>
  );
}
