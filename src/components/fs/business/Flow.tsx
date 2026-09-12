"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft } from "@phosphor-icons/react";

/**
 * The Frame Shift guided flow: one decision at a time. The source (the
 * reference, the creative, the car) stays in view; the decisions already
 * made sit under it as a short ledger the business can reopen; the current
 * question stands alone with one Continue. Nothing financially important
 * is ever hidden: the ledger always shows pay, spots and the deadline once
 * they exist.
 */
export type FlowStep = { key: string; label: string; summary?: string | null };

export function FlowShell({ title, kind, back, steps, index, onJump, source, commitment, error, children, continueLabel = "Continue", canContinue, onContinue, onBack, pending = false, review = false }: {
  title: string; kind: string; back: { href: string; label: string };
  steps: FlowStep[]; index: number; onJump: (i: number) => void;
  source: ReactNode; commitment?: ReactNode; error?: string | null; children: ReactNode;
  continueLabel?: string; canContinue: boolean; onContinue: () => void; onBack: () => void; pending?: boolean; review?: boolean;
}) {
  const step = steps[index];
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: false }); }, [index]);
  const decided = steps.slice(0, index).filter((s) => s.summary);
  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <Link href={back.href} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}><ArrowLeft size={20} aria-hidden /> {back.label}</Link>
        <span className="fs-t-meta">{kind}</span>
      </div>
      <div className="fs-detail fs-flow">
        <div className="fs-detail-source">
          <h1 className="fs-t-page fs-flow-title">{title}</h1>
          <div className="fs-flow-source">{source}</div>
          {commitment && <div className="fs-flow-commitment">{commitment}</div>}
          {decided.length > 0 && !review && (
            <ol className="fs-flow-ledger" aria-label="Decided so far">
              {decided.map((s) => {
                const i = steps.indexOf(s);
                return (
                  <li key={s.key}>
                    <button type="button" className="fs-flow-ledger-row" onClick={() => onJump(i)} aria-label={`${s.label}: ${s.summary}. Change`}>
                      <span className="fs-t-meta">{s.label}</span>
                      <span className="fs-t-body fs-tnum" style={{ fontWeight: 500 }}>{s.summary}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <div className="fs-flow-step" aria-live="polite">
          <p className="fs-t-meta fs-tnum">Step {index + 1} of {steps.length}{review ? " · Review" : ""}</p>
          <h2 ref={heading} tabIndex={-1} className="fs-t-section fs-flow-question" style={{ marginTop: 4, outline: "none" }}>{step.label}</h2>
          <div className={review ? "fs-plane fs-flow-review" : undefined} style={{ marginTop: 16 }}>{children}</div>
          {error && <p role="alert" className="fs-field-error" style={{ marginTop: 16 }}>{error}</p>}
          <div className="fs-flow-actions">
            <button type="button" className="fs-btn fs-btn-primary" disabled={!canContinue || pending} onClick={onContinue}>{pending ? "Working" : continueLabel}</button>
            {index > 0 && <button type="button" className="fs-btn fs-btn-quiet fs-link-ink" disabled={pending} onClick={onBack}>Back</button>}
          </div>
        </div>
      </div>
    </main>
  );
}

/** A labelled field with room for one short explanation under it. */
export function Field({ id, label, hint, children, error }: { id: string; label: string; hint?: string; children: ReactNode; error?: string | null }) {
  return (
    <div style={{ marginTop: 12 }}>
      <label htmlFor={id} className="fs-field-label">{label}</label>
      {children}
      {hint && !error && <p className="fs-t-meta" style={{ marginTop: 4 }}>{hint}</p>}
      {error && <p className="fs-field-error" style={{ marginTop: 4 }}>{error}</p>}
    </div>
  );
}

/** Choices shown as real radio inputs styled as rows, so a keyboard user gets arrow keys for free. */
export function ChoiceRows<T extends string>({ name, value, onChange, options }: {
  name: string; value: T | null; onChange: (v: T) => void;
  options: { value: T; label: string; detail?: string; media?: ReactNode }[];
}) {
  return (
    <div className="fs-choice-rows" role="radiogroup">
      {options.map((o) => (
        <label key={o.value} className={`fs-choice-row${value === o.value ? " is-selected" : ""}`}>
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="fs-sr" />
          {o.media && <span className="fs-choice-media">{o.media}</span>}
          <span style={{ minWidth: 0 }}>
            <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{o.label}</span>
            {o.detail && <span className="fs-t-meta" style={{ display: "block" }}>{o.detail}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Multiple choices as real checkboxes styled as rows. */
export function CheckRows<T extends string>({ values, onChange, options, noun }: {
  values: readonly T[]; onChange: (v: T[]) => void;
  options: { value: T; label: string; detail?: string; media?: ReactNode | ((selected: boolean) => ReactNode) }[]; noun?: string;
}) {
  const toggle = (v: T) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div>
      {noun && <p className="fs-t-meta" aria-live="polite">{values.length} {noun}{values.length === 1 ? "" : "s"} selected</p>}
      <div className="fs-choice-rows">
        {options.map((o) => {
          const on = values.includes(o.value);
          const media = typeof o.media === "function" ? o.media(on) : o.media;
          return (
            <label key={o.value} className={`fs-choice-row is-check${on ? " is-selected" : ""}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(o.value)} className="fs-check-input" />
              {media && <span className="fs-choice-media">{media}</span>}
              <span style={{ minWidth: 0 }}>
                <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{o.label}</span>
                {o.detail && <span className="fs-t-meta" style={{ display: "block" }}>{o.detail}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** The pay a flow commits to, attached to the source: the amount first, its basis, then the total if every spot is filled. */
export function Commitment({ cents, basis, total, totalLabel }: { cents: number; basis: string; total?: number; totalLabel?: string }) {
  const money = (c: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(c / 100);
  return (
    <div className="fs-commit-caption">
      <span className="fs-commit-amount">{money(cents)}</span>
      <span className="fs-t-meta" style={{ display: "block" }}>{basis}</span>
      {total != null && totalLabel && <span className="fs-t-body fs-tnum" style={{ display: "block", marginTop: 4 }}>{money(total)} <span className="fs-t-meta">{totalLabel}</span></span>}
    </div>
  );
}

/** Dollars typed as a whole number; cents are shown next to it so the money is never ambiguous. */
export function DollarInput({ id, value, onChange, min, max, placeholder }: { id: string; value: string; onChange: (v: string) => void; min: number; max: number; placeholder?: string }) {
  return (
    <span className="fs-dollar">
      <span aria-hidden>$</span>
      <input id={id} className="fs-input fs-tnum" inputMode="numeric" pattern="[0-9]*" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))} aria-describedby={`${id}-range`} />
      <span id={`${id}-range`} className="fs-t-meta">${min.toLocaleString()} to ${max.toLocaleString()}</span>
    </span>
  );
}
