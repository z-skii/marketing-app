import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { ModerationQueue } from "./ModerationQueue";
import { MembersPanel } from "./MembersPanel";
import { SettingsPanel } from "./SettingsPanel";
import { ShowcaseSwitch } from "./ShowcaseSwitch";
import { AdminTools } from "./AdminTools";
import { getCurrentUser } from "@/lib/auth";
import {
  getAdminOverview, getAuditLog, getLinksForModeration, getMembers, getPayoutRequests,
  getRejectionBreakdown, getUpcomingSpot,
} from "@/lib/admin";
import { getBoard } from "@/lib/data";
import { getSettings } from "@/lib/settings";
import { formatCredit, formatCount } from "@/lib/money";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?next=/admin");
  if (user.role !== "admin") redirect("/");

  const [overview, pending, approved, suspended, rejections, payouts, audit, spot, board, settings, members] =
    await Promise.all([
      getAdminOverview(),
      getLinksForModeration("pending"),
      getLinksForModeration("approved", 15),
      getLinksForModeration("suspended", 15),
      getRejectionBreakdown(),
      getPayoutRequests(),
      getAuditLog(),
      getUpcomingSpot(),
      getBoard(15),
      getSettings(),
      getMembers(),
    ]);

  return (
    <>
      <Header user={user} />
      <main id="main" className="shell py-10 md:py-14">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-3xl leading-[0.92] font-800 tracking-[-0.045em] md:text-4xl">
            Admin
          </h1>
          <a href="/admin/hq" className="font-mono text-xs underline">
            HQ
          </a>
          <a href="/admin/agents" className="font-mono text-xs text-ink-faint underline">
            agents
          </a>
        </div>

        <section className="mt-8">
          <h2 className="eyebrow">Money</h2>
          <div className="mt-4 grid max-w-4xl grid-cols-2 gap-5 md:grid-cols-4">
            <Stat label="Credit purchased" value={formatCredit(overview.creditPurchasedCents)} emphasis />
            <Stat label="Credit consumed" value={formatCredit(overview.creditConsumedCents)} />
            <Stat label="Reserved on placements" value={formatCredit(overview.creditReservedCents)} />
            <Stat label="Creator pending" value={formatCredit(overview.creatorPendingCents)} />
          </div>
        </section>

        <ShowcaseSwitch enabled={settings.feature_showcase_ads === "true"} />

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Live</h2>
          <div className="mt-4 grid max-w-5xl grid-cols-2 gap-5 md:grid-cols-4 lg:grid-cols-6">
            <Stat label="Active placements" value={formatCount(overview.activePlacements)} />
            <Stat label="Bar live" value={formatCount(overview.barLive)} />
            <Stat label="Bar queued" value={formatCount(overview.barQueued)} />
            <Stat label="Spot scheduled" value={formatCount(overview.spotScheduled)} />
            <Stat label="Opens today" value={formatCount(overview.clicksToday)} />
            <Stat label="Rejected today" value={formatCount(overview.rejectedToday)} />
          </div>
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Members / {members.length}</h2>
          <MembersPanel members={members} />
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Pending review · {overview.pendingLinks}</h2>
          <ModerationQueue links={pending} emptyMessage="Nothing waiting." showActions />
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Rejected click signals · last 24h</h2>
          {rejections.length === 0 ? (
            <p className="mt-3 font-mono text-xs text-ink-faint">Nothing rejected.</p>
          ) : (
            <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {rejections.map((r) => (
                <li key={r.rejection_reason} className="font-mono text-xs">
                  <span className="text-ink-faint">{r.rejection_reason.replace(/_/g, " ")}</span>{" "}
                  <span className="tnum font-600">{formatCount(r.n)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Board · top 15</h2>
          <ol className="mt-3 flex flex-col gap-1">
            {board.map((row) => (
              <li key={row.link_id} className="flex items-baseline gap-3 font-mono text-xs">
                <span className="tnum w-6 text-ink-faint">{String(row.rank).padStart(2, "0")}</span>
                <span className="flex-1 truncate">{row.display_name}</span>
                <span className="tnum">{formatCredit(row.score_cents_today)}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Upcoming spot</h2>
          <ol className="mt-3 flex flex-col gap-1">
            {spot.length === 0 && <li className="font-mono text-xs text-ink-faint">Nothing scheduled.</li>}
            {spot.map((s, i) => (
              <li key={`${s.starts_at}-${i}`} className="flex items-baseline gap-3 font-mono text-xs">
                <span className="tnum w-20 text-ink-faint">
                  {new Date(s.starts_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="flex-1 truncate">{s.display_name}</span>
                <span className="truncate text-ink-faint">{s.domain}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rule mt-9 pt-6">
          <h2 className="eyebrow">Approved · {overview.approvedLinks}</h2>
          <ModerationQueue links={approved} emptyMessage="None yet." />
        </section>

        {suspended.length > 0 && (
          <section className="rule mt-9 pt-6">
            <h2 className="eyebrow">Suspended · {overview.suspendedLinks}</h2>
            <ModerationQueue links={suspended} emptyMessage="None." />
          </section>
        )}

        <AdminTools payouts={payouts} />
        <SettingsPanel settings={settings} />

        <section className="rule mt-9 pt-6 pb-4">
          <h2 className="eyebrow">Audit</h2>
          <ol className="mt-3 flex flex-col gap-1">
            {audit.length === 0 && <li className="font-mono text-xs text-ink-faint">No admin actions yet.</li>}
            {audit.map((a) => (
              <li key={a.id} className="flex items-baseline gap-3 font-mono text-xs">
                <span className="w-24 shrink-0 text-ink-faint">
                  {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
                <span className="flex-1">{a.action.replace(/_/g, " ")}</span>
                <span className="truncate text-ink-faint">{a.email}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </>
  );
}

function Stat({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1 font-mono font-600 ${emphasis ? "text-2xl" : "text-xl text-ink-soft"}`}>
        {value}
      </div>
    </div>
  );
}
