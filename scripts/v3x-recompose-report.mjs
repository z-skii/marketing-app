/**
 * Builds the V3 recomposition package as one HTML page from
 * docs/design-lab-v3/recompose: the founder's stop point evidence for the
 * four recomposed experiences (hero, Recreate, Drive, Business to Loyalty).
 *
 *   node scripts/v3x-recompose-report.mjs [out.html]
 *
 * Stills and frame strips are downscaled and embedded. The eight browser
 * recordings are referenced as sibling files (recordings/<name>.webm) so
 * the page plays them when published with those files beside it, and it
 * names each file so a reader can open it from the repository.
 */
import { readFileSync, writeFileSync, existsSync, statSync } from "fs";
import path from "path";
import { createRequire } from "module";
const sharp = createRequire(import.meta.url)("sharp");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DIR = path.join(ROOT, "docs/design-lab-v3/recompose");
const OUT = process.argv[2] || path.join(DIR, "RECOMPOSE_PACKAGE.html");
const REPORT = JSON.parse(readFileSync(path.join(DIR, "report.json"), "utf8"));
const json = (rel) => (existsSync(path.join(DIR, rel)) ? JSON.parse(readFileSync(path.join(DIR, rel), "utf8")) : null);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BUDGET = 11 * 1024 * 1024; let used = 0;

