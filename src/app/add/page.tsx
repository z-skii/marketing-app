import Link from "next/link";
import { AddLinkFlow } from "./AddLinkFlow";
import { getCurrentUser } from "@/lib/auth";
import { sqlOne } from "@/lib/db";
import { settingInt } from "@/lib/settings";
import { SITE_NAME } from "@/config/site";

export const metadata = { title: "Add your link" };
export const dynamic = "force-dynamic";

export default async function AddPage() {
  const user = await getCurrentUser();

  const [wallet, board, spot, bar] = await Promise.all([
    user
      ? sqlOne<{ available_credit_cents: string }>(
          `select available_credit_cents from wallets where user_id = $1`, [user.id])
      : Promise.resolve(null),
    settingInt("board_click_price_cents"),
    settingInt("spot_click_price_cents"),
    settingInt("bar_click_price_cents"),
  ]);

  return (
    <main id="main" className="min-h-dvh">
      {/* A focused surface: the flow replaces the site rather than floating over it. */}
      <div className="shell flex h-14 items-center justify-between md:h-16">
        <Link href="/" className="font-display text-[1.0625rem] font-800 tracking-[-0.04em] uppercase">
          {SITE_NAME}
        </Link>
        <Link href="/" className="eyebrow transition-colors hover:text-ink">Close</Link>
      </div>

      <div className="shell py-8 md:py-16">
        <AddLinkFlow
          signedIn={Boolean(user)}
          availableCents={Number(wallet?.available_credit_cents ?? 0)}
          clickPrices={{ board, spot, bar }}
        />
      </div>
    </main>
  );
}
