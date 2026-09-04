import "server-only";

/**
 * Threads + Instagram publishing via the Meta Graph API.
 *
 * This client is real — the endpoints and flows below are the documented
 * two-step container→publish calls — but it only activates when the owner
 * has created a Meta developer app and set the tokens:
 *
 *   THREADS_ACCESS_TOKEN, THREADS_USER_ID  — Threads API (long-lived token)
 *   IG_ACCESS_TOKEN, IG_USER_ID            — Instagram Graph API
 *                                            (Business/Creator account)
 *
 * Until then isConfigured() is false and the publish cron marks items
 * 'ready' for one-tap manual posting from /admin/content instead.
 */

const THREADS_API = "https://graph.threads.net/v1.0";
const IG_API = "https://graph.facebook.com/v21.0";

export function threadsConfigured(): boolean {
  return Boolean(process.env.THREADS_ACCESS_TOKEN && process.env.THREADS_USER_ID);
}

export function instagramConfigured(): boolean {
  return Boolean(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID);
}

async function graph(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const message =
      (json.error as { message?: string } | undefined)?.message ?? `HTTP ${response.status}`;
    throw new Error(`Meta Graph API: ${message}`);
  }
  return json;
}

/** Text (optionally with an image) to Threads. Returns the platform post id. */
export async function publishToThreads(text: string, imageUrl?: string): Promise<string> {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;
  if (!token || !userId) throw new Error("Threads is not configured (THREADS_ACCESS_TOKEN / THREADS_USER_ID).");

  const container = await graph(`${THREADS_API}/${userId}/threads`, {
    access_token: token,
    media_type: imageUrl ? "IMAGE" : "TEXT",
    text,
    ...(imageUrl ? { image_url: imageUrl } : {}),
  });
  const publish = await graph(`${THREADS_API}/${userId}/threads_publish`, {
    access_token: token,
    creation_id: String(container.id),
  });
  return String(publish.id);
}

/** Image + caption to the Instagram feed. Returns the platform media id. */
export async function publishToInstagram(caption: string, imageUrl: string): Promise<string> {
  const token = process.env.IG_ACCESS_TOKEN;
  const userId = process.env.IG_USER_ID;
  if (!token || !userId) throw new Error("Instagram is not configured (IG_ACCESS_TOKEN / IG_USER_ID).");

  const container = await graph(`${IG_API}/${userId}/media`, {
    access_token: token,
    image_url: imageUrl,
    caption,
  });
  const publish = await graph(`${IG_API}/${userId}/media_publish`, {
    access_token: token,
    creation_id: String(container.id),
  });
  return String(publish.id);
}
