// OpenAI as TapMart's primary product designer.
//
//   npm run design-spec -- system [--effort high]
//   npm run design-spec -- screen "<Screen name>" --purpose "..." --data "..." --actions "..." \
//       [--phone shot.png] [--desktop shot.png] [--requirements "..."] [--effort high]
//
// "system" asks for the whole UI system (colours, typography, spacing,
// surfaces, radius, buttons, navigation, rows, cards, media ratios, badges,
// status, glass, shadow, animation, icons, responsive rules) and saves it to
// docs/design-specs/system.{json,md}. "screen" sends the current screenshot
// (only so the designer knows what exists), the product brain, the primary
// reference image, the three campaign images, the screen's purpose, data,
// actions and requirements, plus the saved system, and asks for a from
// scratch design the engineer can build. Saved to docs/design-specs/<slug>.
//
// Model: the DESIGN DIRECTOR in scripts/design-models.mjs (gpt-6-astra, high
// reasoning, or OPENAI_DESIGN_MODEL / --model). Responses API in background
// mode with polling (long reasoning otherwise dies at proxies). Reads
// OPENAI_API_KEY if set; otherwise the cloud proxy attaches the credential.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { DIRECTOR_MODEL, DIRECTOR_EFFORT, supportsReasoning } from "./design-models.mjs";

const HERE = resolve(new URL(".", import.meta.url).pathname, "..");
const BRAIN_PATH = join(HERE, "docs", "TAPMART_PRODUCT_BRAIN.md");
const REFERENCE_PATH = join(HERE, "docs", "design-references", "tapmart-primary-reference.png");
const CAMPAIGN_IMAGES = [
  ["RECREATE REEL image: a creator filming inside a coffee shop. A real person creating content for a real business.", join(HERE, "public", "uploads", "seed", "tapmart-recreate.jpg")],
  ["INSTAGRAM STORY image: a finished, ready to post Story advertisement shown on a phone. The ad is already made; the user simply posts it.", join(HERE, "public", "uploads", "seed", "tapmart-story.jpg")],
  ["CAR ADVERTISING image: a vehicle with a real advertising wrap. Businesses pay to advertise on the car.", join(HERE, "public", "uploads", "seed", "tapmart-car.jpg")],
];
const OUT_DIR = join(HERE, "docs", "design-specs");
const ENDPOINT = "https://api.openai.com/v1/responses";
const POLL_MS = 3000;
const MAX_WAIT_MS = 12 * 60_000;
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function usage(m) {
  if (m) console.error(m);
  console.error('usage: npm run design-spec -- system | screen "<Screen name>" --purpose "..." --data "..." --actions "..." [--phone png] [--desktop png] [--requirements "..."] [--effort low|medium|high] [--model id] [--dry-run]');
  process.exit(m ? 1 : 0);
}

function parseArgs(argv) {
  const o = { model: DIRECTOR_MODEL, effort: DIRECTOR_EFFORT, dryRun: false, phone: null, desktop: null, purpose: "", data: "", actions: "", requirements: "" };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--model") o.model = argv[++i];
    else if (a === "--effort") o.effort = argv[++i];
    else if (a === "--phone") o.phone = resolve(argv[++i]);
    else if (a === "--desktop") o.desktop = resolve(argv[++i]);
    else if (a === "--purpose") o.purpose = argv[++i];
    else if (a === "--data") o.data = argv[++i];
    else if (a === "--actions") o.actions = argv[++i];
    else if (a === "--requirements") o.requirements = argv[++i];
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--help" || a === "-h") usage();
    else pos.push(a);
  }
  const [mode, screenName] = pos;
  if (mode !== "system" && mode !== "screen") usage("First argument must be system or screen.");
  if (mode === "screen" && !screenName) usage("Give the screen name.");
  return { ...o, mode, screenName: screenName ?? "system" };
}

