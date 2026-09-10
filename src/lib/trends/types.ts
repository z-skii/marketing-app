/**
 * Viral content discovery: shapes shared by every trend provider.
 *
 * TapMart never invents platform numbers. A provider either has a real
 * figure (with its origin) or leaves `views` null. Development fixtures are
 * labelled `fixture` and are only served when dev auth is on.
 */

export type TrendSource = "manual" | "curated" | "fixture" | "api";

export type TrendPlatform = "instagram" | "tiktok" | "youtube" | "other";

export type TrendItem = {
  id: string;
  source: TrendSource;
  business_id: string | null;
  category: string | null;
  title: string;
  platform: TrendPlatform;
  reference_url: string | null;
  /** Playable media when TapMart is allowed to serve it, else null. */
  media_url: string | null;
  thumbnail_url: string | null;
  /** Real view count when known, else null. Never estimated. */
  views: number | null;
  /** Short plain-language note such as "Rising this week". */
  growth_note: string | null;
  /** Why it fits this business, one sentence. */
  fit_note: string | null;
  created_at: string;
};

export type TrendContext = {
  businessId: string;
  category: string | null;
  city: string | null;
};

export interface TrendProvider {
  id: TrendSource;
  label: string;
  /** Whether this provider can return anything in the current environment. */
  available(): boolean;
  fetch(ctx: TrendContext): Promise<TrendItem[]>;
}
