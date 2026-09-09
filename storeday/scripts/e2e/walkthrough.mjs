/**
 * End-to-end walkthrough against the local Supabase-compatible dev server.
 * Usage: node scripts/e2e/walkthrough.mjs [baseUrl]
 * Expects: `npm run local:supabase` on :54321 and `npm run dev:local` on :3000 (or baseUrl).
 * Signs up an owner, completes onboarding, loads demo data, visits every page (desktop + mobile),
 * runs Quick Close end to end, and fails on any server error / client console error.
 */
import { chromium } from "playwright-core";
import fs from "node:fs";

const base = process.argv[2] ?? "http://localhost:3000";
const exe = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const shots = "/tmp/storeday-shots"; fs.mkdirSync(shots, { recursive: true });
const stamp = Date.now();
const email = `owner${stamp}@local.test`;
const problems = [];

const b = await chromium.launch({ executablePath: exe });
const ctx = await b.newContext({ viewport: { width: 1360, height: 900 }, permissions: ["geolocation", "camera"], geolocation: { latitude: 36.0999, longitude: -78.3012 } });
const p = await ctx.newPage();
p.on("console", (m) => { if (m.type() === "error" && !/favicon|realtime|websocket|WebSocket|sw.js|Failed to load resource: the server responded with a status of 404/i.test(m.text())) problems.push(`console@${p.url()}: ${m.text().slice(0, 300)}`); });
p.on("pageerror", (e) => problems.push(`pageerror@${p.url()}: ${e.message.slice(0, 300)}`));

async function visit(path, name, { mobile = false } = {}) {
  const res = await p.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  const status = res?.status();
  const body = await p.locator("body").innerText().catch(() => "");
  if (!status || status >= 500) problems.push(`HTTP ${status} on ${path}`);
  if (/Application error|Unhandled Runtime Error|Internal Server Error|This page could not be found/i.test(body)) problems.push(`Error page on ${path}: ${body.slice(0, 160).replace(/\n/g, " ")}`);
  await p.screenshot({ path: `${shots}/${name}${mobile ? "-mobile" : ""}.png`, fullPage: true });
  console.log(`${status} ${path}`);
  return body;
}

// Sign up
await p.goto(base + "/sign-up");
await p.fill("input[name=full_name]", "Alex Owner");
await p.fill("input[name=email]", email);
await p.fill("input[name=password]", "Password123!");
await p.click("button[type=submit]");
await p.waitForURL(/onboarding/, { timeout: 60000 });
console.log("signed up →", p.url());

// Onboarding: business
await p.fill("input[name=name]", "Test Stores LLC");
await p.click("button[type=submit]");
await p.waitForTimeout(2500);
await visit("/onboarding", "onboarding-store");
// store
await p.fill("input[name=name]", "Mr Tobacco");
await p.fill("input[name=address_line1]", "310 S Bickett Blvd");
await p.fill("input[name=city]", "Louisburg");
await p.fill("input[name=state]", "NC");
await p.fill("input[name=postal_code]", "27549");
await p.fill("input[name=latitude]", "36.0999");
await p.fill("input[name=longitude]", "-78.3012");
await p.click("button[type=submit]");
await p.waitForTimeout(3000);
await visit("/onboarding", "onboarding-accounting");
await p.click("button[type=submit]");
await p.waitForTimeout(2500);
await visit("/onboarding", "onboarding-employees");
// add one employee
await p.fill("input[name=first_name]", "John");
await p.fill("input[name=last_name]", "Carter");
await p.fill("input[name=email]", `john${stamp}@local.test`);
await p.fill("input[name=hourly_rate]", "15");
await p.click("form button[type=submit]:has-text('Add employee')");
await p.waitForTimeout(2500);
await p.click("button:has-text('Continue'), button:has-text('Skip for now')");
await p.waitForTimeout(2500);
await visit("/onboarding", "onboarding-clock");
await p.click("button[type=submit]");
await p.waitForURL(/dashboard/, { timeout: 60000 });
console.log("onboarding done →", p.url());
await visit("/dashboard", "dashboard-empty");

// Load demo data from Settings → Data
const dataPage = await visit("/settings/data", "settings-data");
const demoBtn = p.locator("button:has-text('Load demo data'), button:has-text('demo')").first();
if (await demoBtn.count()) {
  await demoBtn.click();
  const confirm = p.locator("button:has-text('Confirm'), button:has-text('Load')").last();
  if (await confirm.count()) await confirm.click().catch(() => {});
  await p.waitForTimeout(8000);
} else problems.push("No 'Load demo data' button found on /settings/data: " + dataPage.slice(0, 200));

