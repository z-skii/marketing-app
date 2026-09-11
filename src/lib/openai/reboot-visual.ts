import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route, type Effort } from "./models";
import { REBOOT_DIR } from "./reboot";
import { slug } from "./prompts";

/**
 * The visual reboot, round two. The founder kept the UX brain of the master
 * package (information architecture, journeys, honest states, money
 * semantics, progressive disclosure, fewer cards, media first) and reopened
 * every visual decision. Astra explores at least three new visual
 * directions on top of that foundation, chooses one, defines a buildable
 * visual system, then specifies five coded prototypes for the Design Lab
 * and the supporting imagery to generate. Real code and real screenshots
 * follow; no image-rendered UI.
 */

export const VISUAL_DIR = path.join(REBOOT_DIR, "visual");

const S = (description?: string) => (description ? { type: "string", description } : { type: "string" });
const L = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });
const obj = (properties: Record<string, unknown>, description?: string) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties), ...(description ? { description } : {}) });
const SCORE = { type: "integer", minimum: 0, maximum: 10 };

export const VISUAL_DIRECTIONS_SCHEMA: JsonSchema = {
  name: "tapmart_visual_directions",
  schema: obj({
    founder_feedback_read: S("What the founder asked for, in your words, and what it changes about your earlier choices."),
    reopened_decisions: L("The restrictions you had placed on yourself that are now reopened, and what you now think of each."),
    directions: {
      type: "array", minItems: 3,
      items: obj({
        name: S(), one_line: S(),
        theme: S(), palette: { type: "array", items: obj({ name: S(), hex: S(), role: S() }) }, typography: S(), depth_and_surfaces: S(), motion: S(),
        three_d_and_video: S("Exactly where 3D, video, device frames or scroll-linked media are used, and where they are not."), navigation_presentation: S(), photography_treatment: S(),
        user_home_sketch: S("How User Home looks in this direction, in a paragraph: the three compositions, the money, the feeling."),
        public_home_sketch: S(),
        scores: obj({ clarity: SCORE, memorability: SCORE, product_fit: SCORE, ease_of_use: SCORE, visual_quality: SCORE, media_integration: SCORE, motion_potential: SCORE, mobile_quality: SCORE, desktop_quality: SCORE, brand_uniqueness: SCORE, buildability: SCORE }),
        risks: L(), outcome: S("chosen, merged (what was taken), or rejected (why)"),
      }),
      description: "At least three meaningfully different visual approaches on top of the preserved UX. The Local Edit may be one candidate but is not selected by default.",
    },
    chosen: obj({ name: S(), why_it_won: S(), what_was_merged: L(), how_it_avoids_ai_slop: S(), how_it_stays_simple: S() }),
    visual_system: obj({
      theme_strategy: S(),
      colors: { type: "array", items: obj({ name: S(), hex: S(), role: S() }) },
      typography: { type: "array", items: obj({ face: S("Family with a Google Fonts or self hosted source the engineer can load with next/font."), weights: S(), role: S() }) },
      type_scale: { type: "array", items: obj({ role: S(), phone: S("size/line height px"), desktop: S(), weight: S(), tracking: S() }) },
      spacing_and_grid: S(), radius: S(), surfaces: S(), depth_and_shadows: S(), borders_and_focus: S(),
      motion: { type: "array", items: obj({ name: S(), trigger: S(), duration_ms: S(), easing: S(), what_it_explains: S(), reduced_motion: S() }) },
      three_d: S("Where a real 3D object appears, how it is lit and framed, how it behaves on touch and hover, and the fallback when no model exists."),
      video: S("Where video plays, muted or not, poster behaviour, and what happens on slow connections."),
      device_frames: S(), backgrounds: S("Exactly what backgrounds exist and how they are built in CSS or WebGL."), imagery_treatment: S(), iconography: S(),
      brand_mark: S(), money_treatment: S("How amounts look everywhere: face, size, colour, where they sit on media."),
      accessibility: S(),
      engineering_notes: L("What Claude Code needs: token names, font loading, motion primitives, 3D library use, image pipeline, performance budgets."),
    }),
    what_stays_from_the_ux_brain: L(), what_changes_visually: L(),
  }),
};

