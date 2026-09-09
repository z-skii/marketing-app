"use server";

import { redirect } from "next/navigation";
import { sql, sqlOne } from "@/lib/db";
import { notifyMany, requireBusinessMember, requireOnboarded } from "@/lib/v2/core";
import { formatCredit } from "@/lib/money";

/**
 * Campaign creation. The wizard collects a few answers per step; this action
 * validates everything server-side and publishes (or saves a draft). On
 * publish, earners in the campaign's city get a notification.
 */

export type CreateCampaignInput = {
  businessId: string;
  kind: string;
  title: string;
  brief: string;
  referenceUrl?: string;
  requirements: string[];
  payDollars: number;
  slots: number;
  city: string;
  deadline?: string;
  eventAt?: string;
  verifiedOnly: boolean;
  publish: boolean;
};

const KINDS = ["ugc", "photography", "videography", "content", "general"];

export async function createCampaign(input: CreateCampaignInput) {
  const ctx = await requireOnboarded();
  try {
    await requireBusinessMember(ctx.user.id, input.businessId, ["owner", "manager"]);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Not allowed." };
  }

  if (!KINDS.includes(input.kind)) return { ok: false as const, error: "Pick a campaign type." };
  const title = input.title.trim();
  const brief = input.brief.trim();
  if (title.length < 4 || title.length > 120) return { ok: false as const, error: "Title needs 4–120 characters." };
  if (brief.length < 20) return { ok: false as const, error: "Describe the work in a few sentences (20+ characters)." };
  const payCents = Math.round(input.payDollars * 100);
  if (!Number.isFinite(payCents) || payCents < 500 || payCents > 5_000_000) {
    return { ok: false as const, error: "Pay must be between $5 and $50,000." };
  }
  const slots = Math.round(input.slots);
  if (slots < 1 || slots > 500) return { ok: false as const, error: "Spots must be 1–500." };
  const requirements = (input.requirements ?? [])
    .map((r) => r.trim().slice(0, 200)).filter(Boolean).slice(0, 12);
  const deadline = input.deadline ? new Date(input.deadline) : null;
  if (deadline && (isNaN(deadline.getTime()) || deadline < new Date())) {
    return { ok: false as const, error: "Deadline must be in the future." };
  }
  const eventAt = input.eventAt ? new Date(input.eventAt) : null;

  // Publishing requires enough wallet credit to pay at least one approval, so
  // creators never work toward an empty wallet.
  if (input.publish) {
    const wallet = await sqlOne<{ cents: string }>(
      `select available_credit_cents::text as cents from wallets w
        join businesses b on b.owner_id = w.user_id where b.id = $1`,
      [input.businessId],
    );
    const available = Number(wallet?.cents ?? 0);
    if (available < payCents) {
      return {
        ok: false as const,
        error: `Add credit first — approving one submission costs ${formatCredit(payCents)} and the wallet has ${formatCredit(available)}. Top up from the Wallet page.`,
      };
    }
  }

  const campaign = await sqlOne<{ id: string }>(
    `insert into campaigns
       (business_id, created_by, kind, title, brief, reference_url, requirements,
        pay_cents, slots, city, deadline, event_at, verified_only, status, published_at)
     values ($1, $2, $3::campaign_kind, $4, $5, nullif($6, ''), $7, $8, $9,
             nullif($10, ''), $11, $12, $13, $14::campaign_status,
             case when $14 = 'open' then now() end)
     returning id`,
    [
      input.businessId, ctx.user.id, input.kind, title, brief,
      input.referenceUrl?.trim().slice(0, 500) ?? "", requirements, payCents, slots,
      input.city.trim().slice(0, 60), deadline, eventAt, input.verifiedOnly,
      input.publish ? "open" : "draft",
    ],
  );

  if (input.publish && campaign) {
    const city = input.city.trim();
    const audience = await sql<{ id: string }>(
      `select id from profiles
        where wants_earn and not suspended and id <> $1
          and ($2 = '' or lower(city) = lower($2))
        limit 200`,
      [ctx.user.id, city],
    );
    await notifyMany(
      audience.map((a) => a.id), "opportunity",
      `${formatCredit(payCents)} — ${title}`,
      { body: city ? `New opportunity in ${city}.` : "New opportunity on TapMart.", href: `/jobs/${campaign.id}` },
    );
  }

  redirect(campaign ? `/jobs/${campaign.id}` : "/jobs");
}
