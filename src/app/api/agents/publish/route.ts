import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { settingBool } from "@/lib/settings";
import {
  instagramConfigured, publishToInstagram, publishToThreads, threadsConfigured,
} from "@/lib/meta-publish";

/**
 * The publish cron (every 15 minutes). Takes approved items whose
 * scheduled_for has passed (or was never set) and:
 *
 *   - platform tokens configured → posts via the Meta Graph API,
 *     status → published
 *   - not configured → status → 'ready': the item shows in /admin/content
 *     with the copy and asset one tap away for manual posting
 *
 * Drafts are included only when the owner has flipped the
 * feature_agent_auto_publish setting; otherwise approval is the gate.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 120;

type QueueItem = {
  id: string; platform: "threads" | "instagram" | "facebook" | "tiktok"; format: string;
  copy: string; asset_url: string | null; hashtags: string[] | null;
};

async function run(): Promise<Record<string, number>> {
  const autoPublish = await settingBool("feature_agent_auto_publish");
  const items = await sql<QueueItem>(
    `select id, platform, format, copy, asset_url, hashtags
       from content_queue
      where (status = 'approved' or ($1 and status = 'draft'))
        and (scheduled_for is null or scheduled_for <= now())
      order by created_at
      limit 10`,
    [autoPublish],
  );

  const out = { published: 0, ready: 0, failed: 0 };
  for (const item of items) {
    const configured =
      item.platform === "threads" ? threadsConfigured()
      : item.platform === "instagram" ? instagramConfigured()
      : false; // facebook + tiktok publish manually from the review queue
    // Only a storage-backed public URL can be handed to the platforms.
    const publicAsset =
      item.asset_url && item.asset_url.startsWith("https://") ? item.asset_url : undefined;

    const needsAsset = item.platform === "instagram" && item.format !== "caption";
    if (!configured || item.format === "carousel" || item.format === "video" || (needsAsset && !publicAsset)) {
      await sql(`update content_queue set status = 'ready' where id = $1`, [item.id]);
      out.ready++;
      continue;
    }

    try {
      const text = item.hashtags?.length
        ? `${item.copy}\n\n${item.hashtags.map((h) => `#${h}`).join(" ")}`
        : item.copy;
      const postId =
        item.platform === "threads"
          ? await publishToThreads(text, publicAsset)
          : await publishToInstagram(text, publicAsset!);
      await sql(
        `update content_queue
            set status = 'published', published_at = now(),
                publish_result = jsonb_build_object('post_id', $2::text)
          where id = $1`,
        [item.id, postId],
      );
      out.published++;
    } catch (error) {
      await sql(
        `update content_queue
            set status = 'failed',
                publish_result = jsonb_build_object('error', $2::text)
          where id = $1`,
        [item.id, error instanceof Error ? error.message : String(error)],
      );
      out.failed++;
    }
  }
  return out;
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return Boolean(secret && bearer === secret);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await run());
}