const LAB_SCREEN = obj({
  name: S(), route: S("The Design Lab route, e.g. /design-lab/user-home"), viewport: S("phone 390x844, desktop 1440x900, or both"),
  three_second_read: S(),
  composition: { type: "array", items: obj({ region: S(), height_or_size: S(), content: S("Exactly what is in it, with sizes, colours, type roles, media and spacing."), technology: S("plain CSS, video, 3D, scroll linked, and so on; or none") }), description: "Top to bottom on the target viewport." },
  money: S("Where amounts sit and how they look on this screen."),
  media: L("Every media item, its ratio, size, treatment and which generated asset id it uses."),
  motion_and_interaction: L("Each interaction with trigger, duration, easing and what it explains."),
  depth_and_technology: S("Exactly how depth, 3D, video or scroll effects are used here, and where they are not."),
  removed_or_hidden: L("From the UX package: what stays hidden deeper on this screen."),
  states_shown_in_the_prototype: L("Which honest states the prototype demonstrates with mock data."),
  mock_data: L("The safe mock records needed: names, businesses, amounts, cities, counts. Clearly fictional."),
  implementation_steps: L(),
  acceptance: L("What Astra will check in the real screenshot."),
});

export const LAB_SCREENS_SCHEMA: JsonSchema = {
  name: "tapmart_lab_screens",
  schema: obj({
    screens: { type: "array", minItems: 5, maxItems: 5, items: LAB_SCREEN, description: "User Home (phone), User Profile (phone), Business Home (desktop), Business Content (desktop), Public Homepage (desktop and phone), in that order." },
    assets: {
      type: "array",
      items: obj({
        id: S("Stable id used by the screens, e.g. reel-cafe-01"), purpose: S(), used_by: L("Screen names"), kind: { type: "string", enum: ["photo", "story_creative", "car", "portrait", "background", "illustration", "product", "video_poster"] },
        aspect_ratio: { type: "string", enum: ["9:16", "4:5", "1:1", "16:9", "3:2"] },
        prompt: S("A complete image generation prompt: real looking people, places, products and cars in the chosen photography treatment; no text unless the asset is a Story creative with one short line; no watermarks; no UI."),
        avoid: L(),
      }),
      description: "Every supporting image the prototypes need, generated once and reused; portraits and businesses are clearly fictional mock data for the lab.",
    },
    shared_components: L("Components the five prototypes share, with their anatomy, so the lab is one system."),
    lab_notes: L("Anything the engineer must know to build these five screens as one coherent prototype set."),
  }),
};

