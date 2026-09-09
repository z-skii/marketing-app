/** Currency formatting. Amounts are dollars (numbers). */
const formatters = new Map<string, Intl.NumberFormat>();

function fmt(currency: string, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    formatters.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number | null | undefined, opts: { currency?: string; compact?: boolean; signed?: boolean } = {}): string {
  const currency = opts.currency ?? "USD";
  if (amount == null || Number.isNaN(amount)) return "—";
  const digits = opts.compact ? 0 : 2;
  const s = fmt(currency, digits).format(opts.compact ? Math.round(amount) : amount);
  if (opts.signed && amount > 0) return `+${s}`;
  return s;
}

/** "$4,821" style for cards and rankings. */
export function formatMoneyCompact(amount: number | null | undefined, currency = "USD"): string {
  return formatMoney(amount, { currency, compact: true });
}

/** Parse what a user typed into dollars. Accepts "2816.45", "2,816.45", "$2816", "" → null. */
export function parseMoneyInput(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

/** Plain number for editing: 2816.45 → "2816.45", 410 → "410". */
export function moneyToEditString(amount: number | null | undefined): string {
  if (amount == null) return "";
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, "");
}

export function formatPct(value: number | null | undefined, opts: { signed?: boolean; digits?: number } = {}): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const digits = opts.digits ?? 1;
  const s = `${Math.abs(value).toFixed(digits)}%`;
  if (opts.signed) return value > 0 ? `+${s}` : value < 0 ? `-${s}` : s;
  return value < 0 ? `-${s}` : s;
}
