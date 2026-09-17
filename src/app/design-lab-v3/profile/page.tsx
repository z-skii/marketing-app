import { UserShell } from "../x/Nav";
import { ProfilePage, ShareSheet, SettingsSheet } from "../x/profile/Profile";

/**
 * V3 User Profile at /design-lab-v3/profile. `?view=public` renders the
 * guest share view: the same identity composition with owner controls
 * and navigation removed. `?work=<id>` opens a work item inline.
 */
export default async function V3UserProfile({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const publicView = sp.view === "public" || sp.public === "1";
  if (publicView) return <div className="x-public-profile"><h1 className="v2-sr">Maya Chen, public profile preview</h1><ProfilePage publicView /></div>;
  return <UserShell title="Profile" active="Profile" mainClass="x-profile-main" headerRight={<span className="x-profile-head-r"><ShareSheet /><SettingsSheet /></span>}><ProfilePage publicView={false} /></UserShell>;
}
