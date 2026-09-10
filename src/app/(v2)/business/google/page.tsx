import Link from "next/link";
import { ArrowSquareOut, CaretRight, CheckCircle, Star, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { Chip } from "@/components/v2/ui";
import { requireBusinessContext } from "@/lib/v2/core";
import { getGoogleProfileSnapshot, getLastGoogleHealth, type GoogleCheck } from "@/lib/google/business";
import { describePeriods, googleFixes, GOOGLE_PROFILE_URL } from "@/lib/google/fixes";
import { getGoogleConnection, googleConfigured, GOOGLE_NOT_CONFIGURED, type GoogleHoursPeriod, type GoogleMeta } from "@/lib/google/oauth";
import { connectionStateFrom, googleIssueLine } from "@/lib/google/summary";
import { RunCheckButton } from "./RunCheckButton";
import { ConnectGoogleButton, DisconnectGoogleButton, FixList } from "./GoogleControls";

export const metadata = { title: "Google Business Profile" };
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
  if (typeof o === "object") {
    const r = o as Record<string, unknown>;
    if ("unanswered" in r) return `${r.unanswered} of ${r.total ?? "?"} reviews without a reply`;
  }
  return check.detail;
}

/**
 * Google Business Profile. Before a connection there is one thing to do:
 * connect. After it, everything on the screen comes from the listing
 * Google returned: what needs attention (with the value Google reported),
 * the fixes as Current and Proposed, and reviews waiting for a reply.
 */
