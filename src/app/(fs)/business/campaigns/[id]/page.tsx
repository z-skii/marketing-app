import Link from "next/link";
import { Img } from "@/components/fs/Img";
import { redirect } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { getSubmissions } from "@/lib/v2/campaigns";
import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import { getBusinessCampaign, getDriverApplications, getCarBookings, getCarProofs, getBookingMonthsPaid, getLatestInvite, getPersonApplications, type CarBooking } from "@/lib/fs/business-campaigns";
import { loadFunding } from "@/lib/fs/funding";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Facts, Section } from "@/components/fs/work/DetailParts";
import { KIND_WORD, STATUS_WORD, SUBMISSION_WORD, BOOKING_WORD, payUnit, fmtDay } from "@/components/fs/business/campaign/parts";
import { CampaignSource } from "@/components/fs/business/campaign/CampaignSource";
import { PublishDraft, CloseCampaign, WithdrawRequest, ApplicantDecision, DriverDecision } from "@/components/fs/business/campaign/Controls";

export const dynamic = "force-dynamic";

/**
 * One campaign, managed. The media it is about anchors the screen; the
 * right side answers what needs me, who is involved, what was submitted,
 * what money is committed and what happens next. Configuration that does
 * not change a decision sits deeper under Campaign settings.
 */