function img(path) {
  const mime = MIME[extname(path).toLowerCase()];
  const bytes = readFileSync(path);
  return { type: "input_image", image_url: `data:${mime};base64,${bytes.toString("base64")}`, detail: "high" };
}
const text = (t) => ({ type: "input_text", text: t });
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const DESIGNER = [
  "You are TapMart's PRIMARY PRODUCT DESIGNER. A coding agent (Claude Code) is the engineer and will build exactly what you specify. You design; you never write code.",
  "TapMart is a real product with working functionality: routes, backend, database, auth, permissions, subscriptions, campaign logic, vehicles, payments, Instagram and Google integration states, User and Business modes, messages, notifications. All of that is frozen. The current frontend has NO visual authority: when a current screenshot is included it exists only so you know what functionality, data and actions exist. Do not preserve its look. Redesign from scratch.",
  "The PRIMARY visual reference is the attached TapMart Profile + Smart Vehicle concept. The entire product must feel like it came from the same product design team: deep graphite materials, soft dimensional surfaces, premium spacing, strong typography, quiet metadata, restrained lime, high quality icons, clean glass navigation, compact rows, large purposeful visuals, subtle depth, low border usage, premium buttons, a native app feeling. The car in the reference is content; the UI around the car is the system. Do not put cars everywhere.",
  "Three campaign images are attached and are the primary demo visuals for the three opportunity types: Recreate Reel (a creator filming in a coffee shop), Instagram Story (a finished ad on a phone), Car advertising (a wrapped car). Use them where they belong. Never invent data, metrics, users, or connections; the app shows only real data and honest empty states.",
  "Product structure to keep unless you find a clearly better way to organise the SAME functionality: User mode has Home, Activity, Earnings, Profile. Business mode has Home, Content, Create, Campaigns, Business. Do not invent bottom navigation items. Three opportunity types only: Recreate, Story, Car. You may change structure inside a screen: cards to rows, a section to a carousel, filters to a sheet, stats to one row, a header removed, a secondary feature moved into a detail view.",
  "Hard rules: media first (Reel video, Story creatives, creator photos, business photos, vehicle photos and 3D, delivered shoots); money obvious; less text (if text is not needed for the next decision, remove it); lime only for money, the primary action, active navigation and important status; purposeful motion only; every tap target at least 44px; phone first (390 wide) and a real desktop composition (1360 wide, a left rail) that is not a stretched phone.",
  "Be exact. Give sizes in px, weights, colours as hex, radii, spacing, ratios, heights, and the order of content top to bottom. Each item must be buildable without a follow up question.",
].join("\n\n");

const SYSTEM_SCHEMA = {
  name: "tapmart_ui_system",
  strict: true,
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      name: { type: "string" },
      principles: { type: "array", items: { type: "string" }, description: "Up to 8 one-line principles that make it TapMart." },
      colors: { type: "array", items: { $ref: "#/$defs/token" }, description: "Every colour with a role: background, surfaces, lines, text tiers, lime, success, warning, error, glass, scrim." },
      typography: { type: "array", items: { $ref: "#/$defs/token" }, description: "Font family and every text role with size px, weight, letter spacing, line height." },
      spacing: { type: "array", items: { $ref: "#/$defs/token" }, description: "Gutters, section gaps, card gaps, row gaps, internal paddings, content top and bottom." },
      surfaces: { type: "array", items: { $ref: "#/$defs/token" }, description: "Surface levels: fill, border, gradient, when each is used." },
      radius: { type: "array", items: { $ref: "#/$defs/token" } },
      buttons: { type: "array", items: { $ref: "#/$defs/token" }, description: "Primary, secondary, tertiary, icon button, chip: height, radius, fill, text, states." },
      navigation: { type: "array", items: { $ref: "#/$defs/token" }, description: "Phone top bar, phone bottom bar, desktop rail, active and inactive treatment, glass values." },
      rows: { type: "array", items: { $ref: "#/$defs/token" }, description: "Row anatomy: height, padding, thumb, title, sub, status, chevron, gaps." },
      cards: { type: "array", items: { $ref: "#/$defs/token" }, description: "Card types: hero media card, media tile, stat, vehicle card; when each is used." },
      media_ratios: { type: "array", items: { $ref: "#/$defs/token" }, description: "Ratios or fixed heights per media kind: Reel, Story creative, car, business cover, creator portrait, thumbnail, avatar." },
      badges: { type: "array", items: { $ref: "#/$defs/token" } },
      status: { type: "array", items: { $ref: "#/$defs/token" }, description: "Dot, text, colours per state (ready, active, pending, review, done, error)." },
      glass: { type: "array", items: { $ref: "#/$defs/token" } },
      shadow: { type: "array", items: { $ref: "#/$defs/token" } },
      animation: { type: "array", items: { $ref: "#/$defs/token" }, description: "Each motion with trigger, duration, easing and where it is used." },
      icon_style: { type: "array", items: { $ref: "#/$defs/token" } },
      responsive_rules: { type: "array", items: { $ref: "#/$defs/token" }, description: "Breakpoints, desktop rail width, content max widths, how phone compositions translate to desktop." },
    },
    required: ["name", "principles", "colors", "typography", "spacing", "surfaces", "radius", "buttons", "navigation", "rows", "cards", "media_ratios", "badges", "status", "glass", "shadow", "animation", "icon_style", "responsive_rules"],
    $defs: {
      token: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string" },
          value: { type: "string", description: "The exact value(s): hex, px, weight, ratio, duration, easing." },
          use: { type: "string", description: "Where and when it is used, one sentence." },
        },
        required: ["name", "value", "use"],
      },
    },
  },
};

