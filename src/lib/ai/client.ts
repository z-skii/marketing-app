import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

/**
 * One Anthropic client for the Recreate loop. Every caller gates on
 * `isAiConfigured()` first: without ANTHROPIC_API_KEY nothing here is used
 * and the generators fall back to deterministic templates labelled as such.
 */

const DEFAULT_MODEL = "claude-opus-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/** Model id, overridable per environment (AI_MODEL). */
export function aiModel(): string {
  return process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
}

let client: Anthropic | null = null;

/** Lazy singleton. Throws when no key is configured; check `isAiConfigured()` first. */
export function getAnthropic(): Anthropic {
  if (!isAiConfigured()) throw new Error("ANTHROPIC_API_KEY is not configured.");
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!.trim() });
  return client;
}

/** Shared request settings so every call in the loop behaves the same. */
export const AI_REQUEST = {
  thinking: { type: "adaptive" } as const,
  output_config: { effort: "medium" } as const,
};

/** First text block of a response, or an empty string. */
export function responseText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Pull the first JSON object out of free text; null when there is none. */
export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

type ImageMedia = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const IMAGE_EXT: Record<string, ImageMedia> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
};

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
  return ext in IMAGE_EXT;
}

export function isVideoMediaUrl(url: string | null | undefined): boolean {
  return Boolean(url && /\.(mp4|webm|mov|m4v)($|\?)/i.test(url));
}

/**
 * Build an image block for a reference. Handles data URLs (base64), public
 * https URLs (sent as url sources) and app-relative paths such as
 * /uploads/seed/x.webp (read from public/ and sent inline, because the
 * model cannot reach localhost). Returns null when the URL is not an image
 * or cannot be read.
 */
export async function imageBlockFor(url: string): Promise<Anthropic.ImageBlockParam | null> {
  if (!isImageUrl(url)) return null;

  if (url.startsWith("data:")) {
    const match = url.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,([\s\S]+)$/);
    if (!match) return null;
    return { type: "image", source: { type: "base64", media_type: match[1] as ImageMedia, data: match[2] } };
  }

  if (/^https?:\/\//i.test(url)) {
    return { type: "image", source: { type: "url", url } };
  }

  if (url.startsWith("/")) {
    const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
    const mediaType = IMAGE_EXT[ext];
    if (!mediaType) return null;
    const publicDir = path.join(process.cwd(), "public");
    const file = path.normalize(path.join(publicDir, url.split(/[?#]/)[0]));
    if (!file.startsWith(publicDir)) return null;
    try {
      const data = await readFile(file);
      return { type: "image", source: { type: "base64", media_type: mediaType, data: data.toString("base64") } };
    } catch {
      return null;
    }
  }
  return null;
}
