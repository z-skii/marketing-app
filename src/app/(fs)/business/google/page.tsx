import Link from "next/link";
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { getGoogleProfileSnapshot, getLastGoogleHealth, type GoogleCheck } from "@/lib/google/business";
import { describePeriods, googleFixes, GOOGLE_PROFILE_URL } from "@/lib/google/fixes";
import { getGoogleConnection, googleConfigured, GOOGLE_NOT_CONFIGURED, type GoogleHoursPeriod, type GoogleMeta } from "@/lib/google/oauth";
import { connectionStateFrom, googleIssueLine } from "@/lib/google/summary";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { Facts } from "@/components/fs/work/DetailParts";
import { ConnectGoogleButton, DisconnectGoogleButton, FixList, RunCheckButton } from "@/components/fs/settings/GoogleControls";
import { BackLink } from "@/components/fs/work/BackLink";

export const metadata = { title: "Google Business" };
export const dynamic = "force-dynamic";

function when(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function observedText(check: GoogleCheck): string {
  const o = check.observed;
  if (o === null || o === undefined) return "nothing";
  if (check.key === "photo_activity" && typeof o === "string") return `last photo added ${when(o) ?? o}`;
  if (check.key === "hours" && Array.isArray(o)) return describePeriods(o as GoogleHoursPeriod[]) ?? `${o.length} entries`;
  if (typeof o === "string") return o.length > 140 ? `${o.slice(0, 140)}...` : o;
  if (typeof o === "number") return check.key === "photos" ? `${o} photo${o === 1 ? "" : "s"}` : String(o);
  if (Array.isArray(o)) return `${o.length} entr${o.length === 1 ? "y" : "ies"}`;
  if (typeof o === "object") { const r = o as Record<string, unknown>; if ("unanswered" in r) return `${r.unanswered} of ${r.total ?? "?"} reviews without a reply`; }
  return check.detail;
}

/**
 * Google Business Profile. Before a connection there is one thing to do:
 * connect. Nothing is judged before that. After it, everything on the
 * screen comes from the listing Google returned: what needs attention with
 * the value Google reported, the fixes as Current and Proposed, and reviews
 * waiting for a reply. Ranking and search performance are never shown.
 */
export default async function GooglePage({ searchParams }: { searchParams: Promise<{ connected?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/google"), searchParams]);
  const business = ctx.activeBusiness;
  const canEdit = business.member_role === "owner" || business.member_role === "manager" || ctx.user.role === "admin";
  const connection = await getGoogleConnection(business.id);
  const state = connectionStateFrom(connection);
  const configured = googleConfigured();
  const back = <BackLink fallback="/business/settings" label="Settings" />;

  if (state !== "connected") {
    const meta = (connection?.meta ?? {}) as GoogleMeta;
    return (
      <main className="fs-phone-main fs-utility" id="main">
        <UtilityHead title="Google Business" back={back} />
        <div className="fs-plane is-decision" style={{ marginTop: 16 }}>
          <p className="fs-t-label">{state === "needs_reconnect" ? "Reconnect required" : state === "error" ? "Needs attention" : state === "connecting" ? "One step left" : "Not connected"}</p>
          <p className="fs-t-task" style={{ marginTop: 4 }}>{state === "connecting" ? "Pick which Google location TapMart manages." : "Connect your Google Business Profile so TapMart can read the real listing."}</p>
          <p className="fs-t-body" style={{ marginTop: 8, color: "var(--fs-muted)" }}>Until it is connected there is nothing to check. After it, TapMart shows only what Google returns: missing information, hours, category, photos and reviews, each with a fix you approve.</p>
          {state === "connecting" && (meta.locations?.length ?? 0) > 0
            ? <Link href="/business/settings/connections/google" className="fs-btn fs-btn-primary" style={{ marginTop: 16 }}>Pick your location</Link>
            : <ConnectGoogleButton configured={configured} label={state === "needs_reconnect" || state === "error" ? "Reconnect Google" : "Connect Google Business"} />}
          {!configured && <p className="fs-t-meta" style={{ marginTop: 12 }}>{GOOGLE_NOT_CONFIGURED}</p>}
          {(state === "needs_reconnect" || state === "error") && connection?.last_error && <p role="alert" className="fs-note is-problem fs-t-meta" style={{ marginTop: 12 }}>{connection.last_error}</p>}
        </div>
      </main>
    );
  }

  const [health, profile] = await Promise.all([getLastGoogleHealth(business.id), getGoogleProfileSnapshot(business.id)]);
  const meta = connection!.meta as GoogleMeta;
  const title = profile?.name ?? meta.location?.title ?? connection!.external_name ?? "Your listing";
  const address = profile?.address ?? meta.location?.address ?? null;
  const synced = when(connection!.last_synced_at);
  const failing = (health?.checks ?? []).filter((c) => c.status !== "ok").sort((a, b) => (a.status === "missing" ? 0 : 1) - (b.status === "missing" ? 0 : 1));
  const passing = (health?.checks.length ?? 0) - failing.length;
  const fixes = health ? await googleFixes(business.id, failing) : [];
  const unanswered = profile?.reviews?.unanswered_items ?? [];
  const mapsHref = profile?.maps_uri ?? GOOGLE_PROFILE_URL;

  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Google Business" back={back} />
      <p className="fs-t-task" style={{ marginTop: 4 }}>{title}</p>
      {address && <p className="fs-t-meta">{address}</p>}
      <p className="fs-t-meta" style={{ marginTop: 4 }}><span className="fs-status is-confirmed">Connected</span> · {synced ? `Listing read ${synced}` : "Listing not read yet"}{params.connected === "1" && <> · Google is connected.</>}</p>

      <section aria-labelledby="listing-title" style={{ marginTop: 24 }}>
        {health ? (
          <>
            <h2 id="listing-title" className="fs-t-section">{failing.length === 0 ? "Your listing is complete" : `${failing.length} thing${failing.length === 1 ? "" : "s"} on your listing need${failing.length === 1 ? "s" : ""} attention`}</h2>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>{passing} of {health.checks.length} checks pass{when(health.ran_at) ? ` · Checked ${when(health.ran_at)}` : ""}. Each item is what Google reported, not an estimate.</p>
            {failing.length > 0 && (
              <ul className="fs-plain-list" aria-label="Needs attention" style={{ marginTop: 8 }}>
                {failing.map((c, i) => (
                  <li key={c.key} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--fs-divider)" : undefined }}>
                    <p className="fs-t-body"><span className={`fs-status is-${c.status === "missing" ? "problem" : "waiting"}`}>{c.status === "missing" ? "Missing" : "Check"}</span> · {googleIssueLine(c)}</p>
                    <p className="fs-t-meta" style={{ marginTop: 2 }}>Google reports: {observedText(c)}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h2 id="listing-title" className="fs-t-section">Nothing read yet</h2>
            <p className="fs-t-meta" style={{ marginTop: 4 }}>Read the listing from Google to see what is complete and what is not.</p>
          </>
        )}
        <div style={{ marginTop: 16 }}><RunCheckButton first={!health} /></div>
      </section>

      {fixes.length > 0 && (
        <section aria-labelledby="fix-title" style={{ marginTop: 32 }}>
          <h2 id="fix-title" className="fs-t-section">Fixes you can approve</h2>
          <p className="fs-t-meta" style={{ marginTop: 4 }}>Nothing changes on Google until you approve it here, one change at a time.</p>
          <FixList fixes={fixes} canEdit={canEdit} />
        </section>
      )}

      {unanswered.length > 0 && (
        <section aria-labelledby="reviews-title" style={{ marginTop: 32 }}>
          <h2 id="reviews-title" className="fs-t-section">Reviews without a reply</h2>
          <ul className="fs-plain-list" style={{ marginTop: 8 }}>
            {unanswered.map((r, i) => (
              <li key={r.id || i} style={{ padding: "12px 0", borderTop: i ? "1px solid var(--fs-divider)" : undefined }}>
                <p className="fs-t-meta">{r.rating !== null ? `${r.rating} of 5 · ` : ""}{r.reviewer ?? "A customer"}{r.createTime ? ` · ${when(r.createTime)}` : ""}</p>
                <p className="fs-t-body" style={{ marginTop: 4 }}>{r.text ?? "No text, only a rating."}</p>
                <a href={mapsHref} target="_blank" rel="noreferrer" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Reply on Google <ArrowSquareOut size={16} aria-hidden /></a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {profile?.reviews?.unavailable_reason && <p className="fs-t-meta" style={{ marginTop: 16 }}>{profile.reviews.unavailable_reason}</p>}

      {profile && (
        <section aria-labelledby="listing-facts" style={{ marginTop: 32 }}>
          <h2 id="listing-facts" className="fs-t-section">On the listing</h2>
          <Facts rows={[
            ["Category", profile.category ?? "Not set"],
            ["Phone", profile.phone ?? "Not set"],
            ["Website", profile.website ?? "Not set"],
            ["Hours", describePeriods(profile.hours) ?? "Not set"],
            ["Photos", profile.photo_count != null ? String(profile.photo_count) : profile.photos_unavailable_reason ?? "Unknown"],
            ["Reviews", profile.reviews?.total != null ? `${profile.reviews.total}${profile.reviews.average != null ? ` · ${profile.reviews.average.toFixed(1)} average` : ""}` : profile.reviews?.unavailable_reason ?? "Unknown"],
          ]} />
        </section>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", marginTop: 32 }}>
        <a href={mapsHref} target="_blank" rel="noreferrer" className="fs-btn fs-btn-secondary">Open the listing on Google <ArrowSquareOut size={16} aria-hidden /></a>
        <DisconnectGoogleButton />
      </div>
    </main>
  );
}
