/**
 * Money helpers. Every amount in this codebase is an integer number of cents —
 * there are no floating point dollars anywhere in the system.
 */

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** "$83" for whole dollars, "$0.05" when the cents matter. */
export function formatCredit(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const body =
    abs % 100 === 0
      ? `$${(abs / 100).toLocaleString("en-US")}`
      : `$${(abs / 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
  return negative ? `-${body}` : body;
}

/** Compact form for dense rows: $1.2k, $83. */
export function formatCreditCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}k`;
  }
  return formatCredit(cents);
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** Parse a user-typed dollar amount into cents, or null if it is not valid. */
export function parseDollarsToCents(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const cents = Math.round(Number(cleaned) * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

/** How many opens a balance buys at the current click price. */
export function estimatedOpens(cents: number, priceCents: number): number {
  if (priceCents <= 0) return 0;
  return Math.floor(cents / priceCents);
}
