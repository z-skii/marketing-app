import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { listBusinessCampaigns, isDone, isLegacyKind, needsYou, type CampaignListRow } from "@/lib/fs/business-campaigns";
import { formatMoney } from "@/components/fs/parts";
import { CampaignThumb, KIND_WORD, STATUS_WORD, nextAction, payUnit } from "@/components/fs/business/campaign/parts";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

type View = "active" | "review" | "completed";
const VIEWS: { key: View; label: string }[] = [{ key: "active", label: "Active" }, { key: "review", label: "Review" }, { key: "completed", label: "Completed" }];

/**
 * Campaigns in Frame Shift: three views, rows led by the campaign's own
 * media, each stating its kind, who it is for, its literal status, its
 * pay, real progress and the one thing waiting on the business. Rows
 * that need a decision come first. No summary tiles above the list.
 */
export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ view?: string; tab?: string; needs?: string; f?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/campaigns"), searchParams]);
  const raw = params.view ?? params.tab;
  const view: View = raw === "review" || raw === "completed" || raw === "active" ? raw : params.needs || params.f === "needs" ? "review" : params.f === "done" ? "completed" : "active";

  let rows: CampaignListRow[] = []; let failed = false;
  try { rows = await listBusinessCampaigns(ctx.activeBusiness.id); } catch { failed = true; }

  const visible = rows.filter((r) => !isLegacyKind(r) || isDone(r));
  const inView = (r: CampaignListRow, v: View) => v === "review" ? !isDone(r) && needsYou(r) : v === "completed" ? isDone(r) : !isLegacyKind(r) && !isDone(r);
  const counts = { active: visible.filter((r) => inView(r, "active")).length, review: visible.filter((r) => inView(r, "review")).length, completed: visible.filter((r) => inView(r, "completed")).length };
  const shown = visible.filter((r) => inView(r, view)).sort((a, b) => Number(!isDone(b) && needsYou(b)) - Number(!isDone(a) && needsYou(a)));
  const href = (v: View) => (v === "active" ? "/business/campaigns" : `/business/campaigns?view=${v}`);

  const empty = {
    active: { title: "No campaigns running.", body: "Start one from Create. It shows up here the moment it is published or saved as a draft." },
    review: { title: "Nothing waiting on you.", body: "Submissions, Story proofs, driver applications and cars needing artwork appear here." },
    completed: { title: "Nothing completed yet.", body: "Closed campaigns and answered direct requests appear here." },
  }[view];

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row"><h1 className="fs-t-page">Campaigns</h1></div>
      <nav className="fs-filters is-work" aria-label="Views" style={{ marginTop: 8 }}>
        {VIEWS.map((v) => (
          <Link key={v.key} href={href(v.key)} aria-current={view === v.key ? "page" : undefined}>{v.label}{counts[v.key] > 0 && <span className="fs-count">{counts[v.key]}</span>}</Link>
        ))}
      </nav>

      {failed ? (
        <p className="fs-t-body" style={{ marginTop: 16 }}><span className="fs-status is-problem">Campaigns could not be loaded.</span> <Link href={href(view)} className="fs-link-ink fs-link-ul">Try again</Link></p>
      ) : shown.length === 0 ? (
        <div style={{ marginTop: 24, maxWidth: 480 }}>
          <p className="fs-t-task">{empty.title}</p>
          <p className="fs-t-body" style={{ marginTop: 4, color: "var(--fs-muted)" }}>{empty.body}</p>
          {view === "active" && rows.length === 0 && <Link href="/business/create" className="fs-btn fs-btn-primary" style={{ marginTop: 16 }}>Create a campaign</Link>}
        </div>
      ) : (
        <ul className="fs-campaign-list fs-content-narrow" style={{ marginTop: 12 }}>
          {shown.map((r) => <li key={r.id}><CampaignRow r={r} /></li>)}
        </ul>
      )}
    </main>
  );
}

function CampaignRow({ r }: { r: CampaignListRow }) {
  const action = nextAction(r);
  const status = STATUS_WORD(r);
  const progress =
    r.kind === "car_ads" ? `${r.cars_active} of ${r.slots} car${r.slots === 1 ? "" : "s"} on the road`
    : `${r.approved} of ${r.slots} approved`;
  const audience = r.audience === "direct" ? (r.target_name ? `Sent to @${r.target_name}` : "Direct request") : "Public";
  return (
    <Link href={`/business/campaigns/${r.id}`} className={`fs-campaign-row${action.needs ? " needs-you" : ""}`} aria-label={`${r.title}, ${status.label}${action.needs ? `, ${action.label}` : ""}`}>
      <CampaignThumb kind={r.kind} media={r.media} vehicle={r.vehicle} placements={r.placements ?? []} />
      <span className="fs-campaign-info">
        <span className="fs-t-task" style={{ display: "block" }}>{r.title}</span>
        <span className="fs-t-meta" style={{ display: "block" }}>{KIND_WORD[r.kind] ?? r.kind} · {audience}</span>
        <span className="fs-t-meta" style={{ display: "block" }}><span className={`fs-status is-${status.tone}`}>{status.label}</span> · {progress}</span>
        <span style={{ display: "block", marginTop: 4 }}><span className={action.needs ? "fs-campaign-action" : "fs-t-meta"}>{action.label}{action.needs && <ArrowRight size={16} aria-hidden />}</span></span>
      </span>
      <span className="fs-campaign-money">
        <span className="fs-work-money">{formatMoney(r.pay_cents)}</span>
        <span className="fs-t-meta" style={{ display: "block" }}>{payUnit(r.kind)}</span>
      </span>
    </Link>
  );
}
