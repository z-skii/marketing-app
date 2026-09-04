"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSetting } from "./actions";

/**
 * The showcase set on and off in ONE tap. No dropdown, no Save: the switch
 * flips the setting the moment it is pressed, and the whole site follows on
 * the next request. It reads as a broadcast master switch — ink track, knob,
 * signal orange when the showcase is on air.
 */
export function ShowcaseSwitch({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const flip = () => {
    const next = !on;
    setOn(next); // The switch answers the finger immediately.
    setError(null);
    startTransition(async () => {
      const result = await updateSetting("feature_showcase_ads", next ? "true" : "false");
      if (!result.ok) {
        setOn(!next);
        setError(result.error ?? "That didn't stick — try again.");
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="rule mt-9 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="eyebrow">Showcase ads</h2>
          <p className="mt-1 max-w-md font-mono text-[0.6875rem] text-ink-faint">
            Fifty world brands fill the open space for free. They carry no money,
            rank under every paid ad, and vanish the moment this is off.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Showcase ads"
          onClick={flip}
          disabled={pending}
          className="group flex items-center gap-3"
        >
          <span
            className={`font-mono text-xs font-600 tracking-[0.14em] uppercase ${
              on ? "text-signal" : "text-ink-faint"
            }`}
          >
            {on ? "On" : "Off"}
          </span>
          <span
            aria-hidden="true"
            className={`relative h-8 w-16 border-[1.5px] border-ink transition-colors ${
              on ? "bg-signal" : "bg-paper-deep"
            }`}
          >
            <span
              className={`absolute top-[3px] h-[22px] w-[26px] bg-ink transition-all ${
                on ? "left-[33px]" : "left-[3px]"
              }`}
            />
          </span>
        </button>
      </div>
      {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}
    </section>
  );
}
