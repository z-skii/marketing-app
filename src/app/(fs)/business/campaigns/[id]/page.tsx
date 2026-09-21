import Link from "next/link";
import { Img } from "@/components/fs/Img";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle, UsersThree, Car as CarIcon, Eye, Play, InstagramLogo, PaperPlaneTilt } from "@phosphor-icons/react/dist/ssr";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { getSubmissions } from "@/lib/v2/campaigns";
import { ZONE_LABELS } from "@/app/(v2)/cars/zones";
import { getBusinessCampaign, getDriverApplications, getCarBookings, getCarProofs, getBookingMonthsPaid, getLatestInvite, getPersonApplications, type CarBooking } from "@/lib/fs/business-campaigns";
import { loadFunding } from "@/lib/fs/funding";
import { Avatar, formatMoney } from "@/components/fs/parts";
import { BackLink } from "@/components/fs/work/BackLink";
import { Accordion, Checks, DSection } from "@/components/fs/work/DetailKit";
import { KIND_WORD, STATUS_WORD, BOOKING_WORD, CampaignThumb, fmtDay } from "@/components/fs/business/campaign/parts";
import { CampaignSource } from "@/components/fs/business/campaign/CampaignSource";
import { SubmissionCard } from "@/components/fs/business/campaign/SubmissionCard";
import { PublishDraft, CloseCampaign, WithdrawRequest, ApplicantDecision, DriverDecision } from "@/components/fs/business/campaign/Controls";

export const dynamic = "force-dynamic";

/**
 * One campaign, managed. The visual, the name, the kind and the status
 * on top; the numbers that matter (spent, submissions, approved, left)
 * and the progress; what needs you; then the submissions as media cards
 * with the decision on each. Everything that does not change a decision
 * sits lower behind accordions.
 */
