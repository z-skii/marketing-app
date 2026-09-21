import { requireV2 } from "@/lib/v2/core";
import { SettingsGroup, SettingsRow, UtilityHead } from "@/components/fs/settings/Rows";
import { SignOutRow } from "@/components/fs/settings/SignOut";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

/** The account behind every identity: who is signed in, how, and the way out. */
export default async function AccountSettingsPage() {
  const ctx = await requireV2("/business/settings/account");
  const n = ctx.businesses.length;
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Account" back={<BackLink fallback={ctx.mode === "business" ? "/business/settings" : "/me/settings"} label="Settings" />} />
      <SettingsGroup title="Account">
        <SettingsRow title="Email" value={ctx.user.email ?? "None"} />
        <SettingsRow href="/me/edit" title="Name" value={ctx.user.displayName ?? "Not set"} />
        <SettingsRow href="/me/edit" title="Username" value={`@${ctx.user.username}`} />
        <SettingsRow title="Member" value={`#${ctx.user.memberNo}`} />
      </SettingsGroup>
      <SettingsGroup title="Session">
        <SettingsRow title="Stays signed in" value="30 days" />
        <SettingsRow href={ctx.mode === "business" ? "/business/settings" : "/me/settings"} title="Identities" value={`Personal${n > 0 ? ` + ${n}` : ""}`} />
      </SettingsGroup>
      <SignOutRow />
    </main>
  );
}