async function embed(rel, width = 900) {
  const abs = path.join(DIR, rel);
  if (!existsSync(abs)) return { rel, missing: true };
  const meta = await sharp(abs).metadata();
  const tall = meta.height / meta.width > 3;
  const w = tall ? Math.min(width, 520) : width;
  const buf = await sharp(abs).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }).jpeg({ quality: 64, mozjpeg: true }).toBuffer();
  if (used + buf.length > BUDGET) return { rel, skipped: true, dimensions: `${meta.width}x${meta.height}` };
  used += buf.length;
  return { rel, uri: `data:image/jpeg;base64,${buf.toString("base64")}`, dimensions: `${meta.width}x${meta.height}`, kb: Math.round(statSync(abs).size / 1024) };
}
function figure(img, caption) {
  if (img.missing) return `<figure class="miss"><div class="ph">File not found</div><figcaption>${esc(img.rel)}</figcaption></figure>`;
  if (img.skipped) return `<figure class="miss"><div class="ph">Not embedded, size budget</div><figcaption>${esc(img.rel)} · ${img.dimensions}</figcaption></figure>`;
  return `<figure><img src="${img.uri}" alt="${esc(caption || img.rel)}" loading="lazy"><figcaption>${esc(caption ? caption + " · " : "")}${esc(img.rel)} · ${img.dimensions} · ${img.kb}KB</figcaption></figure>`;
}
function video(rel, caption) {
  const abs = path.join(DIR, rel); const kb = existsSync(abs) ? Math.round(statSync(abs).size / 1024) : 0;
  const frames = json(rel.replace(/\.webm$/, "-frames.json").replace(/^recordings\//, "recordings/"));
  return `<figure class="vid"><video src="${esc(rel)}" controls preload="metadata" playsinline></video><figcaption>${esc(caption)} · docs/design-lab-v3/recompose/${esc(rel)} · ${kb}KB${frames ? "" : ""}</figcaption></figure>`;
}
const qa = (list) => `<ul class="qa">${(list ?? []).map((q) => `<li><b class="${esc(q.answer)}">${esc(String(q.answer).toUpperCase())}</b> ${esc(q.question)} <span class="note">${esc(q.note)}</span></li>`).join("")}</ul>`;
const scoreRow = (sc) => `<table class="scores"><tr>${Object.keys(sc).map((k) => `<th>${esc(k.replace(/_/g, " "))}</th>`).join("")}</tr><tr>${Object.values(sc).map((v) => `<td>${esc(v)}</td>`).join("")}</tr></table>`;

async function experience(x) {
  const parts = [];
  parts.push(`<p>${esc(x.body)}</p>`);
  const stills = []; for (const f of x.stills) stills.push(figure(await embed(f.file, f.file.includes("-m-") ? 520 : 1000), f.caption));
  parts.push(`<h3>Stills</h3><div class="grid">${stills.join("")}</div>`);
  parts.push(`<h3>Recordings</h3><div class="grid vids">${x.recordings.map((r) => video(r.file, r.caption)).join("")}</div>`);
  const strips = []; for (const r of x.recordings) { const s = r.file.replace(/\.webm$/, "-strip.png"); strips.push(figure(await embed(s, 1400), `Frame strip of ${r.caption}`)); }
  parts.push(`<div class="grid one">${strips.join("")}</div>`);
  const frames = x.recordings.map((r) => { const fj = path.join(DIR, r.file.replace(/\.webm$/, "-frames.json")); if (!existsSync(fj)) return null; const lines = readFileSync(fj, "utf8").trim().split("\n").map((l) => JSON.parse(l)); const f = lines[lines.length - 1]; return `<tr><td>${esc(r.caption)}</td><td>${f.frames}</td><td>${f.p50}ms</td><td>${f.p95}ms</td><td>${f.max}ms</td><td>${f.over33}</td><td>${f.over50}</td></tr>`; }).filter(Boolean);
  if (frames.length) parts.push(`<h3>Frame timing during native scroll</h3><p class="small">requestAnimationFrame deltas sampled in the browser while the recorder scrolled the pinned scene end to end (desktop takes only; no screenshots during the sample). Machine and browser in the performance section.</p><table><tr><th>Take</th><th>Frames</th><th>p50</th><th>p95</th><th>Max</th><th>Over 33ms</th><th>Over 50ms</th></tr>${frames.join("")}</table>`);
  const reviews = [];
  for (const rv of x.reviews) {
    const r = json(`reviews/${rv}.json`); if (!r) continue; const v = r.review;
    reviews.push(`<details><summary><b>${esc(r.experience)} · pass ${r.pass}</b> · verdict <b class="v-${esc(v.verdict)}">${esc(v.verdict)}</b></summary>
      <p><i>Two second read.</i> ${esc(v.two_second_read)}</p>${scoreRow(v.scores)}
      <p><i>Still a web prototype?</i> ${esc(v.still_a_web_prototype)}</p><p><i>Motion.</i> ${esc(v.motion_read)}</p><p><i>Material.</i> ${esc(v.material_read)}</p>
      <p><i>Fixes asked for.</i></p><ol>${(v.fixes ?? []).map((f) => `<li><b>${esc(f.where)}.</b> ${esc(f.change)}</li>`).join("")}</ol>
      <p><i>Six questions.</i></p>${qa(v.six_questions)}</details>`);
  }
  parts.push(`<h3>The director's passes</h3>${reviews.join("")}`);
  if (x.after_pass_2) parts.push(`<p><b>Applied after pass 2.</b> ${esc(x.after_pass_2)}</p>`);
  if (x.finishing) parts.push(`<h3>The finishing pass</h3><p>${esc(x.finishing)}</p>`);
  const fin = json(`reviews/${x.id}-final.json`);
  if (fin) {
    const v = fin.verification; const b = v.blocker;
    parts.push(`<h3>Astra's final verification of the finished state</h3><p class="${b ? "pending" : "founder"}"><b class="v-${b ? "fix" : "ready"}">${b ? "SPECIFIC BLOCKER" : "READY"}</b> · ${esc(v.score)}/10 · ${esc(fin.when).slice(0, 16).replace("T", " ")} UTC · captures: ${fin.shots.map(esc).join(", ")}</p>
      <p><i>Read.</i> ${esc(v.read)}</p>${b ? `<p><b>Where.</b> ${esc(b.where)}</p><p><b>What.</b> ${esc(b.what)}</p><p><b>Why.</b> ${esc(b.why)}</p>` : ""}
      ${qa(v.six_questions)}${(v.notes ?? []).length ? `<p><i>Notes, not blockers.</i></p><ul>${v.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}`);
  } else parts.push(`<h3>Astra's final verification</h3><p class="pending">Not yet run.</p>`);
  if (x.truth) parts.push(`<p class="truth"><b>Truth.</b> ${esc(x.truth)}</p>`);
  return `<section class="item" id="${esc(x.id)}"><h2><span class="n">${esc(x.n)}</span> ${esc(x.title)}</h2>${parts.join("\n")}</section>`;
}

const cmp = json("reviews/compare.json");
function compareHtml() {
  if (!cmp) return `<section class="item"><h2><span class="n">5</span> The director's comparison against the current V3</h2><p class="pending">Not yet run.</p></section>`;
  const c = cmp.comparison;
  return `<section class="item" id="compare"><h2><span class="n">5</span> The director's comparison against the current V3</h2>
  <p>Astra received the current V3 captures and strips (the package the founder reviewed) and the recomposition's, and answered the six questions for each experience in both. Verdict: <b class="v-${esc(c.verdict)}">${esc(c.verdict).replace(/_/g, " ")}</b>.</p>
  <p class="founder"><b>For the founder.</b> ${esc(c.note_for_founder)}</p>
  <table><tr><th>Experience</th><th>Current V3</th><th>Recomposition</th><th>Verdict</th></tr>${c.experiences.map((e) => `<tr><td>${esc(e.experience)}</td><td>${esc(e.current_v3.score)}/10</td><td>${esc(e.recomposed.score)}/10</td><td>${esc(e.verdict)}</td></tr>`).join("")}</table>
  ${c.experiences.map((e) => `<details><summary><b>${esc(e.experience)}</b>: ${esc(e.verdict)}</summary><p><i>Current V3.</i> ${esc(e.current_v3.read)}</p>${qa(e.current_v3.six_questions)}<p><i>Recomposition.</i> ${esc(e.recomposed.read)}</p>${qa(e.recomposed.six_questions)}<p><i>Why.</i> ${esc(e.why)}</p><p><i>What still misses.</i></p><ul>${e.what_still_misses.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></details>`).join("")}
  <h3>The homepage as a whole</h3>${qa(c.homepage.six_questions)}<p><i>Remembered tomorrow.</i> ${esc(c.homepage.remembered_tomorrow)}</p><p><i>Belongs to TapMart only.</i> ${esc(c.homepage.belongs_to_tapmart_only)}</p><p><i>Scroll pull.</i> ${esc(c.homepage.scroll_pull)}</p>
  <p><i>Risks.</i></p><ul>${c.risks.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></section>`;
}

const exps = []; for (const x of REPORT.experiences) exps.push(await experience(x));
/* The founder's table: final verdict per experience, and the scores before (current V3), after the first build (the comparison) and after the finishing pass (the final verification). */
function verdictTable() {
  const rows = REPORT.experiences.map((x) => {
    const fin = json(`reviews/${x.id}-final.json`); const ce = cmp?.comparison?.experiences?.find((e) => e.experience === x.id);
    const v = fin?.verification; const b = v?.blocker;
    return `<tr><td>${esc(x.title)}</td><td>${ce ? esc(ce.current_v3.score) + "/10" : ""}</td><td>${ce ? esc(ce.recomposed.score) + "/10" : ""}</td><td>${v ? esc(v.score) + "/10" : ""}</td><td>${v ? `<b class="v-${b ? "fix" : "ready"}">${b ? "SPECIFIC BLOCKER" : "READY"}</b>${b ? `: ${esc(b.what)}` : ""}` : "<span class=\"pending\">not yet run</span>"}</td></tr>`;
  });
  return `<div class="box"><h3>Astra's final verdicts and the scores, before to after</h3><table><tr><th>Experience</th><th>Current V3</th><th>First build</th><th>Finished</th><th>Final verification</th></tr>${rows.join("")}</table><p class="small" style="margin:8px 0 0">Scores are the director's presentation judgements out of 10, on one scale across the three columns; the current V3 and first build columns come from the comparison, the finished column from the final verification of the recorded final state.</p></div>`;
}
const perf = REPORT.performance;
const extra = []; for (const s of REPORT.sections ?? []) { const figs = []; for (const f of s.files ?? []) figs.push(figure(await embed(f.file, f.file.includes("-m") ? 520 : 1000), f.caption)); extra.push(`<section class="item" id="${esc(s.id)}"><h2><span class="n">${esc(s.n)}</span> ${esc(s.title)}</h2>${(s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join("")}${s.list ? `<ul>${s.list.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>` : ""}${figs.length ? `<div class="grid">${figs.join("")}</div>` : ""}</section>`); }

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>TapMart V3 Recomposition</title>
<style>
  :root { --canvas:#F6F7F5; --paper:#fff; --ink:#17221E; --muted:#59655D; --line:#DCE2DE; --ok:#236444; --warn:#835400; --bad:#B3261E; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --canvas:#121714; --paper:#1a211d; --ink:#EDF1EE; --muted:#9AA79F; --line:#2b342e; } }
  :root[data-theme="dark"] { --canvas:#121714; --paper:#1a211d; --ink:#EDF1EE; --muted:#9AA79F; --line:#2b342e; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--canvas); color:var(--ink); font:16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .wrap { max-width: 1080px; margin: 0 auto; padding: 0 16px 96px; }
  header { padding: 48px 0 24px; }
  h1 { font-size: 34px; line-height:1.15; letter-spacing:-0.03em; margin:0 0 8px; font-weight:600; }
  h3 { font-size: 15px; letter-spacing:0.02em; text-transform:uppercase; color:var(--muted); font-weight:600; margin: 24px 0 8px; }
  .sub { color: var(--muted); margin:0; }
  .box { background:var(--paper); border:1px solid var(--line); border-radius:14px; padding:16px 20px; margin:24px 0; }
  .box h3 { margin:0 0 8px; }
  .item { border-top:1px solid var(--line); padding-top:28px; margin-top:36px; }
  .item h2 { font-size:22px; letter-spacing:-0.02em; margin:0 0 12px; font-weight:600; display:flex; gap:12px; align-items:baseline; }
  .n { display:inline-grid; place-items:center; min-width:30px; height:30px; padding:0 8px; border-radius:15px; background:var(--ink); color:var(--canvas); font-size:14px; font-weight:600; }
  .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:12px; }
  .grid.one { grid-template-columns: 1fr; }
  .grid.vids { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
  figure { margin:0; background:var(--paper); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
  figure img, figure video { display:block; width:100%; height:auto; background:#000; }
  figcaption { padding:8px 10px; font-size:12px; color:var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break:break-all; }
  .miss .ph { display:grid; place-items:center; min-height:120px; color:var(--muted); font-size:14px; }
  table { border-collapse:collapse; width:100%; font-size:14px; margin: 8px 0; }
  th, td { text-align:left; padding:6px 10px; border-bottom:1px solid var(--line); vertical-align: top; }
  table.scores { font-size:12px; } table.scores th { font-weight:500; color:var(--muted); }
  details { background:var(--paper); border:1px solid var(--line); border-radius:12px; padding:10px 16px; margin:10px 0; }
  summary { cursor:pointer; }
  .qa { list-style:none; padding:0; margin:8px 0; } .qa li { padding:4px 0; border-bottom:1px solid var(--line); font-size:14px; }
  .qa .note { color:var(--muted); display:block; }
  b.yes { color:var(--ok); } b.partly { color:var(--warn); } b.no { color:var(--bad); }
  .v-ready, .v-approve_direction, .v-recomposed { color:var(--ok); } .v-fix, .v-continue, .v-draw { color:var(--warn); } .v-recompose, .v-recompose_again, .v-current { color:var(--bad); }
  .founder { background:var(--paper); border-left:3px solid var(--ink); padding:10px 14px; border-radius:0 8px 8px 0; }
  .truth { color:var(--muted); font-size:14px; }
  .small { color:var(--muted); font-size:14px; }
  .pending { background:rgba(131,84,0,.09); border-left:3px solid #835400; padding:10px 14px; border-radius:0 8px 8px 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
  @media (max-width: 640px) { .wrap { padding: 0 16px 64px; } h1 { font-size:27px; } }
</style></head>
<body><div class="wrap">
<header>
  <h1>TapMart V3 recomposition</h1>
  <p class="sub">${esc(REPORT.subtitle)} Generated ${esc(REPORT.generated)}.</p>
</header>
<div class="box"><h3>Status</h3><p style="margin:0">${esc(REPORT.status)}</p></div>
<div class="box"><h3>What was kept and what changed</h3><ul>${REPORT.kept_and_changed.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>
${verdictTable()}
${exps.join("\n")}
${compareHtml()}
<section class="item" id="performance"><h2><span class="n">6</span> Performance impact</h2>
  ${perf.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("")}
  <table><tr>${perf.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>${perf.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>
  <p class="small">${esc(perf.setup)}</p>
</section>
${extra.join("\n")}
<div class="box" style="margin-top:48px"><h3>Evidence locations</h3><p style="margin:0">Everything is under <code>docs/design-lab-v3/recompose</code>: <code>captures/</code> (stills and reduced motion blocks), <code>recordings/</code> (eight .webm takes, their frame strips and frame timing), <code>reviews/</code> (every director pass and the comparison), <code>assets/</code> (the vehicle render rounds), <code>RECOMPOSE_DIRECTION.md</code> and <code>recompose-direction.json</code>. The brief is <code>docs/design-lab-v3/RECOMPOSE_BRIEF.md</code>. The lab route is <code>/design-lab-v3</code> on the branch.</p></div>
</div></body></html>`;
writeFileSync(OUT, html);
console.log(`${OUT}  ${(Buffer.byteLength(html) / 1048576).toFixed(1)}MB  embedded ${(used / 1048576).toFixed(1)}MB`);