const pages = [
  ["/dashboard", "dashboard"], ["/dashboard?range=this_month", "dashboard-month"], ["/accounting", "accounting"],
  ["/accounting/quick-close", "quick-close"], ["/accounting/rapid-entry", "rapid-entry"], ["/accounting/month", "month-view"],
  ["/stores", "stores"], ["/employees", "employees"], ["/employees/payroll", "payroll"], ["/working", "working"],
  ["/schedule", "schedule"], ["/expenses", "expenses"], ["/expenses/recurring", "recurring"], ["/expenses/categories", "categories"],
  ["/reports", "reports"], ["/brief", "brief"], ["/store-check", "store-check"], ["/notifications", "notifications"],
  ["/settings", "settings"], ["/clock", "clock"], ["/my/hours", "my-hours"], ["/my/schedule", "my-schedule"], ["/my/profile", "my-profile"], ["/more", "more"],
];
for (const [path, name] of pages) await visit(path, name);

// Store + employee detail pages (first links)
const storeHref = await p.goto(base + "/stores").then(() => p.locator("a[href^='/stores/']").first().getAttribute("href"));
if (storeHref) { await visit(storeHref, "store-detail"); await visit(storeHref + "/settings", "store-settings"); await visit(storeHref + "/edit", "store-edit"); }
const empHref = await p.goto(base + "/employees").then(() => p.locator("a[href^='/employees/']:not([href*='payroll'])").first().getAttribute("href"));
if (empHref) await visit(empHref, "employee-detail");
const shiftHref = await p.goto(base + "/working").then(() => p.locator("a[href^='/shifts/']").first().getAttribute("href"));
if (shiftHref) await visit(shiftHref, "shift-detail");
const expHref = await p.goto(base + "/expenses").then(() => p.locator("a[href^='/expenses/']:not([href*='recurring']):not([href*='categories'])").first().getAttribute("href"));
if (expHref) await visit(expHref, "expense-detail");
for (const r of ["daily", "weekly", "monthly", "expenses", "hours", "labor", "comparison"]) await visit(`/reports/${r}?range=this_month`, `report-${r}`);

// Quick Close end-to-end for yesterday at the first store (demo leaves Corner Mart open yesterday)
await p.goto(base + "/accounting/quick-close");
await p.waitForTimeout(1500);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const locSel = p.locator("select").first();
const options = await locSel.locator("option").allTextContents();
const cornerIdx = options.findIndex((o) => /Corner Mart/.test(o));
if (cornerIdx >= 0) await locSel.selectOption({ index: cornerIdx });
await p.waitForTimeout(1500);
await p.fill("input[type=date]", yesterday).catch(() => {});
await p.waitForTimeout(2500);
await p.screenshot({ path: `${shots}/quick-close-before.png`, fullPage: true });
const money = p.locator("input[inputmode=decimal]");
const n = await money.count();
console.log("quick close money inputs:", n);
if (n >= 6) {
  const t0 = Date.now();
  const values = ["2816.45", "3194.82", "", "410", "875", "0", "35"];
  await money.nth(0).click();
  for (const v of values) { if (v) await p.keyboard.type(v); await p.keyboard.press("Enter"); }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${shots}/quick-close-filled.png`, fullPage: true });
  const closeBtn = p.locator("button:has-text('Close Day'), button:has-text('CLOSE DAY')").first();
  await closeBtn.click();
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${shots}/quick-close-confirm.png`, fullPage: true });
  const confirmBtn = p.locator("button:has-text('Confirm')").first();
  await confirmBtn.click();
  await p.waitForTimeout(3500);
  console.log(`quick close took ${((Date.now() - t0) / 1000).toFixed(1)}s (automation)`);
  await p.screenshot({ path: `${shots}/quick-close-closed.png`, fullPage: true });
  const txt = await p.locator("body").innerText();
  if (!/CLOSED/i.test(txt)) problems.push("Quick Close did not show CLOSED after confirm");
}

// Mobile pass
await p.setViewportSize({ width: 390, height: 844 });
for (const [path, name] of [["/dashboard", "dashboard"], ["/accounting/quick-close", "quick-close"], ["/accounting/rapid-entry", "rapid-entry"], ["/clock", "clock"], ["/working", "working"], ["/more", "more"]]) await visit(path, name, { mobile: true });

await b.close();
console.log("\nPROBLEMS:", problems.length);
for (const x of problems) console.log(" -", x);
process.exit(problems.length ? 1 : 0);
