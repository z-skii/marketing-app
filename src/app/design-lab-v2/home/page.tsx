import { Rail, TabBar, USER_TABS, Utilities } from "../parts";
import { Switcher } from "../Switcher";
import { Feed } from "./Feed";
import { homeActivityCount } from "../fixtures";

/**
 * V2 User Home: HOW CAN I MAKE MONEY RIGHT NOW. Three silhouettes meeting
 * one earning edge; money, one verb, one View. Fixture data only.
 */
export default function V2UserHome() {
  const tabs = USER_TABS.map((t) => t.label === "Activity" ? { ...t, badge: homeActivityCount } : t);
  return (
    <div className="desk">
      <Rail mode="Personal" active="Home" identity={<Switcher current="Personal" compact avatar />} tabs={tabs} />
      <div className="phone">
        <h1 className="v2-sr">Home</h1>
        <header className="phone-header">
          <Switcher current="Personal" compact />
          <Utilities />
        </header>
        <header className="desk-header tablet-only">
          <Switcher current="Personal" compact />
          <Utilities />
        </header>
        <main className="phone-main desk-main">
          <Feed />
        </main>
        <TabBar tabs={tabs} active="Home" label="Personal" />
      </div>
    </div>
  );
}

