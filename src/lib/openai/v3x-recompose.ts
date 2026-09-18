import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { respond, textPart, type InputPart, type JsonSchema, type Usage } from "./client";
import { route } from "./models";
import { L, NO_SLOP, S, SCORE, WHO, bullets, obj, productTruth, pushImage, read, type V2Options } from "./v2";
import { V3_DIR, V3_MEDIA, noDashes } from "./v3";
import { runCreativeJob, type CreativeJobResult } from "./creative";
import type { CreativeBrief, CreativeInput } from "./director";
import { LAB_PUBLIC_DIR } from "./lab-assets";

/**
 * The V3 recomposition (docs/design-lab-v3/RECOMPOSE_BRIEF.md). The founder
 * approved the V3 architecture and rejected its visual presentation. Astra
 * directs a visual, motion and presentation recomposition of four
 * experiences on the public homepage, judged by the founder's six
 * questions rather than by "is it premium".
 *
 *   v3x-recompose         the recomposition direction: the film spine, the
 *                         hero composition, the Recreate transformation, the
 *                         Drive vehicle moment, the Loyalty chain, material,
 *                         typography, motion vocabulary and media briefs.
 *   recompose-assets      render the media briefs with the final image
 *                         model; Astra reviews each render and rejects the
 *                         mediocre ones (they are kept out of the lab).
 *   v3x-recompose-review  judge real captures and recordings of ONE of the
 *                         four experiences against the direction.
 *   v3x-compare           the current V3 against the recomposition, on the
 *                         six questions, for the founder.
 *
 * Everything is written under docs/design-lab-v3/recompose. Nothing here
 * touches the application, the database or production.
 */

export const RECOMPOSE_DIR = path.join(V3_DIR, "recompose");
const REVIEWS_DIR = path.join(RECOMPOSE_DIR, "reviews");
const ASSETS_DIR = path.join(RECOMPOSE_DIR, "assets");

export type RecomposeKey = "hero" | "recreate" | "drive" | "loyalty";

export const RECOMPOSE_EXPERIENCES: Record<RecomposeKey, { name: string; anchor: string; asks: string }> = {
  hero: { name: "Public hero", anchor: "/design-lab-v3#top", asks: "A visitor understands in seconds, without paragraphs, I can make money and I can grow my business. One spatial composition of real product objects (creator, Reel, Story, vehicle, earnings, business, loyalty card) with depth and motion, worthy of a product launch, that hands its Reel to the Recreate chapter." },
  recreate: { name: "Recreate sequence", anchor: "/design-lab-v3#recreate", asks: "REFERENCE, YOUR VERSION, APPROVED, EARNED as one transformation of the same media object, the amount as the natural conclusion; not four screenshots." },
  drive: { name: "Drive sequence", anchor: "/design-lab-v3#drive", asks: "A beautifully art directed real vehicle with zones directly on or around it: the vehicle enters, the camera shifts, the zones reveal, the business creative attaches to a zone, campaign and pay material appears, the monthly earning resolves. Coded layers, perspective, masking and photography; production 3D is never faked; no crude car diagram as the centrepiece." },
  loyalty: { name: "Business to Loyalty sequence", anchor: "/design-lab-v3#loyalty", asks: "One visual chain: creator or campaign, customer, Wallet card, visit, return, reward, attribution. The moment the returning customer's original creator or campaign becomes visible feels powerful. No paragraphs." },
};

export const SIX_QUESTIONS = [
  "Would someone remember this website tomorrow?",
  "Could this homepage belong to any other startup?",
  "Do Recreate, Story and Drive each have a recognizable physical identity?",
  "Does the car moment make TapMart feel unique?",
  "Does the Loyalty loop make a business understand why TapMart is more than creator marketing?",
  "Would someone scroll because they want to see what happens next?",
];

const YES = { type: "string", enum: ["yes", "partly", "no"] };
const QA = { type: "array", items: obj({ question: S(), answer: YES, note: S() }) };
const BEAT = (beats: string[]) => ({ type: "array", items: obj({ beat: { type: "string", enum: beats }, object_state: S("What the object is at this beat: size, position, material, what is visible."), motion: S("Exactly what moves into this beat: technique, what is masked, what persists, what is handed off."), timing: S("Scroll range or duration and easing."), visible_strings: L("Every visible string at this beat; short."), truth: S("What must not be implied here, from the fixture bindings.") }) });

// ---------------------------------------------------------- direction

