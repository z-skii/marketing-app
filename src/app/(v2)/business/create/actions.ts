"use server";

import { redirect } from "next/navigation";
import { sql, sqlOne } from "@/lib/db";
import { notifyMany, requireBusinessMember, requireOnboarded } from "@/lib/v2/core";
import { formatCredit } from "@/lib/money";
import { ZONES } from "@/app/(v2)/cars/zones";

/**
 * Creating one of the three campaign types. Each wizard collects a few
 * answers; this action validates everything server-side, stores the
 * type-specific facts in campaigns.details, and publishes (or saves a
 * draft). Publishing needs enough wallet credit for one approval so nobody
 * works toward an empty wallet; the subscription is separate from this.
 */

export type RecreateInput = {
  kind: "recreate_reel";
  referenceUrl?: string;
  referenceMediaUrl?: string;
  brief: string;
  requirements: string[];
  durationSeconds?: [number, number];
  payDollars: number;
  slots: number;
  deadline?: string;
  city: string;
};

export type StoryInput = {
  kind: "instagram_story";
  creativeUrl: string;
  brief: string;
  minFollowers?: number;
  city: string;
  payDollars: number;
  liveHours: number;
  slots: number;
  deadline?: string;
};

export type CarInput = {
  kind: "car_ads";
  city: string;
  colors: string[];
  bodyTypes: string[];
  placements: string[];
  durationDays: number;
  monthlyDollars: number;
  slots: number;
  artworkUrl?: string;
  brief: string;
  startsOn?: string;
};

export type EarnCampaignInput = { businessId: string; title: string; publish: boolean } &
  (RecreateInput | StoryInput | CarInput);

type Fail = { ok: false; error: string };
const fail = (error: string): Fail => ({ ok: false, error });

