import Link from "next/link";
import { getV2Context } from "@/lib/v2/core";
import { BackButton } from "@/components/v2/BackButton";
import { SignOutButton } from "../SignOutButton";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

/** Account settings, reached from the gear on Profile. Nothing here earns money. */
export default async function SettingsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;

  const groups: { title: string; rows: { href: string; title: string; sub: string }[] }[] = [
    {
      title: "Account",
      rows: [
        { href: "/me/edit", title: "Edit profile", sub: "Name, photo, bio, city" },
        { href: "/me/creator", title: "Verification", sub: ctx.isVerified ? "Verified ✓" : "Get the verified mark on your profile" },
        { href: "/me/portfolio", title: "Portfolio", sub: "Work you want businesses to see" },
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
        { href: "/board", title: "The classic board", sub: "TapMart's original link board, kept around for now" },
        { href: "/dashboard", title: "Board links", sub: "Manage links on the classic board" },
        ...(ctx.user.role === "admin" ? [{ href: "/admin", title: "Admin", sub: "Site controls" }] : []),
      ],
    },
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/me" label="Profile" />
      <h1 className="mt-4 font-display text-[1.75rem] font-800 tracking-[-0.03em] md:text-[2rem]">Settings</h1>
      {groups.map((group) => (
        <section key={group.title} className="mt-6">
          <p className="text-sm text-ink-faint">{group.title}</p>
          <ul className="row-list mt-2">
            {group.rows.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="card flex items-center justify-between gap-3 px-4 py-3">
                  <span className="min-w-0">
                    <span className="block truncate font-display text-[0.9375rem] font-700">{r.title}</span>
                    <span className="block truncate text-sm text-ink-faint">{r.sub}</span>
                  </span>
                  <span aria-hidden className="text-ink-faint">→</span>
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