export const RECOMPOSE_SCHEMA: JsonSchema = {
  name: "tapmart_v3_recomposition",
  schema: obj({
    founder_read: S("What the founder rejected and what they want, in your words. Name what in the current captures reads as an editorial web prototype."),
    what_stays: L("The approved architecture, logic, fixtures, truth rules and copy discipline you are not allowed to change."),
    thesis: S("The recomposition in one short paragraph: what a visitor sees and feels that they have not seen before."),
    film: obj({
      spine: S("The one connected film: which object continues from chapter to chapter and how each handoff is made."),
      handoffs: { type: "array", items: obj({ from: S(), to: S(), object: S(), technique: S("Shared element, mask reveal, scale, depth transition; exact.") }) },
      scroll_model: S("How scroll drives the film (pinned stages, progress ranges, what a tap or key step does), how it stays usable, and what happens under reduced motion."),
    }),
    hero: obj({
      composition: S("The spatial composition: the arrangement of the real product objects in depth, phone first, then desktop."),
      objects: { type: "array", items: obj({ object: S(), media: S("The fixture media or coded object."), phone: S("Size and position at 390."), desktop: S("Size and position at 1440."), depth: S("Plane, scale, blur or shadow that places it in depth."), motion: S("At rest, on scroll, on pointer.") }) },
      words: L("Every visible string in the hero, under 20 meaningful words besides navigation and actions."),
      typography: S("The display scale and weight for the two lines and the object labels."),
      choreography: S("Rest, first scroll, handoff into Recreate; durations, easings, what persists."),
      understands: S("What a visitor understands in three seconds."),
    }),
    recreate: obj({ transformation: S("The single media object and how it is transformed through the four beats."), beats: BEAT(["reference", "your_version", "approved", "earned"]), amount_conclusion: S("How the amount arrives as the conclusion while staying truthful to the fixture (US$75 on approval for the Reel; Counter pour approved Sep 10, 2026 with no ledger record)."), material: S("Which material passes over or under the object and why."), phone: S(), desktop: S() }),
    drive: obj({ vehicle_art_direction: S("The vehicle, angle, light, setting and colour; why it photographs as a real car a person owns and not a stock render."), zones: L("The zones on or around the vehicle, named as the product names them."), beats: BEAT(["enters", "camera_shifts", "zones_reveal", "creative_attaches", "campaign_appears", "earning_resolves"]), technique: S("Coded layers, perspective, masking and photography: exactly how the zones sit on the photographed car without faking 3D."), smart_vehicle_concept: S("Whether and how a clearly labelled future Smart Vehicle concept appears; or none."), phone: S(), desktop: S() }),
    loyalty: obj({ chain: { type: "array", items: obj({ link: { type: "string", enum: ["campaign", "customer", "wallet_card", "visit", "return", "reward", "attribution"] }, object: S(), motion: S(), visible_strings: L() }) }, powerful_moment: S("The exact execution of the moment the returning customer's original creator or campaign becomes visible."), material: S(), phone: S(), desktop: S() }),
    material: obj({ principle: S("Glass pushed further with Apple level restraint: what earns translucency now and what stays opaque."), layers: { type: "array", items: obj({ name: S(), css: S("Exact values: background, blur, saturation, stroke, inset highlight, shadow, radius."), used_on: S(), moves_beneath: S("What content visibly moves beneath it.") }) }, transitions: S("How a surface goes from opaque to translucent and back."), shadows_and_edges: S() }),
    typography: obj({ scale: { type: "array", items: obj({ role: S(), phone: S(), desktop: S(), weight: S(), tracking: S() }) }, rhythm: S("Scale, rhythm and contrast without making everything huge."), faces: S("Which faces, from what is already loaded.") }),
    motion_vocabulary: { type: "array", items: obj({ name: S(), technique: S(), duration: S(), easing: S(), used_on: S(), reduced_motion: S() }) },
    media_briefs: { type: "array", items: obj({ id: S("kebab case file id, no extension"), purpose: S(), used_by: L("Which experiences use it."), kind: { type: "string", enum: ["vehicle_photograph", "creator_work", "business_photograph", "story_creative", "campaign_creative", "customer_moment", "concept_art"] }, aspect_ratio: { type: "string", enum: ["9:16", "4:5", "1:1", "16:9", "3:2"] }, prompt: S("The full render prompt for the final image model: subject, environment, composition, camera, lighting, colour; photographic, fictional, no UI, no logos of real companies, no readable text unless named."), avoid: L(), replaces: S("Which current lab media it replaces, or none."), acceptance: S("What you will reject: what makes this asset mediocre.") }), description: "Only the media the recomposition needs; the vehicle for Drive first. Existing fixture media stays bound where it is truthful." },
    performance_limits: L("Compositor only motion, image sizes, how many translucent layers at once, LCP protection on phone."),
    six_questions: { type: "array", items: obj({ question: S(), what_to_look_for: S("What in the captures and recordings will answer it.") }) },
    what_not_to_build: L(),
    self_critique: L("Where this could still be an editorial web prototype, glass slop, or a car app; the rule that prevents each."),
  }),
};

