"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSetting } from "./actions";

const LABELS: Record<string, string> = {
  board_click_price_cents: "Board price per open (cents)",
  spot_click_price_cents: "Spot price per open (cents)",
  bar_click_price_cents: "Bar price per open (cents)",
  creator_commission_cents: "Creator commission (cents)",
  duplicate_click_window_hours: "Duplicate window (hours)",
  board_reset_utc_hour: "Board reset hour (UTC)",
  spot_appearance_seconds: "Spot appearance (seconds)",
  spot_appearances_per_day: "Spot appearances per day",
  spot_capacity: "Spot capacity",
  bar_capacity: "Bar capacity",
  creator_fraud_hold_days: "Creator hold (days)",
  minimum_payout_cents: "Minimum payout (cents)",
  minimum_topup_cents: "Minimum top-up (cents)",
  maximum_topup_cents: "Maximum top-up (cents)",
  feature_creator_program: "Creator program",
  feature_spot_enabled: "The Spot",
  feature_bar_enabled: "The Bar",
  feature_agent_auto_publish: "Auto-publish agent content",
  // feature_showcase_ads is deliberately absent: it has its own one-tap
  // switch at the top of the admin page instead of a dropdown here.
};

export function SettingsPanel({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>(settings);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save(key: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateSetting(key, draft[key]);
      if (result.ok) { setSaved(key); setTimeout(() => setSaved(null), 1600); router.refresh(); }
      else setError(result.error);
    });
  }

  const keys = Object.keys(LABELS).filter((k) => k in settings);

  return (
    <section className="rule mt-9 pt-6">
      <h2 className="eyebrow">Settings</h2>
      <p className="mt-2 font-mono text-xs text-ink-faint">
        Applied live. Pricing and capacity take effect on the next request.
      </p>
      <div className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {keys.map((key) => {
          const isFlag = key.startsWith("feature_");
          return (
            <div key={key} className="flex items-center gap-3">
              <label htmlFor={`s-${key}`} className="flex-1 font-mono text-xs text-ink-soft">
                {LABELS[key]}
              </label>
              {isFlag ? (
                <select
                  id={`s-${key}`} value={draft[key]} className="field !min-h-0 !w-24 !py-1.5 !text-xs"
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                >
                  <option value="true">on</option>
                  <option value="false">off</option>
                </select>
              ) : (
                <input
                  id={`s-${key}`} inputMode="numeric" value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  className="field tnum !min-h-0 !w-24 !py-1.5 !text-xs"
                />
              )}
              <button
                type="button" className="btn btn-ghost !min-h-0 !px-2.5 !py-1.5 !text-[0.625rem]"
                disabled={pending || draft[key] === settings[key]} onClick={() => save(key)}
              >
                {saved === key ? "✓" : "Save"}
              </button>
            </div>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-3 font-mono text-xs text-signal">{error}</p>}
    </section>
  );
}
