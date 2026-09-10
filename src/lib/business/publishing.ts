import "server-only";
import { sqlOne } from "@/lib/db";
import { instagramConfigured } from "@/lib/meta-publish";

/**
 * Publishing states for calendar posts and an honest answer to "can TapMart
 * post this for me?". Auto-publishing needs two things at once: provider
 * credentials on the server (meta-publish) and a connected account for the
 * business (connected_accounts, status connected). Until both exist the
 * product hands the business clear manual instructions instead. Real OAuth
 * per provider is documented in docs/business-services.md and not built here.
 */

export type PublishState = "draft" | "ready" | "approved" | "scheduled" | "publishing" | "published" | "failed";

export type PublishProvider = "instagram" | "facebook" | "tiktok" | "google_business";

export const PUBLISH_PROVIDERS: PublishProvider[] = ["instagram", "facebook", "tiktok", "google_business"];

export type ProviderPublishStatus = {
  provider: PublishProvider;
  /** Server credentials for a publishing API exist. */
  configured: boolean;
  /** The business's own account state; "none" when it never asked to connect. */
  connection: "none" | "disconnected" | "pending" | "connected" | "error";
  /** True only when TapMart can actually publish on the business's behalf. */
  canAutoPublish: boolean;
  /** Which route publishing takes today. */
  mode: "api" | "manual";
  reason: string;
};

/** The calendar_post_status values map onto publishing states like this. */
export function publishStateFromPostStatus(status: string): PublishState {
  switch (status) {
    case "idea":
    case "draft":
      return "draft";
    case "needs_approval":
      return "ready";
    case "approved":
      return "approved";
    case "scheduled":
      return "scheduled";
    case "published":
      return "published";
    case "failed":
      return "failed";
    default:
      return "draft";
  }
}

/**
 * Server-side credentials per provider. Only Instagram has a publishing
 * client (meta-publish); Facebook Pages, TikTok and Google Business Profile
 * posting are not built, so they are honestly "not configured".
 */
export function providerConfigured(provider: PublishProvider): boolean {
  return provider === "instagram" ? instagramConfigured() : false;
}

const PROVIDER_NAMES: Record<PublishProvider, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google Business Profile",
};

export async function publishProviderStatus(
  provider: PublishProvider,
  businessId?: string,
): Promise<ProviderPublishStatus> {
  const configured = providerConfigured(provider);
  let connection: ProviderPublishStatus["connection"] = "none";
  if (businessId) {
    const row = await sqlOne<{ status: ProviderPublishStatus["connection"] }>(
      `select status::text as status from connected_accounts where business_id = $1 and provider = $2`,
      [businessId, provider],
    );
    if (row) connection = row.status;
  }
  const canAutoPublish = configured && connection === "connected";
  const name = PROVIDER_NAMES[provider];
  let reason: string;
  if (canAutoPublish) reason = `${name} is connected. Approved posts can be published for you.`;
  else if (!configured && connection === "connected") reason = `${name} publishing is not set up on the server yet. Post by hand for now.`;
  else if (configured && connection === "pending") reason = `Your ${name} connection is waiting to be completed.`;
  else if (configured) reason = `Connect ${name} to let TapMart publish for you.`;
  else reason = `${name} auto-posting is not available yet. Post by hand from the calendar.`;

  return { provider, configured, connection, canAutoPublish, mode: canAutoPublish ? "api" : "manual", reason };
}

export type ManualPublishPost = {
  platform: string;
  format?: string | null;
  title: string;
  copy?: string | null;
  caption?: string | null;
  media_urls?: string[] | null;
  thumbnail_url?: string | null;
  scheduled_for?: string | Date | null;
  recommended_time?: string | Date | null;
};

export type ManualPublishInstructions = {
  provider: string;
  when: string | null;
  steps: string[];
  caption: string | null;
  media: string[];
};

function whenText(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** What to do by hand when auto-publishing is not available. Plain steps, no guesswork. */
export function manualPublishInstructions(post: ManualPublishPost): ManualPublishInstructions {
  const media = [...(post.media_urls ?? []), ...(post.thumbnail_url ? [post.thumbnail_url] : [])]
    .filter((u, i, all) => Boolean(u) && all.indexOf(u) === i);
  const caption = post.caption ?? post.copy ?? null;
  const when = whenText(post.scheduled_for) ?? whenText(post.recommended_time);
  const format = post.format ?? "post";
  const platform = PROVIDER_NAMES[post.platform as PublishProvider] ?? post.platform;

  const steps: string[] = [];
  if (media.length) steps.push(`Save the ${media.length === 1 ? "file" : "files"} listed below to your phone.`);
  else steps.push(`Shoot or pick the media for "${post.title}".`);
  steps.push(`Open ${platform} and start a new ${format === "post" ? "post" : format}.`);
  if (media.length) steps.push("Add the saved media.");
  if (caption) steps.push("Paste the caption below. Edit it if it does not sound like you.");
  else steps.push("Write a caption in one or two plain sentences.");
  if (when) steps.push("Publish at the recommended time, or use the app's own scheduler.");
  else steps.push("Publish when it is ready.");
  steps.push("Back in TapMart, mark the calendar post as published.");

  return { provider: platform, when, steps, caption, media };
}
