import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { sql, sqlOne, transaction } from "@/lib/db";
import {
  AI_REQUEST, aiModel, extractJsonObject, getAnthropic, imageBlockFor, isAiConfigured, isImageUrl, responseText,
} from "@/lib/ai/client";
import { getGoogleProfileSnapshot } from "@/lib/google/business";
import { getInstagramBusiness, type InstagramBusinessMeta } from "@/lib/social/instagram-business";
import type { InstagramMedia } from "@/lib/social/meta";
import { fetchWithTimeout } from "@/lib/oauth/state";
import { NO_SOURCES_MESSAGE } from "@/lib/business/brand-messages";

/**
 * Brand kit for a business. Two records live side by side in brand_kits:
 *
 *   kit       the approved kit. Only approveBrandKit writes it.
 *   proposed  a pending proposal, from the model (source "ai") or from a
 *             template built out of the business's own fields ("template").
 *
 * A proposal never changes what the business is using until someone
 * approves it, and approving also mirrors palette and logo into
 * businesses.brand so the rest of the product sees the same colours.
 */

export type BrandKit = {
  logo_url: string | null;
  palette: string[];
  type: { display: string | null; body: string | null };
  tone: string | null;
  photo_style: string | null;
  content_style: string | null;
  guidelines: string[];
  image_examples: string[];
};

export type BrandProposal = BrandKit & {
  /** Up to three things the kit or the brand could do better. */
  improvements: string[];
};

export type BrandSource = "ai" | "template";

export type BrandKitRecord = {
  kit: BrandKit;
  proposed: BrandProposal | null;
  proposed_source: BrandSource | null;
  status: "draft" | "approved";
  approved_at: string | null;
  updated_at: string | null;
  research: BrandResearch | null;
  existing_signals: ExistingSignals | null;
  researched_at: string | null;
};

export type ProposeBrandInput = {
  mode: "build" | "refine";
  website?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  imageUrls?: string[];
  notes?: string | null;
  /** What research found the business already using. The proposal builds on it. */
  signals?: ExistingSignals | null;
};

// ----------------------------------------------------------------- research

export type SourceStatus = "used" | "not_connected" | "missing" | "failed";

export type BrandResearch = {
  sources: {
    instagram: { status: SourceStatus; handle: string | null; media_count: number; note: string | null };
    google: { status: SourceStatus; title: string | null; note: string | null };
    website: {
      status: SourceStatus; url: string | null; title: string | null; description: string | null; og_image: string | null;
      theme_color: string | null; icon: string | null; images: string[]; colors: string[]; fonts: string[]; note: string | null;
    };
    logo: { status: SourceStatus; url: string | null; colors: string[]; note: string | null };
    photos: { status: SourceStatus; urls: string[] };
  };
  captions: string[];
  researched_at: string;
};

export type ExistingSignals = {
  /** Hex colours actually in use (site CSS, theme-color, logo). */
  colors: string[];
  /** Font families detected in the site's CSS. */
  fonts: string[];
  /** 3 to 5 words for how the business already sounds. */
  tone_words: string[];
  tone_source: "ai" | "heuristic" | null;
  photo_style: string | null;
  /** Real media the research looked at: Instagram posts, site images, uploads. */
  images: string[];
  logo_url: string | null;
  description: string | null;
  /** One line per source saying what it gave. */
  notes: string[];
};

export { NO_SOURCES_MESSAGE };

export const EMPTY_BRAND_KIT: BrandKit = {
  logo_url: null,
  palette: [],
  type: { display: null, body: null },
  tone: null,
  photo_style: null,
  content_style: null,
  guidelines: [],
  image_examples: [],
};

const HEX = /^#[0-9a-f]{6}$/i;

function str(v: unknown, max = 300): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function strList(v: unknown, max: number, each = 300): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim().slice(0, each)).slice(0, max)
    : [];
}

function hexList(v: unknown): string[] {
  return strList(v, 6, 7).map((c) => c.toUpperCase()).filter((c) => HEX.test(c));
}

