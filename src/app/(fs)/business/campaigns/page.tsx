import Link from "next/link";
import { requireBusinessContext } from "@/lib/v2/core";
import { listBusinessCampaigns, isDone, isLegacyKind, needsYou, type CampaignListRow } from "@/lib/fs/business-campaigns";
import { formatMoney } from "@/components/fs/parts";
import { CampaignThumb, KIND_WORD, STATUS_WORD, nextAction, payUnit } from "@/components/fs/business/campaign/parts";
import { Badge } from "@/ds/ui";
import { ArrowRightIcon, PlayIcon, InstagramIcon, CarIcon, MegaphoneIcon, PlusIcon } from "@/ds/icons";

export const metadata = { title: "Campaigns" };
export const dynamic = "force-dynamic";

type View = "active" | "review" | "completed";
const VIEWS: { key: View; label: string }[] = [{ key: "active", label: "Active" }, { key: "review", label: "Review" }, { key: "completed", label: "Completed" }];

/**
 * Campaigns: three views of the business's real campaigns as cards, each
 * visibly its kind (Recreate, Story, Car), with its literal status, its
 * approved work, what is pending, the spots remaining, the creator pay,
 * and the one thing waiting on the business. Cards that need a decision
 * come first.
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
      <div className="ap-head">
        <div><h1>Campaigns</h1><p className="ap-sub">Recreate, Story and Car, and what each one needs.</p></div>
        <Link href="/business/create" className="btn btn-signal btn-sm shrink-0"><PlusIcon size={16} weight="bold" aria-hidden />Create</Link>
      </div>
      <nav className="ap-chips" aria-label="Views">
        {VIEWS.map((v) => <Link key={v.key} href={href(v.key)} className="pill" aria-current={view === v.key ? "page" : undefined}>{v.label}{counts[v.key] > 0 && <span style={{ opacity: 0.7, fontVariantNumeric: "tabular-nums" }}>{counts[v.key]}</span>}</Link>)}
      </nav>

      {failed ? (
        <p className="t-body" style={{ marginTop: 16 }}><span className="badge is-alert">Campaigns could not be loaded.</span> <Link href={href(view)} className="link-row">Try again</Link></p>
      ) : shown.length === 0 ? (
        <section className="card" style={{ marginTop: 16, padding: 20, maxWidth: 560 }}>
          <p className="t-h3">{empty.title}</p>
          <p className="t-body" style={{ marginTop: 6, color: "var(--tm-text2)" }}>{empty.body}</p>
          {view === "active" && rows.length === 0 && <Link href="/business/create" className="btn btn-signal" style={{ marginTop: 16 }}>Create a campaign <ArrowRightIcon size={16} aria-hidden /></Link>}
        </section>
      ) : (
        <ul className="ap-campaigns" style={{ listStyle: "none", padding: 0 }}>
          {shown.map((r) => <li key={r.id}><CampaignCard r={r} /></li>)}
        </ul>
      )}
    </main>
  );
}

const KIND_ICON: Record<string, typeof PlayIcon> = { recreate_reel: PlayIcon, instagram_story: InstagramIcon, car_ads: CarIcon };
const KIND_CLASS: Record<string, string> = { recreate_reel: "is-recreate", instagram_story: "is-story", car_ads: "is-car" };

function CampaignCard({ r }: { r: CampaignListRow }) {
  const action = nextAction(r);
  const status = STATUS_WORD(r);
  const tone = status.tone === "confirmed" ? "success" : status.tone === "problem" ? "alert" : status.tone === "waiting" ? "warning" : "neutral";
  const Icon = KIND_ICON[r.kind] ?? MegaphoneIcon;
  const pending = r.waiting + r.applications + r.artwork;
  const done = r.kind === "car_ads" ? r.cars_active : r.approved;
  const left = Math.max(r.slots - done, 0);
  const audience = r.audience === "direct" ? (r.target_name ? `Sent to @${r.target_name}` : "Direct request") : "Public";
  return (
    <article className={`ap-campaign ${action.needs ? "is-needs" : ""}`} aria-label={`${r.title}, ${status.label}${action.needs ? `, ${action.label}` : ""}`}>
      <div className={`ap-campaign-thumb ${KIND_CLASS[r.kind] ?? ""}`}>
        <span className="ap-kind" aria-hidden><Icon size={14} weight={r.kind === "recreate_reel" ? "fill" : "regular"} /></span>
        <CampaignThumb kind={r.kind} media={r.media} vehicle={r.vehicle} placements={r.placements ?? []} />
      </div>
      <div className="ap-campaign-main">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Badge tone={tone} dot>{status.label}</Badge><span className="t-meta">{KIND_WORD[r.kind] ?? r.kind} · {audience}</span></div>
        <h2 className="ap-campaign-title"><Link href={`/business/campaigns/${r.id}`}>{r.title}</Link></h2>
        <div className="ap-campaign-stats">
          <div><b>{done}<span style={{ display: "inline", color: "var(--tm-muted)", fontWeight: 500, fontSize: 13, textTransform: "none", letterSpacing: 0 }}> of {r.slots}</span></b><span>{r.kind === "car_ads" ? "Cars on the road" : "Approved"}</span></div>
          <div><b>{pending}</b><span>Pending</span></div>
          <div><b>{left}</b><span>Spots left</span></div>
        </div>
        <div className="ap-campaign-stats" style={{ gridTemplateColumns: "minmax(0, 1fr) auto", alignItems: "end" }}>
          <div><b>{formatMoney(r.pay_cents)}</b><span>{payUnit(r.kind)}</span></div>
          {r.verified > 0 && <div style={{ textAlign: "right" }}><b>{r.verified}</b><span>Paid out</span></div>}
        </div>
        <span className={`ap-campaign-next ${action.needs ? "" : "is-quiet"}`}>{action.label}{action.needs && <ArrowRightIcon size={16} aria-hidden />}</span>
      </div>
    </article>
  );
}
