import Link from "next/link";
import { CaretRight, FacebookLogo, GoogleLogo, InstagramLogo, TiktokLogo } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { Avatar, Chip } from "@/components/v2/ui";
import { requireBusinessContext } from "@/lib/v2/core";
import { googleConfigured, GOOGLE_NOT_CONFIGURED, type GoogleMeta } from "@/lib/google/oauth";
import { metaConfigured, META_NOT_CONFIGURED } from "@/lib/social/meta";
import { connectionState, listConnections, STATE_LABEL, type ConnectionRow, type ConnectionState } from "@/lib/social/summary";
import { ConnectionControls } from "./ConnectionControls";

export const metadata = { title: "Connections" };
export const dynamic = "force-dynamic";

function syncedAt(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `Synced ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function StateChip({ state }: { state: ConnectionState }) {
  const tone = state === "connected" ? "rise" : state === "needs_reconnect" || state === "error" ? "alert" : state === "connecting" ? "ink" : "faint";
  return <span className="whitespace-nowrap"><Chip tone={tone}>{STATE_LABEL[state]}</Chip></span>;
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
 * Settings, Connections: every provider as one row with its real state and
 * one action. Nothing here claims a connection that does not exist; when
 * TapMart has no credentials for a provider the button is disabled and the
 * row says why.
 */
export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ error?: string; provider?: string; connected?: string }> }) {
  const [ctx, params] = await Promise.all([requireBusinessContext("/business/settings/connections"), searchParams]);
  const business = ctx.activeBusiness;
  const rows = await listConnections(business.id);
  const rowFor = (p: ConnectionRow["provider"]) => rows.find((r) => r.provider === p);

  const ig = rowFor("instagram");
  const igState = connectionState(ig);
  const igConfigured = metaConfigured();
  const google = rowFor("google_business");
  const googleState = connectionState(google);
  const gConfigured = googleConfigured();
  const gMeta = (google?.meta ?? {}) as GoogleMeta;

  const errorFor = (provider: "google" | "instagram") => {
    if (params.provider !== provider || !params.error) return null;
    if (params.error === "not_configured") return provider === "google" ? GOOGLE_NOT_CONFIGURED : META_NOT_CONFIGURED;
    if (ERRORS[params.error]) return ERRORS[params.error];
    const row = provider === "google" ? google : ig;
    return row?.last_error ?? "The connection did not complete. Try again.";
  };
  const lastErrorFor = (row: ConnectionRow | undefined, state: ConnectionState) =>
    (state === "error" || state === "needs_reconnect") && row?.last_error ? row.last_error : null;

  const quiet: { name: string; Logo: typeof FacebookLogo }[] = [
    { name: "Facebook", Logo: FacebookLogo },
    { name: "TikTok", Logo: TiktokLogo },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Business" />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Connections</h1>
      {params.connected === "instagram" && igState === "connected" && (
        <p className="pop mt-2 text-sm text-signal">Instagram is connected.</p>
      )}

      <ul className="mt-5 divide-y divide-rule" aria-label="Connections">
        {/* ------------------------------------------------------ INSTAGRAM */}
        <li className="reveal py-4">
          <div className="flex items-center gap-3">
            {igState === "connected" && ig?.avatar_url
              ? <Avatar src={ig.avatar_url} name={ig.external_name ?? "Instagram"} size={40} />
              : <InstagramLogo size={32} weight="fill" className="shrink-0 text-ink" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] leading-tight font-700">
                Instagram{igState === "connected" && ig?.external_name ? <span className="text-ink-soft"> @{ig.external_name}</span> : null}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StateChip state={igState} />
                {igState === "connected" && <span className="text-sm text-ink-faint">{syncedAt(ig?.last_synced_at ?? null) ?? "Not synced yet"}</span>}
              </div>
            </div>
            <ConnectionControls provider="instagram" name="Instagram" state={igState} configured={igConfigured} startHref="/api/oauth/instagram/start" />
          </div>
          {!igConfigured && igState !== "connected" && <p className="mt-2 text-sm text-ink-soft">{META_NOT_CONFIGURED}</p>}
          {(errorFor("instagram") ?? lastErrorFor(ig, igState)) && (
            <p role="alert" className="mt-2 text-sm alert-text">{errorFor("instagram") ?? lastErrorFor(ig, igState)}</p>
          )}
          {igState === "connected" && (
            <Link href="/business/social" className="link-row mt-1 text-sm">See Instagram insights<CaretRight size={14} aria-hidden /></Link>
          )}
        </li>

        {/* -------------------------------------------------------- GOOGLE */}
        <li className="reveal py-4" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-3">
            <GoogleLogo size={32} weight="bold" className="shrink-0 text-ink" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-display text-[1.0625rem] leading-tight font-700">
                Google Business Profile{googleState === "connected" && gMeta.location?.title ? <span className="block truncate text-ink-soft">{gMeta.location.title}</span> : null}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <StateChip state={googleState} />
                {googleState === "connected" && <span className="text-sm text-ink-faint">{syncedAt(google?.last_synced_at ?? null) ?? "Not synced yet"}</span>}
                {googleState === "connecting" && <span className="text-sm text-ink-faint">Pick a location to finish</span>}
              </div>
            </div>
            <ConnectionControls
              provider="google_business" name="Google" state={googleState} configured={gConfigured} startHref="/api/oauth/google/start"
              resumeHref={googleState === "connecting" && (gMeta.locations?.length ?? 0) > 0 ? "/business/settings/connections/google" : undefined}
            />
          </div>
          {!gConfigured && googleState !== "connected" && <p className="mt-2 text-sm text-ink-soft">{GOOGLE_NOT_CONFIGURED}</p>}
          {(errorFor("google") ?? lastErrorFor(google, googleState)) && (
            <p role="alert" className="mt-2 text-sm alert-text">{errorFor("google") ?? lastErrorFor(google, googleState)}</p>
          )}
          {googleState === "connected" && (
            <Link href="/business/google" className="link-row mt-1 text-sm">Open the Google check<CaretRight size={14} aria-hidden /></Link>
          )}
        </li>

        {/* ------------------------------------------------- NOT AVAILABLE */}
        {quiet.map((q, i) => (
          <li key={q.name} className="reveal flex items-center gap-3 py-4" style={{ animationDelay: `${(i + 2) * 60}ms` }}>
            <q.Logo size={32} weight="fill" className="shrink-0 text-ink-faint" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.0625rem] leading-tight font-700 text-ink-soft">{q.name}</p>
              <p className="mt-1 text-sm text-ink-faint">Not available yet</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
