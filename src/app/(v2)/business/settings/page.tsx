import Link from "next/link";
import { ArrowSquareOut, CaretRight, UserCircle, Bell, ShieldCheck, Storefront, PlugsConnected, Palette, CreditCard, UsersThree, Globe } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSubscription } from "@/lib/v2/subscriptions";
import { getBrandKit } from "@/lib/business/brand";
import { PLAN_BY_KEY } from "@/config/plans";
import { BackButton } from "@/components/v2/BackButton";
import { IdentitySwitcher, type Identity } from "@/app/(v2)/me/IdentitySwitcher";
import { SignOutButton } from "@/app/(v2)/me/SignOutButton";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

type Tone = "signal" | "faint" | "warning" | "review" | "error" | "info";
type Row = {
  href?: string; icon: React.ReactNode; title: string; sub: string;
  status?: string; tone?: Tone; external?: boolean; disabled?: boolean;
};

const TONE_CLS: Record<Tone, string> = { signal: "", faint: "is-done", warning: "is-warning", review: "is-review", error: "is-error", info: "is-info" };

/**
 * Business Settings, as OpenAI designed it (docs/design-specs/business-settings.md):
 * which business this is, then short grouped rows that show the real state
 * (email, connections, brand kit, plan, public URL) and open the flows one
 * level deeper; then who you act as; then the way out.
 */
export default async function BusinessSettingsPage() {
  const ctx = await requireBusinessContext("/business/settings");
  const business = ctx.activeBusiness;

  const [details, subscription, brand, accounts, prefs] = await Promise.all([
    sqlOne<{ category: string | null; city: string | null }>(`select category, city from businesses where id = $1`, [business.id]),
    getSubscription(business.id),
    getBrandKit(business.id).catch(() => null),
    sql<{ provider: string; status: string }>(
      `select provider, status::text as status from connected_accounts where business_id = $1 and provider in ('instagram', 'google_business')`,
      [business.id],
    ),
    sqlOne<{ muted: string }>(
      `select coalesce((select count(*) from jsonb_each_text(prefs) where value = 'false'), 0)::text as muted from notification_prefs where profile_id = $1`,
      [ctx.user.id],
    ),
  ]);

  const active = subscription && subscription.status !== "cancelled" ? subscription : null;
  const plan = active ? PLAN_BY_KEY[active.plan] : null;
  const muted = Number(prefs?.muted ?? 0);
  const kit = brand?.kit;
  const hasKit = Boolean(kit && (kit.palette.length > 0 || kit.logo_url || kit.type.display));
  const where = [details?.category, details?.city].filter(Boolean).join(" · ");

  const ig = accounts.find((a) => a.provider === "instagram");
  const google = accounts.find((a) => a.provider === "google_business");
  const state = (a?: { status: string }) => a?.status === "connected" ? "Connected" : a?.status === "error" ? "Needs reconnect" : "Not connected";
  const issues = accounts.filter((a) => a.status === "error").length;
  const conn: { status: string; tone: Tone } = issues > 0 ? { status: `${issues} ${issues === 1 ? "issue" : "issues"}`, tone: "error" }
    : ig?.status === "connected" && google?.status === "connected" ? { status: "Connected", tone: "signal" }
    : { status: "Not connected", tone: "faint" };

  const kitState: { sub: string; status: string; tone: Tone } = !hasKit ? { sub: "Not set", status: "Not set", tone: "faint" }
    : brand?.proposed ? { sub: "Needs review", status: "Review", tone: "review" }
    : brand?.status === "approved" ? { sub: "Ready", status: "Ready", tone: "signal" }
    : { sub: "Pending", status: "Pending", tone: "warning" };

  const planRow: Pick<Row, "sub" | "status" | "tone"> = !active || !plan ? { sub: "No plan yet" }
    : active.status === "active" ? { sub: plan.name, status: "Active", tone: "signal" }
    : active.status === "trialing" ? { sub: plan.name, status: "Trial", tone: "info" }
    : { sub: plan.name, status: "Past due", tone: "error" };

  const identities: Identity[] = [
    { id: "personal", name: ctx.user.displayName ?? `@${ctx.user.username}`, sub: "Personal", logo: ctx.avatarUrl, active: false },
    ...ctx.businesses.map((b) => ({ id: b.id, name: b.name, sub: "Business", logo: b.logo_url, active: b.id === business.id })),
  ];

  const account: Row[] = [
    { href: "/business/settings/account", icon: <UserCircle size={20} aria-hidden />, title: "Account", sub: ctx.user.email ?? "Email unavailable" },
    { href: "/business/settings/notifications", icon: <Bell size={20} aria-hidden />, title: "Notifications", sub: muted > 0 ? `${muted} ${muted === 1 ? "type" : "types"} muted` : "All on" },
    { href: "/business/settings/security", icon: <ShieldCheck size={20} aria-hidden />, title: "Security", sub: "Password and sessions" },
  ];
  const setup: Row[] = [
    { href: "/business/edit", icon: <Storefront size={20} aria-hidden />, title: "Business details", sub: where || "Add business details" },
    { href: "/business/settings/connections", icon: <PlugsConnected size={20} aria-hidden />, title: "Connections", sub: `Instagram ${state(ig).toLowerCase()} · Google ${state(google).toLowerCase()}`, ...conn },
    { href: "/business/brand", icon: <Palette size={20} aria-hidden />, title: "Brand kit", ...kitState },
    { href: "/business/plan", icon: <CreditCard size={20} aria-hidden />, title: "Plan and billing", ...planRow },
    { icon: <UsersThree size={20} aria-hidden />, title: "Team", sub: "Coming later", disabled: true },
    { href: `/b/${business.slug}`, icon: <Globe size={20} aria-hidden />, title: "Public page", sub: `tapmart.live/b/${business.slug}`, external: true },
  ];

  const heading = (
    <div className="reveal">
      <p className="truncate font-display text-[23px] leading-[29px] font-[800] tracking-[-0.45px]">{business.name}</p>
      <p className="mt-[3px] truncate text-[14px] leading-[18px] text-ink-soft">{where || "Business"}</p>
    </div>
  );
  const identityBlock = (
    <section aria-label="Use TapMart as">
      <h2 className="eyebrow">Use TapMart as</h2>
      <div className="mt-2.5"><IdentitySwitcher identities={identities} canAddBusiness /></div>
    </section>
  );
  const sessionBlock = (
    <section aria-label="Session">
      <h2 className="eyebrow">Session</h2>
      <div className="mt-2.5"><SignOutButton row /></div>
    </section>
  );

  return (
    <main id="main" className="mx-auto w-full max-w-[390px] px-4 pt-[14px] pb-6 rail:max-w-none rail:px-8 rail:pt-0 rail:pb-10">
      {/* Desktop header: back, title, which business. The phone has these in the detail top bar. */}
      <header className="hidden rail:flex rail:h-[72px] rail:items-center rail:gap-3">
        <BackButton fallback="/business/profile" />
        <div>
          <h1 className="font-display text-[30px] leading-9 font-[820] tracking-[-0.8px]">Settings</h1>
        </div>
      </header>
      <h1 className="sr-only rail:hidden">Settings</h1>

      <div className="rail:mt-6 rail:grid rail:max-w-[1148px] rail:grid-cols-[760px_360px] rail:items-start rail:gap-7">
        <div className="flex flex-col gap-6">
          {heading}
          <Group title="Account" rows={account} />
          <Group title="Business" rows={setup} />
          <div className="contents rail:hidden">
            {identityBlock}
            {sessionBlock}
          </div>
        </div>
        <aside className="hidden rail:sticky rail:top-6 rail:flex rail:flex-col rail:gap-6">
          {identityBlock}
          {sessionBlock}
        </aside>
      </div>
    </main>
  );
}

