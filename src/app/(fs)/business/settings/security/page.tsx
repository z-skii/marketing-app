import { requireV2 } from "@/lib/v2/core";
import { devAuthEnabled } from "@/lib/supabase";
import { SettingsGroup, SettingsRow, UtilityHead } from "@/components/fs/settings/Rows";
import { SignOutRow } from "@/components/fs/settings/SignOut";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Security" };
export const dynamic = "force-dynamic";

/**
 * Password and sessions. Passwords live with the sign-in provider, so a
 * change goes through the reset link. One session per device, ended by
 * logging out there.
 */
export default async function SecuritySettingsPage() {
  const ctx = await requireV2("/business/settings/security");
  const dev = devAuthEnabled();
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Security" back={<BackLink fallback="/business/settings" label="Settings" />} />
      <SettingsGroup title="Password">
        {dev
          ? <SettingsRow title="Change password" sub="Development sign-in is on. Password changes go through the real sign-in in production." />
          : <SettingsRow href="/reset" title="Change password" sub={`A reset link goes to ${ctx.user.email ?? "your email"}`} />}
      </SettingsGroup>
      <SettingsGroup title="Sessions">
        <SettingsRow title="This device" sub={`Signed in as ${ctx.user.email ?? ctx.user.username}`} />
        <SettingsRow title="Expires" sub="30 days after sign in, or when you log out" />
      </SettingsGroup>
      <p className="fs-t-meta" style={{ marginTop: 12 }}>Logging out ends the session on this device only. To end a session on another device, log out there.</p>
      <SignOutRow />
    </main>
  );
}
