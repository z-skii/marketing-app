import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route } from "./models";
import { L, NO_SLOP, S, SCORE, WHO, bullets, chosenSystemText, obj, productTruth, pushImage, read, type V2Options } from "./v2";
import { V3_DIR, V3_MEDIA, noDashes } from "./v3";

/**
 * The V3 experience: the whole TapMart redesign (public homepage, User
 * Home, User Profile, Business Home, Business Loyalty) directed against the
 * founder's experience brief (docs/design-lab-v3/EXPERIENCE_BRIEF.md) and
 * the live Artec study (docs/design-lab-v3/ARTEC_LIVE_STUDY.md).
 *
 *   v3x-direction  the design thesis, the material system, the three wow
 *                  moments, the two worlds answer for the homepage, the
 *                  user and business stories, Loyalty placement with the
 *                  reasoning, the settings architecture, the text budgets
 *                  and a hierarchy for each of the five surfaces.
 *   v3x-screen     art direct one of the five surfaces region by region.
 *   v3x-review     judge real captures and motion strips against the nine
 *                  experience questions; --final for the last pass, --verify
 *                  for a ready or blocker verdict after the final fixes.
 *
 * Everything is written to docs/design-lab-v3. Nothing here touches the
 * application, the database or production.
 */

const SCREENS_DIR = path.join(V3_DIR, "screens");
const REVIEWS_DIR = path.join(V3_DIR, "reviews");

export type V3XKey = "public-home" | "user-home" | "user-profile" | "business-home" | "business-loyalty";

export const V3X_SURFACES: Record<V3XKey, { name: string; route: string; question: string; must: string; budget: string }> = {
  "public-home": {
    name: "Public homepage", route: "/design-lab-v3",
    question: "Does the visitor understand in seconds that TapMart has two sides, MAKE MONEY and GROW YOUR BUSINESS, and does the page behave like a product experience rather than headline, paragraph, screenshot?",
    must: "The two worlds; the user story as real coded sequences (Recreate: reference, creator version, submit, approved, earnings; Post: Story creative, phone, post, proof, earnings; Drive: real car, placement, campaign, monthly earning; Get paid); the business story (Find people, Find cars, Create, Review, Content, Loyalty) and the loop Attention, Customer, Return customer through Loyalty; the three wow moments (one from user earning, one from the car, one from the business to Loyalty loop); real recordings of hero, audience switch, Recreate, Story, Car, Business discovery and the Loyalty loop.",
    budget: "Hero under 20 meaningful words besides navigation and actions. Every sequence shown, not explained.",
  },
  "user-home": {
    name: "User Home", route: "/design-lab-v3/home",
    question: "What can I earn from right now?",
    must: "Media, money, short context, action; details after interaction. Recreate, Story and Car feel physically different, not the same card. A recorded opportunity open, detail and return.",
    budget: "Roughly 20 to 35 visible words in the first 390 viewport.",
  },
  "user-profile": {
    name: "User Profile", route: "/design-lab-v3/profile",
    question: "Would a user share this as tapmart.live/@username?",
    must: "Identity, not administration: portrait, name, reputation, work, Instagram, vehicle, public achievements. Private earnings stay private where appropriate. One settings gear handles administration.",
    budget: "Roughly 20 to 30 visible words in the first 390 viewport.",
  },
  "business-home": {
    name: "Business Home", route: "/design-lab-v3/business",
    question: "Who or what can grow my business?",
    must: "People and cars feel desirable, not a directory, not CRM rows: work, creator personality, vehicles shown beautifully. Selecting a creator or car feels like choosing creative inventory. Recorded creator expand and request, and a recorded vehicle interaction. Loyalty placed by the direction's decision, not by adding a navigation item.",
    budget: "Roughly 20 to 35 visible words in the first 390 viewport.",
  },
  "business-loyalty": {
    name: "Business Loyalty", route: "/design-lab-v3/business/loyalty",
    question: "Does Loyalty strengthen the story, and does it belong inside the final V3 language?",
    must: "Keep the approved foundation (architecture, first touch attribution, member model, visits and points, reward unlock, redemption, QR, Wallet concepts, privacy, aggregate creator attribution, event history) and restyle the surfaces into the V3 material and motion. Loyalty Home 390 and 1440, create program, Wallet card, QR signup, a recorded visit to reward, the attribution view.",
    budget: "Loyalty Home first 390 viewport roughly 20 to 35 words. Counts, never revenue.",
  },
};

