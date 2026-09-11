import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { respond, textPart, type InputPart, type Usage } from "./client";
import { runCreativeJob, type CreativeJobResult } from "./creative";
import type { CreativeBrief, CreativeInput } from "./director";
import { MODELS, route, type Effort } from "./models";
import { REBOOT_A_SCHEMA, REBOOT_B_SCHEMA, REBOOT_C_SCHEMA } from "./reboot-schemas";
import { totalUsage } from "./assets";

/**
 * The design reboot: GPT-6 Astra designs TapMart from a blank canvas.
 *
 * Astra sees ONLY the functional inventory (what the product does). No
 * screenshot, no reference image, no campaign image, no previous spec and
 * no product brain reaches it, so nothing from the old design can leak in.
 * Three chained calls produce the master package; Astra then writes the
 * mockup briefs itself, the final image model renders them, and Astra
 * reviews each render before it is accepted. Nothing here touches the
 * application. The package is written to docs/reboot for approval.
 */

const ROOT = process.cwd();
export const REBOOT_DIR = path.join(ROOT, "docs", "reboot");
export const INVENTORY_PATH = path.join(REBOOT_DIR, "TAPMART_FUNCTIONAL_INVENTORY.md");

export const REBOOT_INSTRUCTIONS = [
  "You are the PRODUCT DESIGNER, UX ARCHITECT, CREATIVE DIRECTOR and ART DIRECTOR of TapMart. A coding agent (Claude Code) is the engineer and will build exactly what you specify, later, after the founder approves. You design; you never write code.",
  "This is a complete product design reset from a BLANK CANVAS, not a polish pass. You have been given only what the product DOES (a functional inventory). You have deliberately not been shown any previous TapMart design, mockup, screenshot, image, palette, component, navigation or suggestion, and you must not assume or reconstruct any. The question is not 'how do we make TapMart look better'. The question is: if a world class product team were creating TapMart today from a blank canvas, knowing only what the product does, what should the entire experience look and feel like?",
  "No visual restrictions. There is no required theme, colour, accent, glass, card system, typography, navigation style, gradient, shape language or layout system. Light, dark, adaptive or mixed; photography, generated imagery, illustration, cinematic video, 3D, interactive objects, spatial or editorial layouts, device compositions, full bleed media, minimal utility UI, motion, scroll linked experiences, custom typography, unusual but intuitive navigation: anything is allowed if it improves TapMart.",
  "The real constraint: TapMart must be EXTREMELY SIMPLE TO USE. A completely new user understands it without explanation. A person must quickly see: how can I make money, how much, what exactly do I do, what am I working on, was my submission approved, where is my money. A business must quickly see: who can promote my business, which cars can advertise for me, what content do I have, what should I post, what campaigns are running, what needs my attention, how do I launch something new, what am I paying for. TapMart may be complicated underneath; it must feel simple on top.",
  "Preserve every product capability in the inventory and its logic: routes may be reorganised, backend architecture may not be changed to make a diagram cleaner. Three earning types only: Recreate Reel (video driven), Instagram Story ad (ready to post vertical creative), Car advertising (physical, vehicle driven); they share a brand system but must not look identical. Do not invent more campaign categories. User destinations stay close to Home, Activity, Earnings, Profile; Business destinations close to Home (marketplace of people and cars), Content, Create, Campaigns, Business, with Settings deeper. Do not explode navigation into many permanent tabs. The subscription (real content shoots, scheduling, recommendations) is separate from campaign spending and the design must make that understandable. Content states are honest: not subscribed, shoot upcoming, shoot completed, processing, ready, approved, scheduled, published; empty states are beautiful without lying. The vehicle system may feel impressive where appropriate, but TapMart is not a car app.",
  "The public website is part of the reboot and may be far more expressive (cinematic media, animation, 3D, device mockups, scroll choreography, large type); the logged in app prioritises speed and clarity. Same brand, different intensity.",
  "Explicitly avoid generated product aesthetics: purple or blue AI gradients, neon glow, glass everywhere, cards everywhere, icon in rounded square everywhere, giant radii on everything, countless pills, useless badges, unnecessary dashboard charts, generic SaaS or marketplace grids, excessive borders, fake analytics, tiny text, huge empty areas, repeated components with different text, futuristic styling with no purpose. Do not build everything as cards: create visual rhythm with full bleed media, video, compact rows, editorial sections, media rails, stacked layers, sticky visuals, direct text on background, sheets, overlays, 3D stages, timelines, immersive detail views, simple lists, and cards only where an object needs to read as one. Media does the work wherever media communicates better than text. Question every sentence: if it is not needed for the next decision, remove it, hide it, move it into detail, or show it visually.",
  "Design mobile and desktop as related but intentionally composed experiences; mobile almost native, desktop using space intelligently. Account for readable contrast, 44px touch targets, keyboard navigation, focus states, screen reader semantics, reduced motion, readable type and responsive scaling.",
  "Explore at least three substantially different directions internally (theme, colour, density, typography, media treatment, navigation, motion, personality), critique them yourself, choose the strongest, merge ideas only when it truly improves the result, and present ONE recommended master direction. Judge your work against clarity, uniqueness, usability, visual quality, consistency, interaction quality, media quality, information hierarchy, responsiveness, implementability and brand recognition, never against 'looks clean, modern or premium'. The result must feel intentionally created by a strong human product and design team, not generated from a template.",
  "Be exact wherever a value can be exact: hex colours, font families with real sources, sizes in px, weights, spacing, ratios, durations, easings, and the order of content top to bottom. Every statement must be buildable or decidable without a follow up question. Return the JSON only.",
].join("\n\n");

