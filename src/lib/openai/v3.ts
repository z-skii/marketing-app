import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route } from "./models";
import { L, NO_SLOP, QUALITY_QUESTIONS, REGION, S, SCORE, V2_MEDIA, V2_SETTINGS, WHO, bullets, chosenSystemText, obj, productTruth, pushImage, read, reviewMarkdown, screenMarkdown, type V2Options } from "./v2";

/**
 * The V3 Design Lab: the V2 "Open Cut" exploration carried forward with
 * Loyalty designed in from the beginning (docs/design-lab-v3/BRIEF.md).
 * Three director jobs, mirroring V2:
 *
 *   direction  decide where Loyalty lives, its vocabulary, the hierarchy of
 *              every Loyalty surface, the card designer rules, the public
 *              site sequence and the fixture story, in the V2 system.
 *   screen     art direct one V3 surface region by region.
 *   review     judge real captures of the coded concept against the system,
 *              the spec, the founder's ten questions and the five Loyalty
 *              questions.
 *
 * Everything is written to docs/design-lab-v3. Nothing here touches the
 * application, the database, Wallet platforms or production.
 */

const ROOT = process.cwd();
export const V3_DIR = path.join(ROOT, "docs", "design-lab-v3");
const SCREENS_DIR = path.join(V3_DIR, "screens");
const REVIEWS_DIR = path.join(V3_DIR, "reviews");

export type V3ScreenKey = "business-home" | "loyalty-home" | "loyalty-create" | "loyalty-signup" | "loyalty-members" | "loyalty-attribution" | "site-loyalty";

