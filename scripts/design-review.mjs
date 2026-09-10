#!/usr/bin/env node
// TapMart design review: send one screenshot, the product brain and a screen
// name to OpenAI (Responses API, background mode), get back a prioritized
// implementation checklist.
//
//   npm run design-review -- ./screenshots/business-home.png "Business Home" "focus on the people cards"
//
// Options (anywhere on the command line):
//   --model <id>        OpenAI model (default: OPENAI_REVIEW_MODEL or gpt-5.5)
//   --out <dir>         where to save the review (default: design-reviews/)
//   --effort <level>    reasoning effort: low | medium | high (default: medium)
//   --reference <png>   the visual north star to compare against
//                       (default: docs/design-references/tapmart-primary-reference.png)
//   --no-reference      review against the product brain only
//   --dry-run           build the request, print its size, send nothing
//
// Every review sends the CURRENT screen, the product brain, the PRIMARY
// reference image and the screen name. The reference is the quality bar,
// not a template: the reviewer compares confidence, hierarchy, spacing,
// media, surfaces, lime restraint, chrome, depth, density and motion, and
// may recommend substantial changes (delete, move, enlarge, recompose).
//
// Authentication: an OPENAI_API_KEY environment variable when present; in a
// Claude Code cloud session the agent proxy attaches the stored credential
// and no key is needed. Node's fetch only honours HTTPS_PROXY when
// NODE_USE_ENV_PROXY=1 is set, which the npm script does.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";

const HERE = resolve(new URL(".", import.meta.url).pathname, "..");
const BRAIN_PATH = join(HERE, "docs", "TAPMART_PRODUCT_BRAIN.md");
const REFERENCE_PATH = join(HERE, "docs", "design-references", "tapmart-primary-reference.png");
// The Responses API in background mode: submit, then poll. A long reasoning
// pass keeps the HTTP connection silent for a minute or more, which proxies
// (including the Claude Code cloud proxy) cut off; polling never waits long.
const ENDPOINT = "https://api.openai.com/v1/responses";
const POLL_MS = 3000;
const MAX_WAIT_MS = 8 * 60_000;
const MAX_IMAGE_BYTES = 18 * 1024 * 1024;

function usage(message) {
  if (message) console.error(`\n${message}\n`);
  console.error(`usage: npm run design-review -- <screenshot.png> "<Screen name>" [instructions] [--model id] [--out dir] [--effort low|medium|high] [--reference png] [--no-reference] [--dry-run]`);
  process.exit(message ? 1 : 0);
}

function parseArgs(argv) {
  const opts = { model: process.env.OPENAI_REVIEW_MODEL || "gpt-5.5", out: join(HERE, "design-reviews"), effort: "medium", dryRun: false, reference: REFERENCE_PATH, useReference: true };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--model") opts.model = argv[++i];
    else if (a === "--out") opts.out = resolve(argv[++i]);
    else if (a === "--effort") opts.effort = argv[++i];
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--reference") opts.reference = resolve(argv[++i]);
    else if (a === "--no-reference") opts.useReference = false;
    else if (a === "--help" || a === "-h") usage();
    else positional.push(a);
  }
  const [screenshot, screenName, ...rest] = positional;
  if (!screenshot || !screenName) usage("Give a screenshot path and a screen name.");
  return { ...opts, screenshot: resolve(screenshot), screenName, instructions: rest.join(" ").trim() };
}

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

function loadImage(path) {
  if (!existsSync(path)) usage(`Screenshot not found: ${path}`);
  const mime = MIME[extname(path).toLowerCase()];
  if (!mime) usage(`Use a .png, .jpg or .webp screenshot (got ${extname(path)}).`);
  const bytes = readFileSync(path);
  if (bytes.length > MAX_IMAGE_BYTES) usage(`Screenshot is ${(bytes.length / 1048576).toFixed(1)} MB; keep it under 18 MB.`);
  return { dataUrl: `data:${mime};base64,${bytes.toString("base64")}`, bytes: bytes.length };
}

