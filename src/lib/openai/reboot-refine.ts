import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { imagePart, loadImage, respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route, type Effort } from "./models";
import { slug } from "./prompts";

/**
 * The final art direction refinement pass. Frame Shift is approved as the
 * product and UX foundation, not yet as the final art direction. Astra sees
 * the real screenshots of the coded prototypes and its own second pass
 * verdicts, and refines the visual system and four screens (Public
 * Homepage, Business Home, User Profile, User Home) from "clean premium
 * product" to "this could only be TapMart". Business Content gets
 * consistency fixes only. The UX brain is untouched. Real code and real
 * screenshots follow; the final review uses the founder's standard.
 */

/* Computed here rather than imported so the director, reboot and refine modules never form an import cycle. */
const REBOOT_DIR = path.join(process.cwd(), "docs", "reboot");
const VISUAL_DIR = path.join(REBOOT_DIR, "visual");
export const REFINE_DIR = path.join(REBOOT_DIR, "refine");

const S = (description?: string) => (description ? { type: "string", description } : { type: "string" });
const L = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });
const obj = (properties: Record<string, unknown>, description?: string) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties), ...(description ? { description } : {}) });
const SCORE = { type: "integer", minimum: 0, maximum: 10 };

const REFINED_SCREEN = obj({
  name: S(), route: S(), viewport: S("phone 390x844, desktop 1440x900, or both"),
  three_second_read: S(),
  what_makes_it_only_tapmart: S("The signature of this screen: the thing no well designed marketplace would have."),
  what_changes_from_current: L("Each change from the current build, concrete, with the reason. Keep the structure that works."),
  composition: { type: "array", items: obj({ region: S(), height_or_size: S(), content: S("Exactly what is in it: sizes, colours, type roles, media, spacing."), technology: S("plain CSS, video, 3D, scroll linked, canvas, and so on; or none"), state_shown: S("The honest mock state this region demonstrates.") }), description: "Top to bottom on the target viewport. For the public page, desktop first, then the phone differences." },
  choreography: L("For scroll linked or staged regions: what moves, in what order, over which scroll distance, and what is pinned. Empty for screens with none."),
  money: S("Where amounts sit and how they look."),
  media: L("Every media item: ratio, size, treatment, asset id (existing or new)."),
  motion_and_interaction: L("Each interaction: trigger, duration, easing, what it explains, reduced motion."),
  phone: L("Phone specifics when the screen has both viewports; otherwise empty."),
  removed_or_hidden: L(),
  mock_data: L("Any new fixture records. Clearly fictional."),
  implementation_steps: L(),
  acceptance: L("What Astra will check in the real screenshot."),
});

export const REFINE_SCHEMA: JsonSchema = {
  name: "tapmart_refinement",
  schema: obj({
    founder_read: S("What the founder asked for, in your words, and what you will and will not change."),
    diagnosis: L("What in the current screenshots reads as a well designed marketplace rather than TapMart, screen by screen."),
    signature: obj({
      idea: S("The one visual and interaction idea that makes TapMart unmistakable, in a paragraph."),
      rules: L("How the signature shows up, as rules the engineer can apply."),
      what_it_is_not: L("Guardrails: what would turn it into AI slop, Instagram, TikTok, a car app, or a directory."),
    }),
    system_refinements: {
      type: "array",
      items: obj({ area: { type: "string", enum: ["accent", "background_temperature", "graphite", "typography", "shape", "spacing", "media_framing", "mark", "motion", "depth", "iconography", "other"] }, current: S(), refined: S("Exact values: hex, px, weights, durations, easings."), why: S("Why this makes the whole system more distinctive, not merely different."), keep: { type: "boolean", description: "True when the current value stays." } }),
      description: "Every token area, including the ones that stay unchanged.",
    },
    tokens: obj({
      colors: { type: "array", items: obj({ name: S(), hex: S(), role: S(), css_var: S("the --tm-* variable name") }) },
      typography: { type: "array", items: obj({ face: S(), weights: S(), role: S(), google_fonts: { type: "boolean" } }) },
      type_scale: { type: "array", items: obj({ role: S(), phone: S(), desktop: S(), weight: S(), tracking: S() }) },
      radius: S(), shadows: S(), motion: { type: "array", items: obj({ name: S(), trigger: S(), duration_ms: S(), easing: S(), what_it_explains: S(), reduced_motion: S() }) },
      mark: S("The mark treatment, exact."),
    }),
    screens: { type: "array", minItems: 4, maxItems: 4, items: REFINED_SCREEN, description: "Public Homepage (desktop and phone), Business Home (desktop), User Profile (phone), User Home (phone), in that order." },
    business_content_consistency: L("Only consistency fixes for Business Content so it matches the refined system; nothing structural."),
    vehicle_moment: obj({
      when_a_real_model_exists: S("The small premium interactive presentation: size, framing, lighting, controls, limits."),
      when_it_does_not: S("The honest state with the best real photography: exactly what the Lab builds now, since the fixture person has no reconstruction."),
      why_it_is_not_a_car_app: S(),
    }),
    assets: {
      type: "array",
      items: obj({ id: S("Stable id, e.g. filming-eli-01"), purpose: S(), used_by: L(), kind: { type: "string", enum: ["photo", "story_creative", "car", "portrait", "background", "illustration", "product", "video_poster"] }, aspect_ratio: { type: "string", enum: ["9:16", "4:5", "1:1", "16:9", "3:2"] }, prompt: S("Complete generation prompt in the photography treatment. No UI, no text unless a Story creative."), avoid: L() }),
      description: "Only NEW supporting images the refined screens need; existing asset ids are reused as they are. Empty when none are needed.",
    },
    engineering_notes: L(),
    self_critique: L("Where this refinement could still fail the founder's standard, and what you did about it."),
  }),
};

