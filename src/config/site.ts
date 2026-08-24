/**
 * Central site identity. The brand is TapMart and the production domain is
 * tapmart.live. Renaming the product or moving domains should mean editing
 * this file and nothing else.
 */
export const SITE_NAME = "TapMart";
export const SITE_TAGLINE = "What's getting clicked right now?";
const siteUrlOverride = process.env.NEXT_PUBLIC_SITE_URL?.trim();
export const SITE_URL =
  (siteUrlOverride && /^https?:\/\/[\x21-\x7e]+$/.test(siteUrlOverride)
    ? siteUrlOverride
    : undefined) ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://tapmart.live");

export const SITE_DESCRIPTION =
  "A live board of links competing for attention. Add your link, add credit, get seen.";

/**
 * Public contact address. Null until a real mailbox exists — the footer hides
 * the Contact link while this is unset. When support@tapmart.live is
 * configured, set it here.
 */
export const CONTACT_EMAIL: string | null = null;

export const siteMetadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website" as const,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

/** Public-facing vocabulary. Kept in one place so the product voice stays consistent. */
export const COPY = {
  spot: "The Spot",
  topThree: "Top 3",
  board: "The Board",
  bar: "The Bar",
  addLink: "Add Your Link",
  goLive: "Go Live",
  addCredit: "Add Credit",
  topUp: "Top Up",
  earn: "Earn",
  open: "Open",
  outOfCredit: "Out of Credit",
} as const;