export default async function GooglePage({ searchParams }: { searchParams: Promise<{ connected?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/google"), searchParams]);
  const business = ctx.activeBusiness;
  const canEdit = business.member_role === "owner" || business.member_role === "manager" || ctx.user.role === "admin";

  const connection = await getGoogleConnection(business.id);
  const state = connectionStateFrom(connection);
  const configured = googleConfigured();

  // ------------------------------------------------------------ NOT CONNECTED
  if (state !== "connected") {
    const meta = (connection?.meta ?? {}) as GoogleMeta;
    return (
      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
        <BackButton fallback="/business/settings" label="Business" />
        <h2 className="eyebrow mt-3">Google Business Profile</h2>
        <h1 className="mt-2 font-display text-[1.75rem] leading-tight font-800 tracking-[-0.03em] md:text-[2.25rem]">
          Connect Google to let TapMart check and help manage your business listing.
        </h1>
        {state === "connecting" && (meta.locations?.length ?? 0) > 0 ? (
          <Link href="/business/settings/connections/google" className="btn btn-signal btn-lg mt-5 w-full">Pick your location</Link>
        ) : (
          <ConnectGoogleButton configured={configured} label={state === "needs_reconnect" || state === "error" ? "Reconnect Google" : "Connect Google"} />
        )}
        {!configured && <p className="mt-3 text-sm text-ink-soft">{GOOGLE_NOT_CONFIGURED}</p>}
        {(state === "needs_reconnect" || state === "error") && connection?.last_error && (
          <p role="alert" className="mt-3 text-sm alert-text">{connection.last_error}</p>
        )}
      </main>
    );
  }

  // ---------------------------------------------------------------- CONNECTED
  const [health, profile] = await Promise.all([getLastGoogleHealth(business.id), getGoogleProfileSnapshot(business.id)]);
  const meta = connection!.meta as GoogleMeta;
  const title = profile?.name ?? meta.location?.title ?? connection!.external_name ?? "Your listing";
  const address = profile?.address ?? meta.location?.address ?? null;
  const synced = when(connection!.last_synced_at);
  const failing = (health?.checks ?? [])
    .filter((c) => c.status !== "ok")
    .sort((a, b) => (a.status === "missing" ? 0 : 1) - (b.status === "missing" ? 0 : 1));
  const passing = (health?.checks.length ?? 0) - failing.length;
  const fixes = health ? await googleFixes(business.id, failing) : [];
  const unanswered = profile?.reviews?.unanswered_items ?? [];
  const mapsHref = profile?.maps_uri ?? GOOGLE_PROFILE_URL;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h2 className="eyebrow mt-3">Google Business Profile</h2>
      <h1 className="mt-2 font-display text-[1.75rem] leading-tight font-800 tracking-[-0.03em] md:text-[2rem]">{title}</h1>
      {address && <p className="mt-1 text-[0.9375rem] text-ink-soft">{address}</p>}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-faint">
        <Chip tone="rise">Connected</Chip>
        <span>{synced ? `Last synced ${synced}` : "Not synced yet"}</span>
        {params.connected === "1" && <span className="pop text-signal">Google is connected.</span>}
      </p>

      {/* ------------------------------------------------------------ STATUS */}
      <section className="mt-8" aria-labelledby="attention-title">
        {health ? (
          <>
            <p id="attention-title" className={`font-display text-[2rem] leading-none font-800 tracking-[-0.03em] md:text-[2.5rem] ${failing.length === 0 ? "text-signal" : "text-ink"}`}>
              {failing.length === 0 ? "Looking good" : "Needs attention"}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              <span className="tnum font-display font-700 text-ink">{health.score}</span> out of 100
              {when(health.ran_at) && <span className="text-ink-faint"> · Checked {when(health.ran_at)}</span>}
            </p>
            <ul className="mt-5 divide-y divide-rule" aria-label="Checks">
              {failing.map((c, i) => (
                <li key={c.key} className="reveal py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                  <p className="flex items-center gap-2 text-[0.9375rem] text-ink">
                    <WarningCircle size={18} weight="fill" className="shrink-0 text-alert" aria-hidden />
                    {googleIssueLine(c)}
                  </p>
                  <p className="mt-1 pl-6.5 text-sm text-ink-faint">Google reports: {observedText(c)}</p>
                </li>
              ))}
              {passing > 0 && (
                <li className="flex items-center gap-2 py-3 text-[0.9375rem] text-ink-soft">
                  <CheckCircle size={18} weight="fill" className="shrink-0 text-rise" aria-hidden />
                  {failing.length === 0 ? "Every check passes." : `${passing} of ${health.checks.length} checks pass.`}
                </li>
              )}
            </ul>
          </>
        ) : (
          <>
            <p id="attention-title" className="font-display text-[1.5rem] leading-tight font-800 tracking-[-0.02em]">No check yet</p>
            <p className="mt-1 text-sm text-ink-soft">Run the check to read the listing from Google.</p>
          </>
        )}
        <div className="mt-5"><RunCheckButton /></div>
      </section>

      {/* -------------------------------------------------------- FIX GOOGLE */}
      {fixes.length > 0 && (
        <section className="mt-10" aria-labelledby="fix-title">
          <h2 id="fix-title" className="eyebrow">Fix Google</h2>
          <p className="mt-1 text-sm text-ink-soft">Nothing changes on Google until you approve it here.</p>
          <FixList fixes={fixes} canEdit={canEdit} />
        </section>
      )}

      {/* ----------------------------------------------------------- REVIEWS */}
      {unanswered.length > 0 && (
        <section className="mt-10" aria-labelledby="reviews-title">
          <h2 id="reviews-title" className="eyebrow">Reviews without a reply</h2>
          <ul className="mt-1 divide-y divide-rule">
            {unanswered.map((r, i) => (
              <li key={r.id || i} className="reveal py-3" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                <p className="flex items-center gap-2 text-sm text-ink-soft">
                  {r.rating !== null && (
                    <span className="flex items-center gap-0.5 text-signal" aria-label={`${r.rating} stars`}>
                      {Array.from({ length: r.rating }).map((_, s) => <Star key={s} size={14} weight="fill" aria-hidden />)}
                    </span>
                  )}
                  <span className="truncate">{r.reviewer ?? "A customer"}{r.createTime ? ` · ${when(r.createTime)}` : ""}</span>
                </p>
                <p className="mt-1 text-[0.9375rem] text-ink">{r.text ?? "No text, only a rating."}</p>
                <a href={mapsHref} target="_blank" rel="noreferrer" className="link-row text-sm">Reply in Google<ArrowSquareOut size={14} aria-hidden /></a>
              </li>
            ))}
          </ul>
        </section>
      )}
      {profile?.reviews?.unavailable_reason && (
        <p className="mt-6 text-sm text-ink-faint">{profile.reviews.unavailable_reason}</p>
      )}

      {/* ---------------------------------------------------------- FOOTER */}
      <section className="mt-12 flex flex-col gap-3">
        <a href={mapsHref} target="_blank" rel="noreferrer" className="link-row text-sm">Open the listing on Google<CaretRight size={14} aria-hidden /></a>
        <DisconnectGoogleButton />
      </section>
    </main>
  );
}
