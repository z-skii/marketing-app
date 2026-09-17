import { Business, EarnStage, Footer, Hero, HowItWorks, Pricing, Section, SiteHeader } from "../design-lab-v2/site/Site";
import { Sequence } from "./site/Sequence";

/**
 * V3 Public Homepage at /design-lab-v3: the V2 Open Cut homepage carried
 * forward, with the Loyalty sequence extending the ink business chapter
 * before Monthly Content returns to paper. Fixture data only; nothing
 * authenticates, sends or moves money.
 */
export default function V3PublicHome() {
  return (
    <div className="site">
      <SiteHeader />
      <main>
        <Section><Hero /></Section>
        <section id="earn" aria-label="Earn"><Section><EarnStage /></Section></section>
        <Section><HowItWorks /></Section>
        <div className="v3-biz"><Business /><section className="site-loy on-ink" id="loyalty" aria-label="Loyalty"><div className="site-inner"><Sequence /></div></section></div>
        <Section><Pricing /></Section>
      </main>
      <Section><Footer /></Section>
    </div>
  );
}
