import { readFile } from "node:fs/promises";
import path from "node:path";
import { supportsReasoning, type Effort } from "./models";

/**
 * The thin HTTP client under every OpenAI call TapMart makes. Two endpoints:
 * the Responses API (director work, always background mode with polling so
 * long reasoning survives proxies) and the Images API (generation and edits).
 *
 * Authentication: OPENAI_API_KEY when present. In a Claude Code cloud session
 * the agent proxy attaches the credential and no key is needed; Node's fetch
 * only honours HTTPS_PROXY with NODE_USE_ENV_PROXY=1, which the npm scripts
 * set. The key is never logged.
 *
 * Every call returns its usage so a creative job can record what it cost.
 */

const API = process.env.OPENAI_BASE_URL?.replace(/\/$/, "") || "https://api.openai.com/v1";
const POLL_MS = 3000;
const MAX_WAIT_MS = 12 * 60_000;

export type Usage = { model: string; input_tokens?: number; output_tokens?: number; total_tokens?: number; reasoning_tokens?: number; images?: number };

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.HTTPS_PROXY);
}

function headers(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["content-type"] = "application/json";
  const key = process.env.OPENAI_API_KEY?.trim();
  if (key) h.authorization = `Bearer ${key}`;
  return h;
}

export class OpenAiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code: string | null = null) {
    super(message);
  }
}

async function fail(res: Response, what: string): Promise<never> {
  const text = await res.text();
  let code: string | null = null;
  let message = text.slice(0, 600);
  try {
    const j = JSON.parse(text);
    code = j.error?.code ?? null;
    message = j.error?.message ?? message;
  } catch {}
  throw new OpenAiError(`${what}: ${res.status} ${message}`, res.status, code);
}

// ------------------------------------------------------------ Responses API

export type InputPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "high" | "low" | "auto" };

export type JsonSchema = { name: string; schema: Record<string, unknown> };

export type RespondOptions = {
  model: string;
  effort: Effort;
  instructions: string;
  content: InputPart[];
  schema: JsonSchema;
  maxOutputTokens?: number;
  /** Build the request and return it without sending; for tests and dry runs. */
  dryRun?: boolean;
  onProgress?: (status: string) => void;
};

export type RespondResult<T> = { data: T; usage: Usage; responseId: string | null; request?: Record<string, unknown> };

/** Ask the model for a strict JSON answer. Background mode, polled. */
export async function respond<T>(o: RespondOptions): Promise<RespondResult<T>> {
  const body: Record<string, unknown> = {
    model: o.model,
    background: true,
    store: true,
    instructions: o.instructions,
    input: [{ role: "user", content: o.content }],
    text: { format: { type: "json_schema", name: o.schema.name, schema: o.schema.schema, strict: true } },
    max_output_tokens: o.maxOutputTokens ?? 20000,
  };
  if (supportsReasoning(o.model)) body.reasoning = { effort: o.effort };
  else body.temperature = 0.2;
  if (o.dryRun) return { data: null as T, usage: { model: o.model }, responseId: null, request: body };

  const started = Date.now();
  const submit = await fetch(`${API}/responses`, { method: "POST", headers: headers(), body: JSON.stringify(body), signal: AbortSignal.timeout(120_000) });
  if (!submit.ok) await fail(submit, "OpenAI responses");
  let data = await submit.json();
  const id: string = data.id;
  while (["queued", "in_progress"].includes(data.status)) {
    if (Date.now() - started > MAX_WAIT_MS) throw new OpenAiError(`Response ${id} still ${data.status} after ${MAX_WAIT_MS / 60000} minutes.`, 0);
    await new Promise((r) => setTimeout(r, POLL_MS));
    const poll = await fetch(`${API}/responses/${id}`, { headers: headers(false), signal: AbortSignal.timeout(60_000) });
    if (!poll.ok) await fail(poll, `Polling ${id}`);
    data = await poll.json();
    o.onProgress?.(data.status);
  }
  if (data.status !== "completed") {
    const err = data.error ?? data.incomplete_details ?? {};
    throw new OpenAiError(`Response ${id} ended as ${data.status}: ${JSON.stringify(err).slice(0, 400)}`, 0, err.code ?? null);
  }
  const message = (data.output ?? []).find((x: { type: string }) => x.type === "message");
  const part = message?.content?.find((c: { type: string }) => c.type === "output_text");
  if (!part?.text) throw new OpenAiError("No text in the answer.", 0);
  const usage: Usage = {
    model: o.model,
    input_tokens: data.usage?.input_tokens,
    output_tokens: data.usage?.output_tokens,
    total_tokens: data.usage?.total_tokens,
    reasoning_tokens: data.usage?.output_tokens_details?.reasoning_tokens,
  };
  return { data: JSON.parse(part.text) as T, usage, responseId: id };
}

// --------------------------------------------------------------- Images API

export type ImageBytes = { bytes: Buffer; contentType: "image/png" | "image/jpeg" | "image/webp" };

export type GenerateOptions = {
  model: string;
  prompt: string;
  size: string;
  quality?: "low" | "medium" | "high" | "auto";
  format?: "png" | "jpeg" | "webp";
  n?: number;
  dryRun?: boolean;
};

