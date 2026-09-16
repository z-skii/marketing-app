import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { imagePart, loadImage, respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route, type Effort } from "./models";
import { campaignImages, slug } from "./prompts";

/**
 * The V2 Design Lab: a new TapMart visual and UX exploration in an isolated
 * environment (/design-lab-v2). Three jobs, all run by the design director:
 *
 *   directions  explore at least three substantially different V2 directions
 *               against the founder's brief and the study, choose one, and
 *               define its system (colour, type, motion, navigation, settings).
 *   screen      art direct one of the four V2 experiences in the chosen
 *               direction, including every visible string it may show.
 *   review      judge a real browser capture of the coded prototype against the
 *               system, the screen spec and the founder's quality bar.
 *
 * Everything is written to docs/design-lab-v2. Nothing here touches the
 * application, the database or production.
 */

const ROOT = process.cwd();
export const V2_DIR = path.join(ROOT, "docs", "design-lab-v2");
const SCREENS_DIR = path.join(V2_DIR, "screens");
const REVIEWS_DIR = path.join(V2_DIR, "reviews");

const S = (description?: string) => (description ? { type: "string", description } : { type: "string" });
const L = (description?: string) => ({ type: "array", items: { type: "string" }, ...(description ? { description } : {}) });
const obj = (properties: Record<string, unknown>, description?: string) => ({ type: "object", additionalProperties: false, properties, required: Object.keys(properties), ...(description ? { description } : {}) });
const SCORE = { type: "integer", minimum: 0, maximum: 10 };

// ------------------------------------------------------------ the screens

export type V2ScreenKey = "public-home" | "user-home" | "user-profile" | "business-home";

export const V2_SCREENS: Record<V2ScreenKey, { name: string; route: string; purpose: string; data: string; actions: string; truth: string }> = {
  "public-home": {
    name: "Public Homepage", route: "/design-lab-v2",
    purpose: "The front door for a signed out visitor. It must make a person keep scrolling and understand, without paragraphs, that they can earn by recreating a Reel, posting a Story or driving with an ad, and that a business can find people and cars, create campaigns, review work and get monthly content.",
    data: "Three earning modes with real media for each (a reference Reel frame and a creator filming; a finished 9:16 Story creative and a posted state; a real car and a placement); real product UI captures; the two plans (Essential, Growth) with prices from configuration; the payout minimum and fee from settings; no metrics that are not real.",
    actions: "Start earning, For businesses, Sign in, Get started, an inspect or expand on media, plan selection. Navigation: wordmark, Earn, For businesses, How it works, Pricing.",
    truth: "Subscription, campaign spending and creator earnings are three different kinds of money. No instant payout promise. No fake product states. Real captures are real; generated illustrations are labelled as such somewhere reachable, not necessarily inline.",
  },
  "user-home": {
    name: "User Home", route: "/design-lab-v2/home",
    purpose: "Answers HOW CAN I MAKE MONEY RIGHT NOW. Recreate, Story and Car are three distinct compositions, each understandable in under two seconds: media carries the context, the money is obvious, one verb, and a tap reveals the details.",
    data: "Opportunities of three kinds: Recreate (reference video or still, pay per approved version, spots, deadline, business), Story (the 9:16 creative, pay after the live hours and approval, follower minimum, business), Car (vehicle or campaign visual, pay per month, city, duration, placements). Active work with a state (applied, accepted, submitted, revision requested, approved, paid; booking, installation, proof, monthly payment for cars). Direct requests from businesses. Available balance.",
    actions: "Open an opportunity, apply or accept, view active work, accept or decline a direct request, search, notifications, messages, mode switch. Navigation: Home, Activity, Earnings, Profile.",
    truth: "Money, deadline, eligibility (follower minimum, vehicle required) and approval consequences must be visible at the point of need. Never animate money misleadingly.",
  },
  "user-profile": {
    name: "User Profile", route: "/design-lab-v2/profile",
    purpose: "Identity, not settings. The person, their reputation, their earnings, their work, Instagram and vehicle; shareable as a public profile. Everything administrative sits behind one settings action.",
    data: "Photo, name, username, city, lifetime earned, completed count, rating and review count, work and media (approved submissions, posted Stories, car placements), Instagram handle and follower count when connected, verification state, vehicle (photos; interactive 3D only when a real model exists).",
    actions: "One Settings action (Account, Instagram and Connections, Verification, Payout, Notifications, Privacy, Security, Log out), share profile, open a piece of work, open the vehicle. Navigation: Home, Activity, Earnings, Profile.",
    truth: "Never fake 3D. Never invent followers, reviews or ratings; show honest absence.",
  },
  "business-home": {
    name: "Business Home", route: "/design-lab-v2/business",
    purpose: "Answers WHO OR WHAT CAN MARKET MY BUSINESS. Exciting discovery of people and cars: work first profiles, media strips, large portraits, hover and expand, a quick request, car shelves, interactive placement, location aware. Not a CRM, a directory, a spreadsheet or classifieds.",
    data: "People (portrait, work samples, city, Instagram only when connected, verification, completed count, rating and reviews when real), cars (vehicle photos or real 3D, placements, asking price per month, city), the business's own attention items (campaign decisions, content to approve), current city.",
    actions: "Open a person, request a Story or a Reel from a person, open a car, send a car advertising offer, filter (people, cars, nearby), change location, create a campaign. Navigation: Home, Content, Create, Campaigns, Business (settings deeper).",
    truth: "Never 'Request <person name>' as a button label. Instagram appears only when connected. Follower counts are shown only when real and never as the headline of a person.",
  },
};

