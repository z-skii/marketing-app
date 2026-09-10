import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { VehicleRecognition, VehicleRecognitionProvider } from "./types";

/**
 * Year / make / model recognition from the walk-around photos.
 *
 * Providers:
 *   anthropicVision   Claude looks at up to four photos and answers with strict
 *                     JSON. Available when ANTHROPIC_API_KEY is set. Model is
 *                     claude-opus-5 unless AI_MODEL overrides it.
 *   unavailable       always returns null, so the pipeline stores "no
 *                     recognition" instead of a guess.
 *
 * Anything that goes wrong (network, refusal, malformed JSON) returns null.
 * Confidence below 0.6 is the UI's cue to ask rather than assert.
 */

const DEFAULT_MODEL = "claude-opus-5";
const MAX_IMAGES = 4;
const REQUEST_TIMEOUT_MS = 45_000;

const RecognitionJson = z.object({
  year_min: z.number().int().min(1960).max(2035).nullable().catch(null),
  year_max: z.number().int().min(1960).max(2035).nullable().catch(null),
  make: z.string().trim().min(1).max(40).nullable().catch(null),
  model: z.string().trim().min(1).max(40).nullable().catch(null),
  body_type: z.string().trim().min(1).max(30).nullable().catch(null),
  color: z.string().trim().min(1).max(30).nullable().catch(null),
  trim: z.string().trim().min(1).max(40).nullable().catch(null),
  confidence: z.number().min(0).max(1).catch(0),
});

const SYSTEM = [
  "You identify passenger vehicles from photos for a car advertising marketplace.",
  "Look at the photos of one vehicle and answer with a single JSON object and nothing else:",
  '{"year_min": number|null, "year_max": number|null, "make": string|null, "model": string|null,',
  ' "body_type": string|null, "color": string|null, "trim": string|null, "confidence": number}',
  "Rules: year_min and year_max bound the model generation you can see (equal when sure).",
  "body_type is one of Sedan, SUV, Truck, Coupe, Hatchback, Van, Wagon, Convertible.",
  "Use null for anything you cannot tell. confidence is 0 to 1 for the make and model together.",
  "Never guess a make or model you cannot see evidence for; prefer null with low confidence.",
].join("\n");

/** Only http(s) URLs can be fetched by the API; local dev paths are skipped. */
function fetchableUrls(urls: string[]): string[] {
  return urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u)).slice(0, MAX_IMAGES);
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

export const anthropicVision: VehicleRecognitionProvider = {
  id: "anthropic_vision",
  available() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },
  async recognize(imageUrls) {
    if (!this.available()) return null;
    const urls = fetchableUrls(imageUrls);
    if (urls.length === 0) return null;
    const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
    try {
      const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 1,
      });
      const content: Anthropic.ContentBlockParam[] = [
        ...urls.map((url): Anthropic.ImageBlockParam => ({ type: "image", source: { type: "url", url } })),
        { type: "text", text: "Identify this vehicle. Reply with the JSON object only." },
      ];
      const response = await client.messages.create({
        model,
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        system: SYSTEM,
        messages: [{ role: "user", content }],
      });
      if (response.stop_reason === "refusal") return null;
      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const parsed = RecognitionJson.safeParse(extractJson(text));
      if (!parsed.success) return null;
      const r = parsed.data;
      const yearMin = r.year_min ?? r.year_max;
      const yearMax = r.year_max ?? r.year_min;
      return {
        year_min: yearMin !== null && yearMax !== null ? Math.min(yearMin, yearMax) : yearMin,
        year_max: yearMin !== null && yearMax !== null ? Math.max(yearMin, yearMax) : yearMax,
        make: r.make,
        model: r.model,
        body_type: r.body_type,
        color: r.color,
        trim: r.trim,
        confidence: Math.max(0, Math.min(1, r.confidence)),
        provider: `${this.id}:${model}`,
        checked_at: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  },
};

export const unavailable: VehicleRecognitionProvider = {
  id: "unavailable",
  available() {
    return false;
  },
  async recognize() {
    return null;
  },
};

export function recognitionProvider(): VehicleRecognitionProvider {
  return anthropicVision.available() ? anthropicVision : unavailable;
}

export async function recognizeVehicle(imageUrls: string[]): Promise<VehicleRecognition | null> {
  const provider = recognitionProvider();
  if (!provider.available()) return null;
  return provider.recognize(imageUrls);
}

export function recognitionProviderStatus(): { id: string; available: boolean; message: string } {
  const provider = recognitionProvider();
  return {
    id: provider.id,
    available: provider.available(),
    message: provider.available()
      ? `Recognition runs on Claude (${process.env.AI_MODEL?.trim() || DEFAULT_MODEL}).`
      : "No recognition provider configured. Set ANTHROPIC_API_KEY to identify cars from photos.",
  };
}
