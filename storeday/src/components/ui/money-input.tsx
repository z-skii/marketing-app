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

  // External value changes while focused (e.g. a restored draft) are adopted unless they merely differ in
  // formatting from what is being typed ("12." vs 12), so mid-keystroke text is never clobbered.
  const [seenValue, setSeenValue] = React.useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (editing && parseMoneyInput(draft) !== value) setDraft(moneyToEditString(value));
  }

  const display = editing ? draft : value == null ? "" : formatMoney(value, { currency });

  const beginEdit = React.useCallback(() => {
    if (!editing) {
      setDraft(moneyToEditString(value));
      setEditing(true);
    }
  }, [editing, value]);

  // Select the whole value synchronously after the "editing" render commits, so a keystroke that
  // arrives right after focus (fast typists, numpad, automation) replaces the value instead of
  // being swallowed by a late select(). Layout effects run before any queued input events.
  React.useLayoutEffect(() => {
    if (editing) innerRef.current?.select();
  }, [editing]);

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
        beginEdit();
        onFocus?.(e);
      }}
      onClick={(e) => {
        // Covers an autofocused field whose focus event fired before hydration.
        beginEdit();
        props.onClick?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const re = allowNegative ? /^-?\d*\.?\d{0,2}$/ : /^\d*\.?\d{0,2}$/;
        let cleaned = raw.replace(/[$,\s]/g, "");
        if (!editing) {
          // Typing into a formatted (non-editing) field: start fresh from the typed characters only.
          const formatted = value == null ? "" : formatMoney(value, { currency });
          const stripped = formatted.replace(/[$,\s]/g, "");
          if (cleaned.startsWith(stripped)) cleaned = cleaned.slice(stripped.length);
          else if (cleaned.endsWith(stripped)) cleaned = cleaned.slice(0, cleaned.length - stripped.length);
          setEditing(true);
        }
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
    // MoneyInput selects itself on focus; plain inputs get selected here.
    if (next instanceof HTMLInputElement && !next.hasAttribute("inputmode")) next.select();
  }
}