export const EXPERIENCE_QUESTIONS = [
  "Would someone keep scrolling?",
  "Does motion reveal the product?",
  "Is this more desirable than production?",
  "Is the hierarchy instantly understood?",
  "Does this feel like a consumer product?",
  "Does the Business side justify paying?",
  "Does Loyalty strengthen the story?",
  "Are we actually at the quality benchmark?",
  "Are there at least three memorable product moments?",
];

const YES = { type: "string", enum: ["yes", "partly", "no"] };
const QA = { type: "array", items: obj({ question: S(), answer: YES, note: S() }) };

// ---------------------------------------------------------- direction

export const V3X_DIRECTION_SCHEMA: JsonSchema = {
  name: "tapmart_v3_experience_direction",
  schema: obj({
    founder_read: S("What the founder is asking for, in your words, including where the earlier Open Cut direction fell short of the material the founder means."),
    artec_read: S("What the live Artec study actually shows, what to take from it and what TapMart must do that Artec does not."),
    thesis: S("The V3 design thesis in ONE short paragraph, for the founder."),
    material_system: obj({
      principle: S("What glass is in TapMart V3 and when it is allowed; never blur plus border plus rounded rectangle on everything."),
      layers: L("The named material layers from canvas to floating material, each with its role and exact CSS values: background, blur, saturation, border or stroke, inset highlight, tinted shadow, corner radius."),
      allowed_on: L("Where material is used, and why each earns it."),
      forbidden_on: L("Where material must NOT be used."),
      refraction_and_depth: S("How content visibly moves beneath material and how depth is produced without heavy shadows; exact techniques."),
      motion_easing: L("Named easings and durations with their uses (open, settle, reveal, scrub, return)."),
      reduced_motion: S("Exact behaviour under prefers-reduced-motion and a visible pause control."),
      tokens: { type: "array", items: obj({ token: S(), value: S(), role: S() }) },
      typography: { type: "array", items: obj({ face: S(), role: S(), sizes: S() }) },
    }),
    two_worlds: obj({
      answer: S("How the homepage presents MAKE MONEY and GROW YOUR BUSINESS as two worlds on one page; the mechanism, not a slogan."),
      hero: S("The hero object, its motion and its words (under 20 meaningful words)."),
      audience_switch: S("How a visitor moves between the two worlds and what visibly changes; what is recorded."),
      wording: L("The candidate wordings for the two worlds, strongest first."),
    }),
    wow_moments: { type: "array", items: obj({ name: S(), world: { type: "string", enum: ["user_earning", "car", "business_loyalty_loop"] }, surface: S(), product_object: S("The real product object that moves, from the fixture."), motion: S("Exactly what moves, in what order, with durations and easings."), explains: S("What a visitor understands after it that they did not before."), trigger: S("Scroll position, tap, autoplay, or pointer; and how it replays."), reduced_motion: S(), engineering: S("How Claude Code builds it: coded, not video; the elements and the technique.") }) },
    user_story: { type: "array", items: obj({ act: { type: "string", enum: ["recreate", "post", "drive", "get_paid"] }, frames: L("The frames in order, each one object and at most a few words."), motion: S(), copy: L("Every visible string, total under 25 words per act."), media: L("Fixture media used, from the available list.") }) },
    business_story: obj({
      chapters: { type: "array", items: obj({ chapter: { type: "string", enum: ["find_people", "find_cars", "create", "review", "content", "loyalty"] }, object: S(), motion: S(), copy: L() }) },
      loop: obj({ frames: L("Attention, Customer, Return customer as objects: creator Story, customer, Loyalty signup, Wallet card, repeat visit, reward, source attribution."), motion: S(), copy: L(), why_it_is_powerful: S() }),
    }),
    loyalty_placement: obj({
      decision: S("The permanent Business architecture for Loyalty."),
      reasoning: L("Why, including why it is not a bottom navigation item, or why it must be."),
      discovery: S("How a business discovers it and how often it is one tap away."),
      navigation: L("The final Business destinations, unchanged or changed, with the reason."),
    }),
    settings_architecture: obj({ entry: S("The single gear and what it opens."), user: L(), business: L(), removed_from_visible_ui: L() }),
    surfaces: { type: "array", items: obj({ key: { type: "string", enum: ["public-home", "user-home", "user-profile", "business-home", "business-loyalty"] }, first_question: S(), two_second_read: S(), hierarchy: L("Top to bottom, phone first."), physically_different: S("How the object kinds on this surface differ physically (for User Home: Recreate, Story, Car)."), not_a_card: L("Where a card was refused and what replaced it: media stage, layer, sheet, full bleed object, strip, floating material, inline expansion, spatial arrangement."), motion: L(), copy_budget: S(), visible_strings: L("Every visible string in the default state."), on_demand: L(), truth: L() }) },
    recordings: L("The list of recordings the package must contain, each with the route, the interaction and the frames that prove the product."),
    text_budgets: { type: "array", items: obj({ surface: S(), viewport: S(), target_words: S(), rule: S() }) },
    what_not_to_build: L(),
    self_critique: L("Where this direction could still become slop, generic SaaS or a dashboard redesign, and the rule that prevents it."),
  }),
};

