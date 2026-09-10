/**
 * Business subscription plans. Two, on purpose. Prices are app settings
 * (plan_essential_cents / plan_growth_cents) so they change without a deploy;
 * this file owns names, copy and the honest feature lists. A feature listed
 * here exists in the product today; anything coming later says so.
 *
 * The subscription never includes campaign spend: campaign budgets are funded
 * separately and go to the people who do the work.
 */

export type PlanKey = "essential" | "growth";

export type PlanFeature = { label: string; soon?: boolean };

/**
 * Content shoots included each month: how many visits from a photographer or
 * videographer, and the photos and videos delivered across them. Configurable
 * here; src/lib/business/shoots.ts reads these when it plans the month.
 */
export type PlanShoots = { perMonth: number; photos: number; videos: number };

export type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  cta: string;
  priceSetting: "plan_essential_cents" | "plan_growth_cents";
  features: PlanFeature[];
  shoots: PlanShoots;
};

export const PLANS: Plan[] = [
  {
    key: "essential",
    name: "Essential",
    tagline: "Best for getting your marketing organized.",
    cta: "Start Essential",
    priceSetting: "plan_essential_cents",
    shoots: { perMonth: 1, photos: 10, videos: 3 },
    features: [
      { label: "Business profile and brand kit" },
      { label: "One content shoot a month: 10 photos and 3 videos" },
      { label: "Content calendar" },
      { label: "Ideas for your business" },
      { label: "Business health overview" },
      { label: "Recreate, Story and Car campaigns" },
      { label: "Campaign dashboard" },
      { label: "Google and social account connections", soon: true },
    ],
  },
  {
    key: "growth",
    name: "Growth",
    tagline: "For businesses that want deeper management and insights.",
    cta: "Choose Growth",
    priceSetting: "plan_growth_cents",
    shoots: { perMonth: 2, photos: 20, videos: 6 },
    features: [
      { label: "Everything in Essential" },
      { label: "Two content shoots a month: 20 photos and 6 videos" },
      { label: "Trending content for your category" },
      { label: "Campaign briefs generated from trends" },
      { label: "Priority support" },
      { label: "Team access", soon: true },
      { label: "Multiple locations", soon: true },
      { label: "Deeper performance analytics", soon: true },
    ],
  },
];

/** "1 content shoot a month: 10 photos, 3 videos", built from the plan's numbers. */
export function shootsLine(s: PlanShoots): string {
  return `${s.perMonth} content shoot${s.perMonth === 1 ? "" : "s"} a month: ${s.photos} photos, ${s.videos} videos`;
}

export const PLAN_BY_KEY: Record<PlanKey, Plan> = {
  essential: PLANS[0],
  growth: PLANS[1],
};

/** Differences worth a second look, for the small "Compare plans" section. */
export const PLAN_COMPARE: { label: string; essential: string; growth: string }[] = [
  { label: "Campaign types", essential: "All three", growth: "All three" },
  { label: "Content shoots a month", essential: "1 (10 photos, 3 videos)", growth: "2 (20 photos, 6 videos)" },
  { label: "Trending content", essential: "No", growth: "Yes" },
  { label: "Campaign briefs from trends", essential: "No", growth: "Yes" },
  { label: "Support", essential: "Standard", growth: "Priority" },
  { label: "Team access", essential: "Coming later", growth: "Coming later" },
];
