import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/lib/db";

/**
 * Marketing recommendations for a business. When ANTHROPIC_API_KEY is set the
 * ideas come from Claude, grounded in the business's own details; otherwise a
 * deterministic playbook keyed to the category fills in. Either way every
 * idea carries a campaign prefill so "Turn into a campaign" is one tap.
 */

const MODEL = "claude-sonnet-4-6";

type Prefill = {
  kind: string; title: string; brief: string; payDollars: number;
  slots: number; requirements: string[];
};

type Idea = { title: string; body: string; prefill: Prefill };

function playbook(name: string, category: string | null, city: string | null): Idea[] {
  const where = city ? ` in ${city}` : "";
  const cat = (category ?? "local business").toLowerCase();
  return [
    {
      title: "POV visit videos are pulling views",
      body: `Short first-person "come with me to this ${cat}" videos are a reliable local format. Real customers filming a normal visit reads as authentic and gets shared${where}.`,
      prefill: {
        kind: "ugc",
        title: `POV visit video for ${name}`,
        brief: `Film a 15–25 second vertical POV video of a real visit to ${name} — walking in, the product or service, one genuine reaction. Casual phone footage is exactly right. Mention us by name once.`,
        payDollars: 40, slots: 10,
        requirements: ["15–25 seconds", "vertical 9:16", "business name mentioned", "your real visit — no stock footage"],
      },
    },
    {
      title: "Fresh photos beat stale listings",
      body: `Profiles with recent photos convert better on Google and Instagram. A local photographer can refresh your whole presence in one short shoot.`,
      prefill: {
        kind: "photography",
        title: `Photo refresh for ${name}`,
        brief: `A 1–2 hour shoot at ${name}: exterior, interior, product/service close-ups, and a few people shots. Deliver 20 edited photos we can use across Google, Instagram and the site.`,
        payDollars: 250, slots: 1,
        requirements: ["20 edited photos", "shot on location", "usable for social + Google profile"],
      },
    },
    {
      title: "Customer-voice testimonials",
      body: `Three short customer-style videos saying what's actually good about ${name} give you a month of honest-feeling content.`,
      prefill: {
        kind: "content",
        title: `3 talking videos about ${name}`,
        brief: `Make 3 short vertical videos (each 10–20s) in your own voice about ${name} — what you tried, what you'd tell a friend. Natural, not scripted-sounding.`,
        payDollars: 60, slots: 5,
        requirements: ["3 videos per approval", "10–20 seconds each", "vertical", "honest tone — no hard selling"],
      },
    },
  ];
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
          "You suggest practical local-marketing campaign ideas that ordinary people and local creators can execute for a small business. Reply with ONLY a JSON array of exactly 3 objects: {title, body, prefill:{kind (one of ugc|content|photography|videography|general), title, brief, payDollars (number), slots (number), requirements (string[])}}. Realistic pay: UGC $25-75, photography $150-400, videography $200-600. No emojis. Never invent statistics.",
        messages: [{
          role: "user",
          content: `Business: ${b.name}\nCategory: ${b.category ?? "unknown"}\nCity: ${b.city ?? "unknown"}\nAbout: ${b.description ?? "n/a"}`,
        }],
      });
      const text = response.content.find((c) => c.type === "text")?.text ?? "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Idea[];
        const valid = parsed.filter((i) =>
          i?.title && i?.body && i?.prefill?.title && i?.prefill?.brief &&
          typeof i.prefill.payDollars === "number");
        if (valid.length >= 2) ideas = valid.slice(0, 3);
      }
    } catch (error) {
      console.error("recommendations fell back to playbook:", error);
    }
  }

  await sql(`update marketing_recommendations set status = 'dismissed' where business_id = $1 and status = 'new'`, [businessId]);
  for (const idea of ideas) {
    await sql(
      `insert into marketing_recommendations (business_id, title, body, prefill)
       values ($1, $2, $3, $4)`,
      [businessId, idea.title.slice(0, 200), idea.body.slice(0, 1000), JSON.stringify(idea.prefill)],
    );
  }
  return ideas.length;
}