async function material(): Promise<{ brief: string; artec: string; truth: string; direction: string; manifest: string }> {
  const rel = (f: string) => path.relative(process.cwd(), path.join(V3_DIR, f));
  const [brief, artec, truth, manifest] = await Promise.all([read(rel("RECOMPOSE_BRIEF.md")), read(rel("ARTEC_LIVE_STUDY.md")), productTruth(), read(rel("MEDIA_MANIFEST.json"))]);
  let direction = "(no experience direction)";
  try { direction = JSON.stringify(JSON.parse(await readFile(path.join(V3_DIR, "experience-direction.json"), "utf8")).direction); } catch { /* keep the placeholder */ }
  return { brief, artec, truth, direction, manifest };
}

async function recomposeText(): Promise<string> {
  try { return JSON.stringify(JSON.parse(await readFile(path.join(RECOMPOSE_DIR, "recompose-direction.json"), "utf8")).direction); } catch { return "(no recomposition direction yet: run v3x-recompose first)"; }
}

export async function runV3XRecompose(o: V2Options & { captures?: string[]; strips?: string[] } = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[] }> {
  const say = o.onProgress ?? (() => {});
  const r = route("ui_system", o.effort);
  const m = await material();
  const content: InputPart[] = [textPart("Study the recomposition brief, the live Artec study, the product truth, your approved experience direction and the media manifest. The captures and motion strips that follow are the CURRENT V3: the architecture in them is approved; their visual presentation is NOT. Direct the recomposition. Return the JSON only.")];
  for (const c of o.captures ?? []) await pushImage(content, c, `CURRENT V3 CAPTURE ${path.basename(c)}:`, "low");
  for (const s of o.strips ?? []) await pushImage(content, s, `CURRENT V3 RECORDING STRIP ${path.basename(s)}:`, "high");
  const instructions = [
    WHO,
    "This job is the V3 RECOMPOSITION DIRECTION. The founder reviewed the V3 package and approved the product architecture and the UX simplification to keep: the reduced text, the Recreate, Story and Drive logic, the User and Business structure, the settings architecture, the Loyalty architecture with first touch attribution, the Wallet and QR concepts, the campaign to customer to repeat customer loop, the truthful states, the accessibility, the existing backend and product logic. The founder did NOT approve the visual experience: it is still a clean editorial web prototype (flat white and cream canvas, dark green, straight photography, basic text layouts, normal web sections, conventional UI). They want a premium, spatial, animated product experience a visitor has not seen before, judged by six questions, not by 'is it premium'.",
    "Direct a VISUAL, MOTION and PRESENTATION recomposition of four experiences only: the public hero, the Recreate sequence, the Drive sequence and the Business to Loyalty sequence. Do not change flows, data, fixtures, amounts, dates or truth rules; do not add text; do not restart the product; do not redesign User Home, Profile or Business Home. Increase spatial quality, material quality, motion continuity, distinctiveness and emotional impact. The homepage is one connected product film with object handoffs, not stacked sections. Material is pushed much further with Apple level restraint (a translucent navigation, layered planes, subtle refraction, content moving beneath glass, edge highlights, selective floating sheets, soft physical shadows, opaque to translucent transitions) and never glass everywhere. Motion is the biggest missing layer: shared element transitions, mask reveals, object persistence, scroll linked choreography, depth transitions, parallax only where it means something, physical sheets, spring based interactions. No gimmicks: the product is what moves.",
    "Drive: the current generic silver sedan and line drawing are rejected. Brief a real, beautifully art directed vehicle photograph for the lab (the image model renders it, you review it), and put the zones on or around that vehicle with coded layers, perspective and masking. Never fake production 3D. Recreate: one media object transformed through reference, your version, approved, earned, with the amount as the conclusion and the fixture truth intact. Loyalty: one visual chain, and the attribution moment must land. Hero: real product objects in one spatial composition; under 20 meaningful words.",
    "Media: brief only the generated photography the recomposition needs (the vehicle first; creator work, business, Story, campaign and customer moments only where the current media is the weak link). Each brief is a full photographic prompt with an acceptance rule; you will reject mediocre renders. Everything is fictional lab media; no real brands, no UI in the image, no readable text unless you name it. Keep the existing bindings where they are truthful.",
    "Engineering reality: Claude Code builds this as real React and CSS in the isolated lab with scroll progress, transforms, clip paths, masks and backdrop filters; compositor only motion; a visible Pause motion control; prefers-reduced-motion renders ordered stationary states; every action stays keyboard reachable; phone 390 first, then 1440. Give exact values where the engineer needs them.",
    NO_SLOP,
    "=== THE RECOMPOSITION BRIEF ===", m.brief, "=== END ===",
    "=== THE LIVE ARTEC STUDY ===", m.artec, "=== END ===",
    "=== PRODUCT TRUTH ===", m.truth, "=== END ===",
    "=== YOUR APPROVED V3 EXPERIENCE DIRECTION (architecture approved; presentation not) ===", m.direction, "=== END ===",
    "=== THE MEDIA MANIFEST (bindings that stay truthful) ===", m.manifest, "=== END ===",
    "=== AVAILABLE MEDIA ===", V3_MEDIA.map((x) => `${x.path}: ${x.what}`).join("\n"), "=== END ===",
  ].join("\n\n");
  const pendingPath = path.join(RECOMPOSE_DIR, ".pending-recompose.json");
  let resumeId: string | null = null;
  if (o.resume) { try { resumeId = JSON.parse(await readFile(pendingPath, "utf8")).id ?? null; } catch { resumeId = null; } }
  say(resumeId ? `Recomposition: re-attaching to response ${resumeId}` : `Recomposition direction with the design director (${r.effort})`);
  await mkdir(RECOMPOSE_DIR, { recursive: true });
  const res = await respond<Record<string, unknown>>({
    model: r.model, effort: r.effort, instructions, content, schema: RECOMPOSE_SCHEMA,
    maxOutputTokens: 60000, maxWaitMs: 60 * 60_000, dryRun: o.dryRun, resumeId, webSearch: true,
    onSubmitted: (id) => { void writeFile(pendingPath, JSON.stringify({ id, when: new Date().toISOString() })); },
    onProgress: o.onProgress,
  });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [] };
  res.data = noDashes(res.data);
  const jsonPath = path.join(RECOMPOSE_DIR, "recompose-direction.json");
  const mdPath = path.join(RECOMPOSE_DIR, "RECOMPOSE_DIRECTION.md");
  await writeFile(jsonPath, JSON.stringify({ when: new Date().toISOString(), author: "director", direction: res.data }, null, 2));
  await writeFile(mdPath, directionMarkdown(res.data));
  return { data: res.data, usage: [res.usage], files: [jsonPath, mdPath] };
}