export const V3_SCREENS: Record<V3ScreenKey, { name: string; route: string; purpose: string; data: string; actions: string; truth: string }> = {
  "business-home": {
    name: "Business Home with Loyalty", route: "/design-lab-v3/business",
    purpose: "The V2 Business Home (WHO OR WHAT CAN MARKET MY BUSINESS) with Loyalty present naturally, exactly where the direction placed it, without a new primary navigation item unless the direction decided otherwise. A business finds Loyalty in one glance and the discovery marketplace stays the hero.",
    data: "Everything the V2 Business Home shows, plus the Loyalty entry: program state (no program, draft, live), the counts a business trusts (members, came back, rewards ready, redeemed) when live, and the honest empty state when there is no program.",
    actions: "All V2 Business Home actions; open Loyalty; start a program when none exists. Navigation: Home, Content, Create, Campaigns, Business.",
    truth: "Counts only, never revenue. The entry must not read as an analytics widget.",
  },
  "loyalty-home": {
    name: "Loyalty Home", route: "/design-lab-v3/business/loyalty",
    purpose: "The business's Loyalty overview: visual and simple, not an analytics SaaS dashboard. In two seconds: how many members, how many came back, how many rewards are ready, how many were redeemed; then recent customers, the program and its card, campaign attribution and the quick actions (View QR, Add visit, Send update, Edit reward, Members) in the hierarchy the direction chose.",
    data: "The live program (visits or points, reward, card design), the four counts, recent members with progress and source, the attribution funnel per creator or campaign (joined, came back, redeemed), the last Wallet update sent, the QR and signup link.",
    actions: "View QR, Add visit (scan or search), Send update (a Wallet update, once a day), Edit reward, Members, open attribution, open a member, back to Business Home.",
    truth: "Counts only. Every message is labelled a Wallet update; nothing implies SMS, email or app push. Reward edits create a new version; history is kept.",
  },
  "loyalty-create": {
    name: "Create program", route: "/design-lab-v3/business/loyalty/create",
    purpose: "A premium five step creation experience: 1 Program (visits or stamps, or points), 2 Reward (name, requirement, optional terms), 3 Card design (a realistic Wallet card preview the business controls: logo, business name, brand colours, background or artwork, reward title; Apple Wallet and Google Wallet concepts, Design Lab representations only), 4 Signup (what the customer will see: QR, the short signup, Add to Apple Wallet and Add to Google Wallet as simulated actions), 5 Launch (QR, shareable signup link, print or download QR concept, program status).",
    data: "Program kind and rule, reward, card fields, generated QR and link, program status. Fixture defaults from the business's brand (Loopday Coffee).",
    actions: "Choose kind, set the rule, name the reward, set terms, design the card (colour, logo, artwork, title), preview Apple and Google, preview the signup, launch, download QR concept, copy link, go back a step, exit.",
    truth: "The card previews are labelled as Design Lab representations. Launch never claims a pass was issued. Only the two program kinds exist.",
  },
  "loyalty-signup": {
    name: "Customer signup and Wallet card", route: "/design-lab-v3/join/loopday",
    purpose: "The customer side: a person scans the business QR or taps a creator's TapMart link and joins in seconds. First name and phone or email, consent, then Add to Apple Wallet and Add to Google Wallet as simulated actions. Then the simulated Wallet card in its states: 3 of 5 visits (or 82 of 100 points), Reward ready, Reward redeemed, Updated offer, as an Apple Wallet concept and a Google Wallet concept, aligned with what each platform can show.",
    data: "The program's card design, the source the signup arrived from (a creator's Story link, the counter QR, or nothing), the member's first name, progress, the reward, the last Wallet update.",
    actions: "Join, Add to Apple Wallet (simulated), Add to Google Wallet (simulated), open the card back or details, switch the demonstrated state, return to the business preview.",
    truth: "Nothing is issued or sent; the page says so once, quietly. Only first name and one contact are collected. No marketing consent is pre-checked. Apple change messages only for reward ready and redeemed; Google updates limited to three notifications per day.",
  },
  "loyalty-members": {
    name: "Members, member detail and recording", route: "/design-lab-v3/business/loyalty/members",
    purpose: "The member list and member detail with reward progress and source (Sara, 4 of 5 visits, joined from Maya's Story campaign; or 82 of 100 points), and the counter interaction: scan a member QR or search, the customer appears, +1 visit (or add points), progress updates in place; when the requirement is reached the reward becomes ready and Redeem completes the cycle. Extremely fast.",
    data: "Members with first name, masked contact, progress, joined date, source, Wallet state, last visit; the scanner or search state; the reward.",
    actions: "Search, scan (simulated camera), open a member, Add visit or Add points, Redeem, Send update to one member (Wallet update), block, back.",
    truth: "Measurable facts only. One visit per day advances progress; a second same-day scan is recorded but says it did not count. Creators never appear with member identities anywhere else.",
  },
  "loyalty-attribution": {
    name: "Attribution", route: "/design-lab-v3/business/loyalty/attribution",
    purpose: "One beautiful attribution experience: which campaign or creator creates repeat customers. Per creator or campaign: joined, came back, redeemed, as a visual descent, never a spreadsheet. The business understands it immediately.",
    data: "Sources: creators with their campaigns (Maya, Story; Nora, Recreate; Eli, Car), the counter QR, direct links, organic; per source the three counts; the funnel across the whole program; the period.",
    actions: "Switch between creators and campaigns, open a source, change the period, back. No export in the MVP.",
    truth: "Counts only, never revenue or value. First known source only; a later touch is shown as 'also reached through' if at all. Creators see the same counts for their own links in their own product, never names.",
  },
  "site-loyalty": {
    name: "Public site: the business story with Loyalty", route: "/design-lab-v3",
    purpose: "The public homepage's business chapter now tells three acts with almost no copy: GET ATTENTION (Recreate, Story, Car), TURN THEM INTO CUSTOMERS (Wallet loyalty signup), BRING THEM BACK (visits, rewards, Wallet updates). One of the strongest visual sequences on the site, carried by motion: a Story campaign, a customer taps, QR or signup, the Wallet card appears, progress changes, the reward unlocks. Stronger if you can.",
    data: "The V2 public homepage as built, the three campaign media, the coded Wallet card, the signup, real progress states.",
    actions: "Play or scrub the sequence (scroll linked on desktop, tap through on phone), open the business preview, Get started. Reduced motion shows the frames as stills.",
    truth: "Labelled as a fictional product preview like the rest of the site; no numbers that are not fixture counts; no promise of SMS or push.",
  },
};

// --------------------------------------------------------------- schemas

const SURFACE = obj({ surface: S("One of the seven V3 surfaces by name."), two_second_read: S(), hierarchy: L("Top to bottom on phone: what, in what order, and why."), primary_action: S(), on_demand: L("What is revealed only after a tap."), visible_copy: L("Every visible string in the main state, exact."), truth_labels: L("Where and how simulation, Wallet update and Design Lab labels appear.") });