export async function createEarnCampaign(input: EarnCampaignInput): Promise<Fail | never> {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, input.businessId, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }

  const title = input.title.trim();
  if (title.length < 4 || title.length > 120) return fail("Give it a short title (4 to 120 characters).");
  const brief = input.brief.trim();
  if (brief.length < 20) return fail("Say what you want in a couple of sentences (20+ characters).");
  const city = input.city.trim().slice(0, 60);
  if (!city) return fail("Which city is this for?");
  const slots = Math.round(input.slots);
  if (slots < 1 || slots > 500) return fail("Spots must be 1 to 500.");

  let payCents: number;
  let requirements: string[] = [];
  let details: Record<string, unknown> = {};
  let deadline: Date | null = null;
  let startsOn: string | null = null;
  let referenceUrl = "";

  if (input.kind === "recreate_reel") {
    payCents = Math.round(input.payDollars * 100);
    if (!Number.isFinite(payCents) || payCents < 500 || payCents > 500_000) return fail("Pay must be between $5 and $5,000 per approved video.");
    referenceUrl = input.referenceUrl?.trim().slice(0, 500) ?? "";
    const media = input.referenceMediaUrl?.trim() ?? "";
    if (!referenceUrl && !media) return fail("Add the reference: a link to the Reel or an uploaded video.");
    requirements = clean(input.requirements);
    const range = input.durationSeconds;
    details = {
      reference_media_url: media || null,
      duration_seconds: range && range[0] > 0 && range[1] >= range[0] ? [Math.round(range[0]), Math.round(range[1])] : null,
    };
    const parsed = parseDeadline(input.deadline);
    if (parsed === undefined) return fail("Deadline must be in the future.");
    deadline = parsed;
  } else if (input.kind === "instagram_story") {
    payCents = Math.round(input.payDollars * 100);
    if (!Number.isFinite(payCents) || payCents < 500 || payCents > 100_000) return fail("Pay must be between $5 and $1,000 per story.");
    if (!input.creativeUrl?.trim()) return fail("Upload the story creative first.");
    const liveHours = Math.min(Math.max(Math.round(input.liveHours) || 24, 1), 72);
    const minFollowers = input.minFollowers ? Math.max(0, Math.round(input.minFollowers)) : null;
    requirements = [
      `Keep it live ${liveHours} hours`,
      ...(minFollowers ? [`${minFollowers.toLocaleString()}+ followers`] : []),
      "Do not crop or edit the creative",
    ];
    details = { creative_url: input.creativeUrl.trim(), min_followers: minFollowers, live_hours: liveHours };
    const parsed = parseDeadline(input.deadline);
    if (parsed === undefined) return fail("Deadline must be in the future.");
    deadline = parsed;
  } else {
    payCents = Math.round(input.monthlyDollars * 100);
    if (!Number.isFinite(payCents) || payCents < 2500 || payCents > 500_000) return fail("Monthly pay must be between $25 and $5,000.");
    const placements = (input.placements ?? []).filter((z) => (ZONES as readonly string[]).includes(z));
    if (placements.length === 0) return fail("Pick at least one placement on the car.");
    const durationDays = Math.min(Math.max(Math.round(input.durationDays) || 30, 7), 365);
    requirements = clean([
      `${durationDays} day campaign`,
      "One photo of the artwork each week",
    ]);
    details = {
      placements,
      duration_days: durationDays,
      vehicle_prefs: {
        colors: clean(input.colors ?? []).slice(0, 6),
        body_types: clean(input.bodyTypes ?? []).slice(0, 6),
      },
      artwork_url: input.artworkUrl?.trim() || null,
    };
    if (input.startsOn) {
      const d = new Date(input.startsOn);
      if (isNaN(d.getTime())) return fail("Start date is not valid.");
      startsOn = d.toISOString().slice(0, 10);
    }
  }

  if (input.publish) {
    const wallet = await sqlOne<{ cents: string }>(
      `select available_credit_cents::text as cents from wallets w
        join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [input.businessId],
    );
    const available = Number(wallet?.cents ?? 0);
    if (available < payCents) {
      return fail(
        `Add credit first. Paying one person costs ${formatCredit(payCents)} and your campaign credit is ${formatCredit(available)}.`,
      );
    }
  }

  const campaign = await sqlOne<{ id: string }>(
    `insert into campaigns
       (business_id, created_by, kind, title, brief, reference_url, requirements,
        pay_cents, slots, city, deadline, starts_on, details, status, published_at)
     values ($1, $2, $3::campaign_kind, $4, $5, nullif($6, ''), $7, $8, $9, $10, $11, $12, $13::jsonb,
             $14::campaign_status, case when $14 = 'open' then now() end)
     returning id`,
    [
      input.businessId, ctx.user.id, input.kind, title, brief, referenceUrl, requirements,
      payCents, slots, city, deadline, startsOn, JSON.stringify(details),
      input.publish ? "open" : "draft",
    ],
  );

  if (input.publish && campaign) {
    const audience = await sql<{ id: string }>(
      `select id from profiles
        where wants_earn and not suspended and id <> $1 and lower(city) = lower($2)
        limit 200`,
      [ctx.user.id, city],
    );
    const headline =
      input.kind === "recreate_reel" ? `Make ${formatCredit(payCents)}: recreate a Reel`
      : input.kind === "instagram_story" ? `Earn ${formatCredit(payCents)}: post a Story`
      : `${formatCredit(payCents)}/month: drivers wanted in ${city}`;
    await notifyMany(audience.map((a) => a.id), "opportunity", headline, {
      body: `New in ${city}.`, href: `/o/${campaign.id}`,
    });
  }

  redirect(campaign ? `/business/campaigns/${campaign.id}?created=1` : "/business/campaigns");
}

function clean(items: string[]) {
  return (items ?? []).map((r) => r.trim().slice(0, 200)).filter(Boolean).slice(0, 12);
}

/** null = none, undefined = invalid */
function parseDeadline(value?: string): Date | null | undefined {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime()) || d < new Date()) return undefined;
  return d;
}
