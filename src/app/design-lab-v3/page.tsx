import { Hero, type Audience } from "./x/site/Hero";
import { PublicNav, PublicStrip, PublicFooter } from "./x/site/Shell";
import { Recreate, Post, Drive, GetPaid } from "./x/site/Earn";
import { FindPeople, FindCars, CreateThree, Review, Content } from "./x/site/Business";
import { Loop } from "./x/site/Loop";

/**
 * V3 Public Homepage at /design-lab-v3 (docs/design-lab-v3/screens/
 * x-public-home.md). One shared brief with two viewpoints, then the
 * earning story (Recreate, Post, Drive, Get paid), then the business run
 * (Find people, Find cars, Create, Review, Monthly content) and the
 * source preserving Loyalty loop. Fixture data only; nothing
 * authenticates, sends or moves money. ?audience=earn|business selects
 * the hero lens; both stories are always in the document.
 */
export default async function V3PublicHome({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const audience: Audience = sp.audience === "business" ? "business" : "earn";
  return (
    <div className="x-site" id="top">
      <PublicNav />
      <PublicStrip />
      <main>
        <Hero initial={audience} />
        <div id="earn" className="x-world" aria-label="Make money">
          <Recreate /><Post /><Drive /><GetPaid />
        </div>
        <div id="business" className="x-world x-world-business" aria-label="Grow your business">
          <FindPeople /><FindCars /><CreateThree /><Review /><Content /><Loop />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