export const V3_DIRECTION_SCHEMA: JsonSchema = {
  name: "tapmart_v3_loyalty_direction",
  schema: obj({
    founder_read: S("What the founder is asking for, in your words, including what Loyalty must never become."),
    what_loyalty_is: S("Loyalty in one paragraph, inside TapMart's three acts: get attention, turn them into customers, bring them back."),
    placement: obj({
      decision: S("Where Loyalty lives in Business navigation and on Business Home, and why. No new primary tab unless you argue it is necessary."),
      business_home_entry: S("Exactly what the Loyalty presence on Business Home looks like: position, size, media, the counts, the empty state, the action."),
      navigation_changes: L("Any change to the five business destinations, the rail and the tab bar; say 'none' if none."),
      route_map: L("Every V3 route and what it is."),
    }),
    vocabulary: L("The words the product uses and the words it avoids: Members, Visits or Stamps, Points, Reward ready, Redeemed, Wallet update, Joined from, Came back."),
    surfaces: { type: "array", items: SURFACE, description: "All seven surfaces: Business Home with Loyalty, Loyalty Home, Create program, Customer signup and Wallet card, Members and recording, Attribution, Public site sequence." },
    loyalty_home_hierarchy: L("The final order of the Loyalty Home: counts, recent customers, program, attribution, actions; which of View QR, Add visit, Send update, Edit reward, Members are primary, secondary, or on demand."),
    card_designer: obj({
      controls: L("The controls the business gets, in order, with defaults from its brand."),
      apple_concept: S("How the Apple Wallet store card concept is drawn: proportions, logo and logo text, strip artwork, primary and secondary fields, the QR, the back; what is labelled."),
      google_concept: S("How the Google Wallet loyalty card concept is drawn: logo, program name, hero image, points and rewards row, member name and id, the QR, details; what is labelled."),
      progress_display: S("How visits or points progress is shown on each card: field labels and values, for both program kinds."),
      states: L("The card in each state: 3 of 5 visits or 82 of 100 points, Reward ready, Reward redeemed, Updated offer; what changes visually and what the platform would notify."),
      truth: S("The exact Design Lab label and where it sits."),
    }),
    signup: obj({ fields: L(), flow: L("Screen by screen, from scan to card added."), source_awareness: S("How the page acknowledges a creator's link versus the counter QR, if at all."), copy: L("Every string.") }),
    recording: obj({ flow: L("Scan or search to progress update, step by step, with timings."), reward_moment: S("What happens the instant a reward becomes ready, and at Redeem."), same_day: S("What the scanner says when a second visit on the same day does not count.") }),
    attribution_view: obj({ form: S("The visual form of joined, came back, redeemed; how sources compare; what is never shown."), per_source: S("What one source row or object contains."), empty: S("The honest empty state before any campaign has produced a member.") }),
    updates: obj({ kinds: L("Reward ready, Special offer, New promotion, Milestone: which are automatic, which the business sends, how each is labelled."), composer: S("The Send update experience: fields, the platform note, the once a day rule."), never: L("What the interface never implies.") }),
    public_sequence: obj({
      where: S("Where on the public homepage the sequence sits and what it replaces or extends."),
      storyboard: { type: "array", items: obj({ frame: S(), duration_ms: S(), shows: S("Exactly what is on screen."), moves: S("What moves and how."), copy: S("The one line, or none.") }) },
      desktop: S("Scroll linked behaviour at 1440 and 1920."), phone: S("The phone version."), reduced_motion: S(),
    }),
    motion: { type: "array", items: obj({ name: S(), trigger: S(), what_moves: S(), duration_ms: S(), easing: S(), explains: S(), reduced_motion: S() }), description: "Additions to the V2 motion vocabulary for Loyalty: progress change, reward unlock, redeem, card appear, scanner." },
    fixture_story: obj({ business: S("The fictional business and its brand values (name, colours, logo idea, artwork)."), program: S("The program, rule and reward."), members: L("Eight to twelve fictional members with first name, progress, joined date, source and Wallet state; one at reward ready, one redeemed, one same day."), sources: L("Creators and campaigns with joined, came back, redeemed counts that add up."), counts: S("The four Loyalty Home counts, consistent with the members and sources.") }),
    honest_states: L("No program yet, draft, live with no members, member with no visits, Wallet not added."),
    what_not_to_build: L("What the concept leaves out on purpose in the MVP."),
    self_critique: L("Your honest answers to the five Loyalty questions for this direction and what you changed."),
  }),
};

