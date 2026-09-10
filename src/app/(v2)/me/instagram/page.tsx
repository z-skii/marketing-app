import Link from "next/link";
import { CheckCircle, InstagramLogo } from "@phosphor-icons/react/dist/ssr";
import { BackButton } from "@/components/v2/BackButton";
import { MediaPreview } from "@/components/v2/MediaPreview";
import { Avatar, Chip } from "@/components/v2/ui";
import { requireOnboarded } from "@/lib/v2/core";
import { getInstagramForProfile } from "@/lib/v2/instagram";
import { safeReturnPath } from "@/lib/v2/paths";
import { ConnectInstagramButton, DisconnectButton, ManualHandleForm } from "./InstagramForm";

export const metadata = { title: "Instagram" };
export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  state: "The connection link expired. Try again.",
  session: "Sign in with the same account that started the connection.",
  denied: "The connection was cancelled at Instagram. Nothing was stored.",
  code: "Instagram sent no code back. Try again.",
  not_configured: "TapMart's Instagram connection is not configured yet. Ask support to enable it.",
};

function synced(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `Synced ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

/**
 * A person's Instagram in its real state: not connected (connect through
 * Instagram, or add a handle TapMart confirms), connecting, connected
 * (through Instagram or confirmed by TapMart), needs reconnect, error.
 * Follower counts appear only once the account is connected.
 * `?return=/o/<id>` sends the person back to the Story campaign after.
 */
export default async function InstagramPage({ searchParams }: { searchParams: Promise<{ return?: string; error?: string; connected?: string }> }) {
  const [ctx, params] = await Promise.all([requireOnboarded("/me/instagram"), searchParams]);
  const returnTo = safeReturnPath(params.return);
  const ig = await getInstagramForProfile(ctx.user.id);
  const configured = ig.apiConfigured;
  const errorLine = params.error ? (ERRORS[params.error] ?? ig.lastError ?? "The connection did not complete. Try again.") : null;
  const notConfigured = "TapMart's Instagram connection is not configured yet. Ask support to enable it.";

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback={returnTo ?? "/me"} label={returnTo ? "Campaign" : "Profile"} />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Instagram</h1>

      {/* ------------------------------------------------------- NOT CONNECTED */}
      {ig.status === "disconnected" && (
        <>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">Story campaigns need an Instagram account.</p>
          <ConnectInstagramButton configured={configured} returnTo={returnTo} />
          {!configured && <p className="mt-3 text-sm text-ink-soft">{notConfigured}</p>}
          {errorLine && <p role="alert" className="mt-3 text-sm alert-text">{errorLine}</p>}
          <ManualHandleForm returnTo={returnTo} initialHandle={null} primary={!configured} />
        </>
      )}

      {/* ---------------------------------------------------------- CONNECTING */}
      {ig.status === "pending" && (
        <section className="card mt-5 p-4 md:p-5" aria-label="Connecting">
          <p className="flex items-center gap-2 text-sm text-ink-soft"><span className="live-dot" aria-hidden />Connecting</p>
          <p className="mt-1 font-display text-[1.5rem] leading-tight font-800 tracking-[-0.02em]">@{ig.handle}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-faint">Someone at TapMart is confirming this handle. You can still open Story campaigns; approval of your proof waits for the check.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <DisconnectButton />
            {returnTo && <Link href={returnTo} className="btn btn-signal">Back to the campaign</Link>}
          </div>
        </section>
      )}

      {/* ----------------------------------------------------------- CONNECTED */}
      {ig.status === "connected" && (
        <section className="mt-5" aria-label="Connected">
          <div className="flex items-center gap-4">
            {ig.avatarUrl ? <Avatar src={ig.avatarUrl} name={ig.handle ?? "Instagram"} size={64} /> : <InstagramLogo size={48} weight="fill" className="text-ink" aria-hidden />}
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[1.5rem] leading-tight font-800 tracking-[-0.02em] text-signal">
                @{ig.handle}
                <CheckCircle size={20} weight="fill" className="ml-1.5 inline-block align-[-3px]" aria-label="Connected" />
              </p>
              {ig.followers !== null && <p className="tnum mt-1 text-sm text-ink-soft">{ig.followers.toLocaleString("en-US")} followers</p>}
            </div>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-faint">
            <Chip tone="rise">{ig.verifiedBy === "api" ? "Connected via Instagram" : "Confirmed by TapMart"}</Chip>
            {ig.verifiedBy === "api" && (synced(ig.lastSyncedAt) ?? null)}
            {params.connected === "1" && <span className="pop text-signal">Instagram is connected.</span>}
          </p>
          {ig.media.length > 0 && (
            <ul className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Latest posts">
              {ig.media.slice(0, 8).map((m, i) => {
                const thumb = m.thumbnail_url ?? m.media_url;
                return (
                  <li key={m.id} className="reveal relative aspect-square overflow-hidden rounded-[8px] bg-surface-2" style={{ animationDelay: `${Math.min(i, 6) * 60}ms` }}>
                    {thumb && <MediaPreview src={thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <DisconnectButton />
            {returnTo && <Link href={returnTo} className="btn btn-signal">Back to the campaign</Link>}
          </div>
        </section>
      )}

      {/* ---------------------------------------------- NEEDS RECONNECT / ERROR */}
      {ig.status === "error" && (
        <section className="mt-5" aria-label={ig.verifiedBy === "api" ? "Needs reconnect" : "Error"}>
          <Chip tone="alert">{ig.verifiedBy === "api" ? "Needs reconnect" : "Error"}</Chip>
          <p className="mt-2 font-display text-[1.375rem] leading-tight font-800 tracking-[-0.02em]">
            {ig.verifiedBy === "api" ? "Instagram needs to be connected again." : ig.handle ? `@${ig.handle} could not be confirmed.` : "The connection did not complete."}
          </p>
          {(errorLine ?? ig.lastError) && <p role="alert" className="mt-2 text-sm alert-text">{errorLine ?? ig.lastError}</p>}
          <ConnectInstagramButton configured={configured} returnTo={returnTo} label={ig.verifiedBy === "api" ? "Reconnect Instagram" : "Connect Instagram"} />
          {!configured && <p className="mt-3 text-sm text-ink-soft">{notConfigured}</p>}
          <ManualHandleForm returnTo={returnTo} initialHandle={ig.handle} primary={!configured} />
        </section>
      )}

      <div className="mt-8">
        <p className="text-sm text-ink-faint">What Instagram is used for</p>
        <ul className="row-list mt-2">
          <li className="card px-4 py-3">
            <p className="font-display text-[0.9375rem] font-700">Story campaigns</p>
            <p className="text-sm text-ink-faint">Post a ready-made Story, keep it live, send a screenshot and the link, get paid.</p>
          </li>
          <li className="card px-4 py-3">
            <p className="font-display text-[0.9375rem] font-700">Follower minimums</p>
            <p className="text-sm text-ink-faint">Some campaigns ask for a minimum. A confirmed count decides which ones you see as ready to take.</p>
          </li>
        </ul>
      </div>
    </main>
  );
}