export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const ctx = await requireBusinessContext(`/business/campaigns/${id}`);
  const business = ctx.activeBusiness;
  const campaign = await getBusinessCampaign(id);
  if (!campaign || campaign.business_id !== business.id) redirect("/business/campaigns");
  try { await requireBusinessMember(ctx.user.id, campaign.business_id); } catch { redirect("/business/campaigns"); }

  const car = campaign.kind === "car_ads";
  const story = campaign.kind === "instagram_story";
  const [submissions, people, drivers, bookings, invite, funding] = await Promise.all([
    car ? Promise.resolve([]) : getSubmissions(campaign.id),
    car ? Promise.resolve([]) : getPersonApplications(campaign.id),
    car ? getDriverApplications(campaign.id) : Promise.resolve([]),
    car ? getCarBookings(campaign.id) : Promise.resolve([]),
    campaign.audience === "direct" ? getLatestInvite(campaign.id) : Promise.resolve(null),
    loadFunding(business.id),
  ]);
  const [proofs, monthsPaid] = await Promise.all([getCarProofs(bookings.map((b) => b.id)), getBookingMonthsPaid(bookings.map((b) => b.id), business.id)]);

  const d = campaign.details;
  const status = STATUS_WORD({ status: campaign.status, audience: campaign.audience, invite_status: invite?.status ?? null });
  const waiting = submissions.filter((s) => ["submitted", "under_review"].includes(s.status));
  const decided = submissions.filter((s) => !["submitted", "under_review"].includes(s.status));
  const applied = people.filter((a) => a.status === "applied");
  const driversApplied = drivers.filter((a) => a.status === "applied");
  const carsWaiting = bookings.filter((b) => ["creative_pending", "installation_pending"].includes(b.status));
  const isOpen = ["open", "paused"].includes(campaign.status);
  const paidCents = car ? bookings.reduce((sum, b) => sum + (monthsPaid[b.id] ?? 0) * b.monthly_cents, 0) : campaign.paid_count * campaign.pay_cents;

  const needs: { label: string; href: string }[] = [];
  if (campaign.status === "draft") needs.push({ label: "Publish this draft", href: "#settings" });
  if (waiting.length) needs.push({ label: story ? `Check ${waiting.length} proof${waiting.length === 1 ? "" : "s"}` : `Review ${waiting.length} video${waiting.length === 1 ? "" : "s"}`, href: "#submissions" });
  if (applied.length) needs.push({ label: `Review ${applied.length} applicant${applied.length === 1 ? "" : "s"}`, href: "#applicants" });
  if (driversApplied.length) needs.push({ label: `Review ${driversApplied.length} driver${driversApplied.length === 1 ? "" : "s"}`, href: "#drivers" });
  for (const b of carsWaiting) needs.push({ label: `${b.year} ${b.make} ${b.model}: ${BOOKING_WORD[b.status].next}`, href: `/business/campaigns/${campaign.id}/cars/${b.id}` });

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback="/business/campaigns" label="Campaigns" />
        <span className={`fs-status is-${status.tone}`}>{status.label}</span>
      </div>
      {query.created === "1" && (
        <p className="fs-t-body fs-plane" style={{ marginTop: 12 }}>{campaign.status === "open" ? `Published. People in ${campaign.city ?? "your city"} were told.` : "Saved as a draft. Publish it from Campaign settings when you are ready."}</p>
      )}
      <h1 className="fs-t-page" style={{ marginTop: 8 }}>{campaign.title}</h1>
      <p className="fs-t-meta" style={{ marginTop: 4 }}>{KIND_WORD[campaign.kind] ?? campaign.kind} · {campaign.audience === "direct" ? "Direct request" : "Public"}{campaign.city ? ` · ${campaign.city}` : ""}</p>

      <div className="fs-detail" style={{ marginTop: 12 }}>
        <div className="fs-detail-source">
          <CampaignSource campaign={campaign} bookings={bookings} />
          <div style={{ marginTop: 16 }}>
            <span className="fs-money">{formatMoney(campaign.pay_cents)}</span>
            <span className="fs-t-meta" style={{ display: "block" }}>{payUnit(campaign.kind)}</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Facts rows={[
              car ? ["Cars", `${bookings.filter((b) => ["active", "completed"].includes(b.status)).length} of ${campaign.slots} on the road`] : ["Approved", `${campaign.approved} of ${campaign.slots}`],
              ["Paid so far", formatMoney(paidCents)],
              ...(campaign.deadline ? [["Last day", fmtDay(campaign.deadline) ?? ""] as [string, string]] : []),
              ...(car && d.duration_days ? [["Duration", `${d.duration_days} days${campaign.starts_on ? ` from ${fmtDay(campaign.starts_on)}` : ""}`] as [string, string]] : []),
              ...(story && d.live_hours ? [["Stays live", `${d.live_hours} hours`] as [string, string]] : []),
              ["Credit now", formatMoney(funding.walletCents)],
            ]} />
          </div>
        </div>

        <div className="fs-joint">
          <div className={`fs-plane${needs.length ? " is-decision" : ""}`} aria-label="Needs you">
            <p className="fs-t-label">Needs you</p>
            {needs.length === 0 ? (
              <p className="fs-t-body" style={{ marginTop: 4 }}>{campaign.audience === "direct" && invite?.status === "sent" ? "Nothing yet. They have not answered." : isOpen ? "Nothing right now. You are told when something arrives." : "Nothing. This campaign is finished."}</p>
            ) : (
              <ul className="fs-plain-list" style={{ marginTop: 4 }}>
                {needs.map((n) => <li key={n.label}><Link href={n.href} className="fs-btn fs-btn-quiet fs-link-accent" style={{ paddingLeft: 0, minHeight: 44 }}>{n.label} <ArrowRight size={18} aria-hidden /></Link></li>)}
              </ul>
            )}
          </div>

          {invite && (
            <Section title="Who you asked">
              <div className="fs-person-line">
                <Avatar src={invite.avatar_url} name={invite.display_name ?? invite.username} size={48} />
                <span style={{ minWidth: 0 }}>
                  <span className="fs-t-task" style={{ display: "block" }}>{invite.display_name ?? invite.username} <span className="fs-t-meta">@{invite.username}</span></span>
                  <span className="fs-t-meta" style={{ display: "block" }}>
                    {invite.status === "sent" && <span className="fs-status is-waiting">Request sent</span>}
                    {invite.status === "accepted" && <span className="fs-status is-confirmed">Accepted</span>}
                    {invite.status === "declined" && <span className="fs-status is-problem">Declined</span>}
                    {invite.status === "cancelled" && <span className="fs-status is-neutral">Withdrawn</span>}
                    {invite.status === "expired" && <span className="fs-status is-neutral">Expired</span>}
                    {invite.decided_at ? ` · ${fmtDay(invite.decided_at)}` : ` · ${fmtDay(invite.created_at)}`}
                    {invite.status === "sent" && " · Nothing is agreed until they accept."}
                  </span>
                  {invite.message && <span className="fs-t-meta fs-note" style={{ display: "block", marginTop: 8 }}>Your note · {invite.message}</span>}
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <Link href={`/business/people/${invite.username}`} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>View person</Link>
                {invite.status === "sent" && <WithdrawRequest inviteId={invite.id} campaignId={campaign.id} />}
              </div>
            </Section>
          )}

          {!car && (
            <Section title={story ? "Proofs" : "Submissions"} id="submissions">
              {submissions.length === 0 ? (
                <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>{isOpen ? "Nothing submitted yet." : "Nothing was submitted."}</p>
              ) : (
                <ul className="fs-work-list">
                  {[...waiting, ...decided].map((s) => {
                    const w = SUBMISSION_WORD[s.status] ?? { label: s.status, tone: "neutral" as const };
                    const media = s.media_urls[0] ?? null;
                    const pendingReview = ["submitted", "under_review"].includes(s.status);
                    return (
                      <li key={s.id}>
                        <Link href={`/business/campaigns/${campaign.id}/submissions/${s.id}`} className="fs-work-row" aria-label={`${s.creator_name ?? s.creator_username}, ${w.label}`}>
                          <span className="fs-media fs-work-media">
                            {media ? (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(media) ? <span className="fs-video-fallback" style={{ fontSize: 12 }}>Video</span> : <Img src={media} alt="" loading="lazy" />) : null}
                          </span>
                          <span className="fs-work-info">
                            <span className="fs-work-title fs-t-task">{s.creator_name ?? s.creator_username}{s.creator_verified && <span className="fs-t-meta"> · Verified creator</span>}</span>
                            <span className={`fs-status is-${w.tone}`}>{w.label}</span>
                            <span className="fs-t-meta">{fmtDay(s.created_at)}{pendingReview ? ` · ${story ? "Check the proof" : "Review the video"}` : s.status === "paid" ? ` · ${formatMoney(campaign.pay_cents)} paid` : ""}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          {!car && people.length > 0 && (
            <Section title="Applicants" id="applicants">
              <ul className="fs-work-list">
                {people.map((a) => (
                  <li key={a.id} className="fs-applicant">
                    <div className="fs-person-line">
                      <Avatar src={a.avatar_url} name={a.display_name ?? a.username} size={48} />
                      <span style={{ minWidth: 0 }}>
                        <span className="fs-t-task" style={{ display: "block" }}>{a.display_name ?? a.username} <span className="fs-t-meta">@{a.username}{a.city ? ` · ${a.city}` : ""}</span></span>
                        <span className="fs-t-meta" style={{ display: "block" }}>
                          {[a.instagram_status === "connected" ? `Instagram connected${a.instagram_followers != null ? ` · ${a.instagram_followers.toLocaleString()} followers` : ""}` : null, a.verified ? "Verified creator" : null, a.completed_jobs > 0 ? `${a.completed_jobs} completed` : null].filter(Boolean).join(" · ") || "No provenance recorded"}
                        </span>
                        {a.message && <span className="fs-t-body" style={{ display: "block", marginTop: 4 }}>{a.message}</span>}
                        {a.sample_url && <Link href={`/business/people/${a.username}`} className="fs-link-ink fs-link-ul fs-t-meta" style={{ display: "inline-block", marginTop: 4 }}>Approved work: {a.sample_title ?? "sample"}</Link>}
                      </span>
                    </div>
                    <div className="fs-applicant-decision">
                      {a.status === "applied" ? (
                        <>
                          <span className="fs-t-meta" style={{ display: "block" }}>Accepting lets them submit. {formatMoney(campaign.pay_cents)} is paid only when you approve their work.</span>
                          <ApplicantDecision applicationId={a.id} car={false} />
                        </>
                      ) : (
                        <span className={`fs-status is-${a.status === "accepted" ? "confirmed" : a.status === "declined" ? "problem" : "neutral"}`}>{a.status === "accepted" ? "Accepted" : a.status === "declined" ? "Declined" : "Withdrawn"}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {car && (
            <>
              <Section title="Drivers who applied" id="drivers">
                {drivers.length === 0 ? (
                  <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>{isOpen ? `No drivers yet. Drivers in ${campaign.city ?? "your city"} whose car fits can apply.` : "No drivers applied."}</p>
                ) : (
                  <ul className="fs-work-list">
                    {drivers.map((a) => (
                      <li key={a.id} className="fs-applicant">
                        <div className="fs-person-line">
                          <span className="fs-media" style={{ width: 96, height: 64, background: "var(--fs-underlay)", flex: "none" }}>
                            {a.photo_url && <Img src={a.photo_url} alt="" loading="lazy" />}
                          </span>
                          <span style={{ minWidth: 0 }}>
                            <span className="fs-t-task" style={{ display: "block" }}>{a.year ? `${a.year} ${a.make} ${a.model}` : "No car attached"}{a.color ? <span className="fs-t-meta"> · {a.color}</span> : null}</span>
                            <span className="fs-t-meta" style={{ display: "block" }}>{[a.body_type, a.vehicle_city, a.zones.length ? a.zones.map((z) => ZONE_LABELS[z] ?? z).join(", ") : "No placement offered"].filter(Boolean).join(" · ")}</span>
                            <span className="fs-t-meta" style={{ display: "block" }}>@{a.username}{a.verification === "verified" ? " · Verified car" : a.verification === "pending" ? " · Verification pending" : " · Car not verified"}</span>
                          </span>
                        </div>
                        <div className="fs-applicant-decision">
                          {a.status === "applied" ? (
                            <>
                              <span className="fs-t-meta" style={{ display: "block" }}>Accepting books the car. Nothing is paid until you confirm the installation.</span>
                              <DriverDecision applicationId={a.id} />
                            </>
                          ) : <span className={`fs-status is-${a.status === "accepted" ? "confirmed" : a.status === "declined" ? "problem" : "neutral"}`}>{a.status === "accepted" ? "Accepted" : a.status === "declined" ? "Declined" : "Withdrawn"}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
              <Section title="Cars on this campaign" id="cars">
                {bookings.length === 0 ? (
                  <p className="fs-t-body" style={{ color: "var(--fs-muted)" }}>Accepted drivers appear here with their next step.</p>
                ) : (
                  <ul className="fs-work-list">
                    {bookings.map((b) => <BookingRow key={b.id} b={b} campaignId={campaign.id} proofs={proofs.filter((p) => p.booking_id === b.id).length} months={monthsPaid[b.id] ?? 0} />)}
                  </ul>
                )}
              </Section>
            </>
          )}

          <Section title="Campaign settings" id="settings">
            <details className="fs-disclosure" open={campaign.status === "draft"}>
              <summary className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>Brief, requirements and controls</summary>
              <div style={{ marginTop: 8 }}>
                <p className="fs-t-body" style={{ whiteSpace: "pre-wrap" }}>{campaign.brief}</p>
                {campaign.requirements.length > 0 && <ul className="fs-plain-list" style={{ marginTop: 8 }}>{campaign.requirements.map((r) => <li key={r} className="fs-t-meta">· {r}</li>)}</ul>}
                <div style={{ marginTop: 12 }}>
                  <Facts rows={[
                    ["Spots", String(campaign.slots)],
                    ...(campaign.reference_url ? [["Reference link", <a key="ref" href={campaign.reference_url} className="fs-link-ink fs-link-ul" target="_blank" rel="noreferrer">{campaign.reference_url}</a>] as [string, React.ReactNode]] : []),
                    ...(car && d.placements?.length ? [["Placements", d.placements.map((z) => ZONE_LABELS[z] ?? z).join(", ")] as [string, string]] : []),
                    ...(car && (d.vehicle_prefs?.colors?.length || d.vehicle_prefs?.body_types?.length) ? [["Cars preferred", [d.vehicle_prefs?.colors?.join(", "), d.vehicle_prefs?.body_types?.join(", ")].filter(Boolean).join(" · ")] as [string, string]] : []),
                    ...(story && d.min_followers ? [["Followers needed", `${d.min_followers.toLocaleString()} or more`] as [string, string]] : []),
                    ["Published", campaign.published_at ? fmtDay(campaign.published_at) ?? "" : "Not yet"],
                  ]} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16, alignItems: "center" }}>
                  {campaign.status === "draft" && <PublishDraft campaignId={campaign.id} payCents={campaign.pay_cents} walletCents={funding.walletCents} />}
                  <Link href={`/o/${campaign.id}`} className="fs-btn fs-btn-quiet fs-link-ink" style={{ paddingLeft: 0 }}>See it as people do</Link>
                  {isOpen && <CloseCampaign campaignId={campaign.id} />}
                </div>
              </div>
            </details>
          </Section>
        </div>
      </div>
    </main>
  );
}

function BookingRow({ b, campaignId, proofs, months }: { b: CarBooking; campaignId: string; proofs: number; months: number }) {
  const w = BOOKING_WORD[b.status] ?? { label: b.status, tone: "neutral" as const, next: null };
  return (
    <li>
      <Link href={`/business/campaigns/${campaignId}/cars/${b.id}`} className="fs-work-row" aria-label={`${b.year} ${b.make} ${b.model}, ${w.label}`}>
        <span className="fs-media fs-work-media" style={{ height: 56 }}>
          {b.photo_url && <Img src={b.photo_url} alt="" loading="lazy" style={{ objectFit: "cover" }} />}
        </span>
        <span className="fs-work-info">
          <span className="fs-work-title fs-t-task">{b.year} {b.make} {b.model} <span className="fs-t-meta">@{b.username}</span></span>
          <span className={`fs-status is-${w.tone}`}>{w.label}</span>
          <span className="fs-t-meta">{b.zones.map((z) => ZONE_LABELS[z] ?? z).join(", ")} · {months} month{months === 1 ? "" : "s"} paid{proofs ? ` · ${proofs} photo${proofs === 1 ? "" : "s"} from the driver` : ""}{w.next ? ` · ${w.next}` : ""}</span>
        </span>
        <span className="fs-work-money-line"><span className="fs-work-money">{formatMoney(b.monthly_cents)}</span><span className="fs-t-meta">per month</span></span>
      </Link>
    </li>
  );
}