export const V3_SCREEN_SCHEMA: JsonSchema = {
  name: "tapmart_v3_screen",
  schema: obj({
    two_second_read: S("What a person understands in two seconds."),
    signature_moment: S("The one thing on this surface that no well designed loyalty product would have."),
    phone: { type: "array", items: REGION, description: "390 wide, top to bottom, including each step or state when the surface has several." },
    small_phone: L("What changes at 320."),
    tablet: L("What changes between 768 and 1023."),
    desktop: { type: "array", items: REGION, description: "1440 wide, as its own composition." },
    large_desktop: L("What changes at 1920."),
    states: L("Every state or step this surface has, in order, and what differs in each."),
    visible_copy: { type: "array", items: obj({ where: S(), text: S("The exact string, no placeholder."), why_needed: S("The decision it serves; if none, it must not be here.") }), description: "Every visible string the surface may show, per state. The engineer may not add strings that are not here except numbers, names and dates from data." },
    on_demand: L("What appears only after a tap, hover, expand or scroll."),
    truth_labels: L("Where and how the Design Lab, simulated action and Wallet update labels appear on this surface."),
    media: L("Every media item with ratio, size, treatment and the asset path from the available list, or the coded object (card, QR) it is."),
    motion: { type: "array", items: obj({ name: S(), trigger: S(), what_moves: S(), duration_ms: S(), easing: S(), explains: S(), reduced_motion: S() }) },
    honest_states: L(),
    accessibility: L(),
    fixture_data: L("The fictional records to render, consistent with the direction's fixture story."),
    acceptance: L("What you will check in the real capture, phone and desktop."),
  }),
};

export const LOYALTY_QUESTIONS = [
  "Does this feel like a natural part of TapMart?",
  "Does it strengthen the business value proposition?",
  "Can a business understand it quickly?",
  "Does it feel consumer quality rather than SaaS admin?",
  "Does attribution feel powerful without becoming fake analytics?",
];

export const V3_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_v3_review",
  schema: obj({
    verdict: { type: "string", enum: ["ready", "fix", "recompose"] },
    two_second_read: S("What you understood in two seconds from the capture."),
    quality_bar: { type: "array", items: obj({ question: S(), answer: { type: "string", enum: ["yes", "no", "partly"] }, note: S() }), description: "The founder's ten questions, each answered from the pixels." },
    loyalty_bar: { type: "array", items: obj({ question: S(), answer: { type: "string", enum: ["yes", "no", "partly"] }, note: S() }), description: "The five Loyalty questions, each answered from the pixels." },
    scores: obj({ premium: SCORE, self_explaining: SCORE, consumer_not_software: SCORE, memorable: SCORE, motion_understanding: SCORE, natural_part_of_tapmart: SCORE, business_value: SCORE, quick_to_understand: SCORE, attribution_honest_power: SCORE, wallet_realism: SCORE, text_discipline: SCORE, truthfulness: SCORE, slop_risk: { type: "integer", minimum: 0, maximum: 10, description: "0 is none" } }),
    spec_drift: L("Where the build departs from your spec, with the exact change."),
    spec_was_wrong: L("Where your spec was wrong now that it is real, with the better instruction."),
    fixes: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S(), where: S(), why: S() }) },
    keep: L("What must not be touched."),
    why_better_than_production: S("For the founder, in plain language: what this gives a business that TapMart does not have today."),
    remaining_risks: L(),
  }),
};

// ------------------------------------------------------------- material

async function loyaltyMaterial(): Promise<{ brief: string; research: string; architecture: string; truth: string }> {
  const [brief, research, architecture, truth] = await Promise.all([read("docs/design-lab-v3/BRIEF.md"), read("docs/design-lab-v3/WALLET_RESEARCH.md"), read("docs/design-lab-v3/LOYALTY_ARCHITECTURE.md"), productTruth()]);
  return { brief, research, architecture, truth };
}

async function v2SpecText(key: "business-home" | "public-home"): Promise<string> {
  try { return JSON.stringify(JSON.parse(await read(`docs/design-lab-v2/screens/${key}.json`)).spec); } catch { return "(missing)"; }
}

async function directionText(): Promise<string> {
  try { return JSON.stringify(JSON.parse(await readFile(path.join(V3_DIR, "loyalty-direction.json"), "utf8")).direction); } catch { return "(no direction yet)"; }
}