// ------------------------------------------------------------- assets

type MediaBrief = { id: string; purpose: string; used_by: string[]; kind: string; aspect_ratio: CreativeBrief["aspect_ratio"]; prompt: string; avoid: string[]; replaces: string; acceptance: string };

/** Render the media briefs. A render Astra did not approve is written beside the lab as <id>.rejected.jpg and never bound. */
export async function renderRecomposeAssets(o: { only?: string[]; tier?: "fast" | "final"; fixRounds?: number; onProgress?: (m: string) => void; dryRun?: boolean; force?: boolean; resume?: boolean } = {}): Promise<{ rendered: string[]; rejected: string[]; skipped: string[]; failed: string[]; usage: Usage[] }> {
  const say = o.onProgress ?? (() => {});
  const d = JSON.parse(await readFile(path.join(RECOMPOSE_DIR, "recompose-direction.json"), "utf8")).direction as { media_briefs: MediaBrief[]; drive?: { vehicle_art_direction?: string } };
  const briefs = (d.media_briefs ?? []).filter((a) => !o.only?.length || o.only.includes(a.id));
  await mkdir(LAB_PUBLIC_DIR, { recursive: true }); await mkdir(ASSETS_DIR, { recursive: true });
  const rendered: string[] = []; const rejected: string[] = []; const skipped: string[] = []; const failed: string[] = []; const usage: Usage[] = [];
  for (const a of briefs) {
    const file = path.join(LAB_PUBLIC_DIR, `${a.id}.jpg`);
    const rejectedFile = path.join(LAB_PUBLIC_DIR, `${a.id}.rejected.jpg`);
    if (existsSync(file) && !o.force) { skipped.push(a.id); continue; }
    say(`Asset ${a.id} (${a.kind}, ${a.aspect_ratio}) for ${a.used_by.join(", ")}`);
    if (o.dryRun) continue;
    const type = a.kind === "story_creative" ? "STORY_AD" : "CONCEPT_ART";
    // --resume continues a rejected render from the director's last edit instructions instead of generating again
    let resumeEdit: string | null = null;
    if (o.resume && existsSync(rejectedFile)) {
      try { const rec = JSON.parse(await readFile(path.join(ASSETS_DIR, `${a.id}.json`), "utf8")); const kept = rec.rounds?.find((x: { round: number }) => x.round === rec.acceptedRound) ?? rec.rounds?.[rec.rounds.length - 1]; const last = kept?.review; if (last?.verdict === "edit" && last.edit_instructions?.trim()) resumeEdit = `${last.edit_instructions}\n\nThe image API renders this aspect at 1536 by 1024 at most; do not attempt to upscale or change the pixel count, and change nothing outside the named repairs.`; } catch { resumeEdit = null; }
    }
    const input: CreativeInput = {
      type, business: { name: "TapMart Design Lab", category: "fictional lab photography", description: a.purpose, tone: "Photographic, physical, believable; a real object a person owns, not a render." },
      objective: a.purpose, placement: `Design Lab prototype media, ${a.aspect_ratio}. The image API renders this aspect at 1536 by 1024 at most; judge the photograph, not its pixel count. Acceptance: ${a.acceptance}`, constraints: ["No UI, no watermark, no logos of real companies, no readable text unless the prompt names it", ...a.avoid], aspect: a.aspect_ratio,
      sourceImages: resumeEdit ? [{ url: rejectedFile, role: "photo", note: "The previous render, to be edited per the instructions" }] : undefined,
    };
    if (resumeEdit) say(`Asset ${a.id}: resuming from the rejected render with the director's last edit instructions`);
    const brief: CreativeBrief = { title: a.id, concept: a.purpose, subject: a.kind, environment: "", composition: "", camera: "", lighting: "", color_treatment: "", headline: "", cta: "", aspect_ratio: a.aspect_ratio, preserve: [], avoid: a.avoid, image_route: o.tier ?? "final", generation_mode: resumeEdit ? "edit" : "generate", prompt: resumeEdit ?? a.prompt, source_image_use: resumeEdit ? "The previous render is the base; apply the edit instructions only." : "" };
    try {
      const r: CreativeJobResult = await runCreativeJob(input, { tier: o.tier ?? "final", maxFixRounds: o.fixRounds ?? 2, save: false, format: "jpeg", onProgress: say }, { brief, brandRead: a.acceptance, audienceRead: "TapMart Design Lab" });
      usage.push(...r.usage);
      // every round is kept for inspection; the bound render is the approved round, or the best scored round whose only objection is pixel count (the API's ceiling)
      for (const x of r.rounds) await writeFile(path.join(ASSETS_DIR, `${a.id}-round${x.round}.jpg`), x.image.bytes);
      const score = (x: typeof r.rounds[number]) => Object.values(x.review?.scores ?? {}).reduce((t, n) => t + n, 0);
      const resolutionOnly = (x: typeof r.rounds[number]) => Boolean(x.review) && (x.review!.problems ?? []).every((pr) => /pixel|resolution|2400|1600|upscal/i.test(pr));
      const approved = r.rounds.find((x) => x.review?.verdict === "approve");
      const best = approved ?? [...r.rounds].sort((p, q) => score(q) - score(p))[0];
      const ok = Boolean(approved) || (best.review !== null && resolutionOnly(best) && Object.values(best.review.scores).every((n) => n >= 8));
      await writeFile(ok ? file : path.join(LAB_PUBLIC_DIR, `${a.id}.rejected.jpg`), best.image.bytes);
      await writeFile(path.join(ASSETS_DIR, `${a.id}.json`), JSON.stringify({ id: a.id, kind: a.kind, aspect: a.aspect_ratio, purpose: a.purpose, prompt: a.prompt, acceptance: a.acceptance, approvedByDirector: Boolean(approved), acceptedRound: best.round, accepted: ok, acceptanceNote: ok && !approved ? "The director's remaining objection on this round was pixel count only; the image API renders 3:2 at 1536 by 1024." : null, rounds: r.rounds.map((x) => ({ round: x.round, action: x.action, imageModel: x.imageModel, quality: x.quality, review: x.review })) }, null, 2));
      (ok ? rendered : rejected).push(a.id);
      say(`Asset ${a.id}: ${approved ? `approved by the director (round ${best.round})` : ok ? `accepted: round ${best.round} scored ${score(best)} with a pixel count objection only` : "REJECTED by the director (kept as .rejected.jpg, not bound)"}`);
    } catch (e) {
      say(`Asset ${a.id} failed: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
      failed.push(a.id);
    }
  }
  return { rendered, rejected, skipped, failed, usage };
}

// ------------------------------------------------------------- review

const RECOMPOSE_SCORES = obj({ remembered_tomorrow: SCORE, could_not_be_another_startup: SCORE, physical_identity: SCORE, car_moment_unique: SCORE, loyalty_more_than_marketing: SCORE, scroll_pull: SCORE, spatial_quality: SCORE, material_quality: SCORE, motion_continuity: SCORE, typography: SCORE, media_quality: SCORE, text_discipline: SCORE, truthfulness: SCORE, slop_risk: SCORE });

export const RECOMPOSE_REVIEW_SCHEMA: JsonSchema = {
  name: "tapmart_v3_recomposition_review",
  schema: obj({
    verdict: { type: "string", enum: ["ready", "fix", "recompose"] },
    two_second_read: S(),
    six_questions: QA,
    scores: RECOMPOSE_SCORES,
    still_a_web_prototype: S("Where the pixels still read as an editorial web prototype, or nowhere."),
    spatial_read: S(), material_read: S(), motion_read: S("What the recording strips prove moves and what only appears to."),
    media_read: S("Whether the media is worthy: the vehicle, the work, the creative."),
    drift: L("Where the build departs from your direction."),
    direction_was_wrong: L(),
    fixes: { type: "array", items: obj({ priority: { type: "integer", minimum: 1 }, change: S(), where: S(), why: S() }) },
    keep: L(),
  }),
};

export const COMPARE_SCHEMA: JsonSchema = {
  name: "tapmart_v3_recomposition_compare",
  schema: obj({
    experiences: { type: "array", items: obj({
      experience: { type: "string", enum: ["hero", "recreate", "drive", "loyalty"] },
      current_v3: obj({ read: S(), six_questions: QA, score: SCORE }),
      recomposed: obj({ read: S(), six_questions: QA, score: SCORE }),
      verdict: { type: "string", enum: ["recomposed", "current", "draw"] },
      why: S(), what_still_misses: L(),
    }) },
    homepage: obj({ six_questions: QA, remembered_tomorrow: S("Honest: would someone remember it tomorrow, and for what."), belongs_to_tapmart_only: S(), scroll_pull: S() }),
    verdict: { type: "string", enum: ["approve_direction", "continue", "recompose_again"] },
    note_for_founder: S("Plain, short, no selling."),
    risks: L(),
  }),
};

export type RecomposeReviewInput = { key: RecomposeKey; shots: string[]; pass: number; final?: boolean; notes?: string | null };

export async function runV3XRecomposeReview(i: RecomposeReviewInput, o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[]; markdown: string }> {
  const say = o.onProgress ?? (() => {});
  const def = RECOMPOSE_EXPERIENCES[i.key];
  const r = route(i.final ? "screen_review_final" : "screen_review", o.effort);
  const [direction, m] = await Promise.all([recomposeText(), material()]);
  const content: InputPart[] = [textPart([
    `Experience: ${def.name} (${def.anchor}), pass ${i.pass}${i.final ? ", final" : ""}.`, `The brief asks: ${def.asks}`,
    `Images in order: ${i.shots.map((s, n) => `${n + 1}. ${path.basename(s)}`).join("; ")}. Files ending in -strip are frame strips from real screen recordings, left to right in time.`,
    i.notes ? `Notes from the engineer: ${i.notes}` : "", "Answer with the JSON only.",
  ].filter(Boolean).join("\n"))];
  for (const s of i.shots) await pushImage(content, s, `CAPTURE ${path.basename(s)}:`);
  say(`Review ${def.name} pass ${i.pass} (${r.effort})`);
  const instructions = [
    WHO,
    `This job is V3 RECOMPOSITION REVIEW${i.final ? " (FINAL)" : ""}. Claude Code rebuilt this experience in the isolated lab from your recomposition direction, and a browser captured REAL stills and recordings. Judge the pixels against your direction and the founder's six questions, not against 'is it premium'. Be exact about where the pixels still read as an editorial web prototype and where they do not. The architecture, flows, fixtures and truth rules are approved and must not be questioned; presentation is the whole subject. Fixes are ordered and specific: where, what, why. 'ready' means the founder can be shown this; 'fix' means specific changes; 'recompose' means the composition itself is wrong.`,
    NO_SLOP,
    "=== YOUR RECOMPOSITION DIRECTION ===", direction, "=== END ===",
    "=== THE RECOMPOSITION BRIEF ===", m.brief, "=== END ===",
    `=== THE SIX QUESTIONS ===\n${SIX_QUESTIONS.map((q, n) => `${n + 1}. ${q}`).join("\n")}\n=== END ===`,
  ].join("\n\n");
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions, content, schema: RECOMPOSE_REVIEW_SCHEMA, maxOutputTokens: 30000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [], markdown: "" };
  await mkdir(REVIEWS_DIR, { recursive: true });
  res.data = noDashes(res.data);
  const base = path.join(REVIEWS_DIR, `${i.key}-pass${i.pass}`);
  const md = reviewMarkdown(def.name, i, res.data);
  await writeFile(`${base}.json`, JSON.stringify({ experience: def.name, pass: i.pass, final: Boolean(i.final), shots: i.shots.map((s) => path.basename(s)), when: new Date().toISOString(), reviewer: "director", review: res.data }, null, 2));
  await writeFile(`${base}.md`, md);
  return { data: res.data, usage: [res.usage], files: [`${base}.json`, `${base}.md`], markdown: md };
}

export async function runV3XCompare(i: { before: string[]; after: string[]; notes?: string | null }, o: V2Options = {}): Promise<{ data: Record<string, unknown> | null; usage: Usage[]; files: string[]; markdown: string }> {
  const say = o.onProgress ?? (() => {});
  const r = route("screen_review_final", o.effort);
  const [direction, m] = await Promise.all([recomposeText(), material()]);
  const content: InputPart[] = [textPart([
    "Two sets of real captures follow. First the CURRENT V3 (the package the founder reviewed), then the RECOMPOSITION. Each set covers the hero, Recreate, Drive and the Business to Loyalty sequence at phone and desktop, with recording strips (left to right in time).",
    `Current V3: ${i.before.map((s) => path.basename(s)).join("; ")}.`, `Recomposition: ${i.after.map((s) => path.basename(s)).join("; ")}.`,
    i.notes ? `Notes from the engineer: ${i.notes}` : "", "Answer with the JSON only.",
  ].filter(Boolean).join("\n"))];
  for (const s of i.before) await pushImage(content, s, `CURRENT V3 ${path.basename(s)}:`, "low");
  for (const s of i.after) await pushImage(content, s, `RECOMPOSITION ${path.basename(s)}:`);
  say(`Compare the current V3 with the recomposition (${r.effort})`);
  const instructions = [
    WHO,
    "This job is the V3 RECOMPOSITION COMPARISON for the founder. Compare the current V3 against the recomposition on the founder's six questions, experience by experience and then for the homepage as a whole. Be honest and specific: name what the recomposition achieves, what it still misses and where it could still be any startup's site. The architecture and truth rules are the same in both; presentation is the subject. Your verdict tells the founder whether this direction is worth approving for the rest of V3, whether to continue fixing, or whether to recompose again.",
    NO_SLOP,
    "=== YOUR RECOMPOSITION DIRECTION ===", direction, "=== END ===",
    "=== THE RECOMPOSITION BRIEF ===", m.brief, "=== END ===",
    `=== THE SIX QUESTIONS ===\n${SIX_QUESTIONS.map((q, n) => `${n + 1}. ${q}`).join("\n")}\n=== END ===`,
  ].join("\n\n");
  const res = await respond<Record<string, unknown>>({ model: r.model, effort: r.effort, instructions, content, schema: COMPARE_SCHEMA, maxOutputTokens: 30000, dryRun: o.dryRun, onProgress: o.onProgress });
  if (o.dryRun) return { data: null, usage: [res.usage], files: [], markdown: "" };
  await mkdir(REVIEWS_DIR, { recursive: true });
  res.data = noDashes(res.data);
  const base = path.join(REVIEWS_DIR, "compare");
  const md = compareMarkdown(res.data, i);
  await writeFile(`${base}.json`, JSON.stringify({ before: i.before.map((s) => path.basename(s)), after: i.after.map((s) => path.basename(s)), when: new Date().toISOString(), reviewer: "director", comparison: res.data }, null, 2));
  await writeFile(`${base}.md`, md);
  return { data: res.data, usage: [res.usage], files: [`${base}.json`, `${base}.md`], markdown: md };
}

// ------------------------------------------------------------ markdown

const str = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v));
const section = (title: string, v: unknown): string[] => {
  if (v == null) return [];
  if (Array.isArray(v)) return [`## ${title}`, "", ...(v.length && typeof v[0] === "object" ? (v as Record<string, unknown>[]).flatMap((x) => [`- ${Object.entries(x).map(([k, y]) => `**${k.replace(/_/g, " ")}:** ${str(y)}`).join(" ")}`]) : bullets(v)), ""];
  if (typeof v === "object") return [`## ${title}`, "", ...Object.entries(v as Record<string, unknown>).flatMap(([k, x]) => Array.isArray(x) ? [`**${k.replace(/_/g, " ")}.**`, ...(x.length && typeof x[0] === "object" ? (x as Record<string, unknown>[]).map((y) => `- ${Object.entries(y).map(([a, b]) => `**${a.replace(/_/g, " ")}:** ${str(b)}`).join(" ")}`) : bullets(x)), ""] : typeof x === "object" && x ? [`**${k.replace(/_/g, " ")}.**`, ...Object.entries(x as Record<string, unknown>).map(([a, b]) => `- ${a.replace(/_/g, " ")}: ${str(b)}`), ""] : [`**${k.replace(/_/g, " ")}.** ${str(x)}`, ""]), ""];
  return [`## ${title}`, "", str(v), ""];
};

