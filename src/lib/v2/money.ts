import "server-only";
import type { PoolClient } from "pg";
import { transaction } from "@/lib/db";
import { settingInt } from "@/lib/settings";

/**
 * V2 marketplace money. Runs on the existing rails: businesses hold credit in
 * `wallets` (funded by the existing Stripe top-up flow), and every movement
 * writes `credit_ledger` rows — the database is the authority, never the
 * client. The platform fee percent is an admin setting, not a constant baked
 * into components.
 *
 * payMarketplaceWork moves money once for a unit of completed work:
 *   business wallet  -pay             (campaign_payment)
 *   platform fee     +fee             (platform_fee row, no wallet)
 *   worker earnings  +pay - fee       (earnings row, withdrawn via payouts)
 */

export class InsufficientCreditError extends Error {
  constructor(shortCents: number) {
    super(
      `Not enough credit — add ${Math.ceil(shortCents / 100)} more dollars to your wallet first.`,
    );
  }
}

export async function platformFeeCents(amountCents: number): Promise<number> {
  const pct = await settingInt("platform_fee_pct");
  return Math.floor((amountCents * Math.min(Math.max(pct, 0), 50)) / 100);
}

export async function payMarketplaceWork(options: {
  payerId: string; // business owner whose wallet funds the work
  workerId: string;
  amountCents: number;
  source: "submission" | "booking" | "adjustment";
  sourceId: string | null;
  memo: string;
}): Promise<{ earningCents: number; feeCents: number }> {
  const { payerId, workerId, amountCents, source, sourceId, memo } = options;
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new Error("Bad amount.");
  const feeCents = await platformFeeCents(amountCents);
  const earningCents = amountCents - feeCents;

  await transaction(async (client: PoolClient) => {
    const wallet = await client.query(
      `select available_credit_cents from wallets where user_id = $1 for update`,
      [payerId],
    );
    const available = Number(wallet.rows[0]?.available_credit_cents ?? 0);
    if (available < amountCents) throw new InsufficientCreditError(amountCents - available);

    await client.query(
      `update wallets set available_credit_cents = available_credit_cents - $2, updated_at = now()
        where user_id = $1`,
      [payerId, amountCents],
    );
    // The payer's wallet movement goes through the existing ledger with real
    // before/after balances; the worker's side is the earnings ledger below
    // (earnings are not wallet credit — they leave through payout requests).
    await client.query(
      `insert into credit_ledger (user_id, amount_cents, transaction_type,
                                  balance_before_cents, balance_after_cents,
                                  related_entity_type, related_entity_id, reason)
       values ($1, $2, 'campaign_payment', $3, $4, $5, $6, $7)`,
      [payerId, -amountCents, available, available - amountCents, source, sourceId, memo],
    );
    const inserted = await client.query(
      `insert into earnings (profile_id, source, source_id, amount_cents, fee_cents, status)
       values ($1, $2, $3, $4, $5, 'available')
       on conflict (source, source_id) where source_id is not null do nothing
       returning id`,
      [workerId, source, sourceId, earningCents, feeCents],
    );
    if (inserted.rowCount === 0) throw new Error("This work has already been paid.");
  });

  return { earningCents, feeCents };
}