async function experienceMaterial(): Promise<{ brief: string; artec: string; truth: string; loyaltyDirection: string; loyaltyBrief: string }> {
  const rel = (f: string) => path.relative(process.cwd(), path.join(V3_DIR, f));
  const [brief, artec, truth, loyaltyBrief] = await Promise.all([read(rel("EXPERIENCE_BRIEF.md")), read(rel("ARTEC_LIVE_STUDY.md")), productTruth(), read(rel("BRIEF.md"))]);
  let loyaltyDirection = "(no loyalty direction)";
  try { loyaltyDirection = JSON.stringify(JSON.parse(await readFile(path.join(V3_DIR, "loyalty-direction.json"), "utf8")).direction); } catch { /* keep the placeholder */ }
  return { brief, artec, truth, loyaltyDirection, loyaltyBrief };
}

function directionInstructions(m: Awaited<ReturnType<typeof experienceMaterial>>, sys: { chosen: string; system: string; direction: string }): string {
  return [
    WHO,
    "This job is the V3 EXPERIENCE DIRECTION: the whole TapMart redesign, not a Loyalty feature. The founder approved the Loyalty concept and architecture to keep, then said the earlier Open Cut direction did not capture the material quality they meant and that V3 must reach the benchmark they pointed to (Artec, studied live, pasted below). Decide the thesis, the material system, the three wow moments, the two worlds answer for the homepage, the user and business stories, Loyalty's permanent placement with reasoning, the settings architecture, the text budgets and the hierarchy of each of the five surfaces.",
    "Rules. The website behaves like a product experience, never headline, paragraph, screenshot. Show, do not explain. Product and motion together; no decorative animation. Material is a real, rationed thing: transparent depth, layered surfaces, refraction, controlled blur, content moving beneath material, subtle highlights, physical hierarchy, restrained tinted shadows, responsive materials, excellent easing. Not blur plus border plus radius on everything. Before a card, ask whether it needs to be one. Recreate, Story and Car must feel physically different. Loyalty is not automatically a bottom navigation item; give the reasoning. Every surface has a visible word budget. Nothing fake: no invented metrics, no fake states, fixture media only.",
    "Keep everything that was approved in the Loyalty concept: the architecture, first touch attribution, the member model, visits and points, unlock and redemption, the QR flows, the Wallet concepts, the privacy model, aggregate creator attribution and the event history. Restyle its surfaces into the V3 language; do not redesign its logic.",
    "You have full authority over the design. Where the V2 system (pasted) is right, keep it; where it is not the material the founder means, replace it and say so. You may search the current web to verify a product, design or platform detail (for example current Apple material guidance, Wallet pass behaviour, or how a benchmark site actually moves); the live Artec study pasted below is primary evidence and web results never replace it. Return the JSON only.",
    NO_SLOP,
    "=== THE EXPERIENCE BRIEF ===", m.brief, "=== END ===",
    "=== THE LIVE ARTEC STUDY ===", m.artec, "=== END ===",
    "=== PRODUCT TRUTH ===", m.truth, "=== END ===",
    "=== THE V2 SYSTEM (chosen direction) ===", sys.chosen, sys.system, "=== END ===",
    "=== THE APPROVED V3 LOYALTY DIRECTION ===", m.loyaltyDirection, "=== END ===",
    "=== THE LOYALTY BRIEF (excerpt) ===", m.loyaltyBrief.slice(0, 5000), "=== END ===",
    "=== AVAILABLE MEDIA ===", V3_MEDIA.map((x) => `${x.path}: ${x.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
}

export async function runV3XDirection(o: V2Options & { captures?: string[] } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const r = route("ui_system", o.effort);
  const [m, sys] = await Promise.all([experienceMaterial(), chosenSystemText()]);
  const content: InputPart[] = [textPart("Study the experience brief, the live Artec study, the product truth, the V2 system and the approved Loyalty direction. Then decide the V3 experience direction. Captures of the current lab follow as a functionality inventory only; they have no visual authority.")];
  for (const c of o.captures ?? []) await pushImage(content, c, `CURRENT LAB ${path.basename(c)}:`, "low");
  const pendingPath = path.join(V3_DIR, ".pending-experience-direction.json");
  let resumeId: string | null = null;
  if (o.resume) { try { resumeId = JSON.parse(await readFile(pendingPath, "utf8")).id ?? null; } catch { resumeId = null; } }
  say(resumeId ? `Experience direction: re-attaching to response ${resumeId}` : `Experience direction with the design director (${r.effort})`);
  await mkdir(V3_DIR, { recursive: true });
  const res = await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: directionInstructions(m, sys), content, schema: V3X_DIRECTION_SCHEMA,
    maxOutputTokens: 60000, maxWaitMs: 60 * 60_000, dryRun: o.dryRun, resumeId, webSearch: true,
    onSubmitted: (id) => { void writeFile(pendingPath, JSON.stringify({ id, when: new Date().toISOString() })); },
    onProgress: o.onProgress,
  });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  res.data = noDashes(res.data);
  const jsonPath = path.join(V3_DIR, "experience-direction.json");
  const mdPath = path.join(V3_DIR, "EXPERIENCE_DIRECTION.md");
  await writeFile(jsonPath, JSON.stringify({ when: new Date().toISOString(), author: "director", direction: res.data }, null, 2));
  await writeFile(mdPath, directionMarkdown(res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- screen

export const V3X_SCREEN_SCHEMA: JsonSchema = {
  name: "tapmart_v3_experience_screen",
  schema: obj({
    first_question: S(),
    two_second_read: S(),
    thesis: S("What this surface is, in one paragraph."),
    phone: obj({ regions: { type: "array", items: obj({ name: S(), y_from: S(), height: S(), object: S("Media stage, layer, sheet, full bleed object, strip, floating material, inline expansion or spatial arrangement; a card only with a reason."), material: S("Which material layer, with values, or none."), content: L("Every visible string."), action: S(), motion: S() }) }, first_viewport_words: S() }),
    desktop: obj({ grid: S(), regions: { type: "array", items: obj({ name: S(), placement: S(), object: S(), material: S(), content: L(), action: S(), motion: S() }) } }),
    object_kinds: { type: "array", items: obj({ kind: S(), physical_difference: S("Shape, material, motion and size that make it unmistakably itself."), media: S() }) },
    states: { type: "array", items: obj({ state: S(), what_changes: S(), visible_strings: L() }) },
    interactions: { type: "array", items: obj({ name: S(), trigger: S(), what_moves: S(), duration_ms: S(), easing: S(), returns: S("How it returns and where focus lands."), reduced_motion: S(), recorded: S("Whether the package must record it and the frames that prove it.") }) },
    wow_moment: S("If this surface carries one of the three wow moments, the exact execution; otherwise: none."),
    copy_budget: obj({ target: S(), every_visible_string: L() }),
    on_demand: L(),
    removed: L("What the current lab shows that this surface must not."),
    truth: L(),
    engineering_notes: L("Techniques, layers, z order, performance limits (no layout thrash, compositor only motion, image sizes)."),
    acceptance: L("What Astra will check in the captures and recordings."),
  }),
};

export async function runV3XScreen(key: V3XKey, o: V2Options & { phone?: string | null; desktop?: string | null; notes?: string | null } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const def = V3X_SURFACES[key];
  const r = route("screen_design", o.effort);
  const [m, sys, direction] = await Promise.all([experienceMaterial(), chosenSystemText(), experienceDirectionText()]);
  const content: InputPart[] = [textPart([
    `Surface: ${def.name} (${def.route}).`, `The question it answers: ${def.question}`, `It must contain: ${def.must}`, `Budget: ${def.budget}`,
    o.notes ? `Notes from the engineer: ${o.notes}` : "",
    "Captures of the current lab follow as a functionality inventory only. Design the surface from scratch inside your V3 experience direction. Return the JSON only.",
  ].filter(Boolean).join("\n"))];
  await pushImage(content, o.phone, "CURRENT LAB, PHONE (inventory only):", "low");
  await pushImage(content, o.desktop, "CURRENT LAB, DESKTOP (inventory only):", "low");
  say(`Design ${def.name} (${r.effort})`);
  const instructions = [
    WHO,
    "This job is V3 EXPERIENCE SCREEN ART DIRECTION. You wrote the V3 experience direction (pasted). Art direct ONE surface for the engineer, region by region, phone (390) first, then desktop (1440). Each region names its object kind (a card only with a reason), its material layer with values, every visible string, its action and its motion. Interactions get durations, easings, return behaviour and reduced motion. The word budget is a hard number for the first phone viewport. Nothing fake; fixture media only.",
    NO_SLOP,
    "=== THE V3 EXPERIENCE DIRECTION ===", direction, "=== END ===",
    "=== THE EXPERIENCE BRIEF (excerpt) ===", m.brief.slice(0, 7000), "=== END ===",
    "=== THE LIVE ARTEC STUDY (excerpt) ===", m.artec.slice(0, 7000), "=== END ===",
    "=== PRODUCT TRUTH ===", m.truth, "=== END ===",
    "=== THE V2 SYSTEM (for what is kept) ===", sys.chosen, sys.system, "=== END ===",
    ...(key === "business-loyalty" || key === "business-home" ? ["=== THE APPROVED LOYALTY DIRECTION ===", m.loyaltyDirection, "=== END ==="] : []),
    "=== AVAILABLE MEDIA ===", V3_MEDIA.map((x) => `${x.path}: ${x.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions, content, schema: V3X_SCREEN_SCHEMA, maxOutputTokens: 40000, maxWaitMs: 40 * 60_000, dryRun: o.dryRun, webSearch: true, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  await mkdir(SCREENS_DIR, { recursive: true });
  res.data = noDashes(res.data);
  const jsonPath = path.join(SCREENS_DIR, `x-${key}.json`);
  const mdPath = path.join(SCREENS_DIR, `x-${key}.md`);
  await writeFile(jsonPath, JSON.stringify({ screen: def.name, route: def.route, when: new Date().toISOString(), author: "director", spec: res.data }, null, 2));
  await writeFile(mdPath, screenMarkdown(def.name, res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

async function experienceDirectionText(): Promise<string> {
  try { return JSON.stringify(JSON.parse(await readFile(path.join(V3_DIR, "experience-direction.json"), "utf8")).direction); } catch { return "(no experience direction yet: run v3x-direction first)"; }
}

// ------------------------------------------------------------- review

export const V3X_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_v3_experience_review",
  schema: obj({
    verdict: { type: "string", enum: ["ready", "fix", "recompose"] },
    two_second_read: S(),
    experience: QA,
    scores: obj({ keep_scrolling: SCORE, motion_reveals_product: SCORE, more_desirable_than_production: SCORE, hierarchy_instant: SCORE, consumer_product: SCORE, business_justifies_paying: SCORE, loyalty_strengthens: SCORE, at_benchmark: SCORE, memorable_moments: SCORE, text_discipline: SCORE, material_quality: SCORE, truthfulness: SCORE, slop_risk: SCORE }),
    wow_moments_seen: L("The memorable product moments actually visible in the captures and strips, or none."),
    material_read: S("What the material actually looks like in the pixels: real, rationed and physical, or cheap glassmorphism."),
    word_count_read: S("What the visible words look like against the budget."),
    spec_drift: L(),
    spec_was_wrong: L(),
    fixes: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S(), where: S(), why: S() }) },
    keep: L(),
    remaining_risks: L(),
    why_better_than_production: S(),
  }),
};

export const V3X_VERIFY_SCHEMA: JsonSchema = {
  name: "tapmart_v3_experience_verify",
  schema: obj({
    verdict: { type: "string", enum: ["ready", "blocker"] },
    two_second_read: S(),
    experience: QA,
    confirmed: L(),
    blockers: { type: "array", items: obj({ where: S(), what: S(), why_it_blocks: S(), fix: S() }) },
    notes: L("Preferences that are NOT blockers."),
    note_for_founder: S(),
  }),
};

export type V3XReviewInput = { key: V3XKey; shots: string[]; pass: number; final?: boolean; verify?: boolean; notes?: string | null; density?: string | null };

export async function runV3XReview(i: V3XReviewInput, o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[]; markdown: string }> {
  const say = o.onProgress ?? (() => {});
  const def = V3X_SURFACES[i.key];
  const r = route(i.final || i.verify ? "screen_review_final" : "screen_review", o.effort);
  const [direction, m] = await Promise.all([experienceDirectionText(), experienceMaterial()]);
  let spec: string | null = null;
  try { spec = JSON.stringify(JSON.parse(await readFile(path.join(SCREENS_DIR, `x-${i.key}.json`), "utf8")).spec); } catch { spec = null; }
  const content: InputPart[] = [textPart([
    `Surface: ${def.name} (${def.route}), pass ${i.pass}${i.final ? ", final" : ""}${i.verify ? ", verification" : ""}.`,
    `The question it answers: ${def.question}`,
    `Images in order: ${i.shots.map((s, n) => `${n + 1}. ${path.basename(s)}`).join("; ")}.`,
    i.density ? `Measured visible words (from the browser): ${i.density}` : "",
    i.notes ? `Notes from the engineer: ${i.notes}` : "",
    "Answer with the JSON only.",
  ].filter(Boolean).join("\n"))];
  for (const s of i.shots) await pushImage(content, s, `CAPTURE ${path.basename(s)}:`);
  say(`${i.verify ? "Verify" : "Review"} ${def.name} pass ${i.pass} (${r.effort})`);
  const common = [
    "=== THE V3 EXPERIENCE DIRECTION ===", direction, "=== END ===",
    ...(spec ? ["=== YOUR SPEC FOR THIS SURFACE ===", spec, "=== END ==="] : []),
    "=== THE EXPERIENCE BRIEF (excerpt) ===", m.brief.slice(0, 5000), "=== END ===",
    `=== THE NINE EXPERIENCE QUESTIONS ===\n${EXPERIENCE_QUESTIONS.map((q, n) => `${n + 1}. ${q}`).join("\n")}\n=== END ===`,
  ];
  const instructions = i.verify
    ? [WHO, "This job is V3 EXPERIENCE FINAL VERIFICATION. The finishing edits after your last review are done; these captures and motion strips are the CURRENT state. Do not redesign and do not ask for more evidence. Decide only: is this surface READY, or is there a specific genuine blocker (a broken layout, an untruthful label, unreadable text, a state contradicting the fixture, a required element or recording missing, motion that is decoration rather than product)? Preferences and pixel datums go under notes. Name where, what, why and the smallest fix for each blocker.", NO_SLOP, "Return the JSON only.", ...common].join("\n\n")
    : [WHO, `This job is V3 EXPERIENCE REVIEW${i.final ? " (FINAL)" : ""}. Claude Code built the surface in the isolated lab and a browser captured REAL screenshots and motion strips. Judge the pixels against your direction, your spec, the founder's experience brief and the nine experience questions. Judge experience, not only polish: would someone keep scrolling, does the motion reveal the product, is it more desirable than production, is the hierarchy instant, is it a consumer product, does the Business side justify paying, does Loyalty strengthen the story, are we at the benchmark, are there three memorable product moments. Read the material in the pixels: real and rationed, or cheap glassmorphism. Read the words against the budget. Where the build drifts, give the exact change. Where your spec was wrong now that it is real, say so. 'ready' means a professional product designer would put this beside the benchmark without apology.`, NO_SLOP, "Return the JSON only.", ...common].join("\n\n");
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions, content, schema: i.verify ? V3X_VERIFY_SCHEMA : V3X_REVIEW_SCHEMA, maxOutputTokens: 30000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [], markdown: "" };
  await mkdir(REVIEWS_DIR, { recursive: true });
  res.data = noDashes(res.data);
  const base = path.join(REVIEWS_DIR, i.verify ? `x-${i.key}-final` : `x-${i.key}-pass${i.pass}`);
  const md = i.verify ? verifyMarkdown(def.name, i, res.data) : reviewMarkdown(def.name, i, res.data);
  await writeFile(`${base}.json`, JSON.stringify({ screen: def.name, pass: i.pass, final: Boolean(i.final), verification: Boolean(i.verify), shots: i.shots.map((s) => path.basename(s)), when: new Date().toISOString(), reviewer: "director", review: res.data }, null, 2));
  await writeFile(`${base}.md`, md);
  return { data: res.data, usage: [res.usage], files: [`${base}.json`, `${base}.md`], markdown: md };
}

// ------------------------------------------------------------ markdown

const str = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));
const section = (title: string, v: unknown): string[] => {
  if (v == null) return [];
  if (Array.isArray(v)) return [`## ${title}`, "", ...bullets(v), ""];
  if (typeof v === "object") return [`## ${title}`, "", ...Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => Array.isArray(x) ? [`**${k.replace(/_/g, " ")}.**`, ...bullets(x), ""] : [`**${k.replace(/_/g, " ")}.** ${str(x)}`, ""]), ""];
  return [`## ${title}`, "", str(v), ""];
};

