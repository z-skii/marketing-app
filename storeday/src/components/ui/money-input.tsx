"use client";
import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { formatMoney, moneyToEditString, parseMoneyInput } from "@/lib/utils/currency";

export interface MoneyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "size"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  currency?: string;
  size?: "md" | "lg";
  /** Optional: called on Enter so parents can move focus. Default: focus next [data-nav] element. */
  onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  allowNegative?: boolean;
  bare?: boolean; // for grid cells
}

/**
 * Spreadsheet-fast currency field.
 * - Shows "$2,816.45" when blurred, raw "2816.45" while editing.
 * - Focus selects the whole value; typing replaces it.
 * - Enter moves to the next [data-nav] field (like Tab). No "$" typing needed.
 * - inputMode=decimal brings up the numeric keypad on phones.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onValueChange, currency = "USD", size = "md", onEnter, allowNegative = false, bare, className, onFocus, onBlur, onKeyDown, ...props }, ref,
) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const innerRef = React.useRef<HTMLInputElement | null>(null);
  const setRefs = (el: HTMLInputElement | null) => {
    innerRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
  };

  const display = editing ? draft : value == null ? "" : formatMoney(value, { currency });

  return (
    <input
      ref={setRefs}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      data-nav=""
      className={cn(bare ? "grid-cell" : "field-money", size === "lg" && !bare && "field-lg text-[17px]", className)}
      value={display}
      placeholder={props.placeholder ?? "0.00"}
      onFocus={(e) => {
        setDraft(moneyToEditString(value));
        setEditing(true);
        requestAnimationFrame(() => e.target.select());
        onFocus?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const re = allowNegative ? /^-?\d*\.?\d{0,2}$/ : /^\d*\.?\d{0,2}$/;
        const cleaned = raw.replace(/[$,\s]/g, "");
        if (cleaned === "" || re.test(cleaned)) {
          setDraft(cleaned);
          onValueChange(parseMoneyInput(cleaned));
        }
      }}
      onBlur={(e) => {
        setEditing(false);
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Enter") {
          e.preventDefault();
          if (onEnter) onEnter(e);
          else focusNextNav(e.currentTarget, e.shiftKey ? -1 : 1);
        }
      }}
      {...props}
    />
  );
});

/** Moves focus to the next/previous element with a data-nav attribute in DOM order. */
export function focusNextNav(from: HTMLElement, dir: 1 | -1 = 1) {
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-nav]:not([disabled])"));
  const i = all.indexOf(from);
  const next = all[i + dir];
  if (next) {
    next.focus();
    if (next instanceof HTMLInputElement) requestAnimationFrame(() => next.select());
  }
}