export const VISUAL_INSTRUCTIONS = [
  "You are the PRODUCT DESIGNER, UX ARCHITECT, CREATIVE DIRECTOR and ART DIRECTOR of TapMart. Claude Code is the engineer and builds real HTML, React and CSS in an isolated Design Lab; a browser captures real screenshots; you review those. Image models render supporting imagery only (photography, creatives, cars, backgrounds), never UI.",
  "You produced a master design package. The founder KEEPS its product and UX thinking: information architecture, user and business journeys, honest states, money semantics, progressive disclosure, fewer cards, media first, minimal text, the three earning types as distinct experiences, Activity as the place to resume work, Earnings as real money, Business Home as a people and cars marketplace, Content as real delivered media, Create as only the three campaign types, simple navigation. Treat the package as the UX and product logic foundation and do not reopen it.",
  "The founder does NOT approve the visual direction. Their words: it feels too conservative, too editorial, too much like premium local business or creative studio software. They want TapMart to feel more distinctive, more alive, more technologically advanced and more memorable, without becoming AI slop, crypto, neon SaaS, or difficult to use. They point out that you created restrictions for yourself that were never product requirements: very restrained motion, avoiding expressive 3D, avoiding generated visual environments, rejecting cinematic or product driven treatments, making the application almost entirely warm light editorial. Those are reopened. Nothing is required and nothing is forbidden except bad UX and dishonest product representation. You may keep warm paper and vermilion only if they still win against real alternatives. You may change theme, palette, typography, depth, motion, identity, navigation presentation, photography treatment, 3D, video, device mockups, interactive objects, backgrounds and layouts.",
  "Technology is welcome when it materially improves the product: 3D and WebGL, video, scroll interaction, interactive vehicle models, animated device frames, depth, custom transitions, generated photography, motion graphics. Do not use effects for decoration. Still avoid random gradients, purple AI glows, floating glass everywhere, generic bento grids, meaningless 3D blobs, giant round cards, too many pills, fake analytics, decorative AI imagery pretending to be real businesses, over animation. High tech does not mean the generic AI aesthetic.",
  "The five prototypes: User Home on a phone (the most important: it must immediately feel 'I can make money here', with Recreate, Story and Car as three genuinely different compositions, money integrated elegantly into media, subtle motion and depth, very little text, exciting without noise); User Profile on a phone (identity first, then earned, completed, rating, Instagram, vehicle, recent work, payout; more memorable than a settings list; a real 3D vehicle may appear elegantly without making the profile about the car); Business Home on desktop (discovering people and cars must feel visual, premium and purpose built for marketing, not a directory, CRM, classified listing or dashboard); Business Content on desktop (photography and video dominate; reviewing, approving, editing and scheduling extremely simple; the business's real content feels alive); Public Homepage on desktop and phone (explain the product visually: real product UI, people filming, Story creative, vehicle advertising, phone screens, moving media, 3D where valuable, scroll linked storytelling, strong typography; the visitor understands Recreate, Post, Drive, Get paid and the business product without reading paragraphs).",
  "Explore at least three meaningfully different visual approaches before choosing (for example an evolved editorial local direction, a modern spatial media product, a cinematic consumer platform; these are examples, not requirements). Score each on clarity, memorability, product fit, ease of use, visual quality, media integration, motion potential, mobile quality, desktop quality, brand uniqueness and buildability, and choose the strongest. Everything you specify must be buildable in React and CSS (plus three.js for 3D and standard video) by one engineer in days, with exact values: hex, px, weights, durations, easings, ratios. Return the JSON only.",
].join("\n\n");

export type VisualRebootOptions = { effort?: Effort; resume?: boolean; dryRun?: boolean; onProgress?: (m: string) => void };

