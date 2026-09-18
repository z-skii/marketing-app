import { BUSINESS_TABS, Rail, TabBar, Utilities } from "../parts";
import { Switcher } from "../Switcher";
import { Discovery } from "./Discovery";
import { businessAttention } from "../fixtures";

/** V2 Business Home: WHO OR WHAT CAN MARKET MY BUSINESS. Fixture data only. */
export default function V2BusinessHome() {
  const tabs = BUSINESS_TABS.map((t) => t.label === "Content" ? { ...t, badge: businessAttention.content } : t.label === "Campaigns" ? { ...t, badge: businessAttention.campaigns } : t);
  return (
    <div className="desk">
      <Rail mode="Business" active="Home" identity={<Switcher current="Business" />} tabs={tabs} />
      <div className="phone">
        <h1 className="v2-sr">Home</h1>
        <header className="phone-header">
          <Switcher current="Business" />
          <Utilities />
        </header>
        <div className="desk-wrap">
        <header className="desk-header tablet-only">
          <Switcher current="Business" />
          <Utilities />
        </header>
        <main className="phone-main desk-main"><Discovery /></main>
        </div>
        <TabBar tabs={tabs} active="Home" label="Business" />
      </div>
    </div>
  );
}
