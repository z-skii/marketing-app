import { sql, sqlOne } from "@/lib/db";
import { storeMedia } from "@/lib/v2/media";
import type { ImageBytes, Usage } from "./client";
import type { CreativeAssetType, CreativeBrief, CreativeReview } from "./director";

/**
 * The creative asset library (table creative_assets). Generated images are
 * stored through the same media storage as every upload, then recorded with
 * their brief, review, models, version chain and usage. Generation is never
 * approval: assets start as drafts and a person approves or rejects them.
 */

export type CreativeAsset = {
  id: string; business_id: string; campaign_id: string | null; type: CreativeAssetType;
  status: "draft" | "approved" | "rejected"; stage: "draft" | "final";
  url: string; aspect: string; size: string | null; width: number | null; height: number | null;
  director_model: string; image_model: string; prompt: string; version: number; round: number; parent_id: string | null;
  source_urls: string[]; brief: CreativeBrief; review: CreativeReview | null; usage: Usage[];
  created_by: string | null; created_at: string; approved_at: string | null; approved_by: string | null;
};

const COLS = `id, business_id, campaign_id, type, status, stage, url, aspect, size, width, height, director_model, image_model, prompt,
  version, round, parent_id, source_urls, brief, review, usage, created_by, created_at::text as created_at, approved_at::text as approved_at, approved_by`;

export type NewAsset = {
  businessId: string; campaignId?: string | null; type: CreativeAssetType; stage: "draft" | "final";
  image: ImageBytes; aspect: string; size: string | null; width?: number | null; height?: number | null;
  directorModel: string; imageModel: string; prompt: string; version?: number; round: number; parentId?: string | null;
  sourceUrls: string[]; brief: CreativeBrief; review: CreativeReview | null; usage: Usage[]; createdBy?: string | null;
};

/** Store the image, then the row. Returns the saved asset. */
export async function saveCreativeAsset(a: NewAsset): Promise<CreativeAsset> {
  const stored = await storeMedia("creative", { bytes: toArrayBuffer(a.image.bytes), contentType: a.image.contentType });
  if ("error" in stored) throw new Error(`Could not store the creative: ${stored.error}`);
  const row = await sqlOne<CreativeAsset>(
    `insert into creative_assets (business_id, campaign_id, type, stage, url, aspect, size, width, height, director_model, image_model, prompt,
        version, round, parent_id, source_urls, brief, review, usage, created_by)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb, $18::jsonb, $19::jsonb, $20)
     returning ${COLS}`,
    [a.businessId, a.campaignId ?? null, a.type, a.stage, stored.url, a.aspect, a.size, a.width ?? null, a.height ?? null, a.directorModel, a.imageModel, a.prompt,
      a.version ?? 1, a.round, a.parentId ?? null, a.sourceUrls, JSON.stringify(a.brief), a.review ? JSON.stringify(a.review) : null, JSON.stringify(a.usage), a.createdBy ?? null],
  );
  if (!row) throw new Error("Insert returned no row.");
  return row;
}

export async function getCreativeAsset(id: string, businessId: string): Promise<CreativeAsset | null> {
  return sqlOne<CreativeAsset>(`select ${COLS} from creative_assets where id = $1 and business_id = $2`, [id, businessId]);
}

export async function listCreativeAssets(businessId: string, filter: { type?: CreativeAssetType; status?: CreativeAsset["status"]; campaignId?: string; limit?: number } = {}): Promise<CreativeAsset[]> {
  return sql<CreativeAsset>(
    `select ${COLS} from creative_assets
      where business_id = $1 and ($2::text is null or type = $2) and ($3::text is null or status = $3) and ($4::uuid is null or campaign_id = $4)
      order by created_at desc limit $5`,
    [businessId, filter.type ?? null, filter.status ?? null, filter.campaignId ?? null, Math.min(filter.limit ?? 50, 200)],
  );
}

/** A person decides. Approval is the only way an asset can enter a campaign or publishing flow. */
export async function setCreativeAssetStatus(id: string, businessId: string, status: "approved" | "rejected" | "draft", by: string | null): Promise<CreativeAsset | null> {
  return sqlOne<CreativeAsset>(
    `update creative_assets set status = $3, approved_at = case when $3 = 'approved' then now() else null end, approved_by = case when $3 = 'approved' then $4 else null end
      where id = $1 and business_id = $2 returning ${COLS}`,
    [id, businessId, status, by],
  );
}

/** Sum of what a chain of versions cost, for the usage line on a job. */
export function totalUsage(usage: Usage[]): { input_tokens: number; output_tokens: number; images: number; calls: number } {
  return usage.reduce((t, u) => ({ input_tokens: t.input_tokens + (u.input_tokens ?? 0), output_tokens: t.output_tokens + (u.output_tokens ?? 0), images: t.images + (u.images ?? 0), calls: t.calls + 1 }), { input_tokens: 0, output_tokens: 0, images: 0, calls: 0 });
}

function toArrayBuffer(b: Buffer): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
}
