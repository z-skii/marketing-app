import Link from "next/link";
import { BackButton } from "@/components/v2/BackButton";
import { getV2Context } from "@/lib/v2/core";
import { isInstagramApiConfigured } from "@/lib/v2/instagram";
import { safeReturnPath } from "@/lib/v2/paths";
import { ConnectForm, DisconnectButton } from "./InstagramForm";

export const metadata = { title: "Instagram" };
export const dynamic = "force-dynamic";

/**
 * The Instagram screen. There is no Meta API connection yet and the copy
 * says so: a person adds a handle and a follower count, and someone at
 * TapMart checks it. `?return=/o/<id>` sends them back to the Story
 * campaign they came from once the handle is saved.
 */
export default async function InstagramPage({
  searchParams,
}: { searchParams: Promise<{ return?: string }> }) {
  const [ctx, params] = await Promise.all([getV2Context(), searchParams]);
  if (!ctx) return null;
  const returnTo = safeReturnPath(params.return);
  const ig = ctx.instagram;
  const apiLive = isInstagramApiConfigured();
  const connected = ig.status === "connected" || ig.status === "pending";

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback={returnTo ?? "/me"} label={returnTo ? "Campaign" : "Profile"} />
      <h1 className="mt-3 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Instagram</h1>

      {!connected ? (
        <>
          <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-soft">
            Story campaigns need an Instagram account. Add your handle and follower count. Until TapMart&apos;s Instagram connection is live, a person checks it, so keep it accurate.
          </p>
          {ig.status === "error" && (
            <p className="mt-3 text-sm text-signal">The last handle could not be confirmed. Check it and add it again.</p>
          )}
          <ConnectForm returnTo={returnTo} initialHandle={ig.status === "error" ? ig.handle : null} />
        </>
      ) : (
        <>
          <div className="card mt-5 p-4 md:p-5">
            <p className="text-sm text-ink-soft">{ig.status === "connected" ? "Connected" : "Checking"}</p>
            <p className={`mt-1 font-display text-[1.5rem] leading-tight font-800 tracking-[-0.02em] ${ig.status === "connected" ? "text-signal" : "text-ink"}`}>
              @{ig.handle}
              {ig.status === "connected" && <span className="ml-2" aria-label="Connected">✓</span>}
            </p>
            {ig.followers != null && (
              <p className="tnum mt-1 text-sm text-ink-soft">{ig.followers.toLocaleString()} followers</p>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink-faint">
              {ig.status === "pending"
                ? "Someone at TapMart is checking this handle. You can still open Story campaigns; approval of your proof waits for the check."
                : ig.verifiedBy === "manual"
                  ? "Checked by a person at TapMart."
                  : "Checked through Instagram."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <DisconnectButton />
              {returnTo && <Link href={returnTo} className="btn btn-signal">Back to the campaign</Link>}
            </div>
          </div>
          {!apiLive && (
            <p className="mt-4 text-sm leading-relaxed text-ink-faint">
              Automatic verification is not on yet. Follower counts and Story proof are checked by a person until TapMart&apos;s Instagram connection is live.
            </p>
          )}
        </>
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
            <p className="text-sm text-ink-faint">Some campaigns ask for a minimum. Your count decides which ones you see as ready to take.</p>
          </li>
        </ul>
      </div>
    </main>
  );
}
