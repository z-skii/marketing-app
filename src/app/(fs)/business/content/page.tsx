import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { defaultTimezone } from "@/lib/ai/schedule";
import { getContentState } from "@/lib/business/content-state";
import { listDeliverables, type Deliverable } from "@/lib/business/deliverables";
import { listShoots, type ContentShoot } from "@/lib/business/shoots";
import { PLAN_BY_KEY } from "@/config/plans";
import { dayKeyOf, dayLabel, defaultScheduleSlot, groupLabel, shootTimeLabel, timeOf } from "@/app/(v2)/business/content/dates";
import { ContentWorkspace, fileState, type PostInfo, type WorkspaceFile } from "@/components/fs/business/ContentWorkspace";

export const metadata = { title: "Content" };
export const dynamic = "force-dynamic";

/**
 * Business Content in Frame Shift: the subscription service workspace.
 * What content do I have, what needs my approval, what can I schedule,
 * what happened with my shoots. Overview, Library, Calendar and Shoots are
 * views of the same real records: shoots the plan booked, files a verified
 * creator delivered, posts made from those files. Nothing here is staged.
 */
type View = "overview" | "library" | "calendar" | "shoots";
const VIEWS: { key: View; label: string }[] = [
  { key: "overview", label: "Overview" }, { key: "library", label: "Library" }, { key: "calendar", label: "Calendar" }, { key: "shoots", label: "Shoots" },
];

type PostRow = { id: string; deliverable_id: string | null; platform: string; status: string; title: string; format: string | null; when: string | null };