// What the reviewer must answer. Every item must be concrete enough to build.
const SCHEMA = {
  name: "tapmart_design_review",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      verdict: { type: "string", description: "One sentence: how far this screen is from TapMart's standard and why." },
      tapmart_match: { type: "integer", minimum: 1, maximum: 10, description: "10 = unmistakably TapMart." },
      generic_ai_look: { type: "integer", minimum: 1, maximum: 10, description: "10 = looks like a template or AI dashboard." },
      reference_match: { type: "integer", minimum: 1, maximum: 10, description: "10 = same visual confidence, hierarchy, polish and restraint as the reference image. Null-equivalent 1 when no reference was given." },
      premium_feel: { type: "integer", minimum: 1, maximum: 10, description: "10 = feels like a real high-end consumer product." },
      same_kit: { type: "boolean", description: "True only if the current screen clearly looks built from the same UI kit as the reference." },
      kit: {
        type: "object",
        additionalProperties: false,
        description: "Same UI kit as the reference? 0 = a different visual system, 10 = indistinguishable kit.",
        properties: {
          typography: { $ref: "#/$defs/kit" },
          surfaces_material: { $ref: "#/$defs/kit" },
          spacing: { $ref: "#/$defs/kit" },
          navigation: { $ref: "#/$defs/kit" },
          buttons: { $ref: "#/$defs/kit" },
          cards_rows: { $ref: "#/$defs/kit" },
          accent_color: { $ref: "#/$defs/kit" },
          media_treatment: { $ref: "#/$defs/kit" },
          visual_density: { $ref: "#/$defs/kit" },
          family_resemblance: { $ref: "#/$defs/kit" },
        },
        required: ["typography", "surfaces_material", "spacing", "navigation", "buttons", "cards_rows", "accent_color", "media_treatment", "visual_density", "family_resemblance"],
      },
      three_second_read: { type: "string", description: "What a first-time viewer understands in three seconds, in one sentence, and what they miss." },
      scores: {
        type: "object",
        additionalProperties: false,
        properties: {
          clutter: { $ref: "#/$defs/score" },
          text_amount: { $ref: "#/$defs/score" },
          media_size: { $ref: "#/$defs/score" },
          hierarchy: { $ref: "#/$defs/score" },
          spacing: { $ref: "#/$defs/score" },
          card_overuse: { $ref: "#/$defs/score" },
          money_visibility: { $ref: "#/$defs/score" },
          cta_visibility: { $ref: "#/$defs/score" },
          lime_restraint: { $ref: "#/$defs/score" },
          secondary_text_quiet: { $ref: "#/$defs/score" },
          typography: { $ref: "#/$defs/score" },
          navigation_and_glass: { $ref: "#/$defs/score" },
        },
        required: ["clutter", "text_amount", "media_size", "hierarchy", "spacing", "card_overuse", "money_visibility", "cta_visibility", "lime_restraint", "secondary_text_quiet", "typography", "navigation_and_glass"],
      },
      keep: { type: "array", items: { type: "string" }, description: "Up to 5 things that already work and must not be changed." },
      animation: { type: "array", items: { type: "string" }, description: "Up to 4 specific, subtle motion suggestions with the element and the trigger." },
      checklist: {
        type: "array",
        description: "Prioritized implementation checklist, most impactful first. Each item is one concrete change a developer can make without asking a question.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            priority: { type: "integer", minimum: 1 },
            change: { type: "string", description: "Imperative, specific, measurable where possible: 'Make creator photos 40% taller (aspect 4:5)'." },
            where: { type: "string", description: "Which element or region of the screenshot." },
            why: { type: "string", description: "One clause tying it to a TapMart rule." },
          },
          required: ["priority", "change", "where", "why"],
        },
      },
    },
    required: ["verdict", "tapmart_match", "generic_ai_look", "reference_match", "premium_feel", "same_kit", "kit", "three_second_read", "scores", "keep", "animation", "checklist"],
    $defs: {
      kit: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "integer", minimum: 0, maximum: 10, description: "0 = different visual system, 10 = same kit." },
          note: { type: "string", description: "One short sentence: the concrete difference from the reference, or 'matches'." },
        },
        required: ["score", "note"],
      },
      score: {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "integer", minimum: 1, maximum: 5, description: "5 = meets the TapMart rule fully." },
          note: { type: "string", description: "One short sentence naming the specific element." },
        },
        required: ["score", "note"],
      },
    },
  },
};

