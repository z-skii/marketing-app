"use server";

import { revalidatePath } from "next/cache";
import { sql, sqlOne } from "@/lib/db";
import {
  ensureConversation, notify, notifyMany, requireBusinessMember, requireOnboarded, systemMessage,
} from "@/lib/v2/core";
import { getOpportunity, vehicleQualifies, getMyVehicles } from "@/lib/v2/opportunities";
import { meetsFollowerRequirement } from "@/lib/v2/instagram";
import { formatCredit } from "@/lib/money";
import { checkSubmission } from "@/lib/ai/check";
import { submissionMeta } from "@/lib/ai/submission-meta";
import type { ClientMediaMeta, SubmissionCheck } from "@/lib/ai/types";

/**
 * Taking part in the three earning types. Recreate campaigns reuse
 * submitWork (jobs/[id]/actions.ts): watch, recreate, upload. This file adds
 * what Stories and car campaigns need on top:
 *
 *   Story    participate (an accepted application) → post → send proof
 *            (a submission with the screenshot and the story link)
 *   Car ad   apply with a specific vehicle → the business accepts → the
 *            existing offer + booking workflow takes over
 *
 * Every action re-checks who is allowed to do it.
 */

type Result = { ok: boolean; error?: string };
const fail = (error: string): Result => ({ ok: false, error });

async function openOpportunity(campaignId: string, viewerId: string) {
  const o = await getOpportunity(campaignId, viewerId);
  if (!o) return null;
  const status = await sqlOne<{ status: string; owner_id: string }>(
    `select c.status::text as status, b.owner_id from campaigns c join businesses b on b.id = c.business_id where c.id = $1`,
    [campaignId],
  );
  if (!status || status.status !== "open") return null;
  if (o.deadline && new Date(o.deadline) < new Date()) return null;
  return { ...o, business_owner_id: status.owner_id };
}

// ---------------------------------------------------------------- Recreate

/**
 * The advisory pre-submission check. Deterministic items always (length and
 * orientation from what the browser read), AI items only when configured
 * and frames were captured. Nothing is persisted here; the client sends the
 * result back with the submission. Never decides money.
 */
export async function runSubmissionCheck(
  campaignId: string,
  mediaUrl: string,
  clientMeta: ClientMediaMeta | null,
): Promise<SubmissionCheck> {
  await requireOnboarded();
  const campaign = await sqlOne<{
    kind: string; details: Record<string, unknown>; requirements: string[]; title: string; business_name: string;
  }>(
    `select c.kind::text as kind, c.details, c.requirements, c.title, b.name as business_name
       from campaigns c join businesses b on b.id = c.business_id where c.id = $1`,
    [campaignId],
  );
  if (!campaign) {
    return { items: [], summary: "Campaign not found.", checked_by: "none", checked_at: new Date().toISOString() };
  }
  const safeMeta: ClientMediaMeta | null = clientMeta ? {
    durationSeconds: numOrNull(clientMeta.durationSeconds),
    width: numOrNull(clientMeta.width),
    height: numOrNull(clientMeta.height),
    sizeBytes: numOrNull(clientMeta.sizeBytes),
    frames: (clientMeta.frames ?? []).filter((f) => typeof f === "string" && f.startsWith("data:image/") && f.length < 2_000_000).slice(0, 6),
  } : null;
  return checkSubmission({ campaign, mediaUrl: String(mediaUrl ?? ""), clientMeta: safeMeta });
}

