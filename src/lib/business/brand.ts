import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { sql, sqlOne, transaction } from "@/lib/db";
import {
  AI_REQUEST, aiModel, extractJsonObject, getAnthropic, imageBlockFor, isAiConfigured, responseText,
} from "@/lib/ai/client";

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
};

export type ProposeBrandInput = {
  mode: "build" | "refine";
  website?: string | null;
  instagram?: string | null;
  logoUrl?: string | null;
  imageUrls?: string[];
  notes?: string | null;
};

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
  }>(
    `select kit, proposed, proposed_source, status, approved_at, updated_at from brand_kits where business_id = $1`,
    [businessId],
  );
  if (!row) {
    return { kit: EMPTY_BRAND_KIT, proposed: null, proposed_source: null, status: "draft", approved_at: null, updated_at: null };
  }
  return {
    kit: normalizeBrandKit(row.kit),
    proposed: row.proposed ? normalizeProposal(row.proposed) : null,
    proposed_source: row.proposed_source,
    status: row.status,
    approved_at: row.approved_at,
    updated_at: row.updated_at,
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
  const palette = current.palette.length ? current.palette : ownColours.length ? ownColours : play.palette;
  const logo = input.logoUrl?.trim() || current.logo_url || b.logo_url || null;
  const examples = Array.from(new Set([
    ...(input.imageUrls ?? []).filter(Boolean),
    ...current.image_examples,
    ...(b.cover_url ? [b.cover_url] : []),
  ])).slice(0, 8);

  const improvements: string[] = [];
  if (!logo) improvements.push("Add a logo so every post and campaign card carries your mark.");
  if (!ownColours.length && !current.palette.length) improvements.push("Pick your own colours: this palette is a starting point for your category, not yours yet.");
  if (examples.length < 3) improvements.push("Add three photos you like so the kit can point at real examples.");
  if (!b.description && improvements.length < 3) improvements.push("Write a short description of the business; the tone below is a guess without it.");

  return {
    logo_url: logo,
    palette,
    type: {
      display: current.type.display ?? play.display,
      body: current.type.body ?? play.body,
    },
    tone: current.tone ?? play.tone,
    photo_style: current.photo_style ?? play.photo,
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
  const logo = input.logoUrl?.trim() || current.logo_url || b.logo_url || null;
  const images = Array.from(new Set([...(input.imageUrls ?? []), ...current.image_examples, ...(b.cover_url ? [b.cover_url] : [])]))
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
