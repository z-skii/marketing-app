import { BackButton } from "@/components/v2/BackButton";
import { redirect } from "next/navigation";
import { getV2Context } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { StatusChip } from "@/components/v2/ui";
import { ConnectButton } from "./ConnectButton";

export const metadata = { title: "Connected accounts" };
export const dynamic = "force-dynamic";

const PROVIDERS = [
  { key: "google_business", name: "Google Business Profile", why: "Keep hours, photos and info current where customers search." },
  { key: "instagram", name: "Instagram", why: "Schedule and publish approved content." },
  { key: "facebook", name: "Facebook", why: "Same content, second audience." },
  { key: "tiktok", name: "TikTok", why: "Where the creator campaigns live." },
];

/**
 * Connected accounts. Honest states only: real OAuth requires platform
 * credentials that aren't configured yet, so a connect request is recorded
 * as pending and the page says exactly what's missing.
 */
export default async function ConnectionsPage() {
  const ctx = await getV2Context();
  if (!ctx) return null;
  const business = ctx.businesses[0];
  if (!business) redirect("/business/new");

  const rows = await sql<{ provider: string; status: string }>(
    `select provider, status::text as status from connected_accounts where business_id = $1`,
    [business.id],
  );
  const statusOf = (key: string) => rows.find((r) => r.provider === key)?.status ?? "disconnected";

  return (
    <main id="main" className="mx-auto w-full max-w-xl px-4 py-5 md:py-8">
      <BackButton fallback="/business" label="Business" />
      <h1 className="mt-2 font-display text-2xl font-900 tracking-[-0.03em]">Connected accounts</h1>
      <p className="mt-1 text-sm text-ink-faint">
        Platform sign-in isn&apos;t switched on for TapMart yet — requesting a
        connection queues it, and you&apos;ll get a notification when it&apos;s live.
        Until then, the calendar works in plan-and-approve mode.
      </p>

      <ul className="mt-5 flex flex-col gap-2">
        {PROVIDERS.map((p) => {
          const status = statusOf(p.key);
          return (
            <li key={p.key} className="flex items-center gap-3 border border-rule p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-800">{p.name}</p>
                <p className="text-xs text-ink-faint">{p.why}</p>
              </div>
              <StatusChip status={status} />
              {status === "disconnected" && <ConnectButton businessId={business.id} provider={p.key} />}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