/** Bring any stored or model-produced object into the exact BrandKit shape. */
export function normalizeBrandKit(raw: unknown): BrandKit {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const type = (r.type && typeof r.type === "object" ? r.type : {}) as Record<string, unknown>;
  return {
    logo_url: str(r.logo_url, 500),
    palette: hexList(r.palette),
    type: { display: str(type.display, 80), body: str(type.body, 80) },
    tone: str(r.tone, 400),
    photo_style: str(r.photo_style, 400),
    content_style: str(r.content_style, 400),
    guidelines: strList(r.guidelines, 8),
    image_examples: strList(r.image_examples, 8, 500),
  };
}

function normalizeProposal(raw: unknown): BrandProposal {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return { ...normalizeBrandKit(raw), improvements: strList(r.improvements, 3) };
}

export async function getBrandKit(businessId: string): Promise<BrandKitRecord> {
  const row = await sqlOne<{
    kit: unknown; proposed: unknown; proposed_source: BrandSource | null;
    status: "draft" | "approved"; approved_at: string | null; updated_at: string | null;
    research: BrandResearch | null; existing_signals: ExistingSignals | null; researched_at: string | null;
  }>(
    `select kit, proposed, proposed_source, status, approved_at, updated_at, research, existing_signals, researched_at
       from brand_kits where business_id = $1`,
    [businessId],
  );
  if (!row) {
    return {
      kit: EMPTY_BRAND_KIT, proposed: null, proposed_source: null, status: "draft", approved_at: null, updated_at: null,
      research: null, existing_signals: null, researched_at: null,
    };
  }
  return {
    kit: normalizeBrandKit(row.kit),
    proposed: row.proposed ? normalizeProposal(row.proposed) : null,
    proposed_source: row.proposed_source,
    status: row.status,
    approved_at: row.approved_at,
    updated_at: row.updated_at,
    research: row.research && typeof row.research === "object" ? row.research : null,
    existing_signals: row.existing_signals && typeof row.existing_signals === "object" ? row.existing_signals : null,
    researched_at: row.researched_at,
  };
}

// ------------------------------------------------------------------ business

type BusinessRow = {
  name: string; category: string | null; city: string | null; description: string | null;
  logo_url: string | null; cover_url: string | null; website: string | null;
  socials: Record<string, unknown> | null; brand: Record<string, unknown> | null;
};

async function loadBusiness(businessId: string): Promise<BusinessRow> {
  const row = await sqlOne<BusinessRow>(
    `select name, category, city, description, logo_url, cover_url, website, socials, brand
       from businesses where id = $1`,
    [businessId],
  );
  if (!row) throw new Error("Business not found.");
  return row;
}

