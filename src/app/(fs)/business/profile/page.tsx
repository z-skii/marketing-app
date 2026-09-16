import Link from "next/link";
import { ArrowSquareOut, Gear } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { brandState, fmtDate, fmtTime, hostOf, loadBusinessIdentity, STATE_WORD } from "@/lib/fs/business-identity";
import { Img } from "@/components/fs/Img";
import { SettingsGroup, SettingsRow } from "@/components/fs/settings/Rows";
import { Swatches } from "@/components/fs/business/BrandKit";

export const metadata = { title: "Business" };
export const dynamic = "force-dynamic";

/**
 * Business Profile in Frame Shift: the business's TapMart identity, in
 * the same language as the personal profile. The cover when there is one,
 * the logo square, name, category and city, the connected services as
 * words, then the rows that are true right now: plan, next shoot,
 * campaigns, scheduled content, brand kit, the public page. Editing lives
 * behind the gear. Every figure is a count of real records.
 */
export default async function BusinessProfilePage() {
  const ctx = await requireBusinessContext("/business/profile");
  const identity = await loadBusinessIdentity(ctx.activeBusiness.id);
  if (!identity) return null;
  const { row, providers, counts, subscription, plan, shoot, brand } = identity;
  const ig = providers.find((p) => p.provider === "instagram")!;
  const google = providers.find((p) => p.provider === "google_business")!;
  const website = hostOf(row.website);
  const websiteHref = row.website ? (row.website.startsWith("http") ? row.website : `https://${row.website}`) : null;
  const kit = brandState(brand);
  const shootWhen = shoot?.scheduled_for ? `${fmtDate(shoot.scheduled_for)}${shoot.starts_at ? ` · ${fmtTime(shoot.starts_at)}` : ""}` : null;
  const connected = providers.filter((p) => p.state === "connected");
  const attention = providers.filter((p) => p.state === "error" || p.state === "needs_reconnect");
  const connLine = connected.length === 0
    ? "No services connected"
    : connected.map((p) => (p.provider === "instagram" ? `Instagram${p.name ? ` @${p.name.replace(/^@/, "")}` : ""}` : `Google${p.name ? ` · ${p.name}` : ""}`)).join(" · ");
  const planSub = !subscription || !plan ? "No plan. Subscription content is off."
    : subscription.status === "active" ? (subscription.current_period_end ? `Renews ${fmtDate(subscription.current_period_end)}` : "Active")
    : subscription.status === "trialing" ? "Trial" : "Past due";
  const identityLine = [row.category, row.city].filter(Boolean).join(" · ");

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-purpose-row">
        <h1 className="fs-t-page">Business</h1>
        <Link href="/business/settings" className="fs-icon-btn" aria-label="Settings"><Gear size={24} aria-hidden /></Link>
      </div>

      <div className="fs-profile-grid" style={{ marginTop: 12 }}>
        <div>
          {row.cover_url ? (
            <div className="fs-biz-cover"><Img src={row.cover_url} alt={`${row.name}, cover photo`} loading="eager" /></div>
          ) : null}
          <div className="fs-biz-plate" style={{ marginTop: row.cover_url ? 16 : 0 }}>
            <span className="fs-biz-logo">{row.logo_url ? <Img src={row.logo_url} alt={`${row.name} logo`} loading="eager" /> : <span aria-hidden className="fs-display" style={{ fontWeight: 700, fontSize: 40 }}>{(row.name.trim()[0] ?? "?").toUpperCase()}</span>}</span>
            <div style={{ minWidth: 0, paddingTop: 4 }}>
              <p className="fs-t-identity">{row.name}</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{identityLine || "Add a category and city in Business details"}</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>
                {row.verification === "verified" ? <span className="fs-status is-confirmed">Verified business</span> : <span className="fs-status is-neutral">Not verified</span>}
                {websiteHref && <> · <a href={websiteHref} target="_blank" rel="noreferrer" className="fs-link-ink fs-link-ul">{website}</a></>}
              </p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{connLine}{attention.length > 0 && <> · <span className="fs-status is-problem">{attention.length === 1 ? "One connection needs attention" : "Connections need attention"}</span></>}</p>
              {!row.logo_url && <Link href="/business/edit" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 4, minHeight: 36 }}>Add a logo{!row.cover_url ? " and cover" : ""}</Link>}
              {row.logo_url && !row.cover_url && <Link href="/business/edit" className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, marginTop: 4, minHeight: 36 }}>Add a cover photo</Link>}
            </div>
          </div>
          {row.description && <p className="fs-t-body" style={{ marginTop: 16, maxWidth: 560 }}>{row.description}</p>}

          <dl className="fs-record-strip" style={{ marginTop: 20 }} aria-label="Right now">
            <Fact value={String(counts.active)} label={counts.active === 1 ? "Active campaign" : "Active campaigns"} />
            <Fact value={String(counts.scheduled)} label="Scheduled" />
            <Fact value={String(counts.delivered)} label="Delivered" />
            {counts.review > 0 && <Fact value={String(counts.review)} label={counts.review === 1 ? "Needs review" : "Need review"} />}
          </dl>

          <section aria-labelledby="brand-title" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, minHeight: 44 }}>
              <h2 id="brand-title" className="fs-t-section">Brand kit <span className={`fs-status is-${kit.tone}`} style={{ marginLeft: 4 }}>{kit.label}</span></h2>
              <Link href="/business/brand" className="fs-btn fs-btn-quiet fs-link-ink">{kit.label === "Not built" ? "Build it" : "Open"}</Link>
            </div>
            {kit.label === "Not built"
              ? <p className="fs-t-meta">TapMart reads your Instagram, Google listing, website and logo before it suggests anything.</p>
              : (
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  {brand?.kit.logo_url && <span className="fs-brand-logo" style={{ width: 56, height: 56 }}><Img src={brand.kit.logo_url} alt="" /></span>}
                  <div style={{ marginTop: -8 }}><Swatches colors={brand?.kit.palette ?? []} small /></div>
                </div>
              )}
          </section>
        </div>

        <div>
          <SettingsGroup title="Right now" id="now-title">
            <SettingsRow href="/business/plan" title={plan ? `${plan.name} plan` : "No plan"} sub={planSub} status={subscription ? (subscription.status === "active" ? "Active" : subscription.status === "trialing" ? "Trial" : "Past due") : undefined} tone={subscription?.status === "past_due" ? "problem" : "confirmed"} />
            <SettingsRow href={shoot ? `/business/content/shoots/${shoot.id}` : "/business/content"} title={shootWhen ? "Next shoot" : "Content"} sub={shootWhen ?? (plan ? "No shoot booked yet" : "Shoots come with a plan")} />
            <SettingsRow href="/business/campaigns" title="Campaigns" sub={counts.active > 0 ? `${counts.active} running${counts.review > 0 ? ` · ${counts.review} waiting for your decision` : ""}` : "None running"} status={counts.review > 0 ? "Needs you" : undefined} tone="waiting" />
            <SettingsRow href="/business/content?view=calendar" title="Scheduled content" sub={counts.scheduled > 0 ? `${counts.scheduled} post${counts.scheduled === 1 ? "" : "s"} scheduled` : "Nothing scheduled"} />
            <SettingsRow href="/business/settings/connections" title="Connections" sub={`Instagram ${STATE_WORD[ig.state].label.toLowerCase()} · Google ${STATE_WORD[google.state].label.toLowerCase()}`} status={attention.length > 0 ? "Needs attention" : connected.length > 0 ? "Connected" : undefined} tone={attention.length > 0 ? "problem" : "confirmed"} />
            <SettingsRow href={`/b/${row.slug}`} external title="Public page" sub={`tapmart.live/b/${row.slug}`} end={<ArrowSquareOut size={20} aria-hidden style={{ display: "none" }} />} />
          </SettingsGroup>
          <Link href="/business/settings" className="fs-btn fs-btn-secondary" style={{ marginTop: 24 }}>Settings</Link>
        </div>
      </div>
    </main>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <dd className="fs-money-record fs-tnum" style={{ fontSize: 24, lineHeight: "28px" }}>{value}</dd>
      <dt className="fs-t-meta">{label}</dt>
    </div>
  );
}
