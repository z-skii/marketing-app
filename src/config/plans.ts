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

export type Plan = {
  key: PlanKey;
  name: string;
  tagline: string;
  cta: string;
  priceSetting: "plan_essential_cents" | "plan_growth_cents";
  features: PlanFeature[];
};

export const PLANS: Plan[] = [
  {
    key: "essential",
    name: "Essential",
    tagline: "Best for getting your marketing organized.",
    cta: "Start Essential",
    priceSetting: "plan_essential_cents",
    features: [
      { label: "Business profile and brand kit" },
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
    features: [
      { label: "Everything in Essential" },
      { label: "Trending content for your category" },
      { label: "Campaign briefs generated from trends" },
      { label: "Priority support" },
      { label: "Team access", soon: true },
      { label: "Multiple locations", soon: true },
      { label: "Deeper performance analytics", soon: true },
    ],
  },
];

export const PLAN_BY_KEY: Record<PlanKey, Plan> = {
  essential: PLANS[0],
  growth: PLANS[1],
};

/** Differences worth a second look, for the small "Compare plans" section. */
export const PLAN_COMPARE: { label: string; essential: string; growth: string }[] = [
  { label: "Campaign types", essential: "All three", growth: "All three" },
  { label: "Trending content", essential: "No", growth: "Yes" },
  { label: "Campaign briefs from trends", essential: "No", growth: "Yes" },
  { label: "Support", essential: "Standard", growth: "Priority" },
  { label: "Team access", essential: "Coming later", growth: "Coming later" },
];
