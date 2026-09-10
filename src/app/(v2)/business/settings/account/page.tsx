import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { requireV2 } from "@/lib/v2/core";
import { BackButton } from "@/components/v2/BackButton";
import { SignOutButton } from "@/app/(v2)/me/SignOutButton";

export const metadata = { title: "Account" };
export const dynamic = "force-dynamic";

/**
 * The account behind every identity: who is signed in, how, and the way
 * out. Settings never signs anyone in; that is the real sign-in screen.
 */
export default async function AccountSettingsPage() {
  const ctx = await requireV2("/business/settings/account");

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/settings" label="Settings" />
      <h1 className="mt-3 font-display text-[1.5rem] font-700 tracking-[-0.02em] md:text-[1.5rem]">Account</h1>

      <section className="mt-6" aria-label="Account">
        <h2 className="eyebrow">Account</h2>
        <dl className="mt-1 divide-y divide-rule">
          <Row label="Email" value={ctx.user.email ?? "No email on file"} />
          <Row label="Name" value={ctx.user.displayName ?? "Not set"} href="/me/edit" />
          <Row label="Username" value={`@${ctx.user.username}`} href="/me/edit" />
          <Row label="Member number" value={`#${ctx.user.memberNo}`} />
        </dl>
      </section>

      <section className="mt-7" aria-label="Session">
        <h2 className="eyebrow">Session</h2>
        <dl className="mt-1 divide-y divide-rule">
          <Row label="Signed in as" value={`${ctx.user.email ?? ctx.user.username} on this device`} />
          <Row label="Stays signed in" value="30 days, or until you log out" />
          <Row label="Identities" value={`Personal${ctx.businesses.length > 0 ? ` and ${ctx.businesses.length} ${ctx.businesses.length === 1 ? "business" : "businesses"}` : ""}`} href="/business/settings" />
        </dl>
      </section>

      <div className="mt-8">
        <SignOutButton />
        <p className="mt-2 text-center text-xs text-ink-faint">Logging out ends this session on this device and returns you to sign in.</p>
      </div>
    </main>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <>
      <span className="min-w-0">
        <dt className="text-sm text-ink-faint">{label}</dt>
        <dd className="truncate text-[0.9375rem]">{value}</dd>
      </span>
      {href && <CaretRight size={18} className="shrink-0 text-ink-faint" aria-hidden />}
    </>
  );
  return (
    <div>
      {href ? <Link href={href} className="flex min-h-14 items-center justify-between gap-3 py-3">{inner}</Link> : <div className="flex min-h-14 items-center justify-between gap-3 py-3">{inner}</div>}
    </div>
  );
}