const V3_MEDIA = [...V2_MEDIA, { path: "/design-lab-v2/assets/*.jpg", what: "The eight V2 fixture stills (Maya, Nora and Eli work samples, placements) listed in their .jpg.json manifests" }, { path: "(coded)", what: "The Wallet card, the QR codes, the progress marks and the scanner are coded objects, not images" }];

function directionInstructions(m: { brief: string; research: string; architecture: string; truth: string }, sys: { chosen: string; system: string; direction: string }, bizSpec: string, siteSpec: string): string {
  return [
    WHO,
    "This job is the V3 LOYALTY DIRECTION. The founder approved your V2 direction (Open Cut) and now wants Loyalty designed into the new TapMart from the beginning, before any backend exists: a complete interactive concept in an isolated Design Lab, coded with fixture state, that a person can click through and understand exactly how the finished product would work. The brief, the Wallet research (what Apple Wallet and Google Wallet really support), the architecture (entities, events, attribution rules, privacy) and the product truth are pasted below. Your V2 system and your V2 specs for Business Home and the Public Homepage are pasted so Loyalty joins them as one product.",
    "Decide everything the engineer needs: where Loyalty lives (no new primary navigation item unless you argue it is necessary), the vocabulary, the hierarchy of all seven surfaces with every visible string, the card designer and both Wallet concepts drawn within platform reality, the signup, the counter recording flow and its reward moment, the attribution form (a visual descent of joined, came back, redeemed; never a spreadsheet; never revenue), the Wallet update concept labelled honestly, the public site sequence as a storyboard with timings, motion additions, and a consistent fixture story whose numbers add up. Loyalty must feel like a consumer product a shop owner understands in two seconds, not SaaS admin, and it must strengthen the business value proposition: get attention, turn them into customers, bring them back.",
    "Truth rules: nothing implies SMS, email or app push; every business message is a Wallet update; Apple change messages only for time critical changes (reward ready, redeemed); Google notifications limited to three per pass per day; the concept never claims a pass was issued; counts only, never money the platform cannot verify; first known TapMart source is preserved; creators never see customer identities. Attribution is critical and must be architected into the UX now.",
    NO_SLOP,
    "Return the JSON only.",
    "=== THE BRIEF ===", m.brief, "=== END ===",
    "=== WALLET RESEARCH ===", m.research, "=== END ===",
    "=== ARCHITECTURE ===", m.architecture, "=== END ===",
    "=== PRODUCT TRUTH ===", m.truth, "=== END ===",
    "=== THE V2 SYSTEM (chosen direction) ===", sys.chosen, sys.system, "=== END ===",
    "=== YOUR V2 BUSINESS HOME SPEC ===", bizSpec, "=== END ===",
    "=== YOUR V2 PUBLIC HOMEPAGE SPEC ===", siteSpec, "=== END ===",
    `=== CONSOLIDATED BUSINESS SETTINGS ===\n${V2_SETTINGS.business.join(", ")}\n=== END ===`,
    "=== AVAILABLE MEDIA ===", V3_MEDIA.map((x) => `${x.path}: ${x.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
}

export async function runV3Direction(o: V2Options & { captures?: string[] } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const r = route("ui_system", o.effort);
  const [m, sys, bizSpec, siteSpec] = await Promise.all([loyaltyMaterial(), chosenSystemText(), v2SpecText("business-home"), v2SpecText("public-home")]);
  const content: InputPart[] = [textPart("Study the brief, the research, the architecture, the product truth, your V2 system and your V2 specs until Loyalty's place in the product is obvious. Then decide the V3 Loyalty direction. Images follow: the coded V2 Business Home and Public Homepage as built (these are the surfaces Loyalty joins).")];
  for (const c of o.captures ?? []) await pushImage(content, c, `V2 AS BUILT ${path.basename(c)}:`, "low");
  const pendingPath = path.join(V3_DIR, ".pending-direction.json");
  let resumeId: string | null = null;
  if (o.resume) { try { resumeId = JSON.parse(await readFile(pendingPath, "utf8")).id ?? null; } catch { resumeId = null; } }
  if (resumeId) say(`Loyalty direction: re-attaching to response ${resumeId}`);
  else say(`Loyalty direction with the design director (${r.effort})`);
  await mkdir(V3_DIR, { recursive: true });
  const res = await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions: directionInstructions(m, sys, bizSpec, siteSpec), content, schema: V3_DIRECTION_SCHEMA,
    maxOutputTokens: 60000, maxWaitMs: 60 * 60_000, dryRun: o.dryRun, resumeId,
    onSubmitted: (id) => { void writeFile(pendingPath, JSON.stringify({ id, when: new Date().toISOString() })); },
    onProgress: o.onProgress,
  });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  const jsonPath = path.join(V3_DIR, "loyalty-direction.json");
  const mdPath = path.join(V3_DIR, "LOYALTY_DIRECTION.md");
  res.data = noDashes(res.data);
  await writeFile(jsonPath, JSON.stringify({ when: new Date().toISOString(), author: "director", direction: res.data }, null, 2));
  await writeFile(mdPath, directionMarkdown(res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- screen

function screenInstructions(m: { brief: string; research: string; architecture: string; truth: string }, sys: { chosen: string; system: string; direction: string }, direction: string): string {
  return [
    WHO,
    "This job is V3 SCREEN ART DIRECTION. You defined the V2 system and the V3 Loyalty direction (both pasted below). Now art direct ONE V3 surface for the engineer, region by region, for phone (390), small phone (320), tablet, desktop (1440) and large desktop (1920), including each step or state the surface has. Desktop is its own composition, never a stretched phone.",
    "SHOW FIRST. ACTION SECOND. DETAILS ON DEMAND. List EVERY visible string the surface may show, per state, with the decision it serves; the engineer may not add others. Say exactly what is on demand and how it is revealed. Coded objects (the Wallet cards, QR codes, progress marks, the scanner) are described precisely enough to build without a follow up question. Motion must explain something and never mislead; reduced motion is specified for each motion.",
    "Truth rules: nothing implies SMS, email or app push; every business message is a Wallet update; the concept never claims a pass was issued; counts only, never money the platform cannot verify; creators never see identities; fixture data is fictional and consistent with the direction's fixture story.",
    NO_SLOP,
    "Use only media from the available list or coded objects. Return the JSON only.",
    "=== THE BRIEF (excerpt) ===", m.brief.slice(0, 6000), "=== END ===",
    "=== WALLET RESEARCH (what this surface may show) ===", m.research.slice(0, 9000), "=== END ===",
    "=== ARCHITECTURE (excerpt) ===", m.architecture.slice(0, 7000), "=== END ===",
    "=== THE V2 SYSTEM ===", sys.chosen, sys.system, "=== END ===",
    "=== THE V3 LOYALTY DIRECTION ===", direction, "=== END ===",
    "=== AVAILABLE MEDIA ===", V3_MEDIA.map((x) => `${x.path}: ${x.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
}

export async function runV3Screen(key: V3ScreenKey, o: V2Options & { phone?: string | null; desktop?: string | null; notes?: string | null } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const def = V3_SCREENS[key];
  const r = route("screen_design", o.effort);
  const [m, sys, direction] = await Promise.all([loyaltyMaterial(), chosenSystemText(), directionText()]);
  const content: InputPart[] = [textPart([
    `Art direct "${def.name}" (${def.route}) in the V3 Loyalty direction.`,
    `PURPOSE: ${def.purpose}`, `DATA: ${def.data}`, `ACTIONS: ${def.actions}`, `TRUTH: ${def.truth}`,
    o.notes ? `NOTES FROM THE ENGINEER: ${o.notes}` : "",
    "Target: no block of eighteen words or more on a logged in surface; first screen under 40 words on phone; the public sequence under 30 visible words in total.",
  ].filter(Boolean).join("\n\n"))];
  await pushImage(content, o.phone, "AS BUILT SO FAR, PHONE (reference only):", "low");
  await pushImage(content, o.desktop, "AS BUILT SO FAR, DESKTOP (reference only):", "low");
  say(`Art direction for ${def.name} (${r.effort})`);
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions: screenInstructions(m, sys, direction), content, schema: V3_SCREEN_SCHEMA, maxOutputTokens: 40000, maxWaitMs: 40 * 60_000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  await mkdir(SCREENS_DIR, { recursive: true });
  const jsonPath = path.join(SCREENS_DIR, `${key}.json`);
  const mdPath = path.join(SCREENS_DIR, `${key}.md`);
  res.data = noDashes(res.data);
  await writeFile(jsonPath, JSON.stringify({ screen: def.name, route: def.route, when: new Date().toISOString(), author: "director", spec: res.data }, null, 2));
  await writeFile(mdPath, v3ScreenMarkdown(def.name, res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- review

function reviewInstructions(sys: { chosen: string; system: string; direction: string }, direction: string, spec: string | null, final: boolean): string {
  return [
    WHO,
    `This job is V3 SCREEN REVIEW${final ? " (FINAL)" : ""}. Claude Code built a real coded prototype of a Loyalty surface you art directed, in the isolated V3 Design Lab with fixture state, and a browser captured REAL screenshots (phone and desktop, sometimes a motion strip of an interaction). Judge the pixels against your system, your direction, your spec, the founder's ten questions and the five Loyalty questions. Compare values: colours, faces, sizes, spacing, shapes, surfaces, the Wallet card realism, the honesty of labels, text discipline, navigation presentation, evidence of motion in a strip.`,
    "Answer the questions from the pixels, not from the spec. Where the build drifts from your spec, give the exact change. Where your spec was wrong now that it is real, say so and give the better instruction; you have authority over the design. Never suggest fake data, invented numbers, revenue, or anything the Wallet platforms cannot do. Ten strong fixes beat thirty weak ones. A full page phone capture can show a fixed bottom bar painted mid page; that is a capture artifact.",
    final ? "This is the final pass: also write, for the founder, in plain language, what this gives a business that TapMart does not have today, and the remaining risks. 'ready' means a professional product designer would believe this is a finished, distinctive TapMart surface a shop owner understands in two seconds." : "",
    NO_SLOP,
    "Return the JSON only.",
    "=== THE V2 SYSTEM ===", sys.chosen, sys.system, "=== END ===",
    "=== THE V3 LOYALTY DIRECTION ===", direction, "=== END ===",
    ...(spec ? ["=== YOUR SPEC FOR THIS SURFACE ===", spec, "=== END ==="] : []),
    `=== THE TEN QUESTIONS ===\n${QUALITY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n=== END ===`,
    `=== THE FIVE LOYALTY QUESTIONS ===\n${LOYALTY_QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n=== END ===`,
  ].filter(Boolean).join("\n\n");
}

export type V3ReviewInput = { key: V3ScreenKey; shots: string[]; pass: number; final?: boolean; notes?: string | null };

export async function runV3Review(i: V3ReviewInput, o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[]; markdown: string }> {
  const say = o.onProgress ?? (() => {});
  const def = V3_SCREENS[i.key];
  const r = route(i.final ? "screen_review_final" : "screen_review", o.effort);
  const [sys, direction] = await Promise.all([chosenSystemText(), directionText()]);
  let spec: string | null = null;
  try { spec = JSON.stringify(JSON.parse(await readFile(path.join(SCREENS_DIR, `${i.key}.json`), "utf8")).spec); } catch { spec = null; }
  const content: InputPart[] = [textPart([
    `Surface: ${def.name} (${def.route}), pass ${i.pass}${i.final ? ", final" : ""}.`,
    `Images in order: ${i.shots.map((s, n) => `${n + 1}. ${path.basename(s)}`).join("; ")}.`,
    i.notes ? `Notes from the engineer: ${i.notes}` : "",
    "Answer with the JSON only.",
  ].filter(Boolean).join("\n"))];
  for (const s of i.shots) await pushImage(content, s, `CAPTURE ${path.basename(s)}:`);
  say(`Review ${def.name} pass ${i.pass} (${r.effort})`);
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions: reviewInstructions(sys, direction, spec, Boolean(i.final)), content, schema: V3_REVIEW_SCHEMA, maxOutputTokens: 30000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [], markdown: "" };
  await mkdir(REVIEWS_DIR, { recursive: true });
  const base = path.join(REVIEWS_DIR, `${i.key}-pass${i.pass}`);
  res.data = noDashes(res.data);
  const md = v3ReviewMarkdown(def.name, i, res.data);
  await writeFile(`${base}.json`, JSON.stringify({ screen: def.name, pass: i.pass, final: Boolean(i.final), shots: i.shots.map((s) => path.basename(s)), when: new Date().toISOString(), reviewer: "director", review: res.data }, null, 2));
  await writeFile(`${base}.md`, md);
  return { data: res.data, usage: [res.usage], files: [`${base}.json`, `${base}.md`], markdown: md };
}

// ------------------------------------------------------------ markdown

/** Director prose arrives with typographic dashes; the repository keeps none. */
export function noDashes<T>(value: T): T {
  if (typeof value === "string") return value.replace(/(\d)\s?\u2013\s?(\d)/g, "$1 to $2").replace(/\s*[\u2013\u2014]\s*/g, ", ").replace(/, ,/g, ",") as T;
  if (Array.isArray(value)) return value.map(noDashes) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, noDashes(v)])) as T;
  return value;
}

const pairs = (o: unknown): string[] => o && typeof o === "object" ? Object.entries(o as Record<string, unknown>).map(([k, v]) => `**${k.replace(/_/g, " ")}.** ${Array.isArray(v) ? "\n" + bullets(v).join("\n") : typeof v === "string" ? v : JSON.stringify(v)}`) : [];

function directionMarkdown(d: Record<string, unknown>): string {
  const lines = ["# TapMart V3: the Loyalty direction", "", "Decided by Astra, TapMart's design director. Source: loyalty-direction.json.", "", "## Founder read", "", String(d.founder_read), "", "## What Loyalty is", "", String(d.what_loyalty_is), "", "## Placement", "", ...pairs(d.placement), "", "## Vocabulary", "", ...bullets(d.vocabulary), ""];
  for (const s of (d.surfaces as Record<string, unknown>[]) ?? []) {
    lines.push(`## Surface: ${s.surface}`, "", `**Two seconds.** ${s.two_second_read}`, "", `**Primary action.** ${s.primary_action}`, "", "Hierarchy:", "", ...bullets(s.hierarchy), "", "On demand:", "", ...bullets(s.on_demand), "", "Visible copy:", "", ...bullets(s.visible_copy), "", "Truth labels:", "", ...bullets(s.truth_labels), "");
  }
  lines.push("## Loyalty Home hierarchy", "", ...bullets(d.loyalty_home_hierarchy), "", "## Card designer", "", ...pairs(d.card_designer), "", "## Signup", "", ...pairs(d.signup), "", "## Recording", "", ...pairs(d.recording), "", "## Attribution view", "", ...pairs(d.attribution_view), "", "## Updates", "", ...pairs(d.updates), "", "## Public sequence", "");
  const ps = d.public_sequence as Record<string, unknown>;
  lines.push(`**Where.** ${ps?.where}`, "", "Storyboard:", "", ...bullets(((ps?.storyboard as Record<string, string>[]) ?? []).map((f) => `${f.frame} (${f.duration_ms}ms): ${f.shows} Moves: ${f.moves}. Copy: ${f.copy}`)), "", `**Desktop.** ${ps?.desktop}`, "", `**Phone.** ${ps?.phone}`, "", `**Reduced motion.** ${ps?.reduced_motion}`, "");
  lines.push("## Motion additions", "", ...bullets(((d.motion as Record<string, string>[]) ?? []).map((m) => `${m.name}: ${m.trigger}; ${m.what_moves}; ${m.duration_ms}ms ${m.easing}; explains ${m.explains}; reduced motion: ${m.reduced_motion}`)), "", "## Fixture story", "", ...pairs(d.fixture_story), "", "## Honest states", "", ...bullets(d.honest_states), "", "## Not built on purpose", "", ...bullets(d.what_not_to_build), "", "## Self critique", "", ...bullets(d.self_critique), "");
  return lines.join("\n");
}

function v3ScreenMarkdown(name: string, s: Record<string, unknown>): string {
  const base = screenMarkdown(name, { ...s, earning_types: s.states, removed: s.truth_labels, moved_to_settings: [] }).replace("# V2 art direction", "# V3 art direction").replace("## Earning types", "## States").replace("## Removed", "## Truth labels").replace("\n## Moved to settings\n\n\n", "\n");
  return base;
}

function v3ReviewMarkdown(name: string, i: V3ReviewInput, r: Record<string, unknown>): string {
  const md = reviewMarkdown(name, { key: "business-home", shots: i.shots, pass: i.pass, final: i.final }, r).replace("# V2 review", "# V3 review");
  const loyalty = ["## The five Loyalty questions", "", ...bullets(((r.loyalty_bar as { question: string; answer: string; note: string }[]) ?? []).map((q) => `${q.question} **${q.answer}**. ${q.note}`)), ""].join("\n");
  return md.replace("## Scores", `${loyalty}\n## Scores`);
}
