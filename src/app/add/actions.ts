"use server";

import { randomUUID } from "node:crypto";
import { sql, sqlOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkDestinationUrl, linkAppearanceSchema, slugify } from "@/lib/validation";
import { settingInt } from "@/lib/settings";
import { createTopUpSession, isStripeConfigured } from "@/lib/stripe";

export type GoLiveInput = {
  url: string;
  displayName: string;
  shortDescription: string;
  imageUrl: string;
  board: number;   // cents
  spot: number;
  bar: number;
};

export type GoLiveResult =
  | { ok: true; redirect: string }
  | { ok: false; error: string; field?: string };

/**
 * Creates the canonical link and puts credit behind it.
 *
 * Links are approved on submission — the blocklist refuses bad domains up
 * front, and admins can suspend a link or block its whole domain at any time
 * afterwards. If the account already holds enough available credit the
 * placements go live immediately; otherwise we hand off to Stripe and the
 * allocation is applied by the webhook — never by the success redirect.
 */
export async function goLive(input: GoLiveInput): Promise<GoLiveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to go live." };

  const url = checkDestinationUrl(input.url);
  if (!url.ok) return { ok: false, error: url.reason, field: "url" };

  const blocked = await sqlOne(`select domain from blocked_domains where domain = $1`, [url.domain]);
  if (blocked) return { ok: false, error: "That domain can't be added.", field: "url" };

  const appearance = linkAppearanceSchema.safeParse({
    displayName: input.displayName,
    shortDescription: input.shortDescription,
    imageUrl: input.imageUrl || undefined,
  });
  if (!appearance.success) {
    const issue = appearance.error.issues[0];
    return { ok: false, error: issue?.message ?? "Check those details.", field: String(issue?.path[0] ?? "") };
  }

  const allocations = {
    board: Math.max(0, Math.trunc(input.board)),
    spot: Math.max(0, Math.trunc(input.spot)),
    bar: Math.max(0, Math.trunc(input.bar)),
  };
  const total = allocations.board + allocations.spot + allocations.bar;
  if (total <= 0) return { ok: false, error: "Pick at least one place and add some credit." };

  const maxTopUp = await settingInt("maximum_topup_cents");
  if (total > maxTopUp * 10) return { ok: false, error: "That's more credit than we can take at once." };

  // Reuse an existing link for the same destination rather than duplicating it.
  const existing = await sqlOne<{ id: string }>(
    `select id from links where owner_id = $1 and destination_url = $2`, [user.id, url.url],
  );

  let linkId = existing?.id;
  if (!linkId) {
    const slug = await uniqueSlug(appearance.data.displayName);
    const created = await sqlOne<{ id: string }>(
      `insert into links (owner_id, slug, destination_url, domain, display_name,
                          short_description, image_url, moderation_status)
       values ($1,$2,$3,$4,$5,$6,$7,'approved') returning id`,
      [user.id, slug, url.url, url.domain, appearance.data.displayName,
       appearance.data.shortDescription || null, appearance.data.imageUrl || null],
    );
    linkId = created!.id;
  } else {
    await sql(
      `update links set display_name = $2, short_description = $3, image_url = $4, updated_at = now()
        where id = $1`,
      [linkId, appearance.data.displayName, appearance.data.shortDescription || null,
       appearance.data.imageUrl || null],
    );
  }

  const wallet = await sqlOne<{ available_credit_cents: string }>(
    `select available_credit_cents from wallets where user_id = $1`, [user.id],
  );
  const available = Number(wallet?.available_credit_cents ?? 0);

  if (available >= total) {
    for (const [type, cents] of Object.entries(allocations)) {
      if (cents > 0) {
        await sql(`select allocate_to_placement($1,$2,$3::placement_type,$4)`,
          [user.id, linkId, type, cents]);
      }
    }
    return { ok: true, redirect: `/dashboard?live=${linkId}` };
  }

  const shortfall = total - available;
  if (!isStripeConfigured()) {
    return {
      ok: false,
      error: "Payments aren't configured yet, so credit can't be added. Your link has been saved.",
    };
  }

  const checkout = await createTopUpSession({
    userId: user.id,
    amountCents: shortfall,
    metadata: {
      link_id: linkId,
      board_cents: String(allocations.board),
      spot_cents: String(allocations.spot),
      bar_cents: String(allocations.bar),
    },
  });
  return { ok: true, redirect: checkout.url };
}

async function uniqueSlug(displayName: string): Promise<string> {
  const base = slugify(displayName);
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomUUID().slice(0, 4)}`;
    const taken = await sqlOne(`select 1 from links where slug = $1`, [candidate]);
    if (!taken) return candidate;
  }
  return `${base}-${randomUUID().slice(0, 8)}`;
}
