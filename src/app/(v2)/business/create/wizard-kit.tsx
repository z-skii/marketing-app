"use client";

import Link from "next/link";
import { Money } from "@/components/v2/ui";

/**
 * The parts the three campaign wizards share: lime progress segments, one
 * question per screen, a back/next bar that stays reachable on a phone, and
 * the final publish-or-draft pair. Errors from the server action render
 * inline; a credit shortfall links straight to billing.
 */

export const LABEL = "text-sm text-ink-soft";

export function WizardFrame({
  step, total, title, hint, children, canNext, onBack, onNext,
  onPublish, onDraft, pending, error, publishNote,
}: {
  step: number;
  total: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
  canNext: boolean;
  onBack: () => void;
  onNext: () => void;
  onPublish: () => void;
  onDraft: () => void;
  pending: boolean;
  error: string | null;
  publishNote?: React.ReactNode;
}) {
  const last = step === total - 1;
  const creditError = error ? /credit/i.test(error) : false;
  return (
    <div>
      <div className="flex items-center gap-1.5" aria-hidden>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-signal" : "bg-surface-2"}`} />
        ))}
      </div>
      <p className="mt-3 text-sm text-ink-faint">Step {step + 1} of {total}</p>
      <h1 className="mt-2 font-display text-[1.75rem] leading-[1.05] font-800 tracking-[-0.03em] md:text-[2rem]">{title}</h1>
      {hint && <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">{hint}</p>}
      <div className="mt-5">{children}</div>

      {last && publishNote && <div className="mt-5 text-sm text-ink-soft">{publishNote}</div>}

      {error && (
        <p role="alert" className="mt-4 text-sm text-signal">
          {error}
          {creditError && (
            <>
              {" "}
              <Link href="/business/billing" className="font-display font-700 underline underline-offset-2">Add credit →</Link>
            </>
          )}
        </p>
      )}

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-30 mt-6 md:static md:mt-8">
        <div className="glass flex items-center gap-2 rounded-[var(--radius-card)] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] md:bg-transparent md:p-0 md:shadow-none md:[backdrop-filter:none]">
          {step > 0 ? (
            <button type="button" className="btn btn-ghost" onClick={onBack} disabled={pending}>
              ← Back
            </button>
          ) : (
            <Link href="/business/create" className="btn btn-ghost">← Back</Link>
          )}
          {!last ? (
            <button type="button" disabled={!canNext} className="btn btn-signal btn-lg ml-auto min-w-32" onClick={onNext}>
              Next
            </button>
          ) : (
            <span className="ml-auto flex gap-2">
              <button type="button" disabled={pending} className="btn btn-lg" onClick={onDraft}>
                Save draft
              </button>
              <button type="button" disabled={pending} className="btn btn-signal btn-lg" onClick={onPublish}>
                {pending ? "Working…" : "Publish"}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** A row of preset amounts; the picked one is lime. */
export function Presets({
  options, value, onPick, format = (n) => `$${n}`, label,
}: { options: number[]; value: number | null; onPick: (n: number) => void; format?: (n: number) => string; label: string }) {
  return (
    <div className="pill-row" role="group" aria-label={label}>
      {options.map((n) => (
        <button key={n} type="button" aria-pressed={value === n} className="pill" onClick={() => onPick(n)}>
          {format(n)}
        </button>
      ))}
    </div>
  );
}

/** Dollar input with the lime sign in front. */
export function DollarField({
  value, onChange, placeholder, label,
}: { value: string; onChange: (v: string) => void; placeholder?: string; label: string }) {
  return (
    <label className="flex items-center gap-3">
      <span className="font-display text-[1.75rem] font-800 tracking-[-0.03em] text-signal" aria-hidden>$</span>
      <input
        className="field flex-1 text-lg" inputMode="decimal" value={value} aria-label={label}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={placeholder}
      />
    </label>
  );
}

/** Whole-number input (spots, cars). */
export function CountField({
  value, onChange, label, placeholder,
}: { value: string; onChange: (v: string) => void; label: string; placeholder?: string }) {
  return (
    <input
      className="field text-lg" inputMode="numeric" value={value} aria-label={label}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} placeholder={placeholder}
    />
  );
}

/** Tap-to-toggle chips. */
export function ChipToggles({
  options, selected, onToggle, label, labelOf = (s) => s,
}: { options: string[]; selected: string[]; onToggle: (s: string) => void; label: string; labelOf?: (s: string) => string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} type="button" aria-pressed={selected.includes(o)} className="pill" onClick={() => onToggle(o)}>
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

/** The big number a money step is about, with its plain-words label. */
export function MoneyPreview({ cents, suffix, sub }: { cents: number; suffix?: string; sub?: string }) {
  return (
    <div className="card mt-4 p-5">
      <Money cents={cents} size="hero" suffix={suffix} />
      {sub && <p className="mt-2 text-sm text-ink-soft">{sub}</p>}
    </div>
  );
}

/** Summary rows on the publish step. */
export function SummaryList({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="card divide-y-0 p-4">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-4 py-1.5">
          <dt className="text-sm text-ink-soft">{k}</dt>
          <dd className="text-right font-display text-[0.9375rem] font-700">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function fmtDay(value: string) {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
