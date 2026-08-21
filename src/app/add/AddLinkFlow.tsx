"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { goLive } from "./actions";
import { formatCredit, parseDollarsToCents } from "@/lib/money";

/**
 * ADD YOUR LINK — four focused steps rather than one long form.
 *
 * Each step asks for exactly one thing, so momentum never breaks. Progress is
 * kept in the client until the final submit, which is a single server action.
 */

type Step = 0 | 1 | 2 | 3;
const STEPS = ["Link", "Appearance", "Place", "Credit"] as const;

const PLACES = [
  { key: "board", title: "The Board", blurb: "Ranked by credit added today." },
  { key: "spot",  title: "The Spot",  blurb: "One link at a time, sixty seconds." },
  { key: "bar",   title: "The Bar",   blurb: "Always on screen, always moving." },
] as const;

const PRESETS = [1000, 2500, 5000, 10000];

export function AddLinkFlow({
  signedIn,
  availableCents,
  clickPrices,
}: {
  signedIn: boolean;
  availableCents: number;
  clickPrices: Record<"board" | "spot" | "bar", number>;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [places, setPlaces] = useState<Record<string, boolean>>({ board: true, spot: false, bar: false });

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const data = await response.json();
      if (response.ok && data.url) setImageUrl(data.url);
      else setUploadError(data.error ?? "That upload didn't go through.");
    } catch {
      setUploadError("That upload didn't go through.");
    } finally {
      setUploading(false);
    }
  }
  const [amounts, setAmounts] = useState<Record<string, string>>({ board: "25", spot: "", bar: "" });

  const chosen = PLACES.filter((p) => places[p.key]);
  const cents = (key: string) => parseDollarsToCents(amounts[key] || "0") ?? 0;
  const total = chosen.reduce((sum, p) => sum + cents(p.key), 0);

  const canAdvance =
    step === 0 ? url.trim().length > 3
    : step === 1 ? displayName.trim().length >= 2
    : step === 2 ? chosen.length > 0
    : total > 0;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await goLive({
        url, displayName, shortDescription, imageUrl,
        board: places.board ? cents("board") : 0,
        spot:  places.spot  ? cents("spot")  : 0,
        bar:   places.bar   ? cents("bar")   : 0,
      });
      if (result.ok) router.push(result.redirect);
      else setError(result.error);
    });
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ol className="flex items-center gap-1" aria-label="Progress">
        {STEPS.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex-1 border-t-2 pt-2 transition-colors ${
                index <= step ? "border-signal" : "border-rule"
              }`}
            >
              <span className={`eyebrow ${index === step ? "!text-ink" : ""}`}>
                {String(index + 1).padStart(2, "0")} {label}
              </span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-10 min-h-[19rem]">
        {step === 0 && (
          <Panel title="Where does it go?">
            <input
              type="text" name="destination" inputMode="url" autoComplete="off" spellCheck={false} value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && canAdvance) setStep(1); }}
              placeholder="yourproject.com" className="field !text-lg"
              aria-label="Destination link"
            />
            <p className="mt-3 font-mono text-xs text-ink-faint">
              We never follow this link on your behalf. It opens only when someone chooses to.
            </p>
          </Panel>
        )}

        {step === 1 && (
          <Panel title="How do you appear?">
            <div className="flex flex-col gap-3">
              <input
                name="display-name" autoComplete="off" value={displayName} maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Name" className="field !text-lg" aria-label="Display name"
              />
              <input
                name="short-description" autoComplete="off" value={shortDescription} maxLength={90}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="One short sentence." className="field" aria-label="One-line description"
              />
              <div className="flex gap-2">
                <input
                  type="text" name="image-url" inputMode="url" autoComplete="off" spellCheck={false} value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (optional)" className="field flex-1" aria-label="Image URL"
                />
                <label className="btn btn-ghost cursor-pointer">
                  {uploading ? "Uploading\u2026" : "Upload"}
                  <input
                    type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                    onChange={(e) => uploadImage(e.target.files?.[0])}
                  />
                </label>
              </div>
              {uploadError && <p role="alert" className="font-mono text-xs text-signal">{uploadError}</p>}
              <p className="font-mono text-xs text-ink-faint">
                {90 - shortDescription.length} characters left.
              </p>
            </div>
          </Panel>
        )}

        {step === 2 && (
          <Panel title="Pick your place.">
            <div className="flex flex-col gap-px bg-rule">
              {PLACES.map((place) => {
                const on = places[place.key];
                return (
                  <label
                    key={place.key}
                    className={`flex cursor-pointer items-start gap-4 bg-paper p-4 transition-colors ${
                      on ? "!bg-surface" : ""
                    }`}
                  >
                    <input
                      type="checkbox" checked={on}
                      onChange={(e) => setPlaces({ ...places, [place.key]: e.target.checked })}
                      className="mt-1 h-4 w-4 accent-[var(--color-signal)]"
                    />
                    <span className="flex-1">
                      <span className="block font-display text-lg font-700 tracking-[-0.02em]">
                        {place.title}
                      </span>
                      <span className="block text-sm text-ink-soft">{place.blurb}</span>
                    </span>
                    <span className="tnum font-mono text-xs text-ink-faint">
                      {formatCredit(clickPrices[place.key])} / open
                    </span>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 font-mono text-xs text-ink-faint">Choose one or several.</p>
          </Panel>
        )}

        {step === 3 && (
          <Panel title="Add credit.">
            <div className="flex flex-col gap-5">
              {chosen.map((place) => (
                <div key={place.key}>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor={`amt-${place.key}`} className="eyebrow">{place.title}</label>
                    <span className="tnum font-mono text-xs text-ink-faint">
                      ≈ {Math.floor(cents(place.key) / clickPrices[place.key]).toLocaleString()} opens
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <div className="relative flex-1">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-ink-faint">$</span>
                      <input
                        id={`amt-${place.key}`} name={`amount-${place.key}`} inputMode="decimal" autoComplete="off" value={amounts[place.key] ?? ""}
                        onChange={(e) => setAmounts({ ...amounts, [place.key]: e.target.value })}
                        placeholder="0" className="field !pl-7"
                      />
                    </div>
                    {PRESETS.map((preset) => (
                      <button
                        key={preset} type="button"
                        onClick={() => setAmounts({ ...amounts, [place.key]: String(preset / 100) })}
                        className="btn btn-ghost !px-3 !py-2 !text-[0.6875rem]"
                      >
                        {formatCredit(preset)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="rule flex items-baseline justify-between pt-4">
                <span className="eyebrow">Total</span>
                <span className="tnum font-mono text-lg font-600">{formatCredit(total)}</span>
              </div>

              {signedIn && availableCents > 0 && (
                <p className="font-mono text-xs text-ink-faint">
                  You hold {formatCredit(availableCents)} in available credit.
                  {total > availableCents && " We'll ask Stripe for the difference."}
                </p>
              )}
              {!signedIn && (
                <p className="font-mono text-xs text-ink-faint">
                  You&rsquo;ll sign in on the next step — we keep what you&rsquo;ve entered.
                </p>
              )}
            </div>
          </Panel>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-4 font-mono text-xs text-signal">{error}</p>
      )}

      <div className="rule mt-8 flex items-center justify-between gap-3 pt-5">
        <button
          type="button" className="btn btn-ghost"
          onClick={() => (step === 0 ? router.push("/") : setStep((step - 1) as Step))}
          disabled={pending}
        >
          {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < 3 ? (
          <button
            type="button" className="btn" disabled={!canAdvance}
            onClick={() => setStep((step + 1) as Step)}
          >
            Continue
          </button>
        ) : signedIn ? (
          <button type="button" className="btn btn-signal !px-7" disabled={!canAdvance || pending} onClick={submit}>
            {pending ? "Going live\u2026" : "Go Live"}
          </button>
        ) : (
          <a className="btn btn-signal !px-7" href={`/sign-in?next=${encodeURIComponent("/add")}`}>
            Sign in to go live
          </a>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-tight font-700 tracking-[-0.03em] md:text-3xl">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