export const V2_SETTINGS = {
  user: ["Account", "Instagram and Connections", "Verification", "Payout", "Notifications", "Privacy", "Security", "Log out"],
  business: ["Account", "Business Details", "Connections", "Google Business", "Brand Kit", "Plan and Billing", "Team", "Notifications", "Security", "Log out"],
};

/** Real media the prototypes may use (paths under public/). Portraits, work and vehicles under design-lab are labelled fixture imagery with fictional names. */
export const V2_MEDIA: { path: string; what: string }[] = [
  { path: "/uploads/seed/tapmart-recreate.jpg", what: "Recreate: a creator filming inside a coffee shop (campaign image)" },
  { path: "/uploads/seed/tapmart-story.jpg", what: "Story: a finished 9:16 Story ad on a phone (campaign image)" },
  { path: "/uploads/seed/tapmart-car.jpg", what: "Car: a real vehicle with an advertising wrap (campaign image)" },
  { path: "/uploads/seed/demo-story.jpg", what: "A supplied 9:16 Story creative (Demo Roastery, iced latte)" },
  { path: "/uploads/seed/demo-latte.webp", what: "An approved Recreate submission still (latte)" },
  { path: "/uploads/seed/demo-bmw.webp", what: "A real photographed sedan (vehicle photo)" },
  { path: "/uploads/seed/demo-coffee-cover.webp", what: "A coffee shop interior (business cover)" },
  { path: "/marketing/filming.webp", what: "Generated illustration: two people filming in a cafe" },
  { path: "/marketing/car-context.webp", what: "Generated illustration: a car in a street context" },
  { path: "/marketing/reference.webp", what: "A reference Reel still" },
  { path: "/marketing/story-creative.webp", what: "A Story creative at 9:16" },
  { path: "/marketing/shoot-counter.webp, /marketing/shoot-pour.webp, /marketing/shoot-window.webp", what: "Delivered monthly content shoot photos (coffee)" },
  { path: "/marketing/frames/*.webp", what: "Twenty real production captures at 2x (user-home-390, earnings-390, business-home-1440, and so on)" },
  { path: "/design-lab/portrait-{maya,nora,eli,jules,imani}-01.jpg", what: "Fixture portraits of five fictional creators" },
  { path: "/design-lab/work-*.jpg", what: "Fixture work samples for those creators" },
  { path: "/design-lab/vehicle-{eli,maya,nora,theo}-01.jpg", what: "Fixture vehicle photographs" },
  { path: "/design-lab/story-loopday-01.jpg, /design-lab/reference-loopday-01.jpg, /design-lab/content-loopday-*.jpg", what: "Fixture Story creative, reference still and shoot content for a fictional cafe (Loopday)" },
  { path: "/design-lab/placement-rear-doors.svg", what: "A placement zone diagram" },
];

// --------------------------------------------------------------- schemas

const DIRECTION = obj({
  name: S("Two or three words."),
  thesis: S("The idea in one paragraph: what TapMart is, seen through this direction."),
  composition: S("How screens are composed: grid, scale, rhythm, where media sits, how the three earning types differ."),
  motion: S("The motion philosophy with concrete examples: what transforms, what is scroll linked, durations and easings."),
  navigation_feel: S("How the four user destinations and the five business destinations are presented and how it feels to move."),
  media_use: S("Photography, video, device frames, 3D, treatment and ratios."),
  identity: obj({ theme: S("light, dark, adaptive or mixed and where"), palette: { type: "array", items: obj({ name: S(), hex: S(), role: S() }) }, typography: { type: "array", items: obj({ face: S("With a free source: Google Fonts or a bundled open licence."), role: S(), why: S() }) }, logo_treatment: S(), signature: S("The one visual idea only TapMart would have.") }),
  interaction_philosophy: S("How details are revealed on demand, how a card becomes a detail, how a request is made, how approval feels."),
  public_site_idea: S("The opening line and the choreography of the first two screens of the homepage."),
  strengths: L(), weaknesses: L(), risks: L("What could turn it into slop, business software, a social network or a car app."),
  verdict: S("kept, merged (what was taken) or rejected, with the reason."),
});