export type RebootOptions = {
  effort?: Effort;
  /** Reuse parts and concept images already saved in the out directory instead of paying for them again. */
  resume?: boolean;
  skipMockups?: boolean;
  /** How many mockups to render (the director writes at least five briefs). */
  mockupCount?: number;
  dryRun?: boolean;
  outDir?: string;
  onProgress?: (m: string) => void;
};

export type RebootResult = {
  a: Record<string, unknown> | null;
  b: Record<string, unknown> | null;
  c: Record<string, unknown> | null;
  mockups: { screen: string; result: CreativeJobResult; files: string[] }[];
  usage: Usage[];
  files: string[];
};

export async function runReboot(o: RebootOptions = {}): Promise<RebootResult> {
  const say = o.onProgress ?? (() => {});
  const out = o.outDir ?? REBOOT_DIR;
  const usage: Usage[] = [];
  const r = route("ui_system", o.effort);
  const inventory = await readFile(INVENTORY_PATH, "utf8");
  const base: InputPart[] = [textPart(`=== TAPMART FUNCTIONAL INVENTORY (what the product does; the only source) ===\n${inventory}\n=== END ===`)];

  const saved = async (name: string): Promise<Record<string, unknown> | null> => {
    if (!o.resume) return null;
    try { return JSON.parse(await readFile(path.join(out, name), "utf8")); } catch { return null; }
  };
  const savedA = await saved("master-package-a.json");
  if (savedA) say("Part A: reusing the saved answer");
  else say(`Part A (thesis, alternatives, art direction, information architecture, navigation) with ${r.model} (${r.effort})`);
  const a = savedA ? { data: savedA, usage: { model: r.model } as Usage } : await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: REBOOT_INSTRUCTIONS, maxOutputTokens: 60000, dryRun: o.dryRun, onProgress: undefined,
    content: [textPart("Study the inventory until you understand the product completely. Then produce PART A of the master design package: the product design thesis, the three or more directions you explored with honest critique, the chosen direction, the complete brand and art direction chosen from scratch, the information architecture with the user and business journeys, and the navigation system for mobile User mode, desktop User mode, mobile Business mode, desktop Business mode and the public site, including mode switching."), ...base],
    schema: REBOOT_A_SCHEMA,
  });
  if (!savedA) usage.push(a.usage);
  if (o.dryRun) return { a: null, b: null, c: null, mockups: [], usage, files: [] };
  await mkdir(out, { recursive: true });
  if (!savedA) await writeFile(path.join(out, "master-package-a.json"), JSON.stringify(a.data, null, 2));

  const savedB = await saved("master-package-b.json");
  if (savedB) say("Part B: reusing the saved answer");
  else say(`Part B (components, media, motion, four master screens, public homepage, mockup briefs) with ${r.model} (${r.effort})`);
  const b = savedB ? { data: savedB, usage: { model: r.model } as Usage } : await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: REBOOT_INSTRUCTIONS, maxOutputTokens: 60000,
    content: [
      textPart("PART A of the package, which you already produced, follows; PART B must be consistent with it and may refine it only where the detail work reveals a better answer (say so in the relevant field)."),
      textPart(`=== PART A ===\n${JSON.stringify(a.data)}\n=== END ===`),
      textPart("Produce PART B: the component language (including which content types must NOT share a component), the media system, the motion and interaction system, the four master logged in screens in serious detail (User Home, User Profile, Business Home, Business Content: mobile and desktop compositions, hierarchy, actions, media, interaction, motion, removed, hidden deeper, honest states, responsive, accessibility), the public homepage from scratch (Recreate, Post, Drive, Get paid, and the business side), and the mockup briefs: at least five complete image prompts for brand new concept images of this direction (User Home, User Profile, Business Home, Business Content, Public Homepage), each communicating composition, colour, type, media, depth and personality. Prompts describe a photographic render of a real product on a real device or a real desktop composition in your art direction, with real looking people, places and cars; no legible fake copy beyond a word or two; nothing from any previous TapMart imagery."),
      ...base,
    ],
    schema: REBOOT_B_SCHEMA,
  });
  if (!savedB) { usage.push(b.usage); await writeFile(path.join(out, "master-package-b.json"), JSON.stringify(b.data, null, 2)); }

  const savedC = await saved("master-package-c.json");
  if (savedC) say("Part C: reusing the saved answer");
  else say(`Part C (application to the whole product, creative system, self critique, QA) with ${r.model} (${r.effort})`);
  const c = savedC ? { data: savedC, usage: { model: r.model } as Usage } : await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: REBOOT_INSTRUCTIONS, maxOutputTokens: 60000,
    content: [
      textPart("PARTS A and B of the package, which you already produced, follow."),
      textPart(`=== PART A ===\n${JSON.stringify(a.data)}\n=== END ===`),
      textPart(`=== PART B ===\n${JSON.stringify(b.data)}\n=== END ===`),
      textPart("Produce PART C: how this exact system applies to every remaining screen without reverting to generic dashboard UI; the creative system for future assets; the self critique, question by question, with honest answers, and the fixes you made to the master direction where an answer did not pass; the QA scores against the eleven criteria with evidence; implementation readiness for the engineer; and any decision only the founder can make. Inspect your own design critically. If something fails, fix the direction here before it is presented."),
      ...base,
    ],
    schema: REBOOT_C_SCHEMA,
  });
  if (!savedC) { usage.push(c.usage); await writeFile(path.join(out, "master-package-c.json"), JSON.stringify(c.data, null, 2)); }

  const mockups: RebootResult["mockups"] = [];
  if (!o.skipMockups) {
    const briefs = ((b.data.mockup_briefs as MockupBrief[]) ?? []).slice(0, o.mockupCount ?? 5);
    const art = a.data.art_direction as Record<string, unknown>;
    const direction = (a.data.chosen_direction as { name: string }).name;
    for (const m of briefs) {
      say(`Mockup: ${m.screen} (${m.device}, ${m.aspect_ratio}) with ${MODELS.image_final}, reviewed by ${MODELS.director}`);
      const result = await runCreativeJob(conceptInput(m, direction, art), {
        tier: "final", maxFixRounds: 1, save: false, outDir: path.join(out, "concepts"), onProgress: say,
      }, { brief: conceptBrief(m), brandRead: `Direction: ${direction}. ${String(art.why_it_fits ?? "")}`, audienceRead: "The founder approving the direction." });
      usage.push(...result.usage);
      mockups.push({ screen: m.screen, result, files: result.files ?? [] });
    }
  }

  const md = packageMarkdown(a.data, b.data, c.data, mockups, usage);
  const mdPath = path.join(out, "MASTER_DESIGN_PACKAGE.md");
  await writeFile(mdPath, md);
  return { a: a.data, b: b.data, c: c.data, mockups, usage, files: [mdPath, ...mockups.flatMap((m) => m.files)] };
}