/** One grouped list surface: a label, then 58px rows (60px on desktop) with inset dividers. */
function Group({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <section aria-label={title}>
      <h2 className="eyebrow">{title}</h2>
      <ul className="mt-2.5 overflow-hidden rounded-[20px] bg-surface">
        {rows.map((r, i) => (
          <li key={r.title} className={i > 0 ? "relative before:absolute before:top-0 before:right-[13px] before:left-[69px] before:h-px before:bg-rule rail:before:left-[72px]" : undefined}>
            <SettingsRow row={r} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function SettingsRow({ row: r }: { row: Row }) {
  const inner = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${r.disabled ? "bg-white/[0.035] text-ink-faint" : "bg-white/[0.06] text-ink-2"}`}>{r.icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate font-display text-[14px] leading-[18px] font-700 ${r.disabled ? "text-ink-faint" : ""}`}>{r.title}</span>
        <span className="mt-0.5 block truncate text-[12px] leading-4 text-ink-faint">{r.sub}</span>
      </span>
      {r.status && <span className={`status-text ${TONE_CLS[r.tone ?? "faint"]}`}><span aria-hidden className="status-dot" />{r.status}</span>}
      {!r.disabled && (r.external ? <ArrowSquareOut size={18} className="shrink-0 text-ink-soft" aria-hidden /> : <CaretRight size={18} className="shrink-0 text-ink-soft" aria-hidden />)}
    </>
  );
  const cls = "flex h-[58px] w-full items-center gap-3 px-[13px] rail:h-[60px] rail:px-3.5";
  if (r.disabled || !r.href) return <span className={cls} aria-disabled="true">{inner}</span>;
  const live = `${cls} transition-[background,transform] duration-100 can-hover:hover:bg-surface-3 active:scale-[0.985] active:bg-[color:var(--tm-pressed)]`;
  return r.external
    ? <a href={r.href} target="_blank" rel="noreferrer" className={live}>{inner}</a>
    : <Link href={r.href} className={live}>{inner}</Link>;
}
