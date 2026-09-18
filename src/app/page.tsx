import { PLANS } from "@/config/plans";
import { getSettings } from "@/lib/settings";
import { getV2Context } from "@/lib/v2/core";
import { planPrices } from "@/lib/v2/subscriptions";
import { MotionProvider } from "@/v3/motion";
import { EarnFilm } from "@/v3/site/EarnFilm";
import { PublicNav, PublicStrip, PublicFooter } from "@/v3/site/Shell";
import { Post, GetPaid } from "@/v3/site/Earn";
import { FindPeople, FindCars, CreateThree, Review, Content } from "@/v3/site/Business";
import { DriveIsland, LoopIsland } from "@/v3/site/Islands";
import { Plans } from "@/v3/site/Plans";
import "@/v3/v3.css";
import "@/v3/prod.css";

export const dynamic = "force-dynamic";

/**
 * The public front door in the approved V3 language (docs/design-lab-v3/
 * screens/x-public-home.md, migrated from /design-lab-v3): one shared
 * brief with two viewpoints, the earning story (Recreate, Post, Drive,
 * Get paid), the business run (Find people, Find cars, Create, Review,
 * Monthly content), the Loyalty sequence as a coming soon feature, then
 * the real plans. People, businesses, campaigns and amounts in the scenes
 * are examples and the page says so; the fee, the payout minimum and the
 * plan prices are read from production settings. Sign in and Sign up are
 * the real routes; a signed in visitor gets one way back into the app.
 * The Drive and Loyalty scenes are islands that load when they come near.
 */
export default async function HomePage() {
  const [ctx, prices, settings] = await Promise.all([getV2Context(), planPrices(), getSettings()]);
  const open = ctx && !ctx.user.suspended
    ? (ctx.onboarded ? { href: ctx.activeBusiness ? "/business" : "/home", label: "Open TapMart" } : { href: "/onboarding", label: "Finish setting up" })
    : null;
  const minimumPayoutCents = Number(settings.minimum_payout_cents);
  const feePct = Number(settings.platform_fee_pct);
  const year = new Date().getFullYear();

  return (
    <div className="v2 v3">
      <MotionProvider>
        <div className="x-site" id="top">
          <PublicNav open={open} />
          <PublicStrip />
          <main id="main">
            <EarnFilm />
            <div id="earn" className="x-world" aria-label="Make money">
              <Post /><DriveIsland /><GetPaid feePct={feePct} minimumPayoutCents={minimumPayoutCents} />
            </div>
            <div id="business" className="x-world x-world-business" aria-label="Grow your business">
              <FindPeople /><FindCars /><CreateThree /><Review /><Content /><LoopIsland />
              <Plans plans={PLANS} prices={prices} feePct={feePct} />
            </div>
          </main>
          <PublicFooter year={year} />
        </div>
      </MotionProvider>
    </div>
  );
}