type MockupBrief = { screen: string; device: string; aspect_ratio: CreativeBrief["aspect_ratio"]; what_it_must_communicate: string[]; prompt: string; avoid: string[] };

function conceptInput(m: MockupBrief, direction: string, art: Record<string, unknown>): CreativeInput {
  return {
    type: "UI_CONCEPT",
    business: { name: "TapMart", category: "product design reboot", description: `Concept mockup of the ${m.screen} in the direction "${direction}".`, colors: colorsOf(art), tone: String(art.motion_principles ?? "") },
    objective: `Communicate the recommended direction for ${m.screen}: ${m.what_it_must_communicate.join("; ")}.`,
    placement: `Concept image for the founder's approval, ${m.device}, ${m.aspect_ratio}. It is inspiration and specification, not the implementation.`,
    constraints: ["No legible fake copy beyond a word or two; composition, colour, type, media, depth and personality carry it", "Nothing that looks like a template or a generic dashboard", ...m.avoid],
    aspect: m.aspect_ratio,
  };
}

function conceptBrief(m: MockupBrief): CreativeBrief {
  return {
    title: m.screen, concept: m.what_it_must_communicate.join(" "), subject: `${m.screen} on ${m.device}`, environment: "", composition: "", camera: "", lighting: "", color_treatment: "",
    headline: "", cta: "", aspect_ratio: m.aspect_ratio, preserve: [], avoid: m.avoid, image_route: "final", generation_mode: "generate", prompt: m.prompt, source_image_use: "",
  };
}

