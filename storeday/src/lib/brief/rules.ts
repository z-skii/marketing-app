import { formatMoney } from "@/lib/utils/currency";
import { formatTime, fromISODate, addISODays, minutesBetween } from "@/lib/utils/time";
import { pctChange, round2 } from "@/lib/calc/accounting";
import { format } from "date-fns";
import type { BriefGenerator, BriefInput, BriefItem, BriefStoreInput, BriefStoreSummary, DailyBrief } from "./types";

type Rule = (store: BriefStoreInput, input: BriefInput) => BriefItem[];

const STILL_CLOCKED_IN_HOURS = 12;
const SALES_SWING_PCT = 15;

/** "HH:mm" comparison helper; settings times are "HH:MM:SS". */
function pastTime(localTime: string, hhmmss: string | null, offsetMinutes = 0): boolean {
  if (!hhmmss) return false;
  const [h, m] = hhmmss.split(":").map(Number);
  const target = h * 60 + m + offsetMinutes;
  const [ch, cm] = localTime.split(":").map(Number);
  return ch * 60 + cm > target;
}

const quickClose = (loc: string, date: string) => `/accounting/quick-close?location=${loc}&date=${date}`;
const dayHref = (loc: string, date: string) => `/accounting/day/${loc}/${date}`;

const cashRule: Rule = (s, input) => {
  const diff = s.accounting?.cash_difference;
  if (diff == null || diff === 0) return [];
  const amount = formatMoney(Math.abs(diff), { currency: input.currency });
  if (diff < 0) {
    return [{ kind: "cash_short", severity: "warn", locationId: s.location.id, message: `${s.location.name} was ${amount} short.`, href: dayHref(s.location.id, input.date) }];
  }
  return [{ kind: "cash_over", severity: "info", locationId: s.location.id, message: `${s.location.name} was ${amount} over.`, href: dayHref(s.location.id, input.date) }];
};

const closeoutRule: Rule = (s, input) => {
  const out: BriefItem[] = [];
  const requires = s.settings?.require_accounting_closeout ?? true;
  if (!requires) return out;
  const isToday = input.date >= s.localToday;
  const closedToday = s.accounting?.status === "closed";
  if (isToday) {
    // Yesterday's closeout is the thing that can actually be missing this morning.
    const y = s.previousDay;
    if (y && y.status !== "closed") {
      const yDate = addISODays(input.date, -1);
      out.push({ kind: "missing_closeout", severity: "warn", locationId: s.location.id, message: `${s.location.name} was not closed out yesterday.`, href: quickClose(s.location.id, yDate) });
    }
    if (!closedToday && pastTime(s.localTime, s.settings?.closes_at ?? null, 90)) {
      out.push({ kind: "not_closed_yet", severity: "warn", locationId: s.location.id, message: `${s.location.name} has not closed out yet.`, href: quickClose(s.location.id, input.date) });
    } else if (!closedToday && (s.activeShifts.length > 0 || s.accounting)) {
      out.push({ kind: "not_closed_yet", severity: "info", locationId: s.location.id, message: `${s.location.name} has not closed out yet.`, href: quickClose(s.location.id, input.date) });
    }
  } else if (!closedToday) {
    out.push({ kind: "missing_closeout", severity: "warn", locationId: s.location.id, message: `${s.location.name} was not closed out.`, href: quickClose(s.location.id, input.date) });
  }
  return out;
};

const checklistRule: Rule = (s, input) => {
  const out: BriefItem[] = [];
  const isToday = input.date >= s.localToday;
  if (s.settings?.require_closing_checklist && s.status?.closing_checklist_status !== "completed") {
    if (!isToday || pastTime(s.localTime, s.settings.closes_at)) {
      out.push({ kind: "missing_closing_checklist", severity: "warn", locationId: s.location.id, message: `${s.location.name} closing checklist was not completed.`, href: "/store-check" });
    }
  }
  if (s.settings?.require_opening_checklist && s.status?.opening_checklist_status !== "completed") {
    if (!isToday || pastTime(s.localTime, s.settings.opens_at, 45)) {
      out.push({ kind: "missing_opening_checklist", severity: "info", locationId: s.location.id, message: `${s.location.name} opening checklist was not completed.`, href: "/store-check" });
    }
  }
  return out;
};

const notOpenedRule: Rule = (s, input) => {
  if (input.date !== s.localToday) return [];
  if (!s.settings?.opens_at || !pastTime(s.localTime, s.settings.opens_at, 45)) return [];
  if (s.status?.opened_at || s.activeShifts.length > 0 || s.accounting) return [];
  return [{ kind: "store_not_opened", severity: "warn", locationId: s.location.id, message: `${s.location.name} has not opened.`, href: "/working" }];
};

