import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext } from "@/lib/v2/core";
import { sql } from "@/lib/db";
import { getPersonForBusiness } from "@/lib/v2/marketplace";
import { imageRatio } from "@/lib/fs/media-ratio";
import { loadFunding } from "@/lib/fs/funding";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { Img } from "@/components/fs/Img";
import { BackLink } from "@/components/fs/work/BackLink";
import { Facts, Section } from "@/components/fs/work/DetailParts";
import { InspectButton } from "@/components/fs/SourceInspector";
import { carName, askingLine } from "@/components/fs/business/Cars";
import { RequestFlow, type PriorCreative } from "@/components/fs/business/RequestFlow";
import { fmtDay } from "@/components/fs/business/campaign/parts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return { title: `@${username}` };
}

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * One person as a business sees them: their real work at its own ratio,
 * the facts that were recorded, the requests already sent, and the two
 * requests the product runs. With ?request=story or ?request=reel the
 * page becomes the guided request, with the person still in view.
 */
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

  const ratios = await Promise.all(person.samples.slice(0, 6).map((s) => (VIDEO.test(s.url) ? Promise.resolve(9 / 16) : imageRatio(s.url))));
  const open = person.invites.filter((i) => i.status === "sent" || i.status === "accepted");
  const past = person.invites.filter((i) => i.status !== "sent" && i.status !== "accepted");
  const reputation = [
    person.instagram?.status === "connected" && person.instagram.followers != null ? `${person.instagram.followers.toLocaleString()} followers` : null,
    person.completed_jobs > 0 ? `${person.completed_jobs} completed` : null,
    person.rating_count > 0 && person.rating_avg != null ? `${person.rating_avg.toFixed(1)} rating · ${person.rating_count} review${person.rating_count === 1 ? "" : "s"}` : null,
  ].filter(Boolean).join(" · ");
  const kindWord = (k: string) => (k === "instagram_story" ? "Story" : k === "recreate_reel" ? "Reel" : "Car ad");

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top"><BackLink fallback="/business" label="Home" /></div>
      <div className="fs-detail" style={{ marginTop: 8 }}>
        <div className="fs-detail-source">
          <div className="fs-person-hero">
            <Avatar src={person.avatar_url ?? person.instagram?.avatar_url ?? null} name={name} size={160} square />
            <span style={{ minWidth: 0 }}>
              <h1 className="fs-t-page">{name}</h1>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>@{person.username}{person.city ? ` · ${person.city}` : ""}</p>
              <p className="fs-t-meta" style={{ marginTop: 4 }}>{[person.instagram?.status === "connected" ? "Instagram connected" : person.instagram?.status === "pending" ? "Instagram not yet verified" : null, person.verification === "verified" ? "Verified creator" : "Creator not verified"].filter(Boolean).join(" · ")}</p>
              {reputation && <p className="fs-t-meta" style={{ marginTop: 4 }}>{reputation}</p>}
            </span>
          </div>
          {person.bio && <p className="fs-t-body" style={{ marginTop: 12, maxWidth: 448 }}>{person.bio}</p>}
          <Section title="Work">
            {person.samples.length === 0 ? <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>No work samples shared yet.</p> : (
              <ul className="fs-work-samples">
                {person.samples.slice(0, 6).map((s, i) => {
                  const r = ratios[i] ?? 0.8; const h = 200; const w = Math.round(Math.min(Math.max(h * r, 90), 300));
                  return (
                    <li key={s.url}>
                      <InspectButton src={s.url} alt={`${s.title}, ${s.kind === "approved" ? "approved work" : "portfolio"} by ${name}`} label={`Inspect ${s.title}`} className="fs-media" icon={false} style={{ width: w, height: h, display: "block" }}>
                        {VIDEO.test(s.url) ? <span className="fs-video-fallback">Video<span className="fs-video-note">Inspect to play</span></span> : <Img src={s.url} alt="" style={{ width: w, height: h, objectFit: "cover" }} />}
                      </InspectButton>
                      <span className="fs-t-meta" style={{ display: "block", marginTop: 4, maxWidth: w }}>{s.title} · {s.kind === "approved" ? "Approved work" : "Portfolio"}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        <div className="fs-joint">
          <div className="fs-plane is-decision" aria-label="Requests">
            <p className="fs-t-label">Ask {name.split(" ")[0]}</p>
            {isSelf ? <p className="fs-t-body" style={{ marginTop: 4 }}>This is you. Requests go to other people.</p> : (
              <>
                <p className="fs-t-body" style={{ marginTop: 4 }}>A request goes only to them. They accept or decline; nothing is agreed until they accept, and credit leaves only when you approve the work.</p>
                {open.length > 0 && (
                  <ul className="fs-plain-list" style={{ marginTop: 12 }}>
                    {open.map((i) => (
                      <li key={i.id}>
                        <Link href={`/business/campaigns/${i.campaign_id}`} className="fs-row-link" style={{ minHeight: 44 }}>
                          <span><span className="fs-t-body" style={{ fontWeight: 500 }}>{kindWord(i.kind)} request · {formatMoney(i.pay_cents)}</span><span className="fs-t-meta" style={{ display: "block" }}><span className={`fs-status is-${i.status === "sent" ? "waiting" : "confirmed"}`}>{i.status === "sent" ? "Request sent" : "Accepted"}</span> · {i.status === "sent" ? "Waiting for an answer" : "Waiting for their work"} · {fmtDay(i.created_at)}</span></span>
                          <ArrowRight size={18} aria-hidden style={{ color: "var(--fs-accent)" }} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {!open.some((i) => i.kind === "instagram_story") && <Link href={`/business/people/${person.username}?request=story`} className="fs-btn fs-btn-primary">Request Story</Link>}
                  {!open.some((i) => i.kind === "recreate_reel") && <Link href={`/business/people/${person.username}?request=reel`} className={`fs-btn ${open.some((i) => i.kind === "instagram_story") ? "fs-btn-primary" : "fs-btn-secondary"}`}>Request Reel</Link>}
                </div>
                {past.length > 0 && (
                  <details className="fs-disclosure" style={{ marginTop: 12 }}>
                    <summary className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0, minHeight: 36 }}>Earlier requests</summary>
                    <ul className="fs-plain-list" style={{ marginTop: 4 }}>
                      {past.map((i) => <li key={i.id} className="fs-t-meta"><Link href={`/business/campaigns/${i.campaign_id}`} className="fs-link-ink fs-link-ul">{kindWord(i.kind)} request · {formatMoney(i.pay_cents)}</Link> · {i.status === "declined" ? "Declined" : i.status === "cancelled" ? "Withdrawn" : "Expired"} · {fmtDay(i.created_at)}</li>)}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>

          <Section title="Recorded">
            <Facts rows={[
              ["Instagram", person.instagram?.status === "connected" ? `Connected${person.instagram.followers != null ? ` · ${person.instagram.followers.toLocaleString()} followers` : ""}` : person.instagram?.status === "pending" ? "Not yet verified" : "Not connected"],
              ["Verification", person.verification === "verified" ? "Verified creator" : person.verification === "pending" ? "Pending" : "Not verified"],
              ["Completed work", String(person.completed_jobs)],
              ["Rating", person.rating_count > 0 && person.rating_avg != null ? `${person.rating_avg.toFixed(1)} from ${person.rating_count} review${person.rating_count === 1 ? "" : "s"}` : "No reviews yet"],
            ]} />
          </Section>

          {person.reviews.length > 0 && (
            <Section title="Reviews">
              <ul className="fs-plain-list">
                {person.reviews.map((r, i) => <li key={i} style={{ marginTop: i ? 12 : 0 }}><span className="fs-t-body" style={{ display: "block" }}>{r.body ?? "No comment"}</span><span className="fs-t-meta" style={{ display: "block" }}>{r.rating} of 5{r.business_name ? ` · ${r.business_name}` : ""} · {fmtDay(r.created_at)}</span></li>)}
              </ul>
            </Section>
          )}

          {person.vehicles.length > 0 && (
            <Section title="Cars listed for ads">
              <ul className="fs-plain-list">
                {person.vehicles.map((c) => (
                  <li key={c.id}>
                    <Link href={`/business/cars/${c.id}`} className="fs-row-link" style={{ minHeight: 44 }}>
                      <span><span className="fs-t-body" style={{ fontWeight: 500 }}>{carName(c)}</span><span className="fs-t-meta" style={{ display: "block" }}>{askingLine(c)}</span></span>
                      <ArrowRight size={18} aria-hidden style={{ color: "var(--fs-accent)" }} />
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </main>
  );
}
