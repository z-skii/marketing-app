import { requireBusinessContext } from "@/lib/v2/core";
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
 * Settings: which business this is, then short grouped rows that state the
 * real current condition of each thing and open it one level deeper.
 * Account, then the business, then who you act as, then the way out.
 * Complexity lives on the deeper screens, never here.
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
  const planRow = !subscription || !plan ? { sub: "No plan yet", status: undefined, tone: "neutral" as const }
    : subscription.status === "active" ? { sub: `${plan.name} · Subscription only, campaign credit is separate`, status: "Active", tone: "confirmed" as const }
    : subscription.status === "trialing" ? { sub: plan.name, status: "Trial", tone: "waiting" as const }
    : { sub: plan.name, status: "Past due", tone: "problem" as const };

  const account = (
    <>
      <SettingsGroup title="Account">
        <SettingsRow href="/business/settings/account" title="Account" sub={ctx.user.email ?? "Email unavailable"} />
        <SettingsRow href="/business/settings/notifications" title="Notifications" sub={mutedN > 0 ? `${onN} of ${NOTIFICATION_KINDS.length} kinds on` : "All kinds on"} />
        <SettingsRow href="/business/settings/security" title="Security" sub="Password and sessions" />
      </SettingsGroup>
      <SettingsGroup title="Business">
        <SettingsRow href="/business/edit" title="Business details" sub={where || "Add a category and city"} />
        <SettingsRow href="/business/settings/connections" title="Connections" sub={`Instagram ${STATE_WORD[ig.state].label.toLowerCase()} · Google ${STATE_WORD[google.state].label.toLowerCase()}`} status={attention > 0 ? (attention === 1 ? "Needs attention" : `${attention} need attention`) : undefined} tone="problem" />
        <SettingsRow href="/business/google" title="Google Business" sub={google.state === "connected" ? google.name ?? "Connected" : "Connect to read your listing"} status={STATE_WORD[google.state].label} tone={STATE_WORD[google.state].tone} />
        <SettingsRow href="/business/brand" title="Brand kit" sub={kit.sub} status={kit.label} tone={kit.tone} />
        <SettingsRow href="/business/plan" title="Plan and billing" sub={planRow.sub} status={planRow.status} tone={planRow.tone} />
        <SettingsRow href="/business/team" title="Team" sub={members === 1 ? "Only you" : `${members} people`} />
        <SettingsRow href={`/b/${row.slug}`} external title="Public page" sub={`tapmart.live/b/${row.slug}`} />
      </SettingsGroup>
    </>
  );
  const identityBlock = (
    <section aria-labelledby="use-as" style={{ marginTop: 24 }}>
      <h2 id="use-as" className="fs-t-label" style={{ color: "var(--fs-muted)" }}>Use TapMart as</h2>
      <IdentitySwitch identities={identities} canAddBusiness />
    </section>
  );

  return (
    <main className="fs-phone-main" id="main">
      <UtilityHead title="Settings" back={<BackLink fallback="/business/profile" label="Business" />} />
      <p className="fs-t-body" style={{ marginTop: 4 }}><span style={{ fontWeight: 500 }}>{business.name}</span>{where ? <span className="fs-t-meta"> · {where}</span> : null}</p>
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
