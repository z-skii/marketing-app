import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { BackButton } from "@/components/v2/BackButton";
import { SignOutButton } from "../SignOutButton";
import { IdentitySwitcher, type Identity } from "../IdentitySwitcher";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Account settings, reached from the gear on Profile. Nothing here earns money. */
export default async function SettingsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const name = ctx.user.displayName ?? `@${ctx.user.username}`;
  const identities: Identity[] = [
    { id: "personal", name, sub: "Personal", logo: ctx.avatarUrl, active: ctx.mode === "user" },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: ctx.activeBusiness?.id === b.id })),
  ];

  const groups: { title: string; rows: { href: string; title: string; sub: string }[] }[] = [
    {
      title: "Account",
      rows: [
        { href: "/me/edit", title: "Edit profile", sub: "Name, photo, bio, city" },
        { href: "/me/creator", title: "Verification", sub: ctx.isVerified ? "Verified ✓" : "Get the verified mark on your profile" },
        { href: "/me/portfolio", title: "Portfolio", sub: "Work you want businesses to see" },
        { href: `/u/${ctx.user.username}`, title: "Public profile and reviews", sub: `tapmart.live/u/${ctx.user.username}` },
        { href: "/activity?tab=saved", title: "Saved", sub: "Opportunities you bookmarked" },
      ],
    },
    {
      title: "Earning",
      rows: [
        { href: "/me/instagram", title: "Instagram", sub: ctx.instagram.handle ? `@${ctx.instagram.handle}` : "Not connected" },
        { href: "/me/vehicles", title: "Vehicles", sub: `${ctx.vehicleCount} added` },
        { href: "/earnings", title: "Payouts", sub: "Request and track payouts" },
      ],
    },
    {
      title: "More",
      rows: [
        ...(ctx.user.role === "admin" ? [{ href: "/admin", title: "Admin", sub: "Site controls" }] : []),
      ],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-4 font-display text-[1.375rem] font-600 tracking-[-0.02em] md:text-[1.5rem]">Settings</h1>
      <section className="mt-6" aria-label="Use TapMart as">
        <h2 className="eyebrow">Use TapMart as</h2>
        <div className="mt-2">
          <IdentitySwitcher identities={identities} canAddBusiness flat />
        </div>
      </section>
      {groups.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="eyebrow">{group.title}</h2>
          <ul className="card mt-2.5 divide-y divide-rule px-4">
            {group.rows.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="flex min-h-[4.25rem] items-center justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[1rem] font-600">{r.title}</span>
                    <span className="block truncate text-sm text-ink-soft">{r.sub}</span>
                  </span>
                  <span aria-hidden className="text-ink-faint"></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="mt-8"><SignOutButton /></div>
    </main>
  );
}
