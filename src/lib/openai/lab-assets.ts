import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { runCreativeJob, type CreativeJobResult } from "./creative";
import type { CreativeBrief, CreativeInput, CreativeAssetType } from "./director";
import type { Usage } from "./client";
import { VISUAL_DIR } from "./reboot-visual";

/**
 * The supporting imagery for the Design Lab: photography, Story creatives,
 * cars, portraits and backgrounds that Astra briefed in lab-screens.json.
 * Each is rendered once by the final image model, reviewed by Astra with
 * one fix round, and saved under public/design-lab/<id>.jpg for the
 * prototypes. Clearly fictional mock imagery; never product data.
 */

export const LAB_PUBLIC_DIR = path.join(process.cwd(), "public", "design-lab");
const RECORD_DIR = path.join(VISUAL_DIR, "assets");

type AssetBrief = { id: string; purpose: string; used_by: string[]; kind: string; aspect_ratio: CreativeBrief["aspect_ratio"]; prompt: string; avoid: string[] };

export async function renderLabAssets(o: { only?: string[]; onProgress?: (m: string) => void; dryRun?: boolean } = {}): Promise<{ rendered: string[]; skipped: string[]; failed: string[]; usage: Usage[] }> {
  const say = o.onProgress ?? (() => {});
  const screens = JSON.parse(await readFile(path.join(VISUAL_DIR, "lab-screens.json"), "utf8"));
  const directions = JSON.parse(await readFile(path.join(VISUAL_DIR, "visual-directions.json"), "utf8"));
  const treatment = String(directions.visual_system?.imagery_treatment ?? "");
  const assets = ((screens.assets as AssetBrief[]) ?? []).filter((a) => !o.only?.length || o.only.includes(a.id));
  await mkdir(LAB_PUBLIC_DIR, { recursive: true });
  await mkdir(RECORD_DIR, { recursive: true });
  const rendered: string[] = []; const skipped: string[] = []; const failed: string[] = []; const usage: Usage[] = [];
  for (const a of assets) {
    const file = path.join(LAB_PUBLIC_DIR, `${a.id}.jpg`);
    if (existsSync(file)) { skipped.push(a.id); continue; }
    say(`Asset ${a.id} (${a.kind}, ${a.aspect_ratio}) for ${a.used_by.join(", ")}`);
    if (o.dryRun) continue;
    const type: CreativeAssetType = a.kind === "story_creative" ? "STORY_AD" : "CONCEPT_ART";
    const input: CreativeInput = {
      type, business: { name: "TapMart Design Lab", category: "mock imagery", description: a.purpose, tone: treatment },
      objective: a.purpose, placement: `Design Lab prototype media, ${a.aspect_ratio}. ${treatment}`, constraints: ["No UI, no watermark, no logos of real companies", ...a.avoid], aspect: a.aspect_ratio,
    };
    const brief: CreativeBrief = { title: a.id, concept: a.purpose, subject: a.kind, environment: "", composition: "", camera: "", lighting: "", color_treatment: treatment, headline: "", cta: "", aspect_ratio: a.aspect_ratio, preserve: [], avoid: a.avoid, image_route: "final", generation_mode: "generate", prompt: a.prompt, source_image_use: "" };
    try {
      const r: CreativeJobResult = await runCreativeJob(input, { tier: "final", maxFixRounds: 1, save: false, format: "jpeg", onProgress: say }, { brief, brandRead: treatment, audienceRead: "TapMart Design Lab" });
      usage.push(...r.usage);
      await writeFile(file, r.image.bytes);
      await writeFile(path.join(RECORD_DIR, `${a.id}.json`), JSON.stringify({ id: a.id, kind: a.kind, aspect: a.aspect_ratio, prompt: a.prompt, rounds: r.rounds.map((x) => ({ round: x.round, action: x.action, imageModel: x.imageModel, quality: x.quality, review: x.review })), approvedByDirector: r.approvedByDirector }, null, 2));
      rendered.push(a.id);
    } catch (e) {
      say(`Asset ${a.id} failed: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`);
      failed.push(a.id);
    }
  }
  return { rendered, skipped, failed, usage };
}