function systemPrompt(brain, hasReference) {
  return [
    "You are TapMart's visual and product design director. A coding agent (Claude Code) is the engineer: it builds the screens; you review screenshots and hand back exact, prioritized changes. You never write code and never touch files. You may recommend substantial changes: delete a section, move information, make media twice as large, replace cards with rows, use a horizontal media rail, remove copy, change the information hierarchy, simplify navigation, combine controls, turn something into a full-bleed visual, or change the composition entirely. Small padding and radius notes are welcome only after the big moves.",
    "",
    hasReference
      ? "Two images arrive. CURRENT SCREEN = what exists today. REFERENCE IMAGE = the TapMart UI KIT. It is the visual source of truth for the whole product, not inspiration. Your first and most important question: does the current screen look like it was built from the SAME UI KIT as the reference? Same dark graphite material and background tone, same surface colours and card darkness, same restrained borders and subtle top-edge light, same typography scale and weights (Inter-like, 17px semibold row titles, 14px quiet grey secondary text, 20px stats, 26px name), same bottom bar proportions (64px, 24px icons, 12px labels, lime active, grey inactive), same slim top bar with the centred wordmark, same 48px lime primary button with dark text and 14px radius, same 16px row radius and 72px row height with a 44px icon square, same 8px lime status dots, same chevrons, same media framing, same density. The content differs by screen (a profile, a feed of earning opportunities, activity rows, earnings, a marketplace of people and cars, content deliverables, campaigns, settings). Do NOT ask for cars or the reference's content on unrelated screens; do ask for every visual property of the kit. If the screen obviously belongs to another visual system, say so and score the kit dimensions low. A generic 8/10 is not allowed when the family resemblance is weak."
      : "One image arrives: CURRENT SCREEN = what exists today. Judge it against the product brain.",
    "",
    "Score the ten UI KIT dimensions from 0 to 10 each, independently and honestly: typography, surfaces and material, spacing, navigation, buttons, cards and rows, accent colour (lime) usage, media treatment, visual density, overall family resemblance. Placed side by side, would a viewer believe both are screens of the same app? Only when the answer is clearly yes may family resemblance reach 8 or more.",
    "",
    "Judge against the TapMart product brain below. Be specific: name the element, the size, the count, the copy to delete. Prefer 'remove' and 'enlarge' over 'add'. Ten strong items beat thirty weak ones. If something already meets the bar, say so under keep and move on. Never suggest fake data, placeholder media or invented numbers.",
    "",
    "Checklist items must be buildable without a follow-up question: e.g. 'Make the people card media 4:5 instead of 16:10', 'Delete the sentence under the screen title', 'Move the $75 above the title, 1.5rem lime', 'Merge the three stat boxes into one row of numbers on the page with no borders', 'Replace the four stacked cards with one media rail'.",
    "",
    "=== TAPMART PRODUCT BRAIN ===",
    brain,
    "=== END ===",
  ].join("\n");
}

function userPrompt(screenName, instructions, meta, hasReference) {
  return [
    `Screen: ${screenName}.`,
    hasReference ? "The first image is the CURRENT SCREEN. The second image is the REFERENCE IMAGE (north star)." : "",
    `Screenshot: ${meta.width ? `${meta.width}x${meta.height}px, ` : ""}${meta.kind}. A full-page phone capture can show the fixed bottom bar painted mid-page; that is a capture artifact, not a layout problem.`,
    instructions ? `Extra instructions from the team: ${instructions}` : "",
    "Answer: does this feel like the reference TapMart design; is the hierarchy strong; is media large enough; too much text; too many cards; too many borders; is money prominent; is lime restrained; is secondary text quiet; does it feel premium; does it feel like TapMart; does it feel like generic AI UI; can a person understand it in three seconds; and the exact changes Claude should implement. Return the JSON only.",
  ].filter(Boolean).join("\n");
}