const SCREEN_SCHEMA = {
  name: "tapmart_screen_design",
  strict: true,
  schema: {
    type: "object", additionalProperties: false,
    properties: {
      concept: { type: "string", description: "Two sentences: what this screen is, in the new design." },
      three_second_read: { type: "string", description: "What a first time viewer understands in three seconds." },
      layout_architecture: { type: "string", description: "The page structure top to bottom on the phone, with region names and heights." },
      visual_hierarchy: { type: "array", items: { type: "string" }, description: "Ordered: what the eye lands on first, second, third." },
      content_order: { type: "array", items: { $ref: "#/$defs/block" }, description: "Every block on the screen, in order, with its exact composition." },
      removed: { type: "array", items: { type: "string" }, description: "What existing UI or copy is deleted, and why." },
      moved_deeper: { type: "array", items: { type: "string" }, description: "What moves into a detail view, a sheet, or settings." },
      media: { type: "array", items: { type: "string" }, description: "Media proportions and treatment per media kind on this screen (ratio or height, crop, scrim, filter, which campaign image where)." },
      typography: { type: "array", items: { type: "string" }, description: "Each text role on this screen with px, weight, colour." },
      spacing: { type: "array", items: { type: "string" }, description: "Gutters, gaps and paddings on this screen." },
      cards_and_rows: { type: "array", items: { type: "string" }, description: "Which elements are cards, which are rows, which are bare media, and why." },
      cta: { type: "array", items: { type: "string" }, description: "Every action on the screen, its style (primary, secondary, tertiary), its placement and its label." },
      navigation: { type: "string", description: "Top chrome and bottom bar treatment on this screen." },
      animation: { type: "array", items: { type: "string" }, description: "Purposeful motion on this screen with trigger, duration, easing." },
      desktop: { type: "array", items: { type: "string" }, description: "The desktop composition at 1360 wide with the rail: columns, widths, what changes, what stays." },
      empty_states: { type: "array", items: { type: "string" }, description: "Honest empty and loading states for each block." },
      implementation: { type: "array", items: { $ref: "#/$defs/step" }, description: "Ordered engineering steps, each buildable without a question." },
    },
    required: ["concept", "three_second_read", "layout_architecture", "visual_hierarchy", "content_order", "removed", "moved_deeper", "media", "typography", "spacing", "cards_and_rows", "cta", "navigation", "animation", "desktop", "empty_states", "implementation"],
    $defs: {
      block: {
        type: "object", additionalProperties: false,
        properties: {
          name: { type: "string" },
          composition: { type: "string", description: "Exact composition: elements, sizes, positions, colours, media." },
          height: { type: "string", description: "Approximate height on the phone, in px or ratio." },
        },
        required: ["name", "composition", "height"],
      },
      step: {
        type: "object", additionalProperties: false,
        properties: { priority: { type: "integer", minimum: 1 }, change: { type: "string" }, where: { type: "string" } },
        required: ["priority", "change", "where"],
      },
    },
  },
};

