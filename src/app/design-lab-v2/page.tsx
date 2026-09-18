import { Business, EarnStage, Footer, Hero, HowItWorks, Pricing, Section, SiteHeader } from "./site/Site";

/**
 * V2 Public Homepage at /design-lab-v2: everyday before interface. Recreate,
 * Post and Drive as photography that opens into coded paid work previews;
 * one ink business chapter; Monthly Content and its two plans; a short
 * footer. Fixture data only; nothing authenticates or moves money.
 */
export default function V2PublicHome() {
  return (
    <div className="site">
      <SiteHeader />
      <main>
        <Section><Hero /></Section>
        <section id="earn" aria-label="Earn"><Section><EarnStage /></Section></section>
        <Section><HowItWorks /></Section>
        <Business />
        <Section><Pricing /></Section>
      </main>
      <Section><Footer /></Section>
    </div>
  );
}
