"use client";

import { useState } from "react";

/** Password input with a show/hide control. */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder = "••••••••",
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  placeholder?: string;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="eyebrow">{label}</label>
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          className="font-mono text-[0.625rem] tracking-[0.1em] text-ink-faint uppercase transition-colors hover:text-ink"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        required
        minLength={8}
        maxLength={72}
        autoComplete={autoComplete}
        spellCheck={false}
        placeholder={placeholder}
        className="field"
      />
    </div>
  );
}
