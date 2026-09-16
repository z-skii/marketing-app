import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireV2 } from "@/lib/v2/core";
import { devAuthEnabled } from "@/lib/supabase";
import { BackButton } from "@/components/v2/BackButton";
import { SignOutButton } from "@/app/(v2)/me/SignOutButton";

export const metadata = { title: "Security" };
export const dynamic = "force-dynamic";

/**
 * Password and sessions. Passwords live with the sign-in provider, so the
 * change goes through the reset link. One session per device, ended by
 * logging out.
 */
export default async function SecuritySettingsPage() {
  const ctx = await requireV2("/business/settings/security");
  const dev = devAuthEnabled();

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Settings" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Security</h1>

      <section className="mt-6" aria-label="Password">
        <h2 className="eyebrow">Password</h2>
        {dev ? (
          <p className="mt-2 text-sm text-ink-soft">Development sign-in is on. Password changes go through the real sign-in in production.</p>
        ) : (
          <Link href="/reset" className="flex min-h-14 items-center justify-between gap-3 py-3">
            <span className="min-w-0">
              <span className="block font-display text-[1rem] font-600">Change password</span>
              <span className="block truncate text-sm text-ink-soft">A reset link goes to {ctx.user.email ?? "your email"}</span>
            </span>
            <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
          </Link>
        )}
      </section>

      <section className="mt-7" aria-label="Sessions">
        <h2 className="eyebrow">Sessions</h2>
        <dl className="mt-1 divide-y divide-rule">
          <div className="flex min-h-14 items-center justify-between gap-3 py-3">
            <dt className="text-sm text-ink-faint">This device</dt>
            <dd className="text-[0.9375rem]">Signed in as {ctx.user.email ?? ctx.user.username}</dd>
          </div>
          <div className="flex min-h-14 items-center justify-between gap-3 py-3">
            <dt className="text-sm text-ink-faint">Expires</dt>
            <dd className="text-[0.9375rem]">30 days after sign in, or when you log out</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-ink-soft">Logging out ends the session on this device only. To end a session on another device, log out there.</p>
      </section>

      <div className="mt-8"><SignOutButton /></div>
    </main>
  );
}
