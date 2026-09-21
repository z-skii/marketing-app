import {
  UserCircle, SealCheck, Images, Globe, InstagramLogo, Car, BookmarkSimple, Bell, Wallet, LockKey,
  Question, FileText, ShieldCheck, Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { getV2Context } from "@/lib/v2/core";
import { getNotificationPrefs, NOTIFICATION_KINDS } from "@/lib/v2/notification-prefs";
import { CONTACT_EMAIL } from "@/config/site";
import { SettingsGroup, SettingsRow, UtilityHead } from "@/components/fs/settings/Rows";
import { IdentitySwitch, type Identity } from "@/components/fs/settings/IdentitySwitch";
import { SignOutRow } from "@/components/fs/settings/SignOut";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Creator settings: the same grouped icon rows as the business app.
 * Account, creator, notifications, payments, privacy and security,
 * support, then who you act as and the way out. Nothing here earns money.
 */
export default async function SettingsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const prefs = await getNotificationPrefs(ctx.user.id);
  const onN = NOTIFICATION_KINDS.filter((k) => prefs[k.key] !== false).length;

  const name = ctx.user.displayName ?? `@${ctx.user.username}`;
  const identities: Identity[] = [
    { id: "personal", name, sub: "Personal", logo: ctx.avatarUrl, active: ctx.mode === "user" },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: ctx.activeBusiness?.id === b.id })),
  ];
  const ig = ctx.instagram;
  const igValue = ig.status === "connected" ? `@${ig.handle ?? ""}` : ig.status === "pending" ? "Checking" : ig.status === "error" ? "Needs attention" : "Not connected";

  const groups = (
    <>
      <SettingsGroup title="Account">
        <SettingsRow href="/me/edit" icon={<UserCircle size={20} aria-hidden />} title="Profile" value={name} />
        <SettingsRow href="/me/creator" icon={<SealCheck size={20} aria-hidden />} title="Verification" status={ctx.isVerified ? "Verified" : undefined} tone="confirmed" value={ctx.isVerified ? undefined : "Not verified"} />
        <SettingsRow href="/me/portfolio" icon={<Images size={20} aria-hidden />} title="Portfolio" />
        <SettingsRow href={`/u/${ctx.user.username}`} external icon={<Globe size={20} aria-hidden />} title="Public page" />
        {ctx.user.role === "admin" && <SettingsRow href="/admin" icon={<Wrench size={20} aria-hidden />} title="Admin" />}
      </SettingsGroup>
      <SettingsGroup title="Creator">
        <SettingsRow href="/me/instagram" icon={<InstagramLogo size={20} aria-hidden />} title="Instagram" value={igValue} status={ig.status === "error" ? "Needs attention" : undefined} tone="problem" />
        <SettingsRow href="/me/vehicles" icon={<Car size={20} aria-hidden />} title="My cars" value={ctx.vehicleCount > 0 ? String(ctx.vehicleCount) : "None"} />
        <SettingsRow href="/activity?tab=saved" icon={<BookmarkSimple size={20} aria-hidden />} title="Saved" />
      </SettingsGroup>
      <SettingsGroup title="Notifications">
        <SettingsRow href="/business/settings/notifications" icon={<Bell size={20} aria-hidden />} title="Notifications" value={onN === NOTIFICATION_KINDS.length ? "All on" : `${onN} of ${NOTIFICATION_KINDS.length} on`} />
      </SettingsGroup>
      <SettingsGroup title="Payments">
        <SettingsRow href="/earnings" icon={<Wallet size={20} aria-hidden />} title="Payouts" />
      </SettingsGroup>
      <SettingsGroup title="Privacy and security">
        <SettingsRow href="/business/settings/security" icon={<LockKey size={20} aria-hidden />} title="Security" />
        <SettingsRow href="/privacy" external icon={<ShieldCheck size={20} aria-hidden />} title="Privacy" />
      </SettingsGroup>
      <SettingsGroup title="Support">
        {CONTACT_EMAIL && <SettingsRow href={`mailto:${CONTACT_EMAIL}`} external icon={<Question size={20} aria-hidden />} title="Help" />}
        <SettingsRow href="/creator-terms" external icon={<FileText size={20} aria-hidden />} title="Creator terms" />
        <SettingsRow href="/terms" external icon={<FileText size={20} aria-hidden />} title="Terms" />
      </SettingsGroup>
    </>
  );
  const identityBlock = (
    <section aria-labelledby="use-as" style={{ marginTop: 24 }}>
      <h2 id="use-as" className="fs-settings-title">Use TapMart as</h2>
      <IdentitySwitch identities={identities} canAddBusiness />
    </section>
  );

  return (
    <main className="fs-phone-main" id="main">
      <UtilityHead title="Settings" back={<BackLink fallback="/me" label="Profile" />} />
      <div className="fs-settings-grid">
        <div>
          {groups}
          <div className="fs-phone-only">{identityBlock}<SignOutRow /></div>
        </div>
        <aside className="fs-desk-only">
          {identityBlock}
          <SignOutRow />
        </aside>
      </div>
    </main>
  );
}