function md(mode, name, spec) {
  const lines = [`# ${mode === "system" ? "TapMart UI system" : `Design: ${name}`}`, ""];
  const list = (title, arr) => { if (!arr?.length) return; lines.push(`## ${title}`, ""); for (const x of arr) lines.push(typeof x === "string" ? `- ${x}` : `- **${x.name}**: ${x.value ?? x.composition ?? x.change} ${x.use ? `(${x.use})` : ""}${x.height ? ` [${x.height}]` : ""}${x.where ? ` (${x.where})` : ""}`); lines.push(""); };
  if (mode === "system") {
    lines.push(`**${spec.name}**`, "");
    for (const k of Object.keys(spec)) if (Array.isArray(spec[k])) list(k.replace(/_/g, " "), spec[k]);
  } else {
    lines.push(`**Concept.** ${spec.concept}`, "", `**Three seconds.** ${spec.three_second_read}`, "", `**Layout.** ${spec.layout_architecture}`, "");
    for (const k of Object.keys(spec)) {
      if (Array.isArray(spec[k])) list(k.replace(/_/g, " "), k === "implementation" ? [...spec[k]].sort((a, b) => a.priority - b.priority).map((s) => `${s.priority}. ${s.change} (${s.where})`) : spec[k]);
      else if (["navigation"].includes(k)) lines.push(`## ${k}`, "", spec[k], "");
    }
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const a = parseArgs(process.argv.slice(2));
  const brain = readFileSync(BRAIN_PATH, "utf8");
  const content = [];
  if (a.mode === "system") {
    content.push(text("Define TapMart's complete UI system. Every screen will be built from it, so every value must be exact and every role covered. Use the reference image as the aesthetic source of truth and the three campaign images to calibrate how media sits inside the system."));
  } else {
    let system = "";
    const sysPath = join(OUT_DIR, "system.json");
    if (existsSync(sysPath)) system = JSON.stringify(JSON.parse(readFileSync(sysPath, "utf8")).spec);
    content.push(text(`Redesign the "${a.screenName}" screen from scratch while preserving its product purpose and functionality.\n\nSCREEN PURPOSE: ${a.purpose}\n\nAVAILABLE DATA: ${a.data}\n\nAVAILABLE ACTIONS: ${a.actions}\n\nREQUIREMENTS: ${a.requirements || "Phone 390 wide first; desktop 1360 wide with a left rail; both clearly the same product."}\n\n${system ? `THE UI SYSTEM YOU DEFINED (use it; extend it only if this screen needs a new part):\n${system}` : ""}`));
  }
  content.push(text("PRIMARY VISUAL REFERENCE (aesthetic source of truth):"), img(REFERENCE_PATH));
  for (const [label, path] of CAMPAIGN_IMAGES) if (existsSync(path)) content.push(text(label), img(path));
  if (a.phone && existsSync(a.phone)) content.push(text("CURRENT PHONE SCREENSHOT (functionality inventory only; not a visual reference):"), img(a.phone));
  if (a.desktop && existsSync(a.desktop)) content.push(text("CURRENT DESKTOP SCREENSHOT (functionality inventory only; not a visual reference):"), img(a.desktop));
  content.push(text("=== TAPMART PRODUCT BRAIN ===\n" + brain + "\n=== END ==="));

  const schema = a.mode === "system" ? SYSTEM_SCHEMA : SCREEN_SCHEMA;
  const body = {
    model: a.model, background: true, store: true, instructions: DESIGNER,
    input: [{ role: "user", content }],
    text: { format: { type: "json_schema", name: schema.name, schema: schema.schema, strict: true } },
    max_output_tokens: 20000,
  };
  if (supportsReasoning(a.model)) body.reasoning = { effort: a.effort };
  const headers = { "content-type": "application/json" };
  if (process.env.OPENAI_API_KEY) headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;

  console.error(`Designing ${a.mode === "system" ? "the UI system" : `"${a.screenName}"`} with ${a.model} (${a.effort}).`);
  if (a.dryRun) {
    const kb = Math.round(JSON.stringify(body).length / 1024);
    console.error(`Dry run: model ${body.model}, reasoning ${JSON.stringify(body.reasoning ?? null)}, ${content.length} input parts, request about ${kb} KB. Nothing sent.`);
    return;
  }
  const started = Date.now();
  const submit = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
  const submitText = await submit.text();
  if (!submit.ok) { console.error(`OpenAI answered ${submit.status}: ${submitText.slice(0, 600)}`); process.exit(2); }
  let data = JSON.parse(submitText);
  const id = data.id;
  while (["queued", "in_progress"].includes(data.status)) {
    if (Date.now() - started > MAX_WAIT_MS) { console.error(`Gave up; ${id} still ${data.status}.`); process.exit(2); }
    await new Promise((r) => setTimeout(r, POLL_MS));
    const poll = await fetch(`${ENDPOINT}/${id}`, { headers, signal: AbortSignal.timeout(60_000) });
    const t = await poll.text();
    if (!poll.ok) { console.error(`Polling failed ${poll.status}: ${t.slice(0, 300)}`); process.exit(2); }
    data = JSON.parse(t);
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  if (data.status !== "completed") { console.error(`Ended as ${data.status}: ${JSON.stringify(data.error ?? data.incomplete_details ?? {}).slice(0, 400)}`); process.exit(2); }
  const message = (data.output ?? []).find((o) => o.type === "message");
  const part = message?.content?.find((c) => c.type === "output_text");
  if (!part?.text) { console.error("No text in the answer."); process.exit(2); }
  const spec = JSON.parse(part.text);
  mkdirSync(OUT_DIR, { recursive: true });
  const base = join(OUT_DIR, a.mode === "system" ? "system" : slug(a.screenName));
  writeFileSync(`${base}.json`, JSON.stringify({ screen: a.screenName, model: a.model, when: new Date().toISOString(), usage: data.usage ?? null, spec }, null, 2));
  writeFileSync(`${base}.md`, md(a.mode, a.screenName, spec));
  process.stdout.write(md(a.mode, a.screenName, spec));
  const u = data.usage ?? {};
  console.error(`Saved ${base}.md (${((Date.now() - started) / 1000).toFixed(0)}s, tokens in ${u.input_tokens ?? "?"} / out ${u.output_tokens ?? "?"}).`);
}

main().catch((e) => { console.error(e?.message ?? e); process.exit(1); });
