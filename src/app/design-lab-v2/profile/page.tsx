import { Rail, TabBar, USER_TABS } from "../parts";
import { Switcher } from "../Switcher";
import { ProfileBody, SettingsSheet, ShareSheet } from "./Profile";

/**
 * V2 User Profile at /design-lab-v2/profile (alias /design-lab-v2/me).
 * `?public=1` renders the public safe projection used by Share.
 */
export default async function V2Profile({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const publicView = sp.public === "1";
  if (publicView) {
    return (
      <div className="phone">
        <header className="phone-header" style={{ display: "flex" }}>
          <span className="t-note">Fictional profile</span>
          <a href="/design-lab-v2/profile" className="link t-action" style={{ minHeight: 44, display: "inline-flex", alignItems: "center" }}>Close</a>
        </header>
        <main className="phone-main" style={{ paddingBottom: 48 }}><ProfileBody publicView /></main>
      </div>
    );
  }
  return (
    <div className="desk">
      <Rail mode="Personal" active="Profile" identity={<Switcher current="Personal" compact />} />
      <div className="phone">
        <header className="phone-header">
          <span style={{ display: "flex", flexDirection: "column" }}>
            <Switcher current="Personal" compact />
            <span className="t-note" style={{ marginTop: -6 }}>Fictional profile</span>
          </span>
          <span style={{ display: "flex", gap: 8 }}><ShareSheet /><SettingsSheet /></span>
        </header>
        <div className="desk-wrap">
        <header className="desk-header profile-desk-header">
          <Switcher current="Personal" compact className="identity tablet-only" />
          <span className="t-note">Fictional profile</span>
          <span style={{ display: "flex", gap: 8 }}><ShareSheet /><SettingsSheet /></span>
        </header>
        <main className="phone-main desk-main"><ProfileBody /></main>
        </div>
        <TabBar tabs={USER_TABS} active="Profile" label="Personal" />
      </div>
    </div>
  );
}
