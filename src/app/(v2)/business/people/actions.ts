"use server";

import { sqlOne } from "@/lib/db";
import { requireBusinessContext } from "@/lib/v2/core";
import { cancelInvite, listInvitesForBusiness, sendInvite, type InviteKind } from "@/lib/v2/requests";
import { formatCredit } from "@/lib/money";
import { generateBrief } from "@/lib/ai/brief";
import { buildCreatorGuide } from "@/lib/ai/guide";
import { isImageUrl } from "@/lib/ai/client";
import type { AiSource } from "@/lib/ai/types";

/**
 * Direct requests from a business to one person. Each one is a normal
 * campaign (audience = 'direct', one slot, the person as target) with the
 * same kind-specific details the public wizard writes, so the person's
 * opportunity page renders the usual Story or Recreate flow. The invite row
 * and the notification come from the shared requests library.
 */

type Fail = { ok: false; error: string };
type Sent = { ok: true; campaignId: string };
const fail = (error: string): Fail => ({ ok: false, error });

export type StoryRequestInput = {
  profileId: string;
  payDollars: number;
  creativeUrl: string;
  liveHours: number;
  message?: string;
};

export type ReelRequestInput = {
  profileId: string;
  payDollars: number;
  referenceUrl?: string;
  referenceMediaUrl?: string;
  deadline?: string;
  brief: string;
  message?: string;
};

type Target = { id: string; username: string; display_name: string | null; city: string | null };
type Prep =
  | { ok: false; error: string }
  | { ok: true; ctx: Awaited<ReturnType<typeof requireBusinessContext>>; business: Awaited<ReturnType<typeof requireBusinessContext>>["activeBusiness"]; target: Target; businessCity: string | null; category: string | null };

/** Who is asking, who is asked, and whether the ask is allowed at all. */
async function prepare(profileId: string, kind: InviteKind): Promise<Prep> {
  const ctx = await requireBusinessContext("/business");
  const business = ctx.activeBusiness;
  if (!["owner", "manager"].includes(business.member_role) && ctx.user.role !== "admin") return fail("Only owners and managers can send requests.");
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return fail("Pick a person first.");

  const target = await sqlOne<Target & { suspended: boolean; wants_earn: boolean; onboarded: boolean }>(
    `select id, username, display_name, city, suspended, wants_earn, onboarded_at is not null as onboarded from profiles where id = $1`,
    [profileId],
  );
  const owner = await sqlOne<{ owner_id: string; city: string | null; category: string | null }>(`select owner_id, city, category from businesses where id = $1`, [business.id]);
  if (!target || !owner) return fail("That person is no longer on TapMart.");
  if (target.id === ctx.user.id || target.id === owner.owner_id) return fail("You cannot send a request to yourself.");
  if (target.suspended) return fail("This account is suspended.");
  if (!target.wants_earn || !target.onboarded) return fail("This person is not taking requests.");

  const open = (await listInvitesForBusiness(business.id)).find((i) => i.profile_id === target.id && i.kind === kind && i.status === "sent");
  if (open) return fail("You already sent this request. Wait for the answer or cancel it from the campaign.");

  return { ok: true, ctx, business, target, businessCity: owner.city, category: owner.category };
}

async function creditCovers(businessId: string, payCents: number): Promise<string | null> {
  const wallet = await sqlOne<{ cents: string }>(
    `select available_credit_cents::text as cents from wallets w join businesses b on b.owner_id = w.user_id where b.id = $1`,
    [businessId],
  );
  const available = Number(wallet?.cents ?? 0);
  if (available < payCents) {
    return `Add credit first. Paying one person costs ${formatCredit(payCents)} and your campaign credit is ${formatCredit(available)}.`;
  }
  return null;
}

function cleanUrl(value: unknown, max = 2048): string | null {
  if (typeof value !== "string") return null;
  const u = value.trim();
  if (!u || u.length > max) return null;
  if (u.startsWith("/uploads/") || /^https?:\/\//i.test(u)) return u;
  return null;
}

export async function sendStoryRequest(input: StoryRequestInput): Promise<Sent | Fail> {
  const prep = await prepare(input.profileId, "instagram_story");
  if (!prep.ok) return prep;
  const { ctx, business, target, businessCity } = prep;

  const payCents = Math.round(Number(input.payDollars) * 100);
  if (!Number.isFinite(payCents) || payCents < 500 || payCents > 100_000) return fail("Pay must be between $5 and $1,000 per story.");
  const creativeUrl = cleanUrl(input.creativeUrl);
  if (!creativeUrl) return fail("Upload the story creative first.");
  const liveHours = [12, 24, 48].includes(Math.round(Number(input.liveHours))) ? Math.round(Number(input.liveHours)) : 24;
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 300) : "";

  const short = await creditCovers(business.id, payCents);
  if (short) return fail(short);

  const requirements = [`Keep it live ${liveHours} hours`, "Do not crop or edit the creative"];
  const details = { creative_url: creativeUrl, min_followers: null, live_hours: liveHours };
  const brief = message.length >= 20 ? message : `Post this Story to your Instagram and keep it live for ${liveHours} hours. Do not crop or edit the creative.${message ? ` ${message}` : ""}`;
  const city = target.city ?? businessCity ?? null;

  const campaign = await sqlOne<{ id: string }>(
    `insert into campaigns
       (business_id, created_by, kind, title, brief, requirements, pay_cents, slots, city, deadline, details,
        status, published_at, audience, target_profile_id)
     values ($1, $2, 'instagram_story', $3, $4, $5, $6, 1, $7, now() + interval '14 days', $8::jsonb,
             'open', now(), 'direct', $9)
     returning id`,
    [business.id, ctx.user.id, `Story for ${business.name}`.slice(0, 120), brief, requirements, payCents, city, JSON.stringify(details), target.id],
  );
  if (!campaign) return fail("Could not create the request.");

  await sendInvite({
    campaignId: campaign.id, businessId: business.id, businessName: business.name, profileId: target.id,
    kind: "instagram_story", payCents, message: message || null,
  });
  return { ok: true, campaignId: campaign.id };
}