const SHOOT_STATE: Record<string, { label: string; tone: "confirmed" | "waiting" | "problem" | "neutral" }> = {
  planned: { label: "Your shoot is being scheduled", tone: "waiting" },
  scheduled: { label: "Booked", tone: "confirmed" },
  done: { label: "Shoot completed", tone: "confirmed" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
const SUB_STATE: Record<string, string> = { active: "Active", trialing: "Trial", past_due: "Payment past due", cancelled: "Cancelled" };

async function settle<T>(p: Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try { return { ok: true, value: await p }; } catch (e) { console.error(e); return { ok: false }; }
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/content"), searchParams]);
  const business = ctx.activeBusiness;
  const view: View = VIEWS.find((v) => v.key === params.view)?.key ?? "overview";
  const timeZone = defaultTimezone();
  const now = new Date();
  const todayKey = dayKeyOf(now, timeZone);
  const zoneLabel = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
  const slot = defaultScheduleSlot(todayKey);

  const info = await getContentState(business.id, now);
  const subscribed = info.state !== "NOT_SUBSCRIBED";
  const sub = info.subscription;

  // Each area loads on its own; one failing area shows its own honest error.
  const [filesR, shootsR, postsR, details] = await Promise.all([
    settle(listDeliverables(business.id, { limit: 200 })),
    settle(listShoots(business.id, 24)),
    settle(sql<PostRow>(
      `select p.id, p.deliverable_id, p.platform, p.status::text as status, p.title, p.format,
              coalesce(p.published_at, p.scheduled_for)::text as "when"
         from calendar_posts p
        where p.business_id = $1 and p.status in ('scheduled', 'published', 'failed')
        order by (p.status = 'failed') desc, (p.status = 'scheduled') desc, coalesce(p.published_at, p.scheduled_for) asc nulls last, p.created_at desc
        limit 60`,
      [business.id],
    )),
    sqlOne<{ city: string | null }>(`select city from businesses where id = $1`, [business.id]),
  ]);
  const files = filesR.ok ? filesR.value : [];
  const shoots = shootsR.ok ? shootsR.value : [];
  const posts = postsR.ok ? postsR.value : [];
  const postByDeliverable = new Map<string, PostInfo>();
  for (const p of posts) if (p.deliverable_id) postByDeliverable.set(p.deliverable_id, { status: p.status, when: p.when, platform: p.platform, format: p.format });
  const withPosts = (list: Deliverable[]): WorkspaceFile[] => list.map((f) => ({ ...f, post: postByDeliverable.get(f.id) ?? null }));
  const shootById = new Map(shoots.map((s) => [s.id, s]));
  const shootLabels: Record<string, string> = {};
  for (const [id, s] of shootById) {
    const n = shoots.slice().reverse().indexOf(s) + 1;
    shootLabels[id] = [`Shoot ${String(n).padStart(2, "0")}`, s.scheduled_for ? dateWithYear(s.scheduled_for) : null].filter(Boolean).join(" · ");
  }

  const newCount = files.filter((f) => f.status === "new").length;
  const active = files.filter((f) => f.status !== "rejected");
  // Overview shows the latest shoot's files first; Library shows everything delivered.
  const latestShootId = active[0]?.shoot_id ?? null;
  // Files waiting for a decision come first, so the workspace opens on the next decision.
  const ORDER: Record<string, number> = { new: 0, approved: 1, scheduled: 2, published: 3, rejected: 4 };
  const byDecision = (a: Deliverable, b: Deliverable) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9);
  const overviewFiles = (latestShootId ? active.filter((f) => f.shoot_id === latestShootId) : []).sort(byDecision);
  const libraryFiles = files.slice().sort(byDecision);
  const monthKey = todayKey.slice(0, 7);
  const monthShoots = shoots.filter((s) => (s.scheduled_for ?? "").startsWith(monthKey) || s.status === "planned");
  const upcoming = posts.filter((p) => p.status === "failed" || p.status === "scheduled");
  const planName = sub ? PLAN_BY_KEY[sub.plan]?.name ?? sub.plan : null;
  const planLine = sub ? `${planName} · ${SUB_STATE[sub.status] ?? sub.status}` : "No plan yet";
  const location = [business.name, details?.city].filter(Boolean).join(" · ");
  const href = (v: View) => (v === "overview" ? "/business/content" : `/business/content?view=${v}`);

  const stateLine = (() => {
    if (!subscribed) return null;
    switch (info.state) {
      case "SUBSCRIBED_NO_SHOOT": return "Your first shoot is being scheduled.";
      case "SHOOT_SCHEDULED": return info.nextShoot?.scheduled_for ? `Next shoot booked for ${dayLabel(info.nextShoot.scheduled_for)}${shootTimeLabel(info.nextShoot.starts_at) ? ` at ${shootTimeLabel(info.nextShoot.starts_at)}` : ""}.` : "Next shoot booked.";
      case "SHOOT_COMPLETED": return "Your shoot happened. Files appear here once the creator uploads them.";
      case "CONTENT_PROCESSING": return "Content is on its way from your shoot.";
      default: return null;
    }
  })();

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row" style={{ alignItems: "flex-start", gap: 16 }}>
        <div>
          <h1 className="fs-t-page">Content</h1>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>{planLine} · <Link href="/business/plan" className="fs-link-accent">{sub ? "Manage plan" : "View plans"}</Link></p>
        </div>
        <Link href="/business/brand" className="fs-btn fs-btn-secondary">Brand kit</Link>
      </div>
      <nav className="fs-filters is-work" aria-label="Views" style={{ marginTop: 20 }}>
        {VIEWS.map((v) => <Link key={v.key} href={href(v.key)} aria-current={view === v.key ? "page" : undefined}>{v.label}</Link>)}
      </nav>

      {!subscribed && view !== "shoots" && (
        <div className="fs-plane" style={{ marginTop: 16, maxWidth: 560 }}>
          <p className="fs-t-label"><span className="fs-status is-neutral">Not subscribed</span></p>
          <p className="fs-t-body" style={{ marginTop: 4 }}>A TapMart plan includes monthly shoots by a verified creator, the delivered files here, and scheduling. Nothing is booked until a plan is active.</p>
          <Link href="/business/plan" className="fs-btn fs-btn-primary" style={{ marginTop: 12 }}>View plans</Link>
        </div>
      )}

      {(view === "overview" || view === "library") && (
        <section aria-labelledby="review-title" style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", minHeight: 30 }}>
            <h2 id="review-title" className="fs-t-section">{view === "library" ? "Library" : newCount > 0 ? "Ready to review" : "Delivered files"}</h2>
            <p className="fs-t-meta">
              {!filesR.ok ? "" : files.length === 0 ? "No delivered files yet" : `${newCount === 0 ? "Nothing waiting for approval" : `${newCount} file${newCount === 1 ? "" : "s"} need${newCount === 1 ? "s" : ""} approval`} · ${active.length} delivered file${active.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {!filesR.ok ? (
            <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-problem">Delivered files could not be loaded.</span> <Link href={href(view)} className="fs-link-ink fs-link-ul">Try again</Link></p>
          ) : (view === "library" ? withPosts(libraryFiles) : withPosts(overviewFiles)).length === 0 ? (
            <div style={{ marginTop: 12, maxWidth: 560 }}>
              <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>{subscribed ? (stateLine ?? "Photos and videos from completed shoots appear here.") : "Delivered files appear here once a plan is active and a shoot has happened."}</p>
            </div>
          ) : (
            <ContentWorkspace files={view === "library" ? withPosts(libraryFiles) : withPosts(overviewFiles)} timeZone={timeZone} timeZoneLabel={zoneLabel} defaultSlot={slot} shootLabels={shootLabels} />
          )}
        </section>
      )}

      {(view === "overview" || view === "shoots") && (
        <section aria-labelledby="shoots-title" className="fs-content-narrow" style={{ marginTop: 32 }}>
          <h2 id="shoots-title" className="fs-t-section">{view === "shoots" || !monthShoots.every((s) => (s.scheduled_for ?? "").startsWith(monthKey)) ? "Shoots" : "This month's shoots"}</h2>
          {!shootsR.ok ? (
            <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-problem">Shoots could not be loaded.</span> <Link href={href(view)} className="fs-link-ink fs-link-ul">Try again</Link></p>
          ) : (view === "shoots" ? shoots : monthShoots).length === 0 ? (
            <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>{subscribed ? "No shoot booked yet. Your monthly shoot is being scheduled." : "A monthly shoot comes with a TapMart plan."}</p>
          ) : (
            <ul className="fs-content-rows" style={{ marginTop: 4 }}>
              {(view === "shoots" ? shoots : monthShoots).map((s) => <li key={s.id}><ShootRow s={s} n={shoots.slice().reverse().indexOf(s) + 1} files={files.filter((f) => f.shoot_id === s.id && f.status !== "rejected").length} location={location} timeZone={timeZone} /></li>)}
            </ul>
          )}
        </section>
      )}

      {(view === "overview" || view === "calendar") && (
        <section aria-labelledby="posts-title" className="fs-content-narrow" style={{ marginTop: 32 }}>
          <h2 id="posts-title" className="fs-t-section">{view === "calendar" ? "Calendar" : "Upcoming posts"}</h2>
          {!postsR.ok ? (
            <p className="fs-t-body" style={{ marginTop: 12 }}><span className="fs-status is-problem">Posts could not be loaded.</span> <Link href={href(view)} className="fs-link-ink fs-link-ul">Try again</Link></p>
          ) : (view === "calendar" ? posts : upcoming).length === 0 ? (
            <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>{view === "calendar" ? "No scheduled or published posts yet. Approve a file, then schedule it." : "No upcoming posts. Approved files can be scheduled from the file."}</p>
          ) : (
            <ul className="fs-content-rows" style={{ marginTop: 4 }}>
              {(view === "calendar" ? posts : upcoming).map((p) => <li key={p.id}><PostRowItem p={p} timeZone={timeZone} todayKey={todayKey} /></li>)}
            </ul>
          )}
          {view === "calendar" && posts.length > 0 && <p className="fs-t-meta" style={{ marginTop: 12 }}>Scheduling does not publish automatically. You post it, then mark it published from the file.</p>}
        </section>
      )}
    </main>
  );
}

/** "Sep 18, 2026" for a day key: dates in rows carry their year. */
function dateWithYear(dayKey: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${dayKey}T00:00:00Z`));
}

/** The zone's short name on a given instant, so a time never hides which clock it is on. */
function zoneNameAt(value: string | Date, timeZone: string): string {
  const d = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" }).formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? timeZone;
}

function ShootRow({ s, n, files, location, timeZone }: { s: ContentShoot; n: number; files: number; location: string; timeZone: string }) {
  const st = SHOOT_STATE[s.status] ?? { label: s.status, tone: "neutral" as const };
  const time = shootTimeLabel(s.starts_at);
  const when = s.scheduled_for ? `${dateWithYear(s.scheduled_for)}${time ? ` at ${time} ${zoneNameAt(`${s.scheduled_for}T12:00:00Z`, timeZone)}` : ""}` : null;
  const delivery = s.delivery_status === "processing" ? "Content on its way" : s.delivery_status === "delivered" ? `Delivery recorded · ${files} file${files === 1 ? "" : "s"} available` : null;
  const planned = `${s.photos_planned} photos · ${s.videos_planned} videos planned`;
  return (
    <Link href={`/business/content/shoots/${s.id}`} className="fs-content-row" aria-label={`Shoot ${String(n).padStart(2, "0")}, ${st.label}`}>
      <span style={{ minWidth: 0 }}>
        <span className="fs-t-task" style={{ display: "block" }}>Shoot {String(n).padStart(2, "0")}{when ? <span className="fs-t-meta"> · {when}</span> : null}</span>
        <span className="fs-t-meta" style={{ display: "block" }}>
          <span className={`fs-status is-${st.tone}`}>{st.label}</span>{delivery ? ` · ${delivery}` : ""} · {planned}
        </span>
        <span className="fs-t-meta" style={{ display: "block" }}>{s.assigned_label ? `Assigned creator ${s.assigned_label}` : s.assigned_to ? "Assigned creator" : "Creator to be assigned"}{s.scheduled_for ? ` · ${location}` : ""}</span>
      </span>
      <ArrowRight size={20} aria-hidden style={{ color: "var(--fs-accent)" }} />
    </Link>
  );
}

const PLATFORM: Record<string, string> = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", google_business: "Google", other: "Other" };
const FORMAT: Record<string, string> = { reel: "Reel", photo: "photo", story: "Story", post: "post" };

function PostRowItem({ p, timeZone, todayKey }: { p: PostRow; timeZone: string; todayKey: string }) {
  const kind = `${PLATFORM[p.platform] ?? p.platform} ${FORMAT[p.format ?? ""] ?? p.format ?? "post"}`;
  const dayKey = p.when ? dayKeyOf(p.when, timeZone) : null;
  const day = dayKey ? groupLabel(dayKey, todayKey) : null;
  const when = p.when && dayKey ? `${day === dayLabel(dayKey, { weekday: false }) ? dateWithYear(dayKey) : day} at ${timeOf(p.when, timeZone)} ${zoneNameAt(p.when, timeZone)}` : null;
  const st = p.status === "published" ? { label: "Published", tone: "confirmed" as const, note: "Marked published" }
    : p.status === "failed" ? { label: "Failed", tone: "problem" as const, note: "The connected account could not post it. Open Connections." }
    : { label: "Scheduled", tone: "waiting" as const, note: "Scheduling does not publish automatically." };
  return (
    <div className={`fs-content-row${p.status === "failed" ? " has-action" : ""}`}>
      <span style={{ minWidth: 0 }}>
        <span className="fs-t-task" style={{ display: "block" }}>{p.title} <span className="fs-t-meta">· {kind}</span></span>
        <span className="fs-t-meta" style={{ display: "block" }}><span className={`fs-status is-${st.tone}`}>{st.label}</span>{when ? ` · ${when}` : ""} · {st.note}</span>
      </span>
      {p.status === "failed" ? <Link href="/business/connections" className="fs-btn fs-btn-secondary">Open Connections</Link> : <span />}
    </div>
  );
}

// Keep the fileState helper referenced for the file-level views that share this module's labels.
void fileState;