function numOrNull(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * A recreated video goes in. Same rules as submitWork (one live submission
 * per creator, campaign open, rights acknowledged) plus the advisory check
 * and the browser's file numbers stored in meta for the reviewer.
 */
export async function submitRecreate(
  campaignId: string,
  input: {
    mediaUrls: string[]; note: string; rightsAck: boolean;
    check?: SubmissionCheck | null; clientMeta?: ClientMediaMeta | null;
  },
): Promise<Result> {
  const ctx = await requireOnboarded();
  const o = await openOpportunity(campaignId, ctx.user.id);
  if (!o || o.kind !== "recreate_reel") return fail("This campaign is no longer open.");
  if (o.business_owner_id === ctx.user.id) return fail("This is your own campaign.");
  if (!input.rightsAck) return fail("Confirm the content-rights note before submitting.");
  const mediaUrls = (input.mediaUrls ?? []).filter((u) => typeof u === "string" && u.trim()).slice(0, 10);
  if (mediaUrls.length === 0) return fail("Upload your video first.");
  if (o.approved_count >= o.slots) return fail("All spots are already filled.");

  const application = await sqlOne<{ status: string }>(
    `select status::text as status from applications where campaign_id = $1 and applicant_id = $2`,
    [campaignId, ctx.user.id],
  );
  if (application && ["declined", "withdrawn"].includes(application.status)) {
    return fail("This campaign is not open to you any more.");
  }

  const existing = await sqlOne<{ status: string }>(
    `select status::text as status from submissions where campaign_id = $1 and creator_id = $2 order by created_at desc limit 1`,
    [campaignId, ctx.user.id],
  );
  if (existing && ["submitted", "under_review", "approved", "paid"].includes(existing.status)) {
    return fail("You already have a submission in review here.");
  }

  const submission = await sqlOne<{ id: string }>(
    `insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, meta)
     values ($1, $2, $3, nullif($4, ''), true, $5::jsonb) returning id`,
    [campaignId, ctx.user.id, mediaUrls, (input.note ?? "").trim().slice(0, 2000),
     JSON.stringify(submissionMeta(input.check, input.clientMeta))],
  );
  if (!submission) return fail("Could not submit. Try again.");

  const conv = await ensureConversation("campaign", campaignId, [ctx.user.id, o.business_owner_id]);
  await systemMessage(conv, `@${ctx.user.username} uploaded their recreation.`);
  const members = await sql<{ profile_id: string }>(
    `select profile_id from business_members where business_id = $1`, [o.business_id],
  );
  const audience = Array.from(new Set([o.business_owner_id, ...members.map((m) => m.profile_id)]));
  await notifyMany(audience, "submission", `New recreation from @${ctx.user.username}`, {
    body: `For "${o.title}". Review it and approve to pay ${formatCredit(o.pay_cents)}.`,
    href: `/business/campaigns/${campaignId}`,
  });
  revalidatePath(`/o/${campaignId}`);
  revalidatePath(`/business/campaigns/${campaignId}`);
  return { ok: true };
}

// ------------------------------------------------------------------- Story

/** "Participate": the person takes a spot and gets the creative to post. */
export async function participateInStory(campaignId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const o = await openOpportunity(campaignId, ctx.user.id);
  if (!o || o.kind !== "instagram_story") return fail("This campaign is no longer open.");
  if (o.business_owner_id === ctx.user.id) return fail("This is your own campaign.");
  if (ctx.instagram.status === "disconnected") return fail("Add your Instagram first.");
  const followers = await meetsFollowerRequirement(ctx.user.id, o.details.min_followers ?? null);
  if (!followers.ok) {
    return fail(`This campaign needs ${(o.details.min_followers ?? 0).toLocaleString()}+ followers.`);
  }
  if (o.approved_count >= o.slots) return fail("All spots are taken.");

  await sql(
    `insert into applications (campaign_id, applicant_id, status, decided_at)
     values ($1, $2, 'accepted', now())
     on conflict (campaign_id, applicant_id) do update set status = 'accepted', decided_at = now()`,
    [campaignId, ctx.user.id],
  );
  revalidatePath(`/o/${campaignId}`);
  return { ok: true };
}

/** Proof that the story went up: a screenshot plus the story link. */
export async function submitStoryProof(
  campaignId: string,
  input: { screenshotUrls: string[]; storyUrl: string; postedAt?: string },
): Promise<Result> {
  const ctx = await requireOnboarded();
  const o = await openOpportunity(campaignId, ctx.user.id);
  if (!o || o.kind !== "instagram_story") return fail("This campaign is no longer open.");
  const participating = await sqlOne(
    `select 1 as x from applications where campaign_id = $1 and applicant_id = $2 and status = 'accepted'`,
    [campaignId, ctx.user.id],
  );
  if (!participating) return fail("Tap Participate first.");
  const shots = (input.screenshotUrls ?? []).filter((u) => typeof u === "string").slice(0, 4);
  if (shots.length === 0) return fail("Add a screenshot of the story.");
  const storyUrl = input.storyUrl.trim().slice(0, 500);
  if (!/^https?:\/\//.test(storyUrl)) return fail("Paste the link to your story.");
  const existing = await sqlOne<{ status: string }>(
    `select status::text as status from submissions where campaign_id = $1 and creator_id = $2 order by created_at desc limit 1`,
    [campaignId, ctx.user.id],
  );
  if (existing && ["submitted", "under_review", "approved", "paid"].includes(existing.status)) {
    return fail("Your proof is already in.");
  }
  const postedAt = input.postedAt && !isNaN(new Date(input.postedAt).getTime()) ? new Date(input.postedAt).toISOString() : new Date().toISOString();
  await sql(
    `insert into submissions (campaign_id, creator_id, media_urls, note, rights_ack, meta)
     values ($1, $2, $3, $4, true, $5::jsonb)`,
    [campaignId, ctx.user.id, shots, storyUrl, JSON.stringify({ story_url: storyUrl, posted_at: postedAt, verified_by: "pending" })],
  );
  const conv = await ensureConversation("campaign", campaignId, [ctx.user.id, o.business_owner_id]);
  await systemMessage(conv, `@${ctx.user.username} sent proof of their story.`);
  await notify(o.business_owner_id, "submission", `Story proof from @${ctx.user.username}`, {
    body: `For "${o.title}". Check it and approve to pay ${formatCredit(o.pay_cents)}.`,
    href: `/business/campaigns/${campaignId}`,
  });
  revalidatePath(`/o/${campaignId}`);
  return { ok: true };
}

// ------------------------------------------------------------------ Car ad

/** A driver applies with one of their cars. Eligibility is checked again here. */
export async function applyWithVehicle(campaignId: string, vehicleId: string): Promise<Result> {
  const ctx = await requireOnboarded();
  const o = await openOpportunity(campaignId, ctx.user.id);
  if (!o || o.kind !== "car_ads") return fail("This campaign is no longer open.");
  if (o.business_owner_id === ctx.user.id) return fail("This is your own campaign.");
  const vehicle = (await getMyVehicles(ctx.user.id)).find((v) => v.id === vehicleId);
  if (!vehicle) return fail("That's not your vehicle.");
  const q = vehicleQualifies(vehicle, o);
  if (!q.ok) return fail(q.reasons[0]);

  await sql(
    `insert into applications (campaign_id, applicant_id, vehicle_id, message)
     values ($1, $2, $3, $4)
     on conflict (campaign_id, applicant_id) do update
       set vehicle_id = excluded.vehicle_id, status = 'applied', decided_at = null`,
    [campaignId, ctx.user.id, vehicleId, `${vehicle.year} ${vehicle.make} ${vehicle.model}`],
  );
  await notify(o.business_owner_id, "application", `Driver applied: ${vehicle.year} ${vehicle.make} ${vehicle.model}`, {
    body: `For "${o.title}".`, href: `/business/campaigns/${campaignId}`,
  });
  revalidatePath(`/o/${campaignId}`);
  return { ok: true };
}

/**
 * The business accepts a driver. Acceptance creates the offer + booking pair
 * the car workflow already runs on (artwork → installation → active, paid
 * monthly through the ledger). Declining just closes the application.
 */
export async function decideCarApplication(applicationId: string, decision: "accepted" | "declined"): Promise<Result> {
  const ctx = await requireOnboarded();
  const app = await sqlOne<{
    id: string; campaign_id: string; applicant_id: string; vehicle_id: string | null; status: string;
    business_id: string; pay_cents: string; details: { placements?: string[]; duration_days?: number; artwork_url?: string | null };
    title: string; business_name: string;
  }>(
    `select a.id, a.campaign_id, a.applicant_id, a.vehicle_id, a.status::text as status,
            c.business_id, c.pay_cents::text as pay_cents, c.details, c.title, b.name as business_name
       from applications a join campaigns c on c.id = a.campaign_id join businesses b on b.id = c.business_id
      where a.id = $1 and c.kind = 'car_ads'`,
    [applicationId],
  );
  if (!app) return fail("Application not found.");
  try {
    await requireBusinessMember(ctx.user.id, app.business_id, ["owner", "manager"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Not allowed.");
  }
  if (app.status !== "applied") return fail("Already decided.");
  if (decision === "declined") {
    await sql(`update applications set status = 'declined', decided_at = now() where id = $1`, [applicationId]);
    await notify(app.applicant_id, "application", `Update on "${app.title}"`, {
      body: "The business went with other drivers this time.", href: `/o/${app.campaign_id}`,
    });
    revalidatePath(`/business/campaigns/${app.campaign_id}`);
    return { ok: true };
  }
  if (!app.vehicle_id) return fail("This application has no vehicle attached.");

  const placements = (app.details.placements ?? []).length > 0 ? app.details.placements! : ["rear_window"];
  const months = Math.max(1, Math.round((app.details.duration_days ?? 30) / 30));
  const monthly = Number(app.pay_cents);

  const offer = await sqlOne<{ id: string }>(
    `insert into car_offers (vehicle_id, business_id, created_by, campaign_id, zones, monthly_cents, months, status, decided_at)
     values ($1, $2, $3, $4, $5::vehicle_zone_kind[], $6, $7, 'accepted', now()) returning id`,
    [app.vehicle_id, app.business_id, ctx.user.id, app.campaign_id, placements, monthly, months],
  );
  await sql(
    `insert into car_bookings (offer_id, vehicle_id, business_id, campaign_id, zones, monthly_cents, status, artwork_url)
     values ($1, $2, $3, $4, $5::vehicle_zone_kind[], $6,
             case when $7::text is null then 'creative_pending' else 'installation_pending' end::car_booking_status, $7)
     on conflict (offer_id) do nothing`,
    [offer!.id, app.vehicle_id, app.business_id, app.campaign_id, placements, monthly, app.details.artwork_url ?? null],
  );
  await sql(`update applications set status = 'accepted', decided_at = now() where id = $1`, [applicationId]);

  const conv = await ensureConversation("offer", offer!.id, [ctx.user.id, app.applicant_id]);
  await systemMessage(conv, `${app.business_name} accepted your car for "${app.title}" at ${formatCredit(monthly)}/month.`);
  await notify(app.applicant_id, "car_booking", "Car application accepted", {
    body: `${app.business_name} picked your car. ${app.details.artwork_url ? "Installation is next." : "Artwork is being prepared."}`,
    href: `/activity`,
  });
  revalidatePath(`/business/campaigns/${app.campaign_id}`);
  return { ok: true };
}
