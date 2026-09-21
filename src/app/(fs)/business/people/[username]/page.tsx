import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Play, InstagramLogo, Car, Images, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { getPersonForBusiness, compactCount } from "@/lib/v2/marketplace";
import { loadFunding } from "@/lib/fs/funding";
import { formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { DSection } from "@/components/fs/work/DetailKit";
import { ProfileHead, StatsRow, Chips, WorkGrid, Reputation, Reviews, skillChips, type WorkTile } from "@/components/fs/profile/Parts";
import { carName, askingLine } from "@/components/fs/business/Cars";
import { RequestFlow, type PriorCreative } from "@/components/fs/business/RequestFlow";
import { fmtDay } from "@/components/fs/business/campaign/parts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

/**
 * One person as a business sees them: the same profile the public sees
 * (identity, stats, chips, work, reputation) with the two requests the
 * product runs, the requests already sent, and the cars they list. With
 * ?request=story or ?request=reel the page becomes the guided request.
 */
const KIND_NAME: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

export default async function BusinessPersonPage({ params, searchParams }: { params: Promise<{ username: string }>; searchParams: Promise<{ request?: string }> }) {
  const [{ username }, query] = await Promise.all([params, searchParams]);
  const ctx = await requireBusinessContext(`/business/people/${username}`);
  const business = ctx.activeBusiness;
  const person = await getPersonForBusiness(username, business.id, ctx.city);
  if (!person || person.suspended) notFound();
  const name = person.display_name ?? person.username;
  const isSelf = person.id === ctx.user.id;
  const sample = person.samples[0] ?? null;

  if ((query.request === "story" || query.request === "reel") && !isSelf) {
    const [creatives, funding] = await Promise.all([
      query.request === "story"
        ? sql<PriorCreative>(`select id, title, details->>'creative_url' as url from campaigns where business_id = $1 and kind = 'instagram_story' and coalesce(details->>'creative_url', '') <> '' order by created_at desc limit 6`, [business.id])
        : Promise.resolve([] as PriorCreative[]),
      loadFunding(business.id),
    ]);
    return <RequestFlow kind={query.request} person={person} sample={sample ? { url: sample.url, title: sample.title } : null} creatives={creatives} funding={funding} businessName={business.name} />;
  }

  const open = person.invites.filter((i) => i.status === "sent" || i.status === "accepted");
  const past = person.invites.filter((i) => i.status !== "sent" && i.status !== "accepted");
  const kindWord = (k: string) => (k === "instagram_story" ? "Story" : k === "recreate_reel" ? "Reel" : "Car ad");
  const verified = person.verification === "verified";
  const igConnected = person.instagram?.status === "connected";
  const tiles: WorkTile[] = [...person.work.map((w) => ({ url: w.url, title: w.campaign_title, kind: "approved" as const, tag: KIND_NAME[w.kind] ?? "Approved" })), ...person.portfolio.map((u) => ({ url: u, title: "Portfolio", kind: "portfolio" as const }))].slice(0, 9);
  const chips = skillChips(
    { kinds: person.work.map((w) => w.kind), hasCar: person.vehicles.length > 0 || person.has_listed_vehicle, hasPortfolio: person.portfolio.length > 0, instagram: igConnected },
    { reel: <Play size={16} weight="fill" aria-hidden />, story: <InstagramLogo size={16} aria-hidden />, car: <Car size={16} aria-hidden />, photo: <Images size={16} aria-hidden />, instagram: <InstagramLogo size={16} aria-hidden /> },
  );

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top"><BackLink fallback="/business" label="Home" /></div>
      <div className="pf-page">
        <aside className="pf-side">
          <ProfileHead avatar={person.avatar_url ?? person.instagram?.avatar_url ?? null} name={name} handle={person.username} city={person.city} verified={verified} bio={person.bio}
            badges={<>{igConnected && person.instagram?.handle && <span><InstagramLogo size={14} aria-hidden />@{person.instagram.handle.replace(/^@/, "")}{person.instagram.followers != null ? ` · ${compactCount(person.instagram.followers)}` : ""}</span>}</>}
            actions={isSelf ? <p className="t-meta">This is you. Requests go to other people.</p> : (
              <>
                {!open.some((i) => i.kind === "instagram_story") && <Link href={`/business/people/${person.username}?request=story`} className="btn btn-signal btn-md"><PaperPlaneTilt size={16} aria-hidden /> Request Story</Link>}
                {!open.some((i) => i.kind === "recreate_reel") && <Link href={`/business/people/${person.username}?request=reel`} className={`btn ${open.some((i) => i.kind === "instagram_story") ? "btn-signal btn-md" : ""}`}>Request Reel</Link>}
              </>
            )} />
          <StatsRow items={[
            { v: String(person.completed_jobs), l: person.completed_jobs === 1 ? "Job" : "Jobs" },
            ...(person.rating_count > 0 && person.rating_avg != null ? [{ v: person.rating_avg.toFixed(1), l: "Rating", star: true }] : []),
            ...(igConnected && person.instagram?.followers != null ? [{ v: compactCount(person.instagram.followers), l: "Followers" }] : []),
          ]} />
          <Chips items={chips} />
          {open.length > 0 && (
            <div className="dt-section">
              <p className="t-meta" style={{ fontWeight: 600, color: "var(--tm-text)" }}>Your requests</p>
              <ul className="pf-rows" style={{ marginTop: 4 }}>
                {open.map((i) => (
                  <li key={i.id}>
                    <Link href={`/business/campaigns/${i.campaign_id}`} className="pf-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                      <span style={{ minWidth: 0 }}><b>{kindWord(i.kind)} request · {formatMoney(i.pay_cents).replace(/\.00$/, "")}</b><span className="pf-row-sub"><span className={`badge is-${i.status === "sent" ? "warning" : "success"}`}>{i.status === "sent" ? "Sent" : "Accepted"}</span> {fmtDay(i.created_at)}</span></span>
                      <ArrowRight size={18} aria-hidden style={{ color: "var(--tm-red)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        <div className="pf-main">
          <DSection title="Work" id="work" meta={tiles.length > 0 ? `${tiles.length}` : undefined}>
            <WorkGrid items={tiles} owner={name} />
          </DSection>
          {person.rating_count > 0 && (
            <DSection title="Reputation" id="reputation">
              <Reputation rating={person.rating_avg} reviews={person.rating_count} completed={person.completed_jobs} />
              <div style={{ marginTop: 8 }}><Reviews items={person.reviews} /></div>
            </DSection>
          )}
          {person.vehicles.length > 0 && (
            <DSection title="Cars listed for ads" id="cars">
              <ul className="pf-rows">
                {person.vehicles.map((c) => (
                  <li key={c.id}>
                    <Link href={`/business/cars/${c.id}`} className="pf-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                      <span style={{ minWidth: 0 }}><b>{carName(c)}</b><span className="pf-row-sub">{askingLine(c)}</span></span>
                      <ArrowRight size={18} aria-hidden style={{ color: "var(--tm-red)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </DSection>
          )}
          {past.length > 0 && (
            <DSection title="Earlier requests" id="past">
              <ul className="pf-rows">
                {past.map((i) => (
                  <li key={i.id}>
                    <Link href={`/business/campaigns/${i.campaign_id}`} className="pf-row" style={{ gridTemplateColumns: "minmax(0, 1fr) auto" }}>
                      <span style={{ minWidth: 0 }}><b>{kindWord(i.kind)} request · {formatMoney(i.pay_cents).replace(/\.00$/, "")}</b><span className="pf-row-sub">{i.status === "declined" ? "Declined" : i.status === "cancelled" ? "Withdrawn" : "Expired"} · {fmtDay(i.created_at)}</span></span>
                      <ArrowRight size={18} aria-hidden style={{ color: "var(--tm-muted)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </DSection>
          )}
        </div>
      </div>
    </main>
  );
}