function colorsOf(art: Record<string, unknown>): string[] {
  const all = [...((art.primary_colors as { hex: string }[]) ?? []), ...((art.secondary_colors as { hex: string }[]) ?? [])];
  return all.map((c) => c.hex).filter(Boolean);
}

// ---------------------------------------------------------------- markdown

type Any = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));

function packageMarkdown(a: Any, b: Any, c: Any, mockups: RebootResult["mockups"], usage: Usage[]): string {
  const L: string[] = [];
  const h = (n: number, t: string) => L.push(`${"#".repeat(n)} ${t}`, "");
  const p = (t: unknown) => { if (str(t)) L.push(str(t), ""); };
  const list = (items: unknown) => { if (Array.isArray(items) && items.length) { for (const i of items) L.push(`- ${str(i)}`); L.push(""); } };
  const kv = (o: unknown) => { if (o && typeof o === "object") { for (const [k, v] of Object.entries(o as Any)) if (!Array.isArray(v) && typeof v !== "object") L.push(`- **${k.replace(/_/g, " ")}.** ${str(v)}`); L.push(""); } };

  h(1, "TapMart master design package");
  p(`Designed from a blank canvas by ${MODELS.director}. Concept images rendered by ${MODELS.image_final} and reviewed by the director. Awaiting the founder's approval; nothing has been implemented.`);

  const thesis = a.thesis as Any;
  h(2, "Part 1. Product design thesis"); kv(thesis);
  h(2, "Directions explored");
  for (const alt of (a.alternatives_explored as Any[]) ?? []) { h(3, `${str(alt.name)} (${str(alt.outcome)})`); p(alt.summary); L.push("Strengths:"); list(alt.strengths); L.push("Weaknesses:"); list(alt.weaknesses); }
  const chosen = a.chosen_direction as Any;
  h(2, `Recommended direction: ${str(chosen?.name)}`); p(chosen?.why_it_won); list(chosen?.what_was_merged);

  const art = a.art_direction as Any;
  h(2, "Part 2. Brand and art direction");
  p(art.theme_strategy);
  h(3, "Colour"); for (const cc of [...((art.primary_colors as Any[]) ?? []), ...((art.secondary_colors as Any[]) ?? [])]) L.push(`- **${str(cc.name)}** \`${str(cc.hex)}\`: ${str(cc.role)}`); L.push("");
  h(3, "Typography"); for (const t of (art.typography as Any[]) ?? []) L.push(`- **${str(t.face)}**, ${str(t.role)}: ${str(t.why)}`); L.push("");
  L.push("| role | size | weight | tracking | line height |", "| --- | --- | --- | --- | --- |"); for (const t of (art.type_hierarchy as Any[]) ?? []) L.push(`| ${str(t.role)} | ${str(t.size_px)} | ${str(t.weight)} | ${str(t.tracking)} | ${str(t.line_height)} |`); L.push("");
  for (const k of ["spacing", "grid", "shapes", "surfaces", "depth", "borders", "shadows", "photography", "video", "iconography", "illustration", "three_d", "generated_imagery", "motion_principles", "device_framing", "logo", "why_it_fits"]) { h(3, k.replace(/_/g, " ")); p(art[k]); }

  const ia = a.information_architecture as Any;
  h(2, "Part 3. Information architecture"); h(3, "Audit"); list(ia.audit); h(3, "User journey"); list(ia.user_journey); h(3, "Business journey"); list(ia.business_journey); h(3, "Removed complexity"); list(ia.removed_complexity); h(3, "Preserved capabilities"); list(ia.preserved_capabilities);
  h(2, "Part 4. Navigation"); kv(a.navigation);

  h(2, "Part 5. Component language");
  for (const comp of (b.components as Any[]) ?? []) { h(3, str(comp.name)); p(comp.anatomy); L.push("Used for:"); list(comp.used_for); L.push("Never reused for:"); list(comp.must_not_be_reused_for); if ((comp.variants as unknown[])?.length) { L.push("Variants:"); list(comp.variants); } }
  h(2, "Part 6. Media system"); list(b.media_system);
  h(2, "Part 7. Motion and interaction"); list(b.motion_system);

  h(2, "Part 8. The four master screens");
  for (const s of (b.master_screens as Any[]) ?? []) {
    h(3, str(s.name)); p(`**Three seconds.** ${str(s.three_second_read)}`); p(`**Mobile.** ${str(s.mobile_composition)}`); p(`**Desktop.** ${str(s.desktop_composition)}`);
    for (const k of ["information_hierarchy", "primary_actions", "secondary_actions", "media", "interaction", "motion", "removed", "hidden_deeper", "empty_and_loading", "responsive", "accessibility"]) { L.push(`**${k.replace(/_/g, " ")}**`, ""); list(s[k]); }
  }

  const home = b.public_homepage as Any;
  h(2, "Part 9. Public homepage"); p(`**Message.** ${str(home.message)}`);
  for (const s of (home.sections as Any[]) ?? []) { h(3, str(s.name)); p(s.purpose); p(`Composition: ${str(s.composition)}`); p(`Media: ${str(s.media)}`); p(`Motion: ${str(s.motion)}`); p(`Copy: ${str(s.copy)}`); }
  for (const k of ["explains_recreate_post_drive_get_paid", "business_side", "cta_strategy", "desktop_vs_phone", "performance_and_accessibility"]) { h(3, k.replace(/_/g, " ")); p(home[k]); }

  h(2, "Part 10. Concept images");
  if (mockups.length === 0) p("No concept images were rendered in this run.");
  for (const m of mockups) {
    const last = m.result.rounds[m.result.rounds.length - 1];
    const img = m.files.find((f) => /round\d+\.(png|jpg|webp)$/.test(f) && f.includes(`round${last?.round ?? 1}`)) ?? m.files.find((f) => /\.(png|jpg|webp)$/.test(f));
    h(3, m.screen);
    if (img) L.push(`![${m.screen}](${path.relative(REBOOT_DIR, img).split(path.sep).join("/")})`, "");
    p(`**Director review: ${str(last?.review?.verdict).toUpperCase()}.** ${str(last?.review?.summary)}`);
    if (last?.review) { const s = last.review.scores; p(`purpose ${s.purpose} · brand ${s.brand} · professional ${s.professional} · not AI looking ${s.not_ai_looking} · premium ${s.premium}`); list(last.review.problems); }
    p(`Rounds: ${m.result.rounds.map((x) => `${x.round} ${x.action} (${x.imageModel})`).join(", ")}. Director approved: ${m.result.approvedByDirector ? "yes" : "no"}.`);
  }

  h(2, "Part 11. Application to the whole product");
  for (const s of (c.application as Any[]) ?? []) L.push(`- **${str(s.screen)}.** ${str(s.treatment)} ${s.distinct_from_master_screens ? `Distinct: ${str(s.distinct_from_master_screens)}` : ""}`); L.push("");
  h(2, "Part 12. Creative system");
  for (const s of (c.creative_system as Any[]) ?? []) { h(3, str(s.asset)); p(s.direction); p(s.production); list(s.quality_bar); }
  h(2, "Part 13. Self critique");
  for (const q of (c.self_critique as Any[]) ?? []) L.push(`- **${str(q.question)}** ${q.passes ? "Pass." : "Fail."} ${str(q.honest_answer)}${q.fix ? ` Fix: ${str(q.fix)}` : ""}`); L.push("");
  h(3, "Fixes applied"); list(c.fixes_applied);
  h(2, "Part 14. QA");
  L.push("| criterion | score | evidence |", "| --- | --- | --- |"); for (const q of (c.qa as Any[]) ?? []) L.push(`| ${str(q.criterion)} | ${str(q.score)} | ${str(q.evidence)} |`); L.push("");
  const ir = c.implementation_readiness as Any;
  h(2, "Implementation readiness (after approval only)"); p(`First screen: ${str(ir?.first_screen_to_build)}`); list(ir?.build_order); list(ir?.engineering_notes); L.push("Risks:"); list(ir?.risks);
  h(2, "Questions for the founder"); list(c.open_questions_for_the_founder);
  const u = totalUsage(usage);
  p(`Usage: ${u.calls} calls, ${u.input_tokens} input tokens, ${u.output_tokens} output tokens, ${u.images} images.`);
  return L.join("\n");
}
