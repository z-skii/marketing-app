#!/usr/bin/env node
// Mobile-first audit: measures a running site on phone viewports and writes
// one JSON per route and viewport plus a summary.md, keyed to the checklist
// IDs in ../references/checklist.md.
//
// Usage:
//   node audit.mjs --base http://localhost:3000 --out ./audit-out \
//     [--email a@b.c --password secret | --no-login] [--widths 320,360,390,430] \
//     [--landscape] [--chrome /path/to/chrome] [--login-path /sign-in] /route /route2
//
// Needs playwright or playwright-core installed in the project (it is resolved
// from the current working directory).

import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const args = process.argv.slice(2);
const opt = { base: "http://localhost:3000", out: "./mobile-audit", widths: "320,360,390,430", landscape: false, login: true, loginPath: "/sign-in" };
const routes = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--base") opt.base = args[++i];
  else if (a === "--out") opt.out = args[++i];
  else if (a === "--email") opt.email = args[++i];
  else if (a === "--password") opt.password = args[++i];
  else if (a === "--widths") opt.widths = args[++i];
  else if (a === "--chrome") opt.chrome = args[++i];
  else if (a === "--login-path") opt.loginPath = args[++i];
  else if (a === "--landscape") opt.landscape = true;
  else if (a === "--no-login") opt.login = false;
  else routes.push(a);
}
if (routes.length === 0) routes.push("/");
if (!opt.email) opt.login = false;

const require = createRequire(path.join(process.cwd(), "package.json"));
let chromium;
try { ({ chromium } = require("playwright")); } catch { ({ chromium } = require("playwright-core")); }

const viewports = opt.widths.split(",").map((w) => ({ label: `w${w.trim()}`, width: Number(w), height: Math.round(Number(w) * 2.16) }));
if (opt.landscape) viewports.push({ label: "landscape844", width: 844, height: 390 });

mkdirSync(opt.out, { recursive: true });
const browser = await chromium.launch({ executablePath: opt.chrome, args: ["--no-sandbox"] });
const results = [];

