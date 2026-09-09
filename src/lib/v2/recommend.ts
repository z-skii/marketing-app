import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/lib/db";

/**
 * Marketing recommendations for a business: one trend-style entry and two
 * ideas, every one a prefilled campaign of one of the three kinds the
 * product runs (recreate_reel, instagram_story, car_ads). When
 * ANTHROPIC_API_KEY is set the set comes from Claude, grounded in the
 * business's own details; otherwise a deterministic playbook keyed to the
 * category fills in. A trend's stat is a description of what is being seen,
 * never an invented number.
 */

const MODEL = "claude-sonnet-4-6";

export const IDEA_KINDS = ["recreate_reel", "instagram_story", "car_ads"] as const;
type IdeaKind = (typeof IDEA_KINDS)[number];

type Prefill = {
  kind: IdeaKind; title: string; brief: string; payDollars: number;
  slots: number; requirements: string[];
};

type Idea = {
  kind: "trend" | "idea";
  title: string;
  body: string;
  /** Trends only: what is being seen, in words. */
  stat?: string | null;
  referenceUrl?: string | null;
  prefill: Prefill;
};

const PAY_RANGE: Record<IdeaKind, [number, number]> = {
  recreate_reel: [25, 100],
  instagram_story: [10, 40],
  car_ads: [150, 350],
};

function playbook(name: string, category: string | null, city: string | null): Idea[] {
  const where = city ? ` in ${city}` : "";
  const cat = (category ?? "local business").toLowerCase();
  return [
    {
      kind: "trend",
      title: "First-person visit videos",
      body: `Short "come with me to this ${cat}" clips filmed by real customers are the format local accounts are sharing right now. Casual phone footage, one genuine reaction, no script.`,
      stat: `Format seen across local ${cat} accounts this season`,
      referenceUrl: null,
      prefill: {
        kind: "recreate_reel",
        title: `Recreate our visit video`,
        brief: `Film a 15 to 25 second vertical first-person video of a real visit to ${name}: walking in, the product or service, one honest reaction. Casual phone footage is exactly right. Say ${name} once.`,
        payDollars: 50, slots: 10,
        requirements: ["15 to 25 seconds", "Vertical 9:16", `Say ${name} once`, "Your real visit, no stock footage"],
      },
    },
    {
      kind: "idea",
      title: "Put one offer in front of local followers",
      body: `A ready-made Story with a single clear offer, posted by people${where} who already have an audience, reaches more locals than another post on your own account.`,
      prefill: {
        kind: "instagram_story",
        title: `Post our ${name} Story`,
        brief: `Post this Story exactly as it is and keep it live 24 hours. Send a screenshot and the link when it is up.`,
        payDollars: 25, slots: 20,
        requirements: ["Keep it live 24 hours", "Do not crop or edit the creative"],
      },
    },
    {
      kind: "idea",
      title: "Three cars around town for a month",
      body: `Rear-window decals on cars that park where your customers walk reach the same people every day. Thirty days, paid monthly, drivers apply and you pick.`,
      prefill: {
        kind: "car_ads",
        title: `Drivers wanted${where}`,
        brief: `Drive with a ${name} rear-window decal for 30 days. We arrange printing and installation with you. Send one photo of the car each week.`,
        payDollars: 250, slots: 3,
        requirements: ["30 day campaign", "One photo of the artwork each week"],
      },
    },
  ];
}

function isIdeaKind(k: unknown): k is IdeaKind {
  return typeof k === "string" && (IDEA_KINDS as readonly string[]).includes(k);
}

function clampPay(kind: IdeaKind, dollars: number) {
  const [lo, hi] = PAY_RANGE[kind];
  return Math.min(Math.max(Math.round(dollars), lo), hi);
}

export async function refreshRecommendations(businessId: string): Promise<number> {
  const business = await sql<{ name: string; category: string | null; city: string | null; description: string | null }>(
    `select name, category, city, description from businesses where id = $1`,
    [businessId],
  );
  if (business.length === 0) return 0;
  const b = business[0];

  let ideas = playbook(b.name, b.category, b.city);

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system:
          "You suggest practical local-marketing campaigns that ordinary people can carry out for a small business. " +
          "TapMart runs exactly three campaign types and you may use no others: " +
          "recreate_reel (people recreate a short reference video, paid per approved video, $25 to $100), " +
          "instagram_story (people post a ready-made Story and keep it live 24 hours, paid per story, $10 to $40), " +
          "car_ads (drivers carry a decal or wrap on their car, paid per car per month, $150 to $350). " +
          "Reply with ONLY a JSON array of exactly 3 objects. The first has kind \"trend\": a content format currently working for this category, " +
          "with a stat field that describes what is being seen in words (for example \"Format seen across local coffee accounts this month\"), never a number or percentage. " +
          "The other two have kind \"idea\". Each object: {kind, title, body, stat (trend only), prefill:{kind (recreate_reel|instagram_story|car_ads), title, brief, payDollars (number), slots (number), requirements (string[])}}. " +
          "Short, direct sentences. No emojis. No dashes in text. Never invent statistics or links.",
        messages: [{
          role: "user",
          content: `Business: ${b.name}\nCategory: ${b.category ?? "unknown"}\nCity: ${b.city ?? "unknown"}\nAbout: ${b.description ?? "n/a"}`,
        }],
      });
      const text = response.content.find((c) => c.type === "text")?.text ?? "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Partial<Idea>[];
        const valid: Idea[] = parsed
          .filter((i) => i?.title && i?.body && i?.prefill?.title && i?.prefill?.brief
            && isIdeaKind(i.prefill.kind) && typeof i.prefill.payDollars === "number")
          .map((i, index) => {
            const kind = i.prefill!.kind as IdeaKind;
            const stat = typeof i.stat === "string" && !/\d/.test(i.stat) ? i.stat : null;
            return {
              kind: index === 0 || i.kind === "trend" ? "trend" : "idea",
              title: String(i.title),
              body: String(i.body),
              stat,
              referenceUrl: null,
              prefill: {
                kind,
                title: String(i.prefill!.title),
                brief: String(i.prefill!.brief),
                payDollars: clampPay(kind, i.prefill!.payDollars as number),
                slots: Math.min(Math.max(Math.round(Number(i.prefill!.slots) || 5), 1), 100),
                requirements: Array.isArray(i.prefill!.requirements)
                  ? i.prefill!.requirements.filter((r) => typeof r === "string").slice(0, 8) : [],
              },
            };
          });
        if (valid.length >= 2) ideas = valid.slice(0, 3);
      }
    } catch (error) {
      console.error("recommendations fell back to playbook:", error);
    }
  }

  await sql(`update marketing_recommendations set status = 'dismissed' where business_id = $1 and status = 'new'`, [businessId]);
  for (const idea of ideas) {
    await sql(
      `insert into marketing_recommendations (business_id, kind, title, body, stat, reference_url, prefill)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        businessId, idea.kind, idea.title.slice(0, 200), idea.body.slice(0, 1000),
        idea.kind === "trend" ? (idea.stat?.slice(0, 200) ?? null) : null,
        idea.referenceUrl ?? null, JSON.stringify(idea.prefill),
      ],
    );
  }
  return ideas.length;
}