export async function runVisualReboot(o: VisualRebootOptions = {}): Promise<{ directions: Record<string, unknown> | null; screens: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const usage: Usage[] = [];
  const read = (f: string) => readFile(path.join(REBOOT_DIR, f), "utf8");
  const [a, b, c] = await Promise.all([read("master-package-a.json"), read("master-package-b.json"), read("master-package-c.json")]);
  const foundation: InputPart[] = [
    textPart(`=== THE PRESERVED UX FOUNDATION (your master package; keep its product logic) ===\nPART A:\n${JSON.stringify(JSON.parse(a))}\n\nPART B:\n${JSON.stringify(JSON.parse(b))}\n\nPART C (application, critique and fixes):\n${JSON.stringify(JSON.parse(c))}\n=== END ===`),
  ];
  await mkdir(VISUAL_DIR, { recursive: true });
  const saved = async (name: string) => { if (!o.resume) return null; try { return JSON.parse(await readFile(path.join(VISUAL_DIR, name), "utf8")); } catch { return null; } };
  const pendingPath = (p: string) => path.join(VISUAL_DIR, `.pending-${p}.json`);
  const attach = async (p: string) => {
    let id: string | null = null;
    if (o.resume) { try { id = JSON.parse(await readFile(pendingPath(p), "utf8")).id; } catch {} }
    if (id) say(`Step ${p}: re-attaching to response ${id}`);
    return { maxWaitMs: 60 * 60_000, resumeId: id, onSubmitted: (rid: string) => { void writeFile(pendingPath(p), JSON.stringify({ id: rid })); } };
  };

  const r1 = route("ui_system", o.effort);
  let directions = await saved("visual-directions.json");
  if (directions) say("Step 1: reusing the saved directions");
  else {
    say(`Step 1: three or more visual directions and the chosen visual system with ${r1.model} (${r1.effort})`);
    const res = await respond<Record<string, unknown>>({
      ...(await attach("1")), model: r1.model, effort: r1.effort, instructions: VISUAL_INSTRUCTIONS, maxOutputTokens: 60000, dryRun: o.dryRun,
      content: [textPart("Produce the visual directions and the chosen visual system. Read the founder's feedback in your instructions carefully; it reopens your earlier restrictions. Explore at least three meaningfully different approaches on top of the preserved UX, score them honestly, choose the strongest, and define the complete buildable visual system for it."), ...foundation],
      schema: VISUAL_DIRECTIONS_SCHEMA,
    });
    usage.push(res.usage);
    if (o.dryRun) return { directions: null, screens: null, usage, files: [] };
    directions = res.data;
    await writeFile(path.join(VISUAL_DIR, "visual-directions.json"), JSON.stringify(directions, null, 2));
  }

  const r2 = route("screen_design", o.effort);
  let screens = await saved("lab-screens.json");
  if (screens) say("Step 2: reusing the saved lab screens");
  else {
    say(`Step 2: five Design Lab prototype specs and the asset briefs with ${r2.model} (${r2.effort})`);
    const res = await respond<Record<string, unknown>>({
      ...(await attach("2")), model: r2.model, effort: r2.effort, instructions: VISUAL_INSTRUCTIONS, maxOutputTokens: 60000,
      content: [
        textPart("Your chosen visual direction and system follow, then the preserved UX foundation. Specify the five Design Lab prototypes exactly (User Home phone, User Profile phone, Business Home desktop, Business Content desktop, Public Homepage desktop and phone) so Claude Code can build them as real React and CSS with mock data, and list every supporting image to generate with a complete prompt. Concrete, buildable, no follow up questions."),
        textPart(`=== CHOSEN VISUAL DIRECTION AND SYSTEM ===\n${JSON.stringify(directions)}\n=== END ===`),
        ...foundation,
      ],
      schema: LAB_SCREENS_SCHEMA,
    });
    usage.push(res.usage);
    screens = res.data;
    await writeFile(path.join(VISUAL_DIR, "lab-screens.json"), JSON.stringify(screens, null, 2));
    await mkdir(path.join(VISUAL_DIR, "screens"), { recursive: true });
    for (const s of (screens.screens as { name: string }[]) ?? []) {
      await writeFile(path.join(VISUAL_DIR, "screens", `${slug(s.name)}.json`), JSON.stringify({ screen: s.name, model: r2.model, when: new Date().toISOString(), spec: s }, null, 2));
    }
  }
  const md = visualMarkdown(directions!, screens!);
  const mdPath = path.join(VISUAL_DIR, "VISUAL_DIRECTION.md");
  await writeFile(mdPath, md);
  return { directions, screens, usage, files: [mdPath] };
}

type Any = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : JSON.stringify(v));