/** Hex colours typed into the profile's "brand colours" field, if any. */
function coloursFromBrandJson(brand: Record<string, unknown> | null): string[] {
  if (!brand) return [];
  const fromPalette = hexList(brand.palette);
  if (fromPalette.length) return fromPalette;
  const text = typeof brand.colors === "string" ? brand.colors : "";
  return (text.match(/#[0-9a-f]{6}\b/gi) ?? []).map((c) => c.toUpperCase()).slice(0, 6);
}

// ------------------------------------------------------------------ template

type Playbook = { palette: string[]; display: string; body: string; tone: string; photo: string; content: string };

/** Sensible starting points by category. Labelled "template" wherever shown. */
const PLAYBOOKS: { match: RegExp; kit: Playbook }[] = [
  {
    match: /coffee|cafe|café|bakery|roast|tea/i,
    kit: {
      palette: ["#2B1D14", "#F4EDE4", "#C9A67A"],
      display: "Fraunces", body: "Inter",
      tone: "Warm and unhurried. First names, short sentences, no exclamation marks.",
      photo: "Natural window light, close on hands and cups, steam and texture over wide shots.",
      content: "Behind the counter moments, one product per post, people over decor.",
    },
  },
  {
    match: /restaurant|food|kitchen|grill|pizza|taco|sushi|bar\b|pub/i,
    kit: {
      palette: ["#1C1C1C", "#FAF7F2", "#B3261E"],
      display: "Playfair Display", body: "Inter",
      tone: "Confident and appetising. Name the dish, say what is in it, stop.",
      photo: "Overhead plates and mid-bite reels, warm colour, no filters that shift food colour.",
      content: "Specials on the day they run, the cook talking, one dish at a time.",
    },
  },
  {
    match: /gym|fitness|yoga|studio|train|sport|crossfit|pilates/i,
    kit: {
      palette: ["#0F1115", "#F2F2F2", "#00C2A8"],
      display: "Archivo", body: "Inter",
      tone: "Direct and encouraging. Say what to do this week, not why fitness matters.",
      photo: "Real members mid-movement, high contrast, phone footage is fine.",
      content: "Short reels of one exercise, class times as stories, member wins as photos.",
    },
  },
  {
    match: /salon|barber|beauty|spa|nail|lash|hair|skin/i,
    kit: {
      palette: ["#2A2A2A", "#FBF8F5", "#D4A5A5"],
      display: "Cormorant Garamond", body: "Inter",
      tone: "Calm and specific. Name the service and how long it takes.",
      photo: "Before and after in the same light, close on detail, clean background.",
      content: "One transformation per post, the person behind the chair, booking reminders as stories.",
    },
  },
  {
    match: /auto|car|garage|mechanic|detail|tire|tyre/i,
    kit: {
      palette: ["#111318", "#EDEFF2", "#F2A900"],
      display: "Barlow Condensed", body: "Inter",
      tone: "Plain and trustworthy. Say what was wrong and what you did about it.",
      photo: "Clean bays, the car and the work, daylight, wide then close.",
      content: "Job of the day photos, quick how to reels, opening hours as stories.",
    },
  },
  {
    match: /shop|store|boutique|retail|market|gift|florist|flower/i,
    kit: {
      palette: ["#1F2933", "#FFFFFF", "#E07A5F"],
      display: "DM Serif Display", body: "Inter",
      tone: "Friendly and specific. Name the product and the price.",
      photo: "Product on a plain surface, then in someone's hands. Consistent background.",
      content: "New arrivals as photos, how it is made as reels, restocks as stories.",
    },
  },
];

const DEFAULT_PLAYBOOK: Playbook = {
  palette: ["#1F2933", "#F7F7F5", "#2F80ED"],
  display: "Archivo", body: "Inter",
  tone: "Direct and friendly. Short sentences. Say what you do and where.",
  photo: "Daylight, real people and the real place, phone footage is fine.",
  content: "One clear subject per post, a person in every reel, hours and offers as stories.",
};

function playbookFor(category: string | null): Playbook {
  const c = category ?? "";
  return PLAYBOOKS.find((p) => p.match.test(c))?.kit ?? DEFAULT_PLAYBOOK;
}

function templateProposal(b: BusinessRow, current: BrandKit, input: ProposeBrandInput): BrandProposal {
  const play = playbookFor(b.category);
  const ownColours = coloursFromBrandJson(b.brand);
  const signals = input.signals ?? null;
  const foundColours = signals?.colors ?? [];
  const palette = foundColours.length >= 2 ? foundColours.slice(0, 5)
    : current.palette.length ? current.palette
    : ownColours.length ? ownColours
    : foundColours.length ? [...foundColours, ...play.palette].slice(0, 5)
    : play.palette;
  const logo = input.logoUrl?.trim() || signals?.logo_url || current.logo_url || b.logo_url || null;
  const examples = Array.from(new Set([
    ...(input.imageUrls ?? []).filter(Boolean),
    ...(signals?.images ?? []),
    ...current.image_examples,
    ...(b.cover_url ? [b.cover_url] : []),
  ])).filter(isImageUrl).slice(0, 8);
  const foundFonts = signals?.fonts ?? [];
  const toneWords = signals?.tone_words ?? [];

  const improvements: string[] = [];
  if (!logo) improvements.push("Add a logo so every post and campaign card carries your mark.");
  if (foundColours.length === 1) improvements.push(`Only one colour (${foundColours[0]}) shows up across your sources. Pair it with a background and one accent and use them everywhere.`);
  if (foundColours.length > 5) improvements.push(`${foundColours.length} different colours are in use. Keep the ${palette.length} here and drop the rest.`);
  if (!foundColours.length && !ownColours.length && !current.palette.length) improvements.push("Pick your own colours: this palette is a starting point for your category, not yours yet.");
  if (foundFonts.length > 2) improvements.push(`${foundFonts.length} typefaces are in use on the website. Two is enough: one for headlines, one for text.`);
  if (examples.length < 3) improvements.push("Add three photos you like so the kit can point at real examples.");
  if (!b.description && !signals?.description && improvements.length < 3) improvements.push("Write a short description of the business; the tone below is a guess without it.");

  const toneLine = toneWords.length
    ? `${toneWords.map((w) => w[0].toUpperCase() + w.slice(1)).join(", ")}. Short sentences, one idea per post.`
    : null;

  return {
    logo_url: logo,
    palette,
    type: {
      display: foundFonts[0] ?? current.type.display ?? play.display,
      body: foundFonts[1] ?? current.type.body ?? play.body,
    },
    tone: current.tone ?? toneLine ?? play.tone,
    photo_style: current.photo_style ?? signals?.photo_style ?? play.photo,
    content_style: current.content_style ?? play.content,
    guidelines: current.guidelines.length ? current.guidelines : [
      `Always spell the name exactly: ${b.name}.`,
      "Use the first palette colour for text and the last one for one accent per post.",
      "One idea per post. No stock photos.",
      ...(b.city ? [`Say ${b.city} when it matters to the reader.`] : []),
    ],
    image_examples: examples,
    improvements: improvements.slice(0, 3),
  };
}

// ------------------------------------------------------------------------ AI

const SYSTEM =
  "You write brand kits for small local businesses. Reply with ONLY a JSON object: " +
  "{logo_url: string|null, palette: string[] (3 to 5 hex colours like #1A2B3C), " +
  "type: {display: string|null, body: string|null} (Google Fonts names), tone: string, photo_style: string, " +
  "content_style: string, guidelines: string[] (max 6 short rules), image_examples: string[] (only URLs you were given), " +
  "improvements: string[] (max 3 concrete things to improve)}. " +
  "Read colours and mood from the logo and photos when they are provided; otherwise derive them from the category and description. " +
  "Short, plain sentences. No emojis. No dashes in text. Never invent URLs, statistics or claims.";

async function aiProposal(b: BusinessRow, current: BrandKit, input: ProposeBrandInput): Promise<BrandProposal | null> {
  const logo = input.logoUrl?.trim() || input.signals?.logo_url || current.logo_url || b.logo_url || null;
  const images = Array.from(new Set([...(input.imageUrls ?? []), ...(input.signals?.images ?? []), ...current.image_examples, ...(b.cover_url ? [b.cover_url] : [])]))
    .filter(Boolean).slice(0, 6);

  const content: Anthropic.ContentBlockParam[] = [];
  if (logo) {
    const block = await imageBlockFor(logo);
    if (block) content.push({ type: "text", text: "Logo:" }, block);
  }
  for (const url of images) {
    const block = await imageBlockFor(url);
    if (block) content.push({ type: "text", text: `Example photo: ${url}` }, block);
  }
  const socials = b.socials ?? {};
  content.push({
    type: "text",
    text: [
      `Mode: ${input.mode === "refine" ? "refine the existing kit, keep what works" : "build a first kit"}`,
      `Business: ${b.name}`,
      `Category: ${b.category ?? "unknown"}`,
      `City: ${b.city ?? "unknown"}`,
      `About: ${b.description ?? "n/a"}`,
      `Website: ${input.website ?? b.website ?? "n/a"}`,
      `Instagram: ${input.instagram ?? (typeof socials.instagram === "string" ? socials.instagram : "n/a")}`,
      `Logo URL: ${logo ?? "none"}`,
      `Photo URLs: ${images.length ? images.join(", ") : "none"}`,
      `Existing kit: ${JSON.stringify(current)}`,
      `Signals found by research (colours, fonts and tone the business already uses; build on these, do not invent): ${input.signals ? JSON.stringify(input.signals) : "none"}`,
      `Notes from the business: ${input.notes ?? "none"}`,
    ].join("\n"),
  });

  const message = await getAnthropic().messages.create({
    model: aiModel(),
    max_tokens: 4000,
    ...AI_REQUEST,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  });
  if (message.stop_reason === "refusal") return null;
  const raw = extractJsonObject(responseText(message));
  if (!raw) return null;
  const proposal = normalizeProposal(raw);
  // The model may only point at images it was actually shown.
  const allowed = new Set([...(logo ? [logo] : []), ...images]);
  proposal.image_examples = proposal.image_examples.filter((u) => allowed.has(u));
  if (!proposal.logo_url || !allowed.has(proposal.logo_url)) proposal.logo_url = logo;
  if (proposal.palette.length < 2) return null;
  return proposal;
}

/**
 * Write a proposal into brand_kits.proposed. Never touches `kit`.
 * Returns the proposal and where it came from.
 */
export async function proposeBrandKit(
  businessId: string,
  input: ProposeBrandInput,
): Promise<{ proposal: BrandProposal; source: BrandSource }> {
  const [b, record] = await Promise.all([loadBusiness(businessId), getBrandKit(businessId)]);

  let proposal: BrandProposal | null = null;
  let source: BrandSource = "template";
  if (isAiConfigured()) {
    try {
      proposal = await aiProposal(b, record.kit, input);
      if (proposal) source = "ai";
    } catch (error) {
      console.error("proposeBrandKit fell back to the template:", error);
    }
  }
  if (!proposal) proposal = templateProposal(b, record.kit, input);

  await sql(
    `insert into brand_kits (business_id, kit, proposed, proposed_source, status, updated_at)
     values ($1, '{}'::jsonb, $2::jsonb, $3, 'draft', now())
     on conflict (business_id) do update
       set proposed = excluded.proposed, proposed_source = excluded.proposed_source, updated_at = now()`,
    [businessId, JSON.stringify(proposal), source],
  );
  return { proposal, source };
}

/**
 * The only path that changes the approved kit: proposed becomes kit, the
 * proposal is cleared, and palette and logo are mirrored into businesses.brand.
 */
export async function approveBrandKit(businessId: string): Promise<BrandKit> {
  return transaction(async (client) => {
    const { rows } = await client.query<{ proposed: unknown }>(
      `select proposed from brand_kits where business_id = $1 for update`,
      [businessId],
    );
    const proposed = rows[0]?.proposed;
    if (!proposed) throw new Error("There is no proposal to approve.");
    const kit = normalizeBrandKit(proposed);

    await client.query(
      `update brand_kits
          set kit = $2::jsonb, proposed = null, proposed_source = null,
              status = 'approved', approved_at = now(), updated_at = now()
        where business_id = $1`,
      [businessId, JSON.stringify(kit)],
    );
    await client.query(
      `update businesses
          set brand = coalesce(brand, '{}'::jsonb)
                      || jsonb_build_object('palette', $2::jsonb, 'colors', $3::text)
                      || case when $4::text is null then '{}'::jsonb else jsonb_build_object('logo_url', $4::text) end,
              logo_url = coalesce(logo_url, $4::text),
              updated_at = now()
        where id = $1`,
      [businessId, JSON.stringify(kit.palette), kit.palette.join(", "), kit.logo_url],
    );
    return kit;
  });
}

/** Drop the pending proposal. The approved kit is untouched. */
export async function discardProposal(businessId: string): Promise<void> {
  await sql(
    `update brand_kits set proposed = null, proposed_source = null, updated_at = now() where business_id = $1`,
    [businessId],
  );
}

// ------------------------------------------------------------- research

const WEBSITE_TIMEOUT_MS = 6000;
const HEX_RE = /#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi;

function expandHex(hex: string): string {
  const h = hex.slice(1);
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return `#${full.toUpperCase()}`;
}

function isNeutral(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  // Pure white and near black are backgrounds, not brand colours.
  return (max >= 250 && min >= 250) || (max <= 12);
}

function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? (m[2] ?? m[3] ?? m[4] ?? "").trim() || null : null;
}

function absolute(url: string | null, base: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, base);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function decodeEntities(text: string): string {
  return text.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}

export type WebsiteRead = Omit<BrandResearch["sources"]["website"], "status" | "note">;

/** Pull the brand facts out of one HTML page. Pure, so it is testable. */
export function readWebsiteHtml(html: string, url: string): WebsiteRead {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  let description: string | null = null;
  let ogImage: string | null = null;
  let themeColor: string | null = null;
  for (const m of metas) {
    const name = (attr(m, "name") ?? attr(m, "property") ?? "").toLowerCase();
    const content = attr(m, "content");
    if (!content) continue;
    if (name === "description" && !description) description = decodeEntities(content).slice(0, 300);
    if (name === "og:image" && !ogImage) ogImage = absolute(content, url);
    if (name === "theme-color" && !themeColor) {
      const hex = content.match(HEX_RE)?.[0];
      if (hex) themeColor = expandHex(hex);
    }
  }
  let icon: string | null = null;
  for (const l of links) {
    const rel = (attr(l, "rel") ?? "").toLowerCase();
    if (/\bicon\b/.test(rel) && !icon) icon = absolute(attr(l, "href"), url);
  }
  const images: string[] = [];
  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    const src = absolute(attr(tag, "src") ?? attr(tag, "data-src"), url);
    if (src && !src.startsWith("data:") && !images.includes(src)) images.push(src);
    if (images.length >= 6) break;
  }
  const counts = new Map<string, number>();
  const fonts = new Set<string>();
  for (const block of html.match(/<style\b[^>]*>([\s\S]*?)<\/style>/gi) ?? []) {
    for (const hex of block.match(HEX_RE) ?? []) {
      const c = expandHex(hex);
      if (!isNeutral(c)) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    for (const m of block.matchAll(/font-family\s*:\s*([^;}]+)/gi)) {
      const first = m[1].split(",")[0].replace(/["']/g, "").trim();
      if (first && !/^(inherit|initial|sans-serif|serif|monospace|system-ui|-apple-system|ui-sans-serif|var\()/i.test(first)) fonts.add(first);
    }
  }
  const colors = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).map(([c]) => c).slice(0, 6);
  return {
    url,
    title: title ? decodeEntities(title).slice(0, 200) : null,
    description,
    og_image: ogImage,
    theme_color: themeColor,
    icon,
    images,
    colors,
    fonts: [...fonts].slice(0, 4),
  };
}

/** Fetch one page, 6 second timeout, no redirects beyond what fetch follows itself, never a second page. */
export async function readWebsite(rawUrl: string): Promise<{ read: WebsiteRead | null; note: string | null }> {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`);
  } catch {
    return { read: null, note: "That website address could not be read." };
  }
  try {
    const response = await fetchWithTimeout(url, { headers: { accept: "text/html", "user-agent": "TapMart brand research" } }, WEBSITE_TIMEOUT_MS);
    if (!response.ok) return { read: null, note: `The website answered with HTTP ${response.status}.` };
    const type = response.headers.get("content-type") ?? "";
    if (!/html/i.test(type)) return { read: null, note: "The website did not return an HTML page." };
    const html = (await response.text()).slice(0, 1_500_000);
    return { read: readWebsiteHtml(html, url.toString()), note: null };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return { read: null, note: aborted ? "The website took more than 6 seconds to answer." : "The website could not be reached from TapMart." };
  }
}

const TONE_HINTS: { words: string[]; match: RegExp }[] = [
  { words: ["warm"], match: /\b(love|cozy|cosy|home|family|welcome|friends)\b/i },
  { words: ["playful"], match: /[!]{2,}|\b(fun|party|yay|woo)\b|[\u{1F300}-\u{1FAFF}]/u },
  { words: ["direct"], match: /\b(today|now|open|closed|book|order|call)\b/i },
  { words: ["crafted"], match: /\b(handmade|hand made|craft|small batch|roasted|baked|made in)\b/i },
  { words: ["local"], match: /\b(neighbou?rhood|local|community|downtown|street)\b/i },
  { words: ["premium"], match: /\b(premium|luxury|bespoke|exclusive|finest|signature)\b/i },
  { words: ["informative"], match: /\b(how to|tips?|guide|learn|why)\b/i },
  { words: ["energetic"], match: /\b(push|train|strong|move|go)\b/i },
];

/** Cheap tone words from captions and descriptions. Used when the model is not configured. */
export function heuristicToneWords(texts: string[]): string[] {
  const corpus = texts.join("\n");
  if (!corpus.trim()) return [];
  const words: string[] = [];
  for (const hint of TONE_HINTS) if (hint.match.test(corpus)) words.push(...hint.words);
  const sentences = corpus.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  const avg = sentences.length ? sentences.reduce((n, s) => n + s.split(/\s+/).length, 0) / sentences.length : 0;
  if (avg && avg <= 9) words.push("concise");
  else if (avg >= 18) words.push("detailed");
  return Array.from(new Set(words)).slice(0, 5);
}

async function aiToneWords(texts: string[]): Promise<string[] | null> {
  if (!isAiConfigured() || !texts.length) return null;
  try {
    const message = await getAnthropic().messages.create({
      model: aiModel(),
      max_tokens: 300,
      ...AI_REQUEST,
      system: "You read a small business's own captions and descriptions and name how it already sounds. Reply with ONLY a JSON object {tone_words: string[]} with 3 to 5 lowercase single words. Describe what is there, never what should be.",
      messages: [{ role: "user", content: texts.slice(0, 40).join("\n---\n").slice(0, 8000) }],
    });
    const raw = extractJsonObject(responseText(message)) as { tone_words?: unknown } | null;
    const words = strList(raw?.tone_words, 5, 30).map((w) => w.toLowerCase());
    return words.length >= 3 ? words : null;
  } catch (error) {
    console.error("brand research: tone words fell back to heuristics:", error);
    return null;
  }
}

function photoStyleFrom(media: InstagramMedia[], siteImages: string[], uploads: string[]): string | null {
  if (!media.length && !siteImages.length && !uploads.length) return null;
  const parts: string[] = [];
  if (media.length) {
    const videos = media.filter((m) => m.media_type === "VIDEO").length;
    const carousels = media.filter((m) => m.media_type === "CAROUSEL_ALBUM").length;
    const photos = media.length - videos - carousels;
    const pieces: string[] = [];
    if (videos) pieces.push(`${videos} reel${videos === 1 ? "" : "s"}`);
    if (carousels) pieces.push(`${carousels} carousel${carousels === 1 ? "" : "s"}`);
    if (photos) pieces.push(`${photos} photo${photos === 1 ? "" : "s"}`);
    parts.push(`Last ${media.length} Instagram posts: ${pieces.join(", ")}.`);
    const withCaption = media.filter((m) => (m.caption ?? "").trim().length > 0).length;
    if (withCaption < media.length) parts.push(`${media.length - withCaption} without a caption.`);
  }
  if (siteImages.length) parts.push(`${siteImages.length} image${siteImages.length === 1 ? "" : "s"} on the website.`);
  if (uploads.length) parts.push(`${uploads.length} uploaded photo${uploads.length === 1 ? "" : "s"}.`);
  return parts.join(" ");
}

/** Turn research into the signals the business already has. Pure apart from the optional model call. */
export async function deriveExistingSignals(research: BrandResearch, business: { description: string | null; logo_url: string | null }): Promise<ExistingSignals> {
  const site = research.sources.website;
  const colors = Array.from(new Set([
    ...(site.theme_color ? [site.theme_color] : []),
    ...site.colors,
    ...research.sources.logo.colors,
  ])).slice(0, 8);
  const texts = [
    ...research.captions,
    ...(site.description ? [site.description] : []),
    ...(business.description ? [business.description] : []),
  ];
  const ai = await aiToneWords(texts);
  const tone_words = ai ?? heuristicToneWords(texts);
  const notes: string[] = [];
  const ig = research.sources.instagram;
  if (ig.status === "used") notes.push(`Instagram @${ig.handle}: ${ig.media_count} recent posts and their captions.`);
  const g = research.sources.google;
  if (g.status === "used") notes.push(`Google listing "${g.title}": category, description and hours.`);
  if (site.status === "used") notes.push(`Website ${site.title ?? site.url}: ${site.colors.length} colours, ${site.fonts.length} typefaces, ${site.images.length} images.`);
  else if (site.status === "failed" && site.note) notes.push(`Website: ${site.note}`);
  const logo = research.sources.logo;
  if (logo.status === "used") notes.push(logo.colors.length ? `Logo: ${logo.colors.length} colours.` : `Logo: ${logo.note ?? "found"}.`);
  if (research.sources.photos.urls.length) notes.push(`${research.sources.photos.urls.length} uploaded photos.`);
  return {
    colors,
    fonts: site.fonts,
    tone_words,
    tone_source: tone_words.length ? (ai ? "ai" : "heuristic") : null,
    photo_style: null,
    images: [],
    logo_url: logo.url ?? business.logo_url,
    description: site.description ?? business.description ?? null,
    notes,
  };
}

export type ResearchInput = { photoUrls?: string[]; notes?: string | null };

/**
 * Gather only what is real, store it, derive the signals, then propose.
 * Refuses when there is no source at all: research without input would be
 * invention.
 */
export async function researchBrand(businessId: string, input: ResearchInput = {}): Promise<{
  research: BrandResearch; signals: ExistingSignals; proposal: BrandProposal; source: BrandSource;
}> {
  const [b, record, ig, google] = await Promise.all([
    loadBusiness(businessId), getBrandKit(businessId), getInstagramBusiness(businessId), getGoogleProfileSnapshot(businessId),
  ]);
  const photos = (input.photoUrls ?? []).filter((u) => typeof u === "string" && u.trim()).map((u) => u.trim().slice(0, 500)).slice(0, 8);
  const website = b.website?.trim() || null;
  const logoUrl = b.logo_url?.trim() || record.kit.logo_url || null;
  const igConnected = Boolean(ig && ig.status === "connected" && ig.source === "oauth");

  if (!igConnected && !google && !website && !logoUrl && photos.length === 0) throw new Error(NO_SOURCES_MESSAGE);

  const now = new Date();
  const igMeta: InstagramBusinessMeta = ig?.meta ?? {};
  const media = igConnected ? (igMeta.media ?? []) : [];
  const captions = media.map((m) => (m.caption ?? "").trim()).filter(Boolean).slice(0, 12);

  const siteResult = website ? await readWebsite(website) : null;
  const siteRead = siteResult?.read ?? null;

  const research: BrandResearch = {
    sources: {
      instagram: igConnected
        ? { status: "used", handle: ig!.external_name, media_count: media.length, note: null }
        : { status: "not_connected", handle: null, media_count: 0, note: "Instagram is not connected." },
      google: google
        ? { status: "used", title: google.name, note: null }
        : { status: "not_connected", title: null, note: "Google is not connected." },
      website: website
        ? siteRead
          ? { status: "used", note: null, ...siteRead }
          : { status: "failed", url: website, title: null, description: null, og_image: null, theme_color: null, icon: null, images: [], colors: [], fonts: [], note: siteResult?.note ?? "The website could not be read." }
        : { status: "missing", url: null, title: null, description: null, og_image: null, theme_color: null, icon: null, images: [], colors: [], fonts: [], note: "No website on the profile." },
      logo: logoUrl
        ? { status: "used", url: logoUrl, colors: [], note: "Colors could not be read from the logo." }
        : { status: "missing", url: null, colors: [], note: "No logo yet." },
      photos: { status: photos.length ? "used" : "missing", urls: photos },
    },
    captions,
    researched_at: now.toISOString(),
  };

  const googleTexts = google ? [google.description ?? ""].filter(Boolean) : [];
  research.captions = [...captions, ...googleTexts];

  const signals = await deriveExistingSignals(research, { description: b.description, logo_url: b.logo_url });
  const mediaImages = media.map((m) => m.thumbnail_url ?? m.media_url ?? "").filter((u) => u && isImageUrl(u));
  signals.images = Array.from(new Set([
    ...mediaImages,
    ...photos,
    ...(siteRead?.og_image && isImageUrl(siteRead.og_image) ? [siteRead.og_image] : []),
    ...(siteRead?.images ?? []).filter(isImageUrl),
  ])).slice(0, 8);
  signals.photo_style = photoStyleFrom(media, siteRead?.images ?? [], photos);
  if (google) signals.description = signals.description ?? google.description ?? null;

  await sql(
    `insert into brand_kits (business_id, kit, research, existing_signals, researched_at, updated_at)
     values ($1, '{}'::jsonb, $2::jsonb, $3::jsonb, now(), now())
     on conflict (business_id) do update
       set research = excluded.research, existing_signals = excluded.existing_signals, researched_at = now(), updated_at = now()`,
    [businessId, JSON.stringify(research), JSON.stringify(signals)],
  );

  const { proposal, source } = await proposeBrandKit(businessId, {
    mode: record.status === "approved" ? "refine" : "build",
    website,
    instagram: igConnected ? ig!.external_name : null,
    logoUrl,
    imageUrls: signals.images,
    notes: input.notes ?? null,
    signals,
  });
  return { research, signals, proposal, source };
}