export const V2_DIRECTIONS_SCHEMA: JsonSchema = {
  name: "tapmart_v2_directions",
  schema: obj({
    founder_read: S("The brief in your words: what must change, what must not, and what the quality bar is."),
    artec_lessons: L("What the benchmark teaches, as rules; note honestly that only its product model and copy were available, not its pixels."),
    heaviness_diagnosis: L("What makes the current TapMart heavy, screen by screen, beyond the study."),
    directions: { type: "array", minItems: 3, items: DIRECTION, description: "At least three substantially different directions: composition, motion, navigation feel, media use, identity and interaction philosophy all differ." },
    chosen: obj({
      name: S(), why: S("Why it beat the others against the founder's ten questions."), merged: L("Ideas taken from the others, only where they improve the result."),
      what_stays_from_frame_shift: L("Only what is excellent, with the reason."),
    }),
    system: obj({
      theme: S(),
      colors: { type: "array", items: obj({ token: S("A CSS custom property name, for example --v2-ink"), hex: S(), role: S() }) },
      typography: { type: "array", items: obj({ token: S(), face: S(), source: S("Google Fonts family name or a bundled open licence"), weights: S(), role: S() }) },
      type_scale: { type: "array", items: obj({ role: S(), phone_px: S(), desktop_px: S(), weight: S(), tracking: S(), line_height: S() }) },
      spacing: S("The scale and rules."), grid: S("Phone 390, 320, tablet 768 to 1023, desktop 1440, large 1920: what changes at each."),
      shape: S("Radius rules; what has none."), surfaces: S(), depth: S(), borders: S(),
      motion: { type: "array", items: obj({ name: S(), trigger: S(), what_moves: S(), duration_ms: S(), easing: S(), explains: S("What a person understands because it moved."), reduced_motion: S() }), description: "The motion vocabulary the four screens share." },
      iconography: S(), device_framing: S(), media_treatment: S(),
      money: S("How amounts look everywhere: size, weight, colour, what accompanies them."),
      text_policy: S("How little text: rules for labels, one line titles, when a sentence is allowed, what is only shown on demand."),
      navigation: obj({ mobile_user: S(), desktop_user: S(), mobile_business: S(), desktop_business: S(), public_site: S(), mode_switching: S() }),
      settings: obj({ user: L("The consolidated user settings rows, in order."), business: L("The consolidated business settings rows, in order."), entry: S("The single settings action: where it sits on Profile and on Business.") }),
      removed_from_visible_ui: L("What today's product shows on the surface that V2 moves to a tap, a sheet or settings."),
      point_of_need: L("Where money, deadline, eligibility, requirements, approval consequences, terms and payment state appear, per earning type."),
    }),
    self_critique: L("Your own honest answers to the founder's ten questions for the chosen direction, with what you changed when an answer was no."),
  }),
};

const REGION = obj({ region: S(), size: S("Height or size at this viewport."), content: S("Exactly what is in it: media, type roles, sizes, colours, spacing, actions."), motion: S("What moves here and how, or none."), state: S("The honest fixture state shown.") });

export const V2_SCREEN_SCHEMA: JsonSchema = {
  name: "tapmart_v2_screen",
  schema: obj({
    two_second_read: S("What a person understands in two seconds."),
    signature_moment: S("The one thing on this screen that no well designed marketplace would have."),
    phone: { type: "array", items: REGION, description: "390 wide, top to bottom." },
    small_phone: L("What changes at 320."),
    tablet: L("What changes between 768 and 1023."),
    desktop: { type: "array", items: REGION, description: "1440 wide, as its own composition." },
    large_desktop: L("What changes at 1920."),
    earning_types: L("How Recreate, Story and Car read differently on this screen, if they appear."),
    visible_copy: { type: "array", items: obj({ where: S(), text: S("The exact string, no placeholder."), why_needed: S("The decision it serves; if none, it must not be here.") }), description: "Every visible string the screen may show in its main state. The engineer may not add strings that are not here except numbers, names and dates from data." },
    on_demand: L("What appears only after a tap, hover, expand or scroll: money details, deadline, eligibility, requirements, terms, payment state, per item."),
    media: L("Every media item with ratio, size, treatment and the asset path from the available list."),
    motion: { type: "array", items: obj({ name: S(), trigger: S(), what_moves: S(), duration_ms: S(), easing: S(), explains: S(), reduced_motion: S() }) },
    removed: L("What from the current screen is gone from the surface."),
    moved_to_settings: L(),
    honest_states: L("Empty, loading, not connected, no vehicle, no work yet: how each looks."),
    accessibility: L(),
    fixture_data: L("The fictional records to render, with amounts and names; nothing that could be mistaken for a real business or person."),
    acceptance: L("What you will check in the real capture, phone and desktop."),
  }),
};