const REFINE_INSTRUCTIONS = [
  "You are the PRODUCT DESIGNER, CREATIVE DIRECTOR and ART DIRECTOR of TapMart. Claude Code is the engineer and builds real React and CSS in an isolated Design Lab; a browser captures real screenshots; you review them. Image models render supporting imagery only, never UI.",
  "Frame Shift, your chosen direction, is APPROVED by the founder as the product and UX foundation, and NOT yet approved as the final art direction. This is ONE final art direction refinement pass. Keep the information architecture, flows, money semantics, content logic, navigation structure, honest statuses, real backend states, progressive disclosure, fewer cards, short copy, media first Content and the Recreate, Story and Car distinction exactly as they are.",
  "The goal, in the founder's words: take Frame Shift from 'clean premium product' to 'this could only be TapMart'. Do not add complexity, more text, or generic cards. Improve uniqueness, art direction, media composition, spatial layout, motion, product personality, memorability and premium feel. You may refine accent colour, background temperature, graphite usage, typography, shape language, spacing, media framing and the mark treatment, but only when the change makes the whole system more distinctive; do not change colours merely to be different.",
  "PUBLIC HOMEPAGE is the biggest priority. The current desktop page is too empty and too static between sections; the Recreate, Post and Drive chapters do not use the page strongly enough. Redesign those chapters so the page feels intentionally choreographed: sticky product stage, real product UI, phone screens, video, split screen transitions, depth, scroll linked media, changing background treatments, horizontal movement, real photography, vehicle visualisation, the Story creative, live UI states are all allowed. No huge empty areas to look minimal. Each chapter must visually demonstrate the product: RECREATE shows reference, then a person filming, then the real TapMart earning UI; POST shows the supplied Story creative, then eligibility, then the posting or work state; DRIVE shows the vehicle, then the ad placement concept, then the monthly campaign or work state. The business section must feel like a real product demonstration, not two static screenshots under text. The whole page is one continuous story. Phone stays simple and vertically understandable.",
  "BUSINESS HOME still reads as a directory, CRM or classified listing. The business must feel it is discovering real marketing opportunities. People: visual and desirable to explore with strong portraits and work media, concise creator fit information, real Instagram state only when available, work examples, clear direct request actions; no influencer popularity cards. Cars: premium physical advertising inventory with strong photography, placement zones, monthly asking price, city, meaningful details, and an optional real 3D state only when one exists. Alive and browseable without becoming a social feed.",
  "USER PROFILE is usable but too settings like. Keep its simplicity and order (person first, then earned, completed, rating, Instagram, verification, vehicle, recent work, earnings, portfolio, settings) and improve the identity and premium layer. Introduce ONE memorable Smart Vehicle moment: when a real 3D reconstruction exists, a small premium interactive presentation; when it does not (the fixture person has none), the best real photography and an honest state. TapMart is not a car app; the car is not enormous. It should feel like a capability other earning platforms do not have.",
  "USER HOME structure is good; make it feel more alive. Recreate, Story and Car keep different compositions; push media integration and transitions; pay stays immediately understandable; no more visible text. Explore a muted reference preview, an active media state, Story poster depth, a vehicle stage, save and action feedback, smooth content transitions. Not Instagram, not TikTok.",
  "BUSINESS CONTENT is the strongest screen: consistency fixes only if the refined system requires them.",
  "Technology is welcome when it materially improves the product: 3D, WebGL, interactive vehicle models, animated product screens, video, scroll effects, depth, image generation for supporting media. Forbidden: random blobs, decorative 3D shapes, AI neon, meaningless motion, fake futuristic scanning graphics, fabricated data or proof. Everything must be buildable by one engineer in React, CSS, three.js and standard video within days, with exact values. You will judge the result against this standard: does it now feel unmistakably like TapMart rather than simply a well designed marketplace, with brand recognition, uniqueness and usability each at 9 or above, without sacrificing usability for uniqueness. Return the JSON only.",
].join("\n\n");