const TONE: Record<string, string> = { confirmed: "success", waiting: "warning", problem: "alert", neutral: "" };

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
  const carsOnRoad = bookings.filter((b) => ["active", "completed"].includes(b.status)).length;
  const approved = car ? carsOnRoad : campaign.approved;
  const remaining = Math.max(campaign.slots - approved, 0);
  const creators = car ? new Set([...drivers.map((a) => a.applicant_id), ...bookings.map((b) => b.vehicle_id)]).size : new Set([...submissions.map((s) => s.creator_id), ...people.filter((a) => a.status === "accepted").map((a) => a.applicant_id)]).size;
  const covered = funding.walletCents >= campaign.pay_cents;
  const canApprove = covered && remaining > 0 && isOpen;
  const media = car ? null : (story ? d.creative_url : d.reference_media_url) ?? null;
  const vehiclePhoto = car ? bookings.find((b) => b.photo_url)?.photo_url ?? null : null;
  const KindIcon = car ? CarIcon : story ? InstagramLogo : Play;

  const needs: { label: string; href: string; icon: React.ReactNode }[] = [];
  if (campaign.status === "draft") needs.push({ label: "Publish this draft", href: "#controls", icon: <PaperPlaneTilt size={20} aria-hidden /> });
  if (waiting.length) needs.push({ label: story ? `Check ${waiting.length} proof${waiting.length === 1 ? "" : "s"}` : `Review ${waiting.length} video${waiting.length === 1 ? "" : "s"}`, href: "#submissions", icon: <CheckCircle size={20} aria-hidden /> });
  if (applied.length) needs.push({ label: `${applied.length} applicant${applied.length === 1 ? "" : "s"} to answer`, href: "#applicants", icon: <UsersThree size={20} aria-hidden /> });
  if (driversApplied.length) needs.push({ label: `${driversApplied.length} driver${driversApplied.length === 1 ? "" : "s"} to answer`, href: "#drivers", icon: <CarIcon size={20} aria-hidden /> });
  for (const b of carsWaiting) needs.push({ label: `${b.year} ${b.make} ${b.model}: ${BOOKING_WORD[b.status].next}`, href: `/business/campaigns/${campaign.id}/cars/${b.id}`, icon: <CarIcon size={20} aria-hidden /> });

  const pctSubmitted = campaign.slots > 0 ? Math.min(100, (waiting.length / campaign.slots) * 100) : 0;
  const pctApproved = campaign.slots > 0 ? Math.min(100, ((approved - (car ? 0 : campaign.paid_count)) / campaign.slots) * 100) : 0;
  const pctPaid = campaign.slots > 0 ? Math.min(100, ((car ? carsOnRoad : campaign.paid_count) / campaign.slots) * 100) : 0;

  return (
    <main className="fs-phone-main" id="main">
      <div className="fs-detail-top">
        <BackLink fallback="/business/campaigns" label="Campaigns" />
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className={`badge${TONE[status.tone] ? ` is-${TONE[status.tone]}` : ""}`}>{status.label}</span>
          <Link href={`/o/${campaign.id}`} className="iconbtn tip-left" aria-label="See it as people do" data-tip="See it as people do"><Eye size={20} aria-hidden /></Link>
        </span>
      </div>
      {query.created === "1" && <p className="ap-note" style={{ marginTop: 12 }}><span className="ap-note-text">{campaign.status === "open" ? `Published in ${campaign.city ?? "your city"}.` : "Saved as a draft."}</span></p>}

      <div className="dt-page is-wide">
        <div className="dt-main-top">
          <div className="dt-head">
            <span className={`dt-head-thumb${car ? " is-car" : ""}`}>
              {car
                ? (vehiclePhoto ? <Img src={vehiclePhoto} alt="" loading="eager" /> : <CampaignThumb kind="car_ads" media={null} vehicle={null} placements={d.placements ?? []} />)
                : media ? (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(media) ? <video src={media} muted playsInline preload="metadata" aria-hidden /> : <Img src={media} alt="" loading="eager" />) : <span className="fs-video-fallback" style={{ fontSize: 11 }}>No media</span>}
            </span>
            <div style={{ minWidth: 0 }}>
              <h1>{campaign.title}</h1>
              <p className="t-meta" style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span className="badge"><KindIcon size={14} weight={car || story ? "regular" : "fill"} aria-hidden />{KIND_WORD[campaign.kind] ?? campaign.kind}</span>
                <span>{campaign.audience === "direct" ? "Direct request" : "Public"}{campaign.city ? ` · ${campaign.city}` : ""}</span>
              </p>
            </div>
          </div>
        </div>

        <aside className="dt-rail">
          <div className="dt-numbers" style={{ marginTop: 0 }} aria-label="Numbers">
            <div className="dt-number"><b>{formatMoney(paidCents).replace(/\.00$/, "")}</b><span>Spent</span></div>
            <div className="dt-number"><b>{car ? drivers.length : submissions.length}</b><span>{car ? "Drivers" : story ? "Proofs" : "Submissions"}</span></div>
            <div className="dt-number"><b>{approved}<span style={{ display: "inline", fontSize: 14, color: "var(--tm-muted)", fontWeight: 500 }}> of {campaign.slots}</span></b><span>{car ? "On the road" : "Approved"}</span></div>
            <div className="dt-number"><b>{remaining}</b><span>Remaining</span></div>
          </div>
          <div className="dt-progress" aria-label="Progress">
            <div className="dt-progress-bar" role="img" aria-label={`${approved} of ${campaign.slots} spots ${car ? "on the road" : "approved"}, ${waiting.length} waiting`}>
              <i className="is-paid" style={{ width: `${pctPaid}%` }} /><i className="is-approved" style={{ width: `${pctApproved}%` }} /><i className="is-submitted" style={{ width: `${pctSubmitted}%` }} />
            </div>
            <div className="dt-progress-legend">
              <span><b>{creators}</b> {creators === 1 ? (car ? "driver" : "creator") : (car ? "drivers" : "creators")}</span>
              <span><i style={{ background: "var(--tm-warning)" }} /><b>{car ? driversApplied.length : waiting.length}</b> {car ? "applied" : "submitted"}</span>
              <span><i style={{ background: "#8FD3A8" }} /><b>{approved}</b> {car ? "on the road" : "approved"}</span>
              <span><i style={{ background: "var(--tm-success)" }} /><b>{formatMoney(paidCents).replace(/\.00$/, "")}</b> paid</span>
            </div>
          </div>
          {needs.length > 0 && (
            <div className="dt-needs" aria-label="Needs you">
              {needs.map((n) => <Link key={n.label} href={n.href} className="dt-need"><span className="dt-need-icon">{n.icon}</span><b>{n.label}</b><span className="btn btn-sm">Go <ArrowRight size={16} aria-hidden /></span></Link>)}
            </div>
          )}
          {needs.length === 0 && <p className="t-meta" style={{ marginTop: 12 }}>{campaign.audience === "direct" && invite?.status === "sent" ? "Waiting for their answer." : isOpen ? "Nothing needs you right now." : "This campaign is finished."}</p>}
          {!covered && isOpen && !car && <p className="t-meta" style={{ marginTop: 8 }}>Credit {formatMoney(funding.walletCents)} does not cover one {formatMoney(campaign.pay_cents)} payment. <Link href="/business/billing" className="link-accent">Add credit</Link></p>}
        </aside>

        <div className="dt-main-rest">
          {invite && (
            <DSection title="Who you asked">
              <div className="dt-person" style={{ alignItems: "flex-start" }}>
                <Avatar src={invite.avatar_url} name={invite.display_name ?? invite.username} size={48} />
                <span style={{ minWidth: 0 }}>
                  <b>{invite.display_name ?? invite.username} <span className="t-meta" style={{ fontWeight: 400 }}>@{invite.username}</span></b>
                  <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
                    <span className={`badge${invite.status === "sent" ? " is-warning" : invite.status === "accepted" ? " is-success" : invite.status === "declined" ? " is-alert" : ""}`}>{invite.status === "sent" ? "Request sent" : invite.status === "accepted" ? "Accepted" : invite.status === "declined" ? "Declined" : invite.status === "cancelled" ? "Withdrawn" : "Expired"}</span>
                    <span>{fmtDay(invite.decided_at ?? invite.created_at)}</span>
                  </span>
                  {invite.message && <span className="t-meta" style={{ display: "block", marginTop: 6 }}>Your note: {invite.message}</span>}
                  <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                    <Link href={`/business/people/${invite.username}`} className="btn btn-sm">View profile</Link>
                    {invite.status === "sent" && <WithdrawRequest inviteId={invite.id} campaignId={campaign.id} />}
                  </span>
                </span>
              </div>
            </DSection>
          )}

          {!car && (
            <DSection title={story ? "Proofs" : "Submissions"} id="submissions" meta={submissions.length > 0 ? `${waiting.length} waiting` : undefined}>
              {submissions.length === 0 ? (
                <div className="pf-empty"><CheckCircle size={28} aria-hidden /><b>{isOpen ? "Nothing submitted yet." : "Nothing was submitted."}</b><span>{isOpen ? "Work lands here as creators send it." : ""}</span></div>
              ) : (
                <ul className="dt-subs">
                  {[...waiting, ...decided].map((s) => <SubmissionCard key={s.id} s={s} campaignId={campaign.id} payCents={campaign.pay_cents} canApprove={canApprove} story={story} />)}
                </ul>
              )}
            </DSection>
          )}

          {!car && people.length > 0 && (
            <DSection title="Applicants" id="applicants" meta={applied.length > 0 ? `${applied.length} to answer` : undefined}>
              <ul className="pf-rows">
                {people.map((a) => (
                  <li key={a.id}>
                    <div className="pf-row" style={{ gridTemplateColumns: "40px minmax(0, 1fr)", alignItems: "flex-start" }}>
                      <Avatar src={a.avatar_url} name={a.display_name ?? a.username} size={40} />
                      <div style={{ minWidth: 0 }}>
                        <b>{a.display_name ?? a.username} <span className="t-meta" style={{ fontWeight: 400 }}>@{a.username}</span></b>
                        <span className="pf-row-sub">{[a.city, a.verified ? "Verified" : null, a.instagram_status === "connected" ? `Instagram${a.instagram_followers != null ? ` · ${a.instagram_followers.toLocaleString()}` : ""}` : null, a.completed_jobs > 0 ? `${a.completed_jobs} completed` : null].filter(Boolean).join(" · ") || "No record yet"}</span>
                        {a.message && <span className="t-body" style={{ display: "block", marginTop: 4 }}>{a.message}</span>}
                        <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                          <Link href={`/business/people/${a.username}`} className="btn btn-sm">View profile</Link>
                          {a.status === "applied" ? <ApplicantDecision applicationId={a.id} car={false} /> : <span className={`badge${a.status === "accepted" ? " is-success" : a.status === "declined" ? " is-alert" : ""}`}>{a.status === "accepted" ? "Accepted" : a.status === "declined" ? "Declined" : "Withdrawn"}</span>}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </DSection>
          )}

          {car && (
            <>
              <DSection title="Drivers" id="drivers" meta={driversApplied.length > 0 ? `${driversApplied.length} to answer` : undefined}>
                {drivers.length === 0 ? (
                  <div className="pf-empty"><CarIcon size={28} aria-hidden /><b>{isOpen ? "No drivers yet." : "No drivers applied."}</b><span>{isOpen ? "Drivers whose car fits can apply." : ""}</span></div>
                ) : (
                  <ul className="pf-rows">
                    {drivers.map((a) => (
                      <li key={a.id}>
                        <div className="pf-row" style={{ gridTemplateColumns: "88px minmax(0, 1fr)", alignItems: "flex-start" }}>
                          <span style={{ width: 88, aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--tm-surface2)" }}>{a.photo_url && <Img src={a.photo_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</span>
                          <div style={{ minWidth: 0 }}>
                            <b>{a.year ? `${a.year} ${a.make} ${a.model}` : "No car attached"}{a.color ? <span className="t-meta" style={{ fontWeight: 400 }}> · {a.color}</span> : null}</b>
                            <span className="pf-row-sub">@{a.username} · {[a.body_type, a.vehicle_city, a.zones.length ? a.zones.map((z) => ZONE_LABELS[z] ?? z).join(", ") : "No placement offered"].filter(Boolean).join(" · ")}</span>
                            <span className="pf-row-sub">{a.verification === "verified" ? "Verified car" : a.verification === "pending" ? "Verification pending" : "Car not verified"}</span>
                            <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 4 }}>
                              {a.status === "applied" ? <DriverDecision applicationId={a.id} /> : <span className={`badge${a.status === "accepted" ? " is-success" : a.status === "declined" ? " is-alert" : ""}`}>{a.status === "accepted" ? "Accepted" : a.status === "declined" ? "Declined" : "Withdrawn"}</span>}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </DSection>
              <DSection title="Cars on this campaign" id="cars">
                {bookings.length === 0 ? <p className="t-meta">No accepted drivers yet.</p> : (
                  <ul className="pf-rows">
                    {bookings.map((b) => <BookingRow key={b.id} b={b} campaignId={campaign.id} proofs={proofs.filter((p) => p.booking_id === b.id).length} months={monthsPaid[b.id] ?? 0} />)}
                  </ul>
                )}
              </DSection>
            </>
          )}

          <div className="dt-section" id="info">
            <Accordion title="Requirements" meta={campaign.requirements.length ? `${campaign.requirements.length}` : undefined}>
              {campaign.brief && <p className="t-body" style={{ color: "var(--tm-text2)", whiteSpace: "pre-wrap" }}>{campaign.brief}</p>}
              {campaign.requirements.length > 0 && <div style={{ marginTop: 8 }}><Checks items={campaign.requirements} /></div>}
              {d.guide?.checklist?.length ? <div style={{ marginTop: 8 }}><p className="t-meta" style={{ fontWeight: 600, color: "var(--tm-text)" }}>What creators are checked on</p><Checks items={d.guide.checklist} /></div> : null}
            </Accordion>
            <Accordion title="Creative"><CampaignSource campaign={campaign} /></Accordion>
            <Accordion title="Targeting">
              <dl className="dt-kv" style={{ marginTop: 0 }}>
                <dt>Audience</dt><dd>{campaign.audience === "direct" ? "One person, by request" : "Public"}</dd>
                <dt>City</dt><dd>{campaign.city ?? "Anywhere"}</dd>
                {story && <><dt>Followers</dt><dd>{d.min_followers ? `${d.min_followers.toLocaleString()} or more` : "Any"}</dd></>}
                {car && d.placements?.length ? <><dt>Placement</dt><dd>{d.placements.map((z) => ZONE_LABELS[z] ?? z).join(", ")}</dd></> : null}
                {car && (d.vehicle_prefs?.colors?.length || d.vehicle_prefs?.body_types?.length) ? <><dt>Cars</dt><dd>{[d.vehicle_prefs?.colors?.join(", "), d.vehicle_prefs?.body_types?.join(", ")].filter(Boolean).join(" · ")}</dd></> : null}
              </dl>
            </Accordion>
            <Accordion title="Schedule">
              <dl className="dt-kv" style={{ marginTop: 0 }}>
                <dt>Published</dt><dd>{campaign.published_at ? fmtDay(campaign.published_at) : "Not yet"}</dd>
                {campaign.deadline && <><dt>Last day</dt><dd>{fmtDay(campaign.deadline)}</dd></>}
                {car && d.duration_days ? <><dt>Duration</dt><dd>{d.duration_days} days{campaign.starts_on ? ` from ${fmtDay(campaign.starts_on)}` : ""}</dd></> : null}
                {story && d.live_hours ? <><dt>Stays live</dt><dd>{d.live_hours} hours</dd></> : null}
              </dl>
            </Accordion>
            <Accordion title="Budget">
              <dl className="dt-kv" style={{ marginTop: 0 }}>
                <dt>Pay</dt><dd>{formatMoney(campaign.pay_cents)} {car ? "per car a month" : story ? "per approved Story" : "per approved video"}</dd>
                <dt>Spots</dt><dd>{campaign.slots}</dd>
                <dt>If all approved</dt><dd>{formatMoney(campaign.pay_cents * campaign.slots)}{car ? " a month" : ""}</dd>
                <dt>Paid so far</dt><dd>{formatMoney(paidCents)}</dd>
                <dt>Credit now</dt><dd>{formatMoney(funding.walletCents)} <Link href="/business/billing" className="link-accent">Add credit</Link></dd>
              </dl>
            </Accordion>
            <div id="controls" style={{ scrollMarginTop: 88 }}>
              <Accordion title="Controls" open={campaign.status === "draft"}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {campaign.status === "draft" && <PublishDraft campaignId={campaign.id} payCents={campaign.pay_cents} walletCents={funding.walletCents} />}
                  <Link href={`/o/${campaign.id}`} className="btn btn-sm"><Eye size={16} aria-hidden /> See it as people do</Link>
                  {campaign.reference_url && <a href={campaign.reference_url} className="btn btn-sm" target="_blank" rel="noreferrer">Reference link</a>}
                  {isOpen && <CloseCampaign campaignId={campaign.id} />}
                </div>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function BookingRow({ b, campaignId, proofs, months }: { b: CarBooking; campaignId: string; proofs: number; months: number }) {
  const w = BOOKING_WORD[b.status] ?? { label: b.status, tone: "neutral" as const, next: null };
  return (
    <li>
      <Link href={`/business/campaigns/${campaignId}/cars/${b.id}`} className="pf-row" style={{ gridTemplateColumns: "88px minmax(0, 1fr) auto" }} aria-label={`${b.year} ${b.make} ${b.model}, ${w.label}`}>
        <span style={{ width: 88, aspectRatio: "4 / 3", borderRadius: 12, overflow: "hidden", background: "var(--tm-surface2)" }}>{b.photo_url && <Img src={b.photo_url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</span>
        <span style={{ minWidth: 0 }}>
          <b>{b.year} {b.make} {b.model} <span className="t-meta" style={{ fontWeight: 400 }}>@{b.username}</span></b>
          <span className="pf-row-sub"><span className={`badge${TONE[w.tone] ? ` is-${TONE[w.tone]}` : ""}`} style={{ marginRight: 6 }}>{w.label}</span>{b.zones.map((z) => ZONE_LABELS[z] ?? z).join(", ")} · {months} month{months === 1 ? "" : "s"} paid{proofs ? ` · ${proofs} photo${proofs === 1 ? "" : "s"}` : ""}{w.next ? ` · ${w.next}` : ""}</span>
        </span>
        <span className="pf-row-amt">{formatMoney(b.monthly_cents).replace(/\.00$/, "")}<span className="t-meta" style={{ display: "block", fontWeight: 400, textAlign: "right" }}>a month</span></span>
      </Link>
    </li>
  );
}