function directionMarkdown(d: Record<string, unknown>): string {
  return [
    "# TapMart V3 experience direction", "", "Author: Astra (design director). Written from docs/design-lab-v3/EXPERIENCE_BRIEF.md and ARTEC_LIVE_STUDY.md.", "",
    ...section("Founder read", d.founder_read), ...section("Artec read", d.artec_read), ...section("Thesis", d.thesis),
    ...section("Material system", d.material_system), ...section("Two worlds", d.two_worlds),
    "## Wow moments", "", ...(d.wow_moments as Record<string, unknown>[] ?? []).flatMap((w) => [`### ${str(w.name)} (${str(w.world)}, ${str(w.surface)})`, "", ...Object.entries(w).filter(([k]) => !["name", "world", "surface"].includes(k)).map(([k, x]) => `**${k.replace(/_/g, " ")}.** ${str(x)}`), ""]),
    "## User story", "", ...(d.user_story as Record<string, unknown>[] ?? []).flatMap((a) => [`### ${str(a.act)}`, "", "Frames:", ...bullets(a.frames), "", `**Motion.** ${str(a.motion)}`, "", "Copy:", ...bullets(a.copy), "", "Media:", ...bullets(a.media), ""]),
    ...section("Business story", d.business_story), ...section("Loyalty placement", d.loyalty_placement), ...section("Settings architecture", d.settings_architecture),
    "## Surfaces", "", ...(d.surfaces as Record<string, unknown>[] ?? []).flatMap((s) => [`### ${str(s.key)}`, "", ...Object.entries(s).filter(([k]) => k !== "key").flatMap(([k, x]) => Array.isArray(x) ? [`**${k.replace(/_/g, " ")}.**`, ...bullets(x), ""] : [`**${k.replace(/_/g, " ")}.** ${str(x)}`, ""]), ""]),
    ...section("Recordings", d.recordings), ...section("Text budgets", d.text_budgets), ...section("What not to build", d.what_not_to_build), ...section("Self critique", d.self_critique),
  ].join("\n");
}