export const V2_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_v2_review",
  schema: obj({
    verdict: { type: "string", enum: ["ready", "fix", "recompose"] },
    two_second_read: S("What you understood in two seconds from the capture."),
    quality_bar: { type: "array", items: obj({ question: S(), answer: { type: "string", enum: ["yes", "no", "partly"] }, note: S() }), description: "The founder's ten questions, each answered from the pixels." },
    scores: obj({ premium: SCORE, self_explaining: SCORE, consumer_not_software: SCORE, memorable: SCORE, motion_understanding: SCORE, earning_types_distinct: SCORE, discovery_excitement: SCORE, identity_not_settings: SCORE, keeps_scrolling: SCORE, stronger_than_production: SCORE, text_discipline: SCORE, truthfulness: SCORE, slop_risk: { type: "integer", minimum: 0, maximum: 10, description: "0 is none" } }),
    spec_drift: L("Where the build departs from your spec, with the exact change."),
    spec_was_wrong: L("Where your spec was wrong now that it is real, with the better instruction."),
    fixes: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S(), where: S(), why: S() }) },
    keep: L("What must not be touched."),
    why_better_than_production: S("Against the before capture when given; plain language for the founder."),
    remaining_risks: L(),
  }),
};

// ------------------------------------------------------------- material

async function read(rel: string): Promise<string> {
  try { return await readFile(path.join(ROOT, rel), "utf8"); } catch { return `(${rel} missing)`; }
}

/** The product truth sections of the brain, without its Frame Shift visual sections. */
async function productTruth(): Promise<string> {
  const brain = await read("docs/TAPMART_PRODUCT_BRAIN.md");
  const start = brain.indexOf("## What TapMart is");
  const end = brain.indexOf("## Public website");
  return start >= 0 ? brain.slice(start, end > start ? end : undefined) : brain;
}

async function pushImage(content: InputPart[], source: string | null | undefined, caption: string, detail: "high" | "low" = "high") {
  if (!source) return;
  const img = await loadImage(source);
  if (img) content.push(textPart(caption), imagePart(img, detail));
}

const WHO = "You are TapMart's CREATIVE DIRECTOR, PRODUCT DESIGNER, UX ARCHITECT and ART DIRECTOR (Astra). Claude Code is the engineer: it builds exactly what you specify as real React and CSS in an isolated Design Lab. You design, direct, judge and approve; you never write code.";

const NO_SLOP = "Do not chase 'futuristic': no random gradients, no AI purple, no neon everywhere, no glass everywhere, no floating blobs, no meaningless 3D, no huge rounded SaaS cards, no generic bento grids, no fake analytics, no fake product states. Real media does the work; the final UI is real coded UI.";

function directionsInstructions(brief: string, study: string, truth: string, inventory: string): string {
  return [
    WHO,
    "This job is the V2 DIRECTION EXPLORATION. The founder has approved the current product (Frame Shift) and now wants a NEW visual and UX exploration because the product feels heavy: too much text, over explanation, settings scattered, Profile that reads like settings, screens that read like documentation, a public site that explains instead of shows, conservative motion, not enough personality. The brief and the study are pasted below; the current screens are attached as a functionality inventory with no visual authority (keep only what is excellent, and say what). Three campaign images are attached as the real media of the three earning types.",
    "Explore AT LEAST THREE substantially different directions. They must differ in composition, motion, navigation feel, media use, identity and interaction philosophy, not in palette alone. Critique each honestly against the founder's ten questions. Then choose the strongest, merge only what improves it, and define its system exactly: hex colours, font families with a free source, a type scale in px for phone and desktop, spacing, grid per viewport, shapes, surfaces, a motion vocabulary with durations and easings, iconography, device framing, media treatment, the money treatment, the text policy, navigation for every mode and viewport, the consolidated settings, what leaves the visible UI, and where each point of need item appears. Every value must be buildable without a follow up question.",
    "Product truth is frozen: two modes; three earning types with their states; user navigation Home, Activity, Earnings, Profile; business systems Campaigns and Monthly Content with plans Essential and Growth and campaign spending separate from the subscription; Smart Vehicle 3D only when a real model exists, otherwise real photography, never fake 3D. SHOW FIRST. ACTION SECOND. DETAILS ON DEMAND. Dramatically less visible copy, but money, deadlines, financial consequences, eligibility, requirements, approval consequences, terms and payment state appear at the point of need and the product stays truthful.",
    NO_SLOP,
    "Motion is a major design tool: shared element transitions, media expansion, cards becoming detail screens, device choreography, scroll linked transitions, horizontal storytelling, live feed motion, animated balances and state changes where honest, car interaction, image to interface transformations, approval transitions. Never animate money misleadingly; never slow basic navigation.",
    "Fonts must be loadable through next/font/google or bundled under an open licence; name them exactly. Return the JSON only.",
    "=== THE BRIEF ===", brief, "=== END ===",
    "=== THE STUDY (Artec, current TapMart with measured text density, backend, heaviness) ===", study, "=== END ===",
    "=== PRODUCT TRUTH ===", truth, "=== END ===",
    "=== FUNCTIONAL INVENTORY ===", inventory, "=== END ===",
  ].join("\n\n");
}