export type ImageResult = { images: ImageBytes[]; usage: Usage; request?: Record<string, unknown> };

export async function imagesGenerate(o: GenerateOptions): Promise<ImageResult> {
  const format = o.format ?? "png";
  const body = { model: o.model, prompt: o.prompt, n: o.n ?? 1, size: o.size, quality: o.quality ?? "auto", output_format: format, moderation: "auto" };
  if (o.dryRun) return { images: [], usage: { model: o.model }, request: body };
  const res = await fetch(`${API}/images/generations`, { method: "POST", headers: headers(), body: JSON.stringify(body), signal: AbortSignal.timeout(10 * 60_000) });
  if (!res.ok) await fail(res, "OpenAI images");
  return decodeImages(await res.json(), o.model, format);
}

export type EditOptions = {
  model: string;
  prompt: string;
  /** The image(s) to edit or use as references; the first is the one being edited. */
  images: ImageBytes[];
  /** Optional PNG mask: transparent where the edit may happen. */
  mask?: ImageBytes | null;
  size: string;
  quality?: "low" | "medium" | "high" | "auto";
  format?: "png" | "jpeg" | "webp";
  /** Keep faces, logos and product details from the input as they are. */
  preserveInput?: boolean;
  dryRun?: boolean;
};

export async function imagesEdit(o: EditOptions): Promise<ImageResult> {
  const format = o.format ?? "png";
  const form = new FormData();
  form.set("model", o.model);
  form.set("prompt", o.prompt);
  form.set("size", o.size);
  form.set("quality", o.quality ?? "auto");
  form.set("output_format", format);
  if (o.preserveInput !== false) form.set("input_fidelity", "high");
  o.images.forEach((img, i) => form.append("image[]", new Blob([new Uint8Array(img.bytes)], { type: img.contentType }), `image-${i}.${ext(img.contentType)}`));
  if (o.mask) form.set("mask", new Blob([new Uint8Array(o.mask.bytes)], { type: "image/png" }), "mask.png");
  if (o.dryRun) {
    return { images: [], usage: { model: o.model }, request: { model: o.model, prompt: o.prompt, size: o.size, images: o.images.length, mask: Boolean(o.mask) } };
  }
  const res = await fetch(`${API}/images/edits`, { method: "POST", headers: headers(false), body: form, signal: AbortSignal.timeout(10 * 60_000) });
  if (!res.ok) await fail(res, "OpenAI image edit");
  return decodeImages(await res.json(), o.model, format);
}

function decodeImages(json: { data?: { b64_json?: string }[]; usage?: Record<string, number> }, model: string, format: "png" | "jpeg" | "webp"): ImageResult {
  const contentType = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
  const images: ImageBytes[] = (json.data ?? []).filter((d) => d.b64_json).map((d) => ({ bytes: Buffer.from(d.b64_json!, "base64"), contentType }));
  if (images.length === 0) throw new OpenAiError("The image API returned no image.", 0);
  return {
    images,
    usage: { model, input_tokens: json.usage?.input_tokens, output_tokens: json.usage?.output_tokens, total_tokens: json.usage?.total_tokens, images: images.length },
  };
}

function ext(contentType: string): string {
  return contentType === "image/png" ? "png" : contentType === "image/jpeg" ? "jpg" : "webp";
}

// ------------------------------------------------------------------ helpers

const MIME: Record<string, ImageBytes["contentType"]> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };

/** Read an image the director should see: a local file, an app-relative /uploads path, or an https URL. */
export async function loadImage(source: string): Promise<ImageBytes | null> {
  if (/^https?:\/\//i.test(source)) {
    const res = await fetch(source, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const type = (res.headers.get("content-type") ?? "").split(";")[0];
    const contentType = (Object.values(MIME) as string[]).includes(type) ? (type as ImageBytes["contentType"]) : null;
    if (!contentType) return null;
    return { bytes: Buffer.from(await res.arrayBuffer()), contentType };
  }
  const clean = source.split(/[?#]/)[0];
  const file = clean.startsWith("/") && !clean.startsWith(process.cwd()) && !clean.startsWith("/home") && !clean.startsWith("/tmp")
    ? path.join(process.cwd(), "public", clean)
    : path.resolve(clean);
  const contentType = MIME[path.extname(file).slice(1).toLowerCase()];
  if (!contentType) return null;
  try {
    return { bytes: await readFile(file), contentType };
  } catch {
    return null;
  }
}

export function toDataUrl(img: ImageBytes): string {
  return `data:${img.contentType};base64,${img.bytes.toString("base64")}`;
}

export function imagePart(img: ImageBytes, detail: "high" | "low" = "high"): InputPart {
  return { type: "input_image", image_url: toDataUrl(img), detail };
}

export function textPart(text: string): InputPart {
  return { type: "input_text", text };
}

/** Width and height of a PNG or JPEG, when readable. */
export function imageSize(img: ImageBytes): { width: number; height: number } | null {
  const b = img.bytes;
  if (b.length > 24 && b.toString("ascii", 1, 4) === "PNG") return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xc3) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}
