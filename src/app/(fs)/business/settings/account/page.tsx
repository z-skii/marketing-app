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
      <UtilityHead title="Account" back={<BackLink fallback="/business/settings" label="Settings" />} />
      <SettingsGroup title="Account">
        <SettingsRow title="Email" sub={ctx.user.email ?? "No email on file"} />
        <SettingsRow href="/me/edit" title="Name" sub={ctx.user.displayName ?? "Not set"} />
        <SettingsRow href="/me/edit" title="Username" sub={`@${ctx.user.username}`} />
        <SettingsRow title="Member number" sub={`#${ctx.user.memberNo}`} />
      </SettingsGroup>
      <SettingsGroup title="Session">
        <SettingsRow title="Signed in as" sub={`${ctx.user.email ?? ctx.user.username} on this device`} />
        <SettingsRow title="Stays signed in" sub="30 days, or until you log out" />
        <SettingsRow href="/business/settings" title="Identities" sub={`Personal${n > 0 ? ` and ${n} ${n === 1 ? "business" : "businesses"}` : ""}`} />
      </SettingsGroup>
      <SignOutRow />
    </main>
  );
}
