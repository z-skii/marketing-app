import {
  UserCircle, Bell, LockKey, Storefront, Plugs, GoogleLogo, Palette, CreditCard, UsersThree, Globe, ShieldCheck, FileText, Question,
} from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { CONTACT_EMAIL } from "@/config/site";
import { sqlOne } from "@/lib/db";
import { getNotificationPrefs, NOTIFICATION_KINDS } from "@/lib/v2/notification-prefs";
import { brandState, loadBusinessIdentity, STATE_WORD } from "@/lib/fs/business-identity";
import { SettingsGroup, SettingsRow, UtilityHead } from "@/components/fs/settings/Rows";
import { IdentitySwitch, type Identity } from "@/components/fs/settings/IdentitySwitch";
import { SignOutRow } from "@/components/fs/settings/SignOut";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/**
 * Settings: grouped icon rows, the same primitives as the creator app.
 * Account, business, notifications, payments, privacy and security,
 * support, then who you act as and the way out. Each row states only the
 * real current condition; complexity lives one level deeper.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;
  const [identity, prefs, muted] = await Promise.all([
    loadBusinessIdentity(business.id),
    getNotificationPrefs(ctx.user.id),
    sqlOne<{ muted: string }>(`select coalesce((select count(*) from jsonb_each_text(prefs) where value = 'false'), 0)::text as muted from notification_prefs where profile_id = $1`, [ctx.user.id]),
  ]);
  if (!identity) return null;
  const { row, providers, subscription, plan, brand, members } = identity;
  const ig = providers.find((p) => p.provider === "instagram")!;
  const google = providers.find((p) => p.provider === "google_business")!;
  const attention = providers.filter((p) => p.state === "error" || p.state === "needs_reconnect").length;
  const kit = brandState(brand);
  const mutedN = Number(muted?.muted ?? 0);
  const onN = NOTIFICATION_KINDS.filter((k) => prefs[k.key] !== false).length;
  const where = [row.category, row.city].filter(Boolean).join(" · ");
  const identities: Identity[] = [
    { id: "personal", name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl, active: false },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: b.member_role === "owner" ? "Business · Owner" : `Business · ${b.member_role[0].toUpperCase()}${b.member_role.slice(1)}`, logo: b.logo_url, active: b.id === business.id })),
  ];
  const planRow = !subscription || !plan ? { value: "No plan", status: undefined, tone: "neutral" as const }
    : subscription.status === "active" ? { value: plan.name, status: "Active", tone: "confirmed" as const }
    : subscription.status === "trialing" ? { value: plan.name, status: "Trial", tone: "waiting" as const }
    : { value: plan.name, status: "Past due", tone: "problem" as const };
  const i = (Icon: typeof UserCircle) => <Icon size={20} aria-hidden />;

  const account = (
    <>
      <SettingsGroup title="Account">
        <SettingsRow href="/business/settings/account" icon={i(UserCircle)} title="Account" value={ctx.user.email ?? undefined} />
      </SettingsGroup>
      <SettingsGroup title="Business">
        <SettingsRow href="/business/edit" icon={i(Storefront)} title="Details" value={where || "Add city"} />
        <SettingsRow href="/business/settings/connections" icon={i(Plugs)} title="Connections" value={attention > 0 ? undefined : `${STATE_WORD[ig.state].label}`} status={attention > 0 ? (attention === 1 ? "Needs attention" : `${attention} need attention`) : undefined} tone="problem" />
        <SettingsRow href="/business/google" icon={i(GoogleLogo)} title="Google Business" status={STATE_WORD[google.state].label} tone={STATE_WORD[google.state].tone} />
        <SettingsRow href="/business/brand" icon={i(Palette)} title="Brand kit" status={kit.label} tone={kit.tone} />
        <SettingsRow href="/business/team" icon={i(UsersThree)} title="Team" value={members === 1 ? "Only you" : `${members} people`} />
        <SettingsRow href={`/b/${row.slug}`} external icon={i(Globe)} title="Public page" />
      </SettingsGroup>
      <SettingsGroup title="Notifications">
        <SettingsRow href="/business/settings/notifications" icon={i(Bell)} title="Notifications" value={mutedN > 0 ? `${onN} of ${NOTIFICATION_KINDS.length} on` : "All on"} />
      </SettingsGroup>
      <SettingsGroup title="Payments">
        <SettingsRow href="/business/plan" icon={i(CreditCard)} title="Plan and billing" value={planRow.value} status={planRow.status} tone={planRow.tone} />
      </SettingsGroup>
      <SettingsGroup title="Privacy and security">
        <SettingsRow href="/business/settings/security" icon={i(LockKey)} title="Security" />
        <SettingsRow href="/privacy" external icon={i(ShieldCheck)} title="Privacy" />
      </SettingsGroup>
      <SettingsGroup title="Support">
        {CONTACT_EMAIL && <SettingsRow href={`mailto:${CONTACT_EMAIL}`} external icon={i(Question)} title="Help" />}
        <SettingsRow href="/terms" external icon={i(FileText)} title="Terms" />
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
      <UtilityHead title="Settings" back={<BackLink fallback="/business/profile" label="Business" />} />
      <div className="fs-settings-grid">
        <div>
          {account}
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