export type RefineOptions = { effort?: Effort; resume?: boolean; dryRun?: boolean; screenshots?: string[]; reviews?: string[]; onProgress?: (m: string) => void };

export async function runRefine(o: RefineOptions = {}): Promise<{ refinement: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const usage: Usage[] = [];
  await mkdir(REFINE_DIR, { recursive: true });
  const saved = async () => { if (!o.resume) return null; try { return JSON.parse(await readFile(path.join(REFINE_DIR, "refinement.json"), "utf8")); } catch { return null; } };
  const pendingPath = path.join(REFINE_DIR, ".pending-refine.json");
  let resumeId: string | null = null;
  if (o.resume) { try { resumeId = JSON.parse(await readFile(pendingPath, "utf8")).id; } catch {} }
  if (resumeId) say(`Re-attaching to response ${resumeId}`);

  const directions = JSON.parse(await readFile(path.join(VISUAL_DIR, "visual-directions.json"), "utf8"));
  const labScreens = JSON.parse(await readFile(path.join(VISUAL_DIR, "lab-screens.json"), "utf8"));
  const content: InputPart[] = [
    textPart("Refine Frame Shift for the final art direction pass. Your visual system, your five Design Lab screen specs, the REAL screenshots of the coded prototypes (the current state) and your own second pass verdicts follow. Diagnose what still reads as a well designed marketplace, define the signature that makes it unmistakably TapMart, refine the system, and specify the four screens exactly. Existing assets may be reused by id; brief only new ones."),
    textPart(`=== YOUR VISUAL SYSTEM (chosen direction) ===\n${JSON.stringify({ chosen: directions.chosen, visual_system: directions.visual_system, what_changes_visually: directions.what_changes_visually })}\n=== END ===`),
    textPart(`=== YOUR CURRENT SCREEN SPECS ===\n${JSON.stringify(labScreens.screens)}\n=== END ===`),
    textPart(`=== EXISTING ASSET IDS (already rendered, reusable) ===\n${JSON.stringify((labScreens.assets as { id: string; kind: string; aspect_ratio: string; purpose: string }[]).map((a) => ({ id: a.id, kind: a.kind, ratio: a.aspect_ratio, purpose: a.purpose })))}\n=== END ===`),
  ];
  for (const f of o.screenshots ?? []) {
    const img = await loadImage(f);
    if (!img) { say(`Screenshot not readable: ${f}`); continue; }
    content.push(textPart(`REAL SCREENSHOT of the current coded prototype: ${path.basename(f)}`), imagePart(img));
  }
  for (const f of o.reviews ?? []) {
    try {
      const r = JSON.parse(await readFile(f, "utf8"));
      const v = r.review ?? r;
      content.push(textPart(`=== YOUR SECOND PASS VERDICT: ${r.screen ?? path.basename(f)} ===\n${JSON.stringify({ verdict: v.verdict, three_second_read: v.three_second_read, tapmart_match: v.tapmart_match, premium_feel: v.premium_feel, generic_ai_look: v.generic_ai_look, remaining: v.checklist })}\n=== END ===`));
    } catch { say(`Review not readable: ${f}`); }
  }
  const r = route("ui_system", o.effort);
  let refinement = await saved();
  if (refinement) say("Reusing the saved refinement");
  else {
    say(`Refinement with ${r.model} (${r.effort}); ${o.screenshots?.length ?? 0} screenshots, ${o.reviews?.length ?? 0} verdicts`);
    const res = await respond<Record<string, unknown>>({
      model: r.model, effort: r.effort, instructions: REFINE_INSTRUCTIONS, maxOutputTokens: 70000, dryRun: o.dryRun, content, schema: REFINE_SCHEMA,
      maxWaitMs: 60 * 60_000, resumeId, onSubmitted: (rid: string) => { void writeFile(pendingPath, JSON.stringify({ id: rid })); },
    });
    usage.push(res.usage);
    if (o.dryRun) return { refinement: null, usage, files: [] };
    refinement = res.data;
    await writeFile(path.join(REFINE_DIR, "refinement.json"), JSON.stringify(refinement, null, 2));
  }
  await mkdir(path.join(REFINE_DIR, "screens"), { recursive: true });
  for (const s of (refinement!.screens as { name: string }[]) ?? []) {
    await writeFile(path.join(REFINE_DIR, "screens", `${slug(s.name)}.json`), JSON.stringify({ screen: s.name, model: r.model, when: new Date().toISOString(), spec: s }, null, 2));
  }
  const mdPath = path.join(REFINE_DIR, "REFINEMENT.md");
  await writeFile(mdPath, refineMarkdown(refinement!));
  return { refinement, usage, files: [mdPath] };
}

