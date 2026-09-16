import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { Avatar } from "@/components/fs/parts";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { Facts } from "@/components/fs/work/DetailParts";
import { fmtDay } from "@/components/fs/business/campaign/parts";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Team" };
export const dynamic = "force-dynamic";

/**
 * Team: the people on this business as the permissions model records
 * them. Three roles exist (owner, manager, member); what each may do is
 * stated from the real checks in the product. There is no invitation
 * record in the product yet, so none is drawn: adding people happens when
 * they are added, not before.
 */
const ROLE: Record<string, { label: string; can: string }> = {
  owner: { label: "Owner", can: "Everything: plan, campaign credit, details, connections, brand, campaigns, approvals" },
  manager: { label: "Manager", can: "Details, connections, brand kit, campaigns and approvals. Not the plan or campaign credit" },
  member: { label: "Member", can: "Sees the business. Cannot change settings, campaigns or money" },
};

export default async function TeamPage() {
  const ctx = await requireBusinessContext("/business/team");
  const business = ctx.activeBusiness;
  const members = await sql<{ id: string; username: string; display_name: string | null; avatar_url: string | null; member_role: string; created_at: string }>(
    `select p.id, p.username, p.display_name, p.avatar_url, m.member_role, m.created_at
       from business_members m join profiles p on p.id = m.profile_id
      where m.business_id = $1
      order by case m.member_role when 'owner' then 0 when 'manager' then 1 else 2 end, m.created_at`,
    [business.id],
  );
  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Team" lede={members.length === 1 ? "Only you, for now." : `${members.length} people can act as ${business.name}.`} back={<BackLink fallback="/business/settings" label="Settings" />} />
      <ul className="fs-plain-list" aria-label="Members" style={{ marginTop: 16 }}>
        {members.map((m) => {
          const role = ROLE[m.member_role] ?? { label: m.member_role, can: "" };
          const name = m.display_name ?? `@${m.username}`;
          return (
            <li key={m.id} className="fs-member-row">
              <Avatar src={m.avatar_url} name={name} size={48} />
              <span style={{ minWidth: 0 }}>
                <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{name}{m.id === ctx.user.id ? <span className="fs-t-meta"> · You</span> : null}</span>
                <span className="fs-t-meta" style={{ display: "block" }}>@{m.username} · Since {fmtDay(m.created_at)}</span>
              </span>
              <span className="fs-t-label">{role.label}</span>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="roles-title" style={{ marginTop: 32 }}>
        <h2 id="roles-title" className="fs-t-section">What each role can do</h2>
        <Facts rows={Object.values(ROLE).map((r) => [r.label, r.can] as [string, string])} />
      </section>

      <section aria-labelledby="add-title" className="fs-plane" style={{ marginTop: 32 }}>
        <h2 id="add-title" className="fs-t-label">Adding people</h2>
        <p className="fs-t-body" style={{ marginTop: 4 }}>Invitations are not available in TapMart yet, so no one is shown as invited. When a person is added to this business they appear in the list above with their role.</p>
        {business.member_role !== "owner" && <p className="fs-t-meta" style={{ marginTop: 8 }}>Only the owner will be able to add people.</p>}
        <Link href="/business/settings" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 8 }}>Back to Settings</Link>
      </section>
    </main>
  );
}
