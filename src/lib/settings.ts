import "server-only";
import { sql } from "./db";

/**
 * Operational settings live in the database so an admin can retune pricing and
 * capacity without a deploy. Values are cached briefly per server instance —
 * the click path reads them on every request.
 */

export type SettingsMap = Record<string, string>;

const DEFAULTS: Record<string, string> = {
  board_click_price_cents: "5",
  spot_click_price_cents: "5",
  bar_click_price_cents: "5",
  creator_commission_cents: "1",
  duplicate_click_window_hours: "24",
  board_reset_utc_hour: "0",
  spot_appearance_seconds: "60",
  spot_appearances_per_day: "10",
  spot_capacity: "144",
  bar_capacity: "100",
  creator_fraud_hold_days: "7",
  minimum_payout_cents: "2500",
  minimum_topup_cents: "500",
  maximum_topup_cents: "100000",
  feature_creator_program: "true",
  feature_spot_enabled: "true",
  feature_bar_enabled: "true",
};

const CACHE_MS = 10_000;
let cache: { at: number; value: SettingsMap } | null = null;

export async function getSettings(): Promise<SettingsMap> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  const rows = await sql<{ key: string; value: unknown }>(
    `select key, value #>> '{}' as value from app_settings`,
  );
  const value: SettingsMap = { ...DEFAULTS };
  for (const row of rows) value[row.key] = String(row.value);

  cache = { at: Date.now(), value };
  return value;
}

export function clearSettingsCache() {
  cache = null;
}

export async function settingInt(key: string): Promise<number> {
  const settings = await getSettings();
  return Number(settings[key] ?? DEFAULTS[key] ?? 0);
}

export async function settingBool(key: string): Promise<boolean> {
  const settings = await getSettings();
  return (settings[key] ?? DEFAULTS[key]) === "true";
}

export const SETTING_KEYS = Object.keys(DEFAULTS);
export { DEFAULTS as SETTING_DEFAULTS };