// ------------------------------------------------------ the final standard

/** The founder's final review standard for the refined Design Lab screens. */
export const LAB_FINAL_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_lab_final_review",
  schema: obj({
    verdict: S("One sentence."),
    unmistakably_tapmart: { type: "boolean", description: "Does this now feel unmistakably like TapMart rather than simply a well designed marketplace?" },
    why: S("Why yes or why not, concretely, from the pixels."),
    three_second_read: S(),
    scores: obj({ clarity: SCORE, usability: SCORE, uniqueness: SCORE, media_quality: SCORE, interaction_quality: SCORE, brand_recognition: SCORE, premium_feel: SCORE, mobile_quality: SCORE, desktop_quality: SCORE, ai_slop_risk: { ...SCORE, description: "10 = high risk of reading as AI slop; 0 = none." } }),
    score_notes: obj({ clarity: S(), usability: S(), uniqueness: S(), media_quality: S(), interaction_quality: S(), brand_recognition: S(), premium_feel: S(), mobile_quality: S(), desktop_quality: S(), ai_slop_risk: S() }),
    ux_brain_intact: { type: "boolean", description: "The flows, money semantics, honest states and navigation are unchanged." },
    keep: L(),
    checklist: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S(), where: S(), why: S() }), description: "Exact, buildable changes that would raise the scores. Empty when none." },
    motion: L("What the still cannot verify and what to confirm in a recording."),
    ready_for_production: { type: "boolean", description: "Would you sign off this screen's art direction for implementation across TapMart?" },
    readiness_note: S("What, if anything, stands between this and production."),
  }),
};

export type LabFinalReview = {
  verdict: string; unmistakably_tapmart: boolean; why: string; three_second_read: string;
  scores: Record<string, number>; score_notes: Record<string, string>; ux_brain_intact: boolean; keep: string[];
  checklist: { priority: number; change: string; where: string; why: string }[]; motion: string[]; ready_for_production: boolean; readiness_note: string;
};