export async function sendReelRequest(input: ReelRequestInput): Promise<Sent | Fail> {
  const prep = await prepare(input.profileId, "recreate_reel");
  if (!prep.ok) return prep;
  const { ctx, business, target, businessCity, category } = prep;

  const payCents = Math.round(Number(input.payDollars) * 100);
  if (!Number.isFinite(payCents) || payCents < 500 || payCents > 500_000) return fail("Pay must be between $5 and $5,000 per approved video.");
  const briefText = typeof input.brief === "string" ? input.brief.trim().slice(0, 2000) : "";
  if (briefText.length < 20) return fail("Say what you want in a couple of sentences (20+ characters).");
  const referenceUrl = typeof input.referenceUrl === "string" ? input.referenceUrl.trim().slice(0, 500) : "";
  if (referenceUrl && !/^https?:\/\//i.test(referenceUrl)) return fail("The reference link must start with http.");
  const media = cleanUrl(input.referenceMediaUrl);
  const message = typeof input.message === "string" ? input.message.trim().slice(0, 300) : "";

  let deadline: Date | null = null;
  if (input.deadline) {
    const d = new Date(input.deadline.length === 10 ? `${input.deadline}T23:59:00` : input.deadline);
    if (isNaN(d.getTime()) || d < new Date()) return fail("Deadline must be in the future.");
    deadline = d;
  }

  const short = await creditCovers(business.id, payCents);
  if (short) return fail(short);

  // The structured brief and the creator guide, exactly like the wizard
  // stores them, so the person's Recreate screen shows numbered steps.
  const city = target.city ?? businessCity ?? null;
  const { brief: structured } = await generateBrief(
    { businessName: business.name, category, city: businessCity, referenceUrl: referenceUrl || null, referenceMediaUrl: media, referenceNotes: briefText },
    { payCents },
  );
  structured.summary = briefText;
  structured.suggested_pay_cents = payCents;
  structured.suggested_slots = 1;
  const { guide } = await buildCreatorGuide(structured, { referenceFrameUrls: isImageUrl(media) ? [media as string] : [] });
  const details = {
    reference_media_url: media,
    duration_seconds: structured.duration_seconds,
    brief: structured,
    guide,
  };
  const requirements = [
    `${structured.duration_seconds[0]} to ${structured.duration_seconds[1]} seconds`,
    structured.orientation === "vertical" ? "Vertical 9:16" : "Horizontal 16:9",
    ...structured.required_elements.slice(0, 3),
  ].map((r) => r.trim().slice(0, 200)).filter(Boolean);
  const title = `Recreate: ${structured.title.replace(/^recreate:\s*/i, "")}`.slice(0, 120);

  const campaign = await sqlOne<{ id: string }>(
    `insert into campaigns
       (business_id, created_by, kind, title, brief, reference_url, requirements, pay_cents, slots, city, deadline, details,
        status, published_at, audience, target_profile_id)
     values ($1, $2, 'recreate_reel', $3, $4, nullif($5, ''), $6, $7, 1, $8, $9, $10::jsonb,
             'open', now(), 'direct', $11)
     returning id`,
    [business.id, ctx.user.id, title, briefText, referenceUrl, requirements, payCents, city, deadline, JSON.stringify(details), target.id],
  );
  if (!campaign) return fail("Could not create the request.");

  await sendInvite({
    campaignId: campaign.id, businessId: business.id, businessName: business.name, profileId: target.id,
    kind: "recreate_reel", payCents, message: message || null,
  });
  return { ok: true, campaignId: campaign.id };
}

/**
 * A starting brief for the Reel sheet. Written by Claude when a key is set,
 * otherwise by the template; the source is returned so the sheet can say
 * which one the business is looking at.
 */
export async function draftReelBrief(input: { referenceUrl?: string; referenceMediaUrl?: string }): Promise<{ ok: true; text: string; source: AiSource } | Fail> {
  const ctx = await requireBusinessContext("/business");
  const business = ctx.activeBusiness;
  const row = await sqlOne<{ city: string | null; category: string | null }>(`select city, category from businesses where id = $1`, [business.id]);
  const referenceUrl = typeof input.referenceUrl === "string" && /^https?:\/\//i.test(input.referenceUrl.trim()) ? input.referenceUrl.trim().slice(0, 500) : null;
  const { brief, source } = await generateBrief({
    businessName: business.name, category: row?.category ?? null, city: row?.city ?? null,
    referenceUrl, referenceMediaUrl: cleanUrl(input.referenceMediaUrl),
  });
  const lines = [brief.summary, ...brief.steps.slice(0, 4).map((s) => `${s.n}. ${s.text}`)];
  return { ok: true, text: lines.join("\n").slice(0, 1500), source };
}

/** Business withdraws a request that has not been answered yet. */
export async function cancelRequest(inviteId: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireBusinessContext("/business");
  if (!/^[0-9a-f-]{36}$/i.test(inviteId)) return { ok: false, error: "Request not found." };
  const done = await cancelInvite(inviteId, ctx.activeBusiness.id);
  if (!done) return { ok: false, error: "This request was already answered." };
  return { ok: true };
}
