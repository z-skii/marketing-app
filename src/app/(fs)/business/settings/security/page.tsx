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
      <UtilityHead title="Security" back={<BackLink fallback={ctx.mode === "business" ? "/business/settings" : "/me/settings"} label="Settings" />} />
      <SettingsGroup title="Password">
        {dev
          ? <SettingsRow title="Change password" sub="Not available in development sign-in" />
          : <SettingsRow href="/reset" title="Change password" sub={`Reset link to ${ctx.user.email ?? "your email"}`} />}
      </SettingsGroup>
      <SettingsGroup title="Sessions">
        <SettingsRow title="This device" value={ctx.user.email ?? ctx.user.username} />
        <SettingsRow title="Expires" value="30 days" />
      </SettingsGroup>
      <SignOutRow />
    </main>
  );
}
