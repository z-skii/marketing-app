import { round2, type Money } from "./accounting";

/**
 * Payroll ESTIMATE. Not a payroll system: no taxes, no withholdings.
 * Overtime: weekly hours above `weeklyThresholdHours` (and optionally daily hours above
 * `dailyThresholdHours`) are paid at `multiplier` × rate.
 */
export interface OvertimeRules {
  enabled: boolean;
  weeklyThresholdHours: number;   // e.g. 40
  dailyThresholdHours: number | null; // e.g. 8, or null
  multiplier: number;             // e.g. 1.5
  weekStartsOn: number;           // 0 = Sunday
}

export const DEFAULT_OT_RULES: OvertimeRules = {
  enabled: true, weeklyThresholdHours: 40, dailyThresholdHours: null, multiplier: 1.5, weekStartsOn: 1,
};

export interface PayrollShift {
  employee_id: string;
  business_date: string; // YYYY-MM-DD
  worked_minutes: number;
  hourly_rate: number;
}

export interface EmployeePayroll {
  employee_id: string;
  regularMinutes: number;
  overtimeMinutes: number;
  totalMinutes: number;
  rate: number;            // latest rate seen
  regularPay: Money;
  overtimePay: Money;
  grossPay: Money;
  shifts: number;
}

/** ISO week key honoring the configured week start. */
export function weekKey(date: string, weekStartsOn: number): string {
  const d = new Date(date + "T00:00:00Z");
  const day = d.getUTCDay();
  const diff = (day - weekStartsOn + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function estimatePayroll(shifts: PayrollShift[], rules: OvertimeRules = DEFAULT_OT_RULES): EmployeePayroll[] {
  const byEmployee = new Map<string, PayrollShift[]>();
  for (const s of shifts) {
    if (!byEmployee.has(s.employee_id)) byEmployee.set(s.employee_id, []);
    byEmployee.get(s.employee_id)!.push(s);
  }
  const out: EmployeePayroll[] = [];
  for (const [employee_id, list] of byEmployee) {
    list.sort((a, b) => a.business_date.localeCompare(b.business_date));
    let regularMinutes = 0, overtimeMinutes = 0, regularPay = 0, overtimePay = 0;
    const weekMinutes = new Map<string, number>();
    const dayMinutes = new Map<string, number>();
    for (const s of list) {
      const minutes = Math.max(0, s.worked_minutes);
      let ot = 0;
      if (rules.enabled) {
        if (rules.dailyThresholdHours != null) {
          const before = dayMinutes.get(s.business_date) ?? 0;
          const dailyCap = rules.dailyThresholdHours * 60;
          ot = Math.max(ot, Math.max(0, before + minutes - Math.max(dailyCap, before)));
          dayMinutes.set(s.business_date, before + minutes);
        }
        const wk = weekKey(s.business_date, rules.weekStartsOn);
        const before = weekMinutes.get(wk) ?? 0;
        const weeklyCap = rules.weeklyThresholdHours * 60;
        ot = Math.max(ot, Math.max(0, before + minutes - Math.max(weeklyCap, before)));
        weekMinutes.set(wk, before + minutes);
      }
      const reg = minutes - ot;
      regularMinutes += reg;
      overtimeMinutes += ot;
      regularPay += (reg / 60) * s.hourly_rate;
      overtimePay += (ot / 60) * s.hourly_rate * rules.multiplier;
    }
    out.push({
      employee_id, regularMinutes, overtimeMinutes, totalMinutes: regularMinutes + overtimeMinutes,
      rate: list[list.length - 1]?.hourly_rate ?? 0,
      regularPay: round2(regularPay), overtimePay: round2(overtimePay), grossPay: round2(regularPay + overtimePay),
      shifts: list.length,
    });
  }
  return out;
}