export type V2Options = { effort?: Effort; dryRun?: boolean; resume?: boolean; onProgress?: (m: string) => void };

export async function runV2Directions(o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const r = route("ui_system", o.effort);
  const [brief, study, truth, inventory] = await Promise.all([read("docs/design-lab-v2/BRIEF.md"), read("docs/design-lab-v2/STUDY.md"), productTruth(), read("docs/reboot/TAPMART_FUNCTIONAL_INVENTORY.md")]);
  const content: InputPart[] = [textPart("Study the brief, the study, the product truth and the inventory until you understand the product completely. Then explore the directions, choose one and define its system. Images follow: four current production screens (functionality inventory only) and the three campaign images (real media).")];
  const before = path.join(V2_DIR, "before");
  await pushImage(content, path.join(before, "user-home-m.png"), "CURRENT User Home, phone (no visual authority):", "low");
  await pushImage(content, path.join(before, "user-profile-m.png"), "CURRENT User Profile, phone (no visual authority):", "low");
  await pushImage(content, path.join(before, "business-home-d.png"), "CURRENT Business Home, desktop (no visual authority):", "low");
  await pushImage(content, path.join(before, "public-home-d.png"), "CURRENT Public Homepage, desktop first screen (no visual authority):", "low");
  for (const c of await campaignImages()) content.push(textPart(c.label), imagePart(c.image, "low"));
  const pendingPath = path.join(V2_DIR, ".pending-directions.json");
  let resumeId: string | null = null;
  if (o.resume) { try { resumeId = JSON.parse(await readFile(pendingPath, "utf8")).id ?? null; } catch { resumeId = null; } }
  if (resumeId) say(`Directions: re-attaching to response ${resumeId}`);
  else say(`Directions with the design director (${r.effort})`);
  await mkdir(V2_DIR, { recursive: true });
  const res = await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: directionsInstructions(brief, study, truth, inventory), content, schema: V2_DIRECTIONS_SCHEMA,
    maxOutputTokens: 60000, maxWaitMs: 60 * 60_000, dryRun: o.dryRun, resumeId,
    onSubmitted: (id) => { void writeFile(pendingPath, JSON.stringify({ id, when: new Date().toISOString() })); },
    onProgress: o.onProgress,
  });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  const jsonPath = path.join(V2_DIR, "directions.json");
  const mdPath = path.join(V2_DIR, "DIRECTIONS.md");
  await writeFile(jsonPath, JSON.stringify({ when: new Date().toISOString(), author: "director", directions: res.data }, null, 2));
  await writeFile(mdPath, directionsMarkdown(res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- screen

async function chosenSystemText(): Promise<{ chosen: string; system: string; direction: string }> {
  const d = JSON.parse(await readFile(path.join(V2_DIR, "directions.json"), "utf8")).directions as Record<string, unknown>;
  const chosen = d.chosen as { name: string };
  const dir = (d.directions as { name: string }[]).find((x) => x.name === chosen.name) ?? null;
  return { chosen: JSON.stringify(chosen), system: JSON.stringify(d.system), direction: JSON.stringify(dir) };
}

function screenInstructions(brief: string, truth: string, sys: { chosen: string; system: string; direction: string }): string {
  return [
    WHO,
    "This job is V2 SCREEN ART DIRECTION. You chose the V2 direction and defined its system (pasted below). Now art direct ONE screen in that direction for the engineer, region by region, for phone (390), small phone (320), tablet, desktop (1440) and large desktop (1920). Desktop is its own composition, never a stretched phone. The current production screen is attached as a functionality inventory only.",
    "SHOW FIRST. ACTION SECOND. DETAILS ON DEMAND. List EVERY visible string the screen may show in its main state with the decision it serves; the engineer may not add others. Say exactly what is on demand and how it is revealed. Media carries context; money is obvious; one verb per object. Motion must explain something and must never slow navigation or mislead about money. Reduced motion is specified for each motion.",
    "Product truth is frozen and the fixture data must be clearly fictional (no real business or person). Never fake 3D. Never 'Request <person name>'. Instagram only when connected. Follower counts never as the headline of a person. Honest empty states.",
    NO_SLOP,
    "Use only media from the available list, or say precisely what new fixture media the image model should render (subject, ratio, treatment). Return the JSON only.",
    "=== THE BRIEF (excerpt) ===", brief, "=== END ===",
    "=== PRODUCT TRUTH ===", truth, "=== END ===",
    "=== CHOSEN DIRECTION ===", sys.chosen, sys.direction, "=== END ===",
    "=== THE V2 SYSTEM ===", sys.system, "=== END ===",
    "=== AVAILABLE MEDIA ===", V2_MEDIA.map((m) => `${m.path}: ${m.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
}

export async function runV2Screen(key: V2ScreenKey, o: V2Options & { phone?: string | null; desktop?: string | null; notes?: string | null } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const def = V2_SCREENS[key];
  const r = route("screen_design", o.effort);
  const [brief, truth, sys] = await Promise.all([read("docs/design-lab-v2/BRIEF.md"), productTruth(), chosenSystemText()]);
  const density = await read("docs/design-lab-v2/before/density.json");
  const content: InputPart[] = [textPart([
    `Art direct the "${def.name}" (${def.route}) in the chosen V2 direction.`,
    `PURPOSE: ${def.purpose}`, `DATA: ${def.data}`, `ACTIONS: ${def.actions}`, `TRUTH: ${def.truth}`,
    key === "user-profile" || key === "user-home" ? `CONSOLIDATED USER SETTINGS (behind one action): ${V2_SETTINGS.user.join(", ")}.` : "",
    key === "business-home" ? `CONSOLIDATED BUSINESS SETTINGS (behind one action): ${V2_SETTINGS.business.join(", ")}.` : "",
    `MEASURED TEXT DENSITY OF THE CURRENT SCREEN (before): ${density}`,
    o.notes ? `NOTES FROM THE ENGINEER: ${o.notes}` : "",
    "Target: at most a third of the current visible words, no block of eighteen words or more on a logged in screen, first screen under 40 words on phone.",
  ].filter(Boolean).join("\n\n"))];
  await pushImage(content, o.phone ?? path.join(V2_DIR, "before", `${key}-m.png`), "CURRENT PHONE (functionality inventory only):", "low");
  await pushImage(content, o.desktop ?? path.join(V2_DIR, "before", `${key}-d.png`), "CURRENT DESKTOP (functionality inventory only):", "low");
  say(`Art direction for ${def.name} (${r.effort})`);
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions: screenInstructions(brief, truth, sys), content, schema: V2_SCREEN_SCHEMA, maxOutputTokens: 40000, maxWaitMs: 40 * 60_000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  await mkdir(SCREENS_DIR, { recursive: true });
  const jsonPath = path.join(SCREENS_DIR, `${key}.json`);
  const mdPath = path.join(SCREENS_DIR, `${key}.md`);
  await writeFile(jsonPath, JSON.stringify({ screen: def.name, route: def.route, when: new Date().toISOString(), author: "director", spec: res.data }, null, 2));
  await writeFile(mdPath, screenMarkdown(def.name, res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- review

const QUALITY_QUESTIONS = [
  "Does this feel like a premium modern product?", "Does it explain itself without paragraphs?", "Does it feel like a consumer platform, not business software?", "Is it memorable?",
  "Does motion improve understanding?", "Does each earning type feel different?", "Is business discovery exciting?", "Is Profile identity, not settings?",
  "Does the website make someone keep scrolling?", "Is it significantly stronger than current production?",
];

function reviewInstructions(sys: { chosen: string; system: string; direction: string }, spec: string | null, final: boolean): string {
  return [
    WHO,
    `This job is V2 SCREEN REVIEW${final ? " (FINAL)" : ""}. Claude Code built a real coded prototype of a screen you art directed, in the isolated V2 Design Lab with fixture data, and a browser captured REAL screenshots (phone and desktop, sometimes a motion strip). Judge the pixels against your system, your spec and the founder's ten questions. Compare values: colours, faces, sizes, spacing, shapes, surfaces, media ratios, money treatment, text discipline, navigation presentation, evidence of motion in a still or strip.`,
    "Answer the ten questions from the pixels, not from the spec. Where the build drifts from your spec, give the exact change. Where your spec was wrong now that it is real, say so and give the better instruction; you have authority over the design. Never suggest fake data, placeholder media or invented numbers. Ten strong fixes beat thirty weak ones. A full page phone capture can show a fixed bottom bar painted mid page; that is a capture artifact.",
    final ? "This is the final pass: also write, for the founder, why this screen is better than current production (the before capture is attached) in plain language, and the remaining risks. 'ready' means a professional product designer would believe this is a finished, distinctive TapMart screen a normal person understands in two seconds." : "",
    NO_SLOP,
    "Return the JSON only.",
    "=== CHOSEN DIRECTION ===", sys.chosen, "=== END ===",
    "=== THE V2 SYSTEM ===", sys.system, "=== END ===",
    ...(spec ? ["=== YOUR SPEC FOR THIS SCREEN ===", spec, "=== END ==="] : []),
    `=== THE TEN QUESTIONS ===\n${QUALITY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n=== END ===`,
  ].filter(Boolean).join("\n\n");
}

export type V2ReviewInput = { key: V2ScreenKey; shots: string[]; pass: number; final?: boolean; before?: string[]; notes?: string | null; density?: string | null };

export async function runV2Review(i: V2ReviewInput, o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[]; markdown: string }> {
  const say = o.onProgress ?? (() => {});
  const def = V2_SCREENS[i.key];
  const r = route(i.final ? "screen_review_final" : "screen_review", o.effort);
  const sys = await chosenSystemText();
  let spec: string | null = null;
  try { spec = JSON.stringify(JSON.parse(await readFile(path.join(SCREENS_DIR, `${i.key}.json`), "utf8")).spec); } catch { spec = null; }
  const content: InputPart[] = [textPart([
    `Screen: ${def.name} (${def.route}), pass ${i.pass}${i.final ? ", final" : ""}.`,
    `Images in order: ${i.shots.map((s, n) => `${n + 1}. ${path.basename(s)}`).join("; ")}${i.before?.length ? `; then BEFORE (current production): ${i.before.map((s) => path.basename(s)).join(", ")}` : ""}.`,
    i.density ? `MEASURED TEXT DENSITY (before and after): ${i.density}` : "",
    i.notes ? `Notes from the engineer: ${i.notes}` : "",
    "Answer with the JSON only.",
  ].filter(Boolean).join("\n"))];
  for (const s of i.shots) await pushImage(content, s, `CAPTURE ${path.basename(s)}:`);
  for (const s of i.before ?? []) await pushImage(content, s, `BEFORE (current production) ${path.basename(s)}:`, "low");
  say(`Review ${def.name} pass ${i.pass} (${r.effort})`);
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions: reviewInstructions(sys, spec, Boolean(i.final)), content, schema: V2_REVIEW_SCHEMA, maxOutputTokens: 30000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [], markdown: "" };
  await mkdir(REVIEWS_DIR, { recursive: true });
  const base = path.join(REVIEWS_DIR, `${i.key}-pass${i.pass}`);
  const md = reviewMarkdown(def.name, i, res.data);
  await writeFile(`${base}.json`, JSON.stringify({ screen: def.name, pass: i.pass, final: Boolean(i.final), shots: i.shots.map((s) => path.basename(s)), when: new Date().toISOString(), reviewer: "director", review: res.data }, null, 2));
  await writeFile(`${base}.md`, md);
  return { data: res.data, usage: [res.usage], files: [`${base}.json`, `${base}.md`], markdown: md };
}

// ------------------------------------------------------------ markdown

const bullets = (arr: unknown): string[] => Array.isArray(arr) ? arr.map((x) => `- ${typeof x === "string" ? x : JSON.stringify(x)}`) : [];

function directionsMarkdown(d: Record<string, unknown>): string {
  const lines = ["# TapMart V2: the directions", "", "Explored and chosen by Astra, TapMart's design director. Source: directions.json.", "", "## Founder read", "", String(d.founder_read), "", "## Artec lessons", "", ...bullets(d.artec_lessons), "", "## Heaviness diagnosis", "", ...bullets(d.heaviness_diagnosis), ""];
  for (const dir of (d.directions as Record<string, unknown>[]) ?? []) {
    const id = dir.identity as Record<string, unknown>;
    lines.push(`## Direction: ${dir.name}`, "", `**Thesis.** ${dir.thesis}`, "", `**Composition.** ${dir.composition}`, "", `**Motion.** ${dir.motion}`, "", `**Navigation feel.** ${dir.navigation_feel}`, "", `**Media.** ${dir.media_use}`, "", `**Identity.** Theme: ${id.theme}. Signature: ${id.signature}. Logo: ${id.logo_treatment}.`, "");
    lines.push("Palette:", "", ...bullets(((id.palette as { name: string; hex: string; role: string }[]) ?? []).map((c) => `${c.name} ${c.hex}: ${c.role}`)), "", "Typography:", "", ...bullets(((id.typography as { face: string; role: string; why: string }[]) ?? []).map((t) => `${t.face} (${t.role}): ${t.why}`)), "");
    lines.push(`**Interaction.** ${dir.interaction_philosophy}`, "", `**Public site.** ${dir.public_site_idea}`, "", "Strengths:", "", ...bullets(dir.strengths), "", "Weaknesses:", "", ...bullets(dir.weaknesses), "", "Risks:", "", ...bullets(dir.risks), "", `**Verdict.** ${dir.verdict}`, "");
  }
  const c = d.chosen as Record<string, unknown>;
  lines.push("## Chosen", "", `**${c.name}.** ${c.why}`, "", "Merged:", "", ...bullets(c.merged), "", "Stays from Frame Shift:", "", ...bullets(c.what_stays_from_frame_shift), "");
  const s = d.system as Record<string, unknown>;
  lines.push("## The V2 system", "", `Theme: ${s.theme}`, "", "Colours:", "", ...bullets(((s.colors as { token: string; hex: string; role: string }[]) ?? []).map((x) => `${x.token} ${x.hex}: ${x.role}`)), "", "Typography:", "", ...bullets(((s.typography as { token: string; face: string; source: string; weights: string; role: string }[]) ?? []).map((x) => `${x.token} ${x.face} (${x.source}, ${x.weights}): ${x.role}`)), "", "Type scale:", "", ...bullets(((s.type_scale as { role: string; phone_px: string; desktop_px: string; weight: string; tracking: string; line_height: string }[]) ?? []).map((x) => `${x.role}: ${x.phone_px} / ${x.desktop_px}, ${x.weight}, tracking ${x.tracking}, line height ${x.line_height}`)), "");
  for (const k of ["spacing", "grid", "shape", "surfaces", "depth", "borders", "iconography", "device_framing", "media_treatment", "money", "text_policy"]) lines.push(`**${k.replace(/_/g, " ")}.** ${s[k]}`, "");
  lines.push("Motion vocabulary:", "", ...bullets(((s.motion as Record<string, string>[]) ?? []).map((m) => `${m.name}: ${m.trigger}; ${m.what_moves}; ${m.duration_ms}ms ${m.easing}; explains ${m.explains}; reduced motion: ${m.reduced_motion}`)), "");
  const nav = s.navigation as Record<string, string>;
  lines.push("Navigation:", "", ...bullets(Object.entries(nav ?? {}).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)), "");
  const set = s.settings as Record<string, unknown>;
  lines.push("Settings:", "", `Entry: ${set?.entry}`, "", `User: ${(set?.user as string[])?.join(", ")}`, "", `Business: ${(set?.business as string[])?.join(", ")}`, "", "Removed from the visible UI:", "", ...bullets(s.removed_from_visible_ui), "", "Point of need:", "", ...bullets(s.point_of_need), "", "## Self critique", "", ...bullets(d.self_critique), "");
  return lines.join("\n");
}

function screenMarkdown(name: string, s: Record<string, unknown>): string {
  const regions = (arr: unknown) => bullets(((arr as Record<string, string>[]) ?? []).map((r) => `**${r.region}** (${r.size}): ${r.content} Motion: ${r.motion}. State: ${r.state}`));
  const lines = [`# V2 art direction: ${name}`, "", "By Astra, TapMart's design director.", "", `**Two seconds.** ${s.two_second_read}`, "", `**Signature.** ${s.signature_moment}`, "", "## Phone (390)", "", ...regions(s.phone), "", "## Small phone (320)", "", ...bullets(s.small_phone), "", "## Tablet", "", ...bullets(s.tablet), "", "## Desktop (1440)", "", ...regions(s.desktop), "", "## Large desktop", "", ...bullets(s.large_desktop), "", "## Earning types", "", ...bullets(s.earning_types), "", "## Visible copy", "", ...bullets(((s.visible_copy as { where: string; text: string; why_needed: string }[]) ?? []).map((c) => `${c.where}: "${c.text}" (${c.why_needed})`)), "", "## On demand", "", ...bullets(s.on_demand), "", "## Media", "", ...bullets(s.media), "", "## Motion", "", ...bullets(((s.motion as Record<string, string>[]) ?? []).map((m) => `${m.name}: ${m.trigger}; ${m.what_moves}; ${m.duration_ms}ms ${m.easing}; explains ${m.explains}; reduced motion: ${m.reduced_motion}`)), "", "## Removed", "", ...bullets(s.removed), "", "## Moved to settings", "", ...bullets(s.moved_to_settings), "", "## Honest states", "", ...bullets(s.honest_states), "", "## Accessibility", "", ...bullets(s.accessibility), "", "## Fixture data", "", ...bullets(s.fixture_data), "", "## Acceptance", "", ...bullets(s.acceptance), ""];
  return lines.join("\n");
}

function reviewMarkdown(name: string, i: V2ReviewInput, r: Record<string, unknown>): string {
  const scores = r.scores as Record<string, number>;
  const lines = [`# V2 review: ${name}, pass ${i.pass}${i.final ? " (final)" : ""}`, "", "Reviewer: Astra, TapMart's design director.", "", `Captures: ${i.shots.map((s) => path.basename(s)).join(", ")}`, "", `**Verdict: ${r.verdict}.** ${r.two_second_read}`, "", "## The ten questions", "", ...bullets(((r.quality_bar as { question: string; answer: string; note: string }[]) ?? []).map((q) => `${q.question} **${q.answer}**. ${q.note}`)), "", "## Scores", "", ...bullets(Object.entries(scores ?? {}).map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)), "", "## Spec drift", "", ...bullets(r.spec_drift), "", "## Spec was wrong", "", ...bullets(r.spec_was_wrong), "", "## Fixes", "", ...bullets(([...((r.fixes as { priority: number; change: string; where: string; why: string }[]) ?? [])].sort((a, b) => a.priority - b.priority)).map((f) => `${f.priority}. ${f.change} (${f.where}): ${f.why}`)), "", "## Keep", "", ...bullets(r.keep), "", `## Why better than production`, "", String(r.why_better_than_production), "", "## Remaining risks", "", ...bullets(r.remaining_risks), ""];
  return lines.join("\n");
}

export const v2Slug = slug;
