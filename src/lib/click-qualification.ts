/**
 * Cheap, privacy-conscious pre-checks that run before the database is asked to
 * charge anyone. Anything subtler — duplicate windows, credit, ownership — is
 * decided inside the atomic SQL function so it cannot race.
 */

const BOT_PATTERNS = [
  /bot\b/i, /crawler/i, /spider/i, /slurp/i, /headless/i, /phantomjs/i,
  /curl\//i, /wget\//i, /python-requests/i, /axios\//i, /node-fetch/i, /go-http-client/i,
  /facebookexternalhit/i, /whatsapp/i, /telegrambot/i, /discordbot/i, /slackbot/i,
  /twitterbot/i, /linkedinbot/i, /embedly/i, /preview/i, /monitor/i, /uptime/i,
  /lighthouse/i, /pagespeed/i, /gtmetrix/i, /pingdom/i,
];

export type PreCheck = { rejection: string | null };

export function preQualify(input: {
  method: string;
  userAgent: string | null;
  secPurpose: string | null;
  purpose: string | null;
  mozPrefetch: string | null;
  secFetchMode: string | null;
}): PreCheck {
  if (input.method !== "GET") return { rejection: "non_get_request" };

  const ua = input.userAgent ?? "";
  if (!ua.trim()) return { rejection: "missing_user_agent" };
  if (BOT_PATTERNS.some((pattern) => pattern.test(ua))) return { rejection: "bot_user_agent" };

  // Browser and proxy prefetching must never be billed as a real open.
  const prefetchSignals = [input.secPurpose, input.purpose, input.mozPrefetch]
    .filter(Boolean)
    .map((value) => value!.toLowerCase());
  if (prefetchSignals.some((value) => value.includes("prefetch") || value.includes("preview"))) {
    return { rejection: "prefetch" };
  }

  return { rejection: null };
}
