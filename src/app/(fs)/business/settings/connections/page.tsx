import Link from "next/link";
import { ArrowRight, GoogleLogo, InstagramLogo, FacebookLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { googleConfigured, GOOGLE_NOT_CONFIGURED, type GoogleMeta } from "@/lib/google/oauth";
import { metaConfigured, META_NOT_CONFIGURED } from "@/lib/social/meta";
import { connectionState, listConnections, NEEDS_RECONNECT, type ConnectionRow, type ConnectionState } from "@/lib/social/summary";
import { STATE_WORD } from "@/lib/fs/business-identity";
import { UtilityHead } from "@/components/fs/settings/Rows";
import { ConnectionControls } from "@/components/fs/settings/ConnectionControls";
import { BackLink } from "@/components/fs/work/BackLink";
import { Avatar } from "@/components/fs/parts";

export const metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

function syncedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Read ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

const ERRORS: Record<string, string> = {
  state: "The connection link expired. Start again.",
  session: "Sign in with the same account that started the connection.",
  denied: "The connection was cancelled on the provider's side. Nothing was stored.",
  code: "The provider sent no code back. Start again.",
  not_allowed: "Only an owner or manager can connect accounts.",
  no_locations: "That Google account manages no Business Profile locations.",
};

/**
 * Connections: every provider as one row with its real stored state and
 * one action. Connected, Finish connecting, Reconnect required, Needs
 * attention, Not connected. When TapMart has no credentials for a
 * provider the button is disabled and the row says why. Nothing here
 * claims a connection or a health that the record does not hold.
 */
export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ error?: string; provider?: string; connected?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/settings/connections"), searchParams]);
  const rows = await listConnections(ctx.activeBusiness.id);
  const rowFor = (p: ConnectionRow["provider"]) => rows.find((r) => r.provider === p);
  const ig = rowFor("instagram"); const igState = connectionState(ig); const igConfigured = metaConfigured();
  const google = rowFor("google_business"); const googleState = connectionState(google); const gConfigured = googleConfigured();
  const gMeta = (google?.meta ?? {}) as GoogleMeta;

  const errorFor = (provider: "google" | "instagram") => {
    if (params.provider !== provider || !params.error) return null;
    if (params.error === "not_configured") return provider === "google" ? GOOGLE_NOT_CONFIGURED : META_NOT_CONFIGURED;
    if (ERRORS[params.error]) return ERRORS[params.error];
    return (provider === "google" ? google : ig)?.last_error ?? "The connection did not complete. Try again.";
  };
  const lastErrorFor = (row: ConnectionRow | undefined, state: ConnectionState) => (state === "error" || state === "needs_reconnect") && row?.last_error && row.last_error !== NEEDS_RECONNECT ? row.last_error : null;
  const stateLine = (state: ConnectionState, row: ConnectionRow | undefined, extra?: string | null) => (
    <span className="fs-t-meta" style={{ display: "block" }}>
      <span className={`fs-status is-${STATE_WORD[state].tone}`}>{STATE_WORD[state].label}</span>
      {state === "connected" && <> · {syncedAt(row?.last_synced_at ?? null) ?? "Not read yet"}</>}
      {extra && <> · {extra}</>}
    </span>
  );

  return (
    <main className="fs-phone-main fs-utility" id="main">
      <UtilityHead title="Connections" lede={undefined} back={<BackLink fallback="/business/settings" label="Settings" />} />
      {params.connected === "instagram" && igState === "connected" && <p role="status" className="fs-status is-confirmed" style={{ marginTop: 8 }}>Instagram is connected.</p>}

      <ul className="fs-plain-list" aria-label="Connections" style={{ marginTop: 16 }}>
        <li>
          <div className="fs-conn-row">
            {igState === "connected" && ig?.avatar_url ? <Avatar src={ig.avatar_url} name={ig.external_name ?? "Instagram"} size={40} /> : <InstagramLogo size={32} aria-hidden />}
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Instagram{igState === "connected" && ig?.external_name ? <span className="fs-t-meta"> @{ig.external_name.replace(/^@/, "")}</span> : null}</span>
              {stateLine(igState, ig)}
            </span>
            <ConnectionControls provider="instagram" name="Instagram" state={igState} configured={igConfigured} startHref="/api/oauth/instagram/start" />
          </div>
          {!igConfigured && igState !== "connected" && <p className="fs-t-meta" style={{ marginTop: -4, paddingBottom: 12 }}>{META_NOT_CONFIGURED}</p>}
          {(errorFor("instagram") ?? lastErrorFor(ig, igState)) && <p role="alert" className="fs-note is-problem fs-t-meta" style={{ marginBottom: 12 }}>{errorFor("instagram") ?? lastErrorFor(ig, igState)}</p>}
          {igState === "connected" && (
            <div style={{ marginTop: -4, paddingBottom: 12 }}>
              <p className="fs-t-meta">Only what Instagram returns for this account is shown anywhere in TapMart.</p>
              <Link href="/business/social" className="fs-link-ink fs-link-ul" style={{ display: "inline-flex", alignItems: "center", minHeight: 44, whiteSpace: "nowrap" }}>See what was read</Link>
            </div>
          )}
        </li>
        <li>
          <div className="fs-conn-row">
            <GoogleLogo size={32} aria-hidden />
            <span style={{ minWidth: 0 }}>
              <span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>Google Business Profile</span>
              {googleState === "connected" && gMeta.location?.title && <span className="fs-t-meta" style={{ display: "block", overflowWrap: "anywhere" }}>{gMeta.location.title}</span>}
              {stateLine(googleState, google, googleState === "connecting" ? "Pick a location to finish" : null)}
            </span>
            <ConnectionControls provider="google_business" name="Google" state={googleState} configured={gConfigured} startHref="/api/oauth/google/start" resumeHref={googleState === "connecting" && (gMeta.locations?.length ?? 0) > 0 ? "/business/settings/connections/google" : undefined} />
          </div>
          {!gConfigured && googleState !== "connected" && <p className="fs-t-meta" style={{ marginTop: -4, paddingBottom: 12 }}>{GOOGLE_NOT_CONFIGURED}</p>}
          {(errorFor("google") ?? lastErrorFor(google, googleState)) && <p role="alert" className="fs-note is-problem fs-t-meta" style={{ marginBottom: 12 }}>{errorFor("google") ?? lastErrorFor(google, googleState)}</p>}
          {googleState === "connected" && <Link href="/business/google" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: -4, marginBottom: 8 }}>Open Google Business <ArrowRight size={20} aria-hidden /></Link>}
        </li>
        {[{ name: "Facebook", Logo: FacebookLogo }, { name: "TikTok", Logo: TiktokLogo }].map((q) => (
          <li key={q.name} className="fs-conn-row" style={{ color: "var(--fs-muted)" }}>
            <q.Logo size={32} aria-hidden />
            <span style={{ minWidth: 0 }}><span className="fs-t-body" style={{ display: "block", fontWeight: 500 }}>{q.name}</span><span className="fs-t-meta" style={{ display: "block" }}>Not available yet</span></span>
          </li>
        ))}
      </ul>
    </main>
  );
}
