/**
 * TapMart creative CLI: the one command line into the OpenAI creative layer
 * (src/lib/openai). Design director work, screen reviews, and creative
 * generation all run through here, so there are no per-feature scripts.
 *
 *   npm run creative -- models
 *   npm run creative -- design-system [--effort xhigh]
 *   npm run creative -- design-screen "Business Content" --purpose "..." --data "..." --actions "..." [--phone png] [--desktop png] [--media url]
 *   npm run creative -- review-screen shot.png "Business Content (phone), pass 1" ["instructions"] [--final] [--minor] [--spec slug]
 *   npm run creative -- story-concepts --business demo-coffee-co --objective "..." [--offer "..."] [--product "..."] [--audience "..."] [--count 3] [--source url] [--out dir] [--no-save]
 *   npm run creative -- story-final --business demo-coffee-co --brief concept.json [--out dir] [--no-save]
 *   npm run creative -- photo-creative --business slug --photo url --objective "..." [--type STORY_AD|SOCIAL_POST|CAMPAIGN_COVER] [--aspect 9:16]
 *   npm run creative -- car-preview --business slug --car-photo url --car "2017 BMW 328i" --goal "..." --zone "Rear window" --zone "Doors"
 *   npm run creative -- recreate-cover --business slug --title "..." --summary "..." [--frame url]
 *   npm run creative -- brand-asset --business slug --ask "..."
 *   npm run creative -- reboot [--skip-mockups] [--mockups 5] [--effort xhigh] [--out docs/reboot]
 *       The design reboot: Astra designs TapMart from a blank canvas (sees only
 *       docs/reboot/TAPMART_FUNCTIONAL_INVENTORY.md), writes the master package
 *       to docs/reboot, renders and reviews concept images. Touches no app code.
 *
 * Every command accepts --dry-run (build the request, send nothing) and
 * --effort. Nothing here publishes: creatives are saved as drafts (or, with
 * --no-save, only written to --out).
 *
 * Runs with tsx; scripts/tsconfig.cli.json maps "server-only" to a no-op so
 * the same library code the app uses runs from the terminal.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ path: ".env", quiet: true });

import { readFile } from "node:fs/promises";
import path from "node:path";
import { sqlOne } from "@/lib/db";
import { getBrandKit } from "@/lib/business/brand";
import {
  brandAsset, carAdPreview, designScreen, designSystem, finalizeStoryAd, photoCreative, recreateCover, reviewScreen, routingTable, storyAdConcepts,
  creativeMarkdown, totalUsage, MODELS, isOpenAiConfigured, OpenAiError,
  type BusinessBrandInput, type CreativeBrief, type CreativeJobResult, type Effort, type Aspect, type SourceImage,
} from "@/lib/openai";
import { runReboot } from "@/lib/openai/reboot";

type Flags = Record<string, string | string[] | boolean>;

function parse(argv: string[]): { cmd: string; pos: string[]; flags: Flags } {
  const [cmd = "help", ...rest] = argv;
  const pos: string[] = [];
  const flags: Flags = {};
  const multi = new Set(["source", "media", "zone", "frame"]);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith("--")) { pos.push(a); continue; }
    const key = a.slice(2);
    const next = rest[i + 1];
    const value = next !== undefined && !next.startsWith("--") ? rest[++i] : true;
    if (multi.has(key)) {
      const arr = (flags[key] as string[] | undefined) ?? [];
      if (typeof value === "string") arr.push(value);
      flags[key] = arr;
    } else flags[key] = value;
  }
  return { cmd, pos, flags };
}

const str = (f: Flags, k: string, d = ""): string => (typeof f[k] === "string" ? (f[k] as string) : d);
const list = (f: Flags, k: string): string[] => (Array.isArray(f[k]) ? (f[k] as string[]) : []);
const on = (f: Flags, k: string): boolean => f[k] === true;
const log = (m: string) => process.stderr.write(`${m}\n`);

async function business(slugOrId: string): Promise<{ id: string; brand: BusinessBrandInput }> {
  const row = await sqlOne<{ id: string; name: string; category: string | null; city: string | null; description: string | null; website: string | null; logo_url: string | null; socials: Record<string, string> }>(
    `select id, name, category, city, description, website, logo_url, socials from businesses where slug = $1 or id::text = $1`, [slugOrId],
  );
  if (!row) throw new Error(`No business with slug or id "${slugOrId}".`);
  const kit = await getBrandKit(row.id).catch(() => null);
  const k = kit?.kit;
  return {
    id: row.id,
    brand: {
      name: row.name, category: row.category, city: row.city, description: row.description, website: row.website, instagram: row.socials?.instagram ?? null,
      logoUrl: k?.logo_url ?? row.logo_url, colors: k?.palette ?? [], typography: k?.type ?? null, tone: k?.tone ?? null, photoStyle: k?.photo_style ?? null, guidelines: k?.guidelines ?? [],
    },
  };
}

function sources(f: Flags, logo: string | null | undefined): SourceImage[] {
  const out: SourceImage[] = list(f, "source").map((url) => ({ url, role: /logo/i.test(url) ? "logo" : "photo" }));
  if (logo && !out.some((s) => s.role === "logo")) out.unshift({ url: logo, role: "logo" });
  return out;
}

function report(r: CreativeJobResult, input: Parameters<typeof creativeMarkdown>[0]) {
  process.stdout.write(creativeMarkdown(input, r));
  if (r.asset) log(`Saved as draft asset ${r.asset.id} at ${r.asset.url}`);
  if (r.files?.length) log(`Files: ${r.files.join(", ")}`);
}

async function main() {
  const { cmd, pos, flags } = parse(process.argv.slice(2));
  const effort = (str(flags, "effort") || undefined) as Effort | undefined;
  const dryRun = on(flags, "dry-run");
  const common = { effort, dryRun, onProgress: log };
  if (!isOpenAiConfigured() && !dryRun && cmd !== "models" && cmd !== "help") log("No OPENAI_API_KEY and no HTTPS_PROXY: the request will be rejected unless a proxy adds the credential.");

  switch (cmd) {
    case "models": {
      process.stdout.write(`Roles\n  director     ${MODELS.director}\n  image_final  ${MODELS.image_final}\n  image_fast   ${MODELS.image_fast}\n  qa           ${MODELS.qa}\n\nJobs\n`);
      for (const r of routingTable()) process.stdout.write(`  ${r.job.padEnd(22)} ${r.model.padEnd(24)} ${r.effort}\n`);
      return;
    }
    case "design-system": {
      const r = await designSystem(common);
      log(dryRun ? `Dry run: ${JSON.stringify(r.request).length} bytes, nothing sent.` : `Saved docs/design-specs/system.{json,md}. Usage ${JSON.stringify(r.usage)}`);
      return;
    }
    case "design-screen": {
      const [screenName] = pos;
      if (!screenName || !str(flags, "purpose")) throw new Error('design-screen needs "<Screen name>" --purpose --data --actions');
      const r = await designScreen({
        screenName, purpose: str(flags, "purpose"), data: str(flags, "data"), actions: str(flags, "actions"), requirements: str(flags, "requirements") || null,
        phoneScreenshot: str(flags, "phone") || null, desktopScreenshot: str(flags, "desktop") || null, mediaUrls: list(flags, "media"),
      }, common);
      log(dryRun ? `Dry run: model ${MODELS.director}, ${JSON.stringify(r.request).length} bytes, nothing sent.` : `Saved docs/design-specs/${screenName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.{json,md}. Usage ${JSON.stringify(r.usage)}`);
      return;
    }
    case "review-screen": {
      const [screenshot, screenName, ...rest] = pos;
      if (!screenshot || !screenName) throw new Error('review-screen needs <screenshot.png> "<Screen name>" [instructions]');
      const r = await reviewScreen({ screenName, screenshot, instructions: rest.join(" ") || null, spec: str(flags, "spec") || null, final: on(flags, "final"), minor: on(flags, "minor"), outDir: str(flags, "out") || null }, common);
      if (dryRun) { log(`Dry run: ${JSON.stringify(r.request).length} bytes, nothing sent.`); return; }
      process.stdout.write(r.markdown);
      log(`Usage ${JSON.stringify(r.usage)}`);
      return;
    }
    case "story-concepts": {
      const b = await business(str(flags, "business"));
      const out = str(flags, "out") || null;
      const r = await storyAdConcepts({
        business: b.brand, objective: str(flags, "objective", "Bring new local customers in this week."), offer: str(flags, "offer") || null, product: str(flags, "product") || null,
        audience: str(flags, "audience") || null, sourceImages: sources(flags, b.brand.logoUrl),
      }, { ...common, count: Number(str(flags, "count", "3")), save: !on(flags, "no-save"), businessId: b.id, outDir: out, maxFixRounds: flags["fix-rounds"] ? Number(flags["fix-rounds"]) : undefined });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      process.stdout.write(`# Story concepts for ${b.brand.name}\n\n**Brand read.** ${r.brandRead}\n\n**Audience.** ${r.audienceRead}\n\n`);
      r.concepts.forEach((c, i) => {
        process.stdout.write(`\n---\n\n## Concept ${i + 1}\n\n`);
        report(c, { type: "STORY_AD", business: b.brand, objective: "", placement: "" });
      });
      log(`Total usage ${JSON.stringify(totalUsage(r.usage))}`);
      return;
    }
    case "story-final": {
      const b = await business(str(flags, "business"));
      const file = str(flags, "brief");
      if (!file) throw new Error("story-final needs --brief <concept.json> (a file written by story-concepts, or a brief object)");
      const parsed = JSON.parse(await readFile(path.resolve(file), "utf8"));
      const brief: CreativeBrief = parsed.brief ?? parsed;
      const r = await finalizeStoryAd({ business: b.brand, objective: str(flags, "objective", parsed.objective ?? "Bring new local customers in."), brief, brandRead: parsed.brandRead, audienceRead: parsed.audienceRead, sourceImages: sources(flags, b.brand.logoUrl) },
        { ...common, save: !on(flags, "no-save"), businessId: b.id, outDir: str(flags, "out") || null });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      report(r, { type: "STORY_AD", business: b.brand, objective: "", placement: "" });
      return;
    }
    case "photo-creative": {
      const b = await business(str(flags, "business"));
      const type = (str(flags, "type", "SOCIAL_POST") as "STORY_AD" | "SOCIAL_POST" | "CAMPAIGN_COVER");
      const r = await photoCreative({ business: b.brand, type, photoUrl: str(flags, "photo"), objective: str(flags, "objective"), placement: str(flags, "placement", type === "STORY_AD" ? "Instagram Story 9:16" : "Instagram feed post"), aspect: (str(flags, "aspect", type === "STORY_AD" ? "9:16" : "4:5") as Aspect) },
        { ...common, tier: on(flags, "final") ? "final" : "fast", save: !on(flags, "no-save"), businessId: b.id, outDir: str(flags, "out") || null });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      report(r, { type, business: b.brand, objective: "", placement: "" });
      return;
    }
    case "car-preview": {
      const b = await business(str(flags, "business"));
      const r = await carAdPreview({ business: b.brand, goal: str(flags, "goal", "Local awareness"), car: { label: str(flags, "car", "the driver's car"), photoUrl: str(flags, "car-photo") }, zones: list(flags, "zone").length ? list(flags, "zone") : ["Rear window"] },
        { ...common, tier: on(flags, "final") ? "final" : "fast", save: !on(flags, "no-save"), businessId: b.id, outDir: str(flags, "out") || null });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      report(r, { type: "CAR_AD_PREVIEW", business: b.brand, objective: "", placement: "" });
      return;
    }
    case "recreate-cover": {
      const b = await business(str(flags, "business"));
      const r = await recreateCover({ business: b.brand, reelTitle: str(flags, "title"), reelSummary: str(flags, "summary"), referenceFrames: list(flags, "frame") },
        { ...common, tier: on(flags, "final") ? "final" : "fast", save: !on(flags, "no-save"), businessId: b.id, outDir: str(flags, "out") || null });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      report(r, { type: "RECREATE_COVER", business: b.brand, objective: "", placement: "" });
      return;
    }
    case "brand-asset": {
      const b = await business(str(flags, "business"));
      const r = await brandAsset({ business: b.brand, ask: str(flags, "ask", "A brand mood image that refines the existing identity."), sourceImages: sources(flags, b.brand.logoUrl) },
        { ...common, tier: on(flags, "final") ? "final" : "fast", save: !on(flags, "no-save"), businessId: b.id, outDir: str(flags, "out") || null });
      if (dryRun) { log("Dry run: nothing sent."); return; }
      report(r, { type: "BRAND_ASSET", business: b.brand, objective: "", placement: "" });
      return;
    }
    case "reboot": {
      const r = await runReboot({ effort, dryRun, skipMockups: on(flags, "skip-mockups"), mockupCount: flags.mockups ? Number(flags.mockups) : undefined, outDir: str(flags, "out") || undefined, onProgress: log });
      if (dryRun) { log("Dry run: Part A request built from the functional inventory only; nothing sent."); return; }
      log(`Wrote ${r.files.length} files. Usage ${JSON.stringify(totalUsage(r.usage))}`);
      process.stdout.write(`${r.files[0]}\n`);
      return;
    }
    default:
      process.stdout.write((await readFile(new URL(import.meta.url), "utf8")).split("*/")[0].replace(/^\/\*\*\n/, "").replace(/^ \* ?/gm, ""));
  }
}

main().then(() => process.exit(0)).catch((e: unknown) => {
  if (e instanceof OpenAiError) log(`OpenAI: ${e.message}${e.code ? ` (${e.code})` : ""}`);
  else log(e instanceof Error ? e.message : String(e));
  process.exit(2);
});