function directionMarkdown(d: Record<string, unknown>): string {
  return ["# TapMart V3 recomposition direction", "", "Author: Astra (design director). Written from docs/design-lab-v3/RECOMPOSE_BRIEF.md, the current V3 captures and ARTEC_LIVE_STUDY.md.", "", ...Object.entries(d).flatMap(([k, v]) => section(k.replace(/_/g, " "), v))].join("\n");
}

function reviewMarkdown(name: string, i: RecomposeReviewInput, r: Record<string, unknown>): string {
  const sc = (r.scores ?? {}) as Record<string, unknown>;
  return [
    `# V3 recomposition review: ${name}, pass ${i.pass}${i.final ? " (final)" : ""}`, "", `Reviewer: Astra. Verdict: **${str(r.verdict)}**. Captures: ${i.shots.map((s) => path.basename(s)).join(", ")}.`, "",
    `**Two second read.** ${str(r.two_second_read)}`, "",
    "## The six questions", "", ...((r.six_questions as Record<string, unknown>[]) ?? []).map((q) => `- ${str(q.question)} **${str(q.answer).toUpperCase()}**. ${str(q.note)}`), "",
    "## Scores", "", ...Object.entries(sc).map(([k, v]) => `- ${k.replace(/_/g, " ")}: ${str(v)}`), "",
    ...section("Still a web prototype", r.still_a_web_prototype), ...section("Spatial read", r.spatial_read), ...section("Material read", r.material_read), ...section("Motion read", r.motion_read), ...section("Media read", r.media_read),
    ...section("Drift", r.drift), ...section("Direction was wrong", r.direction_was_wrong),
    "## Fixes", "", ...((r.fixes as Record<string, unknown>[]) ?? []).map((f) => `- ${str(f.priority)}. **${str(f.where)}.** ${str(f.change)} Why: ${str(f.why)}`), "",
    ...section("Keep", r.keep),
  ].join("\n");
}

