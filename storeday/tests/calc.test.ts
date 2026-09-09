import { describe, expect, it } from "vitest";
import { computeDailyTotals, expectedClosingCash, groupDetailedExpenses, isReadyToClose, pctChange, round2, shiftLaborCost, summarizeLabor } from "@/lib/calc/accounting";
import { estimatePayroll, weekKey } from "@/lib/calc/payroll";
import { distanceMeters, isWithinRadius } from "@/lib/calc/geo";
import { formatMoney, parseMoneyInput, moneyToEditString } from "@/lib/utils/currency";
import { resolveRange, previousRange, weeksInRange, formatMinutes, todayIn } from "@/lib/utils/time";

describe("accounting calculations (spec example)", () => {
  it("computes the spec's Quick Close example exactly", () => {
    // Cash 2816.45 + Card 3194.82 = 6011.27; goods 410 + 875 = 1285; labor 351; other 35 → expenses 1671 → profit 4340.27
    const t = computeDailyTotals(
      { cash_sales: 2816.45, card_sales: 3194.82, other_sales: null, cash_goods: 410, check_goods: 875, utilities: 0, other_expenses: 35, expected_cash: 2840, actual_cash: 2836 },
      { employeeCount: 3, minutes: 1392, cost: 351 },
    );
    expect(t.totalSales).toBe(6011.27);
    expect(t.goodsTotal).toBe(1285);
    expect(t.laborTotal).toBe(351);
    expect(t.totalExpenses).toBe(1671);
    expect(t.profit).toBe(4340.27);
    expect(t.marginPct).toBe(72.2);
    expect(t.cashDifference).toBe(-4);
  });
  it("adds detailed expenses into the right buckets", () => {
    const detailed = groupDetailedExpenses([
      { amount: 100, bucket: "goods" }, { amount: 50, bucket: "utilities" }, { amount: 25.5, bucket: "other" }, { amount: 999, bucket: "other", status: "expected" },
    ]);
    expect(detailed).toEqual({ goods: 100, labor: 0, utilities: 50, other: 25.5 });
    const t = computeDailyTotals({ cash_sales: 1000, card_sales: 0 }, undefined, detailed);
    expect(t.totalExpenses).toBe(175.5);
    expect(t.profit).toBe(824.5);
  });
  it("labor = minutes × rate, rounded to cents", () => {
    expect(shiftLaborCost(494, 15)).toBe(123.5);
    expect(shiftLaborCost(492, 15)).toBe(123);
    const s = summarizeLabor([
      { employee_id: "a", worked_minutes: 492, labor_cost: 123, status: "completed" },
      { employee_id: "b", worked_minutes: 540, labor_cost: 144, status: "completed" },
      { employee_id: "c", worked_minutes: 360, labor_cost: 84, status: "completed" },
      { employee_id: "d", worked_minutes: null, labor_cost: null, status: "active" },
    ]);
    expect(s).toEqual({ employeeCount: 3, minutes: 1392, cost: 351 });
  });
  it("avoids floating point drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(computeDailyTotals({ cash_sales: 0.1, card_sales: 0.2 }).totalSales).toBe(0.3);
  });
  it("expected cash and readiness", () => {
    expect(expectedClosingCash({ startingCash: 200, cashSales: 2816.45, cashGoods: 410 })).toBe(2606.45);
    expect(isReadyToClose({ cash_sales: 1, card_sales: 0 })).toBe(true);
    expect(isReadyToClose({ cash_sales: 1, card_sales: null })).toBe(false);
    expect(pctChange(110, 100)).toBe(10);
    expect(pctChange(110, 0)).toBeNull();
  });
});

describe("payroll estimate", () => {
  it("applies weekly overtime at 1.5×", () => {
    const shifts = Array.from({ length: 5 }, (_, i) => ({ employee_id: "john", business_date: `2026-09-0${i + 1}`, worked_minutes: 9 * 60, hourly_rate: 15 }));
    const [p] = estimatePayroll(shifts, { enabled: true, weeklyThresholdHours: 40, dailyThresholdHours: null, multiplier: 1.5, weekStartsOn: 1 });
    expect(p.regularMinutes).toBe(40 * 60);
    expect(p.overtimeMinutes).toBe(5 * 60);
    expect(p.grossPay).toBe(600 + 5 * 22.5);
  });
  it("week keys honour the configured start day", () => {
    expect(weekKey("2026-09-09", 1)).toBe("2026-09-07"); // Wednesday → Monday
    expect(weekKey("2026-09-09", 0)).toBe("2026-09-06"); // → Sunday
  });
});

describe("geo", () => {
  it("measures distance and radius with accuracy tolerance", () => {
    const d = distanceMeters(36.0999, -78.3012, 36.1009, -78.3012);
    expect(Math.round(d)).toBe(111);
    expect(isWithinRadius(100, 90, 15)).toBe(true);
    expect(isWithinRadius(200, 90, 500)).toBe(false); // accuracy tolerance capped at 50
  });
});

describe("currency + time utils", () => {
  it("formats and parses money", () => {
    expect(formatMoney(2816.45)).toBe("$2,816.45");
    expect(parseMoneyInput("$2,816.45")).toBe(2816.45);
    expect(parseMoneyInput("")).toBeNull();
    expect(moneyToEditString(410)).toBe("410");
    expect(moneyToEditString(2816.45)).toBe("2816.45");
  });
  it("resolves ranges and weeks", () => {
    const r = resolveRange("this_week", "2026-09-09", 1);
    expect(r).toMatchObject({ from: "2026-09-07", to: "2026-09-09" });
    expect(previousRange({ from: "2026-09-07", to: "2026-09-09" })).toEqual({ from: "2026-09-04", to: "2026-09-06" });
    const weeks = weeksInRange({ from: "2026-09-01", to: "2026-09-30" }, 1);
    expect(weeks[0]).toMatchObject({ from: "2026-09-01", to: "2026-09-06" });
    expect(weeks[weeks.length - 1].to).toBe("2026-09-30");
    expect(formatMinutes(494)).toBe("8h 14m");
    expect(todayIn("America/New_York", new Date("2026-09-09T02:30:00Z"))).toBe("2026-09-08");
  });
});