function screenMarkdown(name: string, s: Record<string, unknown>): string {
  return [`# V3 screen: ${name}`, "", "Author: Astra (design director).", "", ...Object.entries(s).flatMap(([k, v]) => section(k.replace(/_/g, " "), v))].join("\n");
}

function reviewMarkdown(name: string, i: V3XReviewInput, r: Record<string, unknown>): string {
  const sc = (r.scores ?? {}) as Record<string, unknown>;
  return [
    `# V3 experience review: ${name}, pass ${i.pass}${i.final ? " (final)" : ""}`, "", `Reviewer: Astra. Verdict: **${str(r.verdict)}**. Captures: ${i.shots.map((s) => path.basename(s)).join(", ")}.`, "",
    `**Two second read.** ${str(r.two_second_read)}`, "",
    "## The nine questions", "", ...((r.experience as Record<string, unknown>[]) ?? []).map((q) => `- ${str(q.question)} **${str(q.answer).toUpperCase()}**. ${str(q.note)}`), "",
    "## Scores", "", ...Object.entries(sc).map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${str(v)}`), "",
    ...section("Wow moments seen", r.wow_moments_seen), ...section("Material read", r.material_read), ...section("Word count read", r.word_count_read),
    ...section("Spec drift", r.spec_drift), ...section("Spec was wrong", r.spec_was_wrong),
    "## Fixes", "", ...((r.fixes as Record<string, unknown>[]) ?? []).map((f) => `- ${str(f.priority)}. **${str(f.where)}.** ${str(f.change)} Why: ${str(f.why)}`), "",
    ...section("Keep", r.keep), ...section("Remaining risks", r.remaining_risks), ...section("Why better than production", r.why_better_than_production),
  ].join("\n");
}

function verifyMarkdown(name: string, i: V3XReviewInput, r: Record<string, unknown>): string {
  const b = (r.blockers as Record<string, unknown>[]) ?? [];
  return [
    `# V3 experience final verification: ${name}`, "", `Reviewer: Astra. Verdict: **${str(r.verdict).toUpperCase()}**. Captures: ${i.shots.map((s) => path.basename(s)).join(", ")}.`, "",
    `**Two second read.** ${str(r.two_second_read)}`, "",
    "## The nine questions", "", ...((r.experience as Record<string, unknown>[]) ?? []).map((q) => `- ${str(q.question)} **${str(q.answer).toUpperCase()}**. ${str(q.note)}`), "",
    ...section("Confirmed", r.confirmed),
    "## Blockers", "", ...(b.length ? b.map((x) => `- **${str(x.where)}.** ${str(x.what)} Why it blocks: ${str(x.why_it_blocks)} Fix: ${str(x.fix)}`) : ["- None."]), "",
    ...section("Notes, not blockers", r.notes), `**For the founder.** ${str(r.note_for_founder)}`, "",
  ].join("\n");
}