function compareMarkdown(c: Record<string, unknown>, i: { before: string[]; after: string[] }): string {
  const qa = (x: unknown) => ((x as Record<string, unknown>[]) ?? []).map((q) => `  - ${str(q.question)} **${str(q.answer).toUpperCase()}**. ${str(q.note)}`);
  const ex = (c.experiences as Record<string, unknown>[]) ?? [];
  const home = (c.homepage ?? {}) as Record<string, unknown>;
  return [
    "# V3 recomposition compared with the current V3", "", `Reviewer: Astra. Verdict: **${str(c.verdict)}**.`, "", `Current V3 captures: ${i.before.map((s) => path.basename(s)).join(", ")}.`, "", `Recomposition captures: ${i.after.map((s) => path.basename(s)).join(", ")}.`, "",
    ...ex.flatMap((e) => { const b = e.current_v3 as Record<string, unknown>; const a = e.recomposed as Record<string, unknown>; return [`## ${str(e.experience)}: ${str(e.verdict)}`, "", `**Current V3 (${str(b.score)}/10).** ${str(b.read)}`, ...qa(b.six_questions), "", `**Recomposition (${str(a.score)}/10).** ${str(a.read)}`, ...qa(a.six_questions), "", `**Why.** ${str(e.why)}`, "", "What still misses:", ...bullets(e.what_still_misses), ""]; }),
    "## The homepage", "", ...qa(home.six_questions), "", `**Remembered tomorrow.** ${str(home.remembered_tomorrow)}`, "", `**Belongs to TapMart only.** ${str(home.belongs_to_tapmart_only)}`, "", `**Scroll pull.** ${str(home.scroll_pull)}`, "",
    `**For the founder.** ${str(c.note_for_founder)}`, "", ...section("Risks", c.risks),
  ].join("\n");
}
