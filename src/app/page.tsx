import { PLANS } from "@/config/plans";
import { getSettings } from "@/lib/settings";
import { getV2Context } from "@/lib/v2/core";
import { planPrices } from "@/lib/v2/subscriptions";
import { Nav } from "@/site/Nav";
import { Hero } from "@/site/Hero";
import { Drive } from "@/site/Drive";
import { Recreate } from "@/site/Recreate";
import { Share } from "@/site/Share";
import { Loyalty } from "@/site/Loyalty";
import { Business } from "@/site/Business";
import { Plans } from "@/site/Plans";
import { Footer } from "@/site/Footer";
import "@/v3/v3.css";
import "@/v3/prod.css";
import "@/site/site.css";

export const dynamic = "force-dynamic";

/**
 * The public front door as a product launch experience: DRIVE, RECREATE,
 * SHARE, GET PAID. The hero demonstrates TapMart with the isolated car, a
 * Story on a phone, a creator's Reel, a business and an approval; the
 * chapters tell each earning method as sticky storytelling; the business
 * side shows the system as an animated dashboard composition; then the
 * real plans. The fee, the payout minimum and the plan prices are read
 * from production settings. People, businesses, campaigns and amounts in
 * the scenes are examples and the page says so. Sign in and Sign up are
 * the real routes; a signed in visitor gets one way back into the app.
 */
export default async function HomePage() {
  const [ctx, prices, settings] = await Promise.all([getV2Context(), planPrices(), getSettings()]);
  const open = ctx && !ctx.user.suspended
    ? (ctx.onboarded ? { href: ctx.activeBusiness ? "/business" : "/home", label: "Open TapMart" } : { href: "/onboarding", label: "Finish setting up" })
    : null;
  const feePct = Number(settings.platform_fee_pct);
  const year = new Date().getFullYear();

  return (
    <div className="lp">
      <Nav open={open} />
      <main id="main">
        <Hero open={open} />
        <Drive />
        <Recreate />
        <Share />
        <Loyalty />
        <Business />
        <Plans plans={PLANS} prices={prices} feePct={feePct} />
      </main>
      <Footer year={year} />
    </div>
  );
}