export function finalReviewerInstructions(foundation: string, system: string | null, ownSpec: string | null): string {
  return [
    "You are TapMart's CREATIVE DIRECTOR, PRODUCT DESIGNER and ART DIRECTOR. Claude Code is the engineer. This job is the FINAL DESIGN LAB REVIEW against the founder's standard. Claude Code built a real coded prototype of the screen you refined, and a browser captured a REAL screenshot of it.",
    "Answer the founder's question honestly: does this now feel unmistakably like TapMart rather than simply a well designed marketplace? Score clarity, usability, uniqueness, media quality, interaction quality (as far as a still shows it), brand recognition, premium feel, mobile quality, desktop quality and AI slop risk from 0 to 10. The targets are brand recognition 9 or more, uniqueness 9 or more, usability 9 or more; never trade usability for uniqueness. Confirm the UX brain is intact. Give exact, buildable fixes that would raise the scores; ten strong items beat thirty weak ones. Say whether you would sign off this screen's art direction for implementation across TapMart. Return the JSON only.",
    "=== YOUR REFINED SYSTEM AND SIGNATURE ===", system ?? "(missing)", "=== END ===",
    ...(ownSpec ? ["=== YOUR REFINED SPEC FOR THIS SCREEN ===", ownSpec, "=== END ==="] : []),
    "=== UX FOUNDATION ===", foundation, "=== END ===",
  ].join("\n\n");
}

export async function refinedSystemText(): Promise<string | null> {
  try {
    const r = JSON.parse(await readFile(path.join(REFINE_DIR, "refinement.json"), "utf8"));
    return JSON.stringify({ signature: r.signature, system_refinements: r.system_refinements, tokens: r.tokens, vehicle_moment: r.vehicle_moment });
  } catch { return null; }
}

export async function loadRefinedSpecText(spec: string | null, screenName: string): Promise<{ path: string; text: string } | null> {
  const dir = path.join(REFINE_DIR, "screens");
  const file = spec ? (/\.json$/.test(spec) ? path.resolve(spec) : path.join(dir, `${spec}.json`)) : path.join(dir, `${slug(screenName.split(/[(,]/)[0].trim())}.json`);
  try { return { path: file, text: JSON.stringify(JSON.parse(await readFile(file, "utf8")).spec) }; } catch { return null; }
}

// ---------------------------------------------------------------- markdown

type Any = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));

export function refineMarkdown(r: Any): string {
  const L: string[] = [];
  const h = (n: number, t: string) => L.push(`${"#".repeat(n)} ${t}`, "");
  const p = (t: unknown) => { if (str(t)) L.push(str(t), ""); };
  const list = (items: unknown) => { if (Array.isArray(items) && items.length) { for (const i of items) L.push(`- ${str(i)}`); L.push(""); } };
  h(1, "Frame Shift: final art direction refinement");
  p(r.founder_read); h(2, "Diagnosis"); list(r.diagnosis);
  const sig = r.signature as Any; h(2, "The signature"); p(sig?.idea); list(sig?.rules); L.push("What it is not:"); list(sig?.what_it_is_not);
  h(2, "System refinements");
  for (const x of (r.system_refinements as Any[]) ?? []) L.push(`- **${str(x.area)}** ${x.keep ? "(kept)" : ""}: ${str(x.refined)} ${x.keep ? "" : `(was: ${str(x.current)})`} ${str(x.why)}`);
  L.push("");
  const t = r.tokens as Any;
  if (t) {
    h(3, "tokens");
    for (const c of (t.colors as Any[]) ?? []) L.push(`- **${str(c.name)}** \`${str(c.hex)}\` ${str(c.css_var)}: ${str(c.role)}`);
    L.push("");
    for (const f of (t.typography as Any[]) ?? []) L.push(`- **${str(f.face)}** (${str(f.weights)}): ${str(f.role)}`);
    L.push("", "| role | phone | desktop | weight | tracking |", "| --- | --- | --- | --- | --- |");
    for (const s of (t.type_scale as Any[]) ?? []) L.push(`| ${str(s.role)} | ${str(s.phone)} | ${str(s.desktop)} | ${str(s.weight)} | ${str(s.tracking)} |`);
    L.push(""); p(`Radius: ${str(t.radius)}`); p(`Shadows: ${str(t.shadows)}`); p(`Mark: ${str(t.mark)}`);
    for (const m of (t.motion as Any[]) ?? []) L.push(`- **${str(m.name)}**: ${str(m.trigger)}, ${str(m.duration_ms)}ms, ${str(m.easing)}. ${str(m.what_it_explains)} Reduced motion: ${str(m.reduced_motion)}`);
    L.push("");
  }
  h(2, "Screens");
  for (const s of (r.screens as Any[]) ?? []) {
    h(3, `${str(s.name)} (${str(s.viewport)}) at ${str(s.route)}`);
    p(`**Three seconds.** ${str(s.three_second_read)}`); p(`**Only TapMart.** ${str(s.what_makes_it_only_tapmart)}`);
    L.push("Changes from the current build:"); list(s.what_changes_from_current);
    for (const c of (s.composition as Any[]) ?? []) L.push(`- **${str(c.region)}** [${str(c.height_or_size)}] ${str(c.content)} (${str(c.technology)}; state: ${str(c.state_shown)})`);
    L.push("");
    if (Array.isArray(s.choreography) && s.choreography.length) { L.push("Choreography:"); list(s.choreography); }
    p(`**Money.** ${str(s.money)}`); L.push("Media:"); list(s.media); L.push("Motion and interaction:"); list(s.motion_and_interaction);
    if (Array.isArray(s.phone) && s.phone.length) { L.push("Phone:"); list(s.phone); }
    L.push("Acceptance:"); list(s.acceptance);
  }
  h(2, "Business Content consistency"); list(r.business_content_consistency);
  const v = r.vehicle_moment as Any; h(2, "The vehicle moment"); p(`With a real model: ${str(v?.when_a_real_model_exists)}`); p(`Without: ${str(v?.when_it_does_not)}`); p(str(v?.why_it_is_not_a_car_app));
  h(2, "New assets"); for (const a of (r.assets as Any[]) ?? []) L.push(`- **${str(a.id)}** (${str(a.kind)}, ${str(a.aspect_ratio)}) for ${str(a.used_by)}: ${str(a.purpose)}`); L.push("");
  h(2, "Engineering notes"); list(r.engineering_notes); h(2, "Self critique"); list(r.self_critique);
  return L.join("\n");
}

