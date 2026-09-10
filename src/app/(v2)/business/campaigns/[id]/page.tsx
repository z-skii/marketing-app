import Link from "next/link";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/v2/BackButton";
import { requireBusinessContext, requireBusinessMember } from "@/lib/v2/core";
import { sql, sqlOne } from "@/lib/db";
import { getSubmissions, type SubmissionRow } from "@/lib/v2/campaigns";
import { fmtDate, isVideoUrl, type CampaignDetails } from "@/lib/v2/opportunities";
import { placementLabel } from "@/components/v2/EarnCards";
import { Avatar, Chip, EmptyState, Money, SectionTitle, StatusChip } from "@/components/v2/ui";
import { ReviewControls } from "@/app/(v2)/jobs/[id]/CampaignActions";
import { BookingSteps, CloseCampaignButton, DecideDriver, PublishDraftButton, StoryReviewControls, WithdrawInviteButton } from "./CampaignControls";
import { sql as sqlq } from "@/lib/db";

export const metadata = { title: "Campaign" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = { recreate_reel: "Recreate", instagram_story: "Story", car_ads: "Car ad" };

type Campaign = {
  id: string; business_id: string; kind: string; title: string; brief: string; status: string;
  reference_url: string | null; requirements: string[]; details: CampaignDetails;
  pay_cents: number; slots: number; city: string | null; deadline: string | null; starts_on: string | null;
  published_at: string | null; approved: number;
};

type DriverApp = {
  id: string; status: string; created_at: string; username: string; display_name: string | null; avatar_url: string | null;
  vehicle_id: string | null; year: number | null; make: string | null; model: string | null; color: string | null;
  body_type: string | null; vehicle_city: string | null; verification: string | null; photo_url: string | null; zones: string[];
};

type Booking = {
  id: string; status: string; monthly_cents: number; starts_on: string | null; ends_on: string | null; artwork_url: string | null;
  zones: string[]; year: number; make: string; model: string; color: string | null; username: string; display_name: string | null;
  photo_url: string | null; created_at: string;
};

type Proof = { id: string; booking_id: string; kind: string; media_url: string | null; odometer_miles: number | null; note: string | null; created_at: string };

const BOOKING_WORDS: Record<string, string> = {
  creative_pending: "Waiting on artwork",
  installation_pending: "Ready to install",
  active: "On the road",
  proof_required: "Driver owes a photo",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Under review",
};

/**
 * One campaign, managed. The header says what it is and what it pays; the
 * body is the work waiting on the business: submissions to approve, story
 * proofs to check, drivers to accept and cars to move along.
 */
export default async function CampaignManagePage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const ctx = await requireBusinessContext(`/business/campaigns/${id}`);
  const business = ctx.activeBusiness;

  const campaign = /^[0-9a-f-]{36}$/i.test(id)
    ? await sqlOne<Campaign>(
        `select c.id, c.business_id, c.kind::text as kind, c.title, c.brief, c.status::text as status,
                c.reference_url, c.requirements, c.details, c.pay_cents::int as pay_cents, c.slots, c.city,
                c.deadline, c.starts_on, c.published_at,
                (select count(*) from submissions s where s.campaign_id = c.id and s.status in ('approved', 'paid'))::int as approved
           from campaigns c where c.id = $1`,
        [id],
      )
    : null;
  if (!campaign || campaign.business_id !== business.id) redirect("/business/campaigns");
  try {
    await requireBusinessMember(ctx.user.id, campaign.business_id);
  } catch {
    redirect("/business/campaigns");
  }

  const car = campaign.kind === "car_ads";
  const story = campaign.kind === "instagram_story";
  const recreate = campaign.kind === "recreate_reel";

  const [submissions, drivers, bookings] = await Promise.all([
    car ? Promise.resolve([] as SubmissionRow[]) : getSubmissions(campaign.id),
    car
      ? sql<DriverApp>(
          `select a.id, a.status::text as status, a.created_at, p.username, p.display_name, p.avatar_url,
                  v.id as vehicle_id, v.year, v.make, v.model, v.color, v.body_type, v.city as vehicle_city,
                  v.verification::text as verification,
                  (select url from vehicle_photos ph where ph.vehicle_id = v.id
                    order by (ph.angle = 'driver_side') desc, ph.created_at limit 1) as photo_url,
                  coalesce((select array_agg(z.zone::text order by z.zone) from vehicle_zones z
                             where z.vehicle_id = v.id and z.available), '{}') as zones
             from applications a
             join profiles p on p.id = a.applicant_id
             left join vehicles v on v.id = a.vehicle_id
            where a.campaign_id = $1
            order by (a.status = 'applied') desc, a.created_at desc`,
          [campaign.id],
        )
      : Promise.resolve([] as DriverApp[]),
    car
      ? sql<Booking>(
          `select k.id, k.status::text as status, k.monthly_cents::int as monthly_cents, k.starts_on, k.ends_on,
                  k.artwork_url, k.zones::text[] as zones, k.created_at,
                  v.year, v.make, v.model, v.color, p.username, p.display_name,
                  (select url from vehicle_photos ph where ph.vehicle_id = v.id
                    order by (ph.angle = 'driver_side') desc, ph.created_at limit 1) as photo_url
             from car_bookings k
             join vehicles v on v.id = k.vehicle_id
             join profiles p on p.id = v.owner_id
            where k.campaign_id = $1
            order by k.created_at`,
          [campaign.id],
        )
      : Promise.resolve([] as Booking[]),
  ]);
  const proofs = bookings.length > 0
    ? await sql<Proof>(
        `select id, booking_id, kind::text as kind, media_url, odometer_miles, note, created_at
           from car_proofs where booking_id = any($1::uuid[]) order by created_at desc`,
        [bookings.map((b) => b.id)],
      )
    : [];

  const d = campaign.details ?? {};
  const hero = recreate ? (d.reference_media_url ?? null) : story ? (d.creative_url ?? null) : (d.artwork_url ?? null);
  const waiting = submissions.filter((s) => ["submitted", "under_review"].includes(s.status));
  const decided = submissions.filter((s) => !["submitted", "under_review"].includes(s.status));
  const applied = drivers.filter((a) => a.status === "applied");
  const pastApps = drivers.filter((a) => a.status !== "applied");
  const activeCars = bookings.filter((b) => ["active", "completed"].includes(b.status)).length;
  const isOpen = ["open", "paused"].includes(campaign.status);

  const facts = [
    car ? `${activeCars} of ${campaign.slots} car${campaign.slots === 1 ? "" : "s"}` : `${campaign.approved} of ${campaign.slots} approved`,
    campaign.deadline ? `Closes ${fmtDate(campaign.deadline)}` : car && campaign.starts_on ? `Starts ${fmtDate(campaign.starts_on)}` : null,
    campaign.city,
  ].filter(Boolean) as string[];

  const invite = (await sqlq<{ id: string; status: string; username: string; display_name: string | null; avatar_url: string | null }>(
    `select i.id, i.status, p.username, p.display_name, p.avatar_url
       from campaign_invites i join profiles p on p.id = i.profile_id
      where i.campaign_id = $1 order by i.created_at desc limit 1`,
    [campaign.id],
  ))[0] ?? null;

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-4 py-4 md:px-8 md:py-8">
      <BackButton fallback="/business/campaigns" label="Campaigns" />

      {query.created === "1" && (
        <p className="mt-3 text-sm text-ink-soft" role="status">
          {campaign.status === "open"
            ? `Published. People in ${campaign.city ?? "your city"} were notified.`
            : "Saved as a draft. Publish it when you are ready."}
        </p>
      )}

      {invite && (
        <section aria-label="Direct request" className="mt-4 flex items-center gap-3 rounded-[var(--radius-card)] bg-surface p-3">
          <Avatar src={invite.avatar_url} name={invite.display_name ?? invite.username} size={44} />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[1rem] font-800 tracking-[-0.02em]">Sent to @{invite.username}</span>
            <span className="block text-sm text-ink-soft">
              {invite.status === "sent" ? "Waiting for an answer" : invite.status === "accepted" ? "Accepted" : invite.status === "declined" ? "Declined" : invite.status === "cancelled" ? "Withdrawn" : invite.status}
            </span>
          </span>
          {invite.status === "sent" ? <WithdrawInviteButton inviteId={invite.id} campaignId={campaign.id} /> : <Link href={`/business/people/${invite.username}`} className="btn btn-sm">Profile</Link>}
        </section>
      )}

      <header className="card mt-4 overflow-hidden">
        {hero && (
          story ? (
            <div className="flex justify-center bg-surface-2 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero} alt="" className="aspect-[9/16] w-40 rounded-[var(--radius-control)] object-cover" />
            </div>
          ) : isVideoUrl(hero) ? (
            <video src={hero} controls playsInline preload="metadata" className="aspect-[16/9] w-full bg-surface-2 object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt="" className="aspect-[16/9] w-full bg-surface-2 object-cover" />
          )
        )}
        <div className="p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-700 text-ink-faint">{KIND_LABEL[campaign.kind] ?? campaign.kind.replaceAll("_", " ")}</span>
            <StatusChip status={campaign.status} />
          </div>
          <h1 className="mt-2 font-display text-[1.5rem] leading-[1.1] font-800 tracking-[-0.03em] md:text-[1.75rem]">{campaign.title}</h1>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <Money cents={campaign.pay_cents} size="lg" suffix={car ? "/ mo" : "each"} />
            <p className="tnum text-sm text-ink-faint">{facts.join("  ·  ")}</p>
          </div>
          <p className="mt-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-ink-soft">{campaign.brief}</p>
          {(campaign.requirements.length > 0 || (car && d.placements?.length)) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {car && (d.placements ?? []).map((p) => <Chip key={p}>{placementLabel(p)}</Chip>)}
              {campaign.requirements.map((r) => <Chip key={r} tone="faint">{r}</Chip>)}
            </div>
          )}
          {campaign.reference_url && (
            <a href={campaign.reference_url} target="_blank" rel="noreferrer" className="mt-3 inline-block link-row text-sm">
              Open the reference
            </a>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isOpen && <Link href={`/o/${campaign.id}`} className="btn btn-sm">See it as people do</Link>}
            {isOpen && <CloseCampaignButton campaignId={campaign.id} />}
            {campaign.status === "draft" && (
              <>
                <PublishDraftButton campaignId={campaign.id} />
                <span className="text-sm text-ink-faint">Drafts are not shown to anyone. Publishing needs campaign credit for one payment.</span>
              </>
            )}
          </div>
        </div>
      </header>

      {recreate && (
        <section className="mt-8" aria-label="Submissions">
          <SectionTitle count={submissions.length}>Submissions</SectionTitle>
          <p className="mt-1 text-sm text-ink-soft">
            Approve to pay <Money cents={campaign.pay_cents} size="sm" tone="ink" />. Money leaves your campaign credit only when you approve.
          </p>
          {submissions.length === 0 ? (
            <div className="mt-3"><EmptyState title="No submissions yet" body="People who recreate your video upload it here." /></div>
          ) : (
            <>
              {waiting.length > 0 && (
                <>
                  <p className="mt-4 font-display text-sm font-700 text-signal">Ready to review</p>
                  <ul className="row-list mt-2">{waiting.map((s) => <SubmissionCard key={s.id} s={s} kind="recreate" />)}</ul>
                </>
              )}
              {decided.length > 0 && (
                <>
                  <p className="mt-5 font-display text-sm font-700 text-ink-faint">Decided</p>
                  <ul className="row-list mt-2">{decided.map((s) => <SubmissionCard key={s.id} s={s} kind="recreate" />)}</ul>
                </>
              )}
            </>
          )}
        </section>
      )}

      {story && (
        <section className="mt-8" aria-label="Story proofs">
          <SectionTitle count={submissions.length}>Story proofs</SectionTitle>
          <p className="mt-1 text-sm text-ink-soft">
            You check it, then approve. Automatic checking comes with the Instagram connection.
          </p>
          {submissions.length === 0 ? (
            <div className="mt-3"><EmptyState title="No proofs yet" body="When someone posts the Story they send a screenshot and the link here." /></div>
          ) : (
            <>
              {waiting.length > 0 && (
                <>
                  <p className="mt-4 font-display text-sm font-700 text-signal">Ready to check</p>
                  <ul className="row-list mt-2">{waiting.map((s) => <SubmissionCard key={s.id} s={s} kind="story" />)}</ul>
                </>
              )}
              {decided.length > 0 && (
                <>
                  <p className="mt-5 font-display text-sm font-700 text-ink-faint">Decided</p>
                  <ul className="row-list mt-2">{decided.map((s) => <SubmissionCard key={s.id} s={s} kind="story" />)}</ul>
                </>
              )}
            </>
          )}
        </section>
      )}

      {car && (
        <>
          <section className="mt-8" aria-label="Drivers who applied">
            <SectionTitle count={drivers.length}>Drivers who applied</SectionTitle>
            {drivers.length === 0 ? (
              <div className="mt-3"><EmptyState title="No drivers yet" body={`Drivers in ${campaign.city ?? "your city"} whose car fits can apply from Home.`} /></div>
            ) : (
              <ul className="row-list mt-3">
                {[...applied, ...pastApps].map((a) => (
                  <li key={a.id} className={`card overflow-hidden ${a.status === "applied" ? "card-signal" : ""}`}>
                    <div className="flex gap-3 p-3 md:p-4">
                      <div className="h-20 w-28 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
                        {a.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.photo_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full items-center justify-center text-xs text-ink-faint">No photo</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">
                          {a.year ? `${a.year} ${a.make} ${a.model}` : "No vehicle attached"}
                          {a.color && <span className="text-ink-soft">, {a.color}</span>}
                        </p>
                        <p className="mt-1 text-sm text-ink-faint">
                          {[a.body_type, a.vehicle_city, a.zones.length ? a.zones.map(placementLabel).join(", ") : null].filter(Boolean).join("  ·  ")}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Avatar src={a.avatar_url} name={a.display_name ?? a.username} size={22} />
                          <span className="text-sm">@{a.username}</span>
                          {a.verification && <StatusChip status={a.verification === "verified" ? "verified" : a.verification === "pending" ? "pending" : "unverified"} />}
                          {a.status !== "applied" && <StatusChip status={a.status} />}
                        </div>
                      </div>
                    </div>
                    {a.status === "applied" && <div className="px-3 pb-3 md:px-4 md:pb-4"><DecideDriver applicationId={a.id} /></div>}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8" aria-label="Cars on this campaign">
            <SectionTitle count={bookings.length}>Cars on this campaign</SectionTitle>
            {bookings.length === 0 ? (
              <p className="card mt-3 p-4 text-sm text-ink-soft">Accepted drivers show up here with their next step.</p>
            ) : (
              <ul className="row-list mt-3">
                {bookings.map((b) => {
                  const mine = proofs.filter((p) => p.booking_id === b.id);
                  return (
                    <li key={b.id} className="card p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-[var(--radius-control)] bg-surface-2">
                          {b.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={b.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-[1.0625rem] leading-tight font-800 tracking-[-0.02em]">{b.year} {b.make} {b.model}</p>
                          <p className="mt-1 text-sm text-ink-faint">@{b.username}{"  ·  "}{b.zones.map(placementLabel).join(", ")}</p>
                          <p className="mt-1.5 font-display text-sm font-700">{BOOKING_WORDS[b.status] ?? b.status.replaceAll("_", " ")}
                            {b.starts_on && b.status === "active" && <span className="font-600 text-ink-faint">{"  ·  "}since {fmtDate(b.starts_on)}</span>}
                          </p>
                        </div>
                        <Money cents={b.monthly_cents} size="sm" suffix="/ mo" />
                      </div>
                      {b.artwork_url && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-ink-faint">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={b.artwork_url} alt="Artwork" className="h-8 w-16 rounded-[5px] object-cover" />
                          Artwork sent
                        </div>
                      )}
                      <BookingSteps bookingId={b.id} status={b.status} campaignArtworkUrl={d.artwork_url ?? null} />
                      {mine.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-ink-soft">Proofs from the driver</p>
                          <ul className="mt-2 flex flex-wrap gap-2">
                            {mine.map((p) => (
                              <li key={p.id} className="card-2 flex items-center gap-2 p-1.5 pr-3 text-xs text-ink-soft">
                                {p.media_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.media_url} alt="" className="h-10 w-14 rounded-[5px] object-cover" />
                                ) : null}
                                <span>
                                  {p.kind === "odometer" ? `${p.odometer_miles?.toLocaleString() ?? "?"} miles` : p.kind === "installation" ? "Installed" : "Photo"}
                                  <span className="block text-ink-faint">{fmtDate(p.created_at)}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function SubmissionCard({ s, kind }: { s: SubmissionRow; kind: "recreate" | "story" }) {
  const pending = ["submitted", "under_review"].includes(s.status);
  const posted = s.meta?.posted_at ? new Date(s.meta.posted_at) : null;
  return (
    <li className={`card overflow-hidden ${pending ? "card-signal" : ""}`}>
      {s.media_urls.length > 0 && (
        kind === "story" ? (
          <div className="flex gap-2 overflow-x-auto bg-surface-2 p-3">
            {s.media_urls.slice(0, 4).map((u, i) => (
              <a key={i} href={u} target="_blank" rel="noreferrer" className="shrink-0" aria-label={`Open screenshot ${i + 1}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-64 w-36 rounded-[var(--radius-control)] object-cover object-top" loading="lazy" />
              </a>
            ))}
          </div>
        ) : (
          <div className={`grid gap-0.5 bg-surface-2 ${s.media_urls.length > 1 ? "grid-cols-2" : ""}`}>
            {s.media_urls.slice(0, 4).map((u, i) => (
              isVideoUrl(u) ? (
                <video key={i} src={u} controls playsInline preload="metadata" className="aspect-[4/3] max-h-[28rem] w-full bg-surface-2 object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={u} alt="" className="aspect-[4/3] max-h-[28rem] w-full bg-surface-2 object-cover" loading="lazy" />
              )
            ))}
          </div>
        )
      )}
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <Avatar src={s.creator_avatar} name={s.creator_name ?? s.creator_username} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[0.9375rem] font-700">
              {s.creator_name ?? `@${s.creator_username}`}
              {s.creator_verified && <span className="ml-1 text-signal" aria-label="Verified">✓</span>}
            </p>
            <p className="text-xs text-ink-faint">@{s.creator_username}{"  ·  "}{fmtDate(s.created_at)}</p>
          </div>
          <StatusChip status={s.status} />
        </div>
        {kind === "story" && (
          <p className="mt-3 text-sm">
            {s.meta?.story_url ? (
              <a href={s.meta.story_url} target="_blank" rel="noreferrer" className="font-display font-600 text-signal">Open the story</a>
            ) : (
              <span className="text-ink-faint">No story link</span>
            )}
            {posted && !isNaN(posted.getTime()) && (
              <span className="text-ink-faint">{"  ·  "}Posted {posted.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
            )}
          </p>
        )}
        {kind === "recreate" && s.note && <p className="mt-3 text-sm whitespace-pre-wrap text-ink-soft">{s.note}</p>}
        {s.review_note && <p className="mt-2 text-sm text-ink-faint">Your note: {s.review_note}</p>}
        {pending && (kind === "story" ? <StoryReviewControls submissionId={s.id} /> : <ReviewControls submissionId={s.id} />)}
      </div>
    </li>
  );
}