export function visualMarkdown(d: Any, s: Any): string {
  const L: string[] = [];
  const h = (n: number, t: string) => L.push(`${"#".repeat(n)} ${t}`, "");
  const p = (t: unknown) => { if (str(t)) L.push(str(t), ""); };
  const list = (items: unknown) => { if (Array.isArray(items) && items.length) { for (const i of items) L.push(`- ${str(i)}`); L.push(""); } };
  h(1, "TapMart visual direction, round two");
  p(d.founder_feedback_read); h(2, "Reopened decisions"); list(d.reopened_decisions);
  h(2, "Directions explored");
  for (const x of (d.directions as Any[]) ?? []) {
    h(3, `${str(x.name)} (${str(x.outcome)})`); p(x.one_line); p(`Theme: ${str(x.theme)}`); p(`Typography: ${str(x.typography)}`); p(`Depth: ${str(x.depth_and_surfaces)}`); p(`Motion: ${str(x.motion)}`); p(`3D and video: ${str(x.three_d_and_video)}`); p(`Navigation: ${str(x.navigation_presentation)}`); p(`Photography: ${str(x.photography_treatment)}`);
    p(`User Home: ${str(x.user_home_sketch)}`); p(`Public home: ${str(x.public_home_sketch)}`);
    const sc = x.scores as Record<string, number>; L.push("| " + Object.keys(sc).join(" | ") + " |", "| " + Object.keys(sc).map(() => "---").join(" | ") + " |", "| " + Object.values(sc).join(" | ") + " |", "");
    L.push("Risks:"); list(x.risks);
  }
  const ch = d.chosen as Any; h(2, `Chosen: ${str(ch.name)}`); p(ch.why_it_won); list(ch.what_was_merged); p(`Avoids AI slop: ${str(ch.how_it_avoids_ai_slop)}`); p(`Stays simple: ${str(ch.how_it_stays_simple)}`);
  const v = d.visual_system as Any; h(2, "Visual system"); p(v.theme_strategy);
  for (const cc of (v.colors as Any[]) ?? []) L.push(`- **${str(cc.name)}** \`${str(cc.hex)}\`: ${str(cc.role)}`); L.push("");
  for (const t of (v.typography as Any[]) ?? []) L.push(`- **${str(t.face)}** (${str(t.weights)}): ${str(t.role)}`); L.push("");
  L.push("| role | phone | desktop | weight | tracking |", "| --- | --- | --- | --- | --- |"); for (const t of (v.type_scale as Any[]) ?? []) L.push(`| ${str(t.role)} | ${str(t.phone)} | ${str(t.desktop)} | ${str(t.weight)} | ${str(t.tracking)} |`); L.push("");
  for (const k of ["spacing_and_grid", "radius", "surfaces", "depth_and_shadows", "borders_and_focus", "three_d", "video", "device_frames", "backgrounds", "imagery_treatment", "iconography", "brand_mark", "money_treatment", "accessibility"]) { h(3, k.replace(/_/g, " ")); p(v[k]); }
  h(3, "motion"); for (const m of (v.motion as Any[]) ?? []) L.push(`- **${str(m.name)}**: ${str(m.trigger)}, ${str(m.duration_ms)}ms, ${str(m.easing)}. ${str(m.what_it_explains)} Reduced motion: ${str(m.reduced_motion)}`); L.push("");
  h(3, "engineering notes"); list(v.engineering_notes);
  h(2, "What stays from the UX brain"); list(d.what_stays_from_the_ux_brain); h(2, "What changes visually"); list(d.what_changes_visually);
  h(2, "Design Lab prototypes");
  for (const sc of (s.screens as Any[]) ?? []) {
    h(3, `${str(sc.name)} (${str(sc.viewport)}) at ${str(sc.route)}`); p(`**Three seconds.** ${str(sc.three_second_read)}`);
    for (const r of (sc.composition as Any[]) ?? []) L.push(`- **${str(r.region)}** [${str(r.height_or_size)}] ${str(r.content)} (${str(r.technology)})`); L.push("");
    p(`**Money.** ${str(sc.money)}`); L.push("Media:"); list(sc.media); L.push("Motion and interaction:"); list(sc.motion_and_interaction); p(`**Depth and technology.** ${str(sc.depth_and_technology)}`);
    L.push("States shown:"); list(sc.states_shown_in_the_prototype); L.push("Acceptance:"); list(sc.acceptance);
  }
  h(2, "Assets to generate"); for (const a of (s.assets as Any[]) ?? []) L.push(`- **${str(a.id)}** (${str(a.kind)}, ${str(a.aspect_ratio)}) for ${(a.used_by as string[]).join(", ")}: ${str(a.purpose)}`); L.push("");
  h(2, "Shared components"); list(s.shared_components); h(2, "Lab notes"); list(s.lab_notes);
  return L.join("\n");
}