function pngSize(path) {
  try {
    const b = readFileSync(path);
    if (b.length > 24 && b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  } catch {}
  return {};
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "screen";
}

function bar(n, max = 5) {
  return "#".repeat(n) + ".".repeat(Math.max(0, max - n));
}

function toMarkdown(review, ctx) {
  const lines = [];
  lines.push(`# Design review: ${ctx.screenName}`);
  lines.push("");
  lines.push(`Screenshot: \`${basename(ctx.screenshot)}\`${ctx.hasReference ? ` · Reference: \`${basename(ctx.reference)}\`` : " · No reference image"} · Model: ${ctx.model} · ${ctx.when}`);
  if (ctx.instructions) lines.push(`Instructions: ${ctx.instructions}`);
  lines.push("");
  lines.push(`**Verdict.** ${review.verdict}`);
  lines.push("");
  lines.push(`TapMart match ${review.tapmart_match}/10 · Reference match ${review.reference_match}/10 · Premium feel ${review.premium_feel}/10 · Generic AI look ${review.generic_ai_look}/10`);
  lines.push("");
  if (review.kit) {
    lines.push(`**Same UI kit as the reference: ${review.same_kit ? "yes" : "NO"}.**`);
    lines.push("");
    lines.push("| Kit dimension | 0 to 10 | Difference |");
    lines.push("| --- | --- | --- |");
    for (const [key, v] of Object.entries(review.kit)) lines.push(`| ${key.replace(/_/g, " ")} | ${v.score} | ${v.note} |`);
    lines.push("");
  }
  lines.push(`**Three seconds.** ${review.three_second_read}`);
  lines.push("");
  lines.push("| Check | Score | Note |");
  lines.push("| --- | --- | --- |");
  for (const [key, v] of Object.entries(review.scores)) {
    lines.push(`| ${key.replace(/_/g, " ")} | ${bar(v.score)} ${v.score}/5 | ${v.note} |`);
  }
  lines.push("");
  lines.push("## Do this, in order");
  lines.push("");
  for (const item of [...review.checklist].sort((a, b) => a.priority - b.priority)) {
    lines.push(`${item.priority}. **${item.change}** (${item.where}). ${item.why}`);
  }
  if (review.animation.length) {
    lines.push("");
    lines.push("## Animation");
    lines.push("");
    for (const a of review.animation) lines.push(`- ${a}`);
  }
  if (review.keep.length) {
    lines.push("");
    lines.push("## Keep");
    lines.push("");
    for (const k of review.keep) lines.push(`- ${k}`);
  }
  return lines.join("\n") + "\n";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(BRAIN_PATH)) usage(`Missing ${BRAIN_PATH}.`);
  const brain = readFileSync(BRAIN_PATH, "utf8");
  const image = loadImage(args.screenshot);
  const size = pngSize(args.screenshot);
  const meta = { ...size, kind: size.width && size.width <= 900 ? "phone capture" : "desktop capture" };
  const hasReference = args.useReference && existsSync(args.reference);
  if (args.useReference && !hasReference) console.error(`No reference image at ${args.reference}; reviewing against the product brain only.`);
  const reference = hasReference ? loadImage(args.reference) : null;

  const body = {
    model: args.model,
    background: true,
    store: true,
    instructions: systemPrompt(brain, hasReference),
    input: [
      {
        role: "user",
        content: [
          { type: "input_text", text: userPrompt(args.screenName, args.instructions, meta, hasReference) },
          { type: "input_text", text: "CURRENT SCREEN:" },
          { type: "input_image", image_url: image.dataUrl, detail: "high" },
          ...(reference ? [
            { type: "input_text", text: "REFERENCE IMAGE (north star, not a template):" },
            { type: "input_image", image_url: reference.dataUrl, detail: "high" },
          ] : []),
        ],
      },
    ],
    text: { format: { type: "json_schema", name: SCHEMA.name, schema: SCHEMA.schema, strict: true } },
  };
  if (/^(gpt-5|o[1-9])/.test(args.model)) body.reasoning = { effort: args.effort };
  else body.temperature = 0.2;

  const approxTokens = Math.round((brain.length + 2500) / 4);
  console.error(`Reviewing "${args.screenName}" with ${args.model}. Image ${(image.bytes / 1024).toFixed(0)} KB${size.width ? ` (${size.width}x${size.height})` : ""}${reference ? `, reference ${(reference.bytes / 1024).toFixed(0)} KB` : ""}, brain about ${approxTokens} text tokens.`);
  if (args.dryRun) {
    console.error("Dry run: nothing sent.");
    return;
  }

  const headers = { "content-type": "application/json" };
  if (process.env.OPENAI_API_KEY) headers.authorization = `Bearer ${process.env.OPENAI_API_KEY}`;
  else if (!process.env.HTTPS_PROXY) console.error("No OPENAI_API_KEY and no HTTPS_PROXY: the request will be rejected unless a proxy adds the credential.");

  const started = Date.now();
  const submit = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
  const submitText = await submit.text();
  if (!submit.ok) {
    console.error(`OpenAI answered ${submit.status}: ${submitText.slice(0, 600)}`);
    process.exit(2);
  }
  let data = JSON.parse(submitText);
  const id = data.id;
  while (["queued", "in_progress"].includes(data.status)) {
    if (Date.now() - started > MAX_WAIT_MS) {
      console.error(`Gave up after ${MAX_WAIT_MS / 60000} minutes; response ${id} is still ${data.status}.`);
      process.exit(2);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
    const poll = await fetch(`${ENDPOINT}/${id}`, { headers, signal: AbortSignal.timeout(60_000) });
    const pollText = await poll.text();
    if (!poll.ok) {
      console.error(`Polling ${id} failed with ${poll.status}: ${pollText.slice(0, 300)}`);
      process.exit(2);
    }
    data = JSON.parse(pollText);
    process.stderr.write(".");
  }
  process.stderr.write("\n");
  if (data.status !== "completed") {
    console.error(`Response ${id} ended as ${data.status}: ${JSON.stringify(data.error ?? data.incomplete_details ?? {}).slice(0, 400)}`);
    process.exit(2);
  }
  const message = (data.output ?? []).find((o) => o.type === "message");
  const part = message?.content?.find((c) => c.type === "output_text");
  const content = part?.text;
  if (!content) {
    console.error(`No text in the answer: ${JSON.stringify(data.output ?? data).slice(0, 600)}`);
    process.exit(2);
  }
  const review = JSON.parse(content);
  const when = new Date().toISOString();
  const ctx = { ...args, when, hasReference };
  const md = toMarkdown(review, ctx);

  mkdirSync(args.out, { recursive: true });
  const stamp = when.replace(/[:.]/g, "-").slice(0, 19);
  const base = join(args.out, `${slug(args.screenName)}-${stamp}`);
  writeFileSync(`${base}.md`, md);
  writeFileSync(`${base}.json`, JSON.stringify({ screen: args.screenName, screenshot: basename(args.screenshot), reference: hasReference ? basename(args.reference) : null, model: args.model, when, usage: data.usage ?? null, review }, null, 2));

  process.stdout.write(md);
  const u = data.usage ?? {};
  console.error(`\nSaved ${base}.md (${((Date.now() - started) / 1000).toFixed(1)}s, tokens in ${u.input_tokens ?? "?"} / out ${u.output_tokens ?? "?"}).`);
}

main().catch((e) => {
  console.error(e?.message ?? e);
  process.exit(1);
});
