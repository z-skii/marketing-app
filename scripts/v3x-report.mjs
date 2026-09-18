/**
 * Builds the V3 approval package as a single self contained HTML page from
 * docs/design-lab-v3/report-items.json. Every image is read from its stable
 * repository path, downscaled and embedded, so the page has no dependency on
 * a temporary directory and opens correctly wherever it is sent.
 *
 *   node scripts/v3x-report.mjs [out.html]
 *
 * Recordings are .webm files that are too large to embed. The page shows each
 * recording's frame strip (a real still from the take) and names the video file
 * beside it, so a reader can open the video from the repository.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import path from "path";
import { createRequire } from "module";
const sharp = createRequire(import.meta.url)("sharp");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = process.argv[2] || path.join(ROOT, "docs/design-lab-v3/V3_PACKAGE.html");
const DATA = JSON.parse(readFileSync(path.join(ROOT, "docs/design-lab-v3/report-items.json"), "utf8"));

/** Total embedded bytes must stay well inside the 16MB artifact ceiling. */
const BUDGET = 13 * 1024 * 1024;
let used = 0;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Downscale to a readable width and embed. Tall full page captures keep more height. */
async function embed(rel, { width = 900, quality = 62 } = {}) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) return { rel, missing: true };
  const meta = await sharp(abs).metadata();
  const tall = meta.height / meta.width > 3;
  const w = tall ? Math.min(width, 520) : width;
  const buf = await sharp(abs).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
  if (used + buf.length > BUDGET) return { rel, skipped: true, dimensions: `${meta.width}x${meta.height}` };
  used += buf.length;
  return { rel, uri: `data:image/jpeg;base64,${buf.toString("base64")}`, dimensions: `${meta.width}x${meta.height}`, kb: Math.round(statSync(abs).size / 1024) };
}

function figure(img, caption) {
  if (img.missing) return `<figure class="miss"><div class="ph">File not found</div><figcaption>${esc(img.rel)}</figcaption></figure>`;
  if (img.skipped) return `<figure class="miss"><div class="ph">Not embedded, size budget</div><figcaption>${esc(img.rel)} · ${img.dimensions}</figcaption></figure>`;
  return `<figure><img src="${img.uri}" alt="${esc(caption || img.rel)}" loading="lazy"><figcaption>${esc(img.rel)} · ${img.dimensions} · ${img.kb}KB</figcaption></figure>`;
}

const strip = (f) => f.replace(/\.webm$/, "-strip.png");

async function itemHtml(item) {
  const parts = [];
  if (item.body) parts.push(`<p>${esc(item.body)}</p>`);
  if (!item.body && item.source) parts.push(`<p class="pending"><strong>Pending the design director.</strong> Source: ${esc(item.source)}</p>`);

  const images = [];
  const videos = [];
  for (const f of item.files || []) {
    if (f.endsWith(".webm")) { videos.push(f); const s = strip(f); if (existsSync(path.join(ROOT, s))) images.push(s); }
    else if (f.endsWith(".png") || f.endsWith(".jpg")) images.push(f);
    else parts.push(`<p class="ref">${esc(f)}</p>`);
  }
  for (const f of item.states || []) images.push(f);

  if (videos.length) parts.push(`<p class="ref">Recordings: ${videos.map((v) => esc(v)).join(", ")}</p>`);
  if (images.length) {
    const figs = [];
    for (const f of images) figs.push(figure(await embed(f, { width: f.includes("-strip") ? 1200 : 900 })));
    parts.push(`<div class="grid">${figs.join("")}</div>`);
  }
  return `<section class="item" id="item-${item.n}">
    <h2><span class="n">${item.n}</span> ${esc(item.title)}</h2>
    ${parts.join("\n")}
  </section>`;
}

const items = [];
for (const it of DATA.items) items.push(await itemHtml(it));

const pending = DATA.items.filter((i) => !i.body && i.source).map((i) => `${i.n}. ${i.title}`);

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>TapMart V3 Package</title>
<style>
  :root { --canvas:#F6F7F5; --paper:#fff; --ink:#17221E; --muted:#59655D; --line:#DCE2DE; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --canvas:#121714; --paper:#1a211d; --ink:#EDF1EE; --muted:#9AA79F; --line:#2b342e; } }
  :root[data-theme="dark"] { --canvas:#121714; --paper:#1a211d; --ink:#EDF1EE; --muted:#9AA79F; --line:#2b342e; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--canvas); color:var(--ink); font:16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 16px 96px; }
  header { padding: 48px 0 24px; }
  h1 { font-size: 34px; line-height:1.15; letter-spacing:-0.03em; margin:0 0 8px; font-weight:600; }
  .sub { color: var(--muted); margin:0; }
  .box { background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 20px; margin:24px 0; }
  .box h3 { margin:0 0 8px; font-size:15px; letter-spacing:0.02em; text-transform:uppercase; color:var(--muted); font-weight:600; }
  .box ul { margin:0; padding-left:20px; }
  .item { border-top:1px solid var(--line); padding-top:28px; margin-top:36px; }
  .item h2 { font-size:22px; letter-spacing:-0.02em; margin:0 0 12px; font-weight:600; display:flex; gap:12px; align-items:baseline; }
  .n { display:inline-grid; place-items:center; min-width:30px; height:30px; padding:0 8px; border-radius:15px; background:var(--ink); color:var(--canvas); font-size:14px; font-weight:600; }
  .pending { background:rgba(131,84,0,.09); border-left:3px solid #835400; padding:10px 14px; border-radius:0 8px 8px 0; }
  .ref { color:var(--muted); font-size:14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break:break-all; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:12px; }
  figure { margin:0; background:var(--paper); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  figure img { display:block; width:100%; height:auto; }
  figcaption { padding:8px 10px; font-size:12px; color:var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break:break-all; }
  .miss .ph { display:grid; place-items:center; min-height:120px; color:var(--muted); font-size:14px; }
  table { border-collapse:collapse; width:100%; font-size:14px; }
  th, td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--line); }
  @media (max-width: 640px) { .wrap { padding: 0 16px 64px; } h1 { font-size:27px; } }
</style></head>
<body><div class="wrap">
<header>
  <h1>TapMart V3</h1>
  <p class="sub">The 36 item approval package. Generated ${esc(DATA.generated)} from docs/design-lab-v3/report-items.json.</p>
</header>

<div class="box">
  <h3>What this is</h3>
  <p style="margin:0">Everything lives in the isolated lab under <code>/design-lab-v3</code>. Nothing authenticates, reads or writes the database, calls a Wallet service or delivers a notification. Every person, business, campaign, amount and date is a fictional fixture. No production route, file or record was touched.</p>
</div>

<div class="box">
  <h3>Gates</h3>
  <table>${Object.entries(DATA.gates).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join("")}</table>
</div>

${pending.length ? `<div class="box"><h3>Still to come</h3><p style="margin:0 0 8px">These items need the design director's judgement and are not filled in yet:</p><ul>${pending.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>` : ""}

${items.join("\n")}

<div class="box" style="margin-top:48px">
  <h3>Evidence locations</h3>
  <p style="margin:0">Captures: <code>docs/design-lab-v3/captures</code> with <code>viewports/</code>, <code>states/</code> and <code>INDEX.json</code>. Recordings: <code>docs/design-lab-v3/recordings</code>. Every file in the index was opened and fully decoded after saving.</p>
</div>
</div></body></html>`;

writeFileSync(OUT, html);
console.log(`${OUT}  ${(Buffer.byteLength(html) / 1048576).toFixed(1)}MB  embedded ${(used / 1048576).toFixed(1)}MB  pending items ${pending.length}`);
