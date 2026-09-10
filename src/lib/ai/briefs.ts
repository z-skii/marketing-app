import "server-only";
import { sql, sqlOne } from "@/lib/db";
import type { AiSource, CampaignBrief } from "./types";
import { normalizeBrief } from "./brief";

/**
 * Generated briefs waiting for the business in the wizard. Plain server
 * functions (not actions): the trends action saves one and redirects, the
 * wizard page reads it, createEarnCampaign marks it used.
 */

export type StoredBrief = {
  id: string;
  business_id: string;
  trend_id: string | null;
  brief: CampaignBrief;
  source: AiSource;
  status: "draft" | "used";
  created_at: string;
};

export async function saveBrief(input: {
  businessId: string;
  userId: string;
  trendId?: string | null;
  brief: CampaignBrief;
  source: AiSource;
}): Promise<string> {
  const trendId = input.trendId && /^[0-9a-f-]{36}$/i.test(input.trendId) ? input.trendId : null;
  const row = await sqlOne<{ id: string }>(
    `insert into campaign_briefs (business_id, trend_id, brief, source, created_by)
     values ($1, $2, $3::jsonb, $4, $5) returning id`,
    [input.businessId, trendId, JSON.stringify(input.brief), input.source, input.userId],
  );
  return row!.id;
}

/** A draft brief that belongs to this business, or null. */
export async function getBrief(id: string, businessId: string): Promise<StoredBrief | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const row = await sqlOne<Omit<StoredBrief, "brief"> & { brief: unknown }>(
    `select id, business_id, trend_id, brief, source, status, created_at
       from campaign_briefs where id = $1 and business_id = $2`,
    [id, businessId],
  );
  if (!row) return null;
  const brief = normalizeBrief(row.brief);
  return brief ? { ...row, brief } : null;
}

export async function markBriefUsed(id: string): Promise<void> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await sql(`update campaign_briefs set status = 'used', updated_at = now() where id = $1 and status = 'draft'`, [id]);
}