export function finalReviewMarkdown(review: LabFinalReview, ctx: { screenName: string; screenshot: string; model: string; effort: string; when: string; instructions: string | null; specPath: string | null }): string {
  const L = [`# Final review: ${ctx.screenName}`, ""];
  L.push(`Screenshot: \`${path.basename(ctx.screenshot)}\`${ctx.specPath ? ` · Against: \`${path.basename(ctx.specPath)}\`` : ""} · Model: ${ctx.model} (${ctx.effort}) · ${ctx.when}`);
  if (ctx.instructions) L.push(`Instructions: ${ctx.instructions}`);
  L.push("", `**Verdict.** ${review.verdict}`, "", `**Unmistakably TapMart: ${review.unmistakably_tapmart ? "YES" : "NO"}.** ${review.why}`, "", `**Ready for production: ${review.ready_for_production ? "YES" : "NO"}.** ${review.readiness_note}`, "", `UX brain intact: ${review.ux_brain_intact ? "yes" : "NO"}`, "", `**Three seconds.** ${review.three_second_read}`, "");
  L.push("| score | 0 to 10 | note |", "| --- | --- | --- |");
  for (const [k, v] of Object.entries(review.scores)) L.push(`| ${k.replace(/_/g, " ")} | ${v} | ${review.score_notes?.[k] ?? ""} |`);
  L.push("");
  if (review.keep?.length) { L.push("## Keep", ""); for (const k of review.keep) L.push(`- ${k}`); L.push(""); }
  L.push("## Checklist", ""); for (const c of [...(review.checklist ?? [])].sort((a, b) => a.priority - b.priority)) L.push(`${c.priority}. **${c.change}** (${c.where}). ${c.why}`); L.push("");
  if (review.motion?.length) { L.push("## Motion", ""); for (const m of review.motion) L.push(`- ${m}`); L.push(""); }
  return L.join("\n");
}

// ------------------------------------------------------------ transfer QA

/** Production implementation QA: was Frame Shift transferred faithfully, and does the real product still work? */
export const TRANSFER_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_transfer_review",
  schema: obj({
    verdict: S("One sentence."),
    faithful_transfer: { type: "boolean", description: "Was Frame Shift faithfully transferred to production, judged from the production capture against the approved Lab capture?" },
    functionality_intact: { type: "boolean", description: "Does the production screen still expose TapMart's real functionality (its data, states, actions and navigation) as far as a capture shows?" },
    why: S("Concrete reasons from the pixels."),
    scores: obj({ fidelity: SCORE, clarity: SCORE, usability: SCORE, uniqueness: SCORE, brand_recognition: SCORE, premium_feel: SCORE, media_quality: SCORE, viewport_quality: { ...SCORE, description: "Quality at the captured viewport (phone 390, phone 320 or desktop)." }, ai_slop_risk: { ...SCORE, description: "10 = high risk; 0 = none." } }),
    drift: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S("The exact implementation fix, with values."), where: S(), why: S(), kind: { type: "string", enum: ["drift", "usability", "data_honesty", "responsive"] } }) , description: "Implementation drift from the approved design and real usability problems; never a new art direction." },
    keep: L(),
    expected_differences: L("Differences that are correct because production has real data and real states where the Lab had fixtures."),
    ready_to_ship: { type: "boolean", description: "Would you sign off this screen at this viewport for release?" },
    readiness_note: S(),
  }),
};

export type TransferReview = {
  verdict: string; faithful_transfer: boolean; functionality_intact: boolean; why: string; scores: Record<string, number>;
  drift: { priority: number; change: string; where: string; why: string; kind: string }[]; keep: string[]; expected_differences: string[]; ready_to_ship: boolean; readiness_note: string;
};

export function transferReviewerInstructions(system: string | null, ownSpec: string | null): string {
  return [
    "You are TapMart's DESIGN QA DIRECTOR. Frame Shift is the approved final art direction; you are no longer redesigning TapMart. Claude Code migrated a production screen to Frame Shift using the approved Design Lab as the visual source of truth and the existing production application as the functional and data source of truth. A browser captured the REAL production screen with REAL data; the approved Lab capture of the same screen follows it.",
    "Answer the founder's question: was Frame Shift faithfully transferred without breaking TapMart's real functionality? Compare the production capture with the approved Lab capture value by value (surfaces, type, spacing, the source-to-commitment joint, media treatment, money, status text, navigation, controls). Production shows real records and real states, so exact content differs; judge structure, hierarchy and treatment, and list the differences that are correct because the data is real (an initial instead of a portrait, a video reference, a missing model, an empty state) under expected_differences. Do not ask for demo labels in production. Flag implementation drift with exact fixes, and flag genuine usability problems. Never propose another art direction. Return the JSON only.",
    "=== THE APPROVED FRAME SHIFT SYSTEM ===", system ?? "(missing)", "=== END ===",
    ...(ownSpec ? ["=== THE APPROVED SCREEN SPEC ===", ownSpec, "=== END ==="] : []),
  ].join("\n\n");
}

export function transferReviewMarkdown(r: TransferReview, ctx: { screenName: string; screenshot: string; reference: string; model: string; effort: string; when: string; instructions: string | null }): string {
  const L = [`# Transfer QA: ${ctx.screenName}`, ""];
  L.push(`Production: \`${path.basename(ctx.screenshot)}\` · Approved Lab: \`${path.basename(ctx.reference)}\` · Model: ${ctx.model} (${ctx.effort}) · ${ctx.when}`);
  if (ctx.instructions) L.push(`Instructions: ${ctx.instructions}`);
  L.push("", `**Verdict.** ${r.verdict}`, "", `**Faithful transfer: ${r.faithful_transfer ? "YES" : "NO"}. Functionality intact: ${r.functionality_intact ? "YES" : "NO"}. Ready to ship: ${r.ready_to_ship ? "YES" : "NO"}.** ${r.readiness_note}`, "", r.why, "");
  L.push("| score | 0 to 10 |", "| --- | --- |");
  for (const [k, v] of Object.entries(r.scores)) L.push(`| ${k.replace(/_/g, " ")} | ${v} |`);
  L.push("");
  if (r.keep?.length) { L.push("## Keep", ""); for (const k of r.keep) L.push(`- ${k}`); L.push(""); }
  if (r.expected_differences?.length) { L.push("## Expected differences (real data)", ""); for (const k of r.expected_differences) L.push(`- ${k}`); L.push(""); }
  L.push("## Drift and usability", ""); for (const c of [...(r.drift ?? [])].sort((a, b) => a.priority - b.priority)) L.push(`${c.priority}. [${c.kind}] **${c.change}** (${c.where}). ${c.why}`); L.push("");
  return L.join("\n");
}
