import { EarnFilm } from "./x/site/EarnFilm";
import { PublicNav, PublicStrip, PublicFooter } from "./x/site/Shell";
import { Post, GetPaid } from "./x/site/Earn";
import { FindPeople, FindCars, CreateThree, Review, Content } from "./x/site/Business";
import { DriveIsland, LoopIsland } from "./x/site/Islands";

/**
 * V3 Public Homepage at /design-lab-v3 (docs/design-lab-v3/screens/
 * x-public-home.md). One shared brief with two viewpoints, then the
 * earning story (Recreate, Post, Drive, Get paid), then the business run
 * (Find people, Find cars, Create, Review, Monthly content) and the
 * source preserving Loyalty loop. Fixture data only; nothing
 * authenticates, sends or moves money. ?audience=earn|business selects
 * the hero lens on the client; both stories are always in the document.
 * The route is prerendered; the Drive and Loyalty scenes are islands that
 * load when they come near (x/site/Islands.tsx); the business run keeps
 * its own height in the document so every anchor lands where it should.
 */
export default function V3PublicHome() {
  return (
    <div className="x-site" id="top">
      <PublicNav />
      <PublicStrip />
      <main>
        <EarnFilm />
        <div id="earn" className="x-world" aria-label="Make money">
          <Post /><DriveIsland /><GetPaid />
        </div>
        <div id="business" className="x-world x-world-business" aria-label="Grow your business">
          <FindPeople /><FindCars /><CreateThree /><Review /><Content /><LoopIsland />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