const flaggedShiftsRule: Rule = (s) =>
  s.flaggedShifts.flatMap((sh): BriefItem[] => {
    const base = { locationId: s.location.id, shiftId: sh.id, href: `/shifts/${sh.id}` };
    if (sh.verification_status === "location_issue") return [{ ...base, kind: "outside_radius", severity: "warn", message: `${sh.employee_name} clocked in outside the allowed radius.` }];
    if (sh.verification_status === "missing_photo") return [{ ...base, kind: "missing_photo", severity: "info", message: `${sh.employee_name} clocked in without a photo.` }];
    if (sh.verification_status === "needs_review") return [{ ...base, kind: "needs_review", severity: "info", message: `${sh.employee_name} has a shift that needs review.` }];
    return [];
  });

const stillClockedInRule: Rule = (s, input) => {
  if (input.date < s.localToday) return [];
  const now = new Date();
  return s.activeShifts.flatMap((sh): BriefItem[] => {
    const mins = minutesBetween(sh.clock_in_at, now);
    const since = formatTime(sh.clock_in_at, s.location.timezone);
    const base = { locationId: s.location.id, shiftId: sh.id, href: `/shifts/${sh.id}` };
    if (mins >= STILL_CLOCKED_IN_HOURS * 60 || sh.business_date < s.localToday) {
      return [{ ...base, kind: "still_clocked_in", severity: "warn", message: `${sh.employee_name} is still clocked in (since ${since}).` }];
    }
    if (pastTime(s.localTime, s.settings?.closes_at ?? null, 30)) {
      return [{ ...base, kind: "clocked_in_after_close", severity: "info", message: `${sh.employee_name} is still clocked in (since ${since}).` }];
    }
    return [];
  });
};

const salesVsLastWeekRule: Rule = (s, input) => {
  const sales = s.accounting?.total_sales ?? 0;
  if (!s.accounting?.daily_report_id || sales <= 0 || s.lastWeekSales == null || s.lastWeekSales <= 0) return [];
  const pct = pctChange(sales, s.lastWeekSales);
  if (pct == null || Math.abs(pct) < SALES_SWING_PCT) return [];
  const weekday = format(fromISODate(input.date), "EEEE");
  const dir = pct > 0 ? "higher" : "lower";
  return [{
    kind: "sales_vs_last_week", severity: pct > 0 ? "good" : "warn", locationId: s.location.id,
    message: `${s.location.name} sales were ${Math.abs(Math.round(pct))}% ${dir} than last ${weekday}.`,
    href: dayHref(s.location.id, input.date),
  }];
};

export const BRIEF_RULES: Rule[] = [cashRule, closeoutRule, checklistRule, notOpenedRule, flaggedShiftsRule, stillClockedInRule, salesVsLastWeekRule];

const SEVERITY_ORDER: Record<BriefItem["severity"], number> = { warn: 0, info: 1, good: 2 };

export function summarizeStore(s: BriefStoreInput): BriefStoreSummary {
  const a = s.accounting;
  const sales = a?.total_sales ?? 0;
  return {
    id: s.location.id,
    name: s.location.name,
    sales,
    profit: a?.profit ?? 0,
    labor: a?.labor_total ?? 0,
    cashDifference: a?.cash_difference ?? null,
    status: a?.status === "closed" ? "closed" : a?.daily_report_id ? "open" : "none",
    vsLastWeek: sales > 0 && a?.daily_report_id ? pctChange(sales, s.lastWeekSales) : null,
    working: s.activeShifts.length,
  };
}

/** Deterministic, explainable brief. Every sentence maps to one rule above. */
export class RuleBasedBriefGenerator implements BriefGenerator {
  async generate(input: BriefInput): Promise<DailyBrief> {
    const attention = input.stores
      .flatMap((s) => BRIEF_RULES.flatMap((rule) => rule(s, input)))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
    const stores = input.stores.map(summarizeStore);
    return {
      date: input.date,
      generator: "rules",
      stats: {
        storesReported: stores.filter((s) => s.status === "closed").length,
        storesTotal: stores.length,
        totalSales: round2(stores.reduce((a, s) => a + s.sales, 0)),
        profit: round2(stores.reduce((a, s) => a + s.profit, 0)),
        employees: input.employeesWorked,
        labor: round2(stores.reduce((a, s) => a + s.labor, 0)),
      },
      attention,
      stores,
    };
  }
}