const measure = () => {
  const vw = window.innerWidth, vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  };
  const describe = (el) => {
    const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    const cls = typeof el.className === "string" ? el.className.split(" ").filter(Boolean).slice(0, 2).join(".") : "";
    return `${el.tagName.toLowerCase()}${cls ? "." + cls : ""}${t ? ` "${t}"` : ""}`;
  };
  const rectOf = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };

  // V1, V2
  const meta = document.querySelector('meta[name="viewport"]')?.getAttribute("content") || null;
  const zoomDisabled = !!meta && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(meta);

  // L1
  const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
  let widest = null;
  if (overflow > 0) {
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 && (!widest || r.right > widest.right)) widest = { right: Math.round(r.right), el: describe(el) };
    }
  }

  // T1, T2, T3
  const targets = [];
  const sel = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=tab], [role=menuitem], summary';
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el)) continue;
    const r = rectOf(el);
    targets.push({ el, r, d: describe(el), inline: el.tagName === "A" && el.closest("p, li, dd, span") && getComputedStyle(el).display === "inline" });
  }
  const under24 = [], under44 = [];
  for (const t of targets) {
    const small24 = t.r.w < 24 || t.r.h < 24;
    const small44 = t.r.w < 44 || t.r.h < 44;
    if (small24 && !t.inline) {
      // spacing exception: 24px circle centered on the target must not hit another target
      const cx = t.r.x + t.r.w / 2, cy = t.r.y + t.r.h / 2;
      const clash = targets.some((o) => o !== t && !(cx + 12 < o.r.x || cx - 12 > o.r.x + o.r.w || cy + 12 < o.r.y || cy - 12 > o.r.y + o.r.h));
      under24.push({ el: t.d, w: Math.round(t.r.w), h: Math.round(t.r.h), spacingPasses: !clash });
    } else if (small44 && !t.inline) {
      under44.push({ el: t.d, w: Math.round(t.r.w), h: Math.round(t.r.h) });
    }
  }
  const dedupe = (arr) => { const m = new Map(); for (const x of arr) { const k = `${x.el}|${x.w}x${x.h}`; m.set(k, (m.get(k) || { ...x, n: 0 })); m.get(k).n++; } return [...m.values()].sort((a, b) => a.w * a.h - b.w * b.h); };

  // Y1, Y2, Y3, Y4
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textEls = new Set();
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim()) continue;
    const p = node.parentElement;
    if (!p || ["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"].includes(p.tagName) || !visible(p)) continue;
    textEls.add(p);
  }
  const sizes = [];
  for (const el of textEls) sizes.push({ px: parseFloat(getComputedStyle(el).fontSize), d: describe(el) });
  const below = (n) => sizes.filter((s) => s.px < n);
  const smallest = [...sizes].sort((a, b) => a.px - b.px).slice(0, 8).map((s) => `${s.px.toFixed(1)}px ${s.d}`);
  const inputsUnder16 = [...document.querySelectorAll("input:not([type=hidden]), textarea, select")].filter((el) => visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16).map(describe);
  const longLines = [];
  for (const p of document.querySelectorAll("p, li, dd")) {
    if (!visible(p) || p.textContent.trim().length < 80) continue;
    const cs = getComputedStyle(p);
    const chars = p.getBoundingClientRect().width / (parseFloat(cs.fontSize) * 0.5);
    if (chars > 75) longLines.push({ chars: Math.round(chars), el: describe(p) });
  }

  // I1 to I5
  const dpr = devicePixelRatio || 1;
  const images = [];
  for (const img of document.images) {
    if (!visible(img)) continue;
    const r = rectOf(img);
    const aboveFold = r.y < vh;
    images.push({
      src: (img.currentSrc || img.src || "").split("/").slice(-2).join("/").slice(0, 60),
      rendered: Math.round(r.w), natural: img.naturalWidth,
      ratio: r.w ? +(img.naturalWidth / (r.w * dpr)).toFixed(2) : null,
      hasDims: img.hasAttribute("width") && img.hasAttribute("height"),
      loading: img.getAttribute("loading") || "eager", aboveFold,
      srcset: img.hasAttribute("srcset"), sizes: img.hasAttribute("sizes"), alt: img.hasAttribute("alt"),
      overflows: r.w > vw + 1,
    });
  }

  // C1, C2, C3
  let fixedPx = 0; const fixedEls = [];
  for (const el of document.body.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    const r = el.getBoundingClientRect();
    if (r.height === 0 || r.width < vw * 0.5 || r.bottom < 0 || r.top > vh) continue;
    if (el.closest("[data-mobile-audit-skip]")) continue;
    // ignore nested chrome (a sticky inside a fixed bar)
    if (fixedEls.some((f) => f.el.contains(el))) continue;
    fixedPx += Math.min(r.bottom, vh) - Math.max(r.top, 0);
    fixedEls.push({ el, d: describe(el), h: Math.round(r.height), top: Math.round(r.top) });
  }
  const primaries = [...document.querySelectorAll('button[type=submit], .btn-signal, [data-primary], .btn-primary, [class*="primary"]')].filter(visible);
  const firstPrimary = primaries.map((el) => ({ d: describe(el), r: el.getBoundingClientRect() })).find((p) => p.r.top >= 0 && p.r.bottom <= vh);
  const primary = firstPrimary ? { el: firstPrimary.d, centerShare: +((firstPrimary.r.top + firstPrimary.r.height / 2) / vh).toFixed(2) } : primaries.length ? { el: describe(primaries[0]), centerShare: null, note: "first primary action is below the first viewport" } : null;
  const bodyPadBottom = parseFloat(getComputedStyle(document.body).paddingBottom) + parseFloat(getComputedStyle(document.querySelector("main") || document.body).paddingBottom || "0");

  // P4
  const fontFaces = [];
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of rules) if (rule instanceof CSSFontFaceRule) fontFaces.push({ family: rule.style.fontFamily, display: rule.style.getPropertyValue("font-display") || null });
  }

  // F1
  const fields = [...document.querySelectorAll("input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea")].filter(visible).map((el) => ({
    d: describe(el), type: el.getAttribute("type") || "text", inputmode: el.getAttribute("inputmode"), autocomplete: el.getAttribute("autocomplete"),
    labelled: !!(el.id && document.querySelector(`label[for="${el.id}"]`)) || !!el.closest("label") || !!el.getAttribute("aria-label") || !!el.getAttribute("aria-labelledby"),
  }));

  return {
    vw, vh, meta, zoomDisabled, overflow, widest,
    targets: { total: targets.length, under24: dedupe(under24), under44: dedupe(under44) },
    text: { total: sizes.length, under11: below(11).length, under12: below(12).length, under14: below(14).length, under16: below(16).length, smallest, inputsUnder16, longLines: longLines.slice(0, 6) },
    images,
    chrome: { fixedShare: +(fixedPx / vh).toFixed(2), fixed: fixedEls.map(({ d, h, top }) => ({ el: d, h, top })), bodyPadBottom, primary },
    fontFaces,
    fields,
    h1: document.querySelectorAll("h1").length,
    docHeight: document.documentElement.scrollHeight,
  };
};

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__vitals = { lcp: null, lcpEl: null, cls: 0 };
    try {
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__vitals.lcp = e.startTime; window.__vitals.lcpEl = e.element ? e.element.tagName + (e.element.className ? "." + String(e.element.className).split(" ")[0] : "") : null; } }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    } catch {}
  });

  if (opt.login) {
    await page.goto(opt.base + opt.loginPath, { waitUntil: "networkidle" });
    await page.fill('input[type="email"], input[name="email"]', opt.email);
    await page.fill('input[type="password"]', opt.password || "");
    await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => {}), page.click('button[type="submit"]')]);
  }

  for (const route of routes) {
    let bytes = 0, jsBytes = 0, requests = 0;
    const onResp = async (resp) => {
      requests++;
      try { const b = await resp.body(); bytes += b.length; if ((resp.headers()["content-type"] || "").includes("javascript")) jsBytes += b.length; } catch {}
    };
    page.on("response", onResp);
    const t0 = Date.now();
    await page.goto(opt.base + route, { waitUntil: "networkidle", timeout: 90000 }).catch((e) => console.error(`nav failed ${vp.label} ${route}: ${e.message}`));
    await page.waitForTimeout(500);
    page.off("response", onResp);
    const finalUrl = page.url().replace(opt.base, "");
    const m = await page.evaluate(measure);
    const vitals = await page.evaluate(() => window.__vitals);
    const shot = path.join(opt.out, `${vp.label}${route.replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "") || "-root"}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    results.push({ route, finalUrl, viewport: vp, loadMs: Date.now() - t0, network: { bytes, jsBytes, requests }, vitals, ...m });
    writeFileSync(path.join(opt.out, `${vp.label}${route.replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "") || "-root"}.json`), JSON.stringify(results.at(-1), null, 2));
  }
  await context.close();
}
await browser.close();

// Summary
const kb = (n) => `${Math.round(n / 1024)} KB`;
const lines = ["# Mobile audit summary", "", `Base: ${opt.base}`, `Routes: ${routes.join(", ")}`, `Viewports: ${viewports.map((v) => `${v.width}x${v.height}`).join(", ")}`, ""];
lines.push("| Route | Width | Overflow (L1) | Targets <24 (T1) | Targets <44 (T2) | Text <14 / <16 (Y1) | Inputs <16 (Y3) | Fixed share (C1) | Primary center (C2) | LCP ms (P1) | CLS (P2) | JS / total (P3) |");
lines.push("|---|---|---|---|---|---|---|---|---|---|---|---|");
for (const r of results) {
  const n24 = r.targets.under24.reduce((s, x) => s + x.n, 0), n44 = r.targets.under44.reduce((s, x) => s + x.n, 0);
  lines.push(`| ${r.route} | ${r.viewport.width} | ${r.overflow} px | ${n24} | ${n44} | ${r.text.under14} / ${r.text.under16} of ${r.text.total} | ${r.text.inputsUnder16.length} | ${Math.round(r.chrome.fixedShare * 100)}% | ${r.chrome.primary ? (r.chrome.primary.centerShare ?? "below fold") : "none"} | ${r.vitals.lcp ? Math.round(r.vitals.lcp) : "n/a"} | ${r.vitals.cls.toFixed(3)} | ${kb(r.network.jsBytes)} / ${kb(r.network.bytes)} |`);
}
lines.push("", "## Viewport meta (V1, V2)", "", `\`${results[0]?.meta}\` zoom disabled: ${results[0]?.zoomDisabled}`);
lines.push("", "## Smallest targets per route (first width only)", "");
for (const r of results.filter((x) => x.viewport === viewports[0])) {
  const list = [...r.targets.under24.map((t) => `${t.w}x${t.h} ${t.el}${t.spacingPasses ? " (spacing ok)" : ""} x${t.n}`), ...r.targets.under44.slice(0, 6).map((t) => `${t.w}x${t.h} ${t.el} x${t.n}`)];
  lines.push(`- **${r.route}**: ${list.length ? list.join("; ") : "all targets 44+"}`);
}
lines.push("", "## Smallest text per route (first width only)", "");
for (const r of results.filter((x) => x.viewport === viewports[0])) lines.push(`- **${r.route}**: ${r.text.smallest.slice(0, 5).join("; ")}`);
lines.push("", "## Images (first width only)", "");
for (const r of results.filter((x) => x.viewport === viewports[0])) {
  const over = r.images.filter((i) => i.ratio && i.ratio > 2), nodims = r.images.filter((i) => !i.hasDims), lazyMiss = r.images.filter((i) => !i.aboveFold && i.loading !== "lazy"), eagerMiss = r.images.filter((i) => i.aboveFold && i.loading === "lazy"), srcset = r.images.filter((i) => i.srcset);
  lines.push(`- **${r.route}**: ${r.images.length} images; ${over.length} over 2x (${over.slice(0, 3).map((i) => `${i.src} ${i.natural}px for ${i.rendered}px`).join(", ")}); ${nodims.length} without width/height; ${lazyMiss.length} below fold not lazy; ${eagerMiss.length} above fold lazy; ${srcset.length} with srcset`);
}
lines.push("", "## Fixed chrome (first width only)", "");
for (const r of results.filter((x) => x.viewport === viewports[0])) lines.push(`- **${r.route}**: ${r.chrome.fixed.map((f) => `${f.el} ${f.h}px at ${f.top}`).join("; ") || "none"}`);
lines.push("", "## Fonts (P4)", "", ...(results[0]?.fontFaces.length ? results[0].fontFaces.map((f) => `- ${f.family}: font-display ${f.display || "missing"}`) : ["- no @font-face rules visible"]));
lines.push("", "## Fields (F1, first width only)", "");
for (const r of results.filter((x) => x.viewport === viewports[0] && x.fields.length)) lines.push(`- **${r.route}**: ${r.fields.map((f) => `${f.d} type=${f.type} inputmode=${f.inputmode ?? "-"} autocomplete=${f.autocomplete ?? "-"} label=${f.labelled ? "yes" : "NO"}`).join("; ")}`);
writeFileSync(path.join(opt.out, "summary.md"), lines.join("\n"));
console.log(lines.slice(0, 8 + results.length).join("\n"));
console.log(`\nWrote ${results.length} measurements to ${opt.out}/summary.md`);
